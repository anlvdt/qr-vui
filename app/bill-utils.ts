const MAX_BILL_TOTAL = 9_999_999_999_999;

function foldReceiptText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\bo(?=\d)/g, "0");
}

function moneyCandidates(line: string) {
  return [...line.matchAll(/(?:^|[^\d])([\d][\d\s.,]{2,}[\d]|\d{4,})(?=$|[^\d])/g)]
    .map((match) => {
      const raw = match[1];
      const digits = raw.replace(/\D/g, "");
      const value = Number(digits);
      return { digits, value };
    })
    .filter(({ digits, value }) => digits.length >= 4 && digits.length <= 13 && value >= 5_000 && value <= MAX_BILL_TOTAL);
}

export function extractReceiptTotal(text: string): string | null {
  const lines = text.replace(/\u00a0/g, " ").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return null;

  const scored: Array<{ digits: string; value: number; score: number; order: number }> = [];
  lines.forEach((line, index) => {
    const folded = foldReceiptText(line);
    const previousLine = lines[index - 1] ?? "";
    const previousFolded = foldReceiptText(previousLine);
    const candidates = moneyCandidates(line);
    const strongTotalPattern = /tong\s*(thanh\s*toan|phai\s*tra)|grand\s*total|amount\s*due|total\s*due/;
    const totalPattern = /tong\s*(cong|tien)|thanh\s*tien|\btotal\b|can\s*thanh\s*toan/;
    const isStrongTotal = strongTotalPattern.test(folded);
    const isTotal = totalPattern.test(folded);
    const previousIsLabelOnly = moneyCandidates(previousLine).length === 0;
    const inheritsStrongTotal = previousIsLabelOnly && strongTotalPattern.test(previousFolded);
    const inheritsTotal = previousIsLabelOnly && totalPattern.test(previousFolded);
    const isSubtotal = /tam\s*tinh|subtotal|truoc\s*thue/.test(folded);
    const isDistractor = /ma\s*(hd|hoa\s*don)|so\s*hoa\s*don|invoice|mst|tax\s*code|ngay|date|gio|time|tien\s*khach\s*dua|khach\s*dua|tien\s*nhan|tien\s*thoi|\bcash\b|\breceived\b|\bchange\b|tendered/.test(folded);
    const hasCurrency = /(?:₫|\bd\b|vnd|dong)/i.test(folded);
    const nearEnd = index / Math.max(1, lines.length - 1);

    candidates.forEach((candidate, candidateIndex) => {
      let score = 0;
      if (isStrongTotal) score += 120;
      else if (isTotal) score += 75;
      else if (inheritsStrongTotal) score += 105;
      else if (inheritsTotal) score += 65;
      if (isSubtotal) score -= 45;
      if (isDistractor) score -= 120;
      if (hasCurrency) score += 18;
      if (nearEnd >= 0.6) score += 12;
      if (candidateIndex === candidates.length - 1) score += 8;
      if (candidate.digits.length >= 5) score += 4;
      scored.push({ ...candidate, score, order: index * 10 + candidateIndex });
    });
  });

  const reliable = scored.filter((candidate) => candidate.score >= 50);
  const pool = reliable.length ? reliable : scored.filter((candidate) => candidate.score >= 20);
  if (!pool.length) return null;
  pool.sort((a, b) => b.score - a.score || b.order - a.order || b.value - a.value);
  return pool[0].digits;
}

export function splitBillEvenly(total: number, people: number) {
  if (!Number.isSafeInteger(total) || total <= 0 || !Number.isInteger(people) || people < 2 || people > 30) return [];
  const base = Math.floor(total / people);
  const remainder = total % people;
  return Array.from({ length: people }, (_, index) => base + (index < remainder ? 1 : 0));
}
