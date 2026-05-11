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
  totalQuantidade: number;
}

export interface GrupoCompra {
  categoria: Categoria;
  itens: ItemCompra[];
}

export function gerarListaCompras(
  dieta: Dieta,
  alimentosBase: Record<string, Alimento>
): GrupoCompra[] {
  const totais = new Map<string, number>();

  for (const dia of dieta.dias) {
    for (const refeicao of dia.refeicoes) {
      for (const item of refeicao.alimentos) {
        const atual = totais.get(item.alimentoId) ?? 0;
        totais.set(item.alimentoId, atual + item.quantidade);
      }
    }
  }

  if (totais.size === 0) return [];

  const itens: ItemCompra[] = [];
  for (const [alimentoId, totalQuantidade] of totais) {
    const base = alimentosBase[alimentoId];
    if (!base) continue;
    itens.push({
      alimentoId,
      nome: base.nome,
      categoriaId: resolveCategoria(base.categoria).id,
      unidade: base.unidade,
      totalQuantidade: Math.round(totalQuantidade * 10) / 10,
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
      linhas.push(`  • ${item.nome} — ${formatQuantidade(item.totalQuantidade, item.unidade)}`);
    }
    linhas.push('');
  }

  linhas.push('━━━━━━━━━━━━━━━━━━━━');
  linhas.push(`Total de itens: ${grupos.reduce((s, g) => s + g.itens.length, 0)}`);
  return linhas.join('\n').trimEnd();
}
