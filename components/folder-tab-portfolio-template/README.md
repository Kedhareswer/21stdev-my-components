# Folder Tab Portfolio Template

A complete designer portfolio built from file folders: saturated blue, green,
orange and pale-yellow tabs, frosted glass bodies, a wide monoline wordmark
with a pill-shaped `OO`, crosshair marks and a handwritten signature. It reads
like the pages of a printed portfolio deck, one rounded "sheet" per page.

- **Masthead**: a blue tab hanging from a strip, with your wordmark drawn in
  white and three notes on the right.
- **Sticky nav**: a page counter (`03 / 07`) and a blue pill that slides to
  whichever sheet is in view. Sun/moon theme toggle.
- **Cover**: an outlined `#2026` tag behind a drawn-on `PORTF◯◯LIO`, a big
  second-language title with your signature written over it, a palm frond
  watermark, and a fan of frosted category folders. Hover pulls a folder up;
  click opens that category in the work cabinet.
- **Catalogs**: chapters stacked like filing bands. Click one to open it (blue,
  with its points and an *Open chapter* button that jumps to the page).
- **About me**: an illustrated photo card that tilts with the pointer, a
  greeting, three highlight columns, a work timeline whose dates stay blurred
  until you hover them, and contact chips.
- **Works**: a filter row of folder tabs (arrow keys, Home, End), project
  folders with generated covers, and a details sheet: Esc closes, ← / → page
  through the current filter, focus returns to the card.
- **Process**: one big folder whose tab follows the selected step.
- **Kind words**: quotes on tilted glass folders over coloured blobs.
- **Contact**: a stack of bands with a drawn *Let's talk :)*, your email (copy
  or open mail app) and links. The footer keeps your local time.

```tsx
import FolderTabPortfolioTemplate from "@/components/ui/folder-tab-portfolio-template"

<FolderTabPortfolioTemplate
  name="Noor Haddad"
  handle="@noor.prints"
  years="2024–2026"
  role="Brand & motion designer"
  word="Showreel"
  tag="#NOOR"
  subtitle={["Brand ", "work"]}
  email="noor@example.com"
  colors={{ blue: "#5b5bf0", green: "#14b8a6" }}
  categories={[{ id: "brand", label: "Identity", tone: "blue", kind: "brand" }]}
  projects={[{ title: "Saffron Lane identity", category: "brand", year: "2026", summary: "…" }]}
/>
```

**No dependencies beyond React.** The display type is a stroke alphabet drawn
in the file (A–Z, 0–9 and `# - – . , : ' / + ( ) ! ? &`; lower case is set in
capitals, anything else becomes a space). The signature is generated from your
name, and the photo, covers and palm are SVG. Nothing loads at runtime and the
host's URL is never touched.

## Props

| Prop | Default | Description |
|---|---|---|
| `name` / `localName` | `"Aoi Lin"` / `"林葵"` | Greeting, alt text, footer. `localName` is shown big; pass `""` to skip it. |
| `handle` | `"@aoilin.studio"` | Photo tab and links. |
| `signature` | first word of `name` | Text the scrawled signature is generated from. |
| `years` / `role` | `"2025–2026"` / `"Visual designer"` | Meta rows, cover pill, photo card, footer. |
| `disciplines` | 3 labels | The meta row across the top of every sheet. |
| `word` / `tag` | `"Portfolio"` / `"#2026"` | Masthead + cover wordmark, and the outlined tag behind it. |
| `subtitle` | `["設計", "作品集"]` | Big cover title. Odd parts are tinted blue. |
| `notes` | 3 notes | Right side of the masthead (hidden on phones). |
| `blurb` / `greeting` | sample / `"Hi, I am"` | Cover paragraph and About greeting. |
| `photo` | illustrated harbour scene | An image URL or your own node. |
| `highlights` | 3 columns | `{ label, tone?, lines[] }`. |
| `timeline` | 3 roles | `{ from, to, title, place? }`. |
| `categories` | 5 folders | `{ id, label, local?, tone, kind? }`. The first six fan out on the cover. `kind` picks the cover style: `poster`, `render`, `page`, `sale`, `brand`. |
| `projects` | 10 samples | `{ title, local?, category, year, summary, client?, role?, tools?, body?, href?, image?, mark? }`. `image` replaces the generated cover; `mark` is the word printed on it. |
| `chapters` | 5 chapters | `{ title, local?, points?, target? }`. `target` is a sheet id to jump to. |
| `steps` | 4 steps | `{ title, local?, body, outputs?, duration? }`. |
| `words` | 3 quotes | `{ quote, name, role?, tone? }`. |
| `email` / `contacts` | sample | Contact band, copy button, About chips. |
| `timeZone` | `"Asia/Shanghai"` | IANA zone for the footer clock. |
| `colors` | blue / green / orange / yellow | Override any folder colour. |
| `ligatures` | `true` | Join `OO` into one pill. |
| `defaultTheme` | `"system"` | `"system"` follows the host's `.dark` class, then the OS. |
| `onThemeChange` | – | Called with `"light"` / `"dark"`. |
| `height` | `"100svh"` | Minimum height of the page. |

Empty `chapters`, `projects`, `steps` or `words` hide their sheet and its nav
link; the page counter adjusts.

## Notes

- Colours are the component's own light and dark palettes, scoped to its root,
  so it looks the same in any host. The theme toggle affects only the template.
- Second-language text uses the system CJK fonts (PingFang, Hiragino, Noto Sans
  CJK, Microsoft YaHei). Replace it with any language through the props.
- The frosted folders use `backdrop-filter`; where it is unsupported they fall
  back to a translucent fill.
- `prefers-reduced-motion` turns off every animation and shows the type fully
  drawn.
