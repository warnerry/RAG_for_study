# API

Базовый URL для локального запуска:

```text
http://127.0.0.1:8000/api
```

## Документы

### POST `/documents/upload-and-process`

Основной endpoint для интерфейса. Принимает один или несколько файлов, создает `collection_id`, извлекает текст, разбивает материал на смысловые фрагменты, создает эмбеддинги и сохраняет коллекцию в Chroma.

Формат: `multipart/form-data`, поле `files`.

```bash
curl -X POST http://127.0.0.1:8000/api/documents/upload-and-process \
  -F "files=@lecture.pdf" \
  -F "files=@notes.docx" \
  -F "files=@plan.txt"
```

Ответ:

```json
{
  "collection_id": "8ecf1f74-61f6-47c2-b16d-2336a91361a2",
  "files": [
    {
      "document_id": "2b5a...",
      "filename": "lecture.pdf",
      "status": "processed",
      "chunks_count": 18
    },
    {
      "document_id": "92df...",
      "filename": "notes.docx",
      "status": "processed",
      "chunks_count": 7
    }
  ],
  "chunks_count": 25,
  "status": "ready"
}
```

Если один из файлов не удалось обработать, в `files` будет `status: "error"` и поле `error`, а общий статус может быть `partial`.

### POST `/documents/upload`

Совместимый endpoint для старого сценария загрузки одного файла без автоматической обработки.

### POST `/documents/{document_id}/process`

Совместимый endpoint для ручной обработки одного загруженного файла.

### GET `/documents/{document_id}`

Возвращает метаданные документа.

### DELETE `/documents/{document_id}`

Удаляет файл и его обработанные данные из локального хранилища.

## Чат

### POST `/chat`

Отвечает по всем материалам коллекции.

Запрос:

```json
{
  "collection_id": "8ecf1f74-61f6-47c2-b16d-2336a91361a2",
  "message": "Что самое важное в материалах?",
  "top_k": 4
}
```

Ответ:

```json
{
  "answer": "Ответ по загруженным материалам...",
  "sources": [
    {
      "chunk_id": "2b5a...:3",
      "filename": "lecture.pdf",
      "text": "Фрагмент документа...",
      "score": 0.87
    }
  ]
}
```

Если в документах нет ответа, модель должна вернуть честное сообщение: `В загруженных материалах этого нет.`

## Учебные генерации

### POST `/study/generate`

Генерирует учебные активности по коллекции.

Общий запрос:

```json
{
  "collection_id": "8ecf1f74-61f6-47c2-b16d-2336a91361a2",
  "mode": "flashcards",
  "count": 25,
  "quality": false
}
```

Режимы:

- `summary` - подробный учебный пересказ.
- `exam_questions` - вопросы для подготовки.
- `flashcards` - карточки.
- `mnemonics` - мнемоники.

Для `summary` параметр `count` не нужен. Для вопросов, карточек и мнемоник `count` задает желаемое количество элементов.

### Ответ `summary`

```json
{
  "mode": "summary",
  "title": "Краткий пересказ материала",
  "sections": [
    {
      "title": "Главная идея",
      "content": "..."
    },
    {
      "title": "Ключевые темы",
      "items": ["...", "..."]
    }
  ],
  "sources": ["2b5a...:3"]
}
```

### Ответ `flashcards`

```json
{
  "mode": "flashcards",
  "items": [
    {
      "front": "Термин или вопрос",
      "back": "Ответ или объяснение",
      "source_chunk_ids": ["2b5a...:3"],
      "source_files": ["lecture.pdf"]
    }
  ]
}
```

### Ответ `mnemonics`

```json
{
  "mode": "mnemonics",
  "items": [
    {
      "concept": "Понятие",
      "association": "Простая бытовая ассоциация",
      "memory_phrase": "Короткая фраза для запоминания",
      "why_it_works": "Почему образ помогает вспомнить материал",
      "example": "Мини-пример применения",
      "source_chunk_ids": ["2b5a...:3"],
      "source_files": ["lecture.pdf"]
    }
  ]
}
```

## Конкурсные режимы

### POST `/contest/generate`

Генерирует тренировку по всем документам коллекции.

Запрос:

```json
{
  "collection_id": "8ecf1f74-61f6-47c2-b16d-2336a91361a2",
  "mode": "blitz",
  "quality": false
}
```

Режимы:

- `blitz`
- `two_to_one`
- `union_biathlon`

Ответы содержат `source_chunk_ids` и `source_files`, чтобы интерфейс мог показать, из какого файла взят материал.

## Ошибки

Типовые пользовательские ошибки:

- неподдерживаемый формат файла;
- файл не содержит извлекаемого текста;
- для изображения не установлен OCR-модуль;
- модель не настроена через `.env`;
- векторная база пока не содержит фрагментов для указанной коллекции.
