import type { SQLiteDatabase } from 'expo-sqlite';
import { nanoid } from 'nanoid/non-secure';
import { BASE_ALIMENTOS_V2, NOMES_SEED_V1_OBSOLETOS } from './baseAlimentos';

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
  {
    versao: 3,
    up: async (db) => {
      // Adiciona coluna fator_compra (REAL, nullable).
      const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(alimentos)`);
      const temFator = cols.some((c) => c.name === 'fator_compra');
      if (!temFator) {
        await db.runAsync(`ALTER TABLE alimentos ADD COLUMN fator_compra REAL`);
      }

      // Pré-preenche os alimentos seed (apenas se ainda não tiverem fator).
      // Se o usuário já editou algum desses, preservamos a escolha dele.
      const fatoresIniciais: Array<[string, number | null]> = [
        ['Peito de Frango',     1.43],
        ['Patinho Moído',       1.30],
        ['Arroz Branco Cozido', 0.33],
        ['Batata Doce Cozida',  0.95],
        ['Aveia',               null],
        ['Ovo Inteiro',         null],
        ['Banana',              null],
        ['Whey Protein',        null],
      ];
      for (const [nome, fator] of fatoresIniciais) {
        await db.runAsync(
          `UPDATE alimentos SET fator_compra = ? WHERE nome = ? AND fator_compra IS NULL`,
          [fator, nome]
        );
      }
    },
  },
  {
    versao: 4,
    up: async (db) => {
      // 1) Adiciona colunas novas (fator_preparo, possui_fator) idempotente.
      const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(alimentos)`);
      const nomesCols = new Set(cols.map((c) => c.name));
      if (!nomesCols.has('fator_preparo')) {
        await db.runAsync(`ALTER TABLE alimentos ADD COLUMN fator_preparo REAL`);
      }
      if (!nomesCols.has('possui_fator')) {
        await db.runAsync(`ALTER TABLE alimentos ADD COLUMN possui_fator INTEGER NOT NULL DEFAULT 0`);
      }

      // 2) Remapeia categorias legadas pra estrutura nova.
      const remap: Array<[string, string]> = [
        ['graos', 'carboidratos'],
        ['tuberculos', 'carboidratos'],
        ['outros', 'carnes'],
      ];
      for (const [antiga, nova] of remap) {
        await db.runAsync(`UPDATE alimentos SET categoria = ? WHERE categoria = ?`, [nova, antiga]);
      }

      // 3) Apaga o seed antigo (v1). Casa por nome EXATO — alimentos custom
      //    com nomes parecidos não são afetados. Apaga primeiro as referências
      //    em alimentos_refeicao pra não violar FK RESTRICT.
      for (const nome of NOMES_SEED_V1_OBSOLETOS) {
        const row = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM alimentos WHERE nome = ? LIMIT 1`,
          [nome]
        );
        if (!row?.id) continue;
        await db.runAsync(`DELETE FROM alimentos_refeicao WHERE alimento_id = ?`, [row.id]);
        await db.runAsync(`DELETE FROM alimentos WHERE id = ?`, [row.id]);
      }

      // 4) Insere base oficial v2. Idempotente por nome: se um custom já existe
      //    com o mesmo nome, preserva o existente (não sobrescreve).
      const now = Date.now();
      for (const a of BASE_ALIMENTOS_V2) {
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

      // 5) Marca seed v2 como aplicado pra o runSeedIfNeeded (no seed.ts) ser no-op.
      await db.runAsync(
        `INSERT OR REPLACE INTO meta (chave, valor) VALUES (?, ?)`,
        ['seeded_v2', '1']
      );
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
