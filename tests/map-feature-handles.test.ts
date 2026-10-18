import assert from "node:assert/strict";
import test from "node:test";
import {
  resizeCameraFromTopLeft,
  screenToCoordinate,
  shouldShowFeatureHandles,
} from "../src/renderer/features/map/logic/geometry";

test("hides line handles while the line is compressed on screen", () => {
  assert.equal(
    shouldShowFeatureHandles([
      { x: 10, y: 10 },
      { x: 42, y: 18 },
      { x: 58, y: 30 },
    ], false),
    false,
  );

  assert.equal(
    shouldShowFeatureHandles([
      { x: 10, y: 10 },
      { x: 90, y: 35 },
      { x: 180, y: 60 },
    ], false),
    true,
  );
});

test("shows polygon handles only when its projected area is large enough", () => {
  assert.equal(
    shouldShowFeatureHandles([
      { x: 10, y: 10 },
      { x: 100, y: 10 },
      { x: 100, y: 25 },
      { x: 10, y: 25 },
    ], true),
    false,
  );

  assert.equal(
    shouldShowFeatureHandles([
      { x: 10, y: 10 },
      { x: 130, y: 10 },
      { x: 130, y: 90 },
      { x: 10, y: 90 },
    ], true),
    true,
  );
});

test("keeps the top-left map coordinate fixed when the viewport resizes", () => {
  const camera = { center: [12, 42] as [number, number], zoom: 8 };
  const previousSize = { width: 500, height: 320 };
  const nextSize = { width: 760, height: 540 };
  const topLeftBefore = screenToCoordinate({ x: 0, y: 0 }, camera, previousSize);
  const resizedCamera = resizeCameraFromTopLeft(camera, previousSize, nextSize);
  const topLeftAfter = screenToCoordinate({ x: 0, y: 0 }, resizedCamera, nextSize);

  assert.ok(Math.abs(topLeftBefore[0] - topLeftAfter[0]) < 1e-10);
  assert.ok(Math.abs(topLeftBefore[1] - topLeftAfter[1]) < 1e-10);
});
