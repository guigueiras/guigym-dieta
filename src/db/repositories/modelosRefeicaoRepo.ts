import { nanoid } from 'nanoid/non-secure';
import { getDatabase } from '@/db/database';
import type { ModeloRefeicao, ModeloAlimento } from '@/types/modeloRefeicao';

// ─── Leitura ───────────────────────────────────────────────

interface ModeloRow {
  id: string;
  nome: string;
  criada_em: number;
  atualizada_em: number;
}

interface ModeloAlimentoRow {
  id: string;
  modelo_id: string;
  alimento_id: string;
  ordem: number;
}

async function fetchAlimentos(
  db: Awaited<ReturnType<typeof getDatabase>>,
  modeloId: string
): Promise<ModeloAlimento[]> {
  const rows = await db.getAllAsync<ModeloAlimentoRow>(
    `SELECT id, modelo_id, alimento_id, ordem
     FROM modelos_refeicao_alimentos
     WHERE modelo_id = ?
     ORDER BY ordem ASC`,
    [modeloId]
  );
  return rows.map((r) => ({ id: r.id, alimentoId: r.alimento_id, ordem: r.ordem }));
}

export async function listAll(): Promise<ModeloRefeicao[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ModeloRow>(
    `SELECT id, nome, criada_em, atualizada_em FROM modelos_refeicao ORDER BY nome ASC`
  );
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      nome: r.nome,
      criadaEm: r.criada_em,
      atualizadaEm: r.atualizada_em,
      alimentos: await fetchAlimentos(db, r.id),
    }))
  );
}

export async function getById(id: string): Promise<ModeloRefeicao | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ModeloRow>(
    `SELECT id, nome, criada_em, atualizada_em FROM modelos_refeicao WHERE id = ?`,
    [id]
  );
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    criadaEm: row.criada_em,
    atualizadaEm: row.atualizada_em,
    alimentos: await fetchAlimentos(db, row.id),
  };
}

// ─── Modelos ───────────────────────────────────────────────

export async function criar(nome: string): Promise<ModeloRefeicao> {
  const db = await getDatabase();
  const id = nanoid();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO modelos_refeicao (id, nome, criada_em, atualizada_em) VALUES (?, ?, ?, ?)`,
    [id, nome.trim(), now, now]
  );
  return { id, nome: nome.trim(), criadaEm: now, atualizadaEm: now, alimentos: [] };
}

export async function renomear(id: string, nome: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE modelos_refeicao SET nome = ?, atualizada_em = ? WHERE id = ?`,
    [nome.trim(), Date.now(), id]
  );
}

export async function excluir(id: string): Promise<void> {
  const db = await getDatabase();
  // alimentos do modelo removidos via CASCADE
  await db.runAsync(`DELETE FROM modelos_refeicao WHERE id = ?`, [id]);
}

// ─── Alimentos do modelo ───────────────────────────────────

export async function adicionarAlimento(
  modeloId: string,
  alimentoId: string
): Promise<ModeloAlimento> {
  const db = await getDatabase();
  const maxRow = await db.getFirstAsync<{ max_ordem: number | null }>(
    `SELECT MAX(ordem) as max_ordem FROM modelos_refeicao_alimentos WHERE modelo_id = ?`,
    [modeloId]
  );
  const ordem = (maxRow?.max_ordem ?? -1) + 1;
  const id = nanoid();
  await db.runAsync(
    `INSERT INTO modelos_refeicao_alimentos (id, modelo_id, alimento_id, ordem) VALUES (?, ?, ?, ?)`,
    [id, modeloId, alimentoId, ordem]
  );
  await db.runAsync(
    `UPDATE modelos_refeicao SET atualizada_em = ? WHERE id = ?`,
    [Date.now(), modeloId]
  );
  return { id, alimentoId, ordem };
}

export async function removerAlimento(
  modeloAlimentoId: string,
  modeloId: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM modelos_refeicao_alimentos WHERE id = ?`,
    [modeloAlimentoId]
  );
  await db.runAsync(
    `UPDATE modelos_refeicao SET atualizada_em = ? WHERE id = ?`,
    [Date.now(), modeloId]
  );
}

// ─── Contagem de usos (para bloquear exclusão de alimento base) ───

export async function contarUsosAlimento(alimentoId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM modelos_refeicao_alimentos WHERE alimento_id = ?`,
    [alimentoId]
  );
  return row?.total ?? 0;
}

export async function modelosQueUsamAlimento(
  alimentoId: string
): Promise<{ id: string; nome: string }[]> {
  const db = await getDatabase();
  return db.getAllAsync<{ id: string; nome: string }>(
    `SELECT mr.id, mr.nome
     FROM modelos_refeicao mr
     JOIN modelos_refeicao_alimentos mra ON mra.modelo_id = mr.id
     WHERE mra.alimento_id = ?
     ORDER BY mr.nome ASC`,
    [alimentoId]
  );
}
