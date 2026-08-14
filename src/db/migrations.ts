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
      const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(alimentos)`);
      const temFator = cols.some((c) => c.name === 'fator_compra');
      if (!temFator) {
        await db.runAsync(`ALTER TABLE alimentos ADD COLUMN fator_compra REAL`);
      }

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
      const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(alimentos)`);
      const nomesCols = new Set(cols.map((c) => c.name));
      if (!nomesCols.has('fator_preparo')) {
        await db.runAsync(`ALTER TABLE alimentos ADD COLUMN fator_preparo REAL`);
      }
      if (!nomesCols.has('possui_fator')) {
        await db.runAsync(`ALTER TABLE alimentos ADD COLUMN possui_fator INTEGER NOT NULL DEFAULT 0`);
      }

      const remap: Array<[string, string]> = [
        ['graos', 'carboidratos'],
        ['tuberculos', 'carboidratos'],
        ['outros', 'carnes'],
      ];
      for (const [antiga, nova] of remap) {
        await db.runAsync(`UPDATE alimentos SET categoria = ? WHERE categoria = ?`, [nova, antiga]);
      }

      for (const nome of NOMES_SEED_V1_OBSOLETOS) {
        const row = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM alimentos WHERE nome = ? LIMIT 1`,
          [nome]
        );
        if (!row?.id) continue;
        await db.runAsync(`DELETE FROM alimentos_refeicao WHERE alimento_id = ?`, [row.id]);
        await db.runAsync(`DELETE FROM alimentos WHERE id = ?`, [row.id]);
      }

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

      await db.runAsync(
        `INSERT OR REPLACE INTO meta (chave, valor) VALUES (?, ?)`,
        ['seeded_v2', '1']
      );
    },
  },
  {
    versao: 5,
    up: async (db) => {
      const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(dietas)`);
      const nomesCols = new Set(cols.map((c) => c.name));

      const novasColunas: Array<[string, string]> = [
        ['target_calories',     'REAL'],
        ['target_protein_g',    'REAL'],
        ['target_carb_g',       'REAL'],
        ['target_fat_g',        'REAL'],
        ['target_goal',         'TEXT'],
        ['target_carb_profile', 'TEXT'],
      ];

      for (const [nome, tipo] of novasColunas) {
        if (!nomesCols.has(nome)) {
          await db.runAsync(`ALTER TABLE dietas ADD COLUMN ${nome} ${tipo}`);
        }
      }
    },
  },
  {
    versao: 6,
    up: async (db) => {
      await db.runAsync(
        `CREATE TABLE IF NOT EXISTS user_profile (
          id TEXT PRIMARY KEY,
          sex TEXT,
          age INTEGER,
          weight_kg REAL,
          height_cm REAL,
          activity_level TEXT,
          atualizada_em INTEGER NOT NULL
        );`
      );
    },
  },
  {
    versao: 7,
    up: async (db) => {
      // Guarda de idempotência: se dietas já tem duracao_tipo, o schema é moderno
      // (criado pelos CREATE_STATEMENTS atuais) — o rebuild seria destrutivo
      // porque a tabela nova não preserva as colunas duracao_*.
      const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(dietas)`);
      if (cols.some((c) => c.name === 'duracao_tipo')) return;

      await db.execAsync(`
        CREATE TABLE dietas_new (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          tipo TEXT,
          criada_em INTEGER NOT NULL,
          atualizada_em INTEGER NOT NULL,
          target_calories REAL,
          target_protein_g REAL,
          target_carb_g REAL,
          target_fat_g REAL,
          target_goal TEXT,
          target_carb_profile TEXT
        );

        INSERT INTO dietas_new
        SELECT id, nome, tipo, criada_em, atualizada_em,
               target_calories, target_protein_g, target_carb_g, target_fat_g,
               target_goal, target_carb_profile
        FROM dietas;

        DROP TABLE dietas;

        ALTER TABLE dietas_new RENAME TO dietas;
      `);
    },
  },
  {
    versao: 8,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS modelos_refeicao (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          criada_em INTEGER NOT NULL,
          atualizada_em INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS modelos_refeicao_alimentos (
          id TEXT PRIMARY KEY,
          modelo_id TEXT NOT NULL,
          alimento_id TEXT NOT NULL,
          ordem INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (modelo_id) REFERENCES modelos_refeicao(id) ON DELETE CASCADE,
          FOREIGN KEY (alimento_id) REFERENCES alimentos(id) ON DELETE RESTRICT
        );

        CREATE INDEX IF NOT EXISTS idx_mra_modelo
          ON modelos_refeicao_alimentos(modelo_id);
      `);
    },
  },
  {
    versao: 9,
    up: async (db) => {
      // Guarda de idempotência: schema fresh já cria user_profile com body_fat_pct
      const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(user_profile)`);
      if (cols.some((c) => c.name === 'body_fat_pct')) return;

      await db.execAsync(`
        ALTER TABLE user_profile ADD COLUMN body_fat_pct REAL;
      `);
    },
  },
  {
    versao: 10,
    up: async (db) => {
      // Detecção de estado: fresh install já tem refeicoes com semana_id
      const refCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(refeicoes)');
      const hasSemanaId = refCols.some((c) => c.name === 'semana_id');
      if (hasSemanaId) {
        // Fresh install: schema já correto, só garante o index
        await db.execAsync(
          'CREATE INDEX IF NOT EXISTS idx_refeicoes_semana_dia ON refeicoes(semana_id, dia);'
        );
        return;
      }

      // --- Banco existente: schema antigo com dieta_id ---

      // 1. Adiciona colunas de duração na tabela dietas (idempotente)
      const dietaCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(dietas)');
      const colNames = dietaCols.map((c) => c.name);
      if (!colNames.includes('duracao_tipo'))
        await db.runAsync(`ALTER TABLE dietas ADD COLUMN duracao_tipo TEXT NOT NULL DEFAULT 'indefinida'`);
      if (!colNames.includes('duracao_quantidade'))
        await db.runAsync(`ALTER TABLE dietas ADD COLUMN duracao_quantidade INTEGER`);
      if (!colNames.includes('duracao_dia_inicio'))
        await db.runAsync(`ALTER TABLE dietas ADD COLUMN duracao_dia_inicio TEXT`);

      // 2. Cria tabela semanas
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS semanas (
          id TEXT PRIMARY KEY,
          dieta_id TEXT NOT NULL,
          numero INTEGER NOT NULL,
          FOREIGN KEY (dieta_id) REFERENCES dietas(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_semanas_dieta ON semanas(dieta_id);
      `);

      // 3. Cria uma semana (numero=1) para cada dieta existente
      const dietas = await db.getAllAsync<{ id: string }>('SELECT id FROM dietas');
      const semanaMap = new Map<string, string>();
      for (const dieta of dietas) {
        // Idempotente: reaproveita semana existente se já foi criada
        const existente = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM semanas WHERE dieta_id = ? AND numero = 1', [dieta.id]
        );
        const semanaId = existente?.id ?? nanoid();
        if (!existente) {
          await db.runAsync(
            'INSERT INTO semanas (id, dieta_id, numero) VALUES (?, ?, 1)',
            [semanaId, dieta.id]
          );
        }
        semanaMap.set(dieta.id, semanaId);
      }

      // 4. Cria nova tabela refeicoes com semana_id
      await db.execAsync(`
        DROP TABLE IF EXISTS refeicoes_new;
        CREATE TABLE refeicoes_new (
          id TEXT PRIMARY KEY,
          semana_id TEXT NOT NULL,
          dia TEXT NOT NULL CHECK(dia IN ('segunda','terca','quarta','quinta','sexta','sabado','domingo')),
          nome TEXT NOT NULL,
          ordem INTEGER NOT NULL,
          dia_indice INTEGER,
          FOREIGN KEY (semana_id) REFERENCES semanas(id) ON DELETE CASCADE
        );
      `);

      // 5. Migra dados via semanaMap
      const refeicoes = await db.getAllAsync<{
        id: string; dieta_id: string; dia: string; nome: string; ordem: number;
      }>('SELECT id, dieta_id, dia, nome, ordem FROM refeicoes');

      for (const r of refeicoes) {
        const semanaId = semanaMap.get(r.dieta_id);
        if (!semanaId) continue;
        await db.runAsync(
          'INSERT OR IGNORE INTO refeicoes_new (id, semana_id, dia, nome, ordem) VALUES (?, ?, ?, ?, ?)',
          [r.id, semanaId, r.dia, r.nome, r.ordem]
        );
      }

      // 6. Troca as tabelas via rename.
      // ATENÇÃO: SQLite 3.26+ auto-atualiza FKs em outras tabelas quando uma tabela
      // é renomeada. O rename de refeicoes→backup vai reescrever o FK em
      // alimentos_refeicao para REFERENCES refeicoes_v9_backup(id). Por isso, a
      // migração v11 reconstrói alimentos_refeicao com o FK correto.
      await db.execAsync(`
        ALTER TABLE refeicoes RENAME TO refeicoes_v9_backup;
        ALTER TABLE refeicoes_new RENAME TO refeicoes;
        DROP TABLE refeicoes_v9_backup;
        CREATE INDEX IF NOT EXISTS idx_refeicoes_semana_dia ON refeicoes(semana_id, dia);
      `);
    },
  },
  {
    versao: 11,
    up: async (db) => {
      // Limpeza: drop do backup de v10 se sobrou por algum motivo
      await db.execAsync('DROP TABLE IF EXISTS refeicoes_v9_backup;');

      // Verifica se alimentos_refeicao tem FK quebrado (aponta para refeicoes_v9_backup)
      // causado pelo auto-update de FK do SQLite 3.26+ durante o rename da migração v10.
      const row = await db.getFirstAsync<{ sql: string }>(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='alimentos_refeicao'"
      );
      if (!row?.sql?.includes('refeicoes_v9_backup')) {
        // FK já correto (fresh install ou banco não afetado) — nada a fazer
        return;
      }

      // Reconstrói alimentos_refeicao com FK correto apontando para refeicoes
      await db.execAsync('DROP TABLE IF EXISTS alimentos_refeicao_new;');
      await db.execAsync(`
        CREATE TABLE alimentos_refeicao_new (
          id TEXT PRIMARY KEY,
          refeicao_id TEXT NOT NULL,
          alimento_id TEXT NOT NULL,
          quantidade REAL NOT NULL,
          ordem INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (refeicao_id) REFERENCES refeicoes(id) ON DELETE CASCADE,
          FOREIGN KEY (alimento_id) REFERENCES alimentos(id) ON DELETE RESTRICT
        );
      `);
      // Copia dados existentes (preserva alimentos já adicionados pelo usuário)
      await db.execAsync(
        'INSERT OR IGNORE INTO alimentos_refeicao_new SELECT * FROM alimentos_refeicao;'
      );
      await db.execAsync('DROP TABLE alimentos_refeicao;');
      // Rename seguro: nenhuma outra tabela tem FK apontando para alimentos_refeicao_new,
      // então o auto-update do SQLite 3.26+ não altera nada.
      await db.execAsync(
        'ALTER TABLE alimentos_refeicao_new RENAME TO alimentos_refeicao;'
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_alim_ref_refeicao ON alimentos_refeicao(refeicao_id);'
      );
    },
  },
];

/** Versão de schema que os CREATE_STATEMENTS atuais produzem.
 *  Derivada da última migration para nunca divergir. */
export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].versao;

/** Grava schema_version = latest sem rodar migrations.
 *  Usado em fresh install, onde o schema já nasce na versão final. */
export async function stampLatestSchemaVersion(db: SQLiteDatabase) {
  await db.runAsync(
    `INSERT OR REPLACE INTO meta (chave, valor) VALUES (?, ?)`,
    ['schema_version', String(LATEST_SCHEMA_VERSION)]
  );
}

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
