export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function matchTermo(alvo: string, termo: string): boolean {
  if (!termo) return true;
  return normalize(alvo).includes(normalize(termo));
}
