# RAG для учебного проекта

В папке лежит готовый ноутбук `RAG.ipynb` и PDF-файл `Адреса и аудитории.pdf`, который используется в примере.

## Что внутри

- `RAG.ipynb` - Jupyter Notebook с примером RAG.
- `Адреса и аудитории.pdf` - документ для загрузки через `PyPDFLoader`.
- `RAG_files/` - картинки, вынесенные из ноутбука отдельными файлами.
- `chroma_db/` - локальная папка для базы ChromaDB.
- `rag-venv/` - локальное виртуальное окружение Python.

## Как запустить

```bash
cd /Users/denis/Программирование/RAG_for_study
python3 -m venv rag-venv
source rag-venv/bin/activate
python -m pip install -U pip
python -m pip install jupyter ipykernel langchain langchain-community langchain-text-splitters pypdf langchain-ollama chromadb
python -m ipykernel install --user --name rag-venv --display-name "Python (RAG venv)"
```

После этого открой `RAG.ipynb` в VS Code и выбери kernel `Python (RAG venv)`.
