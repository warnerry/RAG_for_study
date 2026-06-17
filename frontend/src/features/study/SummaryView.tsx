import { SourcesList } from "../../components/SourcesList";
import { StudyGenerateResponse } from "../../api/types";
import { asText, itemFallback, sourceFiles, sourceIds } from "./studyUtils";

interface SummaryViewProps {
  result: StudyGenerateResponse;
}

export function SummaryView({ result }: SummaryViewProps) {
  const sections = Array.isArray(result.sections) && result.sections.length ? result.sections : result.items;
  const sourceIdsFromResult = Array.isArray(result.sources)
    ? result.sources
        .map((source) =>
          typeof source === "object" && source && "chunk_id" in source ? asText((source as { chunk_id?: unknown }).chunk_id) : ""
        )
        .filter(Boolean)
    : [];
  const sourceFilesFromResult = Array.isArray(result.sources)
    ? result.sources
        .map((source) =>
          typeof source === "object" && source && "filename" in source ? asText((source as { filename?: unknown }).filename) : ""
        )
        .filter(Boolean)
    : [];

  if (!sections.length) {
    return <div className="emptyPanel">Не получилось собрать пересказ. Попробуйте включить улучшенную генерацию.</div>;
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
            <SourcesList chunkIds={sourceIds(item)} files={sourceFiles(item)} />
          </article>
        );
      })}
      <SourcesList chunkIds={sourceIdsFromResult} files={sourceFilesFromResult} />
    </div>
  );
}
