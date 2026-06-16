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

def apply_ai_reclassification(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies the NPS reclassification rules based on the AI sentiment:
    - Promoter + Negative = Neutral
    - Detractor + Positive = Neutral
    - Neutral + Negative = Detractor
    - Neutral + Positive = Promoter
    """
    if df.empty:
        return df

    def _reclassify(row):
        classif = classify_nps(row['nota'])
        sent = row.get('sentiment', 'Neutro')
        
        if classif == 'promoter' and sent == 'Negativo':
            return 'neutral', 'Promotor com Sentimento Negativo -> Neutro'
        if classif == 'detractor' and sent == 'Positivo':
            return 'neutral', 'Detrator com Sentimento Positivo -> Neutro'
        if classif == 'neutral' and sent == 'Negativo':
            return 'detractor', 'Neutro com Sentimento Negativo -> Detrator'
        if classif == 'neutral' and sent == 'Positivo':
            return 'promoter', 'Neutro com Sentimento Positivo -> Promotor'
            
        return classif, None

    # Aplica reclassificação
    reclass_results = df.apply(_reclassify, axis=1)
    df['nps_class_ai'] = [r[0] for r in reclass_results]
    df['reclassification_rule'] = [r[1] for r in reclass_results]
    
    return df

def calculate_nps_with_ai(df: pd.DataFrame) -> dict:
    """
    Calculates both Original and AI-adjusted NPS metrics.
    """
    if df.empty:
        return {}

    df['nps_class_original'] = df['nota'].apply(classify_nps)
    df = apply_ai_reclassification(df)
    
    total = len(df)
    
    # Original overall
    orig_p = len(df[df['nps_class_original'] == 'promoter'])
    orig_d = len(df[df['nps_class_original'] == 'detractor'])
    orig_n = len(df[df['nps_class_original'] == 'neutral'])
    orig_nps = ((orig_p - orig_d) / total) * 100 if total > 0 else 0
    
    # AI overall
    ai_p = len(df[df['nps_class_ai'] == 'promoter'])
    ai_d = len(df[df['nps_class_ai'] == 'detractor'])
    ai_n = len(df[df['nps_class_ai'] == 'neutral'])
    ai_nps = ((ai_p - ai_d) / total) * 100 if total > 0 else 0
    
    reclassified_count = len(df[df['reclassification_rule'].notna()])

    # Per store
    store_results = []
    for (store, flag), group in df.groupby(['loja', 'bandeira']):
        s_total = len(group)
        s_orig_p = len(group[group['nps_class_original'] == 'promoter'])
        s_orig_d = len(group[group['nps_class_original'] == 'detractor'])
        s_orig_n = len(group[group['nps_class_original'] == 'neutral'])
        s_orig_nps = ((s_orig_p - s_orig_d) / s_total) * 100 if s_total > 0 else 0
        
        s_ai_p = len(group[group['nps_class_ai'] == 'promoter'])
        s_ai_d = len(group[group['nps_class_ai'] == 'detractor'])
        s_ai_n = len(group[group['nps_class_ai'] == 'neutral'])
        s_ai_nps = ((s_ai_p - s_ai_d) / s_total) * 100 if s_total > 0 else 0
        
        store_results.append({
            "store_name": str(store),
            "flag": str(flag),
            "total_reviews": s_total,
            "nps": float(s_ai_nps),
            "promoters": s_ai_p,
            "neutral": s_ai_n,
            "detractors": s_ai_d,
            "original_nps": float(s_orig_nps),
            "original_promoters": s_orig_p,
            "original_neutral": s_orig_n,
            "original_detractors": s_orig_d,
            "is_outlier": False
        })
        
    # Per flag (management)
    management_summary = []
    for flag, group in df.groupby('bandeira'):
        f_total = len(group)
        f_orig_p = len(group[group['nps_class_original'] == 'promoter'])
        f_orig_d = len(group[group['nps_class_original'] == 'detractor'])
        f_orig_n = len(group[group['nps_class_original'] == 'neutral'])
        f_orig_nps = ((f_orig_p - f_orig_d) / f_total) * 100 if f_total > 0 else 0
        
        f_ai_p = len(group[group['nps_class_ai'] == 'promoter'])
        f_ai_d = len(group[group['nps_class_ai'] == 'detractor'])
        f_ai_n = len(group[group['nps_class_ai'] == 'neutral'])
        f_ai_nps = ((f_ai_p - f_ai_d) / f_total) * 100 if f_total > 0 else 0
        
        management_summary.append({
            "flag": str(flag),
            "total_reviews": f_total,
            "nps": float(f_ai_nps),
            "promoters": f_ai_p,
            "neutral": f_ai_n,
            "detractors": f_ai_d,
            "original_nps": float(f_orig_nps),
            "original_promoters": f_orig_p,
            "original_neutral": f_orig_n,
            "original_detractors": f_orig_d,
        })

    return {
        "general": {
            "total_reviews": total,
            "nps_score": float(ai_nps),
            "promoters": ai_p,
            "neutral": ai_n,
            "detractors": ai_d,
            "original_nps": float(orig_nps),
            "original_promoters": orig_p,
            "original_neutral": orig_n,
            "original_detractors": orig_d,
            "reclassified_count": reclassified_count
        },
        "store_results": store_results,
        "management_summary": management_summary
    }

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
