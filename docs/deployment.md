# Guia de Deploy em Produção (Render)

A aplicação está configurada para deploy automático na plataforma **Render**:
1. Conecte o repositório GitHub ao painel do Render.
2. Crie um banco PostgreSQL no Render.
3. Configure as variáveis de ambiente baseadas no `.env.example` com o `DATABASE_URL` de produção.
4. Crie serviços do tipo "Web Service" separados para o backend e para o frontend utilizando os respectivos Dockerfiles de produção.
