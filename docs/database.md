# Estrutura do Banco de Dados (Prisma)

A modelagem lógica das tabelas do Prisma (`schema.prisma`) está documentada em `backend/app/db/schema.prisma`.
Tabelas:
- `analyses`: Armazena cabeçalho da análise.
- `store_results`: Métricas agregadas de NPS e classificação por loja.
- `comment_results`: Sentimento e categorias de feedbacks de texto por cliente.
- `management_summary`: Métricas de NPS agrupadas por gerência (REGULAR vs TOCADORA).
