import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

export interface StoredMediaFile {
  id: string;
  personId: string;
  storedName: string;
}

export class MediaVault {
  readonly root: string;

  constructor(dataDir: string) {
    this.root = join(dataDir, "media");
    mkdirSync(this.root, { recursive: true });
    mkdirSync(this.faviconDirectory(), { recursive: true });
  }

  ensurePersonDirectory(personId: string): string {
    const path = this.personDirectory(personId);
    mkdirSync(path, { recursive: true });
    return path;
  }

  writeMedia(personId: string, storedName: string, bytes: Uint8Array): void {
    writeFileSync(
      join(this.ensurePersonDirectory(personId), storedName),
      Buffer.from(bytes),
    );
  }

  writeThumbnail(personId: string, mediaId: string, bytes: Uint8Array): void {
    writeFileSync(
      join(this.ensureThumbnailDirectory(personId), `${mediaId}.webp`),
      Buffer.from(bytes),
    );
  }

  resolveMediaPath(personId: string, storedName: string): string {
    const path = join(this.personDirectory(personId), storedName);
    const legacyPath = join(this.root, storedName);

    return existsSync(path) || !existsSync(legacyPath) ? path : legacyPath;
  }

  resolveThumbnailPath(personId: string, mediaId: string): string | null {
    const thumbnail = join(this.thumbnailDirectory(personId), `${mediaId}.webp`);
    const legacyThumbnail = join(this.root, "thumbnails", `${mediaId}.webp`);

    if (existsSync(thumbnail)) {
      return thumbnail;
    }

    if (existsSync(legacyThumbnail)) {
      return legacyThumbnail;
    }

    return null;
  }

  read(path: string): Buffer | null {
    return existsSync(path) ? readFileSync(path) : null;
  }

  readFavicon(cacheKey: string): Buffer | null {
    return this.read(join(this.faviconDirectory(), `${cacheKey}.img`));
  }

  writeFavicon(cacheKey: string, bytes: Uint8Array): void {
    writeFileSync(
      join(this.faviconDirectory(), `${cacheKey}.img`),
      Buffer.from(bytes),
    );
  }

  removeMedia(personId: string, mediaId: string, storedName: string): void {
    this.removeStoredFile(personId, storedName);
    this.removeThumbnail(personId, mediaId);
  }

  removePerson(personId: string, files: Array<{ id: string; storedName: string }>): void {
    rmSync(this.personDirectory(personId), {
      recursive: true,
      force: true,
    });

    for (const file of files) {
      this.removeLegacyStoredFile(file.storedName);
      this.removeLegacyThumbnail(file.id);
    }
  }

  organize(personIds: string[], media: StoredMediaFile[]): void {
    for (const personId of personIds) {
      this.ensurePersonDirectory(personId);
    }

    for (const item of media) {
      const personDir = this.ensurePersonDirectory(item.personId);
      const legacyFile = join(this.root, item.storedName);
      const targetFile = join(personDir, item.storedName);

      if (existsSync(legacyFile) && !existsSync(targetFile)) {
        renameSync(legacyFile, targetFile);
      }

      const legacyThumbnail = join(this.root, "thumbnails", `${item.id}.webp`);

      if (existsSync(legacyThumbnail)) {
        const targetThumbnail = join(
          this.ensureThumbnailDirectory(item.personId),
          `${item.id}.webp`,
        );

        if (!existsSync(targetThumbnail)) {
          renameSync(legacyThumbnail, targetThumbnail);
        }
      }
    }

    try {
      rmdirSync(join(this.root, "thumbnails"));
    } catch {
      // Keep a non-empty legacy directory so no untracked file is discarded.
    }
  }

  private personDirectory(personId: string): string {
    return join(this.root, personId);
  }

  private faviconDirectory(): string {
    return join(this.root, ".favicons");
  }

  private thumbnailDirectory(personId: string): string {
    return join(this.personDirectory(personId), ".thumbnails");
  }

  private ensureThumbnailDirectory(personId: string): string {
    const path = this.thumbnailDirectory(personId);
    mkdirSync(path, { recursive: true });
    return path;
  }

  private removeStoredFile(personId: string, storedName: string): void {
    const path = join(this.personDirectory(personId), storedName);

    if (existsSync(path)) {
      unlinkSync(path);
    }

    this.removeLegacyStoredFile(storedName);
  }

  private removeLegacyStoredFile(storedName: string): void {
    const path = join(this.root, storedName);

    if (existsSync(path)) {
      unlinkSync(path);
    }
  }

  removeThumbnail(personId: string, mediaId: string): void {
    const path = join(this.thumbnailDirectory(personId), `${mediaId}.webp`);

    if (existsSync(path)) {
      unlinkSync(path);
    }

    this.removeLegacyThumbnail(mediaId);
  }

  private removeLegacyThumbnail(mediaId: string): void {
    const path = join(this.root, "thumbnails", `${mediaId}.webp`);

    if (existsSync(path)) {
      unlinkSync(path);
    }
  }
}
