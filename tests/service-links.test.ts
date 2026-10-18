import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DossierService } from "../src/main/service.js";
import { getLinkTitle } from "../src/shared/website.js";

test("accepts a link with only a URL and falls back to the website name", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "dossier-link-url-only-"));
  const service = new DossierService(dataDir, false);

  try {
    const bundle = service.createPerson({ name: "Ada" });
    const linksTab = bundle.tabs.find((tab) => tab.kind === "links");
    assert.ok(linksTab);

    const link = service.createLink({
      personId: bundle.person.id,
      tabId: linksTab.id,
      label: "",
      url: "https://dev.to/articles/42",
    });

    assert.equal(link.label, "");
    assert.equal(getLinkTitle(link.label, link.url), "dev.to");
  } finally {
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("downloads a website favicon once and reuses the local vault copy", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "dossier-link-favicon-"));
  const service = new DossierService(dataDir, false);
  const originalFetch = globalThis.fetch;
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  let requestCount = 0;

  globalThis.fetch = async (input) => {
    requestCount += 1;
    const url = new URL(String(input));
    assert.equal(url.origin + url.pathname, "https://www.google.com/s2/favicons");
    assert.equal(url.searchParams.get("domain"), "dev.to");
    assert.equal(url.searchParams.get("sz"), "128");

    return new Response(pngHeader, {
      headers: { "Content-Type": "image/png" },
    });
  };

  try {
    const bundle = service.createPerson({ name: "Grace" });
    const linksTab = bundle.tabs.find((tab) => tab.kind === "links");
    assert.ok(linksTab);
    const link = service.createLink({
      personId: bundle.person.id,
      tabId: linksTab.id,
      label: "",
      url: "https://dev.to/example",
    });

    const first = await service.linkFavicon(link.id);
    const second = await service.linkFavicon(link.id);

    assert.equal(first?.mimeType, "image/png");
    assert.deepEqual(first?.bytes, Buffer.from(pngHeader));
    assert.deepEqual(second?.bytes, Buffer.from(pngHeader));
    assert.equal(requestCount, 1);

    const cacheDirectory = join(service.mediaDir, ".favicons");
    assert.equal(existsSync(cacheDirectory), true);
    assert.equal(readdirSync(cacheDirectory).length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});
