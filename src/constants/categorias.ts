import { Beef, Wheat, Apple, Milk, Soup, Sprout, Droplets, Package } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

/**
 * Categorias enxutas (v2). Ordem segue lógica de mercado:
 * carnes → vegetais → frutas → carboidratos → laticínios → gorduras → molhos.
 *
 * Categorias legadas (v1) removidas — `graos`, `tuberculos`, `outros` —
 * são remapeadas em runtime via `resolveCategoria` (defesa pra alimentos
 * customizados antigos que ainda referenciem essas strings).
 */
export type CategoriaId =
  | 'carnes'
  | 'vegetais'
  | 'frutas'
  | 'carboidratos'
  | 'laticinios'
  | 'gorduras'
  | 'molhos';

export interface Categoria {
  id: CategoriaId;
  label: string;
  ordem: number;
  icon: LucideIcon;
  color: string;
  custom: false;
}

export const CATEGORIAS: readonly Categoria[] = [
  { id: 'carnes',       label: 'Carnes',       ordem: 0, icon: Beef,     color: '#DC2626', custom: false },
  { id: 'vegetais',     label: 'Vegetais',     ordem: 1, icon: Sprout,   color: '#10B981', custom: false },
  { id: 'frutas',       label: 'Frutas',       ordem: 2, icon: Apple,    color: '#16A34A', custom: false },
  { id: 'carboidratos', label: 'Carboidratos', ordem: 3, icon: Wheat,    color: '#D97706', custom: false },
  { id: 'laticinios',   label: 'Laticínios',   ordem: 4, icon: Milk,     color: '#2563EB', custom: false },
  { id: 'gorduras',     label: 'Gorduras',     ordem: 5, icon: Droplets, color: '#0891B2', custom: false },
  { id: 'molhos',       label: 'Molhos',       ordem: 6, icon: Soup,     color: '#7C3AED', custom: false },
] as const;

export const CATEGORIA_PADRAO: CategoriaId = 'carnes';

export const CATEGORIA_BY_ID: Record<CategoriaId, Categoria> = CATEGORIAS.reduce(
  (acc, c) => { acc[c.id] = c; return acc; },
  {} as Record<CategoriaId, Categoria>
);

export const CATEGORIA_IDS_ORDENADOS: readonly CategoriaId[] = CATEGORIAS.map((c) => c.id);

export function isCategoriaId(v: unknown): v is CategoriaId {
  return typeof v === 'string' && v in CATEGORIA_BY_ID;
}

/**
 * Remapeamento de IDs legados (v1) → atuais (v2).
 * Aplicado em runtime em todo read, garantindo que alimentos custom criados
 * antes da reforma de categorias continuem aparecendo numa categoria válida.
 */
const REMAP_LEGACY: Record<string, CategoriaId> = {
  graos: 'carboidratos',
  tuberculos: 'carboidratos',
  outros: 'carnes',
};

export function resolveCategoria(id: string | null | undefined): Categoria {
  if (id && isCategoriaId(id)) return CATEGORIA_BY_ID[id];
  if (id && id in REMAP_LEGACY) {
    return CATEGORIA_BY_ID[REMAP_LEGACY[id] as CategoriaId];
  }
  return CATEGORIA_BY_ID[CATEGORIA_PADRAO];
}

/**
 * Ícone "fallback" pra UIs que ainda não resolveram a categoria.
 * Não aparece em fluxos normais, só pra cobrir TypeScript em loadings.
 */
export const ICONE_FALLBACK = Package;

export function labelCategoria(id: CategoriaId): string {
  return CATEGORIA_BY_ID[id].label;
}
