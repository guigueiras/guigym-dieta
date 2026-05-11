import { getDatabase } from '../database';
import type { Dieta } from '@/types';

export async function salvarDietaCompleta(dieta: Dieta): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE dietas SET nome = ?, tipo = ?, atualizada_em = ? WHERE id = ?`,
      [dieta.nome, dieta.tipo, now, dieta.id]
    );
    await db.runAsync(`DELETE FROM refeicoes WHERE dieta_id = ?`, [dieta.id]);

    for (const dia of dieta.dias) {
      for (const ref of dia.refeicoes) {
        await db.runAsync(
          `INSERT INTO refeicoes (id, dieta_id, dia, nome, ordem) VALUES (?, ?, ?, ?, ?)`,
          [ref.id, dieta.id, dia.nome, ref.nome, ref.ordem]
        );
        for (let i = 0; i < ref.alimentos.length; i++) {
          const a = ref.alimentos[i];
          await db.runAsync(
            `INSERT INTO alimentos_refeicao (id, refeicao_id, alimento_id, quantidade, ordem) VALUES (?, ?, ?, ?, ?)`,
            [a.id, ref.id, a.alimentoId, a.quantidade, i]
          );
        }
      }
    }
  });
}
