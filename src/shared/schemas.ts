import { z } from "zod";

export const idSchema = z.string().uuid();
export const MAX_MEDIA_IMPORT_BYTES = 250 * 1024 * 1024;
export const MAX_PROFILE_THUMBNAIL_BYTES = 5 * 1024 * 1024;

export const caseInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000),
});
const byteValueSchema = z.number().int().min(0).max(255);
const serializedBytePayloadSchema = z
  .record(z.string().regex(/^(0|[1-9]\d*)$/), byteValueSchema)
  .superRefine((value, context) => {
    const indexes = Object.keys(value)
      .map(Number)
      .sort((left, right) => left - right);

    if (indexes.length > MAX_MEDIA_IMPORT_BYTES) {
      context.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: MAX_MEDIA_IMPORT_BYTES,
        inclusive: true,
        type: "array",
        message: "File exceeds the 250MB import limit",
      });
      return;
    }

    const hasMissingIndex = indexes.some((index, position) => index !== position);

    if (hasMissingIndex) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Serialized file bytes must use contiguous numeric indexes",
      });
    }
  })
  .transform((value) => {
    const bytes = Object.entries(value)
      .sort(([left], [right]) => Number(left) - Number(right))
      .map(([, byte]) => byte);

    return Uint8Array.from(bytes);
  });

export const bytePayloadSchema = z.union([
  z.instanceof(Uint8Array).refine(
    (bytes) => bytes.byteLength <= MAX_MEDIA_IMPORT_BYTES,
    "File exceeds the 250MB import limit",
  ),
  z.array(byteValueSchema)
    .max(MAX_MEDIA_IMPORT_BYTES, "File exceeds the 250MB import limit")
    .transform((bytes) => Uint8Array.from(bytes)),
  serializedBytePayloadSchema,
]);

export const uploadFileSchema = z.object({
  name: z.string().min(1).max(500),
  type: z.string().max(200),
  size: z.number().int().nonnegative().max(MAX_MEDIA_IMPORT_BYTES),
  bytes: bytePayloadSchema,
}).superRefine((file, context) => {
  if (file.size !== file.bytes.byteLength) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["size"],
      message: "Declared file size does not match the byte payload",
    });
  }
});

export const mediaUploadPayloadSchema = z.object({
  personId: idSchema,
  tabId: idSchema,
  files: z.array(uploadFileSchema).max(50),
});

export const personInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  aliases: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  birthDate: z.string().max(40).nullable().optional(),
  summary: z.string().max(255).optional(),
  profilePhoto: uploadFileSchema.optional(),
  profileThumbnail: uploadFileSchema.refine(
    (file) => file.size <= MAX_PROFILE_THUMBNAIL_BYTES,
    "Profile thumbnail exceeds the 5MB limit",
  ).optional(),
});
export const tabInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(["text", "media", "links", "relation", "map"]),
});
export const relationTypeSchema = z.string().trim().min(1).max(100);
export const tabIconSchema = z.enum([
  "file-text",
  "images",
  "link",
  "user",
  "book",
  "briefcase",
  "calendar",
  "map-pin",
  "star",
  "tag",
  "folder",
  "camera",
  "globe",
  "shield",
]);
export const textInputSchema = z.object({
  personId: idSchema,
  tabId: idSchema,
  content: z.object({
    time: z.number().finite().optional(),
    blocks: z.array(z.object({
      id: z.string().max(100).optional(),
      type: z.enum([
        "attaches",
        "paragraph",
        "header",
        "image",
        "embed",
        "list",
        "checklist",
        "quote",
        "code",
        "delimiter",
        "table",
      ]),
      data: z.record(z.unknown()),
      tunes: z.record(z.unknown()).optional(),
    })).max(2000),
    version: z.string().max(40).optional(),
  }).refine(
    (content) => JSON.stringify(content).length <= 500000,
    "Document content is too large",
  ),
});
const coordinateSchema = z.tuple([
  z.number().finite().min(-180).max(180),
  z.number().finite().min(-90).max(90),
]);
const mapGeometrySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Point"), coordinates: coordinateSchema }),
  z.object({
    type: z.literal("LineString"),
    coordinates: z.array(coordinateSchema).min(2).max(10000),
  }),
  z.object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(coordinateSchema).min(4).max(10000)).min(1).max(50),
  }),
]);
export const mapFeatureSchema = z.object({
  type: z.literal("Feature"),
  id: z.string().min(1).max(200),
  geometry: mapGeometrySchema,
  properties: z.object({
    label: z.string().max(160).optional(),
    description: z.string().max(20000).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    icon: z.string().max(40).optional(),
    fillColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    strokeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    lineStyle: z.enum(["solid", "dashed", "dotted"]).optional(),
    lineWidth: z.number().int().min(1).max(12).optional(),
    markerStyle: z.enum(["pin", "circle", "square"]).optional(),
    folderId: z.string().max(200).optional(),
    hidden: z.boolean().optional(),
    layerOrder: z.number().finite().optional(),
    shape: z.enum(["pin", "freehand", "line", "rectangle", "polygon"]).optional(),
  }).passthrough(),
});
export const mapLayerFolderSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(80),
  hidden: z.boolean(),
  parentId: z.string().max(200).optional(),
  order: z.number().finite().optional(),
});
export const mapInputSchema = z.object({
  personId: idSchema,
  tabId: idSchema,
  features: z.array(mapFeatureSchema).max(10000),
  folders: z.array(mapLayerFolderSchema).max(500),
});
export const mediaUpdateSchema = z.object({
  caption: z.string().max(1000).optional(),
  notes: z.string().max(5000).optional(),
  sourceUrl: z.union([z.string().url().max(2048), z.literal("")]).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(40).optional(),
});
export const linkInputSchema = z.object({
  personId: idSchema,
  tabId: idSchema,
  label: z.string().trim().max(160),
  url: z.string().url().max(2048),
  notes: z.string().max(5000).optional(),
});
export const externalBrowserPreferenceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("system") }),
  z.object({
    kind: z.literal("application"),
    name: z.string().trim().min(1).max(200),
    path: z.string().min(1).max(4096),
  }),
]);

export const settingsSchema = z.object({
  theme: z.literal("terminal").optional(),
  appearance: z.enum(["light", "dark", "system"]).optional(),
  startAtLogin: z.boolean().optional(),
  showMenuBarIcon: z.boolean().optional(),
  showRelatedPeopleInSidebar: z.boolean().optional(),
  seedDismissed: z.boolean().optional(),
  externalBrowser: externalBrowserPreferenceSchema.optional(),
});

export const socialAccountInputSchema = z.object({
  id: idSchema.optional(),
  platform: z.enum(["facebook", "instagram", "x", "tiktok", "linkedin", "reddit", "other"]),
  login: z.string().trim().max(320),
  email: z.union([z.string().trim().email().max(320), z.literal("")]),
  password: z.string().max(10000).optional(),
}).refine((value) => Boolean(value.login || value.email), {
  message: "Enter a login or email address",
});

export const safeExternalUrl = (value: string) => {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http(s) links are allowed");
  }
  return url.toString();
};
