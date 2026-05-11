import type { UnidadeMedida } from '@/types';

export function formatQuantidade(qty: number, unidade: UnidadeMedida = 'g'): string {
  if (qty <= 0) return `0${unidade}`;

  const limite = 1000;
  if (qty >= limite) {
    const grande = qty / 1000;
    const fixed = grande.toFixed(1);
    const clean = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
    const sufixo = unidade === 'ml' ? 'L' : 'kg';
    return `${clean}${sufixo}`;
  }

  return `${Math.round(qty)}${unidade}`;
}

/** @deprecated Usar formatQuantidade(qty, unidade) */
export function formatGramas(g: number): string {
  return formatQuantidade(g, 'g');
}
