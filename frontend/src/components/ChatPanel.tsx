import { FormEvent, useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { askDocument } from "../api/chat";
import { ChatResponse, RetrievalSource } from "../api/types";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { SourcesList } from "./SourcesList";

interface ChatPanelProps {
  collectionId?: string;
  ready: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: RetrievalSource[];
}

const suggestions = [
  "Объясни простыми словами",
  "Сделай 10 вопросов",
  "Что самое важное?",
  "К чему готовиться на защите?",
  "Какие термины надо выучить?"
];

export function ChatPanel({ collectionId, ready }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emptyText = useMemo(
    () =>
      ready
        ? "Задай вопрос или выбери быстрый промпт. Ответы будут сопровождаться источниками."
        : "Сначала загрузите и обработайте материалы.",
    [ready]
  );

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const message = input.trim();

    if (!ready || !collectionId) {
      setError("Материалы пока не обработаны.");
      return;
    }

    if (!message) return;

    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response: ChatResponse = await askDocument(collectionId, message);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer || "В загруженных материалах этого нет.",
          sources: response.sources
        }
      ]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Не удалось получить ответ модели.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel chatPanel">
      <div className="panelHeaderLine">
        <div>
          <p className="eyebrow">Чат с источниками</p>
          <h2>Чат по материалам</h2>
        </div>
        <span className={ready ? "successPill" : "softPill"}>{ready ? "Источники включены" : "Ждет материалы"}</span>
      </div>

      <div className="suggestionRow">
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => setInput(suggestion)} disabled={!ready}>
            {suggestion}
          </button>
        ))}
      </div>

      <div className="conversation">
        {!messages.length ? (
          <div className="chatEmpty">
            <MessageCircle size={34} aria-hidden="true" />
            <strong>Чат готов</strong>
            <span>{emptyText}</span>
          </div>
        ) : (
          messages.map((message, index) => (
            <article className={`messageBubble ${message.role}`} key={`${message.role}-${index}`}>
              <p>{message.content}</p>
              {message.role === "assistant" ? <SourcesList sources={message.sources} /> : null}
            </article>
          ))
        )}
        {isLoading ? <LoadingState title="Ищу ответ в материалах" detail="Сопоставляю вопрос с найденными фрагментами и готовлю ответ с источниками." /> : null}
      </div>

      {error ? <ErrorState message={error} /> : null}

      <form className="chatComposer" onSubmit={sendMessage}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Например: какие нормы или определения здесь ключевые?"
          disabled={!ready || isLoading}
          rows={3}
        />
        <button className="primaryButton" type="submit" disabled={!ready || !input.trim() || isLoading}>
          <Send size={16} aria-hidden="true" />
          Спросить
        </button>
      </form>
    </section>
  );
}
