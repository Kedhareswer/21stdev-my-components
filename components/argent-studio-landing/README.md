# Argent Studio Landing

A dark, chrome-lit landing page template for a creative and applied-AI studio. Nine sections, one long scroll.

1. **Hero.** A liquid-chrome ribbon floats and turns slowly beside a two-line headline, an italic serif over a light geometric sans. On load the two lines rise out of a mask, the second a beat after the first. A short founder's note sits top left. The header scrolls away with the hero. A round menu button stays pinned top right and opens a full-screen menu with a circular wipe.
2. **Studio.** The manifesto lights up letter by letter as you scroll, from 40% to full white. Four stat cards sit in a staggered grid.
3. **Capabilities.** A second letter-lit paragraph, then four discipline rows. Rows rest at 40%. The hovered row lights up with a full-width panel behind it, and a chrome object glides beside it. On touch screens the row nearest the middle of the screen is lit.
4. **Selected work.** Full-height project cards stack: each one sticks just below the top edge and the next slides over it. Section headings rise into place as they enter, with the line under them a beat behind.
5. **Recognition.** Award rows. Hovering (or focusing) a row wipes a band of light streaks in behind it.
6. **People.** Four black-and-white portraits fade in as they arrive and warm on hover. A "join us" card follows, with slowly turning light arcs.
7. **Engagements.** A monthly/quarterly toggle. Prices roll digit by digit like an odometer.
8. **Voices.** A row of testimonials drifts slowly to the right and pauses on hover.
9. **Contact and footer.** An underline form with budget chips, then a giant chrome wordmark. Footer links draw an underline from the left on hover.

The cursor is a 40px white disc in difference mode that trails the mouse. Over links that name an action ("View", "Say hi") it swaps to a labelled disc.

## Motion

The timings were measured from the live preview of the reference and matched number by number. `INTRO`, `RISE`, `FADE`, `ROW`, `READ`, `STACK` and `MARQUEE_PX_S` near the top of the file hold them:

| Piece | Behaviour |
| --- | --- |
| Headline intro | Rises 160px from a mask over 1.2s with a strong ease-out. The second line starts 200ms after the first. |
| Section headings | Rise 100px over 1.2s (no fade) when they enter. The line under them follows 150ms later. |
| Big paragraphs | Letters go from 40% to 100% as the paragraph's top climbs from 64% to 13% of the screen. One soft letter sits at the edge. |
| Capability rows | Opacity 40%→100% plus a #1a1a1a full-bleed panel, 0.5s ease-in-out. |
| Work cards | Sticky 8px from the top, viewport height minus 18px, 60px apart. They don't shrink. |
| Team cards | Fade in over 0.5s as they enter. |
| Reviews | Drift right at about 80px/s. |
| Buttons | The fill and colour swap in 0.3s, ease-in. |

Scroll-linked values are eased toward the real scroll position. Each frame reads layout once (the root's top). Everything else is measured on mount and resize, and the frame only writes CSS custom properties and the cursor transform. Headings and cards are triggered by an `IntersectionObserver`. The cursor and hover states only exist under `(hover: hover) and (pointer: fine)`. With `prefers-reduced-motion`, everything shows in its finished state: paragraphs fully lit, headings in place, nothing looping, and the reviews become a plain horizontal scroller.

**Easter egg:** tap the circled R next to the footer wordmark three times. *Argent* is heraldry's word for silver. Three taps turn every chrome surface to *or*, gold. Three more turn it back.

## Pictures

The hero ribbon, the four chrome objects, three project stills, four portraits and the light-streak band were generated for this template with ChatGPT's image model. They show fictional people and products. They're embedded as WebP data URIs (about 460 KB in total), so the component makes no network requests. Pass `images` to replace any of them by key: `hero`, `obj0`–`obj3`, `work0`–`work2`, `team0`–`team3`, `streak`. The chrome renders were generated on black and converted to transparent WebP, so they sit on any background. Replacements for `hero` and `obj0`–`obj3` should be transparent PNG or WebP.

## Fonts

Text uses subsets of **Outfit** (weights 300–500) and **Instrument Serif Italic**. Both are SIL Open Font License 1.1 fonts, embedded as base64 woff2. As the licence asks of modified copies, the subsets are renamed (`AgSans` and `AgSerif`). Together they add about 30 KB.

It needs nothing beyond React and Tailwind's base styles. The palette is the component's own and stays dark in both themes.

```tsx
import ArgentStudioLanding from "@/components/ui/argent-studio-landing"

<ArgentStudioLanding
  brand="Argent"
  email="hello@argent.studio"
  onContact={(data) => console.log(data)}
/>
```

`height` sets the height of the hero and of each stacked work card. It defaults to `100svh` and must be a definite length. Services, work, honours, team, plans and testimonials are constants near the top of the file.
