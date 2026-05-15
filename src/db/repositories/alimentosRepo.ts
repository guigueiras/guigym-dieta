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
  fator_preparo: number | null;
  possui_fator: number; // 0 ou 1
  criado_em: number;
}

function isUnidade(v: unknown): v is UnidadeMedida {
  return v === 'g' || v === 'ml';
}

/**
 * Range válido para `fatorPreparo`:
 *  - Min 0.05  (perda extrema: chá seco, café etc)
 *  - Max 20    (ganho extremo: cogumelo desidratado → fresco)
 *
 * 1.00 é VÁLIDO ("conversão neutra" — alimento muda de estado mas mantém peso).
 */
const FATOR_PREPARO_MIN = 0.05;
const FATOR_PREPARO_MAX = 20;

/**
 * Sanitiza fatorPreparo defensivamente:
 *  - null/undefined/NaN/Infinity/≤0 → null
 *  - fora do range → null
 *  - válido → arredondado pra 4 casas decimais
 */
function sanitizeFatorPreparo(v: number | null | undefined): number | null {
  if (v == null) return null;
  if (!Number.isFinite(v)) return null;
  if (v <= 0) return null;
  if (v < FATOR_PREPARO_MIN || v > FATOR_PREPARO_MAX) return null;
  return Math.round(v * 10000) / 10000;
}

/**
 * Normaliza o par (possuiFator, fatorPreparo) garantindo consistência:
 *  - possuiFator=false → fatorPreparo forçado a null
 *  - possuiFator=true + fator inválido → fator vira null (estado "pendente")
 *
 * Single source of truth de validação do fator.
 */
function normalizarFator(
  possuiFator: boolean,
  fatorPreparo: number | null | undefined
): { possuiFator: boolean; fatorPreparo: number | null } {
  if (!possuiFator) {
    return { possuiFator: false, fatorPreparo: null };
  }
  return { possuiFator: true, fatorPreparo: sanitizeFatorPreparo(fatorPreparo) };
}

function rowToAlimento(r: AlimentoRow): Alimento {
  const possui = r.possui_fator === 1;
  const { possuiFator, fatorPreparo } = normalizarFator(possui, r.fator_preparo);
  return {
    id: r.id,
    nome: r.nome,
    categoria: resolveCategoria(r.categoria).id,
    unidade: isUnidade(r.unidade) ? r.unidade : 'g',
    proteina: r.proteina,
    carbo: r.carbo,
    gordura: r.gordura,
    possuiFator,
    fatorPreparo,
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
  const { possuiFator, fatorPreparo } = normalizarFator(input.possuiFator, input.fatorPreparo);
  await db.runAsync(
    `INSERT INTO alimentos
       (id, nome, categoria, unidade, proteina, carbo, gordura, fator_preparo, possui_fator, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.nome,
      input.categoria,
      input.unidade,
      input.proteina,
      input.carbo,
      input.gordura,
      fatorPreparo,
      possuiFator ? 1 : 0,
      now,
    ]
  );
  return { id, ...input, possuiFator, fatorPreparo };
}

export async function atualizar(id: string, input: Omit<Alimento, 'id'>): Promise<Alimento> {
  const db = await getDatabase();
  const { possuiFator, fatorPreparo } = normalizarFator(input.possuiFator, input.fatorPreparo);
  await db.runAsync(
    `UPDATE alimentos
     SET nome = ?, categoria = ?, unidade = ?, proteina = ?, carbo = ?, gordura = ?,
         fator_preparo = ?, possui_fator = ?
     WHERE id = ?`,
    [
      input.nome,
      input.categoria,
      input.unidade,
      input.proteina,
      input.carbo,
      input.gordura,
      fatorPreparo,
      possuiFator ? 1 : 0,
      id,
    ]
  );
  return { id, ...input, possuiFator, fatorPreparo };
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

// Re-exports pra módulos externos validarem fator com a mesma regra do repo.
export { sanitizeFatorPreparo, normalizarFator, FATOR_PREPARO_MIN, FATOR_PREPARO_MAX };