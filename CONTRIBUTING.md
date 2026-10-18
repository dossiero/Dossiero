# Contributing to Dossiero

Thanks for helping improve Dossiero. This guide describes the expected development workflow and
the architectural boundaries that keep the desktop and browser versions aligned.

## Before you start

- Search existing issues before opening a new one.
- For a substantial feature or architecture change, open an issue first so the approach can be
  discussed before a large implementation is written.
- Never include a real dossier, database, media vault, credential, or other private data in an
  issue, test fixture, screenshot, or commit.

## Local setup

Install Node.js 22 or newer and npm, then run:

```bash
npm install
npm run dev:web
```

The browser UI is available at `http://localhost:5173`. See
[docs/development.md](docs/development.md) for desktop development, data locations, and
troubleshooting.

## Making a change

1. Create a focused branch from the default branch.
2. Keep the change small enough to review and avoid unrelated formatting churn.
3. Add or update tests for behavior changes.
4. Update user or architecture documentation when the change affects either.
5. Run the complete local gate:

   ```bash
   npm run check
   ```

6. Open a pull request and explain the user-visible result, implementation approach, verification,
   and any data migration or security implications.

## Code organization

- `src/main/` owns Electron integration, persistence, filesystem access, and IPC implementations.
- `src/preload/` exposes the narrow, allowlisted Electron bridge.
- `src/server/` provides the loopback HTTP transport used during browser development.
- `src/shared/` contains serializable types, validation schemas, and contracts used across process
  boundaries.
- `src/renderer/` owns React state and presentation. Larger features should use a feature directory
  containing focused components, hooks, types, domain helpers, and styles.

Follow [the frontend architecture guide](docs/frontend-architecture.md) when adding or restructuring
renderer components. New components use feature ownership, one folder per component, and colocated
styles rather than extending the legacy flat component directory or global feature stylesheet.

Read [docs/architecture.md](docs/architecture.md) before changing a cross-process contract or the
data model. The repository's [AGENTS.md](AGENTS.md) contains the detailed implementation rules used
by coding agents; those readability and lifecycle rules are equally useful to human contributors.

## Coding standards

- Keep TypeScript strict and validate untrusted IPC and HTTP input with Zod.
- Prefer explicit, readable branches over compressed expressions.
- Keep source lines near 100 characters where practical and use one statement per line.
- Reuse shared menu primitives from `src/renderer/components/ui.tsx`.
- Preserve the person lifecycle: normal deletion archives; only Trash can restore or permanently
  delete.
- Keep tests deterministic and use temporary directories for persistence tests.
- Do not commit generated output from `dist/`, `dist-electron/`, `release/`, or local `.dev-data/`.

## Commit and pull request scope

There is no required commit-message convention. Use a short imperative subject such as
`Add map layer visibility controls`. Pull requests should do one coherent job; follow-up cleanup is
better as a separate change when it is not required for correctness.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
