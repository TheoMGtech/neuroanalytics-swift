from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix

from app.core.config import settings
from app.ml.inference import get_category_predictions, get_sentiment_predictions


CATEGORY_MAP = {
    "App/Digital": "Entrega",
    "Limpeza/Ambiente": "Estrutura/Loja",
    "Outros ": "Outros",
    "Variedade": "Abastecimento",
}
SENTIMENT_MAP = {
    "Misto": "Neutro",
    "misto": "Neutro",
}


def _manual_taxonomy_dir() -> Path:
    candidates = [
        Path(settings.DATA_DIR) / "samples" / "manual_taxonomy",
        Path(settings.DATA_DIR),
        Path(__file__).resolve().parents[3] / "data" / "samples" / "manual_taxonomy",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def _normalise_category(value: Any) -> str:
    text = str(value).strip()
    return CATEGORY_MAP.get(text, text)


def _normalise_sentiment(value: Any) -> str:
    text = str(value).strip().capitalize()
    return SENTIMENT_MAP.get(text, text)


def _load_manual_taxonomy() -> pd.DataFrame:
    base_dir = _manual_taxonomy_dir()
    a1_path = base_dir / "taxonomia_anotacao_manual_1.xlsx"
    a2_path = base_dir / "taxonomia_anotacao_manual_2.xlsx"
    if not a1_path.exists() or not a2_path.exists():
        raise FileNotFoundError(
            "Arquivos de taxonomia manual nao encontrados. "
            f"Diretorio configurado: {base_dir}"
        )

    a1 = pd.read_excel(a1_path)
    a2 = pd.read_excel(a2_path)

    cols = ["ID", "Comentario", "Classificacao_NPS", "Categoria", "Sentimento"]
    a1 = a1[cols].rename(
        columns={"Categoria": "categoria_a1", "Sentimento": "sentimento_a1"}
    )
    a2 = a2[["ID", "Categoria", "Sentimento"]].rename(
        columns={"Categoria": "categoria_a2", "Sentimento": "sentimento_a2"}
    )
    df = a1.merge(a2, on="ID", how="inner")

    df["categoria_a1_norm"] = df["categoria_a1"].map(_normalise_category)
    df["categoria_a2_norm"] = df["categoria_a2"].map(_normalise_category)
    df["sentimento_a1_norm"] = df["sentimento_a1"].map(_normalise_sentiment)
    df["sentimento_a2_norm"] = df["sentimento_a2"].map(_normalise_sentiment)
    df["n_palavras"] = df["Comentario"].fillna("").astype(str).str.split().str.len()
    return df


def _safe_classification_report(y_true, y_pred, labels: list[str]) -> dict[str, Any]:
    report = classification_report(
        y_true,
        y_pred,
        labels=labels,
        output_dict=True,
        zero_division=0,
    )
    return {
        label: {
            "precision": round(float(report[label]["precision"]), 4),
            "recall": round(float(report[label]["recall"]), 4),
            "f1": round(float(report[label]["f1-score"]), 4),
            "support": int(report[label]["support"]),
        }
        for label in labels
        if label in report
    } | {
        "accuracy": round(float(report.get("accuracy", 0)), 4),
        "macroF1": round(float(report.get("macro avg", {}).get("f1-score", 0)), 4),
        "weightedF1": round(
            float(report.get("weighted avg", {}).get("f1-score", 0)), 4
        ),
    }


def _confusion_table(y_true, y_pred, labels: list[str]) -> list[dict[str, Any]]:
    matrix = confusion_matrix(y_true, y_pred, labels=labels)
    rows: list[dict[str, Any]] = []
    for i, true_label in enumerate(labels):
        row = {"real": true_label}
        for j, pred_label in enumerate(labels):
            row[pred_label] = int(matrix[i][j])
        rows.append(row)
    return rows


def _confusion_pairs(df: pd.DataFrame, true_col: str, pred_col: str) -> list[dict[str, Any]]:
    errors = df[df[true_col] != df[pred_col]]
    if errors.empty:
        return []
    pairs = (
        errors.groupby([true_col, pred_col])
        .size()
        .sort_values(ascending=False)
        .head(8)
    )
    result = []
    for (real, pred), count in pairs.items():
        examples = (
            errors[(errors[true_col] == real) & (errors[pred_col] == pred)]
            .head(3)["Comentario"]
            .astype(str)
            .tolist()
        )
        result.append(
            {
                "real": real,
                "predito": pred,
                "count": int(count),
                "examples": examples,
            }
        )
    return result


def _qualitative_error_themes(errors: pd.DataFrame) -> list[dict[str, Any]]:
    if errors.empty:
        return []
    text = errors["Comentario"].fillna("").astype(str).str.lower()
    themes = [
        (
            "Comentarios muito curtos",
            errors["n_palavras"] <= 4,
            "Pouco contexto textual para separar sentimento e tema.",
        ),
        (
            "Comentarios mistos ou adversativos",
            text.str.contains(r"\b(?:mas|porem|porém|contudo|apesar|no entanto)\b"),
            "O cliente mistura elogio e problema no mesmo texto.",
        ),
        (
            "Divergencia entre nota e texto",
            errors["Classificacao_NPS"].astype(str).str.lower().ne(
                errors["sentimento_pred"].astype(str).str.lower()
            ),
            "A nota NPS nao descreve sozinha o tom textual.",
        ),
        (
            "Multitema ou tema dominante ambiguo",
            text.str.contains(
                r"\b(?:atendimento|produto|pre[cç]o|entrega|falta|loja|caixa)\b"
            ),
            "O comentario cita mais de uma frente de negocio.",
        ),
    ]
    total = len(errors)
    result = []
    for name, mask, explanation in themes:
        count = int(mask.sum())
        if count:
            result.append(
                {
                    "theme": name,
                    "count": count,
                    "percentOfErrors": round(count / total * 100, 1),
                    "explanation": explanation,
                }
            )
    return result


def _distribution(series: pd.Series) -> list[dict[str, Any]]:
    counts = series.value_counts(dropna=False)
    total = int(counts.sum()) or 1
    return [
        {"label": str(label), "count": int(count), "percent": round(count / total * 100, 1)}
        for label, count in counts.items()
    ]


@lru_cache(maxsize=1)
def build_model_diagnostics() -> dict[str, Any]:
    manual = _load_manual_taxonomy()

    sentiment_eval = manual[
        manual["sentimento_a1_norm"] == manual["sentimento_a2_norm"]
    ].copy()
    category_eval = manual[
        manual["categoria_a1_norm"] == manual["categoria_a2_norm"]
    ].copy()

    sentiment_eval["sentimento_manual"] = sentiment_eval["sentimento_a1_norm"]
    category_eval["categoria_manual"] = category_eval["categoria_a1_norm"]

    sentiment_predictions = get_sentiment_predictions(
        sentiment_eval["Comentario"].astype(str).tolist()
    )
    category_predictions = get_category_predictions(
        category_eval["Comentario"].astype(str).tolist()
    )

    sentiment_eval["sentimento_pred"] = [
        pred["sentiment"] for pred in sentiment_predictions
    ]
    sentiment_eval["sentimento_confidence"] = [
        float(pred.get("confidence", 0)) for pred in sentiment_predictions
    ]
    category_eval["categoria_pred"] = [pred["category"] for pred in category_predictions]
    category_eval["categoria_confidence"] = [
        float(pred.get("confidence", 0)) for pred in category_predictions
    ]

    sentiment_labels = ["Positivo", "Neutro", "Negativo"]
    category_labels = [
        "Abastecimento",
        "Atendimento",
        "Entrega",
        "Estrutura/Loja",
        "Outros",
        "Preço",
        "Produto/Qualidade",
    ]

    sentiment_errors = sentiment_eval[
        sentiment_eval["sentimento_manual"] != sentiment_eval["sentimento_pred"]
    ].copy()
    category_errors = category_eval[
        category_eval["categoria_manual"] != category_eval["categoria_pred"]
    ].copy()

    category_report = _safe_classification_report(
        category_eval["categoria_manual"],
        category_eval["categoria_pred"],
        category_labels,
    )
    category_rows = [
        {"category": label, **values}
        for label, values in category_report.items()
        if isinstance(values, dict)
    ]
    worst_categories = sorted(category_rows, key=lambda item: item["f1"])[:4]

    return {
        "status": "ok",
        "labelPolicy": (
            "Diagnostico de teste com rotulos textuais independentes: apenas exemplos "
            "em que os dois anotadores concordaram apos normalizacao de categorias."
        ),
        "manualDataset": {
            "totalRows": int(len(manual)),
            "sentimentConsensusRows": int(len(sentiment_eval)),
            "categoryConsensusRows": int(len(category_eval)),
            "sentimentAgreementPercent": round(len(sentiment_eval) / len(manual) * 100, 1),
            "categoryAgreementPercent": round(len(category_eval) / len(manual) * 100, 1),
            "sentimentDistribution": _distribution(sentiment_eval["sentimento_manual"]),
            "categoryDistribution": _distribution(category_eval["categoria_manual"]),
        },
        "sentiment": {
            "report": _safe_classification_report(
                sentiment_eval["sentimento_manual"],
                sentiment_eval["sentimento_pred"],
                sentiment_labels,
            ),
            "confusionMatrix": _confusion_table(
                sentiment_eval["sentimento_manual"],
                sentiment_eval["sentimento_pred"],
                sentiment_labels,
            ),
            "confusionPairs": _confusion_pairs(
                sentiment_eval, "sentimento_manual", "sentimento_pred"
            ),
            "qualitativeErrorThemes": _qualitative_error_themes(sentiment_errors),
            "limitations": [
                "O treino principal ainda nasceu de proxy NPS; esta avaliacao separa o teste usando rotulos textuais manuais.",
                "A classe Neutro e naturalmente ambigua e tem menor volume manual.",
                "Comentarios mistos podem ser reclassificados pela parte mais forte do texto, nao por todos os temas citados.",
            ],
            "imbalanceDiscussion": (
                "A amostra manual e estratificada por faixa NPS e nao replica a base completa. "
                "Por isso, macro-F1 e a leitura por classe sao mais importantes que acuracia."
            ),
        },
        "category": {
            "report": category_report,
            "worstCategories": worst_categories,
            "confusionMatrix": _confusion_table(
                category_eval["categoria_manual"],
                category_eval["categoria_pred"],
                category_labels,
            ),
            "confusionPairs": _confusion_pairs(
                category_eval, "categoria_manual", "categoria_pred"
            ),
            "limitations": [
                "As categorias continuam single-label; comentarios multitema sao avaliados pelo tema dominante.",
                "Estrutura/Loja e Abastecimento tem menor suporte manual e precisam de mais exemplos para estabilizar.",
                "Adicionar 2000 rotulos por IA nao foi usado como gold standard, porque nao substituiria validacao humana real.",
            ],
        },
    }


def safe_model_diagnostics() -> dict[str, Any]:
    try:
        return build_model_diagnostics()
    except Exception as exc:
        return {
            "status": "unavailable",
            "error": str(exc),
            "labelPolicy": "Diagnostico independente indisponivel neste ambiente.",
        }
