import type { SQLiteDatabase } from 'expo-sqlite';

interface Migration {
  versao: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

const MIGRATIONS: Migration[] = [
  {
    versao: 1,
    up: async (db) => {
      const mapeamento: Array<[string, string]> = [
        ['Carnes', 'carnes'],
        ['Grãos', 'graos'],
        ['Tubérculos', 'tuberculos'],
        ['Frutas', 'frutas'],
        ['Laticínios', 'laticinios'],
        ['Vegetais', 'vegetais'],
        ['Outros', 'outros'],
      ];
      for (const [antigo, novo] of mapeamento) {
        await db.runAsync(
          `UPDATE alimentos SET categoria = ? WHERE categoria = ?`,
          [novo, antigo]
        );
      }
      const idsValidos = mapeamento.map(([_, v]) => v);
      const placeholders = idsValidos.map(() => '?').join(',');
      await db.runAsync(
        `UPDATE alimentos SET categoria = 'outros' WHERE categoria NOT IN (${placeholders})`,
        idsValidos
      );
    },
  },
  {
    versao: 2,
    up: async (db) => {
      const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(alimentos)`);
      const temUnidade = cols.some((c) => c.name === 'unidade');
      if (!temUnidade) {
        await db.runAsync(`ALTER TABLE alimentos ADD COLUMN unidade TEXT NOT NULL DEFAULT 'g'`);
      }
      await db.runAsync(`UPDATE alimentos SET unidade = 'g' WHERE unidade IS NULL OR unidade = ''`);
      await db.runAsync(`UPDATE alimentos SET unidade = 'g' WHERE unidade NOT IN ('g', 'ml')`);
    },
  },
];

export async function runMigrations(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ valor: string }>(
    `SELECT valor FROM meta WHERE chave = ?`, ['schema_version']
  );
  const atual = row?.valor ? parseInt(row.valor, 10) : 0;

  for (const m of MIGRATIONS) {
    if (m.versao > atual) {
      await db.withTransactionAsync(async () => {
        await m.up(db);
        await db.runAsync(
          `INSERT OR REPLACE INTO meta (chave, valor) VALUES (?, ?)`,
          ['schema_version', String(m.versao)]
        );
      });
    }
  }
}
