export function asText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

export function sourceIds(item: Record<string, unknown>): string[] {
  const direct = item.source_chunk_ids;
  const sources = item.sources;

  if (Array.isArray(direct)) {
    return direct.map((value) => asText(value)).filter(Boolean);
  }

  if (Array.isArray(sources)) {
    return sources
      .map((source) =>
        typeof source === "object" && source && "chunk_id" in source
          ? asText((source as { chunk_id?: unknown }).chunk_id)
          : asText(source)
      )
      .filter(Boolean);
  }

  return [];
}

export function sourceFiles(item: Record<string, unknown>): string[] {
  const direct = item.source_files;
  const sources = item.sources;

  if (Array.isArray(direct)) {
    return direct.map((value) => asText(value)).filter(Boolean);
  }

  if (Array.isArray(sources)) {
    return sources
      .map((source) =>
        typeof source === "object" && source && "filename" in source
          ? asText((source as { filename?: unknown }).filename)
          : ""
      )
      .filter(Boolean);
  }

  return [];
}

export function itemFallback(item: Record<string, unknown>): string {
  return JSON.stringify(item, null, 2);
}
