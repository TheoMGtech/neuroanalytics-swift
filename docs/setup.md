# Guia de Configuração e Instalação

## Pré-requisitos
Certifique-se de possuir:
- Docker e Docker Compose instalados.
- Python 3.12+ (opcional para desenvolvimento sem Docker).
- Node.js v22 (opcional para desenvolvimento sem Docker).

## Inicialização Local com Docker
1. Crie seu arquivo de ambiente a partir do exemplo:
   ```bash
   cp .env.example .env
   ```
2. Inicie os containers com o compose:
   ```bash
   docker compose up --build
   ```
3. A aplicação estará disponível em:
   - Frontend: `http://localhost:3000`
   - Backend API Docs: `http://localhost:8000/api/docs`
