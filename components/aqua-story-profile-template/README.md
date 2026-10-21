# Aqua Story Profile Template

A personal profile page laid out like a scrapbooked Instagram story: aqua glass
over a blurred photo of the story you're on, white-rimmed frames, small caps
labels, a hand-lettered script and die-cut photo stickers. Use it as a link-in-bio, a creator
or "close friends" page, or a personal site with some personality.

The top of the page is a working story player. Below it, friends leave notes
and reviews, watch highlights, play a quiz, and decorate the page.

The default profile is Leyla, a (made-up) Baku local: every story is from one
real photo shoot on the Baku seafront, the highlights are the city's boulevard,
old city, cafés and the Caspian, and every picture on the page, stickers
included, is a real Unsplash photo.

```tsx
import AquaStoryProfileTemplate from "@/components/ui/aqua-story-profile-template"

<AquaStoryProfileTemplate
  profile={{ name: "Yuna Han", handle: "yunaa.blue", avatar: "/me.jpg", url: "https://instagram.com/yunaa.blue" }}
  stories={[{ image: "/roll-12/01.jpg", caption: "blue hour, cold americano", date: "19 July 2026", location: "Mangwon, Seoul" }]}
  palette="aqua"
  onNote={(text) => fetch("/api/notes", { method: "POST", body: text })}
  onReview={(review) => fetch("/api/reviews", { method: "POST", body: JSON.stringify(review) })}
/>
```

**No dependencies beyond React.** The script lettering is drawn from glyph
outlines embedded in the file (Allura by Robert Leuschke, SIL Open Font
License), so no web font loads. Only the UI icons are SVG. The type is the
system stack, or Inter if it's installed.

## Play with it

| Do this | And |
|---|---|
| Wait | The progress pill fills, then the photo, the glass caption card, the date, the location and the blurred backdrop all move to the next story. It holds while you hover the photo or card, type a note, open anything, or switch tabs |
| Tap either side of the photo, pick a segment, or press ← → | Steps through the stories |
| Click the small frame in the glass card | It's the story *up next*. Clicking it skips ahead |
| `••` / the pin | Pause and play the stories / show where this one was taken |
| Type in the white card and press Enter | The note floats up off the card and you get a "sent" toast (`onNote`) |
| *Account decorate* on the ribbon | Opens a tray of die-cut photo stickers (hibiscus, iced latte, the sea in a heart, a shell, a film camera, the Flame Towers) and printed labels. Drag them anywhere on the page, or press one to drop it. In decorate mode you can drag placed stickers, double-click or press Delete to remove one, use the arrow keys to nudge and R to rotate. They're saved per handle in localStorage |
| A highlight circle | Opens a full story viewer: tap to step, hold to pause, ← → / Space / Escape, and a reply field |
| The hearts beside *Exchange reviews* | Each tap adds a heart, floats a few up, and bumps the counter (`onLike`) |
| `+` on the card, or *write one* on the wall | A composer: name, review, hearts and how you know them. It validates, can be refused by `onReview`, then pins the review to the front of the wall |
| The Instagram pill or the tilted sticker | Copies the link / the handle |
| *Play with me !* | A how-well-do-you-know-me quiz with a score, a rank in script, *play again* and *leave a review* |

## Props

| Prop | Default | Description |
|---|---|---|
| `profile` | Yuna Han, @yunaa.blue | `{ name, handle, avatar?, tagline?, bio?, url? }`. `tagline` is the caps line beside the avatar; `bio` shows in the glass card when a story has no caption. |
| `stories` | 4 summer stories | `{ image, alt?, caption?, date?, location? }[]`. `date` like `"07 July 2026"`: the day and month go on the first line, the year on the second. |
| `note` | `{}` | `{ placeholder?, sent? }`. `sent` is the toast text. `null` hides the white card. |
| `ribbon` | `{}` | `{ date?, credit?, credit2?, action? }`. The date follows the current story unless you set it. `credit2` also labels the vertical captions on wide screens. `null` hides it, and with it decorate mode. |
| `highlights` | 5 highlights | `{ title?, eyebrow?, items? }`. Each item is `{ label, cover?, slides }`. `null` hides them. |
| `exchange` | *Exchange reviews* card | `{ title?, image?, text?, tab?, link?: { label?, url?, avatar? }, sticker?, footCenter?, footRight? }`. `null` hides it. |
| `reviews` | 5 reviews | `{ title?, eyebrow?, write?, items? }`. Each item is `{ name, handle?, avatar?, photo?, text, hearts?, tag?, date? }`; `photo` is a memory taped to the top of the card. `null` hides the wall. |
| `quiz` | 5 questions | `{ button?, title?, questions? }`. Each question is `{ q, options, answer }`, where `answer` is the index of the right option. `null` hides it. |
| `likes` | `248` | Starting heart count. |
| `stickers` | 6 photo stickers, 3 labels | The decorate tray: `{ id, label, image?, shape?, text? }[]`. With `image`, the photo is die-cut to `shape` (`"circle"`, `"heart"`, `"scallop"`, `"square"`) with a white vinyl rim; without it, `text` prints as a label. |
| `decorations` | `[]` | Stickers already on the page: `{ kind, x, y, rotate?, size? }`, where `kind` is a sticker `id`. `x` is a fraction of the page width, `y` is pixels from the top. |
| `persistDecorations` | `true` | Saves placed stickers in localStorage under `asp-stickers:<handle>`. |
| `palette` | `"aqua"` | `"aqua"`, `"blush"`, `"matcha"`, `"midnight"`, or any subset of the tokens laid over aqua: `sky`, `mist`, `deep`, `glass`, `glassEdge`, `ink`, `paper`, `paperInk`, `paperMuted`, `field`, `accent`, `wash`. Any CSS colour. |
| `tint` | `0.2` | 0–1: how strongly photos are graded toward the palette, so mixed photos sit together. |
| `storyDuration` | `6000` | Milliseconds per story. Highlights run a second shorter. |
| `height` | `"100svh"` | Minimum height of the story header on screens wider than 700px. Phones stack from the top. |
| `onNote` | — | `(text, context)`, called for notes and highlight replies. `context` is `"story 2"` or `"highlight film"`. Return (or resolve to) `false`, or throw, to show an error. |
| `onReview` | — | `(review)`. Return `false`, or throw, to refuse it. Without it, the composer fakes a short send. |
| `onLike` | — | `(count)` after each heart. |
| `onDecorate` | — | `(stickers)` whenever stickers change. |

