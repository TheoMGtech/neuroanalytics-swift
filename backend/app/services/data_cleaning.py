import re

import pandas as pd


def limpar_texto(texto) -> str:
    texto = str(texto).lower()
    texto = re.sub(r"[^a-záàâãéèêíïóôõöúçñ\s]", "", texto)
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto


def parece_ruido(texto) -> bool:
    texto = str(texto)
    if re.match(r"^[\W\d]+$", texto):
        return True
    if re.match(r"^(.)\1{4,}$", texto):
        return True
    if len(texto.strip()) <= 2:
        return True
    return False


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Padroniza colunas e reproduz a base de modelagem usada nos notebooks.
    """
    df.columns = [str(c).lower().strip() for c in df.columns]

    df = df.dropna(subset=["loja", "nota"]).copy()
    df["nota"] = df["nota"].apply(
        lambda v: str(v).strip().lower() if isinstance(v, str) else v
    )
    df = df[df["nota"] != "-"].copy()

    if "comentario" in df.columns:
        df["comentario"] = df["comentario"].fillna("").astype(str)
    elif "comentário" in df.columns:
        df["comentario"] = df["comentário"].fillna("").astype(str)
    else:
        df["comentario"] = ""

    if "bandeira" not in df.columns:
        df["bandeira"] = "NAO_IDENTIFICADO"
    df["bandeira"] = (
        df["bandeira"]
        .replace(
            {
                "#N/A": "NAO_IDENTIFICADO",
                "#N/A N/A": "NAO_IDENTIFICADO",
                "-": "NAO_IDENTIFICADO",
            }
        )
        .fillna("NAO_IDENTIFICADO")
        .astype(str)
        .str.strip()
    )
    df.loc[df["bandeira"].isin(["", "nan", "NaN"]), "bandeira"] = "NAO_IDENTIFICADO"

    # A entrega final modela apenas comentários reais, sem ponderar por qtd_clientes.
    df["tem_comentario"] = df["comentario"].str.strip().ne("-") & df[
        "comentario"
    ].str.strip().ne("")
    df = df[df["tem_comentario"]].copy()
    df["n_palavras"] = df["comentario"].apply(lambda x: len(str(x).split()))
    df["ruido"] = df["comentario"].apply(parece_ruido)
    df = df[(df["n_palavras"] >= 3) & (~df["ruido"])].copy()
    df = df.drop_duplicates(subset="comentario").copy()
    df["texto_limpo"] = df["comentario"].apply(limpar_texto)

    if "mes ano" in df.columns:
        df["mes_ano"] = (
            pd.to_datetime(df["mes ano"], errors="coerce").dt.to_period("M").astype(str)
        )

    return df.reset_index(drop=True)
