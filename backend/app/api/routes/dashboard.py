from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_current_user_email
from app.db.database import db

router = APIRouter()


CLASS_MAP = {
    "promotor": "promoter",
    "promoter": "promoter",
    "neutro": "neutral",
    "neutral": "neutral",
    "detrator": "detractor",
    "detractor": "detractor",
}


def _split_values(value: Optional[str]) -> list[str]:
    if not value:
        return []
    if isinstance(value, list):
        values = value
    else:
        values = str(value).split(",")
    return [str(v).strip() for v in values if str(v).strip() and str(v).strip() != "Todos"]


def _row_value(row, key: str):
    return row.get(key) if isinstance(row, dict) else getattr(row, key)


def _row_count(row) -> int:
    count = _row_value(row, "_count")
    if isinstance(count, dict):
        return int(count.get("_all") or 0)
    return int(getattr(count, "_all", 0) or 0)


async def _get_user(email: str):
    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user


async def _get_analysis(user_id: int, analysis_id: Optional[int] = None):
    if analysis_id:
        return await db.analysis.find_first(where={"id": analysis_id, "userId": user_id})
    return await db.analysis.find_first(where={"userId": user_id}, order={"createdAt": "desc"})


async def _store_scope(analysis_id: int, store: Optional[str], flag: Optional[str]):
    where = {"analysisId": analysis_id}
    stores = _split_values(store)
    flags = _split_values(flag)
    if stores:
        where["storeName"] = {"in": stores} if len(stores) > 1 else stores[0]
    if flags:
        where["flag"] = {"in": flags} if len(flags) > 1 else flags[0]
    rows = await db.storeresult.find_many(where=where)
    return rows, [s.storeName for s in rows]


async def _comment_where(
    analysis_id: int,
    store: Optional[str] = None,
    flag: Optional[str] = None,
    respondent_type: Optional[str] = None,
    sentiment: Optional[str] = None,
    category: Optional[str] = None,
    ai_status: Optional[str] = None,
    search: Optional[str] = None,
):
    where = {"analysisId": analysis_id}
    scoped_stores, store_names = await _store_scope(analysis_id, store, flag)
    if scoped_stores or store or flag:
        where["storeName"] = {"in": store_names}

    respondent_values = [
        CLASS_MAP[v.lower()]
        for v in _split_values(respondent_type)
        if v.lower() in CLASS_MAP
    ]
    if respondent_values:
        where["originalClassification"] = {"in": respondent_values}

    sentiment_values = _split_values(sentiment)
    if sentiment_values:
        where["sentiment"] = {"in": sentiment_values}

    category_values = _split_values(category)
    if category_values:
        where["category"] = {"in": category_values}

    ai_values = [v.lower() for v in _split_values(ai_status)]
    if ai_values:
        or_conditions = []
        if "reclassificada" in ai_values or "divergente" in ai_values or "inconsistente" in ai_values:
            or_conditions.append({"reclassificationRule": {"not": None}})
        if "mantida" in ai_values:
            or_conditions.append({"reclassificationRule": None})
        if or_conditions:
            where["OR"] = or_conditions

    if search:
        search_or = [
            {"commentText": {"contains": search, "mode": "insensitive"}},
            {"storeName": {"contains": search, "mode": "insensitive"}},
            {"category": {"contains": search, "mode": "insensitive"}},
        ]
        if "OR" in where:
            where["AND"] = [{"OR": where.pop("OR")}, {"OR": search_or}]
        else:
            where["OR"] = search_or
    return where


async def _group(by: list[str], where: dict):
    return await db.commentresult.group_by(by=by, where=where, count=True)


def _nps_from_counts(counts: dict[str, int]) -> float:
    total = sum(counts.values())
    if total == 0:
        return 0.0
    return ((counts.get("promoter", 0) - counts.get("detractor", 0)) / total) * 100


def _empty_metrics():
    return {
        "evolutionData": [],
        "storeData": [],
        "sentimentData": [],
        "managementData": [],
        "categoryData": [],
        "insights": [],
        "reclassificationReasons": [],
        "totalReviews": 0,
        "reclassifiedCount": 0,
        "generalNps": 0,
        "originalNps": 0,
    }


