import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DossierService } from "../src/main/service.js";

test("persists map annotations as a GeoJSON feature collection", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "dossier-map-document-"));
  const service = new DossierService(dataDir, false);
  try {
    const bundle = service.createPerson({ name: "Mercator" });
    const tab = service.createTab(bundle.person.id, { name: "Locations", kind: "map" });
    assert.equal(tab.icon, "map-pin");
    const feature = {
      type: "Feature" as const,
      id: "pin-1",
      geometry: { type: "Point" as const, coordinates: [-9.1393, 38.7223] as [number, number] },
      properties: {
        shape: "pin" as const,
        label: "Lisbon",
        color: "#d84a45",
        icon: "star",
        markerStyle: "square" as const,
        folderId: "folder-1",
        hidden: false,
        description: "<strong>Verified</strong>",
      },
    };
    const folders = [{ id: "folder-1", name: "Lisbon", hidden: false }];
    const saved = service.saveMapDocument({
      personId: bundle.person.id,
      tabId: tab.id,
      features: [feature],
      folders,
    });
    assert.equal(saved.type, "FeatureCollection");
    assert.deepEqual(saved.features, [feature]);
    assert.deepEqual(saved.folders, folders);
    assert.deepEqual(
      service.getPerson(bundle.person.id)!.maps.find((map) => map.tabId === tab.id)?.features,
      [feature],
    );
  } finally {
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});
