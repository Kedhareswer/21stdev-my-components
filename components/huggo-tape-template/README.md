# Huggo Tape Template

A loud, playful, scroll-told landing page for a tape brand, where the tape tells the story and physically connects the sections.

**Requires `gsap`** (core + ScrollTrigger). Fonts: Bricolage Grotesque, Anton and Caveat from Google Fonts (SIL Open Font License). Every object (rolls, paper, tape, stickers, the gift box) is drawn in CSS and SVG, so the page needs no image hosting.

## Storyboard

1. **Load.** Thick rainbow arcs (orange, yellow, sky, blue, green) rise across the hero; the last lime arc becomes the page.
2. **Hero.** A 3D clear-tape roll drops onto the hill with a bounce. "We're [badge] here to" settles, then the giant headline pops in one letter at a time with squash and stretch. Letters jiggle under the pointer.
3. **The roll travels.** On scroll the roll rolls down the page and leaves a translucent printed strip behind it, running over the green collage and holding it down.
4. **Collage.** Sticky note, story card, lemon-print paper, moving-day tag and a gift box each slide in, settle, then get their own torn bits of tape slapped on.
5. **Ribbon.** A second, lime printed roll lays a wavy tape ribbon across the page with a marquee printed on it; the marquee speeds up with scroll velocity.
6. **Masking trick** (orange, sticky stage). Masking tape is laid, the wall is painted pink, the tape is peeled, crisp orange lines stay behind. Sticker flowers pop on.
7. **Shop** (pink). Four 3D rolls drop out of a pile and get washi-taped on; hover spins a roll. Add to bag updates the header count.
8. **Footer** (peach). Newsletter, then the wordmark gets duct-taped down.

A strip of tape is laid across every seam: clear strip, lime ribbon, masking, duct.

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | Hero and masking stage height. Must be a definite length. |
| `brand` | `"HUGGO"` | Printed on the badge, rolls, strip and footer. |
| `headline` | `["HOLD IT", "TOGETHER"]` | Two lines that pop in. |
| `story` | brand story | Peach card copy. |
| `todo` | 5 items | Sticky note; the third is ticked. |
| `marquee` | `["LIFE GETS LOOSE", "WE KEEP IT TOGETHER"]` | Ribbon phrases, badge between them. |
| `maskHeadline` | `["CLEAN", "LINES", "ONLY"]` | One line per entry. |
| `products` | 4 rolls | `{ name, line, price, kind }`, kind: `clear`, `print`, `masking`, `washi`, `duct`. |
| `preloader` | `true` | Rainbow preloader on mount. |
| `fontHref` | Google Fonts URL | `null` loads nothing. |

## Notes

- `prefers-reduced-motion`: no preloader, no bouncing letters, no rolling. The strip is shown fully laid, the wall is shown peeled, and sections fade in.
- Layout answers the component's own width (container queries), so it stacks in reading order inside narrow frames too. On phones the tape still runs down the middle of the collage.
- No pinning: the masking stage is `position: sticky` inside a tall section.
- The brand palette is fixed and identical in light and dark themes.
