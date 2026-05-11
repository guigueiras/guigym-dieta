import { nanoid } from 'nanoid/non-secure';
import { getDatabase } from '../database';
import { DIAS_SEMANA, REFEICOES_PADRAO } from '@/constants';
import type { Dieta, TipoDieta, DiaSemana } from '@/types';

export async function listAll(): Promise<Dieta[]> {
  const db = await getDatabase();
  const dietasRaw = await db.getAllAsync<{
    id: string; nome: string; tipo: TipoDieta; criada_em: number; atualizada_em: number;
  }>('SELECT * FROM dietas ORDER BY atualizada_em DESC');

  if (dietasRaw.length === 0) return [];

  const ids = dietasRaw.map((d) => d.id);
  const placeholders = ids.map(() => '?').join(',');

  const refsRaw = await db.getAllAsync<{
    id: string; dieta_id: string; dia: DiaSemana; nome: string; ordem: number;
  }>(`SELECT * FROM refeicoes WHERE dieta_id IN (${placeholders}) ORDER BY ordem ASC`, ids);

  const refIds = refsRaw.map((r) => r.id);
  const itensRaw = refIds.length === 0 ? [] : await db.getAllAsync<{
    id: string; refeicao_id: string; alimento_id: string; quantidade: number; ordem: number;
  }>(
    `SELECT * FROM alimentos_refeicao WHERE refeicao_id IN (${refIds.map(() => '?').join(',')}) ORDER BY ordem ASC`,
    refIds
  );

  return dietasRaw.map((d) => {
    const dias = DIAS_SEMANA.map((dia) => ({
      nome: dia.key as DiaSemana,
      refeicoes: refsRaw
        .filter((r) => r.dieta_id === d.id && r.dia === dia.key)
        .sort((a, b) => a.ordem - b.ordem)
        .map((r) => ({
          id: r.id,
          nome: r.nome,
          ordem: r.ordem,
          alimentos: itensRaw
            .filter((i) => i.refeicao_id === r.id)
            .sort((a, b) => a.ordem - b.ordem)
            .map((i) => ({
              id: i.id,
              alimentoId: i.alimento_id,
              quantidade: i.quantidade,
            })),
        })),
    }));

    return {
      id: d.id,
      nome: d.nome,
      tipo: d.tipo,
      dias,
      criadaEm: d.criada_em,
      atualizadaEm: d.atualizada_em,
    };
  });
}

export async function criar(nome: string, tipo: TipoDieta): Promise<Dieta> {
  const db = await getDatabase();
  const id = nanoid();
  const now = Date.now();

  const dias = DIAS_SEMANA.map((dia) => ({
    nome: dia.key as DiaSemana,
    refeicoes: REFEICOES_PADRAO.map((nomeRef, i) => ({
      id: nanoid(),
      nome: nomeRef,
      ordem: i,
      alimentos: [],
    })),
  }));

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO dietas (id, nome, tipo, criada_em, atualizada_em) VALUES (?, ?, ?, ?, ?)`,
      [id, nome, tipo, now, now]
    );
    for (const d of dias) {
      for (const r of d.refeicoes) {
        await db.runAsync(
          `INSERT INTO refeicoes (id, dieta_id, dia, nome, ordem) VALUES (?, ?, ?, ?, ?)`,
          [r.id, id, d.nome, r.nome, r.ordem]
        );
      }
    }
  });

  return { id, nome, tipo, dias, criadaEm: now, atualizadaEm: now };
}

export async function renomear(id: string, nome: string, tipo: TipoDieta): Promise<Dieta> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    `UPDATE dietas SET nome = ?, tipo = ?, atualizada_em = ? WHERE id = ?`,
    [nome, tipo, now, id]
  );
  const todas = await listAll();
  const found = todas.find((d) => d.id === id);
  if (!found) throw new Error('Dieta não encontrada após atualização');
  return found;
}

export async function excluir(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM dietas WHERE id = ?`, [id]);
}
