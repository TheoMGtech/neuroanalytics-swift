# Arquitetura da Solução - NeuroAnalytics

O sistema adota uma estrutura em microsserviços simples orquestrados pelo Docker Compose:

1. **Frontend (React + Vite + TypeScript)**:
   - Porta local: `3000`
   - Framework de componentes: Tailwind CSS
   - Biblioteca de gráficos: Recharts
   - Biblioteca de tabelas: TanStack Table

2. **Backend (FastAPI + Python)**:
   - Porta local: `8000`
   - Processamento estatístico: Pandas & NumPy
   - Acesso ao Banco de Dados: Prisma Client Py

3. **Banco de Dados (PostgreSQL)**:
   - Porta local: `5432`
   - Armazena histórico das análises aprovadas pelo usuário.
