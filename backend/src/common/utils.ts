export function normalizeStressPattern(
  pattern: number[] | string,
): string {
  if (Array.isArray(pattern)) {
    return pattern.map((digit) => (digit === 0 ? '0' : '1')).join('');
  }

  return pattern.replace(/[^01]/g, '');
}

export function extractLastWord(line: string): string {
  const words = line
    .trim()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const lastWord = words[words.length - 1] ?? '';
  return normalizeRhymeWord(lastWord);
}

export function normalizeRhymeWord(word: string): string {
  return word
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/[.,!?;:]+$/g, '');
}

export function wordLookupVariants(word: string): string[] {
  const normalized = normalizeRhymeWord(word).toLowerCase();
  const variants: string[] = [];

  const add = (value: string) => {
    if (value.length > 1 && !variants.includes(value)) {
      variants.push(value);
    }
  };

  add(normalized);

  // Contractions: aren't → are, don't → do, etc.
  if (normalized.includes("'")) {
    const expanded = normalized.replace(/n't$/, '').replace(/'s$/, '').replace(/'/g, '');
    add(expanded);
    if (normalized.endsWith("n't")) {
      add(normalized.slice(0, -3));
    }
  }

  if (normalized.endsWith("'s")) {
    add(normalized.slice(0, -2));
  }
  if (normalized.endsWith('ies')) {
    add(`${normalized.slice(0, -3)}y`);
  }
  if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
    add(normalized.slice(0, -1));
  }
  if (normalized.endsWith('es') && normalized.length > 3) {
    add(normalized.slice(0, -2));
    add(normalized.slice(0, -1));
  }
  if (normalized.endsWith('akes')) {
    add(`${normalized.slice(0, -1)}e`);
    add(normalized.slice(0, -2));
  }
  if (normalized.endsWith('ed')) {
    add(normalized.slice(0, -2));
    add(normalized.slice(0, -1));
  }
  if (normalized.endsWith('ing')) {
    add(normalized.slice(0, -3));
    add(`${normalized.slice(0, -3)}e`);
  }
  if (normalized.endsWith('ly')) {
    add(normalized.slice(0, -2));
  }

  return variants;
}

export function tokenizeLine(line: string): string[] {
  return line
    .trim()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function getRhymePairs(scheme: string): [number, number][] {
  const letters = scheme.toUpperCase().replace(/[^A-Z]/g, '').split('');
  const groups = new Map<string, number[]>();

  letters.forEach((letter, index) => {
    const existing = groups.get(letter) ?? [];
    existing.push(index);
    groups.set(letter, existing);
  });

  const pairs: [number, number][] = [];
  for (const indices of groups.values()) {
    for (let i = 0; i < indices.length; i += 1) {
      for (let j = i + 1; j < indices.length; j += 1) {
        pairs.push([indices[i], indices[j]]);
      }
    }
  }

  return pairs;
}
