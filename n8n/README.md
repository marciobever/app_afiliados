Importe os 3 workflows no n8n:
- `shopee_search.json` – recebe `{ search_id, term, filters }`, busca na Shopee e POSTa para `/api/n8n/products`.
- `publisher.json` – recebe `{ post_id }`, monta mensagem e envia ao Telegram.
- `scheduler.json` – cron que busca posts agendados e chama o `publisher`.
