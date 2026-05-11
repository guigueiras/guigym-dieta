import { Beef, Wheat, Carrot, Apple, Milk, Sprout, Package } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export type CategoriaId =
  | 'carnes'
  | 'graos'
  | 'tuberculos'
  | 'frutas'
  | 'laticinios'
  | 'vegetais'
  | 'outros';

export interface Categoria {
  id: CategoriaId;
  label: string;
  ordem: number;
  icon: LucideIcon;
  color: string;
  custom: false;
}

export const CATEGORIAS: readonly Categoria[] = [
  { id: 'carnes',      label: 'Carnes',      ordem: 0, icon: Beef,    color: '#DC2626', custom: false },
  { id: 'graos',       label: 'Grãos',       ordem: 1, icon: Wheat,   color: '#D97706', custom: false },
  { id: 'tuberculos',  label: 'Tubérculos',  ordem: 2, icon: Carrot,  color: '#EA580C', custom: false },
  { id: 'frutas',      label: 'Frutas',      ordem: 3, icon: Apple,   color: '#16A34A', custom: false },
  { id: 'laticinios',  label: 'Laticínios',  ordem: 4, icon: Milk,    color: '#2563EB', custom: false },
  { id: 'vegetais',    label: 'Vegetais',    ordem: 5, icon: Sprout,  color: '#10B981', custom: false },
  { id: 'outros',      label: 'Outros',      ordem: 6, icon: Package, color: '#64748B', custom: false },
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

export function resolveCategoria(id: string | null | undefined): Categoria {
  if (id && isCategoriaId(id)) return CATEGORIA_BY_ID[id];
  return CATEGORIA_BY_ID.outros;
}

export function labelCategoria(id: CategoriaId): string {
  return CATEGORIA_BY_ID[id].label;
}
