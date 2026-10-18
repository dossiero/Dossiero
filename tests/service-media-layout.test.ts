import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { DossierService } from '../src/main/service.js';

const upload = { name: 'evidence.jpg', type: 'image/jpeg', size: 3, bytes: new Uint8Array([1, 2, 3]) };

test('stores media inside the owning person ID directory', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'dossier-media-layout-'));
  const service = new DossierService(dataDir, false);

  try {
    const bundle = service.createPerson({ name: 'Ada' });
    const personDir = join(service.mediaDir, bundle.person.id);
    assert.equal(existsSync(personDir), true);

    const mediaTab = bundle.tabs.find((tab) => tab.kind === 'media');
    assert.ok(mediaTab);
    const [item] = service.uploadMedia(bundle.person.id, mediaTab.id, [upload]);
    assert.equal(service.mediaPath(item.id), join(personDir, item.storedName));
    assert.equal(existsSync(join(personDir, item.storedName)), true);
  } finally {
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test('uses an existing image as the owning person profile photo', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'dossier-profile-photo-'));
  const service = new DossierService(dataDir, false);

  try {
    const bundle = service.createPerson({ name: 'Ada' });
    const mediaTab = bundle.tabs.find((tab) => tab.kind === 'media');
    assert.ok(mediaTab);
    const [item] = service.uploadMedia(bundle.person.id, mediaTab.id, [upload]);

    const person = service.setProfilePhoto(bundle.person.id, item.id);

    assert.equal(person.profilePhotoId, item.id);
    assert.equal(service.getPerson(bundle.person.id)?.person.profilePhotoId, item.id);
  } finally {
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test('rejects non-image and cross-subject profile photos', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'dossier-profile-photo-validation-'));
  const service = new DossierService(dataDir, false);

  try {
    const first = service.createPerson({ name: 'Ada' });
    const second = service.createPerson({ name: 'Grace' });
    const firstMediaTab = first.tabs.find((tab) => tab.kind === 'media');
    assert.ok(firstMediaTab);
    const [image, document] = service.uploadMedia(first.person.id, firstMediaTab.id, [upload, { ...upload, name: 'notes.txt', type: 'text/plain' }]);

    assert.throws(() => service.setProfilePhoto(second.person.id, image.id), /does not belong/);
    assert.throws(() => service.setProfilePhoto(first.person.id, document.id), /Only images/);
  } finally {
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test('moves legacy flat media and thumbnails into the person directory on startup', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'dossier-media-migration-'));
  let service = new DossierService(dataDir, false);
  const bundle = service.createPerson({ name: 'Grace' });
  const mediaTab = bundle.tabs.find((tab) => tab.kind === 'media');
  assert.ok(mediaTab);
  const [item] = service.uploadMedia(bundle.person.id, mediaTab.id, [upload]);
  const nestedPath = service.mediaPath(item.id);
  assert.ok(nestedPath);
  service.close();

  const legacyPath = join(dataDir, 'media', item.storedName);
  renameSync(nestedPath, legacyPath);
  const legacyThumbnail = join(dataDir, 'media', 'thumbnails', `${item.id}.webp`);
  mkdirSync(dirname(legacyThumbnail), { recursive: true });
  writeFileSync(legacyThumbnail, Buffer.from([4, 5, 6]));

  service = new DossierService(dataDir, false);
  try {
    assert.equal(service.mediaPath(item.id), join(dataDir, 'media', bundle.person.id, item.storedName));
    assert.equal(service.profileThumbnailPath(item.id), join(dataDir, 'media', bundle.person.id, '.thumbnails', `${item.id}.webp`));
    assert.equal(existsSync(legacyPath), false);
    assert.equal(existsSync(legacyThumbnail), false);
  } finally {
    service.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});