## Notes

- **Photos.** Every image is a prop. Each one fades in over a blurred 40px copy
  of itself (for Unsplash URLs, the same crop at `w=40`), so frames never flash
  empty. If a photo can't load, the frame falls back to the palette's gradient.
  The 21st capture sandbox blocks off-site images, so publish with your own
  `--preview`.
- Story changes layer rather than cross-fade: the outgoing photo stays solid
  while the next fades in over it, so faces never double-expose.
- The composition is sized in container units (`cqw`), so the story header
  scales like a poster at any width. Under 520px the glass card grows and the
  exchange card drops its side copy.
- Script titles draw letters, spaces and `. , ! ? ' & -`. A title with anything
  else, like digits, accents or emoji, falls back to a cursive font stack
  instead of dropping characters.
- The page keeps its own colours in both host themes: it's a brand page, not a
  themed widget. Colours are CSS variables on the root, so `palette` reaches
  every part.
- The backdrop is `position: sticky` with a definite `100svh` height, and the
  root clips sideways with `overflow-x: clip`, not `overflow: hidden`, which
  would break it.
- Under `prefers-reduced-motion`, stories don't auto-advance, script appears
  without inking on, hearts don't float, and the stickers and dialogs appear
  without movement.
- The names, handles, places and reviews in the defaults are made up; the people are Unsplash models.

## Photo credits

