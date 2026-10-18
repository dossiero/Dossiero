# Dossiero

Dossiero is a local-first desktop workspace for maintaining structured person dossiers. It combines
an Electron shell, a React interface, SQLite storage, a managed media vault, relationship graphs,
rich-text notes, and map annotations.

The app has no account, telemetry, cloud sync, scraping, or remote dossier API. Development map
tiles and geocoding use the external providers allowed by the renderer's Content Security Policy.
Saved-link favicons are fetched on demand from Google's favicon service and cached locally.

## Download

- [macOS — Apple Silicon](https://github.com/dossiero/Dossiero/releases/download/v0.1.1/Dossiero-0.1.1-mac-arm64.dmg)
- [macOS — Intel](https://github.com/dossiero/Dossiero/releases/download/v0.1.1/Dossiero-0.1.1-mac-x64.dmg)
- [Windows — x64](https://github.com/dossiero/Dossiero/releases/download/v0.1.1/Dossiero-0.1.1-windows-x64-setup.exe)
- [Linux — x64](https://github.com/dossiero/Dossiero/releases/download/v0.1.1/Dossiero-0.1.1-linux-x86_64.AppImage)


## Quick start

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm run dev:web
```

Open `http://localhost:5173`. This starts both Vite and the loopback Fastify data service. For the
native desktop shell, run:

```bash
npm run dev:desktop
```

Before opening a pull request:

```bash
npm run check
```

See the [development guide](docs/development.md) for packaging, data locations, native dependency
troubleshooting, and the complete command reference.

## Features

- Typed Drizzle ORM persistence over local SQLite, with a per-person managed media vault
- Structured profiles with archive, restore, pinning, and permanent-delete lifecycle
- Custom text, media, link, relationship, and map tabs
- Relationship graphs with persistent per-view layout
- Rich-text notes and searchable dossier content
- Map layers, annotations, import, and export
- Browser development mode and packaged Electron desktop mode behind one typed API
- Dark and light appearances for the Terminal visual theme

## How it works

React depends only on the typed `DossierApi`. At startup, the renderer selects an adapter:

- `ElectronApi` uses the context-isolated, allowlisted preload bridge and validated IPC handlers.
- `WebApi` calls a Fastify service bound to `127.0.0.1:4174` for browser development.
- `MemoryApi` provides clearly labelled transient mode when the local service is unavailable.

```text
src/shared/       Serializable domain types, Zod schemas, and IPC contracts
src/main/         Electron integration, SQLite persistence, filesystem access, and IPC
src/preload/      Narrow context bridge exposed to the renderer
src/server/       Loopback development transport
src/renderer/api/ Electron, web, and transient API adapters
src/renderer/     React application and feature components
tests/            Node integration and domain tests
```

Read the [architecture guide](docs/architecture.md) before changing persistence or a cross-process
contract.

## Local data

Electron stores data inside its platform-specific `userData` directory:

```text
<userData>/vault/dossier.sqlite
<userData>/vault/media/<person-id>/<generated-id>.<extension>
<userData>/vault/media/.favicons/<hostname-hash>.img
```

Browser development stores data under `.dev-data/`. Binary files do not enter SQLite; the database
contains generated filenames, metadata, annotations, links, and relationships. The Export backup
action creates a ZIP containing `dossier.sqlite`, the complete `media/` directory, and a versioned
manifest. See [backup and restoration](docs/backups.md) before replacing an existing vault.

## Security model

- Electron runs with context isolation, sandboxing, and no renderer Node.js integration.
- The preload exposes one frozen, typed bridge with a fixed channel allowlist.
- IPC and HTTP payloads are validated with Zod before reaching persistence code.
- The renderer uses a restrictive Content Security Policy.
- Generated UUID filenames keep imported names out of storage paths.
- Electron denies renderer navigation and delegates safe HTTP(S) links to the configured external
  browser, using the operating-system default unless the user selects another application.

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Never attach a
real dossier, database, credential, or private media to a public report.

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), follow the
[Code of Conduct](CODE_OF_CONDUCT.md), and run `npm run check` before submitting a pull request.
The root [AGENTS.md](AGENTS.md) records detailed implementation boundaries for coding agents and
human maintainers.

## Packaging

```bash
npm run package
```

Artifacts are written to `release/`. Public desktop distribution still requires the appropriate
platform signing and, on macOS, notarization setup.

## Author

Dossiero is created and maintained by [Tudor Bostan](https://github.com/dossiero).

Use this repository's [GitHub Issues](https://github.com/dossiero/Dossiero/issues) for bugs,
support questions, and feature requests.

## License

Copyright © 2026 Tudor Bostan.

Dossiero is free software licensed under the
[GNU General Public License version 3](LICENSE). You may use, study, modify, and redistribute it
under GPLv3's terms. Distributed modified versions and derivative works must remain under GPLv3,
with their corresponding source code made available as required by the license.
