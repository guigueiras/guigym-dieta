import { nanoid } from 'nanoid/non-secure';
import { getDatabase } from '../database';
import { resolveCategoria } from '@/constants/categorias';
import type { Alimento, UnidadeMedida } from '@/types';

interface AlimentoRow {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  proteina: number;
  carbo: number;
  gordura: number;
  criado_em: number;
}

function isUnidade(v: unknown): v is UnidadeMedida {
  return v === 'g' || v === 'ml';
}

function rowToAlimento(r: AlimentoRow): Alimento {
  return {
    id: r.id,
    nome: r.nome,
    categoria: resolveCategoria(r.categoria).id,
    unidade: isUnidade(r.unidade) ? r.unidade : 'g',
    proteina: r.proteina,
    carbo: r.carbo,
    gordura: r.gordura,
  };
}

export async function listAll(): Promise<Alimento[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AlimentoRow>(
    `SELECT * FROM alimentos ORDER BY nome COLLATE NOCASE ASC`
  );
  return rows.map(rowToAlimento);
}

export async function criar(input: Omit<Alimento, 'id'>): Promise<Alimento> {
  const db = await getDatabase();
  const id = nanoid();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO alimentos (id, nome, categoria, unidade, proteina, carbo, gordura, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.nome, input.categoria, input.unidade, input.proteina, input.carbo, input.gordura, now]
  );
  return { id, ...input };
}

export async function atualizar(id: string, input: Omit<Alimento, 'id'>): Promise<Alimento> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE alimentos
     SET nome = ?, categoria = ?, unidade = ?, proteina = ?, carbo = ?, gordura = ?
     WHERE id = ?`,
    [input.nome, input.categoria, input.unidade, input.proteina, input.carbo, input.gordura, id]
  );
  return { id, ...input };
}

export async function excluir(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM alimentos WHERE id = ?`, [id]);
}

export async function contarUsos(id: string): Promise<{ refeicoes: number; dietas: number }> {
  const db = await getDatabase();
  const refeicoesRow = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) as n FROM alimentos_refeicao WHERE alimento_id = ?`,
    [id]
  );
  const dietasRow = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(DISTINCT r.dieta_id) as n
     FROM alimentos_refeicao ar
     JOIN refeicoes r ON r.id = ar.refeicao_id
     WHERE ar.alimento_id = ?`,
    [id]
  );
  return {
    refeicoes: refeicoesRow?.n ?? 0,
    dietas: dietasRow?.n ?? 0,
  };
}
