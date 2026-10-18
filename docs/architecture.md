# Architecture

This document is the maintainer map for Dossiero. It explains where behavior belongs and how data
moves through the application.

## Runtime shapes

Dossiero has one React renderer and three API adapters:

```text
React renderer
    |
    +-- ElectronApi -- preload allowlist -- validated IPC -- DossierService
    |
    +-- WebApi ------ loopback Fastify --- validated dispatch -- DossierService
    |
    +-- MemoryApi --- transient in-memory implementation
```

`DossierApi` in `src/shared/types.ts` is the renderer-facing contract. UI components should depend
on that interface rather than Electron, HTTP, SQLite, or filesystem details.

## Source boundaries

### Shared (`src/shared`)

- `types.ts` owns serializable domain and API types.
- `schemas.ts` validates untrusted values at process boundaries.
- `ipc.ts` defines the Electron channel contract.
- `website.ts` contains shared URL and website metadata behavior.

Types that never cross a process boundary should remain near their renderer feature rather than
expanding the shared contract.

### Main process (`src/main`)

- `index.ts` configures Electron windows, protocols, native actions, and IPC handlers.
- `dispatch.ts` validates transport requests and maps them to domain operations.
- `service.ts` owns the database connection lifecycle and is the stable facade used by transports.
- `people/people-store.ts` owns person lifecycle operations.
- `cases/case-store.ts` owns case creation, listing, and target counts.
- `people/person-query.ts` loads and assembles the complete dossier read model.
- `people/people-search.ts` owns global search queries and result shaping.
- `tabs/tab-store.ts` owns tab creation, ordering, deletion, and tab-owned cleanup.
- `text/text-document-store.ts` owns rich-text document persistence.
- `maps/map-document-store.ts` owns map feature and layer persistence.
- `links/link-store.ts` owns saved-link persistence.
- `media/media-store.ts` owns media records, tags, profile-photo coordination, and media queries.
- `media/media-vault.ts` owns files, directories, thumbnails, and legacy media layout migration.
- Saved-link favicons are fetched by `DossierService` from the fixed Google favicon endpoint and
  stored by `MediaVault` in a hostname-keyed local cache. Renderers only receive local icon URLs.
- `settings/settings-store.ts` owns application settings and stored social-account metadata.
- `external-browser.ts` discovers installed browsers and opens safe external links with the user's
  configured application, falling back to the operating-system default.
- `relations/relationship-store.ts` owns relationship mutations and graph positions.
- `relations/relation-network.ts` owns relationship graph traversal and visible-node calculation.
- `persistence/schema.ts` is the typed Drizzle schema and source of truth for runtime queries.
- `persistence/database.ts` opens the SQLite driver and exposes the Drizzle database.
- `persistence/migrations.ts` preserves the versioned migration path for existing user databases.
- `persistence/seed.ts` creates fictional first-run data through Drizzle.

The stores are feature boundaries, not generic wrappers around individual tables. Transactions stay
inside the store that owns the complete operation. `DossierService` preserves one stable interface
for IPC and HTTP without accumulating domain implementations itself.

### Why Drizzle ORM?

Dossiero uses Drizzle ORM over the existing `better-sqlite3` driver. This combination is intentional:

- The application has one embedded SQLite database and no interchangeable database requirement.
- Historical migrations retain SQLite-specific SQL so existing databases upgrade safely.
- Synchronous transactions make multi-record local operations explicit and easy to test.
- Zod validates external inputs, while the Drizzle schema defines database and query types.

Drizzle was selected instead of Prisma because it works directly with the existing synchronous
driver, has no generated runtime client, and permits explicit SQL where SQLite migrations require
it. Feature stores remain necessary: the ORM provides typed persistence, while stores define domain
ownership and transaction boundaries.

The TypeScript schema and migration history have different jobs:

- `schema.ts` defines the current database shape used by application queries and compile-time types.
- `migrations.ts` upgrades databases created by any previous Dossiero version. Add one new numbered
  migration whenever the schema changes; never rewrite an already released migration.
- `npm run db:studio` opens Drizzle Studio for the browser-development database under `.dev-data/`.

Runtime feature code should use Drizzle. Raw SQL is reserved for schema migrations, SQLite pragmas,
and exceptional queries that cannot be expressed clearly by Drizzle.

### Browser development server (`src/server`)

The Fastify server exposes the same validated operations on loopback for browser development. It is
not a production network service and must remain bound to `127.0.0.1`.

### Renderer (`src/renderer`)

- `api/` selects and implements the three transports and owns the API provider boundary.
- `components/` contains shared UI primitives and multi-feature composition components.
- `features/` contains feature-owned components, hooks, types, constants, and domain logic.
- `lib/` contains cohesive renderer helpers that are shared by multiple features.
- `app/` contains application-shell state and persistence helpers.

The component layout and ownership rules are defined in
[frontend architecture](frontend-architecture.md). `App.tsx` is a small composition root; the
app-shell feature coordinates application state, responsive layout, active-tab rendering, and
dialogs. Feature behavior stays in its owning feature.

## Persistence model

SQLite stores structured records. Imported binary files live in the media vault, grouped by person
ID, and SQLite stores generated filenames plus metadata. Migrations run in ascending version order
when `DossierService` starts.

Text documents keep Editor.js block JSON as their canonical editable representation. The text store
generates and sanitizes an HTML projection in the same transaction for global search, previews, and
future export surfaces. Map descriptions remain small inline TipTap documents stored as sanitized
HTML.

Important invariants:

- User-provided filenames never become storage paths.
- Foreign keys and WAL mode stay enabled.
- Every person belongs to exactly one case. Existing databases migrate people into the General
  case, which is also created for new databases.
- An active-person delete operation archives the person.
- Only Trash permanently deletes or restores a person.
- Default tabs cannot be removed.
- All IPC and HTTP inputs are validated before reaching persistence methods.

Any migration must work on an existing database, have a persistence test, and avoid silently
discarding user data.

## Adding a feature

For a feature that persists data or crosses a process boundary:

1. Add or update serializable types in `src/shared/types.ts`.
2. Define input validation in `src/shared/schemas.ts`.
3. Extend the API contract and every applicable adapter.
4. Implement behavior in the owning feature store. Keep filesystem behavior in `MediaVault` and
   cross-feature coordination in `DossierService` only when no single store owns the operation.
5. Add transport wiring in dispatch, preload, IPC, and the browser server as needed.
6. Build the renderer UI in a focused feature directory.
7. Test domain invariants and channel coverage.
8. Update this document if a boundary or invariant changes.

## Trust boundaries

Treat renderer messages, HTTP payloads, imported files, URLs, and database contents from older
versions as untrusted. Keep Electron context isolation and sandboxing enabled, retain the fixed
preload allowlist, deny renderer navigation, and constrain media operations to the managed vault.
