from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from typing import Optional
import pandas as pd
import io

from app.api.deps import get_current_user_email
from app.db.database import db
from app.services.file_validation import validate_headers
from app.services.data_cleaning import clean_data
from app.services.nps_service import calculate_nps
from app.services.outlier_service import detect_outliers
from app.ml.inference import get_sentiment_predictions, get_category_predictions

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    save_analysis: Optional[bool] = Form(False),
    email: str = Depends(get_current_user_email)
):
    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    try:
        content = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Formato de arquivo não suportado")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler arquivo: {str(e)}")

    if not validate_headers(df):
        raise HTTPException(status_code=400, detail="Colunas obrigatórias não encontradas no arquivo (loja, bandeira, nota)")

    df = clean_data(df)
    nps_data = calculate_nps(df)
    
    if not nps_data:
        raise HTTPException(status_code=400, detail="Arquivo vazio após a limpeza de dados.")

    general = nps_data["general"]
    store_results = nps_data["store_results"]
    management_summary = nps_data["management_summary"]

    store_results = detect_outliers(store_results)

    # ML Inference Mocking
    comments = df['comentario'].tolist()
    sentiments = get_sentiment_predictions(comments)
    categories = get_category_predictions(comments)
    
    df['sentiment'] = [s['sentiment'] for s in sentiments]
    df['category'] = [c['category'] for c in categories]
    df['confidence'] = [c['confidence'] for c in categories] # Simple mock confidence
    
    # Optional Database Save
    analysis_id = None
    if save_analysis:
        analysis = await db.analysis.create(
            data={
                "fileName": file.filename,
                "totalReviews": general["total_reviews"],
                "generalNps": general["nps_score"],
                "promoters": general["promoters"],
                "neutral": general["neutral"],
                "detractors": general["detractors"],
                "saved": True,
                "userId": user.id,
            }
        )
        analysis_id = analysis.id
        
        # Save store results
        await db.store_result.create_many(
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
                    "isOutlier": s["is_outlier"],
                } for s in store_results
            ]
        )
        
        # Save management summary
        await db.management_summary.create_many(
            data=[
                {
                    "analysisId": analysis_id,
                    "flag": m["flag"],
                    "totalReviews": m["total_reviews"],
                    "nps": m["nps"],
                    "promoters": m["promoters"],
                    "neutral": m["neutral"],
                    "detractors": m["detractors"],
                } for m in management_summary
            ]
        )
        
        # Save comments (taking top 100 max to avoid huge payload/DB locks in PoC)
        comments_to_save = df.head(100).to_dict('records')
        await db.comment_result.create_many(
            data=[
                {
                    "analysisId": analysis_id,
                    "storeName": str(c['loja']),
                    "commentText": str(c['comentario']),
                    "sentiment": str(c['sentiment']),
                    "category": str(c['category']),
                    "confidence": float(c['confidence']),
                } for c in comments_to_save
            ]
        )

    return {
        "analysis_id": analysis_id,
        "summary": general,
        "store_results": store_results,
        "management_summary": management_summary,
        "comments_sample": df.head(50).to_dict('records')
    }
