# Vernissage Museum Template

The home page of an art and history museum, hung the way a museum hangs its
walls. Every image sits in a gilt hairline frame that draws itself on as it
scrolls in. Captions are set like wall labels. The hero is a slow, lit
gallery. A real museum could ship it this week: exhibitions, live opening
hours, admission, a collection with a lightbox, services and a footer.

```
section     what happens
----------  ----------------------------------------------------------------------------
top bar     live "Open today · 10 am – 5 pm" / "Closed now · opens Tuesday" from `hours`,
            address, search, language menu
header      transparent over the hero, turns solid and tucks away on scroll down,
            gold progress hairline; burger drawer and search panel on narrow widths
hero        exhibition carousel: photo settles, gilt frame draws, title rises word by
            word; arrows, dots, ←/→ keys, autoplay hairline that pauses on hover/focus
welcome     a marble bust photo re-drawn at runtime as a graphite study, scrubbed in
exhibitions hover or focus a row and the framed banner crossfades to it
visitor     split band: photo drifts past its frame; prices and grouped hours with
            dotted leaders, today's row marked, "Open now" pulse
collection  three-column hang (two, one on narrow), pieces rise into their frames,
            "Load more" pages, click for a keyboard-navigable lightbox
services    accordion with line icons
footer      wordmark, address, link columns, social
```

## How it works

- **Graphite study.** The welcome photo is read once (cross-origin), turned to
  grey, blurred twice with a running-sum box blur, and colour-dodged against
  its own blur: the pencil-sketch trick. An elliptical fade melts it into the
  paper. It is painted in the current text colour, so dark mode gets a chalk
  drawing. If the photo is CORS-blocked or fails, or `welcome.sketch` is
  `false`, it shows as a soft duotone instead.
- **Gilt frames** are one SVG rect per image with `pathLength=1`. GSAP tweens
  a `--draw` custom property, so the frame and the photo animate from one
  timeline and the finished state is the default.
- **Opening hours** are Sunday-first `[open, close]` pairs in 24-hour decimals
  (`[10, 17.5]` is 10 am – 5:30 pm). Runs of equal days are grouped
  ("Tuesday – Saturday") and the open state is recomputed every minute.
- **Motion** is GSAP + ScrollTrigger inside one `gsap.context` (reverted on
  unmount) and `gsap.matchMedia`, so `prefers-reduced-motion` renders the page
  finished with no tweens. Pieces revealed by "Load more" join the same context.
- **Layout** answers the component's own width through container queries,
  not the window. The drawer and lightbox sit outside the container so they
  stay fixed to the viewport.

## Dependencies

- **`gsap`** (with its bundled `ScrollTrigger`). It is declared in the root `package.json`.

## Usage

```tsx
import VernissageMuseumTemplate from "@/components/ui/vernissage-museum-template"

<VernissageMuseumTemplate
  preset="gilt"                                   // "gilt" | "lapis" | "moss"
  museum={{ name: "aurelian", tagline: "Museum of Art & History", address: "…" }}
  hours={[[11, 17], null, [10, 17], [10, 17], [10, 17], [10, 17], [10, 17]]}  // Sunday first
  hero={{ slides: [{ kicker: "Feb 10 — Apr 28", title: "…", image: "https://…" }] }}
  onNavigate={(href) => router.push(href)}
  onArtwork={(art) => track("artwork", art.title)}
/>
```

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Height of the hero stage. Must be a definite length. |
| `preset` | `"gilt"` | Palette: gilt on warm paper, lapis, or moss. |
| `colors` | — | Override `paper`, `paper2`, `ink`, `muted`, `gold`, `band`, `goldOnBand`. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` ancestor. |
| `fontHref` | Google Fonts (Cormorant Garamond + Montserrat) | `null` loads nothing. |
| `fonts` | — | `sans`, `serif` font-family stacks. |
| `museum` | Aurelian | `name` (wordmark), `tagline`, `address`, `phone`, `email`. |
| `nav` | 4 + 4 links | `left`, `right`. In-page hrefs (`#exhibitions`, `#collection`, `#visit`, `#services`, `#about`, `#top`) scroll. |
| `languages` | EN FR DE ES | Language menu codes. |
| `hours` | Tue–Sat 10–5, Sun 11–5 | Seven entries, Sunday first; `null` is closed. |
| `now` | the visitor's clock | Fix the clock the open state uses. |
| `hero` | 3 slides | `slides: { kicker, title, cta, image }[]`, `autoplay` ms (0 = off). |
| `welcome` | — | `title`, `body`, `link`, `image`, `sketch`. |
| `exhibitions` | 3 shows | `title`, `viewAll`, `items: { title, dates, blurb, image, href }[]`, `more`. |
| `visitor` | — | `title`, `pricesTitle`, `prices`, `hoursTitle`, `link`, `image`. |
| `collection` | 12 works | `title`, `intro`, `viewAll`, `items: { title, artist, year, image, ratio, href }[]`, `pageSize`, `loadMore`. |
| `services` | 4 services | `title`, `items: { title, body, icon, link }[]`. Icons: audio, camera, dining, shop, ticket, access. |
| `footer` | — | `columns`, `social`, `copyright`. |
| `onNavigate` `onSearch` `onLanguage` `onExhibition` `onArtwork` | — | Callbacks. |

