# Frontend

Vite + React + TypeScript интерфейс продукта «Зачётка».

## Запуск в режиме разработки

```bash
cd /Users/denis/Программирование/RAG_for_study/frontend
npm install
npm run dev
```

Открой `http://127.0.0.1:5173`. Vite проксирует `/api` и `/health` на backend `http://127.0.0.1:8000`.

Если нужен явный адрес backend, создай `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

Для Vercel или Netlify укажи `VITE_API_BASE_URL` адресом backend на Render. Если frontend отдается самим FastAPI по `/ui/`, переменная не нужна.

## Production build

```bash
cd /Users/denis/Программирование/RAG_for_study/frontend
npm run build
```

После сборки FastAPI отдает интерфейс из `frontend/dist` по адресу `http://127.0.0.1:8000/ui/`.
