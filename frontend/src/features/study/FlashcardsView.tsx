import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { asText, itemFallback } from "./studyUtils";

interface FlashcardsViewProps {
  items: Record<string, unknown>[];
  requestedCount?: number;
  warning?: string;
}

export function FlashcardsView({ items, requestedCount, warning }: FlashcardsViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setFlipped] = useState(false);

  const currentItem = items[currentIndex];
  const total = items.length;

  useEffect(() => {
    setCurrentIndex(0);
    setFlipped(false);
  }, [items]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!total) return;
      if (event.code === "Space") {
        event.preventDefault();
        setFlipped((current) => !current);
      }
      if (event.key === "ArrowRight") {
        setCurrentIndex((current) => Math.min(current + 1, total - 1));
        setFlipped(false);
      }
      if (event.key === "ArrowLeft") {
        setCurrentIndex((current) => Math.max(current - 1, 0));
        setFlipped(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [total]);

  if (!items.length || !currentItem) {
    return <div className="emptyPanel">Карточки пока не сгенерированы.</div>;
  }

  const front = asText(currentItem.front || currentItem.term || currentItem.question, `Карточка ${currentIndex + 1}`);
  const back = asText(currentItem.back || currentItem.definition || currentItem.answer, itemFallback(currentItem));

  return (
    <div className="flashcardTrainer">
      {warning || (requestedCount && total < requestedCount) ? (
        <div className="emptyPanel">{warning || `По материалам получилось создать ${total} карточек из ${requestedCount} без повторов.`}</div>
      ) : null}

      <div className="trainerTopline">
        <strong>
          Карточка {currentIndex + 1} из {total}
        </strong>
        <span>Пробел — перевернуть, стрелки — переключать</span>
      </div>

      <button className={`trainerCard ${isFlipped ? "flipped" : ""}`} type="button" onClick={() => setFlipped((current) => !current)}>
        <span className="trainerCardFace front">
          <em>Вопрос</em>
          <strong>{front}</strong>
        </span>
        <span className="trainerCardFace back">
          <em>Ответ</em>
          <strong>{back}</strong>
        </span>
      </button>

      <div className="trainerControls">
        <button
          className="secondaryButton"
          type="button"
          onClick={() => {
            setCurrentIndex((current) => Math.max(current - 1, 0));
            setFlipped(false);
          }}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Предыдущая
        </button>
        <button className="primaryButton" type="button" onClick={() => setFlipped((current) => !current)}>
          <RotateCcw size={16} aria-hidden="true" />
          Перевернуть
        </button>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => {
            setCurrentIndex((current) => Math.min(current + 1, total - 1));
            setFlipped(false);
          }}
          disabled={currentIndex === total - 1}
        >
          Следующая
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="compactCardList">
        {items.map((item, index) => (
          <button
            className={index === currentIndex ? "active" : ""}
            key={`${asText(item.front || item.term || item.question, "card")}-${index}`}
            type="button"
            onClick={() => {
              setCurrentIndex(index);
              setFlipped(false);
            }}
          >
            <span>{index + 1}</span>
            {asText(item.front || item.term || item.question, `Карточка ${index + 1}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
