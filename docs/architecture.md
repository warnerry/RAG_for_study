# Архитектура RAG-системы

## Текущее состояние

Проект уже содержит рабочую fullstack-основу:

- `backend/` - FastAPI API для загрузки, обработки документов, RAG-чата, учебных и конкурсных генераций.
- `frontend/` - Vite + React + TypeScript интерфейс рабочей области.
- `data/uploads`, `data/processed`, `data/vector_store` - локальные данные приложения, исключенные из git.
- `docs/` - архитектура, API и исследовательские заметки.
- `RAG.ipynb` - исследовательский notebook, его не трогаем и не переносим в основной код без отдельной задачи.

Система построена вокруг коллекции материалов: пользователь загружает один или несколько файлов, backend создает `collection_id`, обрабатывает каждый файл и сохраняет все смысловые фрагменты в одну базу знаний.

## Стек

Backend:

- Python 3.11+.
- FastAPI и Pydantic.
- LangChain text splitter.
- ChromaDB как локальное векторное хранилище.
- SentenceTransformers для локальных embeddings.
- OpenAI-compatible LLM endpoint через переменные окружения `LLM_API_BASE`, `LLM_API_KEY`, `LLM_MODEL`.
- Парсеры документов: `pypdf`, `python-docx`, `python-pptx`, `openpyxl`, `pillow`, `pytesseract`.

Frontend:

- React.
- TypeScript.
- Vite.
- CSS без отдельного UI-фреймворка.
- Feature-based компоненты: загрузка, обзор материалов, чат, учебные режимы, конкурсные режимы.

## Поддерживаемые форматы

- PDF - `.pdf`
- Word - `.docx`
- TXT - `.txt`
- Markdown - `.md`
- PowerPoint - `.pptx`
- Excel - `.xlsx`
- Изображения - `.png`, `.jpg`, `.jpeg`

Изображения проходят OCR. Если OCR не установлен, backend возвращает понятную ошибку: `Для распознавания текста с изображения нужно установить OCR-модуль.`

## Основной pipeline

```text
Файлы пользователя
  -> POST /api/documents/upload-and-process
  -> создание collection_id
  -> сохранение каждого файла
  -> извлечение текста
  -> очистка текста
  -> разбиение на смысловые фрагменты
  -> локальные embeddings
  -> ChromaDB с metadata collection_id/document_id/filename/chunk_id/page
  -> чат, пересказ, карточки, мнемоники, конкурсные тренировки
```

Все пользовательские ответы должны опираться на найденные фрагменты. Если в материалах нет ответа, модель должна честно сказать: `В загруженных материалах этого нет.`

## Backend-модули

```text
backend/app/
  main.py
  api/
    documents.py
    chat.py
    study.py
    contest.py
    health.py
  core/
    config.py
  schemas/
    documents.py
    chat.py
    study.py
    contest.py
  services/
    documents/
      file_storage.py
      text_extractor.py
      cleaner.py
      chunker.py
    rag/
      embeddings.py
      vector_store.py
      retriever.py
      generator.py
      prompts.py
    study/
      study_generator.py
    contest/
      contest_generator.py
```

Ответственность модулей:

- `api` - HTTP-контракты.
- `schemas` - Pydantic DTO.
- `services/documents` - файловое хранилище, извлечение текста, очистка, чанкинг.
- `services/rag` - embeddings, ChromaDB, retrieval, prompt context, LLM JSON generation.
- `services/study` - учебные активности.
- `services/contest` - конкурсные тренировки.

## Frontend-модули

```text
frontend/src/
  App.tsx
  api/
    client.ts
    documents.ts
    chat.ts
    study.ts
    contest.ts
    types.ts
  components/
    Hero.tsx
    UploadDropzone.tsx
    DocumentDashboard.tsx
    ChatPanel.tsx
    SourcesList.tsx
    LoadingState.tsx
    ErrorState.tsx
  features/
    study/
      StudyPanel.tsx
      SummaryView.tsx
      FlashcardsView.tsx
      ExamQuestionsView.tsx
      MnemonicsView.tsx
    contest/
      ContestPanel.tsx
      BlitzView.tsx
      TwoToOneView.tsx
      UnionBiathlonView.tsx
  styles/
    globals.css
```

