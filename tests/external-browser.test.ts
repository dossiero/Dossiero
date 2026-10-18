import assert from "node:assert/strict";
import test from "node:test";
import {
  browserNameFromPath,
  openExternalUrl,
} from "../src/main/external-browser.js";

test("derives a readable browser name from a selected application", () => {
  assert.equal(
    browserNameFromPath("/Applications/Example Browser.app"),
    "Example Browser",
  );
});

test("uses the system browser by default", async () => {
  const openedUrls: string[] = [];

  await openExternalUrl(
    "https://example.com/research?q=one",
    { kind: "system" },
    async (url) => {
      openedUrls.push(url);
    },
  );

  assert.deepEqual(openedUrls, ["https://example.com/research?q=one"]);
});

test("falls back to the system browser when the selected application is missing", async () => {
  const openedUrls: string[] = [];

  await openExternalUrl(
    "https://example.com/",
    {
      kind: "application",
      name: "Missing Browser",
      path: "/not/a/real/browser",
    },
    async (url) => {
      openedUrls.push(url);
    },
  );

  assert.deepEqual(openedUrls, ["https://example.com/"]);
});

test("rejects non-web URLs", async () => {
  await assert.rejects(
    openExternalUrl("file:///private/example", { kind: "system" }, async () => undefined),
    /Only http\(s\) links are allowed/,
  );
});
