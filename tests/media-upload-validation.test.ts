import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import test from "node:test";
import { dispatchCore } from "../src/main/dispatch.js";
import { DossierService } from "../src/main/service.js";
import type { MediaItem } from "../src/shared/types.js";

test("validates media bytes at the transport boundary", () => {
  const dataDirectory = mkdtempSync(join(tmpdir(), "dossiero-upload-validation-"));
  const service = new DossierService(dataDirectory, false);

  try {
    const bundle = service.createPerson({ name: "Ada" });
    const mediaTab = bundle.tabs.find((tab) => tab.kind === "media");
    assert.ok(mediaTab);
    const payload = {
      personId: bundle.person.id,
      tabId: mediaTab.id,
      files: [{
        name: "evidence.txt",
        type: "text/plain",
        size: 3,
        bytes: { 0: 1, 1: 2, 2: 3 },
      }],
    };

    const items = dispatchCore(service, "media:upload", payload) as MediaItem[];
    assert.equal(items.length, 1);
    assert.deepEqual(service.readMedia(items[0].id), Buffer.from([1, 2, 3]));

    assert.throws(
      () => dispatchCore(service, "media:upload", {
        ...payload,
        files: [{ ...payload.files[0], bytes: "not bytes" }],
      }),
      /Invalid input/,
    );
    assert.throws(
      () => dispatchCore(service, "media:upload", {
        ...payload,
        files: [{ ...payload.files[0], size: 4 }],
      }),
      /Declared file size does not match/,
    );
    assert.throws(
      () => dispatchCore(service, "media:upload", {
        ...payload,
        files: [{ ...payload.files[0], bytes: { 0: 1, 2: 3 }, size: 2 }],
      }),
      /contiguous numeric indexes/,
    );
  } finally {
    service.close();
    rmSync(dataDirectory, { recursive: true, force: true });
  }
});

test("stores hostile imported filenames under generated vault names", () => {
  const dataDirectory = mkdtempSync(join(tmpdir(), "dossiero-hostile-filename-"));
  const service = new DossierService(dataDirectory, false);

  try {
    const bundle = service.createPerson({ name: "Grace" });
    const mediaTab = bundle.tabs.find((tab) => tab.kind === "media");
    assert.ok(mediaTab);
    const hostileName = "../../private/notes?<script>.JpG";
    const [media] = service.uploadMedia(bundle.person.id, mediaTab.id, [{
      name: hostileName,
      type: "image/jpeg",
      size: 3,
      bytes: new Uint8Array([1, 2, 3]),
    }]);
    const mediaPath = service.mediaPath(media.id);

    assert.ok(mediaPath);
    assert.equal(media.originalName, hostileName);
    assert.match(media.storedName, /^[0-9a-f-]{36}\.JpG$/);
    assert.equal(basename(mediaPath), media.storedName);
    assert.equal(dirname(mediaPath), join(service.mediaDir, bundle.person.id));
    assert.equal(mediaPath.includes("private"), false);
    assert.equal(mediaPath.includes("script"), false);
  } finally {
    service.close();
    rmSync(dataDirectory, { recursive: true, force: true });
  }
});
