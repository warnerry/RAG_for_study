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
      {sources.length ? <p className="sourcesIntro">Опора ответа</p> : null}
      {sources.map((source, index) => (
        <details key={`${source.chunk_id}-${index}`} className="sourceItem">
          <summary>
            {source.filename || "материал"}, фрагмент {index + 1}
          </summary>
          <p>{source.text}</p>
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
