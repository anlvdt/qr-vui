/** Vietnamese search also accepts unaccented text and either form of đ. */
export function normalizeArtSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().trim();
}

export function matchesArtSearch(fields: string[], query: string): boolean {
  const text = normalizeArtSearch(fields.join(" "));
  return normalizeArtSearch(query).split(/\s+/).every((word) => text.includes(word));
}

/** Exact keywords and whole words precede incidental substring matches. */
export function artSearchScore(fields: string[], query: string, keywords: string[] = []): number {
  if (!matchesArtSearch([...fields, ...keywords], query)) return 0;
  const words = normalizeArtSearch(query).split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  const tags = normalizeArtSearch(keywords.join(" ")).split(/[^a-z0-9]+/);
  return words.reduce((score, word) => {
    if (tags.includes(word)) return score + 120;
    const fieldScores = fields.map((field, index) => {
      const text = normalizeArtSearch(field);
      const tokens = text.split(/[^a-z0-9]+/);
      if (tokens.includes(word)) return index === 0 ? 80 : 50;
      if (tokens.some((token) => token.startsWith(word))) return 25;
      return text.includes(word) ? 10 : 0;
    });
    return score + Math.max(...fieldScores, 0);
  }, 0);
}
