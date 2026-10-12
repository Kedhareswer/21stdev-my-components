# Bento Portfolio Template

A complete personal site in one component: a soft, warm-gray bento where every
card does something small when you reach for it.

- **Intro**: a drawn portrait, a headline that ends in a muted
  *Previously at …*, and your bio.
- **Voice note that talks**: give it a transcript and the browser's own speech
  engine reads it aloud, sentence by sentence. The waveform fills as it goes,
  you can click or drag it to seek (or use ← →), and captions show the line
  being spoken. Pass `src` for a real recording instead. If no voice is
  available it plays silently, so it never stalls.
- **Availability pill**: a pulsing status dot, a tooltip, and a click copies
  your email.
- **Experience**: a scrollable timeline that opens at the newest role, with a
  draggable thumb. Hover an entry to reveal the role.
- **What I'm listening**: album art, a vinyl that slides out and spins while
  playing, a seekable progress bar, prev/play/next and mute. Simulated
  (silent) unless a track has `src`.
- **What I'm reading**: a drawn book that lifts on hover, a reading bar, and
  arrows to flip through the stack.
- **Map**: a street map generated for your city (stable per city name). Drag
  to look around, recenter, and see your local time on hover.
- **Photos**: an auto-advancing carousel with captions, dots and arrows. Three
  scenes are drawn in SVG (football, mountains, coffee), or use your images.
- **How I work**: stepped tabs with a sliding pill and an auto-advance bar that
  pauses on hover. Arrow keys move between steps.
- **Below the fold**: selected work (click a card for a detail sheet, ← → to
  page, Esc to close), rotating testimonials, count-up stats, a toolbox
  marquee, writing, links, a contact card with copy-email and a live local
  clock, and a footer.
- **Light and dark**, a pointer-following glow on every card, and a sticky nav
  that jumps to Work / Writing / Contact.

```tsx
import BentoPortfolioTemplate from "@/components/ui/bento-portfolio-template"

<BentoPortfolioTemplate
  name="Aiko Tanaka"
  role="Design Engineer"
  company="Kumo"
  previously="Mercari"
  email="aiko@example.com"
  accent="#4f7cff"
  voiceNote={{ transcript: "Hi, I'm Aiko. Let's build something calm." }}
  location={{ city: "Tokyo", timeZone: "Asia/Tokyo" }}
  projects={[{ title: "Kumo Motion", client: "Kumo", year: "2025", kind: "web" }]}
/>
```

**No dependencies beyond React.** The portrait, album art, book covers, map,
photos and project covers are SVG drawn in the file, the type is the system
font stack, and nothing loads at runtime unless you pass your own image or
audio URLs.

## Props

| Prop | Default | Description |
|---|---|---|
| `name` / `role` / `company` / `previously` | John Doe, Product Designer, Northwind, Lumen | The headline. Empty `company` or `previously` drops that clause. |
| `companyHref` | – | Turns the company into a link. |
| `bio` | sample | A string or your own nodes. |
| `avatar` | drawn portrait | An image URL, or any node (116px square). |
| `handle` | `"johndoe"` | Shown in the nav. |
| `email` | sample | Copied by the availability pill and the contact card. |
| `bookingHref` | `"#"` | *Book a call* link. Empty hides it. |
| `voiceNote` | sample | `{ transcript, src?, duration?, speak? }`, or `null`. |
| `availability` | Available for Work | `{ label, status?: "available" \| "busy" \| "away", note? }`, or `null`. |
| `experience` | 6 samples | `{ company, year, role?, href? }[]`, oldest first. The last is marked current. |
| `tracks` | 3 samples | `{ title, artist, duration?, src?, art?, color? }[]`. |
| `books` | 3 samples | `{ title, author, progress?, color? }[]`. |
| `location` | Los Angeles | `{ city, timeZone?, labels?: { text, x, y }[] }` (labels in 0–300 map units), or `null`. |
| `moments` | 3 scenes | `{ caption, emoji?, image?, scene? }[]`. |
| `steps` | 4 steps | `{ title, description }[]`. |
| `projects` | 4 samples | `{ title, client?, year?, description?, tags?, href?, cover?, hue?, kind?: "web" \| "app" \| "brand" }[]`. |
| `testimonials` | 3 samples | `{ quote, name, role? }[]`. |
| `stats` | 3 samples | `{ value, suffix?, label }[]`. |
| `tools` | 12 names | `string[]`. |
| `posts` | 3 samples | `{ title, date, href?, minutes? }[]`. |
| `socials` | 4 samples | `{ label, href, handle? }[]`. Known labels get an icon. |
| `accent` | `"#f0782a"` | Play button, current-role dot, pin, focus rings, contact button. |
| `defaultTheme` | `"system"` | `"system"` follows the host's `.dark` class, then the OS. |
| `onThemeChange` | – | Called with `"light"` / `"dark"`. |
| `height` | `"100svh"` | Minimum height of the page. |

Every list hides its card when empty.

## Notes

- Colours are the component's own light/dark palettes scoped to its root, so it
  looks the same in any host. The nav toggle affects only the template.
- The layout responds to the component's own width (container queries): 12
  columns, then 6, then a single column on phones.
- Speech uses `speechSynthesis`, which every modern browser ships. Voices vary
  by OS; pass `voiceNote.src` for a recording in your own voice.
- `prefers-reduced-motion` turns off every animation and the marquee becomes a
  static wrap.