@router.get("/filter-options")
async def get_filter_options(
    analysis_id: Optional[int] = Query(None),
    email: str = Depends(get_current_user_email),
):
    user = await _get_user(email)
    analysis = await _get_analysis(user.id, analysis_id)
    if not analysis:
        return {"stores": [], "files": [], "categories": [], "sentiments": []}

    stores = await db.storeresult.find_many(
        where={"analysisId": analysis.id},
        order={"storeName": "asc"},
    )
    category_rows = await _group(["category"], {"analysisId": analysis.id})
    sentiment_rows = await _group(["sentiment"], {"analysisId": analysis.id})
    analyses = await db.analysis.find_many(
        where={"userId": user.id},
        order={"createdAt": "desc"},
    )
    return {
        "stores": [{"name": s.storeName, "flag": s.flag} for s in stores],
        "files": [{"id": a.id, "name": a.fileName} for a in analyses],
        "categories": sorted([_row_value(row, "category") for row in category_rows if _row_value(row, "category")]),
        "sentiments": sorted([_row_value(row, "sentiment") for row in sentiment_rows if _row_value(row, "sentiment")]),
    }


@router.get("/metrics")
async def get_dashboard_metrics(
    analysis_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    store: Optional[str] = Query(None),
    flag: Optional[str] = Query(None),
    respondent_type: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    ai_status: Optional[str] = Query(None),
    email: str = Depends(get_current_user_email),
):
    user = await _get_user(email)
    latest_analysis = await _get_analysis(user.id, analysis_id)
    if not latest_analysis:
        return _empty_metrics()

    where_comments = await _comment_where(
        latest_analysis.id,
        store=store,
        flag=flag,
        respondent_type=respondent_type,
        sentiment=sentiment,
        category=category,
        ai_status=ai_status,
    )

    store_scope, _ = await _store_scope(latest_analysis.id, store, flag)
    store_flags = {s.storeName: s.flag for s in store_scope}

    grouped_classes = await _group(
        ["storeName", "aiClassification", "originalClassification"],
        where_comments,
    )

    by_store: dict[str, dict] = {}
    management: dict[str, dict] = {}
    general_ai = {"promoter": 0, "neutral": 0, "detractor": 0}
    general_original = {"promoter": 0, "neutral": 0, "detractor": 0}

    for row in grouped_classes:
        store_name = _row_value(row, "storeName")
        ai_cls = _row_value(row, "aiClassification")
        original_cls = _row_value(row, "originalClassification")
        count = _row_count(row)
        if store_name not in by_store:
            by_store[store_name] = {
                "ai": {"promoter": 0, "neutral": 0, "detractor": 0},
                "orig": {"promoter": 0, "neutral": 0, "detractor": 0},
            }
        by_store[store_name]["ai"][ai_cls] = by_store[store_name]["ai"].get(ai_cls, 0) + count
        by_store[store_name]["orig"][original_cls] = by_store[store_name]["orig"].get(original_cls, 0) + count
        general_ai[ai_cls] = general_ai.get(ai_cls, 0) + count
        general_original[original_cls] = general_original.get(original_cls, 0) + count

        mgmt_flag = store_flags.get(store_name, "NAO_IDENTIFICADO")
        if mgmt_flag not in management:
            management[mgmt_flag] = {
                "ai": {"promoter": 0, "neutral": 0, "detractor": 0},
                "orig": {"promoter": 0, "neutral": 0, "detractor": 0},
            }
        management[mgmt_flag]["ai"][ai_cls] = management[mgmt_flag]["ai"].get(ai_cls, 0) + count
        management[mgmt_flag]["orig"][original_cls] = management[mgmt_flag]["orig"].get(original_cls, 0) + count

    def get_color(nps):
        if nps >= 75:
            return "#346E4A"
        if nps >= 50:
            return "#525f78"
        return "#E04403"

    store_data = []
    for store_name, counts in by_store.items():
        ai_counts = counts["ai"]
        orig_counts = counts["orig"]
        ai_nps = _nps_from_counts(ai_counts)
        store_data.append(
            {
                "name": store_name,
                "flag": store_flags.get(store_name, "NAO_IDENTIFICADO"),
                "nps": ai_nps,
                "originalNps": _nps_from_counts(orig_counts),
                "color": get_color(ai_nps),
                "promoters": ai_counts.get("promoter", 0),
                "neutral": ai_counts.get("neutral", 0),
                "detractors": ai_counts.get("detractor", 0),
            }
        )
    store_data.sort(key=lambda x: x["nps"], reverse=True)

    sentiment_rows = await _group(["sentiment"], where_comments)
    sentiment_counts = {
        _row_value(row, "sentiment") or "Neutro": _row_count(row)
        for row in sentiment_rows
    }
    sentiment_total = sum(sentiment_counts.values())
    colors = {"Positivo": "#346E4A", "Neutro": "#525f78", "Negativo": "#E04403"}
    sentiment_data = [
        {
            "name": name,
            "value": round((sentiment_counts.get(name, 0) / sentiment_total) * 100, 4)
            if sentiment_total
            else 0,
            "count": sentiment_counts.get(name, 0),
            "color": colors[name],
        }
        for name in ["Positivo", "Neutro", "Negativo"]
    ]

    where_evol = {"userId": user.id}
    if start_date and end_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            where_evol["createdAt"] = {"gte": start_dt, "lte": end_dt}
        except ValueError:
            pass
    recent_analyses = await db.analysis.find_many(
        where=where_evol, order={"createdAt": "desc"}, take=10
    )
    recent_analyses.reverse()
    evolution_data = [
        {"name": a.createdAt.strftime("%d/%m"), "nps": a.generalNps, "originalNps": a.originalNps}
        for a in recent_analyses
    ]

    management_data = []
    for mgmt_flag, counts in management.items():
        ai_counts = counts["ai"]
        orig_counts = counts["orig"]
        management_data.append(
            {
                "flag": mgmt_flag,
                "nps": _nps_from_counts(ai_counts),
                "totalReviews": sum(ai_counts.values()),
                "promoters": ai_counts.get("promoter", 0),
                "neutral": ai_counts.get("neutral", 0),
                "detractors": ai_counts.get("detractor", 0),
                "originalNps": _nps_from_counts(orig_counts),
                "originalPromoters": orig_counts.get("promoter", 0),
                "originalNeutral": orig_counts.get("neutral", 0),
                "originalDetractors": orig_counts.get("detractor", 0),
            }
        )
    management_data.sort(key=lambda x: x["flag"])

    reclass_rows = await _group(
        ["reclassificationRule"],
        {**where_comments, "reclassificationRule": {"not": None}},
    )
    reclassification_reasons = [
        {"rule": _row_value(row, "reclassificationRule"), "count": _row_count(row)}
        for row in reclass_rows
    ]
    reclassification_reasons.sort(key=lambda x: x["count"], reverse=True)

    category_rows = await _group(["category", "aiClassification"], where_comments)
    cat_data = {}
    for row in category_rows:
        cat = _row_value(row, "category") or "Outros"
        cls = _row_value(row, "aiClassification")
        if cat not in cat_data:
            cat_data[cat] = {"category": cat, "promoters": 0, "neutral": 0, "detractors": 0}
        if cls == "promoter":
            cat_data[cat]["promoters"] += _row_count(row)
        elif cls == "neutral":
            cat_data[cat]["neutral"] += _row_count(row)
        elif cls == "detractor":
            cat_data[cat]["detractors"] += _row_count(row)

    total_reviews = sum(general_ai.values())
    general_nps = _nps_from_counts(general_ai)
    original_nps = _nps_from_counts(general_original)
    reclassified_count = sum(item["count"] for item in reclassification_reasons)

    insights = [
        {
            "type": "info",
            "icon": "schedule",
            "title": "Processamento da Base",
            "description": f"A visão atual contém {total_reviews} comentários válidos após filtros.",
        }
    ]
    if reclassified_count > 0:
        insights.append(
            {
                "type": "info",
                "icon": "auto_awesome",
                "title": "Ação da Inteligência Artificial",
                "description": f"A IA reclassificou {reclassified_count} comentários nesta visão filtrada.",
            }
        )

    return {
        "evolutionData": evolution_data,
        "storeData": store_data,
        "sentimentData": sentiment_data,
        "managementData": management_data,
        "categoryData": list(cat_data.values()),
        "insights": insights,
        "reclassificationReasons": reclassification_reasons,
        "totalReviews": total_reviews,
        "reclassifiedCount": reclassified_count,
        "generalNps": general_nps,
        "originalNps": original_nps,
    }


