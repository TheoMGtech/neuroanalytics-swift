from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from typing import Optional
import pandas as pd
import io

from app.api.deps import get_current_user_email
from app.db.database import db
from app.services.file_validation import validate_headers
from app.services.data_cleaning import clean_data
from app.services.nps_service import calculate_nps_with_ai
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

    # Normalizar nomes de colunas para mapeamento
    df.columns = [str(c).lower().strip() for c in df.columns]
    
    # Mapear as colunas reais do arquivo para os nomes esperados pelo backend
    column_mapping = {
        'centronv2': 'loja',
        'flag': 'bandeira',
        'classificacao': 'nota'
    }
    df = df.rename(columns=column_mapping)

    if not validate_headers(df):
        raise HTTPException(status_code=400, detail="Colunas obrigatórias não encontradas no arquivo (loja, bandeira, nota)")

    df = clean_data(df)
    
    # Run ML Inference First
    comments = df['comentario'].tolist()
    sentiments = get_sentiment_predictions(comments)
    categories = get_category_predictions(comments)
    
    df['sentiment'] = [s['sentiment'] for s in sentiments]
    df['category'] = [c['category'] for c in categories]
    df['confidence'] = [c['confidence'] for c in categories]
    
    # Calculate NPS (Original and AI-Adjusted)
    nps_data = calculate_nps_with_ai(df)
    
    if not nps_data:
        raise HTTPException(status_code=400, detail="Arquivo vazio após a limpeza de dados.")

    general = nps_data["general"]
    store_results = nps_data["store_results"]
    management_summary = nps_data["management_summary"]

    store_results = detect_outliers(store_results)
    
    avg_confidence = float(df['confidence'].mean()) if not df.empty else 0.0

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
        
        # Save store results
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
                } for s in store_results
            ]
        )
        
        # Save management summary
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
                } for m in management_summary
            ]
        )
        
        # Save comments (taking top 100 max to avoid huge payload/DB locks in PoC)
        comments_to_save = df.head(100).to_dict('records')
        await db.commentresult.create_many(
            data=[
                {
                    "analysisId": analysis_id,
                    "storeName": str(c['loja']),
                    "commentText": str(c['comentario']),
                    "sentiment": str(c['sentiment']),
                    "category": str(c['category']),
                    "confidence": float(c['confidence']),
                    "originalClassification": str(c['nps_class_original']),
                    "aiClassification": str(c['nps_class_ai']),
                    "reclassificationRule": str(c['reclassification_rule']) if c.get('reclassification_rule') else None,
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
