from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.api.deps import get_current_user_email
from app.db.database import db

router = APIRouter()

@router.get("/metrics")
async def get_dashboard_metrics(
    analysis_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    store: Optional[str] = Query(None),
    flag: Optional[str] = Query(None),
    email: str = Depends(get_current_user_email)
):
    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if analysis_id:
        latest_analysis = await db.analysis.find_first(
            where={"id": analysis_id, "userId": user.id}
        )
    else:
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
    where_store = {"analysisId": latest_analysis.id}
    if store and store != "Todos":
        where_store["storeName"] = store
    if flag and flag != "Todos":
        where_store["flag"] = flag

    store_results = await db.storeresult.find_many(
        where=where_store,
        order={"nps": "desc"}
    )
    
    # map to colors based on NPS (just for UI consistency)
    def get_color(nps):
        if nps >= 75: return "#346E4A" # Green
        if nps >= 50: return "#525f78" # Neutral/Blueish
        return "#E04403" # Red
        
    store_data = [
        {
            "name": s.storeName, 
            "nps": s.nps, 
            "originalNps": s.originalNps, 
            "color": get_color(s.nps),
            "promoters": s.promoters,
            "neutral": s.neutral,
            "detractors": s.detractors
        }
        for s in store_results
    ]

    # sentimentData dynamically calculated from filtered stores
    positive = sum(s.promoters for s in store_results)
    neutral = sum(s.neutral for s in store_results)
    negative = sum(s.detractors for s in store_results)
    total = positive + neutral + negative
    
    if total > 0:
        sentiment_data = [
            {"name": "Positivo", "value": round((positive/total)*100), "color": "#346E4A"},
            {"name": "Neutro", "value": round((neutral/total)*100), "color": "#525f78"},
            {"name": "Negativo", "value": round((negative/total)*100), "color": "#E04403"},
        ]
    else:
        sentiment_data = []

    # Evolution (real historical trend)
    where_evol = {"userId": user.id}
    if start_date and end_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            where_evol["createdAt"] = {"gte": start_dt, "lte": end_dt}
        except ValueError:
            pass

    recent_analyses = await db.analysis.find_many(
        where=where_evol,
        order={"createdAt": "desc"},
        take=10
    )
    recent_analyses.reverse()
    
    evolution_data = [
        {"name": a.createdAt.strftime("%d/%m"), "nps": a.generalNps, "originalNps": a.originalNps}
        for a in recent_analyses
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
    
    if latest_analysis.reclassifiedCount > 0:
        insights.append({
            "type": "info",
            "icon": "auto_awesome",
            "title": "Ação da Inteligência Artificial",
            "description": f"A IA reclassificou {latest_analysis.reclassifiedCount} comentários baseada na análise de sentimento."
        })

    # ManagementData (Regular vs Tocadora)
    where_management = {"analysisId": latest_analysis.id}
    if flag and flag != "Todos":
        where_management["flag"] = flag
        
    management_summaries = await db.managementsummary.find_many(
        where=where_management
    )
    
    management_data = [
        {
            "flag": m.flag,
            "nps": m.nps,
            "totalReviews": m.totalReviews,
            "promoters": m.promoters,
            "neutral": m.neutral,
            "detractors": m.detractors,
            "originalNps": m.originalNps,
            "originalPromoters": m.originalPromoters,
            "originalNeutral": m.originalNeutral,
            "originalDetractors": m.originalDetractors
        }
        for m in management_summaries
    ]

    # Buscar motivos de reclassificacao reais da analise
    reclass_counts = {}
    if latest_analysis.reclassifiedCount > 0:
        comments_reclass = await db.commentresult.find_many(
            where={"analysisId": latest_analysis.id, "reclassificationRule": {"not": None}}
        )
        for c in comments_reclass:
            rule = c.reclassificationRule
            if rule not in reclass_counts:
                reclass_counts[rule] = 0
            reclass_counts[rule] += 1
            
    reclassification_reasons = [{"rule": k, "count": v} for k, v in reclass_counts.items()]
    reclassification_reasons.sort(key=lambda x: x["count"], reverse=True)

    comments_all = await db.commentresult.find_many(where={"analysisId": latest_analysis.id})
    cat_data = {}
    for c in comments_all:
        cat = c.category or "Outros"
        cls = c.aiClassification
        if cat not in cat_data:
            cat_data[cat] = {"category": cat, "promoters": 0, "neutral": 0, "detractors": 0}
        if cls == "promoter": cat_data[cat]["promoters"] += 1
        elif cls == "neutral": cat_data[cat]["neutral"] += 1
        elif cls == "detractor": cat_data[cat]["detractors"] += 1
    category_data = list(cat_data.values())

    return {
        "evolutionData": evolution_data,
        "storeData": store_data,
        "sentimentData": sentiment_data,
        "managementData": management_data,
        "categoryData": category_data,
        "insights": insights,
        "reclassificationReasons": reclassification_reasons,
        "totalReviews": latest_analysis.totalReviews,
        "reclassifiedCount": latest_analysis.reclassifiedCount,
        "generalNps": latest_analysis.generalNps,
        "originalNps": latest_analysis.originalNps,
    }

@router.get("/categories")
async def get_categories_metrics(email: str = Depends(get_current_user_email)):
    user = await db.user.find_unique(where={"email": email})
    latest_analysis = await db.analysis.find_first(
        where={"userId": user.id}, order={"createdAt": "desc"}
    )
    if not latest_analysis: return []

    comments = await db.commentresult.find_many(where={"analysisId": latest_analysis.id})
    
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

    outliers = await db.storeresult.find_many(
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
async def get_sentiments_metrics(
    analysis_id: Optional[int] = Query(None),
    store: Optional[str] = Query(None),
    flag: Optional[str] = Query(None),
    email: str = Depends(get_current_user_email)
):
    user = await db.user.find_unique(where={"email": email})
    
    if analysis_id:
        latest_analysis = await db.analysis.find_first(
            where={"id": analysis_id, "userId": user.id}
        )
    else:
        latest_analysis = await db.analysis.find_first(
            where={"userId": user.id}, order={"createdAt": "desc"}
        )

    if not latest_analysis: return {"distribution": [], "comments": []}

    where_store = {"analysisId": latest_analysis.id}
    if store and store != "Todos":
        where_store["storeName"] = store
    if flag and flag != "Todos":
        where_store["flag"] = flag

    store_results = await db.storeresult.find_many(
        where=where_store
    )

    positive = sum(s.promoters for s in store_results)
    neutral = sum(s.neutral for s in store_results)
    negative = sum(s.detractors for s in store_results)
    total = positive + neutral + negative
    
    distribution = []
    if total > 0:
        distribution = [
            {"name": "Positivo", "value": round((positive/total)*100)},
            {"name": "Neutro", "value": round((neutral/total)*100)},
            {"name": "Negativo", "value": round((negative/total)*100)},
        ]
        
    valid_store_names = [s.storeName for s in store_results]
    where_comments = {"analysisId": latest_analysis.id}
    if store and store != "Todos":
        where_comments["storeName"] = store
    elif flag and flag != "Todos":
        # se filtrou por flag mas não loja especifica, garantir que pegue lojas dessa flag
        where_comments["storeName"] = {"in": valid_store_names}

    comments = await db.commentresult.find_many(
        where=where_comments,
        take=20
    )
    
    return {
        "distribution": distribution,
        "comments": [
            {
                "storeName": c.storeName,
                "text": c.commentText,
                "sentiment": c.sentiment,
                "category": c.category,
                "originalClassification": c.originalClassification,
                "aiClassification": c.aiClassification,
                "reclassificationRule": c.reclassificationRule
            } for c in comments
        ]
    }

@router.get("/comments")
async def get_comments_paginated(
    analysis_id: Optional[int] = Query(None),
    store: Optional[str] = Query(None),
    flag: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    email: str = Depends(get_current_user_email)
):
    user = await db.user.find_unique(where={"email": email})
    
    if analysis_id:
        latest_analysis = await db.analysis.find_first(
            where={"id": analysis_id, "userId": user.id}
        )
    else:
        latest_analysis = await db.analysis.find_first(
            where={"userId": user.id}, order={"createdAt": "desc"}
        )

    if not latest_analysis: return {"data": [], "total": 0, "page": page, "limit": limit}

    where_store = {"analysisId": latest_analysis.id}
    if store and store != "Todos":
        where_store["storeName"] = store
    if flag and flag != "Todos":
        where_store["flag"] = flag

    store_results = await db.storeresult.find_many(where=where_store)
    valid_store_names = [s.storeName for s in store_results]

    where_comments = {"analysisId": latest_analysis.id}
    if store and store != "Todos":
        where_comments["storeName"] = store
    elif flag and flag != "Todos":
        where_comments["storeName"] = {"in": valid_store_names}
        
    if search:
        where_comments["OR"] = [
            {"commentText": {"contains": search, "mode": "insensitive"}},
            {"storeName": {"contains": search, "mode": "insensitive"}}
        ]

    total = await db.commentresult.count(where=where_comments)
    comments = await db.commentresult.find_many(
        where=where_comments,
        skip=(page - 1) * limit,
        take=limit
    )
    
    return {
        "data": [
            {
                "id": c.id,
                "storeName": c.storeName,
                "text": c.commentText,
                "sentiment": c.sentiment,
                "category": c.category,
                "confidence": c.confidence,
                "originalClassification": c.originalClassification,
                "aiClassification": c.aiClassification,
                "reclassificationRule": c.reclassificationRule
            } for c in comments
        ],
        "meta": {
            "totalItems": total,
            "totalPages": (total + limit - 1) // limit,
            "page": page,
            "limit": limit
        }
    }
