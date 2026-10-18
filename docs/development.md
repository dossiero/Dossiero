# Development guide

## Requirements

- Node.js 22 or newer
- npm
- Platform build tools required by `better-sqlite3`

If you use `nvm`, run `nvm use`; the repository includes `.nvmrc`.

## Install and run

```bash
npm install
npm run dev:web
```

Browser development starts Vite on port 5173 and the local data service on `127.0.0.1:4174`.
Development data is written to `.dev-data/` and is ignored by Git.

For the Electron shell:

```bash
npm run dev:desktop
```

This rebuilds the native SQLite dependency for Electron before starting the app. If browser mode
later reports a native module ABI mismatch, run `npm install` to restore the host-Node build.

## Verification

Run the same gate used by CI:

```bash
npm run check
```

The gate typechecks the renderer and Electron/server projects, runs the Node test suite, and creates
a production renderer build. Faster commands are available while iterating:

```bash
npm run typecheck
npm test
npm run build
```

To inspect the browser-development database with Drizzle Studio, stop the development server and
run:

```bash
npm run db:studio
```

The package manifest pins patched transitive versions of `esbuild` and `@electron/get` through npm
overrides because the current drizzle-kit and electron-builder releases otherwise resolve obsolete
vulnerable helpers. When changing either tool, run `npm audit`, `npm run db:studio -- --version`, and
an unpacked desktop package build before removing or changing those overrides.

The typed runtime schema lives in `src/main/persistence/schema.ts`. Schema changes also require a
new numbered migration in `src/main/persistence/migrations.ts` so existing installations upgrade
safely.

## Packaging

```bash
npm run package
```

Platform artifacts are written to `release/` and are intentionally not versioned. For an Apple
Silicon macOS package:

```bash
npm run package -- --mac --arm64
```

Public distribution will also require platform-specific signing and notarization work. A locally
built unsigned package is suitable for development but should not be presented as a trusted public
release.

## Local data and privacy

Browser development data lives under `.dev-data/`. Electron uses its platform-specific `userData`
directory. Never commit either database or media vault. Use fictional data in screenshots and test
fixtures.

The Export backup action writes a ZIP containing a checkpointed SQLite database, the complete media
vault, and a format manifest. Restoration steps and credential portability limitations are
documented in [backups](backups.md).

To test a fresh browser database, first stop the development processes, back up any data you care
about, and remove `.dev-data/` manually. Dossiero creates fictional seed data on first startup.

## Troubleshooting

### Port already in use

Vite requires port 5173 and the development server requires port 4174. Stop the process already
using the port before restarting Dossiero.

### Native SQLite module mismatch

Electron and the installed Node.js version can require different native builds. `npm run
dev:desktop` rebuilds for Electron; `npm install` restores the normal Node.js build.

### Browser starts in transient mode

The renderer could not reach the local Fastify service. Start with `npm run dev:web`, not `vite`
alone, and check the terminal for an error from the API process.
