# Mosaic Prompt Template

A complete landing page for an app builder you talk to: a hero with a
composer, six features and three plans, over one living WebGL sky that
changes with the page. Behind the composer the sky is a mosaic of soft
light tiles; behind the features, diagonal prismatic facets on slate blue;
behind the pricing, spectral silk waves on muted plum. Between sections it
does not crossfade. It re-tiles, cell by cell, from the bottom up, as you
scroll.

The headlines are set in a pixel face drawn in code: every pixel is an SVG
square. They fly in from everywhere and assemble on load, step aside from
the pointer, catch the accent colour now and then, and scatter glyph by
glyph as you scroll away. Section titles assemble when they are reached,
and the footer wordmark gathers its pixels as you arrive at the end.

**Requires `gsap`** (with its bundled `ScrollTrigger`). Everything else is
React. Nothing is fetched: no fonts, no images, no video. The shader, the
pixel face and every icon are drawn in code, so the page is finished on
first paint, and a browser without WebGL keeps a painted CSS sky.

- **Header.** The F mark and wordmark, *Features* and *Pricing* in the
  middle with a glass pill that slides to the section in view, and *Get
  Started*. It is transparent over the hero and turns to frosted glass once
  the page moves. On a phone the links fold into a menu sheet.
- **Hero.** Two lines of pixel type over a liquid-glass composer:
  - a placeholder that types example prompts out and deletes them again,
  - platform chips (a radio group),
  - a model menu (arrow keys, Escape),
  - attachments through a real file input, listed as removable chips,
  - an accent send button that breathes once there is something to send.
    `Enter` sends, `Shift + Enter` breaks the line.

  Sending morphs the card into a build log (five steps, a progress bar,
  a pixel spinner), then into a preview: the app's name taken from the
  prompt, and a phone or a screen mocked up beside it. *Refine prompt*
  brings the prompt back; *New app* clears it.
- **Features.** A pixel title, a lede, and six glass cards that drop into
  the grid one after another. Each card tilts toward the pointer and
  carries a spotlight that follows it.
- **Pricing.** A pixel title, a monthly / yearly switch whose prices count to
  their new value, and three glass plans that rise into place, the
  featured one last and lit in the accent.
- **Footer.** The brand as a huge pixel wordmark, a note and three links.

Every link scrolls inside the page; the template never touches the host's
URL hash. The logo, *Get Started* and every plan button scroll home and put
the cursor in the composer, unless you pass `onGetStarted` /
`onPlanSelect`.

**It is a front end.** Nothing is generated, uploaded or billed: the build
log is a timed demo, attachments never leave the browser, and the prices
are illustrative. Wire `onSubmit` to your own generator.

```tsx
import MosaicPromptTemplate from "@/components/ui/mosaic-prompt-template"

<MosaicPromptTemplate
  brand="Fastshot"
  accent="ice"
  headline={["Describe an app", "We'll build it"]}
  onSubmit={({ prompt, platform, model, files }) => startBuild(prompt, { platform, model })}
  onPlanSelect={(plan, yearly) => router.push("/checkout?plan=" + plan.name + "&yearly=" + yearly)}
/>
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `brand` | `"Fastshot"` | Wordmark beside the mark, and the pixel word in the footer. |
| `headline` | `["Describe an app", "We'll build it"]` | One entry per line. Lines share one pixel size and are scaled down together if the longest would not fit. |
| `prompts` | four examples | What the placeholder types. |
| `platforms` | Mobile app, Web app, Dashboard, Game | `{ label, icon }` chips. |
| `models` | Turbo, Studio, Deep | Entries of the model menu. |
| `features` | six | `{ icon, title, body }`. |
| `featuresTitle`, `featuresLede` | | Section heading (pixel face) and lede. |
| `plans` | Starter, Pro, Team | `{ name, price, blurb, features, cta, featured?, badge? }`. `price` is monthly. |
| `pricingTitle`, `pricingLede` | | Section heading and lede. |
| `currency` | `"$"` | Prefix for prices. |
| `yearlyDiscount` | `0.2` | Taken off the monthly price on the yearly cycle. |
| `footerNote` | `"Made from a sentence."` | Beside the small mark in the footer. |
| `accent` | `"ice"` | `ice`, `ember` or `lime`: the send button, highlights, the featured plan and a touch of the sky. |
| `height` | `"100svh"` | One screen of the page. Must be a definite length. |
| `onSubmit` | | `({ prompt, platform, model, files })` when the composer is sent. |
| `onGetStarted` | scroll home and focus | The logo and *Get Started*. |
| `onPlanSelect` | scroll home and focus | `(plan, yearly)` from a plan button. |
| `className` | | On the root. |

Icons are 7 × 7 pixel drawings: `spark`, `eye`, `code`, `chat`, `phone`,
`rocket`, `window`, `bars`, `game`, `bolt`.

## The pixel face

Capitals, lowercase with descenders, digits and `. , ' ! ? - : / & $ + %`.
A character without a glyph falls back to its capital, then to a space, so
any headline renders. Each glyph is a few rows of `.` and `#` in the
`GLYPHS` table at the top of the file; add your own the same way.

## Behaviour notes

- **Reduced motion** skips the intro, the scroll scatter, the pointer
  repel, the shimmer and every CSS loop; sections are in their finished
  state, the sky is drawn once per scroll change instead of every frame,
  and the composer still works.
- The sky renders at three quarters of the device resolution (the mosaic
  hides it), pauses while the page is off screen and releases its WebGL
  context on unmount.
- The page scrolls with whatever scrolls its host: the window, or the
  nearest scrolling ancestor.

## Play with it

- Type a prompt and press Enter, then try *Refine prompt*.
- Move the pointer across the headline.
- Scroll slowly from the composer into Features and Pricing and watch the
  sky re-tile.
- Flip Monthly / Yearly.
- Open it at phone width for the menu sheet.

`demo.tsx` is the reference; `demo-ember.tsx` is the same page as an
internal-tools builder in the `ember` accent.
