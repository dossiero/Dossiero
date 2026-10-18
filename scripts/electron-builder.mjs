import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const electronBuilderCli = join(
  process.cwd(),
  'node_modules',
  'electron-builder',
  'cli.js',
);
const environment = { ...process.env };
const builderArguments = process.argv.slice(2);

function appDirectoryName() {
  if (process.platform === 'darwin') {
    return process.arch === 'x64' ? 'mac' : `mac-${process.arch}`;
  }
  if (process.platform === 'win32') {
    return process.arch === 'x64' ? 'win-unpacked' : `win-${process.arch}-unpacked`;
  }
  return process.arch === 'x64' ? 'linux-unpacked' : `linux-${process.arch}-unpacked`;
}

function cleanGeneratedAppDirectories() {
  const packageJson = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
  );
  const outputDirectory = packageJson.build?.directories?.output ?? 'dist';
  const appDirectory = appDirectoryName();

  for (const directoryName of [appDirectory, `${appDirectory}.tmp`]) {
    rmSync(join(process.cwd(), outputDirectory, directoryName), {
      force: true,
      maxRetries: 3,
      recursive: true,
      retryDelay: 100,
    });
  }
}

// Finder metadata can make electron-builder's own app-directory cleanup fail
// with ENOTEMPTY. Normal package runs can safely discard these generated dirs.
if (builderArguments.length === 0) {
  cleanGeneratedAppDirectories();
}

// Homebrew may select a bleeding-edge Python without distutils, which older
// transitive node-gyp releases cannot use. Prefer the stable system Python when
// it exists; Windows uses node-gyp's normal discovery.
if (process.platform !== 'win32' && existsSync('/usr/bin/python3')) environment.PYTHON = '/usr/bin/python3';

const result = spawnSync(process.execPath, [electronBuilderCli, ...builderArguments], {
  stdio: 'inherit',
  env: environment,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
