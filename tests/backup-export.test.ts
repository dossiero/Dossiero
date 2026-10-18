import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";
import { Open } from "unzipper";
import { DossierService } from "../src/main/service.js";
import type { BackupManifest } from "../src/main/backup/backup-archive.js";

test("exports and restores the database and media vault", async () => {
  const sourceDirectory = mkdtempSync(join(tmpdir(), "dossiero-backup-source-"));
  const restoreDirectory = mkdtempSync(join(tmpdir(), "dossiero-backup-restore-"));
  const backupPath = join(sourceDirectory, "backup.zip");
  const sourceService = new DossierService(sourceDirectory, false);

  try {
    const bundle = sourceService.createPerson({ name: "Ada" });
    const mediaTab = bundle.tabs.find((tab) => tab.kind === "media");
    assert.ok(mediaTab);
    const [media] = sourceService.uploadMedia(bundle.person.id, mediaTab.id, [{
      name: "evidence.txt",
      type: "text/plain",
      size: 3,
      bytes: new Uint8Array([1, 2, 3]),
    }]);

    await sourceService.exportBackup(backupPath);

    const archive = await Open.file(backupPath);
    const entryNames = archive.files.map((entry) => entry.path);
    const mediaArchivePath = `media/${bundle.person.id}/${media.storedName}`;

    assert.ok(entryNames.includes("backup.json"));
    assert.ok(entryNames.includes("dossier.sqlite"));
    assert.ok(entryNames.includes(mediaArchivePath));

    const manifestEntry = archive.files.find((entry) => entry.path === "backup.json");
    assert.ok(manifestEntry);
    const manifest = JSON.parse(
      (await manifestEntry.buffer()).toString("utf8"),
    ) as BackupManifest;
    assert.equal(manifest.formatVersion, 1);
    assert.equal(manifest.database, "dossier.sqlite");
    assert.equal(manifest.mediaDirectory, "media");

    await archive.extract({ path: restoreDirectory });
    const restoredService = new DossierService(restoreDirectory, false);

    try {
      assert.equal(restoredService.getPerson(bundle.person.id)?.person.name, "Ada");
      const restoredMediaPath = restoredService.mediaPath(media.id);
      assert.ok(restoredMediaPath);
      assert.equal(basename(restoredMediaPath), media.storedName);
      assert.deepEqual(readFileSync(restoredMediaPath), Buffer.from([1, 2, 3]));
    } finally {
      restoredService.close();
    }
  } finally {
    sourceService.close();
    rmSync(sourceDirectory, { recursive: true, force: true });
    rmSync(restoreDirectory, { recursive: true, force: true });
  }
});
