import assert from "node:assert/strict";
import test from "node:test";
import {
  PERSON_SIDEBAR_COLLAPSED_WIDTH,
  pixelsToPanelPercentage,
  resolvePersonSidebarCompactState,
} from "../src/renderer/app/sidebar-resize";

test("snaps the expanded person sidebar into compact mode below 120 pixels", () => {
  assert.equal(resolvePersonSidebarCompactState(false, 121), false);
  assert.equal(resolvePersonSidebarCompactState(false, 119), true);
});

test("keeps compact contents until the person sidebar grows past 120 pixels", () => {
  assert.equal(resolvePersonSidebarCompactState(true, 119), true);
  assert.equal(resolvePersonSidebarCompactState(true, 120), true);
  assert.equal(resolvePersonSidebarCompactState(true, 121), false);
});

test("preserves the current sidebar mode at the exact threshold", () => {
  assert.equal(resolvePersonSidebarCompactState(false, 120), false);
  assert.equal(resolvePersonSidebarCompactState(true, 120), true);
});

test("converts the compact sidebar width to the panel percentage", () => {
  assert.equal(pixelsToPanelPercentage(PERSON_SIDEBAR_COLLAPSED_WIDTH, 1_200), 6);
});
