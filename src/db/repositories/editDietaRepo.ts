import { getDatabase } from '../database';
import type { Dieta } from '@/types';

export async function salvarDietaCompleta(dieta: Dieta): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE dietas SET atualizada_em = ? WHERE id = ?`,
      [now, dieta.id]
    );

    for (const semana of dieta.semanas) {
      // Remove refeicoes antigas desta semana
      await db.runAsync(`DELETE FROM refeicoes WHERE semana_id = ?`, [semana.id]);

      for (const dia of semana.dias) {
        for (const ref of dia.refeicoes) {
          await db.runAsync(
            `INSERT INTO refeicoes (id, semana_id, dia, nome, ordem, dia_indice)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ref.id, semana.id, dia.nome, ref.nome, ref.ordem, dia.indice ?? null]
          );
          for (let i = 0; i < ref.alimentos.length; i++) {
            const a = ref.alimentos[i];
            await db.runAsync(
              `INSERT INTO alimentos_refeicao (id, refeicao_id, alimento_id, quantidade, ordem)
               VALUES (?, ?, ?, ?, ?)`,
              [a.id, ref.id, a.alimentoId, a.quantidade, i]
            );
          }
        }
      }
    }
  });
}
