import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/main/persistence/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "./.dev-data/dossier.sqlite",
  },
});
