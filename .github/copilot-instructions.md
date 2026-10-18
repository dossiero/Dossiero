# Dossiero coding instructions

Read and follow the repository-root `AGENTS.md` and `CONTRIBUTING.md` before making changes.

Keep Electron process boundaries explicit, validate cross-process input with Zod, preserve the
person archive lifecycle, and use the shared menu primitives. Organize substantial renderer work by
feature and responsibility. Run `npm run check` before considering a change complete.
