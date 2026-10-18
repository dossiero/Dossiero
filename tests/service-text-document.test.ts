import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import Database from 'better-sqlite3';
import { migrateDatabase } from '../src/main/persistence/migrations.js';
import { DossierService } from '../src/main/service.js';

test('creates one empty document for the default text tab', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'dossier-text-document-'));
  const service = new DossierService(dataDir, false);
  try {
    const bundle = service.createPerson({ name: 'Ada' });
    const infoTab = bundle.tabs.find((tab) => tab.kind === 'text');
    assert.ok(infoTab);
    assert.deepEqual(bundle.textDocuments.filter((document) => document.tabId === infoTab.id).map((document) => document.body), ['']);
    assert.deepEqual(
      bundle.textDocuments.find((document) => document.tabId === infoTab.id)?.content,
      { blocks: [] },
    );
  } finally {
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test('upserts the complete text document for a tab', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'dossier-text-autosave-'));
  const service = new DossierService(dataDir, false);
  try {
    const bundle = service.createPerson({ name: 'Grace' });
    const infoTab = bundle.tabs.find((tab) => tab.kind === 'text');
    assert.ok(infoTab);
    const content = {
      blocks: [
        { type: 'header', data: { text: 'Research', level: 2 } },
        {
          type: 'paragraph',
          data: {
            text: '<strong>Rich</strong> <span class="cdx-text-color" '
              + 'style="color: #d84a45;">content</span> <script>unsafe()</script>',
          },
        },
        {
          type: 'list',
          data: {
            style: 'checklist',
            items: [
              {
                content: 'Verify the source',
                meta: { checked: true },
                items: [],
              },
            ],
          },
        },
        {
          type: 'image',
          data: {
            file: { url: 'dossier-media://fictional-image' },
            caption: 'Reference image',
          },
        },
        {
          type: 'attaches',
          data: {
            file: { url: 'dossier-media://fictional-file', name: 'notes.pdf' },
            title: 'Case notes',
          },
        },
        {
          type: 'embed',
          data: {
            source: 'https://www.youtube.com/watch?v=fictional',
            caption: 'Reference video',
          },
        },
      ],
    };
    const saved = service.saveTextDocument({
      personId: bundle.person.id,
      tabId: infoTab.id,
      content,
    });
    assert.deepEqual(saved.content, content);
    assert.match(
      saved.body,
      /^<h2>Research<\/h2><p><strong>Rich<\/strong>/,
    );
    assert.match(saved.body, /Verify the source/);
    assert.match(saved.body, /class="cdx-text-color" style="color:#d84a45"/);
    assert.match(saved.body, /dossier-media:\/\/fictional-image/);
    assert.match(saved.body, /Case notes/);
    assert.match(saved.body, /Reference video/);
    assert.match(saved.body, /type="checkbox" disabled checked/);
    assert.doesNotMatch(saved.body, /script|unsafe/);
    const reloaded = service.getPerson(bundle.person.id)!.textDocuments
      .find((document) => document.tabId === infoTab.id);
    assert.deepEqual(reloaded?.content, content);
    assert.equal(reloaded?.body, saved.body);
    assert.equal(service.search('Verify the source')[0]?.personId, bundle.person.id);
  } finally {
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test('adds empty block content when migrating an existing text document database', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'dossier-text-migration-'));
  const databasePath = join(dataDir, 'migration.sqlite');
  const database = new Database(databasePath);

  try {
    database.exec(`
      CREATE TABLE migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      INSERT INTO migrations(version, applied_at) VALUES (14, datetime('now'));
      CREATE TABLE text_documents (
        tab_id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL
      );
      INSERT INTO text_documents(tab_id, person_id, body, updated_at)
      VALUES ('text-tab', 'person', '<p>Legacy note</p>', datetime('now'));
    `);

    migrateDatabase(database);

    const migrated = database.prepare(
      'SELECT body, content_json AS content FROM text_documents WHERE tab_id = ?',
    ).get('text-tab') as { body: string; content: string };
    assert.equal(migrated.body, '<p>Legacy note</p>');
    assert.deepEqual(JSON.parse(migrated.content), { blocks: [] });
    assert.deepEqual(
      database.prepare('SELECT MAX(version) AS version FROM migrations').get(),
      { version: 15 },
    );
  } finally {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});
