# Sheen Board Landing

A dark, one-page landing for Sheen, a client board Kedhareswer designed for freelancers and small studios. Light shafts fall into the hero, headlines resolve word by word out of a blur, and the product board is built in DOM, so it stays sharp at any size and the page loads no images.

## Sections

- **Nav.** A 54px logo tile, five section links and a Sign up button, floating over the page. The links scroll the page smoothly. Below 810px the links fold into a menu.
- **Hero.** Three blurred light shafts swing in from the top right while the page drifts up 60px. The headline lands word by word. The board then tilts up into place, with a dragged card and three collaborators' pointers (Kedhareswer, Client 1, Client 2).
- **Features.** Four cards with skewed glass-panel art in an endless slideshow. It advances one card every 4 seconds; the arrows step it by hand and touch devices can swipe.
- **Two views.** Folder tabs on top of a tilted screen switch the board between Your view and Client view. Client view blurs the internal columns and adds a New task button.
- **Trust.** Three cards on colour-washed frames: an AI composer with a blinking caret, a demo sign-in, and a data vault with an orbiting dot.
- **FAQ**, **Pricing** (three tiers, the middle one under a Recommended tab), a **CTA** card with a board slice, and the **footer**.

Every contact link points to `email`. The board uses placeholders (Project 01 to Project 07, Client 1 to Client 3).

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | Height of the scrolling page. Any CSS length. |
| `email` | `"kedhareswer.12110626@gmail.com"` | Where every Sign up / Contact link goes. |
| `className` | `""` | Added to the root. |

## Layout

Measured at 1440px: 1260px outer column (nav, hero, footer) and 1220px inner column (sections). Display type is 55px / 42px / 30px / 18px at −0.04em; body is 16px / 22.4px at −0.02em. Buttons are 42px tall with 30px side padding and a 7px radius. Below 810px the gutters are 20px, type drops to 32px / 24px / 15px, and the hero board keeps a fixed 805px width and runs off the right edge.

## Motion

Measured frame by frame on a live reference with headless Chrome, then matched.

| What | Value |
|---|---|
| Headline words | opacity 0, blur 22px, translateY 40px, rotateX 70° (flat squash) to rest; 80ms apart; spring 45% at 95ms, 0.9% overshoot, settled ~600ms |
| Blocks (text, cards, rows) | opacity 0 + rise of 30–80px (CTA board slides 100px from the right); slower spring settling ~900ms; start 200ms after entering view, 95ms apart |
| Tilt-in (boards, trust cards) | perspective(1500) translateY(140) scale(.9) rotateX(−30°) to rest, ~1.3s spring |
| Light shafts | from (230, −380) and upright to 30°, 1.1–1.35s, delays 0.43–0.7s; group fades to 0.34 over 4s from (389, −600) |
| Hero load order | nav 0.3s, words from 0.45s, board 0.85s, line 0.9s, buttons 1.05s and 1.15s |
| Slideshow | one 310px step every 4s; overdamped glide, 49% at 163ms, 94% at 523ms, rest at 1.17s, no overshoot |
| Button hover | gradient angle 220°→327° (primary 196°→257°, inner glow widens), ~370ms spring with a small overshoot |
| FAQ / tabs | grid-row height spring ~380ms; incoming screen fades in 0.32s and the outgoing one fades out over 0.9s |

The springs are CSS `linear()` easings built from the measured samples, so all motion runs on transitions with no animation library.

With `prefers-reduced-motion: reduce`, everything renders at rest, the slideshow stops advancing on its own, and the loops (card bob, skeleton shimmer, caret, orbit) stop. Hover effects only apply to devices that can hover with a fine pointer.

## Notes

- It needs no dependencies beyond React.
- Fonts: a 600–700 display subset and a 400–600 text subset (Latin, OFL) are embedded and renamed, so the page fetches nothing.
- The root is `width: 100%` with a definite height, and the page scrolls inside it. It works full-bleed or inside a fixed-height frame.
