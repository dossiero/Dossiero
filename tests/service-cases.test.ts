import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Database from "better-sqlite3";
import {
  GENERAL_CASE_DESCRIPTION,
  GENERAL_CASE_TITLE,
} from "../src/shared/cases.js";
import { DossierService } from "../src/main/service.js";
import { migrateDatabase } from "../src/main/persistence/migrations.js";

test("creates and scopes people to cases", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "dossier-cases-"));
  const service = new DossierService(dataDir, false);

  try {
    const defaultCase = service.listCases()[0];

    assert.match(defaultCase.id, /^[0-9a-f-]{36}$/);
    assert.equal(defaultCase.title, GENERAL_CASE_TITLE);
    assert.equal(defaultCase.description, GENERAL_CASE_DESCRIPTION);

    const secondCase = service.createCase({
      title: "Northstar",
      description: "A fictional investigation workspace.",
    });
    const generalPerson = service.createPerson({ name: "Ada" });
    const northstarPerson = service.createPerson({ name: "Grace" }, secondCase.id);

    assert.equal(generalPerson.person.caseId, defaultCase.id);
    assert.equal(northstarPerson.person.caseId, secondCase.id);
    assert.deepEqual(
      service.listPeople("", "active", false, defaultCase.id).map((person) => person.name),
      ["Ada"],
    );
    assert.deepEqual(
      service.listPeople("", "active", false, secondCase.id).map((person) => person.name),
      ["Grace"],
    );

    const relationTab = northstarPerson.tabs.find((tab) => tab.kind === "relation");
    assert.ok(relationTab);
    const related = service.createRelatedPerson(
      northstarPerson.person.id,
      relationTab.id,
      northstarPerson.person.id,
      "colleague",
      { name: "Lin" },
    );

    assert.equal(related.person.caseId, secondCase.id);
    assert.equal(
      service.listCases().find((caseItem) => caseItem.id === secondCase.id)?.targetCount,
      2,
    );
  } finally {
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("migration assigns existing people to the General case", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "dossier-case-migration-"));
  const databasePath = join(dataDir, "dossier.sqlite");
  const database = new Database(databasePath);

  database.exec(`
    CREATE TABLE migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    INSERT INTO migrations(version, applied_at) VALUES (15, datetime('now'));
    CREATE TABLE people (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      aliases_json TEXT NOT NULL DEFAULT '[]',
      birth_date TEXT,
      summary TEXT NOT NULL DEFAULT '',
      profile_photo_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      person_type TEXT NOT NULL DEFAULT 'default',
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    INSERT INTO people(
      id,
      name,
      aliases_json,
      status,
      person_type,
      created_at,
      updated_at
    ) VALUES (
      'a1b2c3d4-e5f6-47a8-9012-3456789abcde',
      'Existing Person',
      '[]',
      'active',
      'default',
      datetime('now'),
      datetime('now')
    );
  `);
  try {
    migrateDatabase(database);
    const person = database.prepare(
      "SELECT case_id AS caseId FROM people WHERE name = ?",
    ).get("Existing Person") as { caseId: string };
    const generalCase = database.prepare(`
      SELECT cases.id, COUNT(people.id) AS targetCount
      FROM cases
      LEFT JOIN people ON people.case_id = cases.id
      GROUP BY cases.id
    `).get() as { id: string; targetCount: number };

    assert.match(person.caseId, /^[0-9a-f-]{36}$/);
    assert.equal(generalCase.id, person.caseId);
    assert.equal(generalCase.targetCount, 1);
  } finally {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});
