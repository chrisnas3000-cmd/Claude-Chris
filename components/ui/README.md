# components/ui — not wired up

These two files were added on request. **Nothing in this repository can run
them yet**, and nothing imports them. They sit here inert.

Eleventy's input directory is `src/`, so this folder is outside the build and
its presence cannot break `npm run build`, `npm test` or the deployed site.

## Why they don't run

The integration brief assumed a shadcn + Tailwind + TypeScript project. This
repository is none of those:

| Assumed | Actually here |
| --- | --- |
| React | Nunjucks templates (`.njk`) rendered by Eleventy |
| TypeScript | Vanilla JS, no `tsconfig.json`, no compiler |
| Tailwind CSS | Hand-written CSS with custom properties |
| shadcn (`components.json`) | No `components.json`, no CLI, no bundler |
| A bundler | None — Eleventy copies static assets |

`package.json` has zero runtime dependencies. Installing `react-icons` alone
would not help: there is nothing to compile JSX or resolve the `@/` alias.

See the root `README.md` and the reply that accompanied these files for the
three ways forward.

## Changes made to the source

One line differs from the snippet as supplied. The inline `style` object sets
CSS custom properties, which TypeScript's `CSSProperties` type does not permit,
so the original fails to compile in exactly the kind of project this component
is meant for. A `as React.CSSProperties` cast was added.

## Known problems to fix before shipping this component anywhere

- **Hover-only.** The labels are revealed by `:hover`. On a touch device they
  never appear, so the menu reads as five unlabelled circles.
- **Not keyboard accessible.** The items are `<li>` elements with
  `cursor: pointer` and no link, button, `href`, `tabindex` or focus state, so
  they cannot be reached or activated by keyboard.
- **`bg-dark` is not a Tailwind class.** Unless it is defined in the theme it
  resolves to nothing.
- **Not responsive.** Five items expanding to 180px plus gaps needs roughly
  1000px of width; the row overflows below that.
- **Nothing is configurable.** `menuItems` is a module-level constant, so the
  component renders the same five items wherever it is used. It needs an
  `items` prop to be reusable.
- **Nested full-height wrappers.** `demo.tsx` wraps the component in
  `h-screen`, and the component itself also sets `min-h-screen`.
