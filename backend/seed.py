import asyncio
import random
from datetime import datetime, timedelta
import bcrypt
from app.db.database import db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

STORES = [
    "Swift Morumbi", "Swift Pinheiros", "Swift Vila Mariana",
    "Swift Tatuapé", "Swift Santo André", "Swift Campinas"
]

CATEGORIES = [
    "Atendimento", "Tempo de espera", "Qualidade do produto",
    "Preço", "Organização", "Limpeza", "Entrega", "Experiência geral"
]

SENTIMENTS = ["Positivo", "Neutro", "Negativo"]

COMMENTS_POOL = {
    "Positivo": [
        "Excelente atendimento e qualidade dos produtos. A carne estava muito fresca.",
        "A loja é super organizada e os preços estão ótimos nesta semana.",
        "Gostei muito da experiência geral. Sempre compro na Swift.",
        "Os atendentes foram muito cordiais e me ajudaram a escolher os cortes ideais.",
        "Tudo muito limpo e bem sinalizado, foi fácil achar o que eu queria."
    ],
    "Neutro": [
        "A experiência foi ok. Nada de especial.",
        "Os preços poderiam ser um pouco melhores, mas a qualidade compensa.",
        "Atendimento normal. A loja estava um pouco cheia, então demorou no caixa.",
        "Comprei o que precisava, mas não encontrei a picanha que eu queria.",
        "O tempo de espera foi razoável, mas poderiam ter mais caixas abertos."
    ],
    "Negativo": [
        "A fila estava enorme e o atendimento foi péssimo.",
        "Carne com muito sebo, qualidade caiu bastante em relação a compras anteriores.",
        "Loja bagunçada e produtos fora do lugar. Não encontrei os preços de alguns itens.",
        "O tempo de espera na unidade foi absurdo, os caixas muito lentos.",
        "Fui mal atendido por um funcionário quando perguntei sobre a promoção."
    ]
}

async def seed():
    logger.info("Connecting to DB...")
    await db.connect()
    
    # 1. Create a User
    logger.info("Seeding User...")
    user = await db.user.upsert(
        where={"email": "theo@swift.com.br"},
        data={
            "create": {
                "name": "Theo",
                "email": "theo@swift.com.br",
                "company": "Swift",
                "password": get_password_hash("senha123")
            },
            "update": {}
        }
    )
    
    logger.info("Seeding Analyses over 3 months...")
    for month_offset in [2, 1, 0]:
        created_at = datetime.now() - timedelta(days=30 * month_offset)
        
        analysis = await db.analysis.create(
            data={
                "fileName": f"avaliacoes_mes_offset_{month_offset}.csv",
                "createdAt": created_at,
                "totalReviews": random.randint(4000, 6000),
                "generalNps": random.uniform(60.0, 80.0),
                "promoters": random.randint(2000, 4000),
                "neutral": random.randint(500, 1500),
                "detractors": random.randint(300, 800),
                "userId": user.id,
                "saved": True
            }
        )

        logger.info(f"Seeding Store Results for analysis {analysis.id}...")
        for store in STORES:
            is_outlier = store == "Swift Pinheiros"
            nps = random.uniform(60.0, 90.0) if not is_outlier else random.uniform(30.0, 45.0)
            
            await db.storeresult.create(
                data={
                    "analysisId": analysis.id,
                    "storeName": store,
                    "flag": "outlier" if is_outlier else "normal",
                    "totalReviews": random.randint(500, 1000),
                    "nps": nps,
                    "promoters": random.randint(300, 600),
                    "neutral": random.randint(100, 200),
                    "detractors": random.randint(20, 150),
                    "isOutlier": is_outlier
                }
            )
            
        logger.info(f"Seeding Comments for analysis {analysis.id}...")
        comments_to_create = []
        for i in range(50):
            sentiment = random.choice(SENTIMENTS)
            if sentiment == "Positivo":
                cat = random.choice(["Atendimento", "Qualidade do produto", "Experiência geral", "Limpeza"])
            elif sentiment == "Negativo":
                cat = random.choice(["Tempo de espera", "Preço", "Organização", "Atendimento"])
            else:
                cat = random.choice(CATEGORIES)
                
            comments_to_create.append({
                "analysisId": analysis.id,
                "storeName": random.choice(STORES),
                "commentText": random.choice(COMMENTS_POOL[sentiment]),
                "sentiment": sentiment,
                "category": cat,
                "confidence": round(random.uniform(0.75, 0.99), 2)
            })
            
        for c in comments_to_create:
            await db.commentresult.create(data=c)

        logger.info(f"Seeding Management Summaries for analysis {analysis.id}...")
        for flag in ["critical", "warning", "info"]:
            await db.managementsummary.create(
                data={
                    "analysisId": analysis.id,
                    "flag": flag,
                    "totalReviews": random.randint(100, 500),
                    "nps": random.uniform(30.0, 80.0),
                    "promoters": random.randint(50, 200),
                    "neutral": random.randint(20, 100),
                    "detractors": random.randint(10, 50)
                }
            )

    logger.info("Seeding completed!")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(seed())
