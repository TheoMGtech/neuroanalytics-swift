from fastapi import APIRouter

router = APIRouter()

@router.get("/history")
async def get_history():
    return []

@router.get("/history/{id}")
async def get_history_detail(id: int):
    return {}

@router.delete("/history/{id}")
async def delete_history(id: int):
    return {"status": "deleted"}
