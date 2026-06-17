import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileUp } from "lucide-react";
import { uploadAndProcessDocuments } from "../api/documents";
import { DocumentState } from "../api/types";
import { ErrorState } from "./ErrorState";

interface UploadDropzoneProps {
  documentState: DocumentState;
  onChange: (state: DocumentState) => void;
}

const allowedExtensions = /\.(pdf|txt|docx|md|pptx|xlsx|png|jpg|jpeg)$/i;
const processingSteps = [
  "Загружаем файлы",
  "Извлекаем текст",
  "Разбиваем материал на смысловые фрагменты",
  "Создаем эмбеддинги",
  "Сохраняем в базу знаний",
  "Готово к работе"
];

export function UploadDropzone({ documentState, onChange }: UploadDropzoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setDragging] = useState(false);
  const [isProcessing, setProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");

  const collection = documentState.collection;
  const processedFiles = collection?.files || [];
  const progress = isProcessing
    ? Math.round(((activeStep + 1) / processingSteps.length) * 100)
    : collection
      ? 100
      : 0;

  const selectedLabel = useMemo(() => {
    if (selectedFiles.length === 1) return selectedFiles[0].name;
    if (selectedFiles.length > 1) return `Выбрано файлов: ${selectedFiles.length}`;
    if (processedFiles.length === 1) return processedFiles[0].filename;
    if (processedFiles.length > 1) return `Обработано файлов: ${processedFiles.length}`;
    return "Перетащите материалы сюда или выберите файлы";
  }, [processedFiles, selectedFiles]);

  useEffect(() => {
    if (!isProcessing) return;
    const timer = window.setInterval(() => {
      setActiveStep((current) => Math.min(current + 1, processingSteps.length - 2));
    }, 900);
    return () => window.clearInterval(timer);
  }, [isProcessing]);

  async function startUpload(files: File[]) {
    setProcessing(true);
    setActiveStep(0);
    setError("");

    try {
      const result = await uploadAndProcessDocuments(files);
      setActiveStep(processingSteps.length - 1);
      onChange({
        collection: result,
        uploaded: result.files[0]
          ? {
              document_id: result.files[0].document_id,
              collection_id: result.collection_id,
              filename: result.files[0].filename,
              status: result.files[0].status
            }
          : undefined,
        processed: result.files[0]
          ? {
              document_id: result.files[0].document_id,
              collection_id: result.collection_id,
              chunks_count: result.chunks_count,
              status: result.status
            }
          : undefined
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не удалось обработать материалы.");
    } finally {
      setProcessing(false);
    }
  }

  function setFiles(fileList?: FileList | File[]) {
    setError("");
    if (!fileList?.length) return;

    const files = Array.from(fileList);
    const invalid = files.find((file) => !allowedExtensions.test(file.name));
    if (invalid) {
      setError("Неподдерживаемый формат файла. Поддерживаемые форматы: PDF, DOCX, TXT, MD, PPTX, XLSX, PNG, JPG.");
      return;
    }
    setSelectedFiles(files);
    void startUpload(files);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    setFiles(event.target.files || undefined);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    setFiles(event.dataTransfer.files);
  }

  return (
    <section className="panel uploadPanel">
      <div className="panelHeaderLine">
        <div>
          <p className="eyebrow">Загрузка материалов</p>
          <h2>Загрузите материалы</h2>
        </div>
        {collection ? <span className="successPill">Материалы готовы</span> : null}
      </div>

      <label
        className={`dropzone ${isDragging ? "dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.docx,.md,.pptx,.xlsx,.png,.jpg,.jpeg"
          onChange={handleInput}
        />
        <FileUp size={28} aria-hidden="true" />
        <strong>{selectedLabel}</strong>
        <span>Поддерживаемые форматы: PDF, DOCX, TXT, MD, PPTX, XLSX, PNG, JPG.</span>
      </label>

      {(isProcessing || collection) && (
        <div className="processingBox">
          <div className="progressTrack" aria-label="Ход обработки">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="processingSteps">
            {processingSteps.map((step, index) => (
              <div className={index <= activeStep || collection ? "done" : ""} key={step}>
                <CheckCircle2 size={15} aria-hidden="true" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error ? <ErrorState message={error} /> : null}

      <div className="documentMeta">
        <strong>{collection ? "Материалы готовы — можно начинать подготовку." : "Выберите файлы, обработка начнется автоматически."}</strong>
        <span>
          {collection
            ? `Найдено смысловых фрагментов: ${collection.chunks_count}`
            : "Можно выбрать или перетащить сразу несколько файлов."}
        </span>
        {processedFiles.length ? (
          <ul className="fileList">
            {processedFiles.map((file) => (
              <li key={file.document_id}>
                <span>{file.filename}</span>
                <small>{file.status === "processed" ? `${file.chunks_count} фрагментов` : file.error || "Не обработан"}</small>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
