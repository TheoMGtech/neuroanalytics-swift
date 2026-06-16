import os
import joblib
import pandas as pd
import numpy as np
import re
import logging
from sklearn.base import BaseEstimator, TransformerMixin
from scipy.sparse import csr_matrix, hstack

logger = logging.getLogger(__name__)

# Definição das classes necessárias para o pipeline (joblib) carregar corretamente
class FeatureExtrator(BaseEstimator, TransformerMixin):
    POSITIVOS = re.compile(
        r'\b(ótimo|excelente|perfeito|maravilhoso|adorei|amei|parabéns|'
        r'recomendo|satisfeito|feliz|lindo|incrível|top|show|demais|muito bom|'
        r'atendimento ótimo|super)\b', re.I
    )
    NEGATIVOS = re.compile(
        r'\b(péssimo|horrível|terrível|decepcionante|ruim|lamentável|'
        r'absurdo|vergonha|nunca mais|pior|desrespeit|demora|falta|'
        r'problema|reclamação|insatisfeito|não recomendo|frustr)\b', re.I
    )
    NEUTROS = re.compile(
        r'\b(ok|razoável|regular|mais ou menos|mediano|poderia|'
        r'às vezes|depende|não é o melhor|melhorar|falta pouco)\b', re.I
    )
    NEGACAO = re.compile(r'\b(não|nem|nunca|jamais|nada|nenhum)\b', re.I)

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        feats = []
        for texto in X:
            t = str(texto)
            n_palavras   = len(t.split())
            n_pos        = len(self.POSITIVOS.findall(t))
            n_neg        = len(self.NEGATIVOS.findall(t))
            n_neutro     = len(self.NEUTROS.findall(t))
            n_negacao    = len(self.NEGACAO.findall(t))
            n_exclamacao = t.count('!')
            ratio_pos    = n_pos / (n_neg + 1)
            ratio_neg    = n_neg / (n_pos + 1)
            tem_ambos    = int(n_pos > 0 and n_neg > 0)
            feats.append([
                n_palavras, n_pos, n_neg, n_neutro, n_negacao,
                n_exclamacao, ratio_pos, ratio_neg, tem_ambos
            ])
        return np.array(feats, dtype=float)

class TFIDFComFeatures(BaseEstimator):
    def __init__(self, tfidf_params=None, C=0.3):
        self.tfidf_params = tfidf_params or {}
        self.C = C

    def fit(self, X, y):
        return self

    def _transform_combined(self, X):
        X_tfidf = self.tfidf_.transform(X)
        X_feat = csr_matrix(self.feat_.transform(X))
        return hstack([X_tfidf, X_feat])

    def predict(self, X):
        return self.clf_.predict(self._transform_combined(X))

    def predict_proba(self, X):
        return self.clf_.predict_proba(self._transform_combined(X))


# Global module variable to inject TFIDFComFeatures into __main__ scope
# This is necessary because the pickle was likely saved with TFIDFComFeatures in __main__
import sys
sys.modules['__main__'].TFIDFComFeatures = TFIDFComFeatures
sys.modules['__main__'].FeatureExtrator = FeatureExtrator

# Lazy load dos modelos
_modelo_sentimento = None
_modelo_categorizacao = None
_has_model_errors = False

def has_model_errors() -> bool:
    global _has_model_errors
    return _has_model_errors

def _load_models():
    global _modelo_sentimento, _modelo_categorizacao
    if _modelo_sentimento is None or _modelo_categorizacao is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        models_dir = os.path.join(base_dir, 'models')
        
        sentimento_path = os.path.join(models_dir, 'modelo_sentimento_final.pkl')
        categorizacao_path = os.path.join(models_dir, 'modelo_categorizacao_baseline.pkl')
        
        try:
            _modelo_sentimento = joblib.load(sentimento_path)
            _modelo_categorizacao = joblib.load(categorizacao_path)
        except Exception as e:
            global _has_model_errors
            _has_model_errors = True
            logger.warning(f"Warning: ML models not found or failed to load. Will fallback to defaults. Error: {e}")

def get_sentiment_predictions(comments: list) -> list:
    """
    Predição real de sentimento baseada nos comentários.
    """
    _load_models()
    
    results = []
    
    # Check if models were loaded
    if _modelo_sentimento is None:
        return [{"sentiment": "Neutro", "confidence": 1.0} for _ in comments]

    # Prepara batch
    clean_comments = [str(c).strip() if c else "" for c in comments]
    
    # Filtra vazios (evitar erro no sklearn)
    if not clean_comments:
        return results

    try:
        # Previsão batch
        preds = _modelo_sentimento.predict(clean_comments)
        
        # Probabilidades para extrair confiança
        if hasattr(_modelo_sentimento, 'predict_proba'):
            probas = _modelo_sentimento.predict_proba(clean_comments)
            confidences = np.max(probas, axis=1)
        elif hasattr(_modelo_sentimento, 'decision_function'):
            # Approximation for LinearSVC wrapped in CalibratedClassifierCV if proba fails
            probas = _modelo_sentimento.decision_function(clean_comments)
            # just some mock confidence if no proba
            confidences = [0.85] * len(clean_comments)
        else:
            confidences = [0.85] * len(clean_comments)
            
        for i, c in enumerate(clean_comments):
            if c == "":
                results.append({"sentiment": "Neutro", "confidence": 1.0})
            else:
                results.append({
                    "sentiment": preds[i],
                    "confidence": round(float(confidences[i]), 2)
                })
    except Exception as e:
        logger.warning(f"Error during sentiment prediction: {e}")
        results = [{"sentiment": "Neutro", "confidence": 1.0} for _ in comments]
        
    return results

def get_category_predictions(comments: list) -> list:
    """
    Predição real de categorias.
    """
    _load_models()
    
    results = []
    
    if _modelo_categorizacao is None:
        return [{"category": "Outros", "confidence": 1.0} for _ in comments]

    clean_comments = [str(c).strip() if c else "" for c in comments]
    
    if not clean_comments:
        return results

    try:
        preds = _modelo_categorizacao.predict(clean_comments)
        
        if hasattr(_modelo_categorizacao, 'predict_proba'):
            probas = _modelo_categorizacao.predict_proba(clean_comments)
            confidences = np.max(probas, axis=1)
        elif hasattr(_modelo_categorizacao, 'decision_function'):
            decisions = _modelo_categorizacao.decision_function(clean_comments)
            # normalizando confidence via min max rough estimate
            confidences = np.clip(np.abs(decisions).max(axis=1) / 3.0, 0.5, 0.99)
        else:
            confidences = [0.8] * len(clean_comments)
            
        for i, c in enumerate(clean_comments):
            if c == "":
                results.append({"category": "Outros", "confidence": 1.0})
            else:
                results.append({
                    "category": preds[i],
                    "confidence": round(float(confidences[i]), 2)
                })
    except Exception as e:
        logger.warning(f"Error during category prediction: {e}")
        results = [{"category": "Outros", "confidence": 1.0} for _ in comments]
        
    return results
