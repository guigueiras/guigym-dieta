import * as SQLite from 'expo-sqlite';
import { CREATE_STATEMENTS } from './schema';
import { runMigrations } from './migrations';
import { runSeedIfNeeded } from './seed';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('guigym.db');

      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');

      for (const stmt of CREATE_STATEMENTS) {
        await db.execAsync(stmt);
      }

      await runMigrations(db);
      await runSeedIfNeeded(db);

      return db;
    })();
  }
  return dbPromise;
}
