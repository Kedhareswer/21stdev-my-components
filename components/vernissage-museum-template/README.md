# Vernissage Museum Template

The home page of an art and history museum: warm paper, a gilt accent, a grand
lit gallery in the hero and real paintings everywhere else. A museum could ship
it this week, with exhibitions, live opening hours, admission, a collection with
a lightbox, services and a footer.

```
section     what happens
----------  ----------------------------------------------------------------------------
top bar     live "Open today · 10 am – 5 pm" / "Closed now · opens Tuesday" from `hours`,
            address, search, language menu
header      transparent over the hero, turns solid and tucks away on scroll down,
            gold progress hairline; burger drawer and search panel on narrow widths
hero        opens like a pair of gallery doors; each next room is drawn across like a
            curtain while the old one slides away beneath it; titles rise word by word;
            thin edge arrows, numbered dots with an autoplay hairline, ←/→ keys
welcome     a baroque pen-and-wash drawing printed onto the paper, laid down by an
            ink-wipe mask as you scroll (or any photo re-drawn as graphite: `sketch`)
exhibitions hover or focus a row and its painting wipes up into the banner
visitor     split band: the red salon wall slides open; prices and grouped hours in a
            two-column table, today's row marked, "Open now" pulse
collection  three-column hang (two, one on narrow); each work rises out of its mat,
            "Load more" pages, a "View" cursor follows the pointer, and the lightbox
            morphs the painting off the wall and flies it back on close
services    accordion with line icons
footer      wordmark, address, link columns, social
```

## How it works

- **Curtain slides.** The incoming slide's `clip-path` opens from the side you
  are travelling towards while its photo counter-moves; the outgoing photo
  slides the other way beneath it. Rapid clicks finish the previous move first.
- **Ink wipe.** The welcome drawing is masked twice: an elliptical fade into
  the paper, and a diagonal gradient whose stop is a `--ink` custom property
  that ScrollTrigger scrubs from 0 to 1. The default is 1, so without
  JavaScript the drawing is simply there. The wrapper multiplies onto the
  paper (screen in dark mode, with the drawing inverted into chalk).
- **Lightbox morph.** Opening records the thumbnail's rect, sizes the lightbox
  to the work's ratio, and tweens from one rect to the other (FLIP). Closing
  flies it back if its place on the wall is on screen, and fades otherwise.
- **Opening hours** are Sunday-first `[open, close]` pairs in 24-hour decimals
  (`[10, 17.5]` is 10 am – 5:30 pm). Runs of equal days are grouped
  ("Tuesday – Saturday") and the open state is recomputed every minute.
- **Graphite study** (`welcome.sketch`). A photo is read cross-origin, turned
  grey, blurred twice with a running-sum box blur and colour-dodged against
  its blur. A CORS-blocked photo falls back to a soft duotone.
- **Motion** is GSAP + ScrollTrigger inside one `gsap.context` (reverted on
  unmount) and `gsap.matchMedia`, so `prefers-reduced-motion` renders the page
  finished with no tweens.
- **Layout** answers the component's own width through container queries. The
  cursor, drawer and lightbox sit outside the container so `position: fixed`
  stays bound to the viewport.

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
| `welcome` | — | `title`, `body`, `link`, `image` (a drawing or engraving reads best), `sketch` (re-draw a photo as graphite). |
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
- `photo-1775416343921-6dfe2cf21424` (mana5280): ornate room, chandelier and red carpet
- `photo-1735605918310-73ad27a5dd6b` (Neon Wang): skylit gallery, salon hang
- `photo-1747918157024-a1e1c77336fa` (Richard Wang): dark vaulted hall of great paintings
- `photo-1554907984-15263bfd63bd` (Andrew Neel): red damask wall of gilt frames
- Lapis demo: `photo-1761563071832-e548e022a706` (skylit blue gallery), `photo-1767243304026-219d0acb7c6b` (red wall of landscapes), `photo-1714393674893-b89e436cc6c4` (Roman Empire Times, bust of Marcus Aurelius)

Drawing and paintings, public-domain scans via Smithsonian, Europeana, The Met
and Birmingham Museums Trust:
- After Marc Antonio Franceschini, *St. Bruno in Ecstasy*, 1800–20 `1787060142023-8989f3ca77f2`
- Willem van Haecht, *Apelles Painting Campaspe*, 1630 `1745237826674-1fb299b72913`
- Sir John Gilbert, *The Phantom Horseman*, 1870–93 `1580136579312-94651dfd596d`
- Adriaen van Utrecht, *Banquet Still Life*, 1644 `1588260275894-4f51cc4c12b1`
- Willem van Aelst, *Flower Still Life with a Timepiece*, 1663 `1579783901586-d88db74b4fe4`
- Vincent van Gogh, *Cypresses* and *Olive Trees*, 1889 `1782849494146-596db4cc305d`, `1782849324101-3ae636a0e270`
- Guido Reni, *Artemisia*, 1638–39 `1576503918400-0b982e6a98bf`
- Bertha Violet de Chevalier, *Fischerhaus bei Lübbenau*, 1882 `1745761500009-0c62402a06b0`
- Rembrandt, *Tronie of an Old Man* `1579009120139-f41119c5e2ba`; de Heem, *Vase of Flowers* `1579783900882-c0d3dad7b119`;
  Delacroix, *Madame Simon* `1694727329633-7760a2bd8d0f`; Eckersberg, *Romsdalen* `1700405495181-69f35790a8aa`;
  *Portrait of a Young Woman* `1752317591841-bbca8ed3eb0b`; Lippi, *Saint Sebastian* `1743341491576-15ee095a83ac`;
  Regnault, *Sapho* `1655455561178-0d3c092d0edb`; Zdrazila, *Gebirgssee* `1699569848351-f28e87e185ec`;
  *Landscape at Sunset* `1700404837914-4ccd331c508a`; Weisz-Kubínčan, *Winter Landscape* `1700404245264-10ec1c3a6905`

The default institution, address and copy are fictional.

## Notes for publishing

- The default font and photos come from Google Fonts and Unsplash. 21st's capture
  sandbox blocks external origins, so supply `media/vernissage-museum-template/default.png`
  as `--preview`.
- Reference image: `media/vernissage-museum-template/reference.webp` (local only).
