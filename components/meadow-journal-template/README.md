# Meadow Journal Template

A personal diary site for someone who lives outdoors: a farm-sitter, a film
photographer, a slow traveller. One frosted board floats over a full-bleed landscape
photograph, built from widgets like a phone home screen. The rest of the page
uses the same pieces: periwinkle panels, olive and bark-dark cards, gold
sticker stars and a pill scrubber.

**Real photographs.** The default pictures come from
[Unsplash](https://unsplash.com) (Unsplash License: free to use, no permission
needed). There's a green Highland glen, a straw-hat portrait, lavender rows at
sunset, a boardwalk over the dunes, an old barn, sheep, goats, cows, a piglet,
a mountain lake and a lone oak. They're served from Unsplash's CDN at the
width each slot needs, with a `srcset`. A tiny blurred copy shows while each
one loads, then the photo fades in. Every picture is a prop, so pass your own
URLs. Night mode grades the backdrop photo down to a moonlit blue.

- **The board.** *Hello, Nia!* sits next to a live clock with a blinking
  colon, in the visitor's zone or one you set. Under them:
  - Nav pills that scroll the page. A dark pill slides under the section
    you're in.
  - A status pill (click it to cycle *active now*, *out in the fields*,
    *offline*) and a *more* menu: follow, copy profile link, night mode,
    sign the guestbook.
  - Diary entries with bold ink highlights. The active dot fills as a timer
    and the board moves on to the next entry when it's full. The timer
    pauses on hover, on focus, while a menu or the lightbox is open, and off
    screen. You can also swipe it on touch. Each entry crossfades the
    photograph behind the whole page and the two photo cards.
  - *Liked by 25.4 K people you follow*, which you can click to like the
    entry.
  - **Photo cards.** A hand-drawn doodle draws itself over the first one. It
    also has a removable tag and *Taken by Canon AE-1*. The second links
    *From the Archive* and has a like button with a burst. Click either photo
    to open it in the lightbox.
  - **On repeat.** A music card with album art (a vinyl slides out and spins
    while it plays). It really plays: a small music box,
    synthesised live with Web Audio. Each song's tune is made from its title,
    in its own key. It has prev and next buttons, a seekable progress line,
    an equaliser and elapsed time. Pass `src` to play a real file.
  - **New messages.** It shows the sender's face and the unread count. *Reply* opens a text field
    in place, and after you send, the card moves on to the next message
    until you're all caught up.
  - **Gold stars.** Drag them anywhere, or click one to spin it.
  - **The pill under the board** is the page's scrollbar. Drag the thumb,
    click the track, or focus it and use the arrow keys, Page Up/Down,
    Home and End.
- **The dock.** When the board scrolls away, a compact pill drops in with
  the avatar, the nav, the clock and a progress line.
- **About me.** A portrait, bio, follow and message buttons, stats that
  count up, a *Currently* card, and a postcard of today's photo with a dated
  stamp.
- **Photos.** A masonry wall of twelve photos with filter chips and like
  buttons. The lightbox shows the whole frame (portraits aren't cropped) over
  a blurred copy of itself. It has arrow-key navigation, a focus trap and
  Escape to close.
- **Archive.** Search (it ignores accents and word order) and month filters.
  Each day can be expanded and has *Pin to the top*, which brings any old day
  back onto the board.
- **Guestbook.** A form that pins your note to a ruled board with a gold
  star. Footer with a second scrubber.

```tsx
import MeadowJournalTemplate from "@/components/ui/meadow-journal-template"

<MeadowJournalTemplate
  name="Nia"
  credit={{ label: "Diary of", name: "Nia Olsen" }}
  timeZone="Europe/London"
  palette="periwinkle"
  entries={[{
    id: "farm", date: "2026-10-12", place: "Glen Etive", text: "On **a little farm** today.", likes: 25400,
    image: { src: "/glen.jpg", alt: "The glen", tone: "#7f9a5a" },
    shots: [{ src: "/me.jpg", alt: "Me in a straw hat", focus: "50% 25%" }, { src: "/sheep.jpg", alt: "Sheep" }],
  }]}
  songs={[{ title: "Clover Hours", artist: "June Arbor", album: "Fieldnotes", duration: 183, cover: "/cover.jpg", src: "/clover.mp3" }]}
  onReply={(message, text) => api.reply(message.from, text)}
  onNote={(note) => api.guestbook(note)}
/>
```

## Play with it

- `demo.tsx`: Nia's diary in English, periwinkle.
- `demo-granja.tsx`: Lucía's diary, fully in Spanish (24-hour clock, `es-ES`
  dates and months, every label), in the sage palette, with its own photos.
  It reads *Le ha gustado a 25 M de personas que sigues*.

Open `?dark` before the hash in the workshop for the night theme.

## Props

