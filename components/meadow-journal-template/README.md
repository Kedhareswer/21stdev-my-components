# Meadow Journal Template

A personal diary site for someone who lives outdoors: a farm-sitter, a film
photographer, a slow traveller. One frosted board floats over a painted farm
landscape, built from widgets like a phone home screen. The rest of the page
uses the same pieces: periwinkle panels, olive and bark-dark cards, gold
sticker stars and a pill scrubber.

**Every picture is painted in the file.** Each one is drawn on canvas from a
seed: rolling meadows with sheep and a weathered fence, a ridge with a lone
tree, red island cliffs over the sea, lavender rows, a red barn and a still
lake. Each scene comes in three moods: day, golden hour and night. Night mode
paints the sky and the hero photos at night (moon, stars, fireflies, a lit
barn window). Pass `image` anywhere to use your own photos instead.

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
    screen. You can also swipe it on touch. Each entry crossfades the sky
    behind the whole page and the two photo cards.
  - *Liked by 25.4 K people you follow*, which you can click to like the
    entry.
  - **Photo cards.** A hand-drawn doodle draws itself over the first one. It
    also has a removable tag and *Taken by Canon AE-1*. The second links
    *From the Archive* and has a like button with a burst. Click either photo
    to open it in the lightbox.
  - **On repeat.** A music card that really plays: a small music box,
    synthesised live with Web Audio. Each song's tune is made from its title,
    in its own key. It has prev and next buttons, a seekable progress line,
    an equaliser and elapsed time. Pass `src` to play a real file.
  - **New messages.** It shows the unread count. *Reply* opens a text field
    in place, and after you send, the card moves on to the next message
    until you're all caught up.
  - **Gold stars.** Drag them anywhere, or click one to spin it.
  - **The pill under the board** is the page's scrollbar. Drag the thumb,
    click the track, or focus it and use the arrow keys, Page Up/Down,
    Home and End.
- **The dock.** When the board scrolls away, a compact pill drops in with
  the avatar, the nav, the clock and a progress line.
- **About me.** Bio, follow and message buttons, stats that count up, a
  *Currently* card, and a postcard of today's scene with a dated stamp.
- **Photos.** A masonry wall with filter chips and like buttons. The
  lightbox has arrow-key navigation, a focus trap and Escape to close.
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
  timeZone="America/Toronto"
  palette="periwinkle"
  entries={[{ id: "farm", date: "2026-10-12", place: "Kawartha Lakes", text: "On **a little farm** today.", likes: 25400, scene: "meadow", shots: [{ image: "/me-1.jpg" }, { image: "/me-2.jpg" }] }]}
  songs={[{ title: "Clover Hours", artist: "June Arbor", album: "Fieldnotes", duration: 183, src: "/clover.mp3" }]}
  onReply={(message, text) => api.reply(message.from, text)}
  onNote={(note) => api.guestbook(note)}
