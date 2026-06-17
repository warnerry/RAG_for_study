# Зачётка

«Зачётка» — сервис подготовки по загруженным материалам с поиском по документам. Пользователь загружает один или несколько файлов, система автоматически извлекает текст, разбивает материал на смысловые фрагменты, создает эмбеддинги, сохраняет коллекцию в ChromaDB и открывает рабочую область для учебы или конкурсной подготовки.

Целевые сценарии:

- подготовка к учебе: конспекты, лекции, лабораторные, методички, презентации, таблицы и изображения;
- подготовка к профсоюзным конкурсам: уставы, положения, регламенты, законы, локальные акты и конкурсные материалы.

`RAG.ipynb` сохранен как исследовательская основа и не используется как основной код приложения.

## Стек

- Backend: FastAPI, Pydantic, sentence-transformers, ChromaDB.
- Frontend: Vite, React, TypeScript, plain CSS, lucide-react.
- LLM provider: Caila через OpenAI-compatible API.
- Vector store: локальный ChromaDB.

## Поддерживаемые форматы

Поддерживаемые форматы: PDF, DOCX, TXT, MD, PPTX, XLSX, PNG, JPG.

Изображения обрабатываются через OCR. Для распознавания текста с изображений нужны `pillow`, `pytesseract` и установленный системный Tesseract. Если OCR недоступен, backend вернет понятную ошибку без traceback.

## Как работает мультизагрузка

Новый основной сценарий использует коллекцию материалов:

1. Пользователь выбирает или перетаскивает один или несколько файлов.
2. Frontend отправляет их в `POST /api/documents/upload-and-process`.
3. Backend создает `collection_id`.
4. Каждый файл получает свой `document_id`.
5. Все смысловые фрагменты сохраняются в ChromaDB с метаданными `collection_id`, `document_id`, `filename`, `chunk_id`, `page`.
6. Чат, учебные генерации и конкурсные режимы работают по всей коллекции.

Старые endpoint'ы загрузки одного файла оставлены для совместимости.

## Структура

```text
backend/                 # FastAPI backend
frontend/                # Vite + React frontend
data/uploads/            # временные загруженные документы, не коммитятся
data/processed/          # очищенный текст и производные данные, не коммитятся
data/vector_store/       # ChromaDB, не коммитится
docs/architecture.md     # архитектура, сущности, RAG pipeline, план
docs/api.md              # контракт API
docs/research_notes.md   # исследовательская часть для статьи
RAG.ipynb                # существующий исследовательский notebook
```

## Backend

```bash
cd /Users/denis/Программирование/RAG_for_study
python3 -m venv rag-venv
source rag-venv/bin/activate
python -m pip install -U pip
python -m pip install -r backend/requirements.txt
cp .env.example .env
```

В `.env` нужно указать Caila key:

```bash
LLM_PROVIDER=caila
LLM_BASE_URL=https://caila.io/api/adapters/openai
LLM_API_KEY=your_caila_api_key_here
LLM_MODEL=gpt-4o-mini
LLM_MODEL_QUALITY=gpt-4o-mini
```

Запуск:

```bash
cd /Users/denis/Программирование/RAG_for_study/backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Проверка:

```bash
curl http://127.0.0.1:8000/health
```

## Frontend

```bash
cd /Users/denis/Программирование/RAG_for_study/frontend
npm install
npm run dev
```

Открой:

```text
http://127.0.0.1:5173
```

Для production-сборки:

```bash
cd /Users/denis/Программирование/RAG_for_study/frontend
npm run build
```

После сборки и перезапуска backend интерфейс доступен через FastAPI:

```text
http://127.0.0.1:8000/ui/
```

## Проверка мультизагрузки через curl

```bash
curl -X POST http://127.0.0.1:8000/api/documents/upload-and-process \
  -F "files=@/path/to/lecture.pdf" \
  -F "files=@/path/to/notes.docx" \
  -F "files=@/path/to/plan.txt"
```

Ожидаемый ответ:

```json
{
  "collection_id": "collection_123",
  "files": [
    {
      "document_id": "doc_123",
      "filename": "lecture.pdf",
      "status": "processed",
      "chunks_count": 12
    }
  ],
  "chunks_count": 12,
  "status": "ready"
}
```

## Чат

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"collection_id":"<collection_id>","message":"Что самое важное в материалах?","top_k":4}'
```

Ответ содержит `sources` с названием файла и найденным фрагментом.

## Учебные генерации

```bash
curl -X POST http://127.0.0.1:8000/api/study/generate \
  -H "Content-Type: application/json" \
  -d '{"collection_id":"<collection_id>","mode":"flashcards","count":25,"quality":false}'
```

Режимы:

- `summary` - подробный учебный пересказ блоками;
- `exam_questions` - вопросы для подготовки;
- `flashcards` - карточки для тренировки;
- `mnemonics` - мнемоники с ассоциациями и примерами.

## Конкурсные тренировки

```bash
curl -X POST http://127.0.0.1:8000/api/contest/generate \
  -H "Content-Type: application/json" \
  -d '{"collection_id":"<collection_id>","mode":"blitz","quality":false}'
```

Режимы:

- `blitz`;
- `two_to_one`;
- `union_biathlon`.

## Ручная проверка

1. Запусти backend на `http://127.0.0.1:8000`.
2. Запусти frontend на `http://127.0.0.1:5173` или открой `http://127.0.0.1:8000/ui/`.
3. Загрузи сразу 2-3 файла разных форматов, например PDF + DOCX + TXT.
4. Дождись сообщения `Готово! Материалы обработаны, можно начинать подготовку.`
5. Открой чат и задай вопрос по материалам.
6. Сгенерируй краткий пересказ.
7. Сгенерируй 10 карточек и проверь переворот.
8. Сгенерируй мнемоники.

## Бесплатный демо-деплой

Backend можно поднять на Render Free из `render.yaml`. В переменных окружения нужно указать `LLM_API_KEY`, `LLM_BASE_URL`, `CORS_ORIGINS` с доменом frontend, а при необходимости изменить `MAX_FILES_PER_UPLOAD` и `MAX_UPLOAD_MB`.

Frontend можно развернуть на Vercel или Netlify из папки `frontend`: команда сборки `npm run build`, папка публикации `dist`. Для отдельного frontend-домена укажи `VITE_API_BASE_URL=https://<backend-on-render>`.

Ограничения бесплатного деплоя: Render Free может засыпать после простоя, а локальное файловое хранилище и Chroma подходят только для демо. Для постоянного хранения следующим этапом лучше подключить S3-совместимое хранилище и отдельную векторную базу.

## Следующие этапы

- добавить сохранение результатов тренировок и историю сессий;
- добавить экспорт результатов в PDF/MD/JSON;
- добавить оценку groundedness/confidence;
- добавить логирование извлеченных фрагментов, ошибок пользователя и качества ответов для исследовательской части;
- расширить конкурсные режимы: правовое ориентирование, управленческие поединки, стресс-тренировка, разбор ошибок.
