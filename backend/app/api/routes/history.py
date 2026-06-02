from fastapi import APIRouter, HTTPException, Depends
from app.db.database import db
from app.api.deps import get_current_user_email

router = APIRouter()

@router.get("/history")
async def get_history(email: str = Depends(get_current_user_email)):
    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    analyses = await db.analysis.find_many(
        where={"userId": user.id},
        order={"createdAt": "desc"}
    )
    return analyses

@router.get("/history/{id}")
async def get_history_detail(id: int, email: str = Depends(get_current_user_email)):
    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
    analysis = await db.analysis.find_first(
        where={"id": id, "userId": user.id},
        include={
            "storeResults": True,
            "commentResults": True,
            "managementSummary": True
        }
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Análise não encontrada")
    return analysis

@router.delete("/history/{id}")
async def delete_history(id: int, email: str = Depends(get_current_user_email)):
    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
    analysis = await db.analysis.find_first(
        where={"id": id, "userId": user.id}
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Análise não encontrada")
        
    await db.analysis.delete(where={"id": id})
    return {"status": "deleted"}
