# Aqua Story Profile Template

A personal profile page laid out like a scrapbooked Instagram story: aqua glass
over a blurred street photo, white-rimmed frames, small caps labels, a
hand-lettered script and die-cut stickers. Use it as a link-in-bio, a creator
or "close friends" page, or a personal site with some personality.

The top of the page is a working story player. Below it, friends leave notes
and reviews, watch highlights, play a quiz, and decorate the page.

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
License), so no web font loads. The stickers, the hibiscus, the icons and the
photo fallbacks are SVG drawn in the file. The type is the system stack, or
Inter if it's installed.

## Play with it

| Do this | And |
|---|---|
| Wait | The progress pill fills, then the photo, the glass caption card, the date, the location and the blurred backdrop all move to the next story. It holds while you hover the photo or card, type a note, open anything, or switch tabs |
| Tap either side of the photo, pick a segment, or press ← → | Steps through the stories |
| Click the small frame in the glass card | It's the story *up next*. Clicking it skips ahead |
| `••` / the pin | Pause and play the stories / show where this one was taken |
| Type in the white card and press Enter | The note floats up off the card and you get a "sent" toast (`onNote`) |
| *Account decorate* on the ribbon | Opens a sticker tray. Drag stickers anywhere on the page, or press one to drop it. In decorate mode you can drag placed stickers, double-click or press Delete to remove one, use the arrow keys to nudge and R to rotate. They're saved per handle in localStorage |
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
| `reviews` | 5 reviews | `{ title?, eyebrow?, write?, items? }`. Each item is `{ name, handle?, avatar?, text, hearts?, tag?, date? }`. `null` hides the wall. |
| `quiz` | 5 questions | `{ button?, title?, questions? }`. Each question is `{ q, options, answer }`, where `answer` is the index of the right option. `null` hides it. |
| `likes` | `248` | Starting heart count. |
| `decorations` | `[]` | Stickers already on the page: `{ kind, x, y, rotate?, size? }`. `x` is a fraction of the page width, `y` is pixels from the top. Kinds: `hibiscus`, `heart`, `sparkle`, `bow`, `cloud`, `butterfly`, `film`, `tape`. |
| `persistDecorations` | `true` | Saves placed stickers in localStorage under `asp-stickers:<handle>`. |
| `palette` | `"aqua"` | `"aqua"`, `"blush"`, `"matcha"`, `"midnight"`, or any subset of the tokens laid over aqua: `sky`, `mist`, `deep`, `glass`, `glassEdge`, `ink`, `paper`, `paperInk`, `paperMuted`, `field`, `accent`, `wash`. Any CSS colour. |
| `tint` | `0.35` | 0–1: how strongly photos are graded toward the palette, so mixed photos sit together. |
| `storyDuration` | `6000` | Milliseconds per story. Highlights run a second shorter. |
| `height` | `"100svh"` | Minimum height of the story header on screens wider than 700px. Phones stack from the top. |
| `onNote` | — | `(text, context)`, called for notes and highlight replies. `context` is `"story 2"` or `"highlight film"`. Return (or resolve to) `false`, or throw, to show an error. |
| `onReview` | — | `(review)`. Return `false`, or throw, to refuse it. Without it, the composer fakes a short send. |
| `onLike` | — | `(count)` after each heart. |
| `onDecorate` | — | `(stickers)` whenever stickers change. |

## Notes

- **Photos.** Every image is a prop. The defaults are Unsplash photos
  (`images.unsplash.com`, Unsplash License), chosen for their light and colour
  more than for any one subject. Swap in your own. Each frame paints an aqua
  film still underneath (a street with a crosswalk, a garden, or the sea), so a
  slow, blocked or missing photo still leaves a finished frame. That's also
  what renders in the 21st capture sandbox, which blocks off-site images, so
  publish with your own `--preview`.
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
- Every person, handle and review in the defaults is made up.
