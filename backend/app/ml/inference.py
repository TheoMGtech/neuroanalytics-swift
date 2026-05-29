# Inference ML placeholder
# Real inference will be implemented after PoC stage

def get_sentiment_predictions(comments: list) -> list:
    # Mocking sentiment predictions: Positive, Neutral, Negative
    return [{"sentiment": "Neutro", "confidence": 1.0} for _ in comments]

def get_category_predictions(comments: list) -> list:
    # Mocking category predictions: Produto, Limpeza, Atendimento, etc.
    return [{"category": "Outros", "confidence": 1.0} for _ in comments]
