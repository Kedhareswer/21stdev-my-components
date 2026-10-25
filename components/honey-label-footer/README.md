# Honey Label Footer

A site footer dressed as the wrap-around label of a jar of honey. A sage band
carries the brand's medallion on a lollipop stem, a meadow of mint blossoms
grows out of its top edge, and the label's own furniture does the footer's job:
a Nutrition Facts sticker, a real EAN-13 barcode, a centre panel with the
headline claim, a newsletter sign-up, three link columns, socials and the
copyright strip.

## Storyboard

1. **Wrap.** When an eighth of the footer is on screen, the band wraps on from
   the centre out, as if rolled round the jar.
2. **Grow.** The meadow grows with it, centre first. Each stem draws upward,
   its leaves unfurl as the tip passes them, and the florets pop open from the
   bottom of the spike to the tip, then the bud at the very top.
3. **Tag.** The arch lifts into place, the medallion's stem draws up from it
   and the medallion pops onto the stem with a little overshoot. The arched
   tagline, the mark, the name and the note fade in one after another.
4. **Print.** The sticker floats up and its rules draw left to right in a
   stagger. The prose, the centre panel, the sign-up and the link columns
   settle in. The barcode prints itself bar by bar, then its digits appear.
5. **Forage.** A bee takes off from the arch and works the meadow, spike to
   spike, hovering at each one and shaking a little pollen loose when it
   lands.
6. **Live.** A slow wind sways every stem on its own phase. Move the pointer
   through the blossoms and they part around it; move fast and pollen comes
   off the nearest spike. The bee keeps clear of the pointer. Click the arch
   (a real button) and the bee is called home: it loops the arch and goes back
   to work. Hover the medallion and its dotted ring turns; links draw an
   underline in the blossom's violet; the social tags lift and fill.

The reveal plays once. A theme or palette change recolours the meadow in place
without regrowing it.

**No dependencies.** React is the only import. The meadow is drawn to a canvas
from a seed, every mark is inline SVG, and nothing is fetched, so the whole
scene recolours with a palette and survives installation. The barcode is a
real EAN-13 (check digit computed), so it scans.

```tsx
import HoneyLabelFooter from "@/components/ui/honey-label-footer"

<HoneyLabelFooter />

<HoneyLabelFooter
  preset="amber"
  name="Acre"
  tagline="Acacia blossom honey"
  claim={{ value: "1 km", label: "from hive to jar" }}
  headline={{ eyebrow: "Estate honey", title: "Acacia", meta: "Net wt. 450 g" }}
  barcode="4006381333931"
  columns={[
    { title: "Jars", links: [{ label: "Acacia", href: "/acacia" }, { label: "Chestnut", href: "/chestnut" }] },
    { title: "Estate", links: [{ label: "Visit", href: "/visit" }, { label: "Contact", href: "mailto:hello@acre.farm" }] },
  ]}
  onSubscribe={(email) => fetch("/api/subscribe", { method: "POST", body: email })}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `name` / `brandHref` | `"Humm"` / `"#"` | The brand, in the medallion and the arch. |
| `tagline` | `"Mint blossom honey"` | Arched over the medallion. |
| `medalNote` | `"100% raw & unfiltered"` | Under the name in the medallion. |
| `logo` | bee mark | Any node to replace the drawn bee in the medallion and the arch. |
| `claim` | `{ value: "100%", label: "raw & unfiltered" }` | The centre panel's left cell. |
| `headline` | `{ eyebrow, title, meta }` | The centre panel's right cell: a small line, the title, and the line under the rule (net weight, version, est. year…). |
| `facts` | honey, per tbsp | The sticker: `{ title, serving, amountLabel, headline: [label, value], dvLabel, rows: { label, value?, pct?, sub? }[], footnote }`. Leave `headline` or `dvLabel` out to drop those lines. |
| `barcode` | `"893421076310"` | Digits. Twelve get their check digit, thirteen have it corrected, fewer are zero-padded. |
| `blurb` | `{ title, paragraphs }` | The prose column beside the sticker. |
| `newsletter` | the harvest letter | `{ title, hint, placeholder, button, thanks }`, or `false` to leave it out. |
| `onSubscribe` | — | Called with the address on submit. The form shows `thanks` either way. |
| `columns` | Shop · Hive · Help | `{ title, links: { label, href? }[] }[]` |
| `socials` | Instagram · Facebook · YouTube · Email | `{ icon: "instagram" \| "facebook" \| "x" \| "youtube" \| "linkedin" \| "mail" \| ReactNode, href?, label? }[]` |
| `copyright` | `© <year> <name>. All rights reserved.` | |
| `legal` | Privacy · Terms | Small links beside the copyright. |
| `preset` | `"auto"` | `auto` (mint, or night under `.dark`) · `mint` · `amber` · `lavender` · `night` |
| `palette` | — | Overrides merged over the preset: `band`, `panel`, `arch`, `medal`, `ink`, `muted`, `line`, `paper`, `paperInk`, `accent`, `haze`, `stem`, `leaf` `[shadow, mid, light]`, `petal` `[deep, mid, light, pale]`, `eye`, `bud`, `pollen`, `bee` `[body, stripes]`. |
| `seed` | `7` | Which meadow to grow. Any integer. |
| `density` | `1` | How thickly it is planted. |
| `wind` | `true` | The slow sway and the pointer parting the stems. |
| `bee` | `true` | The foraging bee. |
| `maxWidth` | `"1280px"` | Widest the content gets. |
| `fontFamily` | Inter → Helvetica → system | The small type. Faces come from the host page. |
| `displayFamily` | SF Pro Rounded → Nunito → system | The brand name. |
| `height` | `"760px"` | A definite length. The footer grows past it when the content needs more room. |

## Notes

- **Performance.** During the reveal each stem is drawn as vectors; once it
  has grown it is cached as a sprite, so a steady frame is a few dozen
  `drawImage` calls plus the pollen. The loop sleeps off-screen and when
  nothing moves (wind off, bee off, pointer still).
- **Accessibility.** The meadow, band and medallion art are `aria-hidden`.
  Every link is a real anchor with a visible focus ring, the icon-only social
  links carry names, the barcode is an image named with its digits, the
  sign-up is a labelled email field with a live "thanks" line, and the arch is
  a named `<button>`, so keyboard users can call the bee too.
- **Reduced motion.** The band, meadow, medallion and type appear in their
  finished state, the wind and pollen are off, and the bee sits on a flower.
- **The sticker** is a Nutrition Facts panel by default because this is a jar
  of honey; it takes any rows, so it works just as well as "Harvest Facts" or
  "Site Facts" (see the lavender demo).
