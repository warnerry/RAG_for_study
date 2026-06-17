import { StudyGenerateResponse } from "../../api/types";
import { asText, itemFallback } from "./studyUtils";

interface SummaryViewProps {
  result: StudyGenerateResponse;
}

export function SummaryView({ result }: SummaryViewProps) {
  const sections = Array.isArray(result.sections) && result.sections.length ? result.sections : result.items;
  if (!sections.length) {
    return <div className="emptyPanel">Не получилось собрать пересказ. Попробуйте сгенерировать еще раз.</div>;
  }

  return (
    <div className="resultStack summaryStack">
      {result.title ? <h3 className="resultTitle">{result.title}</h3> : null}
      {sections.map((item, index) => {
        const title = asText(item.title, `Раздел ${index + 1}`);
        const content = asText(item.content || item.summary || item.text, itemFallback(item));
        const listItems = Array.isArray(item.items) ? item.items.map((value) => asText(value)).filter(Boolean) : [];

        return (
          <article className="resultCard" key={`${title}-${index}`}>
            <h3>{title}</h3>
            {listItems.length ? (
              <ul className="cleanList">
                {listItems.map((value, itemIndex) => (
                  <li key={`${value}-${itemIndex}`}>{value}</li>
                ))}
              </ul>
            ) : (
              <p>{content}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
