# Бесплатный деплой Зачётки

## Backend → Render (free tier)

1. Зайди на [render.com](https://render.com) → New → Web Service
2. Подключи GitHub-репозиторий
3. Render подхватит `render.yaml` автоматически
4. В **Environment Variables** задай:
   - `LLM_API_KEY` — твой ключ Caila (обязательно)
   - `CORS_ORIGINS` — URL твоего Vercel-деплоя, например `https://zachetka.vercel.app`
5. Нажми **Deploy**. URL будет `https://zachetka-backend.onrender.com`

> ⚠️ Бесплатный план Render засыпает после 15 мин неактивности. Первый запрос после сна занимает ~30 сек.

---

## Frontend → Vercel (free tier)

1. Зайди на [vercel.com](https://vercel.com) → New Project → Import репозиторий
2. Vercel подхватит `vercel.json` автоматически
3. В **Environment Variables** задай:
   - `VITE_API_BASE_URL` — оставь пустым (Vercel проксирует `/api/*` на Render через rewrite)
4. Нажми **Deploy**. URL будет `https://zachetka.vercel.app`

> После деплоя обнови `CORS_ORIGINS` на Render до актуального URL Vercel.

---

## Локальный запуск

```bash
# Backend
cd backend
source ../rag-venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Frontend (отдельный терминал)
cd frontend
npm run dev
```
