import {
  blob,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type {
  EditorDocumentData,
  MapFeature,
  MapLayerFolder,
  PersonStatus,
  TabIcon,
  TabKind,
} from "../../shared/types.js";

export const cases = sqliteTable(
  "cases",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("cases_title_idx").on(table.title)],
);

export const migrations = sqliteTable("migrations", {
  version: integer("version").primaryKey(),
  appliedAt: text("applied_at").notNull(),
});

export const people = sqliteTable(
  "people",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => cases.id),
    name: text("name").notNull(),
    aliases: text("aliases_json", { mode: "json" }).$type<string[]>().notNull().default([]),
    birthDate: text("birth_date"),
    summary: text("summary").notNull().default(""),
    profilePhotoId: text("profile_photo_id"),
    status: text("status").$type<PersonStatus>().notNull().default("active"),
    type: text("person_type").$type<"default" | "related">().notNull().default("default"),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("people_name_idx").on(table.name),
    index("people_case_idx").on(table.caseId),
  ],
);

export const personTabs = sqliteTable(
  "person_tabs",
  {
    id: text("id").primaryKey(),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind").$type<TabKind>().notNull(),
    icon: text("icon").$type<TabIcon>().notNull().default("file-text"),
    position: integer("position").notNull(),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("tabs_person_idx").on(table.personId, table.position)],
);

export const textDocuments = sqliteTable(
  "text_documents",
  {
    tabId: text("tab_id")
      .primaryKey()
      .references(() => personTabs.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    content: text("content_json", { mode: "json" })
      .$type<EditorDocumentData>()
      .notNull()
      .default({ blocks: [] }),
    body: text("body").notNull().default(""),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("text_documents_person_idx").on(table.personId)],
);

export const mapDocuments = sqliteTable(
  "map_documents",
  {
    tabId: text("tab_id")
      .primaryKey()
      .references(() => personTabs.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    features: text("features_json", { mode: "json" })
      .$type<MapFeature[]>()
      .notNull()
      .default([]),
    folders: text("folders_json", { mode: "json" })
      .$type<MapLayerFolder[]>()
      .notNull()
      .default([]),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("map_documents_person_idx").on(table.personId)],
);

export const mediaItems = sqliteTable(
  "media_items",
  {
    id: text("id").primaryKey(),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    tabId: text("tab_id")
      .notNull()
      .references(() => personTabs.id, { onDelete: "cascade" }),
    originalName: text("original_name").notNull(),
    storedName: text("stored_name").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    caption: text("caption").notNull().default(""),
    notes: text("notes").notNull().default(""),
    sourceUrl: text("source_url").notNull().default(""),
    importedAt: text("imported_at").notNull(),
  },
  (table) => [index("media_person_idx").on(table.personId, table.tabId)],
);

export const links = sqliteTable(
  "links",
  {
    id: text("id").primaryKey(),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    tabId: text("tab_id")
      .notNull()
      .references(() => personTabs.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    url: text("url").notNull(),
    notes: text("notes").notNull().default(""),
    syncStatus: text("sync_status").$type<"ready" | "unsupported">().notNull(),
    syncMetadata: text("sync_metadata_json", { mode: "json" })
      .$type<Record<string, unknown> | null>(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("links_person_idx").on(table.personId, table.tabId)],
);

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const mediaTags = sqliteTable(
  "media_tags",
  {
    mediaId: text("media_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.mediaId, table.tagId] })],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value_json", { mode: "json" }).$type<unknown>().notNull(),
});

export const socialAccounts = sqliteTable(
  "social_accounts",
  {
    id: text("id").primaryKey(),
    platform: text("platform").notNull(),
    login: text("login").notNull().default(""),
    email: text("email").notNull().default(""),
    passwordEncrypted: blob("password_encrypted", { mode: "buffer" }),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("social_accounts_platform_idx").on(table.platform)],
);

export const relationships = sqliteTable(
  "relationships",
  {
    id: text("id").primaryKey(),
    ownerPersonId: text("owner_person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    relatedPersonId: text("related_person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    relationType: text("relation_type").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    tabId: text("tab_id")
      .notNull()
      .references(() => personTabs.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("relationships_owner_related_unique").on(
      table.ownerPersonId,
      table.relatedPersonId,
    ),
    index("relationships_owner_idx").on(table.ownerPersonId),
    index("relationships_related_idx").on(table.relatedPersonId),
    index("relationships_tab_idx").on(table.tabId),
  ],
);

export const relationPositions = sqliteTable(
  "relation_positions",
  {
    viewPersonId: text("view_person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    tabId: text("tab_id")
      .notNull()
      .references(() => personTabs.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    x: real("x").notNull(),
    y: real("y").notNull(),
  },
  (table) => [primaryKey({ columns: [table.viewPersonId, table.tabId, table.personId] })],
);

export const schema = {
  cases,
  links,
  mapDocuments,
  mediaItems,
  mediaTags,
  migrations,
  people,
  personTabs,
  relationships,
  relationPositions,
  settings,
  socialAccounts,
  tags,
  textDocuments,
};
