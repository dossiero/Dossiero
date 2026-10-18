import { asc, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { mediaUpdateSchema } from "../../shared/schemas.js";
import type { MediaItem, UploadFile } from "../../shared/types.js";
import type { DossierDatabase } from "../persistence/database.js";
import {
  mediaItems,
  mediaTags,
  people,
  tags,
} from "../persistence/schema.js";
import { MediaVault, type StoredMediaFile } from "./media-vault.js";

export interface MediaFileRow {
  id: string;
  person_id: string;
  stored_name: string;
}

export class MediaStore {
  readonly vault: MediaVault;

  constructor(
    private readonly db: DossierDatabase,
    dataDir: string,
  ) {
    this.vault = new MediaVault(dataDir);
    this.organizeVault();
  }

  ensurePersonDirectory(personId: string): void {
    this.vault.ensurePersonDirectory(personId);
  }

  removePersonFiles(personId: string, files: MediaFileRow[]): void {
    this.vault.removePerson(
      personId,
      files.map((file) => ({
        id: file.id,
        storedName: file.stored_name,
      })),
    );
  }

  removeFiles(files: MediaFileRow[]): void {
    for (const file of files) {
      this.vault.removeMedia(file.person_id, file.id, file.stored_name);
    }
  }

  uploadMedia(personId: string, tabId: string, files: UploadFile[]): MediaItem[] {
    const inserted: MediaItem[] = [];

    for (const file of files) {
      const bytes = this.fileBytes(file);

      if (bytes.byteLength > 250 * 1024 * 1024) {
        throw new Error(`${file.name} exceeds the 250MB import limit`);
      }

      const id = randomUUID();
      const safeExtension = extname(file.name).replace(/[^.a-zA-Z0-9]/g, "").slice(0, 12);
      const storedName = `${id}${safeExtension}`;

      this.vault.writeMedia(personId, storedName, bytes);
      this.db.insert(mediaItems).values({
        id,
        personId,
        tabId,
        originalName: file.name.slice(0, 500),
        storedName,
        mimeType: file.type || "application/octet-stream",
        size: bytes.byteLength,
        caption: "",
        notes: "",
        sourceUrl: "",
        importedAt: new Date().toISOString(),
      }).run();
      inserted.push(this.mediaItem(id)!);
    }

    this.touchPerson(personId);
    return inserted;
  }

  updateMedia(
    id: string,
    raw: { caption?: string; notes?: string; sourceUrl?: string; tags?: string[] },
  ): MediaItem {
    const input = mediaUpdateSchema.parse(raw);
    const current = this.db.select().from(mediaItems).where(eq(mediaItems.id, id)).get();

    if (!current) {
      throw new Error("Media not found");
    }

    this.db.update(mediaItems).set({
      caption: input.caption ?? current.caption,
      notes: input.notes ?? current.notes,
      sourceUrl: input.sourceUrl ?? current.sourceUrl,
    }).where(eq(mediaItems.id, id)).run();

    if (input.tags) {
      this.replaceTags(id, input.tags);
    }

    return this.mediaItem(id)!;
  }

  deleteMedia(id: string): void {
    const item = this.db
      .select({
        personId: mediaItems.personId,
        storedName: mediaItems.storedName,
      })
      .from(mediaItems)
      .where(eq(mediaItems.id, id))
      .get();
    const updatedAt = new Date().toISOString();

    this.db.transaction((transaction) => {
      transaction
        .update(people)
        .set({ profilePhotoId: null, updatedAt })
        .where(eq(people.profilePhotoId, id))
        .run();
      transaction.delete(mediaItems).where(eq(mediaItems.id, id)).run();
    });

    if (item) {
      this.vault.removeMedia(item.personId, id, item.storedName);
    }
  }

  mediaPath(id: string): string | null {
    const item = this.db
      .select({
        personId: mediaItems.personId,
        storedName: mediaItems.storedName,
      })
      .from(mediaItems)
      .where(eq(mediaItems.id, id))
      .get();

    return item ? this.vault.resolveMediaPath(item.personId, item.storedName) : null;
  }

  mediaItem(id: string): MediaItem | null {
    const item = this.db.select().from(mediaItems).where(eq(mediaItems.id, id)).get();

    if (!item) {
      return null;
    }

    const itemTags = this.db
      .select({ name: tags.name })
      .from(tags)
      .innerJoin(mediaTags, eq(mediaTags.tagId, tags.id))
      .where(eq(mediaTags.mediaId, id))
      .orderBy(asc(tags.name))
      .all();

    return {
      ...item,
      tags: itemTags.map((tag) => tag.name),
    };
  }

  listPersonMedia(personId: string): MediaItem[] {
    const ids = this.db
      .select({ id: mediaItems.id })
      .from(mediaItems)
      .where(eq(mediaItems.personId, personId))
      .orderBy(desc(mediaItems.importedAt))
      .all();

    return ids.map((item) => this.mediaItem(item.id)!);
  }

  mediaMime(id: string): string | null {
    const item = this.db
      .select({ mimeType: mediaItems.mimeType })
      .from(mediaItems)
      .where(eq(mediaItems.id, id))
      .get();

    return item?.mimeType ?? null;
  }

  profileThumbnailPath(id: string): string | null {
    const item = this.db
      .select({
        id: mediaItems.id,
        personId: mediaItems.personId,
      })
      .from(mediaItems)
      .where(eq(mediaItems.id, id))
      .get();

    if (!item) {
      return null;
    }

    return this.vault.resolveThumbnailPath(item.personId, id) ?? this.mediaPath(id);
  }

  readMedia(id: string): Buffer | null {
    const path = this.mediaPath(id);
    return path ? this.vault.read(path) : null;
  }

  attachProfilePhoto(personId: string, file: UploadFile, thumbnail?: UploadFile): void {
    const mediaTab = this.db.query.personTabs.findFirst({
      columns: { id: true },
      where: (table, operators) => operators.and(
        operators.eq(table.personId, personId),
        operators.eq(table.kind, "media"),
      ),
      orderBy: (table, operators) => operators.asc(table.position),
    }).sync();

    if (!mediaTab) {
      return;
    }

    const currentPerson = this.db
      .select({ profilePhotoId: people.profilePhotoId })
      .from(people)
      .where(eq(people.id, personId))
      .get();
    const [item] = this.uploadMedia(personId, mediaTab.id, [file]);

    if (thumbnail) {
      this.vault.writeThumbnail(personId, item.id, this.fileBytes(thumbnail));
    }

    this.db
      .update(people)
      .set({
        profilePhotoId: item.id,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(people.id, personId))
      .run();

    if (currentPerson?.profilePhotoId) {
      this.vault.removeThumbnail(personId, currentPerson.profilePhotoId);
    }
  }

  private replaceTags(mediaId: string, nextTags: string[]): void {
    this.db.transaction((transaction) => {
      transaction.delete(mediaTags).where(eq(mediaTags.mediaId, mediaId)).run();

      for (const name of [...new Set(nextTags.map((tag) => tag.toLowerCase()))]) {
        transaction
          .insert(tags)
          .values({ id: randomUUID(), name })
          .onConflictDoNothing({ target: tags.name })
          .run();
        const tag = transaction
          .select({ id: tags.id })
          .from(tags)
          .where(eq(tags.name, name))
          .get()!;

        transaction.insert(mediaTags).values({
          mediaId,
          tagId: tag.id,
        }).run();
      }
    });
  }

  private organizeVault(): void {
    const personIds = this.db.select({ id: people.id }).from(people).all();
    const rows = this.db
      .select({
        id: mediaItems.id,
        personId: mediaItems.personId,
        storedName: mediaItems.storedName,
      })
      .from(mediaItems)
      .all();
    const media: StoredMediaFile[] = rows.map((item) => ({
      id: item.id,
      personId: item.personId,
      storedName: item.storedName,
    }));

    this.vault.organize(personIds.map((person) => person.id), media);
  }

  private touchPerson(personId: string): void {
    this.db
      .update(people)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(people.id, personId))
      .run();
  }

  private fileBytes(file: UploadFile): Uint8Array {
    return file.bytes instanceof Uint8Array
      ? file.bytes
      : Uint8Array.from(Object.values(file.bytes as unknown as Record<string, number>));
  }
}
