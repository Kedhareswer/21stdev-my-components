# Astro Association Template

A complete landing page for an astronomy club, set like a Swiss space poster.
A giant wordmark is filled with confetti bubbles, and a compass-ring logo's
needle follows your pointer. A bubble band has the mark knocked out of it,
ribbons cross over oversized type, and the whole page sits inside a
periwinkle frame.

Sections, top to bottom:

- **Nav**: sticky and frosted. Its links scroll to their sections and
  underline the one you're reading. It has palette swatches, a theme switch
  and a Join button. Below 860px of template width it folds into a menu.
- **Hero**: the bubble wordmark (`hero.wordmark`), with the logo and the
  sliced-echo title laid over its last letter. Below it are the big issue
  number, a blurb, two CTAs and a credit rule. The bubbles drift, scatter from
  the pointer, and **pop when clicked**, with a running count.
- **Mission band**: a full-bleed bubble field with the logo cut out of it so
  the page shows through. Below it are a kicker, three meta labels on a
  hairline, the mission copy and stats that count up.
- **Ribbon stage**: oversized type with two bubble ribbons and two ink
  ribbons crossing over it. The ink ribbons run a marquee, which pauses on
  hover, and all four lean with the pointer.
- **Projects**: numbered like issues (`#099`…). Hovering a card floods its
  header with bubbles from the pointer's position. Each card has a status chip
  and a progress bar, and an "Open dossier" disclosure that holds the detail
  and the contribute button.
- **Nights**: a *Sky tonight* card with the real moon phase for the night. It
  shows the phase name, % lit, days to full or new moon and how dark the sky
  is. Step or scrub through the nights. Next to it is a filterable list of
  events, each with its own moon, RSVP toggles and seat counts.
- **Join**: tier radio cards plus a name/email form. A member card prints
  live as you type: your name, a stable member number, and a bubble pattern
  seeded from your name. It tilts under the pointer.
- **Footer band**: bubble band, slogan, credit, links, theme switch.

```tsx
import AstroAssociationTemplate from "@/components/ui/astro-association-template"

<AstroAssociationTemplate
  brand="NOVA."
  palette="aurora"
  hero={{ wordmark: "Nova", issue: "#027", title: "NOVA.\nSOCiETY" }}
  onRsvp={(night, going) => api.rsvp(night.date, going)}
  onJoin={(m) => fetch("/api/join", { method: "POST", body: JSON.stringify(m) })}
/>
```

**No dependencies beyond React.** The bubbles, logo, moon, ribbons and icons
are all drawn in the file (canvas + SVG), and the fonts are system stacks.
Nothing loads at runtime and there are no image assets, so covers render in
sandboxes that block external origins.

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"ASTRO."` | Nav, ribbon stage, footer. |
| `nav` | Mission, Projects, Nights, Join | `{ label, target }[]`. A `target` of `home`, `mission`, `projects`, `nights` or `join` scrolls there. Anything else is a normal link. |
| `navCta` | `"Join"` | Calls `onNavCta`, or scrolls to Join. |
| `hero` | see source | `{ wordmark, issue, title, blurb, credit, primaryCta, secondaryCta, hint }`. `title` breaks on `\n`, and its last line gets the sliced echo. |
| `mission` | see source | `{ bandTitle, kicker, meta: string[], title, body, stats: { value, label }[] }`. Stats like `"1,840+"` count up. |
| `projects` | 4 projects | `{ code, title, summary, detail, status: "open" \| "ongoing" \| "archived", progress?, goal?, cta? }[]`. |
| `projectsCopy` | see source | `{ title, issue, ribbonText, heading, body }` for the ribbon stage. |
| `nightsTag`, `nightsTitle` | | |
| `nights` | 5 nights, dated from today | `{ date: "YYYY-MM-DD", time, title, place, kind, target, seats?, going? }[]`. `kind` builds the filter chips. |
| `tiers` | Stargazer / Observer / Patron | `{ name, price, period?, blurb, perks, featured? }[]`. The featured tier starts selected. |
| `join` | see source | `{ tag, title, body, namePlaceholder, emailPlaceholder, button, success }`. `{name}` in `success` becomes the first name. |
| `footer` | see source | `{ bandTitle, tagline, credit, links }`. |
| `palette` | `"cobalt"` | `"cobalt" \| "aurora" \| "nebula" \| "solar"`, or `{ name, accent, frame, colors }`. `colors[0]` is the ground the bubbles sit on. |
| `paletteSwitcher` | `true` | Swatches in the nav that let visitors re-colour the page. A custom palette is listed first. |
| `onPaletteChange` | – | Called with the chosen palette. |
| `seed` | `102` | Arrangement of every bubble field. Any integer. |
| `onPop` | – | Called with the running pop count. |
| `onNavCta`, `onContribute(project)`, `onRsvp(night, going)` | – | |
| `onJoin` | – | `(member: { name, email, tier, number }) => void \| Promise`. If the promise rejects, the form shows an error. Without it, the form only simulates the send. |
| `skyDate` | today | The night the moon widget opens on. |
| `fonts` | system stacks | `{ display?, body?, mono? }` as CSS font-family lists. |
| `defaultTheme` | `"system"` | `"system"` follows the host's `.dark` class, then the OS. |
| `onThemeChange` | – | |
| `maxWidth` | `"1240px"` | Text column width. The bubble bands and wordmark stay full-bleed. |
| `height` | `"100svh"` | Minimum height of the page. The hero fills it. |

## Notes

- The look is built for a heavy geometric sans. The stack asks for
  **Poppins**, then Montserrat, Gilroy, Avenir Next, Century Gothic and
  Futura. Load Poppins (weights 400–800) in your app for the poster look. The
  wordmark is drawn on canvas, so it redraws once your webfont is ready.
- Write `i` lowercase inside caps (`ASSOCiATION`) for the poster's dotted-i
  detail.
- Only bubbles you can see pop: a click on the empty counter of a letter does
  nothing.
- The layout responds to the template's own width (container queries).
- `prefers-reduced-motion` freezes the drift, marquees, orbits and reveals.
  Bubbles still scatter and change colour on click, just without animation.
- Every canvas stops drawing while it's off-screen or the tab is hidden.
- Moon phases come from the mean synodic month. They're accurate to within
  about a day, which is plenty for planning a night out.
