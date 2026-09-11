# Tile Scrollbar

A scrollbar built out of tiles on a tilted tray. The page is cut into equal slices, one tile each; tiles behind you press flat and darken, the one you are in stands proud and fills left to right, and a dot marks the tile where each section begins. Click a tile to jump, drag across the tray to scrub, or leave it alone and it blurs back into the page.

```tsx
<TileScrollbar controls="article" />
```

Put it anywhere in the tree — it is `position: fixed` and reads window scroll, so it does not matter where. On screens narrower than `compactBreakpoint` the tray lies down into a bottom dock with the same tile count.

**No dependencies.** No Tailwind either: every rule is in a scoped `<style>` block, so it looks right in a project that has not set up a design system.

## Props

| Prop | Default | |
|---|---|---|
| `columns` | `3` | Tiles across the tray on wide screens |
| `rows` | `8` | Tile rows. `columns * rows` is how many slices the page is cut into |
| `compactColumns` | `8` | Tiles across once the dock takes over. The tile count never changes |
| `compactBreakpoint` | `720` | Viewport width, in px, below which the tray becomes a bottom dock |
| `sections` | `"[data-section]"` | Selector for the page's sections. `""` gives a plain progress tray |
| `introLabel` | `"Introduction"` | Caption shown above the first section |
| `offset` | `28` | Breathing room above a heading when jumping to it, in px |
| `idleMs` | `1500` | Milliseconds of no interaction before the tray blurs back into the page |
| `tileSize` | `30` | Tile edge on wide screens, in px. The dock uses two thirds of it |
| `gap` | `5` | Space between tiles on wide screens, in px |
| `hint` | a sentence | First-run note under the tray, dismissed on first use. `null` renders none |
| `hideNativeScrollbar` | `true` | Hide the host page's scrollbar while mounted |
| `label` | `"Page position"` | Accessible name |
| `controls` | — | `id` of the region being scrolled |
| `className` | `""` | Appended to the tray's wrapper |

## Sections

Anything matching `sections` becomes a stop. Its name comes from `data-section`, or the first heading inside it, or `Section n`:

```html
<section data-section="Splash zone"><h2>The splash zone</h2>…</section>
```

Sections do three things: put a dot on the tile they start in, name the caption and the tooltip while you are inside them, and turn that tile's click into a jump to the heading (with `offset` above it) instead of a jump to a raw percentage. Tiles with no section still scrub and still jump — to their slice of the page.

## Colours

The tray mixes every grey from `--color-background` and `--color-foreground`, so it follows the host's theme with no dark-mode branch, and falls back to a light-page palette when neither token exists.

## Accessibility

The tray is a real `role="scrollbar"`: focusable, with `aria-valuenow` and an `aria-valuetext` that reads `"41%, Middle shore"`. Arrows move one tile (left/right) or one row (up/down) and chain if you press quickly; `PageUp`/`PageDown` move nine tenths of a viewport; `Home`/`End` go to the ends. `prefers-reduced-motion` drops every transition and makes jumps instant.

`hideNativeScrollbar` is the one thing it changes outside itself. It sets an attribute on `<html>` and removes it on unmount — nothing is injected into a page that does not mount the component. Set it to `false` to keep the native bar.
