import { ZipArchive } from "archiver";
import {
  copyFileSync,
  cpSync,
  createWriteStream,
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BACKUP_FORMAT_VERSION = 1;

interface BackupArchiveInput {
  databasePath: string;
  mediaDirectory: string;
  destination: string;
}

export interface BackupManifest {
  formatVersion: number;
  createdAt: string;
  database: string;
  mediaDirectory: string;
}

function writeZip(sourceDirectory: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(destination);
    const archive = new ZipArchive({
      zlib: {
        level: 9,
      },
    });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);
    archive.on("warning", reject);
    archive.pipe(output);
    archive.directory(sourceDirectory, false);
    void archive.finalize();
  });
}

export async function createBackupArchive({
  databasePath,
  mediaDirectory,
  destination,
}: BackupArchiveInput): Promise<void> {
  const snapshotDirectory = mkdtempSync(join(tmpdir(), "dossiero-backup-"));
  const databaseName = "dossier.sqlite";
  const mediaDirectoryName = "media";

  try {
    copyFileSync(databasePath, join(snapshotDirectory, databaseName));

    if (existsSync(mediaDirectory)) {
      cpSync(mediaDirectory, join(snapshotDirectory, mediaDirectoryName), {
        recursive: true,
      });
    }

    const manifest: BackupManifest = {
      formatVersion: BACKUP_FORMAT_VERSION,
      createdAt: new Date().toISOString(),
      database: databaseName,
      mediaDirectory: mediaDirectoryName,
    };
    writeFileSync(
      join(snapshotDirectory, "backup.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );

    await writeZip(snapshotDirectory, destination);
  } catch (error) {
    rmSync(destination, {
      force: true,
    });
    throw error;
  } finally {
    rmSync(snapshotDirectory, {
      force: true,
      recursive: true,
    });
  }
}
