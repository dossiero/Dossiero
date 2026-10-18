import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { IPC_CHANNELS } from '../src/shared/ipc.js';

test('desktop preload permits every public dossier IPC channel', () => {
  const preload=readFileSync(join(process.cwd(),'src/preload/index.cts'),'utf8');
  const allowlist=preload.slice(preload.indexOf('const allowed'),preload.indexOf('const bridge'));
  const permitted=new Set([...allowlist.matchAll(/'([^']+)'/g)].map(match=>match[1]));
  assert.deepEqual(IPC_CHANNELS.filter(channel=>!permitted.has(channel)),[]);
});
