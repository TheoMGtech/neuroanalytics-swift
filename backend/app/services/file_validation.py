import pandas as pd
from typing import List

REQUIRED_COLUMNS = ['loja', 'bandeira', 'nota']

def validate_headers(df: pd.DataFrame) -> bool:
    """
    Verifica se as colunas obrigatórias estão presentes no DataFrame.
    """
    cols = [str(c).lower().strip() for c in df.columns]
    for req in REQUIRED_COLUMNS:
        if req not in cols:
            return False
    return True
