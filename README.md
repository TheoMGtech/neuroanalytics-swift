# Projeto NeuroAnalytics Swift

Este repositório armazena o projeto **NeuroAnalytics Swift**, uma aplicação que conta com duas redes neurais: uma para análise de sentimento e outra para categorização. Ambas analisam uma base de dados de avaliações (reviews) de lojas da Swift, com o objetivo de identificar aspectos como a qualidade da loja, o atendimento ao cliente, os produtos, entre outros.

A aplicação é arquitetada em três partes principais:
- **Frontend**: Uma interface interativa construída com Node.js, React, Vite e TailwindCSS.
- **Backend**: Uma API desenvolvida em Python com FastAPI, responsável pelo processamento de dados e hospedagem da comunicação com as redes neurais. A interface com o banco de dados é gerida pelo ORM Prisma.
- **Database**: Um banco de dados PostgreSQL.

---

## 🛠️ Pré-requisitos

O projeto foi projetado para rodar de maneira local, e depende unicamente do Docker para a execução fácil de todo o ecossistema. Certifique-se de ter instalado em sua máquina:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ou Docker Engine.
- (Opcional, mas recomendado) O Docker Compose já costuma vir embutido no Docker Desktop.

---

## 🚀 Como rodar o projeto localmente usando Docker

Todo o ambiente de desenvolvimento está roteirizado e integrado pelo `docker-compose.yml`. Siga o passo a passo abaixo para rodar:

### 1. Preparando o Ambiente
Navegue até a raiz do projeto (onde está localizado o arquivo `docker-compose.yml`).

Existe um arquivo de exemplo com variáveis de ambiente chamado `.env.example`. Você precisará gerar um arquivo `.env` definitivo.
Copie o conteúdo de `.env.example` e cole em um novo arquivo com o nome `.env`. 
*(As configurações padrão que já vêm nesse arquivo são suficientes para a execução local padrão e correta comunicação dos containers).*

### 2. Iniciar e Construir os Containers
Com o arquivo `.env` pronto e o **Docker rodando em segundo plano** no seu computador, abra o terminal na pasta raiz e execute:

```bash
docker-compose up --build
```
*O uso do `--build` é útil na primeira vez que rodar ou quando houve mudança nas bibliotecas do frontend (`package.json`) ou backend (`requirements.txt`). Para as demais execuções cotidianas, você pode simplesmente rodar `docker-compose up`.*

### 3. Acesso

O primeiro "build" das imagens pode demorar alguns minutos. Após terminar de baixar dependências e os logs no terminal estabilizarem, os serviços estarão acessíveis através dos seguintes links:

- **Frontend da Aplicação:** [http://localhost:3000](http://localhost:3000)
- **API do Backend:** [http://localhost:8000](http://localhost:8000)
- **Documentação da API (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)

*(Os volumes e o código local são mapeados para dentro dos containers, então alterações em tempo real no código geralmente refletirão nos containers que estão rodando - Hot Reload).*

---

## ⏹️ Como parar os serviços

Para interromper os servidores locais, basta pressionar `Ctrl + C` no terminal em que os containers estão rodando. 

Caso queira desligar a estrutura de forma limpa pelo terminal, em outra aba, execute:
```bash
docker-compose down
```

> **Aviso:** O banco de dados PostgreSQL salva as informações nos volumes do docker. Caso você queira "resetar" completamente o banco de dados (apagando todas as tabelas e dados), pare os containers rodando:
> ```bash
> docker-compose down -v
> ```

---
*Para dúvidas mais profundas e regras de código, consulte a estrutura interna em `/frontend`, `/backend` e o arquivo de `CONTRIBUTING.md`.*

## Ambiente de apresentação

Para alternar entre o ambiente estável e o ambiente de teste com relatório executivo, consulte `docs/presentation-test-env.md`.
