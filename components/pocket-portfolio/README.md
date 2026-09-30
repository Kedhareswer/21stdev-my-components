# Pocket Portfolio

A minimal, card-stacked one-page portfolio template. White rounded cards on a
soft grey page, a pill nav, one hot accent colour.

- **Pill nav** — Info / Work / Contact each fold their card open and shut
  (the ⊕ turns into ⊖). Opening one scrolls it into view. The nav stays
  sticky while you scroll.
- **Info card** — portrait (drawn by default; its eyes follow the pointer, its
  glasses glint on hover), a language switcher that re-types the bio word by
  word and translates the UI labels, and a live local clock (click for 12/24h,
  hover for the city). Unfolded: services chips and an experience table.
- **Client marquee** — endless loop of wordmarks, pauses on hover, spotlights
  the one under the pointer.
- **Work card** — the first projects while folded, all of them when open.
  Click a project to expand it in place (large cover, year, role, tags, case
  study link). Escape closes it.
- **Contact card** — availability status with a live dot, click the email to
  copy it. Unfolded: social links and a "Say hello" mailto.
- **Layout** — a phone-width stack; when its container is 880px or wider it
  splits into a sticky left column (nav, info, clients) and the work on the right.
  `layout="stack"` keeps the single column everywhere.
- **Theme** — `theme="auto"` follows a `.dark` ancestor; force with `"light"` / `"dark"`.
- Reduced motion turns every animation off and the marquee into a scroller.

```tsx
import PocketPortfolio from "@/components/ui/pocket-portfolio"

<PocketPortfolio
  name="Maya Laurent"
  handle="@maya.makes"
  email="bonjour@mayalaurent.fr"
  location="Lyon, FR"
  timeZone="Europe/Paris"
  accent="#c6ff3d"
  languages={[
    { code: "EN", bio: "Independent product designer in Lyon…" },
    { code: "FR", lang: "fr", bio: "Designer produit indépendante…", labels: { work: "Projets" } },
  ]}
  projects={[
    { title: "Ledger", art: "cards", year: "2026", role: "Product design", tags: ["Fintech"], href: "/work/ledger",
      description: { EN: "A money dashboard for freelancers…", FR: "Un tableau de bord…" } },
    { title: "Photo shoot", image: "/covers/shoot.jpg", description: "Your own image works too." },
  ]}
/>
```

**No dependencies beyond React.** The portrait, project covers and client marks
are SVG drawn in the file, so nothing loads unless you pass your own
`portrait` / `image` URLs. Client names and projects in the defaults are fictional.

## Props

| Prop | Default | Description |
|---|---|---|
| `name` / `handle` / `email` | Owain Pryce set | Identity. `name` is the page's `<h1>` (visually hidden). |
| `location` / `timeZone` | `"Cardiff, UK"` / `"Europe/London"` | Clock label and IANA zone. |
| `languages` | EN + CY (Welsh) | `{ code, lang?, bio, labels? }[]`. One entry hides the switcher. `labels` translates nav and UI text. |
| `defaultLanguage` | first code | |
| `portrait` / `portraitAlt` | drawn portrait | Your photo URL (shown greyscale). |
| `projects` | 5 projects | `{ title, description, art?, image?, year?, role?, tags?, href? }`. `description` may be a string or `{ [code]: text }`. `art`: `phone` `signage` `packaging` `poster` `type` `cards`. |
| `clients` | 6 fictional | `{ name, mark? }`; `mark`: `orbit` `wave` `hash` `stack` `spark` `half`. `[]` hides the strip. |
| `socials` | 4 links | `{ label, href, handle? }`. |
| `services` / `experience` | | Chips and `{ years, role, org }` rows in the unfolded info card. |
| `availability` | `"Available for new projects — Nov 2026"` | `null` hides it. |
| `accent` / `accentForeground` | `"#f65ee3"` / `"#0f0f0f"` | Active pills, hovers, drawn-cover accents. |
| `theme` | `"auto"` | `"auto"` \| `"light"` \| `"dark"`. |
| `layout` | `"auto"` | `"auto"` \| `"stack"`. |
| `defaultOpen` | `["info"]` | Sections unfolded on load. |
| `collapsedProjects` | `2` | Projects shown while Work is folded. |
| `marqueeSeconds` | `24` | One loop of the client strip. |
| `minHeight` | `"100svh"` | |
| `className` / `style` | | On the root. |
