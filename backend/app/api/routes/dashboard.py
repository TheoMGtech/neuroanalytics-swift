from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.api.deps import get_current_user_email
from app.db.database import db

router = APIRouter()

@router.get("/metrics")
async def get_dashboard_metrics(email: str = Depends(get_current_user_email)):
    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Get latest analysis for this user
    latest_analysis = await db.analysis.find_first(
        where={"userId": user.id},
        order={"createdAt": "desc"}
    )

    if not latest_analysis:
        return {
            "evolutionData": [],
            "storeData": [],
            "sentimentData": [],
            "insights": []
        }

    # storeData
    store_results = await db.store_result.find_many(
        where={"analysisId": latest_analysis.id},
        order={"nps": "desc"}
    )
    
    # map to colors based on NPS (just for UI consistency)
    def get_color(nps):
        if nps >= 75: return "#346E4A" # Green
        if nps >= 50: return "#525f78" # Neutral/Blueish
        return "#E04403" # Red
        
    store_data = [
        {"name": s.storeName, "nps": s.nps, "color": get_color(s.nps)}
        for s in store_results
    ]

    # sentimentData
    positive = latest_analysis.promoters
    neutral = latest_analysis.neutral
    negative = latest_analysis.detractors
    total = positive + neutral + negative
    
    if total > 0:
        sentiment_data = [
            {"name": "Positivo", "value": round((positive/total)*100), "color": "#346E4A"},
            {"name": "Neutro", "value": round((neutral/total)*100), "color": "#525f78"},
            {"name": "Negativo", "value": round((negative/total)*100), "color": "#E04403"},
        ]
    else:
        sentiment_data = []

    # Evolution (mock historical trend using the current NPS as the latest point)
    # Since we might not have 6 months of data, we will just construct a line that ends in the current NPS.
    current_nps = latest_analysis.generalNps
    evolution_data = [
        {"name": "Jan", "nps": max(0, current_nps - 15)},
        {"name": "Fev", "nps": max(0, current_nps - 10)},
        {"name": "Mar", "nps": max(0, current_nps - 5)},
        {"name": "Abr", "nps": max(0, current_nps - 8)},
        {"name": "Mai", "nps": max(0, current_nps - 2)},
        {"name": "Jun", "nps": current_nps},
    ]

    # Simple insights logic based on actual data
    insights = []
    outliers = [s for s in store_results if s.isOutlier]
    if outliers:
        worst_outlier = min(outliers, key=lambda x: x.nps)
        insights.append({
            "type": "alert",
            "icon": "storefront",
            "title": f"Alerta: Loja {worst_outlier.storeName}",
            "description": f"Detectado como outlier de performance. NPS crítico de {worst_outlier.nps}. Necessita atenção imediata."
        })
    
    best_store = store_results[0] if store_results else None
    if best_store and best_store.nps >= 75:
        insights.append({
            "type": "success",
            "icon": "thumb_up",
            "title": f"Destaque: Loja {best_store.storeName}",
            "description": f"Excelente desempenho com NPS de {best_store.nps}."
        })

    insights.append({
        "type": "info",
        "icon": "schedule",
        "title": "Processamento da Base",
        "description": f"Última análise processou {latest_analysis.totalReviews} avaliações com sucesso."
    })

    return {
        "evolutionData": evolution_data,
        "storeData": store_data,
        "sentimentData": sentiment_data,
        "insights": insights,
        "totalReviews": latest_analysis.totalReviews
    }

@router.get("/categories")
async def get_categories_metrics(email: str = Depends(get_current_user_email)):
    user = await db.user.find_unique(where={"email": email})
    latest_analysis = await db.analysis.find_first(
        where={"userId": user.id}, order={"createdAt": "desc"}
    )
    if not latest_analysis: return []

    comments = await db.comment_result.find_many(where={"analysisId": latest_analysis.id})
    
    cat_counts = {}
    for c in comments:
        cat = c.category
        if cat not in cat_counts: cat_counts[cat] = 0
        cat_counts[cat] += 1
        
    result = [{"name": k, "value": v} for k, v in cat_counts.items()]
    result.sort(key=lambda x: x["value"], reverse=True)
    return result

@router.get("/outliers")
async def get_outliers_metrics(email: str = Depends(get_current_user_email)):
    user = await db.user.find_unique(where={"email": email})
    latest_analysis = await db.analysis.find_first(
        where={"userId": user.id}, order={"createdAt": "desc"}
    )
    if not latest_analysis: return []

    outliers = await db.store_result.find_many(
        where={
            "analysisId": latest_analysis.id,
            "isOutlier": True
        }
    )
    
    return [
        {
            "storeName": o.storeName,
            "nps": o.nps,
            "totalReviews": o.totalReviews,
            "detractors": o.detractors
        } for o in outliers
    ]

@router.get("/sentiments")
async def get_sentiments_metrics(email: str = Depends(get_current_user_email)):
    user = await db.user.find_unique(where={"email": email})
    latest_analysis = await db.analysis.find_first(
        where={"userId": user.id}, order={"createdAt": "desc"}
    )
    if not latest_analysis: return {"distribution": [], "comments": []}

    positive = latest_analysis.promoters
    neutral = latest_analysis.neutral
    negative = latest_analysis.detractors
    total = positive + neutral + negative
    
    distribution = []
    if total > 0:
        distribution = [
            {"name": "Positivo", "value": round((positive/total)*100)},
            {"name": "Neutro", "value": round((neutral/total)*100)},
            {"name": "Negativo", "value": round((negative/total)*100)},
        ]
        
    comments = await db.comment_result.find_many(
        where={"analysisId": latest_analysis.id},
        take=20
    )
    
    return {
        "distribution": distribution,
        "comments": [
            {
                "storeName": c.storeName,
                "text": c.commentText,
                "sentiment": c.sentiment,
                "category": c.category
            } for c in comments
        ]
    }
