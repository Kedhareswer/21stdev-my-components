# Frosted Folder Lookbook

A translucent plastic document folder lying on a dark table, seen from above, with pages and a stack of prints inside. It turns toward the pointer, a sheen crosses the plastic, and the paper clip, the binder clip and the chrome wordmark catch the light as it moves. Hovering lifts the prints a little out of the top. Opening it pulls the binder clip off and sets it aside, swings the cover round its spine until it lands on the table, and slides the prints out one after another. Closing sends the prints home, shuts the cover and puts the clip back on.

```tsx
import { FrostedFolderLookbook } from "@/components/ui/frosted-folder-lookbook"

<FrostedFolderLookbook
  title="File 02"
  subtitle="Autumn outerwear"
  line="Showroom · 2027"
  wordmark="Atlas"
  sheets={[{ image: "/looks/01.jpg", code: "Look 01", title: "Wool Coat", detail: "Charcoal melton" }]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `title` | `"File 01"` | Cover title, set in spaced capitals |
| `subtitle`, `line` | lookbook line, archive and year | The two small lines under the title |
| `footer` | `"Handle with care"` | Small line at the bottom-left of the cover |
| `wordmark` | `"Folio"` | Liquid chrome wordmark at the bottom-right. Keep it to one short word |
| `sheets` | four looks | The prints: `{ image, alt?, code?, title, detail? }[]`; the first four are used |
| `openLabel` / `closeLabel` | `"Open file"` / `"Close file"` | The button under the folder |
| `tint`, `paper`, `background` | teal, cool white, near-black | Plastic, print and stage colours |
| `defaultOpen` | `false` | |
| `onOpenChange` | | Called with the new state |
| `height` | `"100svh"` | Any definite length |

## Behaviour

- Click or tap the folder, or use the button under it. Escape closes it from anywhere. The button carries `aria-expanded`, and the prints are hidden from assistive tech while the folder is shut.
- The cover is real frosted plastic: a `backdrop-filter` blur over what is inside, so the prints show through it softly and the page edges peek out at the top, right and bottom.
- Nothing runs on a timer. The cover, the clip, each print, the tilt and the hover lift are damped springs, and the order comes from conditions: the cover waits for the clip to come off, each print waits for the one above it to get going, and on the way back the cover waits until every print is home. Clicking again mid-motion simply turns everything round from where it is.
- It behaves like things on a table. Prints keep one size, inside the folder and out. The cover only swings on its spine, lands with a small bounce and cannot pass through the table. The clip slides to a resting place and stays there while the folder moves. The view keeps the folder centred as the cover unfolds.
- The printed face of the cover and the drawing order of the prints change only while the cover is edge-on at 90 degrees, where neither shows.
- On stages narrower than 700 px the opened cover hangs off the left edge of the stage, the clip rests under the folder, and the prints sit in a 2 x 2 grid.
- Tilt, sheen and lift follow a mouse only. With `prefers-reduced-motion` there is no tilt or lift, and the folder opens and closes in one step.

## Your own prints

Use portrait photos of about 2:3 with the subject centred; each is cropped to fill the photo area of its print. Photos that share a backdrop and a grade read best through the plastic. Keep `title` and `detail` short enough for one line on a 165 px print.

No dependencies beyond React. The default photos are hosted on kedhar-components.pages.dev and were generated in ChatGPT.