All photos are from [Unsplash](https://unsplash.com) under the Unsplash License.

| Used as | Photo |
|---|---|
| Story 1 | [Woman poses against a cityscape backdrop](https://unsplash.com/photos/woman-poses-against-a-cityscape-backdrop-t1bp5uqzYYA) |
| Story 2 | [Woman leans against a railing, gazing at the sea](https://unsplash.com/photos/woman-leans-against-a-railing-gazing-at-the-sea-VeV_hb74O5I) |
| Story 3 | [Woman smiles with a cityscape backdrop](https://unsplash.com/photos/woman-smiles-with-a-cityscape-backdrop-umgYfBNPwmM) |
| Story 4 | [Woman stands near the sea on a sunny day](https://unsplash.com/photos/woman-stands-near-the-sea-on-a-sunny-day-dZ3-Mz4DPpE) |
| Profile avatar | [Woman smiling at the camera, water background](https://unsplash.com/photos/woman-smiling-at-the-camera-water-background-GF-96F4XQcc) |
| Instagram pill avatar | [A woman smiles at something in the distance](https://unsplash.com/photos/a-woman-smiles-at-something-in-the-distance-cV6GJr8brIU) |
| Highlight: boulevard | [Woman looks at a skyline leaning on a railing](https://unsplash.com/photos/woman-looks-at-a-skyline-leaning-on-a-railing-oFYM63_dKdA) |
| Exchange card | [a woman standing in front of a tree holding a camera](https://unsplash.com/photos/a-woman-standing-in-front-of-a-tree-holding-a-camera-aVTsGcf-mC0) |
| Highlight: boulevard | [Baku cityscape with flame towers reflecting in calm water](https://unsplash.com/photos/baku-cityscape-with-flame-towers-reflecting-in-calm-water-d9TSCL2pLtE) |
| Highlight: boulevard | [Modern city skyline with distinctive towers reflecting in calm water](https://unsplash.com/photos/modern-city-skyline-with-distinctive-towers-reflecting-in-calm-water-YaLwoztpFLU) |
| Highlight: old city | [people walking on street near buildings during daytime](https://unsplash.com/photos/people-walking-on-street-near-buildings-during-daytime-i24-NCD5yvA) |
| Highlight: old city | [a row of buildings on a city street](https://unsplash.com/photos/a-row-of-buildings-on-a-city-street-BYZhvzyNOMY) |
| Highlight: old city | [brown brick building near green trees during daytime](https://unsplash.com/photos/brown-brick-building-near-green-trees-during-daytime-acTY8dhbRJ8) |
| Highlight: film; review photo | [Hand holding a vintage yashica camera](https://unsplash.com/photos/hand-holding-a-vintage-yashica-camera-QpkvxElLJ78) |
| Highlight: film | [black and gray Canon AE-1 camera on gray sand under brown dock near body of water at daytime](https://unsplash.com/photos/black-and-gray-canon-ae-1-camera-on-gray-sand-under-brown-dock-near-body-of-water-at-daytime-vasU4-TlC5I) |
| Highlight: café | [Iced coffee with milk and ice in a glass](https://unsplash.com/photos/iced-coffee-with-milk-and-ice-in-a-glass-nIZl9PuwMXk) |
| Highlight: café; review photo | [Iced coffee with cream and ice on a table](https://unsplash.com/photos/iced-coffee-with-cream-and-ice-on-a-table-KDFB3AvmdXQ) |
| Highlight: sea; review photo | [a beach filled with lots of white umbrellas next to the ocean](https://unsplash.com/photos/a-beach-filled-with-lots-of-white-umbrellas-next-to-the-ocean-flt64VLlxvY) |
| Highlight: sea | [a large body of water with a boat in the distance](https://unsplash.com/photos/a-large-body-of-water-with-a-boat-in-the-distance-3WwKLHJVmJo) |
| Highlight: sea; sticker | [a boat is out in the distance on the ocean](https://unsplash.com/photos/a-boat-is-out-in-the-distance-on-the-ocean-Xlc9uIxwCGo) |
| Review: Aysel | [A young woman smiles with her hand in her hair](https://unsplash.com/photos/a-young-woman-smiles-with-her-hand-in-her-hair-HKcE2gqov4Y) |
| Review: Rauf | [Young man with beard smiling, hands in pockets](https://unsplash.com/photos/young-man-with-beard-smiling-hands-in-pockets-tE_l_mh0KM8) |
| Review: Mina | [a woman with her hand on her head](https://unsplash.com/photos/a-woman-with-her-hand-on-her-head-4ZBng8sJmhw) |
| Review: Elvin | [A smiling man with arms outstretched outdoors](https://unsplash.com/photos/a-smiling-man-with-arms-outstretched-outdoors--_EkQO6HTMw) |
| Review: Nigar | [A woman with long hair is smiling for the camera](https://unsplash.com/photos/a-woman-with-long-hair-is-smiling-for-the-camera-LasKG3AhUu8) |
| Sticker: hibiscus | [A single pink hibiscus flower surrounded by green leaves](https://unsplash.com/photos/a-single-pink-hibiscus-flower-surrounded-by-green-leaves-wnXY7cd3ClQ) |
| Sticker: iced latte | [a glass filled with ice cream and a drink](https://unsplash.com/photos/a-glass-filled-with-ice-cream-and-a-drink-AM5WbYLL3E4) |
| Sticker: shell | [white and brown seashell on brown sand during daytime](https://unsplash.com/photos/white-and-brown-seashell-on-brown-sand-during-daytime-t1Lr0BPQfKg) |
| Sticker: camera | [silver and black Kodak DSLR camera](https://unsplash.com/photos/silver-and-black-kodak-dslr-camera-VLGWE_SumrA) |
| Sticker: flame towers | [white high rise building near green trees under blue sky during daytime](https://unsplash.com/photos/white-high-rise-building-near-green-trees-under-blue-sky-during-daytime-U5JxAhddBCs) |
| Custom demo story | [A woman standing next to a body of water](https://unsplash.com/photos/a-woman-standing-next-to-a-body-of-water-U1BRLNyGkfg) |
| Custom demo story, avatar | [A woman with long black hair and a white shirt](https://unsplash.com/photos/a-woman-with-long-black-hair-and-a-white-shirt-f_LU-MxMl88) |
| Custom demo story | [A woman in a white shirt and blue jeans](https://unsplash.com/photos/a-woman-in-a-white-shirt-and-blue-jeans--XDNySVPuh4) |
| Custom demo pill avatar | [A woman with long black hair standing in front of rocks](https://unsplash.com/photos/a-woman-with-long-black-hair-standing-in-front-of-rocks-2P_mFm3EPZs) |
| Custom demo exchange card | [a woman holding a camera in her hands](https://unsplash.com/photos/a-woman-holding-a-camera-in-her-hands-Z6GRLEA8Tk4) |
| Custom demo highlight | [pink hibiscus in bloom during daytime](https://unsplash.com/photos/pink-hibiscus-in-bloom-during-daytime-p4bqtPteEp4) |
