import type { CategoriaId } from '@/constants/categorias';

export type UnidadeMedida = 'g' | 'ml';

export const UNIDADE_PADRAO: UnidadeMedida = 'g';

/**
 * Modelo de domínio do alimento.
 *
 * REGRAS INVARIANTES:
 *  - Macros (proteina/carbo/gordura) SEMPRE são do alimento preparado/pronto.
 *  - `possuiFator: false` ⇒ `fatorPreparo` deve ser `null` (enforced no repository).
 *  - `possuiFator: true` ⇒ `fatorPreparo` é o coeficiente:
 *      pesoPreparado = pesoCru × fatorPreparo
 *      pesoCru       = pesoPreparado / fatorPreparo
 *  - `possuiFator: true` com `fatorPreparo: null` é estado "configuração pendente":
 *      a lista de compras usa o peso preparado direto (fallback seguro).
 */
export interface Alimento {
  id: string;
  nome: string;
  categoria: CategoriaId;
  unidade: UnidadeMedida;
  proteina: number;
  carbo: number;
  gordura: number;
  possuiFator: boolean;
  fatorPreparo: number | null;
}

export const UNIDADE_LABEL: Record<UnidadeMedida, string> = {
  g: 'g',
  ml: 'ml',
};

export const UNIDADE_LABEL_GRANDE: Record<UnidadeMedida, string> = {
  g: 'kg',
  ml: 'L',
};
