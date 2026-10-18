import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

export const vectorStyleUrl = "https://tiles.openfreemap.org/styles/liberty";

export interface ThemePalette {
  background: string;
  surface: string;
  raised: string;
  line: string;
  text: string;
  dim: string;
  signal: string;
}

export function readThemePalette(): ThemePalette {
  const styles = getComputedStyle(document.documentElement);
  return {
    background: cssVariable(styles, "--bg", "#07100d"),
    surface: cssVariable(styles, "--surface", "#0b1914"),
    raised: cssVariable(styles, "--surface-raised", "#10251d"),
    line: cssVariable(styles, "--line", "#24533f"),
    text: cssVariable(styles, "--text", "#b7ffd6"),
    dim: cssVariable(styles, "--text-dim", "#72a98a"),
    signal: cssVariable(styles, "--signal", "#00ff88"),
  };
}

export function emptyVectorStyle(): StyleSpecification {
  const palette = readThemePalette();
  return {
    version: 8,
    name: "Dossiero vector loading",
    sources: {},
    layers: [{
      id: "background",
      type: "background",
      paint: { "background-color": palette.background },
    }],
  };
}

export function styleMatrixVectorMap(
  source: StyleSpecification,
  palette: ThemePalette,
): StyleSpecification {
  const style = structuredClone(source);
  style.name = "Dossiero themed OpenStreetMap";
  style.layers = style.layers.map((layer) => styleVectorLayer(layer, palette));
  const hasHouseNumbers = style.layers.some((layer) => (
    "source-layer" in layer && layer["source-layer"] === "housenumber"
  ));
  if (style.sources.openmaptiles && !hasHouseNumbers) {
    style.layers.push(houseNumberLayer(palette));
  }
  return style;
}

function cssVariable(styles: CSSStyleDeclaration, name: string, fallback: string) {
  const value = styles.getPropertyValue(name).trim();
  return value ? `rgb(${value.replace(/\s+/g, " ")})` : fallback;
}

// The app camera uses 256px tiles while MapLibre uses 512px tiles. A MapLibre
// minzoom of 16 therefore displays house numbers at the UI's Z17.
function houseNumberLayer(palette: ThemePalette): LayerSpecification {
  return {
    id: "dossier-house-numbers",
    type: "symbol",
    source: "openmaptiles",
    "source-layer": "housenumber",
    minzoom: 16,
    layout: {
      "text-field": ["get", "housenumber"],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 16, 11, 18, 13],
      "text-padding": 2,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": palette.text,
      "text-halo-color": palette.background,
      "text-halo-width": 2,
      "text-opacity": .96,
    },
  } as LayerSpecification;
}

function styleVectorLayer(
  layer: LayerSpecification,
  palette: ThemePalette,
): LayerSpecification {
  const next = structuredClone(layer) as LayerSpecification;
  const id = `${next.id} ${
    "source-layer" in next ? String(next["source-layer"] ?? "") : ""
  }`.toLowerCase();
  const holder = next as LayerSpecification & { paint?: Record<string, unknown> };
  const paint = { ...(holder.paint ?? {}) };
  if (next.type === "background") paint["background-color"] = palette.background;
  if (next.type === "fill") {
    delete paint["fill-pattern"];
    const water = id.includes("water");
    const green = /(park|wood|forest|grass|landcover|landuse|cemetery)/.test(id);
    const building = id.includes("building");
    paint["fill-color"] = water
      ? palette.surface
      : green
      ? palette.raised
      : building
      ? palette.line
      : palette.background;
    paint["fill-opacity"] = water ? .88 : green ? .62 : building ? .42 : .96;
    paint["fill-outline-color"] = water ? palette.signal : palette.line;
  }
  if (next.type === "line") {
    delete paint["line-pattern"];
    const water = /(water|river|stream|canal)/.test(id);
    const boundary = /(boundary|admin)/.test(id);
    const road = /(road|street|highway|motorway|trunk|primary|secondary|tertiary|path|track)/
      .test(id);
    paint["line-color"] = water
      ? palette.signal
      : boundary
      ? palette.signal
      : road
      ? palette.dim
      : palette.line;
    paint["line-opacity"] = water ? .48 : boundary ? .34 : road ? .55 : .38;
  }
  if (next.type === "symbol") {
    const important = /(place|city|town|country|state|road|street)/.test(id);
    paint["text-color"] = important ? palette.text : palette.dim;
    paint["text-halo-color"] = palette.background;
    paint["text-halo-width"] = 1.4;
    paint["text-opacity"] = important ? .9 : .68;
    paint["icon-opacity"] = .48;
  }
  if (next.type === "circle") {
    paint["circle-color"] = palette.signal;
    paint["circle-stroke-color"] = palette.background;
    paint["circle-opacity"] = .65;
  }
  if (next.type === "fill-extrusion") {
    paint["fill-extrusion-color"] = palette.line;
    paint["fill-extrusion-opacity"] = .45;
  }
  if (next.type === "raster") paint["raster-opacity"] = 0;
  if (next.type === "hillshade") {
    paint["hillshade-shadow-color"] = palette.background;
    paint["hillshade-highlight-color"] = palette.raised;
    paint["hillshade-accent-color"] = palette.line;
    paint["hillshade-exaggeration"] = .18;
  }
  holder.paint = paint;
  return next;
}
