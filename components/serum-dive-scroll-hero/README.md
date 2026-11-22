# Serum Dive Scroll Hero

A pinned, scroll-driven product story for a serum, told in six scenes.

1. The page opens on fogged pink glass. The wordmark is finger-drawn in the condensation, with drips running down, and the bottle is a blur behind it. A question and a "Shop the serum" pill sit on the right.
2. The fog clears and "DEHYDRATED" sharpens behind the bottle.
3. Water rises up the frame, turning the dry pink wall into a teal pool with moving caustics. The "DE" dissolves, leaving "HYDRATED".
4. The camera pushes in on the bottle while the word re-centres around it.
5. The word floats up and blurs away, and the camera closes in on the cap.
6. The dropper lifts out of the bottle, and the last line brings an "Add to bag" pill. When the scene scrolls away, that pill docks in the nav beside the wordmark.

The placeholder wordmark is "KEDHAR".

**No dependencies.** React is the only import.

## Motion

| Scroll (share of the pin) | What happens |
|---|---|
| 0.05 – 0.13 | The intro line leaves. The fog thins from a 16 px blur to nothing. The word sharpens from a 22 px blur. |
| 0.18 – 0.34 | The waterline rises with a bright surface line, and the wet wall is revealed under it. |
| 0.24 – 0.35 | The prefix ("DE") blurs, lifts and fades. |
| 0.38 – 0.54 | Push-in to 1.25×. The word grows (by font size) and re-centres, and the bottle stays at its letter junction. |
| 0.57 – 0.71 | The letters rise and blur away, right-hand letters first. The camera closes in to 1.6×, and the wall softens (depth of field). |
| 0.74 – 0.86 | The dropper lifts until the pipette clears the neck. Its wall shadow lifts with it. |
| After the pin | The scene scrolls up under the nav. The last line fades before reaching the nav, and the pill sticks in the nav row. |

Notes on the motion:

- Scroll input is eased: a lerped progress, frame-rate independent.
- Each line of copy leaves before the next one arrives (0.04 – 0.05 of a gap), and every line rests fully sharp.
- The eased progress survives a resize or a late font, so the scene never snaps to the scroll position mid-move.
- The loop pauses when the hero is off screen or the tab is hidden.
- Under `prefers-reduced-motion` the hero does not pin. It shows one still frame (the pool, "HYDRATED", the bottle) with the last line and its pill.

## Autoplay

`autoPlay` is off by default. Turn it on where nobody will scroll: a preview iframe, a cover video, a kiosk.

- It plays the dive once, by scrolling the page, so the scrollbar and the story stay in step.
- It moves from rest to rest on a sine ease and pauses briefly at each. There is one rest per line of copy (`T.stops`), each with its line fully in and nothing mid-move. It ends on the last line with the pill, before the scene starts to leave.
- It only starts when the hero opens at the top of the viewport and nothing has been scrolled.
- A wheel, a touch drag, a scroll key or a scrollbar drag ends it for good. The scene is already where the scroll position says, so nothing jumps.
- On a page that cannot scroll, the scene still plays and then stays on its last line until the page really scrolls.
- It never runs under `prefers-reduced-motion`.

| `autoPlayDuration` 18 s (default) | Scene |
|---|---|
| 1.4 – 2.7 s | The intro line leaves, the fog clears and the word sharpens. |
| 4.3 – 6.3 s | The water rises. |
| 8.0 – 10.1 s | Push-in. |
| 11.7 – 13.9 s | The letters float away and the camera closes in. |
| 15.5 – 17.3 s | The dropper lifts and the pill arrives. |

It rests at 3.5, 7.1, 10.7 and 14.4 s, and stops at 18 s.

## Loading

- Until the fonts and all six pictures are in (2.5 s at most), the stage shows the first line and its pill on the plain wall colour. Nothing half-laid-out is painted.
- The scene then fades in whole over 0.6 s, already in its first-frame layout. Autoplay starts after that.

## Layout

- Every picture is laid out at its on-screen size each frame, never enlarged with `transform: scale`. That covers the wall, the bottle, the two dropper parts and their shadows.
- The dropper is drawn twice from one image, clipped at the collar. The pipette sits behind the glass and the collar in front, so it reads as inside the bottle.
- The word is measured once its web font has loaded, and measured again if a font loads later. The bottle always stands at the junction between "HYD" and "RATED".
- On narrower desktop screens the re-centred word slides (and, if it must, shrinks) so the bottle keeps 28 px clear of the copy column.
- Wide screens put the copy in the left third, mirroring the intro on the right. Below a 1.05 aspect ratio the copy stacks under the nav, and the bottle is smaller and centred.
- The pill docks under its line, nudged just enough to stay 16 px clear of the wordmark and the links. On phones, where it cannot clear both, it sits centred in the gap between them. Below 380 px the pill, the wordmark tracking and the link gap tighten so it still fits.

## Usage

```tsx
import SerumDiveScrollHero from "@/components/ui/serum-dive-scroll-hero"

<SerumDiveScrollHero />
<SerumDiveScrollHero brand="DEWLINE" price="$48" screens={5} onAddToBag={() => openCart()} />
<SerumDiveScrollHero autoPlay autoPlayDuration={14000} />
```

Put your next section straight after it. The hero's bottom edge is where the pinned scene hands off. The nav rides over the first 72 px of that section as it leaves, so give the section a light background and at least 72 px of top padding.

Give the hero the full width of the page. Inside a flex parent, set `width: 100%` on its wrapper: a flex item left at `width: auto` shrinks the hero to a strip. The demo does this, because 21st centres every demo in a flex box.

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `"KEDHAR"` | The nav wordmark and the one drawn in the fog. |
| `price` | `"$64"` | Shown in both pills. |
| `bagCount` | `2` | Badge beside "Bag". |
| `intro` | question, sub-line, "Shop the serum" | `{ title, accent, sub, cta }`. The `accent` word is set in teal. |
| `beats` | five lines | `{ title, sub }[]`. `\n` breaks a title. The last line carries the add-to-bag pill. |
| `ctaLabel` | `"Add to bag"` | |
| `word` | `["DE", "HYDRATED"]` | The prefix that dissolves, then the word that stays. |
| `junction` | `3` | The bottle stands before this letter of the word. |
| `onAddToBag` | — | Called by both pills. |
| `height` | `100svh` | Height of the pinned stage. Must be a definite length. |
| `screens` | `6` | How many stage heights of scrolling the story takes. |
| `autoPlay` | `false` | Plays the dive once on its own when the hero opens at the top of the page. Any scroll input ends it. |
| `autoPlayDuration` | `18000` | How long autoplay takes, in ms (2000 at least). |
| `imageBase` | `https://kedhar-components.pages.dev/serum-dive-scroll-hero/` | Holds `wall-dry`, `wall-wet`, `bottle`, `dropper` and the two `*-shadow` `.webp` files. |
| `fontHref` | Google Fonts (Archivo at 125% width, Instrument Sans) | Pass `null` to bring your own. |

## Notes

- The pictures were generated with ChatGPT:
  - the pool wall, wet and dry, in one framing so the ledge lines up;
  - a sheet with the bottle and the dropper apart, keyed out locally with one alpha component each. The pipette was shortened so it can clear the neck.
- It assumes no theme tokens. The scene is a photograph with its own palette, so it looks the same in light and dark.
