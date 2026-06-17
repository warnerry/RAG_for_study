import { HelpCircle } from "lucide-react";
import { asText, itemFallback } from "./studyUtils";

interface ExamQuestionsViewProps {
  items: Record<string, unknown>[];
  warning?: string;
}

export function ExamQuestionsView({ items, warning }: ExamQuestionsViewProps) {
  if (!items.length) {
    return <div className="emptyPanel">Вопросы пока не сгенерированы.</div>;
  }

  return (
    <div className="resultStack">
      {warning ? <div className="emptyPanel">{warning}</div> : null}
      <div className="questionGrid">
        {items.map((item, index) => {
          const question = asText(item.question || item.title, `Вопрос ${index + 1}`);
          const answer = asText(item.answer || item.content, itemFallback(item));
          const hint = asText(item.hint);

          return (
            <article className="resultCard questionCard" key={`${question}-${index}`}>
              <div className="cardKicker">
                <HelpCircle size={16} aria-hidden="true" />
                Вопрос {index + 1}
              </div>
              <h3>{question}</h3>
              {hint ? <p className="hintText">Подсказка: {hint}</p> : null}
              <details>
                <summary>Показать ответ</summary>
                <p>{answer}</p>
              </details>
            </article>
          );
        })}
      </div>
    </div>
  );
}
