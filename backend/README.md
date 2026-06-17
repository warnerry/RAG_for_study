# Backend scaffold

Минимальный каркас будущего FastAPI backend.

Текущая задача backend:

- принять документ;
- извлечь текст;
- разбить текст на чанки;
- создать embeddings;
- сохранить чанки в vector store;
- отвечать и генерировать активности только по найденным источникам.

Код из `../RAG.ipynb` нужно переносить сюда маленькими шагами.

Локальный запуск после установки зависимостей:

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```
