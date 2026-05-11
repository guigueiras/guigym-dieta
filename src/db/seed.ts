import type { SQLiteDatabase } from 'expo-sqlite';
import { nanoid } from 'nanoid/non-secure';

const ALIMENTOS_BASE = [
  { nome: 'Peito de Frango',     categoria: 'carnes',      unidade: 'g',  proteina: 31,  carbo: 0,  gordura: 3.6 },
  { nome: 'Patinho Moído',       categoria: 'carnes',      unidade: 'g',  proteina: 21,  carbo: 0,  gordura: 7   },
  { nome: 'Arroz Branco Cozido', categoria: 'graos',       unidade: 'g',  proteina: 2.5, carbo: 28, gordura: 0.3 },
  { nome: 'Batata Doce Cozida',  categoria: 'tuberculos',  unidade: 'g',  proteina: 0.6, carbo: 20, gordura: 0.1 },
  { nome: 'Aveia',               categoria: 'graos',       unidade: 'g',  proteina: 13,  carbo: 67, gordura: 7   },
  { nome: 'Ovo Inteiro',         categoria: 'outros',      unidade: 'g',  proteina: 13,  carbo: 1,  gordura: 11  },
  { nome: 'Banana',              categoria: 'frutas',      unidade: 'g',  proteina: 1,   carbo: 23, gordura: 0.3 },
  { nome: 'Whey Protein',        categoria: 'outros',      unidade: 'g',  proteina: 75,  carbo: 8,  gordura: 5   },
] as const;

export async function runSeedIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM meta WHERE chave = ?', ['seeded_v1']
  );
  if (row?.valor === '1') return;

  await db.withTransactionAsync(async () => {
    const now = Date.now();
    for (const a of ALIMENTOS_BASE) {
      await db.runAsync(
        `INSERT INTO alimentos (id, nome, categoria, unidade, proteina, carbo, gordura, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [nanoid(), a.nome, a.categoria, a.unidade, a.proteina, a.carbo, a.gordura, now]
      );
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO meta (chave, valor) VALUES (?, ?)`,
      ['seeded_v1', '1']
    );
  });
}
