import pandas as pd

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Padroniza colunas e limpa os dados nulos necessários.
    """
    # Padronizar nomes das colunas
    df.columns = [str(c).lower().strip() for c in df.columns]
    
    # Remover linhas onde loja ou nota são nulos
    df = df.dropna(subset=['loja', 'nota'])
    
    # Se 'nota' for numérico, mantém. Se for string (ex: 'promotor'), não dropamos
    # Apenas removemos quem tem nota/classificação vazia
    df = df[df['nota'].notna()]
    
    # Garantir que texto de comentário é string
    if 'comentario' in df.columns:
        df['comentario'] = df['comentario'].fillna('').astype(str)
    elif 'comentário' in df.columns:
        df['comentario'] = df['comentário'].fillna('').astype(str)
    else:
        df['comentario'] = ''
        
    if 'qtd_clientes' in df.columns:
        df['qtd_clientes'] = pd.to_numeric(df['qtd_clientes'], errors='coerce').fillna(1).astype(int)
        df = df.loc[df.index.repeat(df['qtd_clientes'])].reset_index(drop=True)
        
    if 'bandeira' not in df.columns:
        df['bandeira'] = 'Desconhecida'
        
    return df
