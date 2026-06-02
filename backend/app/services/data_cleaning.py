import pandas as pd

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Padroniza colunas e limpa os dados nulos necessários.
    """
    # Padronizar nomes das colunas
    df.columns = [str(c).lower().strip() for c in df.columns]
    
    # Remover linhas onde loja ou nota são nulos
    df = df.dropna(subset=['loja', 'nota'])
    
    # Converter nota para numérico
    df['nota'] = pd.to_numeric(df['nota'], errors='coerce')
    df = df.dropna(subset=['nota'])
    
    # Garantir que texto de comentário é string
    if 'comentario' in df.columns:
        df['comentario'] = df['comentario'].fillna('').astype(str)
    elif 'comentário' in df.columns:
        df['comentario'] = df['comentário'].fillna('').astype(str)
    else:
        df['comentario'] = ''
        
    if 'bandeira' not in df.columns:
        df['bandeira'] = 'Desconhecida'
        
    return df
