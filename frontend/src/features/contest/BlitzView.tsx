import { Clock, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { ContestGenerateResponse } from "../../api/types";
import { asText } from "./contestUtils";

interface BlitzViewProps {
  result: ContestGenerateResponse;
}

export function BlitzView({ result }: BlitzViewProps) {
  const questions = result.questions || [];
  const initialSeconds = result.time_limit_seconds || 120;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [started, setStarted] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setStarted(false);
    setRevealed({});
  }, [initialSeconds, result]);

  useEffect(() => {
    if (!started || secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft, started]);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="trainingView">
      <div className="trainingHeader">
        <div>
          <strong>Блиц-тренировка</strong>
          <span>{questions.length || 0} коротких вопросов</span>
        </div>
        <div className={`timerBadge ${secondsLeft === 0 ? "expired" : ""}`}>
          <Clock size={16} aria-hidden="true" />
          {minutes}:{seconds}
        </div>
        <button className="primaryButton" type="button" onClick={() => setStarted(true)} disabled={started}>
          Старт
        </button>
      </div>

      <div className="questionGrid">
        {questions.map((item, index) => {
          const question = asText(item.question || item.statement, `Вопрос ${index + 1}`);
          const answer = asText(item.answer || item.explanation, "Ответ не распознан.");

          return (
            <article className="resultCard" key={`${question}-${index}`}>
              <div className="cardKicker">Блиц {index + 1}</div>
              <h3>{question}</h3>
              <button
                className="smallButton"
                type="button"
                onClick={() => setRevealed((current) => ({ ...current, [index]: !current[index] }))}
              >
                <Eye size={15} aria-hidden="true" />
                {revealed[index] ? "Скрыть ответ" : "Показать ответ"}
              </button>
              {revealed[index] ? <p>{answer}</p> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
