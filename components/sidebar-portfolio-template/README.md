# Sidebar Portfolio Template

A complete one-page portfolio in a single file. It's quiet and minimal: warm
paper, serif headings, one accent colour. A profile sidebar sticks on the left,
and the reading column holds everything else:

- **Sidebar:** portrait, name, role, bio, a signature that writes itself, details (location,
  experience, availability), socials, **Download CV** and a copy-email button.
- **Nav:** sections, a theme toggle and **Contact Me**.
- **Hero:** a line drawing of a developer at a laptop with things orbiting them,
  the headline, the tagline and a **View Experience** button with your company logos.
- **About:** your intro plus key-skill chips.
- **Experience:** a timeline grouped by company, with dates, how long each role lasted,
  summaries, highlights and skill tags.
- **Education:** each entry has foldable highlights.
- **Skills:** grouped tabs with segmented meters.
- **Contact:** an availability pulse, your email, a compose sheet, and your local time.

```tsx
import SidebarPortfolioTemplate from "@/components/ui/sidebar-portfolio-template"

<SidebarPortfolioTemplate
  name="Maya Lindqvist"
  role="Product Designer"
  email="maya@lindqvist.studio"
  headline="Product Designer"
  accent="#0f8a6a"
  experience={[
    {
      company: "Fjord Health",
      logo: { color: "#0f8a6a", glyph: "leaf" },
      roles: [{ title: "Lead Product Designer", start: "Mar 2023", end: "Present", skills: ["Design systems"] }],
    },
  ]}
  keySkills={["Design systems", "Prototyping"]}
/>
```

**No dependencies beyond React.** The portrait, signature, hero drawing, logos
and icons are all drawn as SVG in the file, so no fonts, images or stylesheets
load. Headings use the system's old-style serif (Iowan, Palatino, Georgia).

## Play with it

| Do this | And |
|---|---|
| Scroll | The nav pill follows the section you're reading, and sections fade up as they arrive |
| Click a nav link, the logo or **View Experience** | The page glides there |
| Click a **key skill** | The timeline lights up every role that used it and dims the rest, with a count and a Clear link. Role tags work the same way |
| Click the hero drawing (or focus it and press Enter) | The orbits spin up and a quip floats out of the laptop ("deployed ✓") |
| Move over the hero | The floating icons drift in parallax |
| Click the signature | It signs again |
| Click the mail button or the email in Contact | Copies your address, with a toast |
| **Download CV** | Downloads `cvUrl` if you gave one. Otherwise it writes a `.txt` CV from the same data the page shows |
| **Contact Me** | Opens a compose sheet that builds a `mailto:` draft. Escape or clicking outside closes it |
| Skills tabs | Switch groups, with ←/→ on the keyboard. The meters refill |
| The moon / sun | Flips the page between light and dark |

## Props

| Prop | Default | Description |
|---|---|---|
| `name` / `role` / `bio` | Oliver Rowland… | The sidebar header. The signature is generated from `name`. |
| `avatarSrc` | — | A photo URL. Without one, a portrait is drawn. |
| `avatar` | warm tones | `{ skin, hair, shirt, backdrop }` for the drawn portrait. |
| `signature` | `true` | Show the signature. |
| `details` | Houston / 5+ yrs / remote | `{ icon, label }[]`. Icons: `pin` `briefcase` `globe` `clock` `mail` `spark` `cap`. |
| `socials` | LinkedIn, X, Dribbble | `{ label, href, icon }[]`. Icons: `linkedin` `x` `github` `dribbble` `instagram` `globe` `mail`. |
| `email` | `hello@oliverrowland.dev` | Used by copy, the compose sheet and the CV. |
| `cvUrl` | — | A real CV to download. Without one, a text CV is generated. |
| `headline` / `tagline` | Full Stack Developer… | The hero. |
| `heroQuips` | six dev one-liners | What floats out when the hero is clicked. Pass `[]` to turn them off. |
| `about` | one paragraph | A string or an array of paragraphs. |
| `keySkills` | seven chips | Chips under About. Each one matches roles whose `skills` contain the same label (case-insensitive). |
| `experience` | four roles, three companies | `{ company, logo?, roles: { title, type?, start, end, summary?, highlights?, skills? }[] }[]`. Roles at the same company share one logo and a connecting rail. |
| `education` | two entries | `{ school, degree, start, end, summary?, notes?, logo? }[]`. `notes` fold under **Highlights**. |
| `skills` | Frontend / Backend / Tooling | `{ name, items: { name, level (0–100), years? }[] }[]`. An **All** tab is added when there's more than one group. |
| `contactTitle` / `contactText` | — | The Contact section. |
| `available` | `true` | The green "Available for new projects" pulse. |
| `timeZone` / `city` | `America/Chicago` / `Houston` | The local-time line in the footer. |
| `labels` | English | Override any UI string: `about` `experience` `education` `skills` `contact` `contactMe` `keySkills` `viewExperience` `downloadCv` `all`. |
| `accent` | `#e5553b` | The one accent colour. |
| `paper` / `ink` | `#faf6f0` / `#1f1512` | Light palette. |
| `darkPaper` / `darkInk` | `#15110e` / `#f1ebe3` | Dark palette. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` ancestor (the shadcn convention). `"light"` and `"dark"` force a palette. |
| `themeToggle` | `true` | Show the moon/sun button. |
| `height` | `"100svh"` | Root height. The page scrolls inside it. Always use a definite length. |
| `className` | `""` | Extra classes on the root. |

**Logos** are `{ color, glyph?, text? }`. Glyphs are `orbit` `flower` `hash`
`cap` `book` `spark` `bolt` `leaf` `cube`. With `text` (or with neither), the
tile shows letters instead, defaulting to the company's initial.

**Dates** accept `"Jan 2025"`, `"January 2025"`, `"2021"` or `"Present"`. Both
ends count, as on a CV: Jan 2023 to Dec 2024 is 2 yrs.

## Notes

- The layout responds to **its own width** (container queries), not the
  viewport. At 880px and wider, the sidebar sticks beside the column. Below that,
  it stacks on top as a profile card, and the nav sticks under it. It works at
  phone width.
- The page scrolls inside the root, so the sticky sidebar and nav work in
  any container. The dialog and toasts stay inside it too.
- Accessibility: the nav, sections, tabs, dialog and fold all carry real roles and
  ARIA state. The hero drawing and the signature can be reached with the
  keyboard, and toasts are announced.
- `prefers-reduced-motion`: there's no reveal, orbit, parallax, signature writing,
  blink or ping. Everything shows in its finished state, and scrolling jumps instead
  of gliding.
