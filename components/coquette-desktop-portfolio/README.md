# Coquette Desktop Portfolio

A complete portfolio template styled as a quiet, pale-grey desktop. The page
centres on *welcome to my* **portfolio**, with ribbon-tied folders and two paper
documents scattered around it and a dock of pastel and maroon apps below. Each
folder is a category of work, and each project inside it gets its own page.

It works like a real desktop, not a picture of one.

```tsx
import CoquetteDesktopPortfolio from "@/components/ui/coquette-desktop-portfolio"

<CoquetteDesktopPortfolio
  name="Mira Sol"
  headline="studio"
  email="mira@example.com"
  accent="#c9d8f2"
  deep="#1f3a68"
  folders={[
    {
      id: "apps", label: "apps", title: "Mobile Apps", style: "blush", x: 18, y: 60,
      projects: [{ name: "Tide", year: "2026", tags: ["iOS"], url: "https://…", description: "…" }],
    },
  ]}
/>
```

**No dependencies beyond React.** Every folder, bow, document, dock icon and
project thumbnail is SVG drawn in the file. The music box is synthesised live
with Web Audio. No fonts, images or stylesheets load.

## Play with it

| Do this | And |
|---|---|
| Double-click a folder (tap on touch, Enter from the keyboard) | Opens a Finder window for that category |
| In Finder | Search, switch between icon and list views, filter by tag in the sidebar, open a project, go Back and Forward |
| Double-click **about me** / **contact me** | Opens a TextEdit-style bio, or a Mail composer that sends through `mailto:` |
| Drag icons; drag on the wallpaper | Move them; rubber-band select |
| Drag a title bar / its bottom-right corner | Moves / resizes the window |
| Traffic lights | Close, minimise into its dock icon, zoom. Double-click a title bar to zoom as well |
| Hover the dock | It magnifies like macOS; launching an app bounces its icon; running apps get a dot |
| ⌘K / Ctrl+K, or the circle in the dock | Spotlight: search projects, folders and apps; arrow keys and Enter |
| Grid icon | Launchpad: every project as an app tile |
| Right-click the wallpaper | Get Info, Show All Work, Clean Up (resets icons), Change Wallpaper, New Message |

The dock apps: Finder, Launchpad, About Me, Spotlight, Mail, Calendar (your
availability, with today marked), Messages (a chat with canned answers from
`faq`), Gallery (every project thumbnail), Now (a checklist note), Music Box,
Skills, Trash (empty it).

## Props

| Prop | Default | Description |
|---|---|---|
| `name` | `"Kedhareswer"` | Signs the About page and the Messages thread. |
| `eyebrow` / `headline` | `"welcome to my"` / `"portfolio"` | The words in the middle. |
| `about` | bio | `{ title?, paragraphs: string[] }` for the About Me document. |
| `folders` | 4 folders × 3 projects | `{ id, label, title?, style?, x, y, projects }[]`. `x`/`y` are the icon centre in %. `style` is `"blush"` (pink lace), `"noir"` (black gingham), `"ribbon"` (gift-wrapped), `"bows"` (three pink bows) or `"plain"`. |
| `projects[]` | — | `{ name, year?, role?, description?, tags?, url?, id? }`. Tags become the Finder sidebar's tag list. With `url` the project page shows *visit site*; without it, *ask about it*. |
| `aboutIcon` / `contactIcon` | `{x:12.5,y:24}` / `{x:76,y:80}` | Where the two documents sit; optional `label`. |
| `email` | `"hello@example.com"` | Mail composer, Calendar's *book a call* and the Messages fallback. |
| `links` | GitHub, LinkedIn | `{ label, url }[]` chips in About Me and Mail. |
| `availability` | `"Booking new projects…"` | Calendar status line. |
| `now` | 4 items | The Now note's checklist. |
| `skills` | 9 skills | Skills app tiles. |
| `faq` | 4 Q&As | Messages quick replies. Typed questions are matched to the closest one. |
| `song` | `ribbon waltz` | Music Box title and artist. |
| `accent` / `deep` | `#f4b6cb` / `#7d1d45` | Soft pink (bows, folders) and maroon (selection, buttons). |
| `wallpaper` | `"plain"` | `"plain"`, `"blush"`, `"gingham"` or `"dots"`. The context menu cycles them. |
| `openOnLoad` | `null` | `"about"`, `"contact"` or a folder id to open once the intro settles. |
| `intro` | `true` | Heading rises, icons drop in, dock slides up. |
| `height` | `"100svh"` | Root height. Always a definite length. |
| `className` | `""` | Extra classes on the root. |

## Notes

- **Theming.** The desktop, windows and text come from the semantic tokens
  (`--color-background`, `--color-foreground`, `--color-muted-foreground`,
  `--color-border`), so dark mode follows the host. The pinks come from `accent`
  and `deep`.
- **Small screens.** Under 640px wide, icons sit in rows of three above the
  headline, windows open nearly full-screen, and the dock tightens so all
  twelve apps fit a 360px phone.
- **Accessibility.** Icons, dock apps and traffic lights are real buttons with
  labels. Windows are labelled dialogs. The headline is a real `<h1>`.
- **`prefers-reduced-motion`.** No intro, bounces or window animations. Windows
  still open, minimise and close; they just skip the transitions.
- ⌘/Ctrl+K and Escape are listened for on `window`. That suits a full-page
  template; keep it in mind if you embed two.
