import type { CategoriaId } from '@/constants/categorias';

export type UnidadeMedida = 'g' | 'ml';

export const UNIDADE_PADRAO: UnidadeMedida = 'g';

export interface Alimento {
  id: string;
  nome: string;
  categoria: CategoriaId;
  unidade: UnidadeMedida;
  proteina: number;
  carbo: number;
  gordura: number;
}

export const UNIDADE_LABEL: Record<UnidadeMedida, string> = {
  g: 'g',
  ml: 'ml',
};

export const UNIDADE_LABEL_GRANDE: Record<UnidadeMedida, string> = {
  g: 'kg',
  ml: 'L',
};
