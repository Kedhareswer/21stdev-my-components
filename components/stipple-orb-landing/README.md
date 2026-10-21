# Stipple Orb Landing

A complete landing page for a platform where you back people instead of
companies. It uses a quiet grey page, navy buttons and one warm accent. The
hero is a sphere of up to 15,000 stippled dots, lit from the upper right in
the accent and fading to grey grain in shadow.

```tsx
import StippleOrbLanding from "@/components/ui/stipple-orb-landing"

<StippleOrbLanding
  brand="Tideline"
  palette="lagoon"
  hero={{ title: "*Fund the athlete,*\nShare the Podium" }}
  paths={{ ...yourCopy, model: { income: 90000, growth: 0.18, share: 0.1, raise: 80000, years: 10 } }}
  onRequestAccess={(data) => fetch("/api/access", { method: "POST", body: JSON.stringify(data) }).then((r) => r.ok)}
/>
```

## Play with it

| Do this | And |
|---|---|
| Drag the orb | It spins with inertia, then eases back to its slow drift |
| Move over it | The dots part around the pointer and warm up |
| Click it (or focus it and press Enter) | A ripple runs across the surface. Arrow keys spin it |
| Watch the backers diagram | Dashes flow from three backers into the person, earnings tick into the ring, and the stake in the centre counts up |
| Hover a ring segment or its tag | That income stream lights in the accent and the centre shows your share of it |
| *For backers*: pick $5k / $25k / $100k, drag the term | The curve, the payback year, the total and the multiple are recomputed. Scrub the chart for any year |
| *For individuals*: pick your income, drag your share | The indicative raise updates. Hover a use-of-funds arc |
| Watch *How it works* | Three looping vignettes: a form typing itself, an application stamped *Approved*, a backer committing $5,000. Click one to replay it |
| Swipe the stories, or use the arrows | Hover a story to see earnings since the raise as a sparkline |
| Move over the dotted call to action | The dot grid and a soft glow follow the pointer |
| Any *Request access* | A dialog: back or raise, name, email, check size or a link. Validation, sending, done |

The nav sticks and frosts as you scroll, has a theme switch and opens a
focus-trapped menu on phones.

## Play with the demos

- `demo.tsx`: Kindling, in the ember palette (orange and navy).
- `demo-lagoon.tsx`: Tideline, funding athletes, in the lagoon palette (teal
  and deep green). It has its own copy, income streams and deal model.

Open `?dark` before the hash in the workshop for the night theme.

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"Kindling"` | Nav and footer. |
| `logo` | drawn stipple mark | Replaces the mark beside the brand. |
| `nav` | How it works, Stories, FAQ | `{ label, href }[]`. `#thesis`, `#paths`, `#how`, `#stories`, `#faq` scroll in-page. |
| `navAction` | `Request access` | Without an `href` it opens the dialog. |
| `hero` | | `{ title, text, action, social, backersLabel, backers }`. In `title`, `*asterisks*` mute words and `\n` breaks the line. `backers` are `{ name, mark? }` with `mark` one of `pine`, `rings`, `monogram`, `wave`. |
| `thesis` | | `{ title, action, investors, more, streams, stake } \| null`. `investors` are up to three `{ name, amount, avatar? }`. `streams` are `{ label, value, icon? }`, with `icon` one of `rocket`, `megaphone`, `note`, `case`, `play`, `spark`. `stake` is 0 to 1. |
| `paths` | | `{ title, investors, individuals, model } \| null`. Each side is `{ title, text, link, bullets, caption }`. `model` is `{ income, growth, share, raise, years }`, the deal both calculators run on. The default is $180k income, 12% growth, a 7.5% share sold for $135k over 15 years. |
| `steps` | three steps | `{ title, items: { title, text }[] } \| null`. |
| `stories` | three stories | `{ title, items: SolStory[] } \| null`. |
| `cta` | | `{ title, action } \| null`. `*asterisks*` mute words. |
| `faq` | two groups of four | `{ title, groups: { title, items: { q, a }[] }[] } \| null`. |
| `footer` | | `{ tagline, columns, note, credit } \| null`. |
| `currency` | `"$"` | |
| `palette` | `"ember"` | `"ember"`, `"lagoon"`, `"orchid"`, or `{ accent, button, onButton?, mint?, cream?, sky? }` in hex. A custom `button` gets readable text when `onButton` is left out. |
| `theme` | `"system"` | `"system"` follows the host's `.dark` class, then the OS. |
| `themeToggle` | `true` | |
| `onRequestAccess` | | Called with `{ role, name, email, detail }`. Return or resolve `false`, or throw, to show an error. Without it, sending is simulated. |
| `height` | `"100svh"` | The hero's minimum height (clamped to 620 to 980px). A definite length, so it survives any host layout. |
| `className` | | |

`SolStory` is `{ name, role, reach, photo?, points, raised, share, years, growth? }`.
`growth` is a run of earnings for the sparkline.

## Notes

- **No dependencies, nothing loaded.** React only. The orb and the footer
  horizon are 2D canvas, the diagrams are SVG, and the type is the system
  stack (Inter when installed). The three portraits and five avatars are
  embedded as small WebP data URIs (about 43 KB in all). There are no URLs,
  so it renders in 21st's capture sandbox.
- **The orb.** Points sit on a Fibonacci lattice, each with a small radius
  jitter for grain and a dither threshold. A point shows only where the
  surface is lit enough, so the lit cap is dense and the shadow is sparse.
  The colour runs from grey to the accent with the light. Dots are drawn in
  colour and alpha buckets, so a frame costs a few dozen fill changes. It
  runs only on screen and stops in background tabs.
- **The numbers are illustrative.** A backer's slice is their stake over the
  raise. Each year they receive income × share × slice, and income grows by
  `growth`. The raise is the share of projected income, discounted at a 20%
  backer return. The page says so under each result.
- **Reduced motion.** The orb and horizon draw one still frame (dragging
  still turns the orb). The vignettes show their end state, nothing reveals
  on scroll and in-page links jump.
- **Accessibility.** A skip link and one `h1`. The orb is a focusable image
  with a description and keyboard controls. Radio groups move with the
  arrow keys, the questions are disclosures, the dialog and phone menu are
  focus-trapped modals, and form errors are tied to their fields.
- **Seeded once.** The calculators start from the model, then belong to the
  visitor. To reset them from new props, change the component's `key`.
- **Copy and data are placeholders.** Kindling, Tideline, the backers, the
  people, the figures and the firms are invented. Replace them through props.
- **Photos:** portraits from Unsplash (Unsplash License), cropped and
  re-encoded.
- **Reference:** the owner's screenshot of an invest-in-individuals landing
  page, used for feel and layout only. No copy, brand or marks are taken from
  it. See `media/stipple-orb-landing/`.
