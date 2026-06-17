import { RetrievalSource } from "../api/types";

interface SourcesListProps {
  sources?: RetrievalSource[];
  chunkIds?: string[];
  files?: string[];
}

export function SourcesList({ sources = [], chunkIds = [], files = [] }: SourcesListProps) {
  const ids = chunkIds.filter(Boolean);
  const filenames = [...new Set(files.filter(Boolean))];

  if (!sources.length && !ids.length && !filenames.length) {
    return null;
  }

  return (
    <div className="sourcesList">
      {sources.map((source, index) => (
        <details key={`${source.chunk_id}-${index}`} className="sourceItem">
          <summary>
            Источник: {source.filename || "материал"}, фрагмент {index + 1}
            <span>{source.chunk_id}</span>
          </summary>
          <p>{source.text}</p>
          {typeof source.score === "number" ? <small>Точность поиска: {source.score.toFixed(3)}</small> : null}
        </details>
      ))}
      {!sources.length &&
        (ids.length ? ids : filenames).map((chunkId, index) => (
          <span className="sourceChip" key={`${chunkId}-${index}`}>
            Источник: {filenames[index] || "материал"}
            {ids[index] ? `, фрагмент ${ids[index]}` : ""}
          </span>
        ))}
    </div>
  );
}
