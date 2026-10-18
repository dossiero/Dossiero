import assert from "node:assert/strict";
import test from "node:test";
import {
  PERSON_DOSSIER_PANEL_COLLAPSED_WIDTH,
  panelPixelsToPercentage,
  resolvePersonDossierPanelCompactState,
} from "../src/renderer/features/app-shell/components/person-dossier-workspace/person-dossier-workspace.logic";

test("switches the dossier panel to compact mode below 150 pixels", () => {
  assert.equal(resolvePersonDossierPanelCompactState(false, 151), false);
  assert.equal(resolvePersonDossierPanelCompactState(false, 149), true);
});

test("keeps the current dossier panel mode at the compact threshold", () => {
  assert.equal(resolvePersonDossierPanelCompactState(false, 150), false);
  assert.equal(resolvePersonDossierPanelCompactState(true, 150), true);
});

test("returns the dossier panel to expanded mode above the compact threshold", () => {
  assert.equal(resolvePersonDossierPanelCompactState(true, 149), true);
  assert.equal(resolvePersonDossierPanelCompactState(true, 151), false);
});

test("converts the 80 pixel collapsed width to a panel percentage", () => {
  assert.equal(PERSON_DOSSIER_PANEL_COLLAPSED_WIDTH, 80);
  assert.equal(panelPixelsToPercentage(80, 800), 10);
});
