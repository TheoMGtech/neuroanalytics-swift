from __future__ import annotations

import io
from datetime import datetime
from typing import Any, Optional
from uuid import uuid4

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

UPLOAD_JOBS: dict[str, dict[str, Any]] = {}
UPLOAD_JOB_KEYS: dict[str, str] = {}


def _test_features_enabled() -> bool:
    return settings.ENVIRONMENT == "test" or settings.ENABLE_TEST_FEATURES


def _ensure_test_features():
    if not _test_features_enabled():
        raise HTTPException(status_code=404, detail="Recurso disponivel apenas no ambiente de teste")


async def _get_user(email: str):
    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    return user


def _read_dataframe(filename: str, content: bytes) -> pd.DataFrame:
    filename_lower = filename.lower()
    try:
        if filename_lower.endswith(".csv"):
            return pd.read_csv(io.BytesIO(content))
        if filename_lower.endswith((".xls", ".xlsx")):
            return pd.read_excel(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Erro ao ler arquivo: {exc}") from exc
    raise HTTPException(status_code=400, detail="Formato de arquivo nao suportado")


def _prepare_dataframe(filename: str, content: bytes) -> pd.DataFrame:
    df = _read_dataframe(filename, content)
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
            detail="Colunas obrigatorias nao encontradas no arquivo (loja, bandeira, nota)",
        )

    valid_notes, note_error = validate_note_values(df)
    if not valid_notes:
        raise HTTPException(status_code=400, detail=note_error)

    valid_flags, flag_error = validate_flag_values(df)
    if not valid_flags:
        raise HTTPException(status_code=400, detail=flag_error)

    df = clean_data(df)
    if df.empty:
        raise HTTPException(status_code=400, detail="Arquivo vazio apos a limpeza de dados.")
    return df


async def _persist_analysis(
    *,
    filename: str,
    user_id: int,
    general: dict[str, Any],
    store_results: list[dict[str, Any]],
    management_summary: list[dict[str, Any]],
    df: pd.DataFrame,
    avg_confidence: float,
) -> int:
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
            "userId": user_id,
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

    return analysis_id


async def _process_upload_content(
    *,
    filename: str,
    content: bytes,
    user_id: int,
    should_save: bool,
    progress_callback=None,
) -> dict[str, Any]:
    if progress_callback:
        progress_callback("validating", 15)
    df = _prepare_dataframe(filename, content)

    if progress_callback:
        progress_callback("modeling", 35)
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

    if progress_callback:
        progress_callback("scoring", 65)
    nps_data = calculate_nps_with_ai(df)
    if not nps_data:
        raise HTTPException(status_code=400, detail="Arquivo vazio apos a limpeza de dados.")

    general = nps_data["general"]
    store_results = detect_outliers(nps_data["store_results"])
    management_summary = nps_data["management_summary"]
    avg_confidence = float(df["confidence"].mean()) if not df.empty else 0.0

    analysis_id = None
    if should_save:
        if progress_callback:
            progress_callback("saving", 85)
        analysis_id = await _persist_analysis(
            filename=filename,
            user_id=user_id,
            general=general,
            store_results=store_results,
            management_summary=management_summary,
            df=df,
            avg_confidence=avg_confidence,
        )

    if progress_callback:
        progress_callback("completed", 100)
    return {
        "analysis_id": analysis_id,
        "inference_error": has_model_errors(),
        "summary": general,
        "store_results": store_results,
        "management_summary": management_summary,
        "comments_sample": df.head(50).to_dict("records"),
    }


def _job_public(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "stage": job.get("stage"),
        "progress": job.get("progress", 0),
        "file_name": job.get("file_name"),
        "created_at": job.get("created_at"),
        "updated_at": job.get("updated_at"),
        "analysis_id": job.get("analysis_id"),
        "error": job.get("error"),
        "result": job.get("result") if job.get("status") == "completed" else None,
    }


def _set_job(job_id: str, **changes):
    job = UPLOAD_JOBS[job_id]
    job.update(changes)
    job["updated_at"] = datetime.utcnow().isoformat()


async def _run_upload_job(
    job_id: str,
    *,
    filename: str,
    content: bytes,
    user_id: int,
    should_save: bool,
):
    def progress(stage: str, percent: int):
        _set_job(job_id, status="running", stage=stage, progress=percent)

    try:
        progress("validating", 5)
        result = await _process_upload_content(
            filename=filename,
            content=content,
            user_id=user_id,
            should_save=should_save,
            progress_callback=progress,
        )
        _set_job(
            job_id,
            status="completed",
            stage="completed",
            progress=100,
            analysis_id=result.get("analysis_id"),
            result=result,
        )
    except HTTPException as exc:
        _set_job(
            job_id,
            status="failed",
            stage="failed",
            progress=100,
            error=exc.detail,
        )
    except Exception as exc:  # pragma: no cover - defensive runtime guard
        _set_job(
            job_id,
            status="failed",
            stage="failed",
            progress=100,
            error=f"Erro inesperado ao processar arquivo: {exc}",
        )


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    save_analysis: Optional[bool] = Form(None),
    save_analysis_query: Optional[bool] = Query(None, alias="save_analysis"),
    email: str = Depends(get_current_user_email),
):
    user = await _get_user(email)
    filename = file.filename or ""
    content = await file.read()
    should_save = save_analysis if save_analysis is not None else bool(save_analysis_query)
    return await _process_upload_content(
        filename=filename,
        content=content,
        user_id=user.id,
        should_save=should_save,
    )


@router.post("/upload/async")
async def upload_file_async(
    file: UploadFile = File(...),
    save_analysis: Optional[bool] = Form(None),
    save_analysis_query: Optional[bool] = Query(None, alias="save_analysis"),
    job_key: Optional[str] = Form(None),
    job_key_query: Optional[str] = Query(None, alias="job_key"),
    email: str = Depends(get_current_user_email),
):
    _ensure_test_features()
    user = await _get_user(email)
    filename = file.filename or ""
    content = await file.read()
    should_save = save_analysis if save_analysis is not None else bool(save_analysis_query)

    dedupe_key = f"{user.id}:{job_key or job_key_query or filename}:{len(content)}"
    existing_job_id = UPLOAD_JOB_KEYS.get(dedupe_key)
    if existing_job_id and existing_job_id in UPLOAD_JOBS:
        return _job_public(UPLOAD_JOBS[existing_job_id])

    job_id = str(uuid4())
    now = datetime.utcnow().isoformat()
    UPLOAD_JOB_KEYS[dedupe_key] = job_id
    UPLOAD_JOBS[job_id] = {
        "job_id": job_id,
        "user_id": user.id,
        "status": "queued",
        "stage": "queued",
        "progress": 0,
        "file_name": filename,
        "created_at": now,
        "updated_at": now,
        "analysis_id": None,
        "error": None,
        "result": None,
    }

    import asyncio

    asyncio.create_task(
        _run_upload_job(
            job_id,
            filename=filename,
            content=content,
            user_id=user.id,
            should_save=should_save,
        )
    )
    return _job_public(UPLOAD_JOBS[job_id])


@router.get("/upload/jobs/{job_id}")
async def get_upload_job(job_id: str, email: str = Depends(get_current_user_email)):
    _ensure_test_features()
    user = await _get_user(email)
    job = UPLOAD_JOBS.get(job_id)
    if not job or job.get("user_id") != user.id:
        raise HTTPException(status_code=404, detail="Job nao encontrado")
    return _job_public(job)
