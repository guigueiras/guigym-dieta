import type { SQLiteDatabase } from 'expo-sqlite';
import { nanoid } from 'nanoid/non-secure';
import { BASE_ALIMENTOS_V2 } from './baseAlimentos';

/**
 * Insere a base oficial em DBs zerados (instalação nova).
 *
 * Em DBs existentes que receberam a migration v4, este seed é no-op
 * (a migration v4 marca `seeded_v2 = '1'` em meta).
 *
 * A flag antiga `seeded_v1` é ignorada — só `seeded_v2` controla este seed.
 */
export async function runSeedIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM meta WHERE chave = ?', ['seeded_v2']
  );
  if (row?.valor === '1') return;

  await db.withTransactionAsync(async () => {
    const now = Date.now();
    for (const a of BASE_ALIMENTOS_V2) {
      // Pula se já existe com o mesmo nome (defesa contra race com migration).
      const existente = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM alimentos WHERE nome = ? LIMIT 1`,
        [a.nome]
      );
      if (existente?.id) continue;
      await db.runAsync(
        `INSERT INTO alimentos
           (id, nome, categoria, unidade, proteina, carbo, gordura, fator_preparo, possui_fator, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nanoid(),
          a.nome,
          a.categoria,
          a.unidade,
          a.proteina,
          a.carbo,
          a.gordura,
          a.fatorPreparo,
          a.possuiFator ? 1 : 0,
          now,
        ]
      );
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO meta (chave, valor) VALUES (?, ?)`,
      ['seeded_v2', '1']
    );
  });
}