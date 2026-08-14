import * as SQLite from 'expo-sqlite';
import { CREATE_STATEMENTS } from './schema';
import { runMigrations, stampLatestSchemaVersion } from './migrations';
import { runSeedIfNeeded } from './seed';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('guigym.db');

  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Detecta fresh install ANTES de criar tabelas: a tabela `meta` existe em
  // qualquer banco que já passou por um boot completo.
  const metaExists = await db.getFirstAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'meta'`
  );
  const isFresh = metaExists == null;

  for (const stmt of CREATE_STATEMENTS) {
    await db.execAsync(stmt);
  }

  if (isFresh) {
    // Schema fresh já nasce na versão final — migrations são só para bancos
    // antigos e seriam destrutivas aqui (ex: v7 rebuilda dietas sem duracao_*,
    // v9 tenta ADD COLUMN de coluna que já existe).
    await stampLatestSchemaVersion(db);
  } else {
    await runMigrations(db);
  }

  await runSeedIfNeeded(db);

  return db;
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = initDatabase().catch((err) => {
      // Não deixa uma promise rejeitada cacheada — permite retry no boot
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}
