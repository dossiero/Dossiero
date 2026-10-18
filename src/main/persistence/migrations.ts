import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import {
  GENERAL_CASE_DESCRIPTION,
  GENERAL_CASE_TITLE,
} from "../../shared/cases.js";

export function migrateDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
  `);
  const version =
    (db.prepare("SELECT COALESCE(MAX(version), 0) AS version FROM migrations").get() as {
      version: number;
    }).version;
  if (version < 1) {
    db.exec(`
      CREATE TABLE people (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, aliases_json TEXT NOT NULL DEFAULT '[]', birth_date TEXT,
        location TEXT NOT NULL DEFAULT '', summary TEXT NOT NULL DEFAULT '', secondary TEXT NOT NULL DEFAULT '',
        profile_photo_id TEXT, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE person_tabs (
        id TEXT PRIMARY KEY, person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        name TEXT NOT NULL, kind TEXT NOT NULL, position INTEGER NOT NULL, is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE text_entries (
        id TEXT PRIMARY KEY, person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        tab_id TEXT NOT NULL REFERENCES person_tabs(id) ON DELETE CASCADE, title TEXT NOT NULL, body TEXT NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE media_items (
        id TEXT PRIMARY KEY, person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        tab_id TEXT NOT NULL REFERENCES person_tabs(id) ON DELETE CASCADE, original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL, size INTEGER NOT NULL,
        caption TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', imported_at TEXT NOT NULL
      );
      CREATE TABLE links (
        id TEXT PRIMARY KEY, person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        tab_id TEXT NOT NULL REFERENCES person_tabs(id) ON DELETE CASCADE, label TEXT NOT NULL, url TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '', sync_status TEXT NOT NULL DEFAULT 'unsupported',
        sync_metadata_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE tags (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);
      CREATE TABLE media_tags (
        media_id TEXT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
        tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY (media_id, tag_id)
      );
      CREATE TABLE settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL);
      CREATE INDEX people_name_idx ON people(name);
      CREATE INDEX tabs_person_idx ON person_tabs(person_id, position);
      CREATE INDEX text_person_idx ON text_entries(person_id, tab_id);
      CREATE INDEX media_person_idx ON media_items(person_id, tab_id);
      CREATE INDEX links_person_idx ON links(person_id, tab_id);
      INSERT INTO migrations(version, applied_at) VALUES (1, datetime('now'));
    `);
  }
  if (version < 2) {
    db.exec(`
      CREATE TABLE social_accounts (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        login TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        password_encrypted BLOB,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX social_accounts_platform_idx ON social_accounts(platform);
      INSERT INTO migrations(version, applied_at) VALUES (2, datetime('now'));
    `);
  }
  if (version < 3) {
    db.exec(`
      ALTER TABLE media_items ADD COLUMN source_url TEXT NOT NULL DEFAULT '';
      INSERT INTO migrations(version, applied_at) VALUES (3, datetime('now'));
    `);
  }
  if (version < 4) {
    db.exec(`
      ALTER TABLE person_tabs ADD COLUMN icon TEXT NOT NULL DEFAULT 'file-text';
      UPDATE person_tabs SET icon = CASE kind WHEN 'media' THEN 'images' WHEN 'links' THEN 'link' ELSE 'file-text' END;
      INSERT INTO migrations(version, applied_at) VALUES (4, datetime('now'));
    `);
  }
  if (version < 5) {
    const linkColumns = db.prepare("PRAGMA table_info(links)").all() as { name: string }[];
    if (linkColumns.some((column) => column.name === "platform")) {
      db.exec("ALTER TABLE links DROP COLUMN platform");
    }
    db.prepare("INSERT INTO migrations(version, applied_at) VALUES (5, datetime('now'))")
      .run();
  }
  if (version < 6) {
    const peopleColumns = db.prepare("PRAGMA table_info(people)").all() as {
      name: string;
    }[];
    const hasSecondary = peopleColumns.some((column) => column.name === "secondary");
    const hasLocation = peopleColumns.some((column) => column.name === "location");
    if (hasSecondary) {
      db.prepare(
        "UPDATE people SET summary=secondary WHERE trim(summary)='' AND trim(secondary)<>''",
      ).run();
      db.exec("ALTER TABLE people DROP COLUMN secondary");
    }
    if (hasLocation) db.exec("ALTER TABLE people DROP COLUMN location");
    db.prepare("INSERT INTO migrations(version, applied_at) VALUES (6, datetime('now'))")
      .run();
  }
  if (version < 7) {
    db.exec(`
      ALTER TABLE people ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
      INSERT INTO migrations(version, applied_at) VALUES (7, datetime('now'));
    `);
  }
  if (version < 8) {
    db.exec(`
      ALTER TABLE text_entries ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY tab_id ORDER BY updated_at DESC, created_at DESC, id) - 1 AS next_position
        FROM text_entries
      )
      UPDATE text_entries SET position = (SELECT next_position FROM ranked WHERE ranked.id = text_entries.id);
      CREATE INDEX text_tab_position_idx ON text_entries(tab_id, position);
      INSERT INTO migrations(version, applied_at) VALUES (8, datetime('now'));
    `);
  }
  if (version < 9) {
    db.exec(`
      ALTER TABLE people ADD COLUMN person_type TEXT NOT NULL DEFAULT 'default';
      CREATE TABLE relationships (
        id TEXT PRIMARY KEY,
        owner_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        related_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        relation_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(owner_person_id, related_person_id)
      );
      CREATE INDEX relationships_owner_idx ON relationships(owner_person_id);
      CREATE INDEX relationships_related_idx ON relationships(related_person_id);
      CREATE TABLE relation_positions (
        view_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        x REAL NOT NULL,
        y REAL NOT NULL,
        PRIMARY KEY(view_person_id, person_id)
      );
      INSERT INTO person_tabs (id,person_id,name,kind,icon,position,is_default,created_at)
      SELECT lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
        p.id, 'Relation', 'relation', 'user', COALESCE((SELECT MAX(position)+1 FROM person_tabs t WHERE t.person_id=p.id),0), 1, datetime('now')
      FROM people p;
      INSERT INTO migrations(version, applied_at) VALUES (9, datetime('now'));
    `);
  }
  if (version < 10) {
    db.exec(`
      DROP TABLE text_entries;
      CREATE TABLE text_documents (
        tab_id TEXT PRIMARY KEY REFERENCES person_tabs(id) ON DELETE CASCADE,
        person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        body TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL
      );
      CREATE INDEX text_documents_person_idx ON text_documents(person_id);
      INSERT INTO text_documents (tab_id,person_id,body,updated_at)
      SELECT id,person_id,'',datetime('now') FROM person_tabs WHERE kind='text';
      INSERT INTO migrations(version, applied_at) VALUES (10, datetime('now'));
    `);
  }
  if (version < 11) {
    db.exec(`
      ALTER TABLE relationships ADD COLUMN tab_id TEXT REFERENCES person_tabs(id) ON DELETE CASCADE;
      UPDATE relationships SET tab_id=(
        SELECT id FROM person_tabs WHERE person_tabs.person_id=relationships.owner_person_id AND kind='relation' ORDER BY position LIMIT 1
      );
      CREATE INDEX relationships_tab_idx ON relationships(tab_id);
      ALTER TABLE relation_positions RENAME TO relation_positions_v9;
      CREATE TABLE relation_positions (
        view_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        tab_id TEXT NOT NULL REFERENCES person_tabs(id) ON DELETE CASCADE,
        person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        x REAL NOT NULL,
        y REAL NOT NULL,
        PRIMARY KEY(view_person_id, tab_id, person_id)
      );
      INSERT INTO relation_positions(view_person_id,tab_id,person_id,x,y)
      SELECT old.view_person_id,
        (SELECT id FROM person_tabs WHERE person_tabs.person_id=old.view_person_id AND kind='relation' ORDER BY position LIMIT 1),
        old.person_id,old.x,old.y
      FROM relation_positions_v9 old
      WHERE EXISTS (SELECT 1 FROM person_tabs WHERE person_tabs.person_id=old.view_person_id AND kind='relation');
      DROP TABLE relation_positions_v9;
      INSERT INTO migrations(version, applied_at) VALUES (11, datetime('now'));
    `);
  }
  if (version < 12) {
    db.exec(`
      UPDATE relationships SET tab_id=(
        SELECT id FROM person_tabs
        WHERE person_tabs.person_id=relationships.owner_person_id AND kind='relation'
        ORDER BY is_default DESC, position LIMIT 1
      )
      WHERE tab_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM person_tabs
        WHERE person_tabs.id=relationships.tab_id
          AND person_tabs.person_id=relationships.owner_person_id
          AND person_tabs.kind='relation'
      );
      INSERT INTO migrations(version, applied_at) VALUES (12, datetime('now'));
    `);
  }
  if (version < 13) {
    db.exec(`
      CREATE TABLE map_documents (
        tab_id TEXT PRIMARY KEY REFERENCES person_tabs(id) ON DELETE CASCADE,
        person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        features_json TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL
      );
      CREATE INDEX map_documents_person_idx ON map_documents(person_id);
      INSERT INTO migrations(version, applied_at) VALUES (13, datetime('now'));
    `);
  }
  if (version < 14) {
    db.exec(`
      ALTER TABLE map_documents ADD COLUMN folders_json TEXT NOT NULL DEFAULT '[]';
      INSERT INTO migrations(version, applied_at) VALUES (14, datetime('now'));
    `);
  }
  if (version < 15) {
    db.exec(`
      ALTER TABLE text_documents
        ADD COLUMN content_json TEXT NOT NULL DEFAULT '{"blocks":[]}';
      INSERT INTO migrations(version, applied_at) VALUES (15, datetime('now'));
    `);
  }
  if (version < 16) {
    const peopleTable = db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'people'",
    ).get();

    if (peopleTable) {
      const generalCaseId = randomUUID();

      db.exec(`
        CREATE TABLE cases (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX cases_title_idx ON cases(title);
      `);
      db.prepare(`
        INSERT INTO cases(id, title, description, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `).run(generalCaseId, GENERAL_CASE_TITLE, GENERAL_CASE_DESCRIPTION);
      db.exec(`
        ALTER TABLE people ADD COLUMN case_id TEXT REFERENCES cases(id);
      `);
      db.prepare("UPDATE people SET case_id = ? WHERE case_id IS NULL").run(generalCaseId);
      db.exec(`
        CREATE INDEX people_case_idx ON people(case_id);
        CREATE TRIGGER people_case_required_insert
        BEFORE INSERT ON people
        WHEN NEW.case_id IS NULL
        BEGIN
          SELECT RAISE(ABORT, 'case_id is required');
        END;
        CREATE TRIGGER people_case_required_update
        BEFORE UPDATE OF case_id ON people
        WHEN NEW.case_id IS NULL
        BEGIN
          SELECT RAISE(ABORT, 'case_id is required');
        END;
        INSERT INTO migrations(version, applied_at) VALUES (16, datetime('now'));
      `);
    }
  }
}
