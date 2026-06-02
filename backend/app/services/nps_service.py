import pandas as pd

def classify_nps(score: float) -> str:
    if score >= 9:
        return 'promoter'
    elif score >= 7:
        return 'neutral'
    else:
        return 'detractor'

def calculate_nps(df: pd.DataFrame) -> dict:
    """
    Calculates overall NPS and NPS per store and per flag.
    """
    if df.empty:
        return {}

    df['nps_class'] = df['nota'].apply(classify_nps)
    
    total = len(df)
    promoters = len(df[df['nps_class'] == 'promoter'])
    detractors = len(df[df['nps_class'] == 'detractor'])
    neutral = len(df[df['nps_class'] == 'neutral'])
    
    nps_score = ((promoters - detractors) / total) * 100 if total > 0 else 0
    
    # Per store
    store_results = []
    for (store, flag), group in df.groupby(['loja', 'bandeira']):
        s_total = len(group)
        s_promoters = len(group[group['nps_class'] == 'promoter'])
        s_detractors = len(group[group['nps_class'] == 'detractor'])
        s_neutral = len(group[group['nps_class'] == 'neutral'])
        s_nps = ((s_promoters - s_detractors) / s_total) * 100 if s_total > 0 else 0
        
        store_results.append({
            "store_name": str(store),
            "flag": str(flag),
            "total_reviews": s_total,
            "nps": float(s_nps),
            "promoters": s_promoters,
            "neutral": s_neutral,
            "detractors": s_detractors,
            "is_outlier": False # Will be updated by outlier_service
        })
        
    # Per flag (management)
    management_summary = []
    for flag, group in df.groupby('bandeira'):
        f_total = len(group)
        f_promoters = len(group[group['nps_class'] == 'promoter'])
        f_detractors = len(group[group['nps_class'] == 'detractor'])
        f_neutral = len(group[group['nps_class'] == 'neutral'])
        f_nps = ((f_promoters - f_detractors) / f_total) * 100 if f_total > 0 else 0
        
        management_summary.append({
            "flag": str(flag),
            "total_reviews": f_total,
            "nps": float(f_nps),
            "promoters": f_promoters,
            "neutral": f_neutral,
            "detractors": f_detractors
        })

    return {
        "general": {
            "total_reviews": total,
            "nps_score": float(nps_score),
            "promoters": promoters,
            "neutral": neutral,
            "detractors": detractors
        },
        "store_results": store_results,
        "management_summary": management_summary
    }
