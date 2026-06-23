# Ambiente de apresentação

## Opção estável

Use quando quiser apresentar o que já estava funcionando antes das melhorias de teste.

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000/api/docs`

## Opção de teste com melhorias

Use se quiser apresentar as melhorias de avaliação, relatório executivo e CSV enriquecido.

```bash
docker compose -f docker-compose.test.yml up --build
```

- Frontend de teste: `http://localhost:3001`
- Backend de teste: `http://localhost:8001/api/docs`
- Banco de teste: porta local `5433`

Recursos extras ligados apenas no teste:

- Aba **Relatório Executivo** no menu lateral.
- Download da base enriquecida com sentimento, categoria, confiança, baixa confiança e classificação ajustada.
- Diagnóstico dos modelos contra a taxonomia manual real.
- Top 3 problemas e elogios por loja.
- Explicação executiva do impacto do NPS original vs NPS IA.

Para o relatório funcionar, envie a base e mantenha marcada a opção **Salvar análise no histórico**. No ambiente de teste essa opção já inicia marcada.
