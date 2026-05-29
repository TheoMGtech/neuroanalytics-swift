# Guia de Contribuição - NeuroAnalytics

Bem-vindo ao projeto **NeuroAnalytics**! Siga as diretrizes abaixo para colaborar com o desenvolvimento de forma organizada.

## Branch Workflow
Trabalhamos com o seguinte padrão de ramificações:
* `main`: Produção (estável).
* `develop`: Integração de desenvolvimento.
* `feature/*`: Novas funcionalidades.
* `fix/*` / `hotfix/*`: Correções.
* `docs/*`: Atualizações de documentação.
* `ml/*`: Experimentos de Machine Learning.

O fluxo de merge recomendado é:
`feature/nome-da-feature` -> `develop` -> `main`

## Proteção de Branches
As ramificações `main` e `develop` são protegidas. Todo merge requer:
1. Pull Request com preenchimento obrigatório do template.
2. Pelo menos 1 aprovação dos revisores designados em `CODEOWNERS`.
3. Passagem sem falhas nos testes automatizados (CI pipeline).

## Como rodar localmente com Docker
Certifique-se de ter o Docker e Docker Compose instalados.

1. Crie o arquivo `.env` a partir do modelo:
   ```bash
   cp .env.example .env
   ```
2. Inicialize os containers:
   ```bash
   docker compose up --build
   ```
3. Acesse a API em `http://localhost:8000` e o Frontend em `http://localhost:3000`.
