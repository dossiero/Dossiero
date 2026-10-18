# Frontend architecture

This document defines the renderer structure used by Dossiero. It is a practical convention for this
application, not a requirement to create a file for every three-line helper.

## Current boundaries

`App.tsx` is the composition root. The app-shell feature owns application coordination, responsive
layout, active-tab routing, modal coordination, and the stateful application hook. Feature
directories own their views and behavior. The map feature further separates document persistence,
viewport state, camera input, drawing, selection, feature dragging, geometry, import/export, and
layer ordering.

The shared `components/` directory contains only components with multiple feature consumers.
Renderer-wide CSS is limited to design tokens, resets, global utilities, and shell rules; styled
components import their colocated stylesheet.

## Target directories

Use feature ownership first. A component used by one feature belongs to that feature; a component
moves to the shared components directory only after it has a real second consumer.

```text
src/renderer/
  app/                         Application-wide state and configuration
  components/                  Shared, reusable UI components
    component-name/
      component-name.tsx
      component-name.css
      component-name.logic.ts  Optional non-React logic
      component-name.types.ts  Optional substantial or shared props/types
  features/
    feature-name/
      components/
        component-name/
          component-name.tsx
          component-name.css
          component-name.logic.ts
          component-name.types.ts
      hooks/
      feature-name.types.ts
      feature-name.constants.ts
```

Do not add empty `logic` or `types` files just to satisfy the shape. A styled component owns and
imports its stylesheet. Extract a `*.logic.ts` module when calculations, parsing, formatting, or
state transitions can be understood and tested without React. Extract `*.types.ts` when the types
are substantial, shared by sibling files, or obscure the component's public API.

The `src/renderer/lib/` directory is reserved for cohesive helpers with multiple feature consumers.
Feature-only helpers stay inside their feature and should be named for their responsibility rather
than placed in a generic `utils.ts`.

Use `@/` for renderer-root imports and `@shared/` for shared cross-process types and helpers. Use
relative `./` imports only for colocated files in the same component folder. For example:

```ts
import { Button } from "@/components/button/button";
import type { MediaItem } from "@shared/types";
import "./media-card.css";
```

Application headings use `Title` from `@/components/title/title` with an explicit semantic level.
Do not style title hierarchy by scattering raw `<h1>` through `<h6>` elements across features.
Third-party title primitives such as Radix dialog titles remain responsible for their own required
accessibility semantics.

## Component responsibilities

- Containers load data, coordinate mutations, and connect feature state to the API.
- View components render one understandable surface and receive explicit props.
- Hooks own cohesive stateful behavior, subscriptions, or queued persistence.
- Logic modules own pure calculations, transformations, parsers, and formatters.
- Constants replace unexplained timing, breakpoint, sizing, and limit literals. Name constants by
  meaning and keep them at the narrowest shared scope.

A component needs a structure review when it approaches 500 lines, combines two or more of the
responsibilities above, or requires unrelated state and callbacks to understand one interaction.
Line count is an alarm, not a goal: a 300-line component can still have too many responsibilities.

Use descriptive names. Avoid single-letter names except conventional short callback coordinates or
indices, and avoid vague names such as `data`, `value`, `thing`, `handler`, or `temp` when a domain
name is available. Event handlers should describe the event or result (`handleMediaDrop`,
`openInspector`, `saveRelationship`).

## Change workflow

Keep migrations in coherent, behavior-preserving batches. Run typechecking and focused tests after
each substantial extraction, and run `npm run check` before completion. Add focused tests when pure
logic, persistence behavior, validation, or cross-process contracts change.

## Automated guardrail

`npm run check:renderer-structure` prevents flat or mixed-responsibility component files, private
components hidden in parent TSX files, raw headings, deep relative imports, oversized TSX and CSS,
and feature stylesheets without a component owner. Radix dropdown and context-menu modules are the
only allowed cohesive multi-component families. There are no legacy size or location exceptions.