@router.get("/categories")
async def get_categories_metrics(email: str = Depends(get_current_user_email)):
    user = await _get_user(email)
    latest_analysis = await _get_analysis(user.id)
    if not latest_analysis:
        return []
    rows = await _group(["category"], {"analysisId": latest_analysis.id})
    result = [{"name": _row_value(row, "category") or "Outros", "value": _row_count(row)} for row in rows]
    result.sort(key=lambda x: x["value"], reverse=True)
    return result


@router.get("/outliers")
async def get_outliers_metrics(email: str = Depends(get_current_user_email)):
    user = await _get_user(email)
    latest_analysis = await _get_analysis(user.id)
    if not latest_analysis:
        return []
    outliers = await db.storeresult.find_many(where={"analysisId": latest_analysis.id, "isOutlier": True})
    return [
        {"storeName": o.storeName, "nps": o.nps, "totalReviews": o.totalReviews, "detractors": o.detractors}
        for o in outliers
    ]


@router.get("/sentiments")
async def get_sentiments_metrics(
    analysis_id: Optional[int] = Query(None),
    store: Optional[str] = Query(None),
    flag: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    respondent_type: Optional[str] = Query(None),
    ai_status: Optional[str] = Query(None),
    email: str = Depends(get_current_user_email),
):
    user = await _get_user(email)
    latest_analysis = await _get_analysis(user.id, analysis_id)
    if not latest_analysis:
        return {"distribution": [], "comments": []}
    where_comments = await _comment_where(
        latest_analysis.id, store, flag, respondent_type, sentiment, category, ai_status
    )
    rows = await _group(["sentiment"], where_comments)
    counts = {_row_value(row, "sentiment") or "Neutro": _row_count(row) for row in rows}
    total = sum(counts.values())
    distribution = [
        {
            "name": name,
            "value": round((counts.get(name, 0) / total) * 100, 4) if total else 0,
            "count": counts.get(name, 0),
        }
        for name in ["Positivo", "Neutro", "Negativo"]
    ]
    comments = await db.commentresult.find_many(where=where_comments, take=20)
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
                "reclassificationRule": c.reclassificationRule,
            }
            for c in comments
        ],
    }


