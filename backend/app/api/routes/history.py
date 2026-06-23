from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user_email
from app.core.config import settings
from app.db.database import db

router = APIRouter()


async def _get_user(email: str):
    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user


@router.get("/history")
async def get_history(email: str = Depends(get_current_user_email)):
    user = await _get_user(email)
    rows = await db.analysis.find_many(
        where={"userId": user.id},
        order={"createdAt": "desc"},
    )
    if settings.ENVIRONMENT != "test" and not settings.ENABLE_TEST_FEATURES:
        return rows

    seen = set()
    deduped = []
    for item in rows:
        key = (
            item.fileName,
            item.totalReviews,
            round(float(item.generalNps), 4),
            round(float(item.originalNps), 4),
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


@router.get("/history/{id}")
async def get_history_detail(id: int, email: str = Depends(get_current_user_email)):
    user = await _get_user(email)
    analysis = await db.analysis.find_first(
        where={"id": id, "userId": user.id},
        include={
            "storeResults": True,
            "managementSummary": True,
        },
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Análise não encontrada")

    comments = await db.commentresult.find_many(
        where={"analysisId": analysis.id},
        take=50,
    )
    data = analysis.model_dump() if hasattr(analysis, "model_dump") else analysis.dict()
    data["commentResults"] = comments
    return data


@router.delete("/history/{id}")
async def delete_history(id: int, email: str = Depends(get_current_user_email)):
    user = await _get_user(email)
    analysis = await db.analysis.find_first(where={"id": id, "userId": user.id})
    if not analysis:
        raise HTTPException(status_code=404, detail="Análise não encontrada")

    await db.analysis.delete(where={"id": id})
    return {"status": "deleted"}
