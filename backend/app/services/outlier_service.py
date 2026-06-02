import pandas as pd
import numpy as np

def detect_outliers(store_results: list) -> list:
    """
    Identifies outliers based on store NPS scores using the IQR method.
    Mutates the `store_results` list to set `is_outlier`.
    """
    if not store_results:
        return store_results
        
    scores = [s['nps'] for s in store_results]
    if len(scores) < 4:
        return store_results
        
    q1 = np.percentile(scores, 25)
    q3 = np.percentile(scores, 75)
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    
    for s in store_results:
        if s['nps'] < lower_bound or s['nps'] > upper_bound:
            s['is_outlier'] = True
            
    return store_results
