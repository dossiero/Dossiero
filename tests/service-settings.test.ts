import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DossierService } from '../src/main/service.js';

test('keeps terminal as the only supported theme', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'dossier-settings-'));
  const service = new DossierService(dataDir, false);

  try {
    assert.equal(service.updateSettings({ theme: 'terminal' }).theme, 'terminal');
    assert.equal(service.getSettings().theme, 'terminal');
  } finally {
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test('persists an external browser preference', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'dossier-settings-'));
  const service = new DossierService(dataDir, false);

  try {
    assert.deepEqual(service.getSettings().externalBrowser, { kind: 'system' });

    const externalBrowser = {
      kind: 'application' as const,
      name: 'Example Browser',
      path: '/Applications/Example Browser.app',
    };
    assert.deepEqual(service.updateSettings({ externalBrowser }).externalBrowser, externalBrowser);
    assert.deepEqual(service.getSettings().externalBrowser, externalBrowser);
  } finally {
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});
