import random

# Inference ML placeholder
# Real inference will be implemented after PoC stage

def get_sentiment_predictions(comments: list) -> list:
    """
    Mocking sentiment predictions: Positivo, Neutro, Negativo
    """
    sentiments = ["Positivo", "Neutro", "Negativo"]
    results = []
    for comment in comments:
        if not comment or str(comment).strip() == "":
            results.append({"sentiment": "Neutro", "confidence": 1.0})
        else:
            results.append({
                "sentiment": random.choice(sentiments),
                "confidence": round(random.uniform(0.6, 0.99), 2)
            })
    return results

def get_category_predictions(comments: list) -> list:
    """
    Mocking category predictions: Atendimento, Qualidade, Limpeza, Preço, Variedade, Outros
    """
    categories = ["Atendimento", "Qualidade", "Limpeza", "Preço", "Variedade", "Outros"]
    results = []
    for comment in comments:
        if not comment or str(comment).strip() == "":
            results.append({"category": "Outros", "confidence": 1.0})
        else:
            results.append({
                "category": random.choice(categories),
                "confidence": round(random.uniform(0.5, 0.99), 2)
            })
    return results
