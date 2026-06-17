import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ContestGenerateResponse } from "../../api/types";
import { SourcesList } from "../../components/SourcesList";
import { asBoolean, asText, sourceFiles, sourceIds } from "./contestUtils";

interface TwoToOneViewProps {
  result: ContestGenerateResponse;
}

export function TwoToOneView({ result }: TwoToOneViewProps) {
  const questions = result.questions || [];
  const mistakeLimit = result.mistake_limit || 2;
  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  const mistakes = useMemo(
    () =>
      questions.reduce((count, item, index) => {
        if (!(index in answers)) return count;
        const correct = asBoolean(item.is_true ?? item.answer);
        if (correct === null) return count;
        return answers[index] === correct ? count : count + 1;
      }, 0),
    [answers, questions]
  );

  const isFinished = mistakes >= mistakeLimit;

  return (
    <div className="trainingView">
      <div className="trainingHeader">
        <div>
          <strong>2к1: верно или неверно</strong>
          <span>Ошибки: {mistakes}/{mistakeLimit}</span>
        </div>
        {isFinished ? <span className="dangerPill">Лимит ошибок достигнут</span> : <span className="successPill">В игре</span>}
      </div>

      <div className="questionGrid">
        {questions.map((item, index) => {
          const statement = asText(item.statement || item.question, `Утверждение ${index + 1}`);
          const explanation = asText(item.explanation || item.answer, "Пояснение не распознано.");
          const correct = asBoolean(item.is_true ?? item.answer);
          const selected = answers[index];
          const answered = typeof selected === "boolean";
          const isCorrect = correct === null ? null : selected === correct;

          return (
            <article className={`resultCard ${answered ? (isCorrect ? "correctCard" : "wrongCard") : ""}`} key={`${statement}-${index}`}>
              <div className="cardKicker">Раунд {index + 1}</div>
              <h3>{statement}</h3>
              <div className="binaryActions">
                <button type="button" disabled={isFinished || answered} onClick={() => setAnswers((current) => ({ ...current, [index]: true }))}>
                  <Check size={16} aria-hidden="true" />
                  Верно
                </button>
                <button type="button" disabled={isFinished || answered} onClick={() => setAnswers((current) => ({ ...current, [index]: false }))}>
                  <X size={16} aria-hidden="true" />
                  Неверно
                </button>
              </div>
              {answered ? (
                <div className="answerReveal">
                  <strong>{isCorrect === null ? "Ответ принят" : isCorrect ? "Правильно" : "Ошибка"}</strong>
                  <p>{explanation}</p>
                </div>
              ) : null}
              <SourcesList chunkIds={sourceIds(item)} files={sourceFiles(item)} />
            </article>
          );
        })}
      </div>
    </div>
  );
}
