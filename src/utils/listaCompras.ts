import type { Dieta, Alimento, UnidadeMedida } from '@/types';
import {
  CATEGORIA_BY_ID,
  CATEGORIA_IDS_ORDENADOS,
  resolveCategoria,
  type Categoria,
  type CategoriaId,
} from '@/constants/categorias';
import { formatQuantidade } from './format';

export interface ItemCompra {
  alimentoId: string;
  nome: string;
  categoriaId: CategoriaId;
  unidade: UnidadeMedida;
  /** Soma de quantidades nas refeições, no estado preparado. */
  totalPreparado: number;
  /**
   * Quantidade de compra:
   *  - Se temConversao=true: `totalPreparado / fatorPreparo` (peso CRU).
   *  - Se temConversao=false: igual a totalPreparado.
   */
  totalCompra: number;
  /** True se possuiFator E fatorPreparo é válido. */
  temConversao: boolean;
}

export interface GrupoCompra {
  categoria: Categoria;
  itens: ItemCompra[];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Calcula lista de compras consolidada.
 *
 * Fórmula:
 *   pesoCru = pesoPreparado / fatorPreparo
 *
 * Fallback seguro: sem fator ou fator inválido → usa preparado direto.
 */
export function gerarListaCompras(
  dieta: Dieta,
  alimentosBase: Record<string, Alimento>
): GrupoCompra[] {
  const totaisPreparado = new Map<string, number>();

  for (const semana of dieta.semanas) {
  for (const dia of semana.dias) {
    for (const refeicao of dia.refeicoes) {
      for (const item of refeicao.alimentos) {
        const atual = totaisPreparado.get(item.alimentoId) ?? 0;
        totaisPreparado.set(item.alimentoId, atual + item.quantidade);
      }
    }
  }
  }

  if (totaisPreparado.size === 0) return [];

  const itens: ItemCompra[] = [];
  for (const [alimentoId, totalPrep] of totaisPreparado) {
    const base = alimentosBase[alimentoId];
    if (!base) continue;

    const fatorValido =
      base.possuiFator &&
      base.fatorPreparo != null &&
      Number.isFinite(base.fatorPreparo) &&
      base.fatorPreparo > 0;

    const totalCompra = fatorValido
      ? totalPrep / (base.fatorPreparo as number)
      : totalPrep;

    itens.push({
      alimentoId,
      nome: base.nome,
      categoriaId: resolveCategoria(base.categoria).id,
      unidade: base.unidade,
      totalPreparado: round1(totalPrep),
      totalCompra: round1(totalCompra),
      temConversao: fatorValido,
    });
  }

  const porCategoria = new Map<CategoriaId, ItemCompra[]>();
  for (const id of CATEGORIA_IDS_ORDENADOS) porCategoria.set(id, []);
  for (const item of itens) porCategoria.get(item.categoriaId)?.push(item);

  const grupos: GrupoCompra[] = [];
  for (const id of CATEGORIA_IDS_ORDENADOS) {
    const lista = porCategoria.get(id) ?? [];
    if (lista.length === 0) continue;
    lista.sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    );
    grupos.push({ categoria: CATEGORIA_BY_ID[id], itens: lista });
  }
  return grupos;
}

export function listaComprasParaTexto(
  dietaNome: string,
  grupos: GrupoCompra[]
): string {
  const linhas: string[] = [];
  linhas.push(`🛒 Lista de Compras — ${dietaNome}`);
  linhas.push(`Planejamento semanal`);
  linhas.push('━━━━━━━━━━━━━━━━━━━━');
  linhas.push('');

  for (const grupo of grupos) {
    linhas.push(`▸ ${grupo.categoria.label.toUpperCase()}`);
    for (const item of grupo.itens) {
      const qtdCompra = formatQuantidade(item.totalCompra, item.unidade);
      if (item.temConversao && item.totalCompra !== item.totalPreparado) {
        const qtdPrep = formatQuantidade(item.totalPreparado, item.unidade);
        linhas.push(`  • ${item.nome} — ${qtdCompra} cru (≈ ${qtdPrep} preparado)`);
      } else {
        linhas.push(`  • ${item.nome} — ${qtdCompra}`);
      }
    }
    linhas.push('');
  }

  linhas.push('━━━━━━━━━━━━━━━━━━━━');
  linhas.push(`Total de itens: ${grupos.reduce((s, g) => s + g.itens.length, 0)}`);
  return linhas.join('\n').trimEnd();
}