@router.get("/comments")
async def get_comments_paginated(
    analysis_id: Optional[int] = Query(None),
    store: Optional[str] = Query(None),
    flag: Optional[str] = Query(None),
    respondent_type: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    ai_status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    email: str = Depends(get_current_user_email),
):
    user = await _get_user(email)
    latest_analysis = await _get_analysis(user.id, analysis_id)
    if not latest_analysis:
        return {"data": [], "meta": {"totalItems": 0, "totalPages": 0, "page": page, "limit": limit}}

    where_comments = await _comment_where(
        latest_analysis.id, store, flag, respondent_type, sentiment, category, ai_status, search
    )
    total = await db.commentresult.count(where=where_comments)
    comments = await db.commentresult.find_many(
        where=where_comments, skip=(page - 1) * limit, take=limit
    )
    return {
        "data": [
            {
                "id": c.id,
                "storeName": c.storeName,
                "store": c.storeName,
                "text": c.commentText,
                "comment": c.commentText,
                "sentiment": c.sentiment,
                "category": c.category,
                "confidence": c.confidence,
                "originalClassification": c.originalClassification,
                "original_classification": c.originalClassification,
                "aiClassification": c.aiClassification,
                "ai_classification": c.aiClassification,
                "reclassificationRule": c.reclassificationRule,
                "status": "Reclassificada" if c.reclassificationRule else "Mantida",
            }
            for c in comments
        ],
        "meta": {
            "totalItems": total,
            "totalPages": (total + limit - 1) // limit,
            "page": page,
            "limit": limit,
        },
    }