Every image prop takes a URL or `{ src, alt, focus: [x, y] }`.

## Accessibility

- The hero is a labelled carousel: real buttons, `aria-selected` dots, ←/→ keys, and autoplay pauses on hover and focus.
- The hero title carries its full text as `aria-label`; the word spans are hidden.
- The lightbox is a modal dialog with focus on close, ←/→ and Escape, and it locks scroll.
- Accordion buttons expose `aria-expanded`; closed panels are hidden from focus.
- `prefers-reduced-motion` skips all GSAP choreography and CSS transitions.

## Photo credits (Unsplash)

Gallery photographs:
- `photo-1637578035109-a28d894f3d2f` (redcharlie): gallery with old master paintings and a cannon
- `photo-1758380742154-44738eb92832` (Robert, Visual Diary): visitors before gold-framed paintings
- `photo-1736023164636-c41930fb9e10` (Egor Myznik): Peredvizhniki exhibition, Tretyakov Gallery
- `photo-1681490443016-30ae75a1647b` (Etienne Girardet): white gallery
- `photo-1769117695165-6ecb44ff1150` (Helena Lopes): gallery corridor
- `photo-1764992117731-b41b680387dd` (Sui Xu): marble bust at the Louvre
- `photo-1714393674893-b89e436cc6c4` (Roman Empire Times): bust of Marcus Aurelius

Paintings, public-domain scans via Europeana and Birmingham Museums Trust:
de Heem *Vase of Flowers* `1579783900882-c0d3dad7b119`, Zdrazila *Gebirgssee*
`1699569848351-f28e87e185ec`, Regnault *Sapho* `1655455561178-0d3c092d0edb`,
*Portrait of a Young Woman* `1752317591841-bbca8ed3eb0b`, Rembrandt *Tronie*
`1579009120139-f41119c5e2ba`, *Banquet Still Life* `1588260275894-4f51cc4c12b1`,
Eckersberg *Romsdalen* `1700405495181-69f35790a8aa`, Lippi *Saint Sebastian*
`1743341491576-15ee095a83ac`, *Portrait of a Woman* `1582561424725-ad87a9a79fa3`,
Delacroix *Madame Simon* `1694727329633-7760a2bd8d0f`, Bogdan *Still Life*
`1700213396551-48c119a84c8e`, *The Lamentation* `1581592717605-765045be25bb`,
*Landscape at Sunset* `1700404837914-4ccd331c508a`, Weisz-Kubínčan *Winter
Landscape* `1700404245264-10ec1c3a6905`, *Still Life with Flowers* `1588260692965-2c90db1b8c0e`.

The default institution, address and copy are fictional.

## Notes for publishing

- The default font and photos come from Google Fonts and Unsplash. 21st's capture
  sandbox blocks external origins, so supply `media/vernissage-museum-template/default.png`
  as `--preview`.
- Reference image: `media/vernissage-museum-template/reference.webp` (local only).
