# Oriel Studio Template

A complete design-studio website told as a film: nine full-screen scenes, one on screen at a time, joined by deliberate cuts. Calm on the surface (white, warm off-white, one pastel per scene), black saved for the dramatic scenes.

## The scenes

| # | Scene | What happens |
|---|---|---|
| 1 | Home | Hero line in Bricolage Grotesque, a living eye badge (rotating text ring, pupil follows the cursor, falls asleep after 2 s idle), a showreel that drops in like a curtain and grows from its slot to full bleed |
| 2 | About | Huge rounded pastel cards scroll sideways; a pill-shaped video window slides inside each one |
| — | cut | 750 ms marquee flash of rotated "WE MAKE" rows racing at five speeds (this cut only) |
| 3 | What we make | A full-screen clip shrinks into a product UI that builds from a skeleton, gets named collaborator cursors and morphs from desktop to phone, while a pill tag rolls through the services like a slot machine |
| 4 | People | The sentence splits open, lets the team's avatars in, and the gap becomes the word *hundred*; then a black disc swallows the lilac scene |
| 5 | Belief | A black quote lights up letter by letter with scroll |
| 6 | Work | Centred looping carousel with titles hanging off the cards; then a thread draws, a 1 px line grows tall, then wide, into white |
| 7 | Proof | A 3D text cube turns from its claim to its proof |
| 8 | Process | A rope un-knots as an image sequence scrubbed by scroll (48 frames baked once from a lit three.js rope, or your own frames); the squircle floods the screen; "Have a knotty idea?" spells in |
| 9 | Contact | Chips with rolling-text hovers, a pulsing submit; footer |

Menu (swoops in rotated and scaled, preview panel wipes per link), disc-and-logo-stroke wipe on every menu, nav and Home / End / number-key jump, difference-blend cursor dot, magnetic buttons, per-scene header colour, brushed-metal floating contact chips.

## How the scroll works

Each scene is a real `overflow:auto` scroller. Wheel input is eased into its `scrollTop` (lerp), and every scrubbed effect is a GSAP timeline on a ScrollTrigger whose `scroller` is that scene; pinned stages are `position:sticky`. At a scene's edge the overflow is held in a 260 px buffer before the next scene slides in, and the inertia of the gesture that turned a scene can't turn the next one.

- **Keyboard:** ↓ / ↑ / PageDown / PageUp / Space scroll and turn scenes; Home, End and 1–9 jump. Tabbing into another scene brings it in.
- **Screen readers:** nothing is hidden; off-frame scenes are only translated, and native scrolling of a scene (focus, find in page, a screen reader) is adopted, not fought.
- **Mobile / touch:** a stacked page on the window's native scroll (touch momentum): cards stack, the form is a bottom sheet, the rope renders at 1x.
- **prefers-reduced-motion:** the stacked page with no wipes and no scrubs; each scene rests on its key frame and content fades in.
- On desktop the layout zooms rather than reflows: everything is sized in a fluid `R` unit (`--r`) that fits a 90 × 56.25 composition into the frame.

## Performance

- Videos never autoplay from markup: only the scene on screen plays, the next one preloads, the rest stay paused (on the stacked page, clips play only while in view).
- The rope is baked into WebP frames (~60 KB each) only once the visitor reaches Work; scrolling then just draws a decoded frame, with a small cache of neighbours. Until the bake finishes the live 3D rope answers the scroll.
- One rAF drives the soft scroll; the pointer loop (cursor dot, magnets, eye, blob) only measures the header, the chips and the active scene, and idles when the pointer rests.
- Off-screen canvases (bubbles) do not draw.

## Props

| Prop | Default | |
|---|---|---|
| `brand` | `"Oriel"` | Studio name |
| `headline` | studio line | Hero line |
| `projects` | 7 projects | `{ name, kind, year, img }[]` for the carousel |
| `email` | `hello@oriel.studio` | |
| `height` | `"100svh"` | Frame height; must be a definite length |
| `theme` | `"auto"` | `"light"`, `"dark"`, or follow the host's `.dark` class |
| `ropeFrames` | baked | Image URLs for the rope sequence, e.g. 48 photographic renders; cover-fitted, decoded before use |
| `fontHref` | Google Fonts URL | `null` loads nothing |

## Dependencies

`gsap` (with ScrollTrigger) and `three` (rope scene, `RoomEnvironment`). Both are declared in the root `package.json`.

## Credits

Photos and videos from [Pexels](https://www.pexels.com) under the Pexels licence (free to use and modify, no attribution required). Fonts: Inter Tight and Bricolage Grotesque, SIL Open Font License, via Google Fonts. All studio, client and project names are fictional.
