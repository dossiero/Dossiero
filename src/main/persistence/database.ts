import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { schema } from "./schema.js";

export type DossierDatabase = BetterSQLite3Database<typeof schema>;
export type DossierTransaction = Parameters<Parameters<DossierDatabase["transaction"]>[0]>[0];

export interface DatabaseConnection {
  orm: DossierDatabase;
  sqlite: Database.Database;
}

export function openDatabase(path: string): DatabaseConnection {
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  return {
    sqlite,
    orm: drizzle({
      client: sqlite,
      schema,
    }),
  };
}
