# Dossiero AI implementation guidance

## Start here

- Read `README.md`, `CONTRIBUTING.md`, and the relevant section of `docs/architecture.md` before
  changing code.
- Treat dossier databases, media, credentials, and screenshots as private. Use only fictional or
  thoroughly anonymized data in tests, documentation, issues, and commits.
- Keep changes focused. Do not combine feature work with broad formatting or unrelated cleanup.
- Run `npm run check` before declaring implementation work complete. Add focused tests when domain
  behavior, persistence, validation, or cross-process contracts change.

## Source readability

- Write source code for human maintainers. Never compress code to save lines, tokens, or vertical space.
- Use one statement per line. Do not join declarations, conditionals, state updates, or cleanup logic with semicolons on one line.
- Keep TypeScript and TSX lines at roughly 100 characters where practical. Wrap long function signatures, object literals, conditional expressions, and callback bodies.
- Format non-trivial JSX as a multiline tree. Put one prop per line when a component invocation no longer fits comfortably on one line.
- Format CSS with one declaration per line and multiline rule blocks. Do not add minified-style CSS to source files.
- Give component props and shared data structures named interfaces or type aliases when the inline type is long.
- Extract helpers or subcomponents when a function mixes distinct responsibilities or becomes difficult to scan.
- Prefer explicit branches and descriptive intermediate variables over dense nested ternaries.
- Preserve existing behavior while reformatting. Run typechecking and relevant tests after structural cleanup.
- Generated and vendored files are exempt. Application source is not.

## CSS naming and selectors

- Use BEM for application-owned component CSS: `.block`, `.block__element`, `.block--modifier`,
  and `.block__element--modifier`.
- Match the block name to the owning component. Give meaningful DOM nodes explicit element classes
  instead of styling them by tag name or position.
- Avoid chained descendant and child selectors such as `.card.active .body > span`, positional
  selectors, and tag-dependent selectors. Put the intended BEM class on the target element instead.
- Keep selectors shallow: normally one application class plus a pseudo-class, pseudo-element, or
  state attribute. Shared utility or component classes may be composed in markup when intentional.
- Third-party primitive state attributes and existing shared global utility rules are exempt when
  wrapping them in local classes would reduce clarity.

## Feature structure and file boundaries

- Read `docs/frontend-architecture.md` before adding or restructuring renderer components.
- Put new feature-owned components under
  `src/renderer/features/<feature>/components/<component>/<component>.tsx`. Put a genuinely shared
  component under `src/renderer/components/<component>/<component>.tsx` only when it has multiple
  feature consumers.
- A styled component must import a colocated `<component>.css`. Use `<component>.logic.ts` for
  non-trivial logic that can be understood or tested without React, and `<component>.types.ts` for
  substantial types shared by sibling files. Do not create empty companion files.
- In renderer code, use `@/` for imports rooted at `src/renderer` and `@shared/` for imports rooted
  at `src/shared`. Keep `./` imports for files colocated in the same component folder. Do not use
  long parent traversals such as `../../../../components/ui`.
- Use the shared `Title` component from `@/components/title/title` for application headings and set
  its semantic `level`. Do not add raw `<h1>` through `<h6>` elements in renderer features. Keep
  Radix dialog and alert title primitives when their accessibility contract requires them.
- Do not add new flat files to `src/renderer/components/` or append unrelated components to an
  existing module. Treat the legacy flat files as migration debt, not examples to copy.
- Replace unexplained breakpoints, delays, dimensions, and limits with descriptive constants kept at
  the narrowest shared scope. Use descriptive domain names; avoid vague names and unexplained
  abbreviations.
- Organize large renderer features by responsibility rather than keeping the entire feature in one
  component file. A feature directory may contain its container, focused view components, hooks,
  domain helpers, types, and styles.
- Keep Electron process boundaries explicit:
  - `src/main/` owns desktop integration, persistence, filesystem access, and IPC implementations.
  - `src/renderer/` owns React state and presentation.
  - `src/shared/` owns serializable contracts and types used on both sides.
- In `src/main/`, keep `DossierService` as the transport-facing facade. Put persisted behavior in the
  owning feature store (`people`, `tabs`, `text`, `maps`, `links`, `media`, or `settings`), graph
  traversal in `relations`, the Drizzle schema and migration concerns in `persistence`, and
  filesystem behavior in `MediaVault`.
- Stores are cohesive domain boundaries, not one-class-per-table wrappers. A transaction belongs in
  the store that owns the whole operation; do not split one atomic write across independent stores.
- Use the Drizzle schema and query builder for runtime persistence. Keep raw SQL inside numbered
  migrations unless a query cannot be expressed clearly in Drizzle, and document that exception.
- When the database changes, update `persistence/schema.ts` and append a new migration in
  `persistence/migrations.ts`. Never edit a migration that may have run on a user database.
- In React features, prefer this practical separation when the feature is non-trivial:
  - A container component coordinates data loading, persistence, and feature-level state.
  - Focused components render one surface or interaction, such as a canvas, toolbar, sidebar, or
    details editor.
  - Custom hooks own cohesive stateful behavior that is reused or would otherwise dominate the
    component, such as drawing interactions or queued persistence.
  - Pure domain modules own geometry, ordering, parsing, formatting, import, and export logic.
- Do not create Rails-style controller, presenter, or service layers by default. Add a named layer
  only when it has a clear responsibility in this application.
- Do not use a catch-all `utils.ts` for unrelated helpers. Name modules after the domain they serve,
  such as `map-geometry.ts`, `map-layer-order.ts`, or `map-export.ts`. A small feature-local
  `utils.ts` is acceptable only when every export is cohesive and the filename remains unambiguous.
- Keep types close to their owner. Put cross-process persistence contracts in `src/shared/types.ts`;
  put renderer-only feature types in a feature-local `types.ts` or beside the code that owns them.
- Extract a file when a component mixes orchestration with substantial rendering, contains several
  independently testable algorithms, or requires scrolling through unrelated sections to make a
  focused change. File length is a signal, not the sole rule, but a hand-written TSX file approaching
  500 lines should trigger a structure review.
- Do not raise renderer structure baselines or add legacy exceptions to bypass
  `npm run check:renderer-structure`. Split or colocate the code instead.
- Avoid tiny one-export files that make navigation harder without creating a meaningful boundary.
  Prefer a few cohesive modules over either one giant file or dozens of fragments.
- When splitting an existing feature, preserve behavior first, move pure logic before stateful UI,
  and run typechecking plus relevant tests after each coherent extraction.

## Context actions and dropdowns

- Reuse the menu primitives exported by `src/renderer/components/ui.tsx` for every contextual action or dropdown.
- For right-click actions use `ContextMenu`, `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuItem`, and `ContextMenuSeparator`.
- For click-triggered actions use the matching `Dropdown*` primitives.
- Keep common styling in the shared `ui-menu`, `ui-menu-item`, and `ui-menu-separator` rules. Do not introduce component-local menu surfaces.
- Mark destructive or archive actions with the shared `danger` state. Preserve Radix keyboard navigation and focus management.

## Person lifecycle

- Person status is internal lifecycle state, not an editable profile field.
- Active lists and global search exclude archived people.
- A delete action on an active person archives the person. Only the Trash view may permanently delete a person or restore one.
