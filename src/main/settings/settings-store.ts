import { asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  externalBrowserPreferenceSchema,
  settingsSchema,
} from "../../shared/schemas.js";
import type {
  AppSettings,
  SocialAccount,
  SocialAccountInput,
} from "../../shared/types.js";
import type { DossierDatabase } from "../persistence/database.js";
import { settings, socialAccounts } from "../persistence/schema.js";

export class SettingsStore {
  constructor(private readonly db: DossierDatabase) {}

  getSettings(): AppSettings {
    const rows = this.db.select().from(settings).all();
    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const legacyAppearance = values.theme === "light" || values.theme === "matrix"
      ? "light"
      : "dark";
    const externalBrowser = externalBrowserPreferenceSchema.safeParse(values.externalBrowser);

    return {
      theme: "terminal",
      appearance: values.appearance === "light" || values.appearance === "dark" ||
          values.appearance === "system"
        ? values.appearance
        : legacyAppearance,
      startAtLogin: Boolean(values.startAtLogin),
      showMenuBarIcon: Boolean(values.showMenuBarIcon),
      showRelatedPeopleInSidebar: Boolean(values.showRelatedPeopleInSidebar),
      seedDismissed: Boolean(values.seedDismissed),
      externalBrowser: externalBrowser.success
        ? externalBrowser.data
        : { kind: "system" },
    };
  }

  updateSettings(raw: Partial<AppSettings>): AppSettings {
    const input = settingsSchema.parse(raw);

    this.db.transaction((transaction) => {
      for (const [key, value] of Object.entries(input)) {
        transaction
          .insert(settings)
          .values({ key, value })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value },
          })
          .run();
      }
    });

    return this.getSettings();
  }

  listSocialAccounts(): SocialAccount[] {
    return this.db
      .select()
      .from(socialAccounts)
      .orderBy(
        asc(socialAccounts.platform),
        asc(socialAccounts.login),
        asc(socialAccounts.email),
      )
      .all()
      .map((account) => ({
        id: account.id,
        platform: account.platform as SocialAccount["platform"],
        login: account.login,
        email: account.email,
        passwordStored: Boolean(account.passwordEncrypted),
        updatedAt: account.updatedAt,
      }));
  }

  saveSocialAccount(
    input: Omit<SocialAccountInput, "password">,
    encryptedPassword?: Buffer,
  ): SocialAccount {
    const id = input.id ?? randomUUID();
    const existing = this.db
      .select({ passwordEncrypted: socialAccounts.passwordEncrypted })
      .from(socialAccounts)
      .where(eq(socialAccounts.id, id))
      .get();
    const passwordEncrypted = encryptedPassword ?? existing?.passwordEncrypted ?? null;
    const updatedAt = new Date().toISOString();

    this.db
      .insert(socialAccounts)
      .values({
        id,
        platform: input.platform,
        login: input.login,
        email: input.email,
        passwordEncrypted,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: socialAccounts.id,
        set: {
          platform: input.platform,
          login: input.login,
          email: input.email,
          passwordEncrypted,
          updatedAt,
        },
      })
      .run();

    return this.listSocialAccounts().find((account) => account.id === id)!;
  }

  deleteSocialAccount(id: string): void {
    this.db.delete(socialAccounts).where(eq(socialAccounts.id, id)).run();
  }

  encryptedSocialPassword(id: string): Buffer | null {
    const account = this.db
      .select({ passwordEncrypted: socialAccounts.passwordEncrypted })
      .from(socialAccounts)
      .where(eq(socialAccounts.id, id))
      .get();

    return account?.passwordEncrypted ?? null;
  }
}
