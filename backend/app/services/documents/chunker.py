from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.services.documents.text_extractor import clean_text


def split_documents(
    document_id: str,
    documents: list[Document],
    collection_id: str | None = None,
    filename: str | None = None,
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    splits = splitter.split_documents(documents)
    chunks = []
    for index, split in enumerate(splits):
        text = clean_text(split.page_content)
        if not text:
            continue
        chunk_id = f"{document_id}:{index}"
        metadata = {
            "document_id": document_id,
            "chunk_id": chunk_id,
            "chunk_index": index,
            "page": split.metadata.get("page"),
            "source": split.metadata.get("source"),
        }
        if collection_id:
            metadata["collection_id"] = collection_id
        if filename:
            metadata["filename"] = filename
        if split.metadata.get("sheet"):
            metadata["sheet"] = split.metadata.get("sheet")
        chunks.append(
            {
                "chunk_id": chunk_id,
                "document_id": document_id,
                "collection_id": collection_id or document_id,
                "text": text,
                "metadata": metadata,
            }
        )
    return chunks
