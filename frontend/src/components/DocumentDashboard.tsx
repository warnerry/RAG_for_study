import { BookMarked, Dumbbell, FileText, MessageCircle, Sparkles } from "lucide-react";
import { DocumentState, WorkspaceTab } from "../api/types";

interface DocumentDashboardProps {
  documentState: DocumentState;
  onOpenTab: (tab: WorkspaceTab) => void;
}

export function DocumentDashboard({ documentState, onOpenTab }: DocumentDashboardProps) {
  const collection = documentState.collection;
  const ready = Boolean(collection || documentState.processed);
  const files = collection?.files || (documentState.uploaded ? [{ ...documentState.uploaded, chunks_count: documentState.processed?.chunks_count || 0 }] : []);
  const chunksCount = collection?.chunks_count || documentState.processed?.chunks_count || 0;
  return (
    <section className="panel dashboardPanel">
      <div className="panelHeaderLine">
        <div>
          <p className="eyebrow">Рабочая область</p>
          <h2>{ready ? "Материалы готовы" : "Материалы еще не загружены"}</h2>
        </div>
        <span className={ready ? "successPill" : "softPill"}>
          {ready ? "Можно работать" : "Загрузите материалы"}
        </span>
      </div>

      {ready ? (
        <div className="materialsSummary">
          <div>
            <FileText size={20} aria-hidden="true" />
            <strong>Загруженные файлы</strong>
            <span>Найдено смысловых фрагментов: {chunksCount}</span>
          </div>
          <ul className="fileList compact">
            {files.map((file) => (
              <li key={file.document_id}>
                <span>{file.filename}</span>
                <small>{"chunks_count" in file && file.chunks_count ? `${file.chunks_count} фрагментов` : "готов к работе"}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="capabilityGrid">
        <div>
          <Sparkles size={20} aria-hidden="true" />
          <strong>Краткий пересказ</strong>
          <span>Список тем, ключевые тезисы и сложные места простым языком.</span>
        </div>
        <div>
          <BookMarked size={20} aria-hidden="true" />
          <strong>Карточки и мнемоники</strong>
          <span>Термины, определения, подсказки и запоминание.</span>
        </div>
        <div>
          <Dumbbell size={20} aria-hidden="true" />
          <strong>Конкурсные режимы</strong>
          <span>Блиц, 2к1 и профсоюзный биатлон по документам.</span>
        </div>
        <div>
          <MessageCircle size={20} aria-hidden="true" />
          <strong>Чат по материалам</strong>
          <span>Ответы только на основе загруженных материалов.</span>
        </div>
      </div>

      <div className="quickActions">
        <button type="button" onClick={() => onOpenTab("chat")} disabled={!ready}>
          <MessageCircle size={16} aria-hidden="true" />
          Открыть чат
        </button>
        <button type="button" onClick={() => onOpenTab("study")} disabled={!ready}>
          <Sparkles size={16} aria-hidden="true" />
          Краткий пересказ
        </button>
        <button type="button" onClick={() => onOpenTab("study")} disabled={!ready}>
          <BookMarked size={16} aria-hidden="true" />
          Вопросы
        </button>
        <button type="button" onClick={() => onOpenTab("study")} disabled={!ready}>
          <BookMarked size={16} aria-hidden="true" />
          Карточки
        </button>
        <button type="button" onClick={() => onOpenTab("study")} disabled={!ready}>
          <Sparkles size={16} aria-hidden="true" />
          Мнемоники
        </button>
        <button type="button" onClick={() => onOpenTab("contest")} disabled={!ready}>
          <Dumbbell size={16} aria-hidden="true" />
          Блиц
        </button>
        <button type="button" onClick={() => onOpenTab("contest")} disabled={!ready}>
          <Dumbbell size={16} aria-hidden="true" />
          2к1
        </button>
        <button type="button" onClick={() => onOpenTab("contest")} disabled={!ready}>
          <Dumbbell size={16} aria-hidden="true" />
          Биатлон
        </button>
      </div>
    </section>
  );
}
