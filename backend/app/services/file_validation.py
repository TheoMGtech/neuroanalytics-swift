import math
from typing import Tuple

import pandas as pd


REQUIRED_COLUMNS = ["loja", "bandeira", "nota"]
VALID_NPS_LABELS = {"promotor", "neutro", "detrator", "-"}
VALID_FLAGS = {"REGULAR", "TOCADORA", "NAO_IDENTIFICADO", "#N/A", "-"}


def validate_headers(df: pd.DataFrame) -> bool:
    cols = [str(c).lower().strip() for c in df.columns]
    return all(req in cols for req in REQUIRED_COLUMNS)


def _is_blank(value) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    return str(value).strip() == ""


def validate_note_values(df: pd.DataFrame) -> Tuple[bool, str | None]:
    invalid = []
    for value in df["nota"].dropna().unique():
        if _is_blank(value):
            continue

        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in VALID_NPS_LABELS:
                continue
            try:
                numeric = float(normalized.replace(",", "."))
            except ValueError:
                invalid.append(value)
                continue
        else:
            numeric = float(value)

        if not numeric.is_integer() or numeric < 1 or numeric > 10:
            invalid.append(value)

    if invalid:
        preview = ", ".join(map(str, invalid[:5]))
        return False, f"Valores inválidos na coluna 'Classificação/nota': {preview}."
    return True, None


def validate_flag_values(df: pd.DataFrame) -> Tuple[bool, str | None]:
    invalid = []
    for value in df["bandeira"].unique():
        if _is_blank(value):
            continue
        normalized = str(value).strip().upper()
        if normalized not in VALID_FLAGS:
            invalid.append(value)

    if invalid:
        preview = ", ".join(map(str, invalid[:5]))
        return False, f"Valores inválidos na coluna 'Flag': {preview}."
    return True, None
