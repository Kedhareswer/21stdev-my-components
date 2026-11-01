# Torchlit Agency Template

A complete agency site for a fictional brand studio, **Vesper & Flint**. Turn the lights off and the page rests in a warm, almost-black room: you read it by carrying a pixel-art flaming torch. Text and photos inside the torch's light warm from muted grey-brown to cream, with a soft falloff and a short trail.

**Requires `gsap`** (core + ScrollTrigger). Fonts: Instrument Serif and Instrument Sans from Google Fonts (SIL Open Font License). Photos: Unsplash (Unsplash License), loaded from `images.unsplash.com`. The torch, list flames, laurel and logo are drawn in code.

## Storyboard

1. **Lights on or off.** In light mode the room is lit: a cream page with no torch, normal cursor, and a pill asking you to turn the lights off. The **Lights off / Lights on** switch next to *Let's Connect* flips between the two with a short blackout. `theme="auto"` follows the host's `.dark` class.
2. **Hero.** In the dark the flame catches on load. The light sweeps across *Quiet brands don't get found in the dark*, flares, flickers and settles, then follows the cursor.
3. **Principles.** A gold laurel holds an **unlit** torch. Bring your flame close and it catches, then becomes a light of its own that warms the title around it. The rows are separated by hairlines that glow near the torch. Each row has a label and a sentence, and the light falls off across them word by word. Rows rise in as you scroll. Each label has a small flickering pixel flame with its own glow.
4. **Studio photo.** A warm editorial photo slides up and unclips under the rows.
5. **Selected work → Work (28).** Thumbnails rest dark and desaturated. Under the torch, a pool of full colour opens on the photo.
6. **Case study.** Clicking a project flies its photo into the case-study hero (FLIP), and the case content rises in. *Next case* chains to the next project.
7. **Agency, Services, Brand Guide.** Same world. Services has a dropdown in the nav and an accordion on the page. The Brand Guide documents the mark, colour, type, light rules and voice.
8. **Contact.** The huge *Let's Connect* is soaked in oil. Bring the torch near and fire spreads through the letters from the point you touched. Embers rise, and it lights its surroundings.

Changing page burns the current one away: it catches in the middle, chars and glows at the edge, and the next page is underneath.

## Play

- **Wall sconces.** Every page has unlit pixel torches on iron brackets. The laurel counts as one. Carry your flame to each one to light it, and the counter next to the switch tracks how many are lit (`2/4`). When all of them are lit, a toast appears and the whole room warms up a shade. Only sconces you can see are counted, so phones get a shorter list.
- **Embers.** Swinging the torch fast throws off pixel embers, and clicking bursts a handful. Switching the lights off strikes the torch with a shower of sparks.
- **Press and hold** to fan the flame: it grows and the light reaches further.
- **A moth.** Hold the torch still for a couple of seconds and a pixel moth flutters in to circle the flame. Swing the torch and it bolts.

## Props

| Prop | Default | Notes |
|---|---|---|
| `theme` | `"auto"` | `"light"` (lights on, no torch), `"dark"` (torchlight), `"auto"` follows the host `.dark` class. |
| `height` | `"100svh"` | Hero height. Must be a definite length. |
| `brand` | `"Vesper"` | Used in headings: "Our *Vesper* Guiding Principles". |
| `studio` | `"Vesper & Flint"` | Footer wordmark, curtain, brand guide. |
| `headline` | 3 lines | Wrap a word in `*asterisks*` for italic. |
| `principles` | 5 rows | `{ label, text }`. |
| `projects` | 28 projects | `{ title, client, kind, year, img, line }`. Unsplash URLs are resized through their `w=` parameter. |
| `services` | 5 services | `{ name, line, text, items, img }`. |
| `email` | studio address | Used by both *Let's Connect* links. |
| `initialPage` | `"home"` | `home`, `work`, `agency`, `services`, `brand`. |
| `fontHref` | Google Fonts URL | `null` loads nothing. |

## Notes

- **Readable without the torch.** Unlit body text is 4.6:1 on the background and display text is 3.1:1, so the dark sets the mood but never hides anything. Keyboard focus moves the light to the focused element. Forced-colours mode drops the gradient fill.
- **Touch.** There is no torch. The light follows your finger while it touches the screen, and otherwise rests wide over the middle of the screen. Scroll a beacon into that light and it catches.
- **`prefers-reduced-motion`.** No load flare, curtain, rises or flicker. Flames freeze on one frame, the fire appears at once, and the light still follows the pointer.
- **Rendering.** One rAF loop reads every rect first, then writes `--tx/--ty` (torch), `--px/--py` (trail) and `--bx/--by/--br` (nearest lit beacon) on the visible `[data-lit]` elements only. CSS turns these into a clipped radial gradient for text, and a radial mask over the full-colour copy of each photo.
- The layout answers the component's own width (container queries). No ScrollTrigger pinning.
