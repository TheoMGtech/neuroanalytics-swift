import io
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile

from app.api.deps import get_current_user_email
from app.core.config import settings
from app.db.database import db
from app.ml.inference import (
    get_category_predictions,
    get_sentiment_predictions,
    has_model_errors,
)
from app.services.data_cleaning import clean_data
from app.services.file_validation import (
    validate_flag_values,
    validate_headers,
    validate_note_values,
)
from app.services.nps_service import calculate_nps_with_ai
from app.services.outlier_service import detect_outliers

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    save_analysis: Optional[bool] = Form(None),
    save_analysis_query: Optional[bool] = Query(None, alias="save_analysis"),
    email: str = Depends(get_current_user_email),
):
    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    filename = file.filename or ""
    filename_lower = filename.lower()
    content = await file.read()

    try:
        if filename_lower.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename_lower.endswith((".xls", ".xlsx")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Formato de arquivo não suportado")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Erro ao ler arquivo: {exc}") from exc

    df.columns = [str(c).lower().strip() for c in df.columns]
    df = df.rename(
        columns={
            "centronv2": "loja",
            "flag": "bandeira",
            "classificacao": "nota",
        }
    )

    if not validate_headers(df):
        raise HTTPException(
            status_code=400,
            detail="Colunas obrigatórias não encontradas no arquivo (loja, bandeira, nota)",
        )

    valid_notes, note_error = validate_note_values(df)
    if not valid_notes:
        raise HTTPException(status_code=400, detail=note_error)

    valid_flags, flag_error = validate_flag_values(df)
    if not valid_flags:
        raise HTTPException(status_code=400, detail=flag_error)

    df = clean_data(df)
    if df.empty:
        raise HTTPException(status_code=400, detail="Arquivo vazio após a limpeza de dados.")

    model_texts = (
        df["texto_limpo"].tolist() if "texto_limpo" in df.columns else df["comentario"].tolist()
    )
    sentiments = get_sentiment_predictions(model_texts)
    categories = get_category_predictions(model_texts)

    df["sentiment"] = [s["sentiment"] for s in sentiments]
    df["sentiment_confidence"] = [float(s.get("confidence", 0)) for s in sentiments]
    df["category"] = [c["category"] for c in categories]
    df["category_confidence"] = [float(c.get("confidence", 0)) for c in categories]
    df["confidence"] = df[["sentiment_confidence", "category_confidence"]].min(axis=1)
    df["low_confidence"] = df["confidence"] < settings.LOW_CONFIDENCE_THRESHOLD

    nps_data = calculate_nps_with_ai(df)
    if not nps_data:
        raise HTTPException(status_code=400, detail="Arquivo vazio após a limpeza de dados.")

    general = nps_data["general"]
    store_results = detect_outliers(nps_data["store_results"])
    management_summary = nps_data["management_summary"]
    avg_confidence = float(df["confidence"].mean()) if not df.empty else 0.0

    should_save = save_analysis if save_analysis is not None else bool(save_analysis_query)

    analysis_id = None
    if should_save:
        analysis = await db.analysis.create(
            data={
                "fileName": filename,
                "totalReviews": general["total_reviews"],
                "generalNps": general["nps_score"],
                "promoters": general["promoters"],
                "neutral": general["neutral"],
                "detractors": general["detractors"],
                "originalNps": general["original_nps"],
                "originalPromoters": general["original_promoters"],
                "originalNeutral": general["original_neutral"],
                "originalDetractors": general["original_detractors"],
                "reclassifiedCount": general["reclassified_count"],
                "confidenceAvg": avg_confidence,
                "saved": True,
                "userId": user.id,
            }
        )
        analysis_id = analysis.id

        await db.storeresult.create_many(
            data=[
                {
                    "analysisId": analysis_id,
                    "storeName": s["store_name"],
                    "flag": s["flag"],
                    "totalReviews": s["total_reviews"],
                    "nps": s["nps"],
                    "promoters": s["promoters"],
                    "neutral": s["neutral"],
                    "detractors": s["detractors"],
                    "originalNps": s["original_nps"],
                    "originalPromoters": s["original_promoters"],
                    "originalNeutral": s["original_neutral"],
                    "originalDetractors": s["original_detractors"],
                    "isOutlier": s["is_outlier"],
                }
                for s in store_results
            ]
        )

        await db.managementsummary.create_many(
            data=[
                {
                    "analysisId": analysis_id,
                    "flag": m["flag"],
                    "totalReviews": m["total_reviews"],
                    "nps": m["nps"],
                    "promoters": m["promoters"],
                    "neutral": m["neutral"],
                    "detractors": m["detractors"],
                    "originalNps": m["original_nps"],
                    "originalPromoters": m["original_promoters"],
                    "originalNeutral": m["original_neutral"],
                    "originalDetractors": m["original_detractors"],
                }
                for m in management_summary
            ]
        )

        all_comments = df.to_dict("records")
        chunk_size = 5000
        for i in range(0, len(all_comments), chunk_size):
            chunk = all_comments[i : i + chunk_size]
            await db.commentresult.create_many(
                data=[
                    {
                        "analysisId": analysis_id,
                        "storeName": str(c["loja"]),
                        "commentText": str(c["comentario"]),
                        "sentiment": str(c["sentiment"]),
                        "category": str(c["category"]),
                        "confidence": float(c["confidence"]),
                        "originalClassification": str(c.get("nps_class_original", "")),
                        "aiClassification": str(c.get("nps_class_ai", "")),
                        "reclassificationRule": (
                            str(c["reclassification_rule"])
                            if c.get("reclassification_rule")
                            else None
                        ),
                    }
                    for c in chunk
                ]
            )

    return {
        "analysis_id": analysis_id,
        "inference_error": has_model_errors(),
        "summary": general,
        "store_results": store_results,
        "management_summary": management_summary,
        "comments_sample": df.head(50).to_dict("records"),
    }