## Основные сущности

`DocumentCollection`

- `collection_id`
- `created_at`
- `document_ids`
- `files`
- `chunks_count`
- `status`: `ready`, `partial`, `failed`

`UploadedDocument`

- `document_id`
- `collection_id`
- `filename`
- `content_type`
- `size_bytes`
- `storage_path`
- `status`
- `created_at`

`DocumentChunk`

- `chunk_id`
- `collection_id`
- `document_id`
- `filename`
- `text`
- `page` или другой источник
- `metadata`

`RetrievalSource`

- `chunk_id`
- `filename`
- `text`
- `score`
- `page`

`StudyActivity`

- `collection_id`
- `mode`
- `title`
- `items` или `sections`
- `sources`

`Flashcard`

- `front`
- `back`
- `hint`
- `source_chunk_ids`
- `source_files`

`Mnemonic`

- `concept`
- `association`
- `memory_phrase`
- `why_it_works`
- `example`
- `source_chunk_ids`
- `source_files`

`ContestTraining`

- `collection_id`
- `mode`
- `title`
- `items` или `rounds`
- `source_chunk_ids`
- `source_files`

`ChatMessage`

- `role`
- `content`
- `sources`
- `created_at`

Будущие сущности для расширения:

- `UserSession`
- `QuizQuestion`
- `ContestRound`
- `AnswerEvaluation`
- `TrainingResult`

## API

Актуальные endpoint'ы:

- `POST /api/documents/upload-and-process` - мультизагрузка и автоматическая обработка.
- `POST /api/documents/upload` - совместимость со старым сценарием загрузки одного файла.
- `POST /api/documents/{document_id}/process` - совместимость со старым ручным процессингом.
- `GET /api/documents/{document_id}` - информация о документе.
- `DELETE /api/documents/{document_id}` - удаление документа.
- `POST /api/chat` - чат по `collection_id`.
- `POST /api/study/generate` - учебные активности по `collection_id`.
- `POST /api/contest/generate` - конкурсные режимы по `collection_id`.

Планируемые endpoint'ы:

- `POST /api/quiz/answer`
- `GET /api/sessions/{id}/results`
- `POST /api/results/export`
- `GET /api/research/logs`

## Учебные режимы

- `summary` - подробный учебный пересказ блоками.
- `exam_questions` - вопросы для экзамена или зачета.
- `flashcards` - карточки с параметром `count`.
- `mnemonics` - мнемоники с ассоциациями и мини-примерами.

Планируемые режимы:

- `key_terms`
- `lab_defense_questions`
- `step_by_step_explanation`
- `weak_points_training`
- `adaptive_quiz`

## Конкурсные режимы

- `blitz`
- `two_to_one`
- `union_biathlon`

Планируемые режимы:

- `legal_orientation`
- `management_duel`
- `regulation_quiz`
- `stress_training`
- `mistake_review`

## Исследовательская часть

Структура приложения должна поддерживать сравнение обычного чата и RAG-чата:

- логировать `collection_id`, `document_id`, `filename`, `retrieved chunk ids`, scores и выбранный prompt;
- сохранять вопросы, ответы, ошибки пользователя и источники;
- считать accuracy, completeness, groundedness, hallucination rate, satisfaction;
- проводить эксперименты отдельно для учебного и профсоюзно-конкурсного сценариев.

## Безопасность и ограничения

- API-ключи хранятся только в `.env`; пример находится в `.env.example`.
- `.env`, загрузки и vector store не коммитятся.
- В пользовательском интерфейсе не показываем крупно технические идентификаторы.
- Документы нужно хранить только столько, сколько требуется для сессии или эксперимента.
- Все ответы модели должны содержать источники или честное сообщение об отсутствии ответа в материалах.

## Ближайший roadmap

1. Добавить реальный backend-progress через SSE или polling.
2. Добавить сохранение пользовательских результатов и ошибок.
3. Реализовать экспорт пересказа, карточек и результатов тренировки.
4. Добавить режимы правового ориентирования и управленческих поединков.
5. Добавить исследовательский лог и простую страницу метрик.
