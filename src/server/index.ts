import cors from "@fastify/cors";
import Fastify from "fastify";
import { createReadStream, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DossierService } from "../main/service.js";
import { dispatchCore } from "../main/dispatch.js";
import { IPC_CHANNELS, type IpcChannel } from "../shared/ipc.js";
import { idSchema } from "../shared/schemas.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const service = new DossierService(join(root, ".dev-data"));
const app = Fastify({
  logger: false,
  bodyLimit: 300 * 1024 * 1024,
});

await app.register(cors, {
  origin: /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,
});

app.get("/health", async () => ({ ok: true }));

app.get("/backup", async (_request, reply) => {
  const date = new Date().toISOString().slice(0, 10);
  const backup = await service.createTemporaryBackup();
  const stream = createReadStream(backup.path);
  stream.on("close", backup.cleanup);

  return reply
    .header("Content-Disposition", `attachment; filename="dossiero-backup-${date}.zip"`)
    .type("application/zip")
    .send(stream);
});

app.get("/media/:id/profile-thumbnail", async (request, reply) => {
  const id = idSchema.parse((request.params as { id: string }).id);
  const path = service.profileThumbnailPath(id);

  if (!path) {
    return reply.code(404).send({ error: "Not found" });
  }

  const data = readFileSync(path);
  const mimeType = path.endsWith(".webp")
    ? "image/webp"
    : service.mediaMime(id) ?? "application/octet-stream";

  return reply
    .header("Cache-Control", "private, max-age=300")
    .type(mimeType)
    .send(data);
});

app.get("/media/:id", async (request, reply) => {
  const id = idSchema.parse((request.params as { id: string }).id);
  const path = service.mediaPath(id);

  if (!path) {
    return reply.code(404).send({ error: "Not found" });
  }

  const data = service.readMedia(id);

  if (!data) {
    return reply.code(404).send({ error: "Not found" });
  }

  return reply
    .header("Cache-Control", "private, max-age=300")
    .type(service.mediaMime(id) ?? "application/octet-stream")
    .send(data);
});

app.get("/links/:id/favicon", async (request, reply) => {
  const id = idSchema.parse((request.params as { id: string }).id);
  const favicon = await service.linkFavicon(id);

  if (!favicon) {
    return reply.code(404).send({ error: "Not found" });
  }

  return reply
    .header("Cache-Control", "private, max-age=86400")
    .type(favicon.mimeType)
    .send(favicon.bytes);
});

app.post("/rpc/:channel", async (request, reply) => {
  const channel = (request.params as { channel: string }).channel as IpcChannel;
  const isKnownChannel = (IPC_CHANNELS as readonly string[]).includes(channel);

  if (!isKnownChannel) {
    return reply.code(404).send({ error: "Unknown channel" });
  }

  const desktopOnlyChannels: readonly IpcChannel[] = [
    "media:choose",
    "media:reveal",
    "media:folder",
    "backup:export",
    "browsers:list",
    "browsers:choose",
  ];

  if (desktopOnlyChannels.includes(channel)) {
    return reply.code(400).send({ error: "Desktop only" });
  }

  try {
    return { data: dispatchCore(service, channel, request.body ?? {}) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";

    return reply.code(400).send({ error: message });
  }
});

const stop = (): void => {
  service.close();
  void app.close();
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

await app.listen({
  port: 4174,
  host: "127.0.0.1",
});

console.log("Dossiero dev service ready on http://127.0.0.1:4174");
