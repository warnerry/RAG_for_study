export function asText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

export function sourceIds(item: Record<string, unknown>): string[] {
  const direct = item.source_chunk_ids;
  if (!Array.isArray(direct)) return [];
  return direct.map((value) => asText(value)).filter(Boolean);
}

export function sourceFiles(item: Record<string, unknown>): string[] {
  const direct = item.source_files;
  if (!Array.isArray(direct)) return [];
  return direct.map((value) => asText(value)).filter(Boolean);
}

export function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (["true", "верно", "да", "yes"].some((token) => lower.includes(token))) return true;
    if (["false", "неверно", "нет", "no"].some((token) => lower.includes(token))) return false;
  }
  return null;
}
