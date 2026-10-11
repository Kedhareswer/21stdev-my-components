# Long Exposure Agency Template

A complete automation-agency site in one component, full screen and edge to
edge: a pale page with a quiet serif, ink buttons and soft grey cards. Every
picture is a long-exposure blur of a landscape that was never photographed,
drawn live in WebGL.

It has three pages behind one nav. They switch in place and never touch the
host URL:

- **Home**
  - **Hero**: a headline over a **live glass prism**. Its blades of light split
    into warm and cool fringes and follow the pointer. A click spins the light
    up. Glass chips show a timeline badge and a trust row with avatars and
    stars, and the brand word floats over the prism as an outline.
  - **Client marquee**: drawn logo marks. Hovering pauses it.
  - **Stats** that count up the first time they scroll into view.
  - **What we build**: a tab list that also works with the arrow keys. The
    panel shows a moving landscape, a small tool-chain diagram with signals
    running along the wires, a result chip and three proof points.
  - **How it works**: a 45-day process. Steps advance on their own while the
    section is on screen, and any click stops that. You can also drag along the
    day timeline to scrub through the steps.
  - **Selected work**, a **quote carousel**, **insights** cards and an **FAQ**
    accordion.
- **Case studies**: the *Don't take our word for it* grid. Filter by industry,
  then use **Load more**. Hover a card and its landscape starts drifting under
  the client's logo.
- **Case study**: a live banner with a back button, an industry tag and a
  *next* button. Below it are pill-labelled sections in serif lead and sans
  body, counting result cards, a pull quote, the connected tools, and a
  next-case card.
- **404**: reached from the footer or from any unknown in-template link.

Every page ends with a dark CTA band over a drifting landscape, then the
footer. The footer holds link columns, socials, a light/dark switch and a
credit line. **Book a free call** opens a dialog with the next five weekdays
and their time slots (some already taken), plus validation, a sending state
and a confirmation.

```tsx
import LongExposureAgencyTemplate from "@/components/ui/long-exposure-agency-template"

<LongExposureAgencyTemplate
  brand="Tidewell"
  ink="#1d2b3a"
  hero={{ title: "Your data, finally\nworking for you.", word: "Tide" }}
  cases={[{ id: "brightloom", name: "Brightloom", industry: "Retail", tagline: "…", summary: "…", field: "sand" }]}
  onBook={(b) => fetch("/api/book", { method: "POST", body: JSON.stringify(b) })}
/>
```

**No dependencies beyond React.** It loads no images, fonts or scripts. The
landscapes, the prism, the logo marks, the avatars and the icons are all
drawn in the file. One shared WebGL2 context paints every picture into its own
2D canvas.

## Links inside the template

Any `href` that starts with `#` stays inside the template:

| href | Goes to |
|---|---|
| `#home` | Home, top |
| `#cases` | Case-study grid |
| `#case:<id>` | That case study (unknown id → 404) |
| `#services`, `#process`, `#about`, `#work`, `#testimonials`, `#insights`, `#faq`, `#contact` | Home, scrolled to that section |
| `#book` | Opens the booking dialog |
| `#404`, or any other `#…` | The 404 page |
| `#` or no `href` | Nothing |

Anything else (`/pricing`, `https://…`) is an ordinary link.

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"Orrin"` | Word beside the dotted mark in the nav and footer. |
| `nav`, `navCta` | Case studies, Services, About, Insights · Book a free call | `{ label, href }`. |
| `hero` | Automate your business… | `{ title, subtitle, primary, secondary, word, badge: { title, text }, trust }`, merged over the defaults. `\n` in `title` breaks the line. Pass it in braces (`title={"…\n…"}`) so the `\n` is a real newline. |
| `clientsTitle`, `clients` | 8 names | Marquee names. A name that matches a case reuses that case's mark. |
| `stats` | 4 stats | `{ value, prefix?, suffix?, decimals?, label }[]`. |
| `services` | 4 services | `{ kicker, title, items }`. Each item is `{ title, description, points, flow, field?, metric? }`, where `flow` is the tool chain drawn on the picture. |
| `process` | 4 steps over 45 days | `{ kicker, title, steps }`. Each step is `{ title, days: [from, to], description, deliverables }`. |
| `cases` | 6 cases | `{ id, name, industry, tagline, summary, field?, mark?, serif?, sections?, results?, quote?, stack? }[]`. `sections` are `{ label, lead, body? }`. `mark` picks one of 6 drawn logos. `serif` sets the name in the serif. |
| `casesPage` | – | `{ title, subtitle, pageSize }`. `pageSize` defaults to 4. |
| `testimonials` | 3 quotes | `{ text, name, role }[]`. An empty array hides the section. |
| `insights` | 3 posts | `{ kicker, title, items }`. Each item is `{ title, category, read, href?, field? }`. `items: []` hides the section. |
| `faq` | 5 questions | `{ kicker, title, items }`. Each item is `{ question, answer }`. |
| `cta` | Start saving time… | `{ title, subtitle, action, note, field }`. |
| `footer` | 3 columns | `{ tagline, columns, socials, copyright, credit }`. `socials` kinds are `x`, `instagram`, `meta` and `linkedin`. |
| `onBook` | – | `(booking) => void \| boolean \| Promise`. `booking` is `{ name, email, company, message, date: "YYYY-MM-DD", time: "HH:MM" }`. Return or resolve `false`, or throw, to show an error. Without it, the send is simulated. |
| `initialPage` | `"home"` | `"home"`, `"cases"` or `{ case: id }`. |
| `serif`, `sans` | Newsreader / Figtree stacks | CSS font-family lists. Load a webfont in your app, then name it here. |
| `ink` | `#121719` | Button and heading ink in the light theme. |
| `defaultTheme` | `"system"` | `"system"` follows the host's `.dark` class, then the OS. The footer switch overrides it. |
| `maxWidth` | `"1120px"` | Width of the content column. The page background always fills the screen; on wider screens the content stays centred. |
| `height` | `"100svh"` | Minimum height of the page. |

### Pictures

`field` is a preset or five colours of your own:

- Presets: `ember`, `moss`, `copper`, `redline`, `glacier`, `dusk`, `noir`
  and `sand`.
- Custom: `{ colors: [sky, far, mid, glow, shadow], seed?, angle? }`. The
  colours are hex. `angle` tilts the streaks, in radians.

Without a `field`, each picture picks a stable preset from its own name.

## Notes

- Without WebGL2, every picture stays as a CSS gradient in the same colours.
  Nothing breaks.
- Pictures render only while they are on screen. Case cards render once and
  animate only while hovered or focused. The hero, the open service, the
  banner and the CTA drift continuously.
- The layout responds to the template's own width (container queries), not
  the viewport's. Below 720px the nav folds into a menu and the grids become a
  single column.
- Content below the fold rises in as it scrolls into view. Content already on
  screen is never hidden.
- `prefers-reduced-motion` stops the drift, the marquee, autoplay, the
  count-ups and the entrances. Pointer tracking still responds, and nothing
  animates on its own.
- The booking dialog traps focus and closes on Escape or a click outside. It
  locks page scroll while open.
