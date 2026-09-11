# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Authoring source for React components published to [21st.dev/@kedhareswer](https://21st.dev/@kedhareswer). Every constraint here exists because **21st ships one component file plus its demos** and resolves everything else against the *installer's* project. Code that only works because of something in this repo is broken code.

[CONTRIBUTING.md](CONTRIBUTING.md) is the full authoring/publishing guide — read it before publishing. The rest of this file is the parts that bite.

## Commands

```bash
npm install                       # always at the root — never inside a component folder
npm run dev                       # Vite workshop, http://localhost:5173
npm run check                     # tsc --noEmit over components/ + dev/
npm test                          # node --test → all tests/*.test.mjs
node tests/<name>.test.mjs        # one test (they're plain scripts, no runner needed)
node scripts/prep-publish.mjs <slug>   # emit publish-ready copy → prints its path
```

Workshop URLs (no toolbar by design; demo + theme come off the URL, links print to console):

```
http://localhost:5173/#<slug>              # demo.tsx
http://localhost:5173/#<slug>/strict       # demo-strict.tsx
http://localhost:5173/?dark#<slug>         # the dark check 21st requires
```

## Layout invariants

- Only `components/` and `library/` publish. `dev/`, `tests/`, `scripts/`, `media/` are local-only.
- Flat, one folder per publishable piece; folder name = slug = frozen once published (renaming breaks installs and the 21st URL).
- One `package.json` and one `node_modules/`, both at the root. No nested installs, no workspaces. New deps go in the root `package.json` **before** you import them (the 21st build gate rejects undeclared imports) and get a note in the folder README.
- `components/<slug>/` = `<slug>.tsx` + `demo.tsx` (+ optional `demo-*.tsx`, `README.md`). Nothing else.

## The `@/components/ui/<slug>` alias, three ways

Demos import the path an installer ends up with. That one import is resolved differently by each tool, so all three must stay in sync:

| Tool | How |
|---|---|
| Vite (`npm run dev`) | regex alias in [vite.config.ts](vite.config.ts) → `components/$1/$1.tsx`. Automatic. |
| `tsc` (`npm run check`) | **one hand-written line per component** in [tsconfig.json](tsconfig.json) `paths` — tsc can't expand a wildcard twice. Adding a component without this line breaks `npm run check`. |
| 21st Studio | its `@/` is a literal path swap with no extension probing → `ENOENT`. `scripts/prep-publish.mjs` rewrites it to `../components/ui/` on the way out. Never publish the repo copy. |

## Component rules that prevent silent breakage

- **Never `h-full` on a component root.** `dev/styles.css` sets `html, body, #root { height: 100% }`; an installed page has no such chain, so percentage heights collapse to 0px while intrinsic-height children still paint — it reads as "some UI, no images", and every other check passes. Components take an explicit `height` prop defaulting to a definite length (`100svh`).
- Styles live in the component file — Tailwind utilities, or a scoped inline `<style>` for keyframes/`clip-path`. No `@import`, no bare `*` / `body` / `:root` resets, no backticks or `${` inside a CSS string.
- Assume only the semantic tokens in [dev/styles.css](dev/styles.css) (`--color-background`, `--color-foreground`, `--color-muted-foreground`, `--color-border`, `--color-primary`). If a piece needs more to look right, it won't survive installation.
- Guard Tailwind Preflight: `img { max-width: 100% }` collapses absolutely-positioned images — set `maxWidth: "none"` explicitly. Give animated media explicit `width`/`height`.
- Honour `prefers-reduced-motion` (`motion-reduce:*`).

## Tests

`tests/*.test.mjs` are node-native, dependency-free, and mostly **source assertions** — they read the `.tsx` as text and assert the install-safety rules above (see [tests/hover-expand-gallery.test.mjs](tests/hover-expand-gallery.test.mjs)). Logic that needs real execution is marked with `// #region` … `// #endregion` in the component and lifted out by the test ([tests/score-zero.test.mjs](tests/score-zero.test.mjs)), so the published component stays one file. Follow that pattern rather than extracting a module.

## Publishing gotchas (full detail in CONTRIBUTING.md §4)

- Run `21st render <file> --demo ./demo.tsx` on the **prepared** copy before publishing. A bare `demo.tsx` without `./` makes the CLI silently render a synthesised counter at exit 0.
- `21st publish --description/--tags` writes to the *draft*, not the component record — set them after with `21st edit component:<id>`. Invented tags are dropped silently.
- Demo tags exist only in Studio's Demo tab; the CLI cannot reach them, and the public page looks fully tagged while they're empty.
- `Published.` / `{"state":"published"}` is not proof. Check `updatedAt` moved via `21st components --status all --scope all`, and count `/s/<tag>` links on the live page.
