import csv
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.api.deps import get_current_user_email
from app.core.config import settings
from app.db.database import db
from app.ml.evaluation import safe_model_diagnostics

router = APIRouter()


def _ensure_test_features():
    if settings.ENVIRONMENT != "test" and not settings.ENABLE_TEST_FEATURES:
        raise HTTPException(status_code=404, detail="Recurso disponivel apenas no ambiente de teste")


def _top_items(counts: dict[str, int], limit: int = 3):
    return [
        {"name": name, "count": int(count)}
        for name, count in sorted(counts.items(), key=lambda item: item[1], reverse=True)[:limit]
    ]


def _percent(count: int, total: int) -> float:
    return round((count / total) * 100, 4) if total else 0.0


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
        "confidenceAvg": 0,
        "distributionComparison": [],
        "executiveSummary": {},
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

    store_category_rows = await _group(["storeName", "category", "sentiment"], where_comments)
    by_store_topics: dict[str, dict] = {}
    by_management_topics: dict[str, dict] = {}
    sentiment_score = {"Positivo": 1, "Neutro": 0, "Negativo": -1}
    for row in store_category_rows:
        store_name = _row_value(row, "storeName")
        category_name = _row_value(row, "category") or "Outros"
        sentiment_name = _row_value(row, "sentiment") or "Neutro"
        count = _row_count(row)
        if store_name not in by_store_topics:
            by_store_topics[store_name] = {
                "problems": {},
                "praises": {},
                "sentimentScore": 0,
                "sentimentCount": 0,
            }
        store_topics = by_store_topics[store_name]
        store_topics["sentimentScore"] += sentiment_score.get(sentiment_name, 0) * count
        store_topics["sentimentCount"] += count
        if sentiment_name == "Negativo":
            store_topics["problems"][category_name] = store_topics["problems"].get(category_name, 0) + count
        if sentiment_name == "Positivo":
            store_topics["praises"][category_name] = store_topics["praises"].get(category_name, 0) + count

        mgmt_flag = store_flags.get(store_name, "NAO_IDENTIFICADO")
        if mgmt_flag not in by_management_topics:
            by_management_topics[mgmt_flag] = {"problems": {}, "praises": {}}
        mgmt_topics = by_management_topics[mgmt_flag]
        if sentiment_name == "Negativo":
            mgmt_topics["problems"][category_name] = mgmt_topics["problems"].get(category_name, 0) + count
        if sentiment_name == "Positivo":
            mgmt_topics["praises"][category_name] = mgmt_topics["praises"].get(category_name, 0) + count

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
        original_nps = _nps_from_counts(orig_counts)
        topics = by_store_topics.get(
            store_name,
            {"problems": {}, "praises": {}, "sentimentScore": 0, "sentimentCount": 0},
        )
        sentiment_average = (
            topics["sentimentScore"] / topics["sentimentCount"]
            if topics["sentimentCount"]
            else 0
        )
        store_data.append(
            {
                "name": store_name,
                "flag": store_flags.get(store_name, "NAO_IDENTIFICADO"),
                "nps": ai_nps,
                "originalNps": original_nps,
                "diffNps": ai_nps - original_nps,
                "alert": abs(ai_nps - original_nps) >= 10,
                "sentimentAverage": sentiment_average,
                "topProblems": _top_items(topics["problems"]),
                "topPraises": _top_items(topics["praises"]),
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
        mgmt_topics = by_management_topics.get(mgmt_flag, {"problems": {}, "praises": {}})
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
                "topProblems": _top_items(mgmt_topics["problems"], 5),
                "topPraises": _top_items(mgmt_topics["praises"], 5),
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

    category_data = list(cat_data.values())
    total_reviews = sum(general_ai.values())
    general_nps = _nps_from_counts(general_ai)
    original_nps = _nps_from_counts(general_original)
    reclassified_count = sum(item["count"] for item in reclassification_reasons)
    distribution_comparison = [
        {
            "label": "Promotores",
            "original": general_original.get("promoter", 0),
            "ai": general_ai.get("promoter", 0),
            "originalPercent": _percent(general_original.get("promoter", 0), total_reviews),
            "aiPercent": _percent(general_ai.get("promoter", 0), total_reviews),
        },
        {
            "label": "Neutros",
            "original": general_original.get("neutral", 0),
            "ai": general_ai.get("neutral", 0),
            "originalPercent": _percent(general_original.get("neutral", 0), total_reviews),
            "aiPercent": _percent(general_ai.get("neutral", 0), total_reviews),
        },
        {
            "label": "Detratores",
            "original": general_original.get("detractor", 0),
            "ai": general_ai.get("detractor", 0),
            "originalPercent": _percent(general_original.get("detractor", 0), total_reviews),
            "aiPercent": _percent(general_ai.get("detractor", 0), total_reviews),
        },
    ]
    top_strengths = sorted(
        (
            {"name": row["category"], "count": row["promoters"]}
            for row in category_data
            if row.get("promoters", 0) > 0
        ),
        key=lambda item: item["count"],
        reverse=True,
    )[:3]
    top_attention = sorted(
        (
            {"name": row["category"], "count": row["detractors"]}
            for row in category_data
            if row.get("detractors", 0) > 0
        ),
        key=lambda item: item["count"],
        reverse=True,
    )[:3]
    alert_stores = [store for store in store_data if store["alert"]]
    executive_summary = {
        "sentiment": sentiment_data,
        "topStrengths": top_strengths,
        "topAttention": top_attention,
        "alertStores": len(alert_stores),
        "largestNpsDiffStores": sorted(
            store_data,
            key=lambda store: abs(store["diffNps"]),
            reverse=True,
        )[:5],
    }

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
        "categoryData": category_data,
        "insights": insights,
        "reclassificationReasons": reclassification_reasons,
        "totalReviews": total_reviews,
        "reclassifiedCount": reclassified_count,
        "generalNps": general_nps,
        "originalNps": original_nps,
        "confidenceAvg": latest_analysis.confidenceAvg,
        "distributionComparison": distribution_comparison,
        "executiveSummary": executive_summary,
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
                "lowConfidence": c.confidence < settings.LOW_CONFIDENCE_THRESHOLD,
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


@router.get("/model-diagnostics")
async def get_model_diagnostics(email: str = Depends(get_current_user_email)):
    _ensure_test_features()
    await _get_user(email)
    return safe_model_diagnostics()


@router.get("/executive-report")
async def get_executive_report(
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
    _ensure_test_features()
    user = await _get_user(email)
    latest_analysis = await _get_analysis(user.id, analysis_id)
    if not latest_analysis:
        return {
            "generatedAt": datetime.utcnow().isoformat(),
            "metrics": _empty_metrics(),
            "modelDiagnostics": safe_model_diagnostics(),
            "representativeComments": [],
        }

    metrics = await get_dashboard_metrics(
        analysis_id=analysis_id,
        start_date=start_date,
        end_date=end_date,
        store=store,
        flag=flag,
        respondent_type=respondent_type,
        sentiment=sentiment,
        category=category,
        ai_status=ai_status,
        email=email,
    )
    where_comments = await _comment_where(
        latest_analysis.id,
        store=store,
        flag=flag,
        respondent_type=respondent_type,
        sentiment=sentiment,
        category=category,
        ai_status=ai_status,
    )
    comments = await db.commentresult.find_many(where=where_comments, take=300)

    representative = []
    for comment in comments:
        if len(representative) >= 12:
            break
        if comment.reclassificationRule or comment.sentiment == "Negativo":
            representative.append(
                {
                    "storeName": comment.storeName,
                    "text": comment.commentText,
                    "sentiment": comment.sentiment,
                    "category": comment.category,
                    "confidence": comment.confidence,
                    "lowConfidence": comment.confidence < settings.LOW_CONFIDENCE_THRESHOLD,
                    "originalClassification": comment.originalClassification,
                    "aiClassification": comment.aiClassification,
                    "reclassificationRule": comment.reclassificationRule,
                }
            )

    return {
        "generatedAt": datetime.utcnow().isoformat(),
        "analysis": {
            "id": latest_analysis.id,
            "fileName": latest_analysis.fileName,
            "createdAt": latest_analysis.createdAt.isoformat(),
        },
        "metrics": metrics,
        "modelDiagnostics": safe_model_diagnostics(),
        "representativeComments": representative,
        "narrative": {
            "headline": "Relatorio executivo consolidado do sentimento dos clientes Swift",
            "methodNote": (
                "O NPS IA reclassifica avaliacoes quando o texto do cliente diverge "
                "da nota original. O relatorio exibe tambem confianca e alertas para "
                "casos de menor seguranca."
            ),
            "riskNote": (
                "Os diagnosticos de teste usam a taxonomia manual como validacao "
                "independente; resultados devem ser revisados antes de decisao operacional critica."
            ),
        },
    }


@router.get("/comments-export")
async def export_comments_csv(
    analysis_id: Optional[int] = Query(None),
    store: Optional[str] = Query(None),
    flag: Optional[str] = Query(None),
    respondent_type: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    ai_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    email: str = Depends(get_current_user_email),
):
    _ensure_test_features()
    user = await _get_user(email)
    latest_analysis = await _get_analysis(user.id, analysis_id)
    if not latest_analysis:
        raise HTTPException(status_code=404, detail="Analise nao encontrada")

    where_comments = await _comment_where(
        latest_analysis.id,
        store=store,
        flag=flag,
        respondent_type=respondent_type,
        sentiment=sentiment,
        category=category,
        ai_status=ai_status,
        search=search,
    )
    comments = await db.commentresult.find_many(where=where_comments)

    output = io.StringIO()
    output.write("\ufeff")
    writer = csv.writer(output)
    writer.writerow(
        [
            "loja",
            "comentario",
            "sentimento_pred",
            "categoria_pred",
            "confianca",
            "baixa_confianca",
            "classificacao_original",
            "classificacao_ajustada",
            "regra_reclassificacao",
        ]
    )
    for comment in comments:
        writer.writerow(
            [
                comment.storeName,
                comment.commentText,
                comment.sentiment,
                comment.category,
                round(float(comment.confidence), 4),
                comment.confidence < settings.LOW_CONFIDENCE_THRESHOLD,
                comment.originalClassification,
                comment.aiClassification,
                comment.reclassificationRule or "",
            ]
        )

    filename = f"base_inferencia_teste_{latest_analysis.id}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
