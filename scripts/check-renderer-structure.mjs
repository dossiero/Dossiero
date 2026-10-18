import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";

const projectRoot = new URL("../", import.meta.url).pathname;
const rendererRoot = join(projectRoot, "src/renderer");
const sharedComponentsRoot = "src/renderer/components/";
const featureComponentsSegment = "/components/";

const maximumNewComponentLines = 500;
const maximumNewStylesheetLines = 350;

const legacyFlatComponents = new Set();
const oversizedSourceBaselines = new Map();
const oversizedStylesheetBaselines = new Map();
const cohesiveComponentFamilies = new Set([
  "src/renderer/components/context-menu/context-menu.tsx",
  "src/renderer/components/dropdown-menu/dropdown-menu.tsx",
]);
const forbiddenCatchAllNames = new Set(["content.tsx", "forms.tsx", "ui.tsx"]);

function collectFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? collectFiles(path) : [path];
  });
}

function projectPath(path) {
  return relative(projectRoot, path).replaceAll("\\", "/");
}

function lineCount(path) {
  const source = readFileSync(path, "utf8");
  const lines = source.split(/\r?\n/).length;

  return source.endsWith("\n") ? lines - 1 : lines;
}

function validateComponentLocation(path, errors) {
  const relativePath = projectPath(path);
  if (legacyFlatComponents.has(relativePath)) {
    return;
  }

  const isSharedComponent = relativePath.startsWith(sharedComponentsRoot);
  const isFeatureComponent = relativePath.startsWith("src/renderer/features/")
    && relativePath.includes(featureComponentsSegment);
  if (!isSharedComponent && !isFeatureComponent) {
    return;
  }

  const componentName = basename(path, extname(path));
  const componentDirectory = basename(dirname(path));
  if (componentName !== componentDirectory) {
    errors.push(
      `${relativePath}: component file must live in a same-named folder `
      + `(for example, ${componentName}/${componentName}.tsx).`,
    );
    return;
  }

  const source = readFileSync(path, "utf8");
  if (source.includes("className=") && !source.includes(`./${componentName}.css`)) {
    errors.push(
      `${relativePath}: styled components must import their colocated ${componentName}.css.`,
    );
  }
}

function validateComponentBoundaries(path, errors) {
  const relativePath = projectPath(path);
  const source = readFileSync(path, "utf8");
  const privateComponents = [...source.matchAll(/^function ([A-Z][A-Za-z0-9]*)/gm)];
  for (const match of privateComponents) {
    errors.push(
      `${relativePath}: extract private component ${match[1]} into its own named folder.`,
    );
  }

  const exportedComponents = [...source.matchAll(/^export function ([A-Z][A-Za-z0-9]*)/gm)];
  if (exportedComponents.length > 1 && !cohesiveComponentFamilies.has(relativePath)) {
    errors.push(
      `${relativePath}: each React component must have its own TSX file and named folder.`,
    );
  }

  if (forbiddenCatchAllNames.has(basename(path))) {
    errors.push(`${relativePath}: mixed-responsibility renderer catch-all files are forbidden.`);
  }
}

function validateLineLimit(path, maximumLines, baselines, errors) {
  const relativePath = projectPath(path);
  const lines = lineCount(path);
  const baseline = baselines.get(relativePath);

  if (baseline !== undefined) {
    if (lines > baseline) {
      errors.push(`${relativePath}: ${lines} lines exceeds its legacy baseline of ${baseline}.`);
    }
    return;
  }

  if (lines > maximumLines) {
    errors.push(`${relativePath}: ${lines} lines exceeds the ${maximumLines}-line review limit.`);
  }
}

function validateImportPaths(path, errors) {
  const source = readFileSync(path, "utf8");
  const longParentImport = /(?:from\s+|import\s*\()\s*["']((?:\.\.\/){3,}[^"']*)["']/g;

  for (const match of source.matchAll(longParentImport)) {
    errors.push(
      `${projectPath(path)}: replace deep import "${match[1]}" with @/ or @shared/.`,
    );
  }
}

function validateTitleUsage(path, errors) {
  const source = readFileSync(path, "utf8");
  if (/<h[1-6]\b/.test(source)) {
    errors.push(
      `${projectPath(path)}: use the shared Title component instead of a raw heading element.`,
    );
  }
}

function validateFeatureStylesheetLocation(path, errors) {
  const relativePath = projectPath(path);
  if (!relativePath.startsWith("src/renderer/features/")) {
    return;
  }

  const parentDirectory = dirname(relativePath).replaceAll("\\", "/");
  if (!parentDirectory.includes("/components/")) {
    errors.push(`${relativePath}: feature stylesheets must be owned by a component folder.`);
  }
}

const errors = [];
for (const path of collectFiles(rendererRoot)) {
  if (path.endsWith(".ts") || path.endsWith(".tsx")) {
    validateImportPaths(path, errors);
  }

  if (path.endsWith(".tsx")) {
    validateTitleUsage(path, errors);
    validateComponentLocation(path, errors);
    validateComponentBoundaries(path, errors);
    validateLineLimit(path, maximumNewComponentLines, oversizedSourceBaselines, errors);
  }

  if (path.endsWith(".css")) {
    validateFeatureStylesheetLocation(path, errors);
    validateLineLimit(path, maximumNewStylesheetLines, oversizedStylesheetBaselines, errors);
  }
}

if (errors.length > 0) {
  console.error("Renderer structure check failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("Renderer structure check passed.");
}
