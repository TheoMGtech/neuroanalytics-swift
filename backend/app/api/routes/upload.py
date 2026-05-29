from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    save_analysis: Optional[bool] = Form(False)
):
    # Placeholder upload endpoint
    return {
        "message": f"File '{file.filename}' received.",
        "save_analysis": save_analysis,
        "summary": {
            "total_reviews": 0,
            "nps_geral": 0.0,
            "promoters": 0,
            "neutral": 0,
            "detractors": 0
        },
        "management_comparison": [],
        "outliers": []
    }