| Prop | Type | Default |
|---|---|---|
| `name` / `greeting` | `string` | `"Nia"` / `"Hello,"` |
| `credit` | `{ label, name } \| null` | *Diary of Nia Olsen*, top right of the panel. |
| `locale` | `string` | `"en-US"`. Dates, months and the clock. |
| `hour12` | `boolean` | `true` |
| `timeZone` | `string` | The visitor's. |
| `entries` | `MjtEntry[]` | Four days. The board rotates through them. |
| `interval` | `number` | `8` seconds per entry. `0` stops the rotation. |
| `songs` | `MjtSong[]` | Three made-up songs. |
| `messages` | `MjtMessage[]` | Three. `[]` shows *All caught up*. |
| `photos` | `MjtPhoto[] \| null` | Twelve photos. `null` hides the wall. |
| `archive` | `MjtEntry[] \| null` | Five older days, listed together with `entries`. `null` hides the archive. |
| `profile` | `MjtProfile \| null` | Merged over the default. `null` hides the section. |
| `notes` / `guestbook` | `MjtNote[]` / `boolean` | Three notes / `true` |
| `footer` | `{ title, note, links } \| null` | *See you in the fields.* |
| `labels` | `MjtLabels` | Every string on the page. `**bold**` and `{count}`/`{name}` placeholders work where the defaults use them. |
| `palette` | `"periwinkle" \| "sage" \| "blush" \| "dusk" \| { panel, deep, olive, ink? }` | `"periwinkle"` |
| `theme` | `"system" \| "light" \| "dark"` | `"system"` follows the host's `.dark` class, then the OS. The *more* menu can switch it. |
| `fontHref` | `string \| null` | Outfit from Google Fonts, a geometric face close to the reference. `null` uses the system stack (Sofia Pro, Gilroy, Avenir Next, Manrope, Inter). |
| `stickers` | `boolean` | `true`. The draggable gold stars. |
| `onLike` | `({ kind, id, liked }) => unknown` | |
| `onReply` | `(message, text) => unknown` | Return or resolve `false`, or throw, to show an error. Without it, sending is simulated. |
| `onNote` | `(note) => unknown` | Same contract. |
| `onFollow` / `onStatus` | `(following) => unknown` / `(status) => unknown` | |
| `height` | `string` | `"100svh"`: a definite floor for the hero and the backdrop, so it survives any host layout. |
| `className` | `string` | |

Types:

- `MjtShot { src, alt?, tone?, focus? }`. `src` is any image URL; Unsplash
  URLs (`https://images.unsplash.com/photo-...`) get a responsive `srcset`
  and face-aware square crops. `tone` is the colour shown while it loads and
  if it fails. `focus` is the CSS `object-position`.
- `MjtEntry { id, date, place, text, likes, image, shots?, tag?, camera? }`.
  `date` is ISO (`"2026-10-12"`). `image` is the backdrop photo. `shots` are
  the two photo cards. Wrap words in `**` to set them in bold ink.
- `MjtPhoto` is an `MjtShot` plus `{ id, caption, category?, tags?, camera?, likes?, tall? }`.
  The categories become the filter chips.
- `MjtSong { title, artist, album, duration, cover?, src?, key? }`.
  `duration` is in seconds, `cover` is the album art, and `key` is the music
  box key (0 = C).
- `MjtMessage { from, text, time, avatar? }`, `MjtNote { name, text }` and
  `MjtProfile { fullName, handle, role, bio, location, avatar, stats, currently, links }`.

## Notes

- **Dependencies: none beyond React.** The stars and icons are SVG, and the
  music is Web Audio. Two things load from the network: the photographs from
  `images.unsplash.com` (or your own URLs) and, optionally, the Outfit face
  from Google Fonts.
- **The 21st cover.** 21st's capture sandbox blocks external origins, so it
  can't fetch the photos for a server-side cover. Publish with your own
  `--preview` (use `media/meadow-journal-template/template-cover.jpg`).
- **Loading.** The backdrop and the hero cards load eagerly; everything
  below the fold is lazy. Each slot asks Unsplash for the width it needs
  (480 to 2200 px), and avatars and album art are small square crops.
- **Sound only on a click.** The music box is created on the first press of
  play, schedules a quarter second ahead, suspends on pause and closes on
  unmount.
- **Reduced motion.** Entries don't rotate. The board's entrance, the
  drift, the doodle, the reveals and smooth scrolling are off, and the tabs
  and the scrubber jump instantly.
- **Accessibility.** There is one `h1`, and every section has an `h2`. Nav
  buttons use `aria-current`. The scrollbar, the song progress slider and the
  menu are keyboard operable. The lightbox is a modal with a focus trap.
  Every photo has alt text, and decorative ones are hidden. Small text on the
  cards meets 4.5:1 in every palette (the test checks it). The large white
  type on the panel is at least 3:1, which keeps the pastel look of the
  reference.
- **State is seeded once.** Likes, the status, the guestbook and pinned days
  start from props, then belong to the visitor. To reset them from new props,
  change the component's `key`.
- **Copy and data are placeholders.** Nia, Lucía, the songs, artists, numbers
  and notes are invented. The people in the default photos are Unsplash
  models, not Nia. Replace everything through props.
- Reference: the owner's screenshot of a periwinkle widget board over a
  meadow (`media/meadow-journal-template/reference.png`), used for feel and
  layout.
