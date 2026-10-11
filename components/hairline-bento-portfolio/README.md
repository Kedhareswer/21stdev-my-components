# Hairline Bento Portfolio

A whole link-in-bio portfolio on one sheet. Cells sit on warm paper,
divided by one-pixel rules, with a stretched black display name and one
inverted panel for the thing you're launching. It's minimal, but every cell
does something.

- **Ring badge**: a ring of text around a status dot. It turns on its own,
  speeds up under the pointer, and you can grab it and flick it. The dot
  pulses green while you're available and goes grey when you're not.
- **Display name**: it fits its cell at any width. Each letter rises in on
  load and turns to outline when you hover it.
- **About**: the numbers in the headline count up the first time it's seen.
- **Contact**: click the email to copy it. *Say hello* opens the mail app with
  a subject already filled in.
- **Work with me** (the dark panel): pick topics, enter an email, and join the
  waitlist. It checks the email, shows a loading state, and confirms with the
  topics you picked. Squares by the footnote show the spots left.
- **Mailing list**: *Subscribe* opens into an inline field. Escape closes it.
- **Footer**: your local time, ticking, and a light/dark switch. In dark mode
  the panel turns to paper.

The layout is four columns on desktop, two on tablets and one on phones. It
switches on the template's own width, not the viewport's.

```tsx
import HairlineBentoPortfolio from "@/components/ui/hairline-bento-portfolio"

<HairlineBentoPortfolio
  name="Ari Okafor"
  role="Product Designer · Writer"
  location="Lisbon"
  timeZone="Europe/Lisbon"
  available={false}
  ringText="Shipping interfaces for small, careful teams"
  email="ari@example.com"
  accent="#f97316"
  offer={{ title: "Design\nreviews", tags: ["Onboarding", "Pricing pages"], spots: { left: 1, total: 2 } }}
  onJoinWaitlist={({ email, topics }) => fetch("/api/waitlist", { method: "POST", body: JSON.stringify({ email, topics }) })}
  onSubscribe={(email) => fetch("/api/subscribe", { method: "POST", body: JSON.stringify({ email }) })}
/>
```

**No dependencies beyond React.** The ring, arrows and theme mark are SVG
drawn in the file, and the fonts are system stacks.

## Props

| Prop | Default | Description |
|---|---|---|
| `name` / `nameLines` | `"Mira Nowak"` | The display name. It splits into the first word and the rest unless you pass `nameLines`. |
| `role` | `"UX Designer & Mentor"` | The label above the name. |
| `location`, `timeZone` | `"Kraków"`, `"Europe/Warsaw"` | Used in the second chip and in the footer clock. |
| `badges` | availability + `location / Remote` | The chips under the name. The first chip gets the status square. |
| `available` | `true` | Green, pulsing dot when true; grey when false. |
| `ringText` | `"Building this site with Claude Code and Figma AI"` | The text around the ring. Font size adapts to its length. |
| `email` | sample | Used in Contact (copy + mailto). |
| `findMe`, `art` | Instagram, Illustration | `{ label, title, description, cta, href }`. The CTA is a solid button. |
| `connect` | LinkedIn | `{ label, title, description, href }`. The whole cell is the link. |
| `about` | 2 lines + bio | `{ label, headline: string[], body }`. Numbers in the headline count up. |
| `product` | Case Study Template | `{ label, title, description, cta, href }`. The CTA is an outline button. |
| `contact` | – | `{ label, cta, subject }`. |
| `offer` | Work with me | `{ label, title, description, tags, placeholder, cta, footnote, href, spots }`. `\n` in `title` breaks the line, and `spots: null` hides the squares. |
| `newsletter` | Mailing list | `{ label, title, description, cta }`. |
| `onJoinWaitlist` | – | `({ email, topics }) => void \| Promise`. If the promise rejects, the panel shows an error. Without it, the form only simulates the send. |
| `onSubscribe` | – | `(email) => void \| Promise`. Behaves the same way. |
| `footer` | `© year name — …` | The footer's left line. |
| `accent` | `"#22c55e"` | Status dot, focus rings and the offset shadow on hovered buttons. |
| `paper` | `"#e9e3d9"` | Paper colour for the light theme. |
| `fonts` | system stacks | `{ display?, body? }`, as CSS font-family lists. Load webfonts in your app, then name them here. |
| `displayStretch` | `1.32` (`1` with your own display font) | Horizontal stretch of the name. |
| `defaultTheme` | `"system"` | `"system"` follows the host's `.dark` class, then the OS. |
| `onThemeChange` | – | Called with `"light"` or `"dark"`. |
| `maxWidth` | `"1120px"` | Width of the grid. |
| `height` | `"100svh"` | Minimum height of the page. |

## Notes

- Every object prop is merged over the defaults, so you only pass the fields
  you're changing.
- The name uses Archivo Black / Arial Black, stretched 1.32× to get the wide
  grotesk look. For the exact look on every OS, load a wide heavy face such as
  Archivo Black or Unbounded and pass
  `fonts={{ display: '"Unbounded", sans-serif' }}`. The stretch then drops to
  1, unless you set `displayStretch` yourself.
- Body text prefers Space Grotesk, then Inter, then the system sans.
- `prefers-reduced-motion` turns off the entrance, the letter rise, the
  auto-spin, the pulse and the count-ups. You can still drag the ring.
