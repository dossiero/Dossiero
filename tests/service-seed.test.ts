import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DossierService } from "../src/main/service.js";

test("loads fictional seed data through the Drizzle-backed stores", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "dossier-seed-"));
  const service = new DossierService(dataDir);

  try {
    const people = service.listPeople();
    const cases = service.listCases();

    assert.equal(people.length, 1);
    assert.equal(people[0].name, "Mara Voss");
    assert.equal(cases.length, 1);
    assert.equal(cases[0].title, "General");
    assert.equal(cases[0].targetCount, 1);
    assert.equal(people[0].caseId, cases[0].id);

    const dossier = service.getPerson(people[0].id);

    assert.ok(dossier);
    assert.deepEqual(
      dossier.tabs.map((tab) => tab.kind),
      ["text", "media", "links", "relation"],
    );
    assert.equal(dossier.textDocuments.length, 1);
    assert.equal(dossier.links.length, 1);
    assert.equal(service.getSettings().theme, "terminal");
  } finally {
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});