/>
```

## Play with it

- `demo.tsx`: Nia's diary in English, periwinkle.
- `demo-granja.tsx`: Lucía's diary, fully in Spanish (24-hour clock, `es-ES`
  dates and months, every label), in the sage palette. It reads
  *Le ha gustado a 25 M de personas que sigues*.

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
| `photos` | `MjtPhoto[] \| null` | Nine painted frames. `null` hides the wall. |
| `archive` | `MjtEntry[] \| null` | Five older days, listed together with `entries`. `null` hides the archive. |
| `profile` | `MjtProfile \| null` | Merged over the default. `null` hides the section. |
| `notes` / `guestbook` | `MjtNote[]` / `boolean` | Three notes / `true` |
| `footer` | `{ title, note, links } \| null` | *See you in the fields.* |
| `labels` | `MjtLabels` | Every string on the page. `**bold**` and `{count}`/`{name}` placeholders work where the defaults use them. |
| `palette` | `"periwinkle" \| "sage" \| "blush" \| "dusk" \| { panel, deep, olive, ink? }` | `"periwinkle"` |
| `theme` | `"system" \| "light" \| "dark"` | `"system"` follows the host's `.dark` class, then the OS. The *more* menu can switch it. |
| `stickers` | `boolean` | `true`. The draggable gold stars. |
| `onLike` | `({ kind, id, liked }) => unknown` | |
| `onReply` | `(message, text) => unknown` | Return or resolve `false`, or throw, to show an error. Without it, sending is simulated. |
| `onNote` | `(note) => unknown` | Same contract. |
| `onFollow` / `onStatus` | `(following) => unknown` / `(status) => unknown` | |
| `height` | `string` | `"100svh"`: a definite floor for the hero and the sky, so it survives any host layout. |
| `className` | `string` | |

Types:

- `MjtShot { scene?, mood?, seed?, image?, alt? }`. `scene` is one of
  `meadow`, `ridge`, `coast`, `lavender`, `barn` or `lake`. `mood` is `day`,
  `golden` or `night`. `seed` grows different hills, clouds and sheep.
  `image` is your own photo.
- `MjtEntry { id, date, place, text, likes, scene?, mood?, image?, shots?, tag?, camera? }`.
  `date` is ISO (`"2026-10-12"`). `shots` are the two photo cards. Wrap words
  in `**` to set them in bold ink.
- `MjtPhoto` is an `MjtShot` plus `{ id, caption, category?, tags?, camera?, likes?, tall? }`.
  The categories become the filter chips.
- `MjtSong { title, artist, album, duration, src?, key? }`. `duration` is in
  seconds. `key` is the music box key (0 = C).
- `MjtMessage { from, text, time }`, `MjtNote { name, text }` and
  `MjtProfile { fullName, handle, role, bio, location, avatar, stats, currently, links }`.

## Notes

- **No dependencies, nothing loaded.** It uses only React. The scenes are
  canvas, the stars and icons are SVG, and the music is Web Audio. The type
  is the system stack (Sofia Pro, Gilroy, Avenir Next or Manrope when
  installed, then Inter and the system sans). There are no URLs, so it
  renders in 21st's capture sandbox. `image` and `src` are the only ways to
  add a remote asset.
- **Painting is cheap.** Each canvas paints once, when it comes near the
  screen, at a capped pixel budget, and repaints only when its size changes
  by more than 8%. Paints are queued so the page never stalls mid-scroll. A
  film grain is added to everything but the largest canvases. The sky is one
  sticky canvas behind the page with a slow drift, and it fades to a wash as
  you scroll.
- **Sound only on a click.** The music box is created on the first press of
  play, schedules a quarter second ahead, suspends on pause and closes on
  unmount.
- **Reduced motion.** Entries don't rotate, and the drift, the doodle, the
  reveals and the smooth scrolling are off. The tabs and the scrubber jump
  instantly.
- **Accessibility.** There is one `h1`, and every section has an `h2`. Nav
  buttons use `aria-current`. The scrollbar, the song progress slider and the
  menu are keyboard operable. The lightbox is a modal with a focus trap.
  Every painted picture has an `aria-label`, and the decorative ones are
  hidden. Small text on the cards meets 4.5:1 in every palette (the test
  checks it). The large white type on the panel is at least 3:1, which keeps
  the pastel look of the reference.
- **State is seeded once.** Likes, the status, the guestbook and pinned days
  start from props, then belong to the visitor. To reset them from new props,
  change the component's `key`.
- **Copy and data are placeholders.** Nia, Lucía, the songs, artists, places,
  numbers and notes are invented. Replace them through props.
- Reference: the owner's screenshot of a periwinkle widget board over a
  meadow (`media/meadow-journal-template/reference.png`). It was used for
  feel and layout. The photos of a person are replaced with painted scenes,
  because image hosts were unreachable from the build environment and a
  painted world needs no licence.
