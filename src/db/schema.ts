export const CREATE_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS alimentos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    unidade TEXT NOT NULL DEFAULT 'g' CHECK(unidade IN ('g', 'ml')),
    proteina REAL NOT NULL DEFAULT 0,
    carbo REAL NOT NULL DEFAULT 0,
    gordura REAL NOT NULL DEFAULT 0,
    fator_compra REAL,
    fator_preparo REAL,
    possui_fator INTEGER NOT NULL DEFAULT 0,
    criado_em INTEGER NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_alimentos_nome ON alimentos(nome);`,

  `CREATE TABLE IF NOT EXISTS dietas (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    criada_em INTEGER NOT NULL,
    atualizada_em INTEGER NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS refeicoes (
    id TEXT PRIMARY KEY,
    dieta_id TEXT NOT NULL,
    dia TEXT NOT NULL CHECK(dia IN ('segunda','terca','quarta','quinta','sexta','sabado','domingo')),
    nome TEXT NOT NULL,
    ordem INTEGER NOT NULL,
    FOREIGN KEY (dieta_id) REFERENCES dietas(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_refeicoes_dieta_dia ON refeicoes(dieta_id, dia);`,

  `CREATE TABLE IF NOT EXISTS alimentos_refeicao (
    id TEXT PRIMARY KEY,
    refeicao_id TEXT NOT NULL,
    alimento_id TEXT NOT NULL,
    quantidade REAL NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (refeicao_id) REFERENCES refeicoes(id) ON DELETE CASCADE,
    FOREIGN KEY (alimento_id) REFERENCES alimentos(id) ON DELETE RESTRICT
  );`,
  `CREATE INDEX IF NOT EXISTS idx_alim_ref_refeicao ON alimentos_refeicao(refeicao_id);`,

  `CREATE TABLE IF NOT EXISTS meta (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS categorias_custom (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 1000,
    cor TEXT,
    icone TEXT,
    criada_em INTEGER NOT NULL
  );`,
];
