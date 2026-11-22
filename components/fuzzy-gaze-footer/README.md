# Fuzzy Gaze Footer

A full-screen footer with one huge fuzzy creature rising from the bottom edge. Its
heavy-lidded eyes follow your cursor, blink, and wander when nothing moves. Two link
columns sit on each side of a script wordmark, and an email line in fat capitals sits on
the creature's belly. Hover the wordmark and it dissolves into grainy mist, hangs there,
then re-forms.

```tsx
import FuzzyGazeFooter from "@/components/ui/fuzzy-gaze-footer"

<FuzzyGazeFooter />

// Your own name, links and address
<FuzzyGazeFooter
  wordmark="Fernhouse"
  email="hello@example.com"
  columns={[
    { title: "Shop", links: [{ label: "Plants", href: "/plants" }, { label: "Pots", href: "/pots" }] },
    { title: "Learn", links: [{ label: "Care guides", href: "/care" }] },
    { title: "Company", links: [{ label: "About", href: "/about" }] },
    { title: "Help", links: [{ label: "Contact", href: "/contact" }] },
  ]}
/>
```

Put it at the end of a page. It fills one screen (`height`, default `100svh`) and grows if
its links need more room.

**Dependencies:** none beyond React and Tailwind. The three fonts are embedded as subsets
(about 27 kB in all): a fat display face for the column heads and email (capitals, figures
and punctuation only, so those two are always set in capitals), a brush script for the
wordmark, and a medium grotesque for the links. The creature is one picture, loaded from
`kedhar-components.pages.dev`; pass `image` and `imageSmall` to host it yourself.

**Colour:** the footer is a periwinkle panel in both light and dark themes, because the
picture has that colour baked in. White link text on it is about 2.5:1, as in the design
this follows; the links brighten and underline on hover and focus. Raise the contrast with
a darker `background` only if you also supply a picture on that colour.

## Props

| Prop | Default | Description |
|---|---|---|
| `wordmark` | `"Wooly"` | Script word at the top centre. Hover or focus mists it. |
| `wordmarkHref` | `"#"` | Where the wordmark links |
| `columns` | four columns of four links | `{ title, links: { label, href }[] }[]`. The first half sits left of the wordmark, the rest right of it. |
| `email` | `"hello@example.com"` | Shown in capitals on the creature, and used for the `mailto:` link |
| `image` | the hosted creature, 1536 × 1024 | The creature with its eyes shut, 3:2, on a flat background |
| `imageSmall` | the same picture at 960 × 640 | Used on narrow screens. Pass `""` to always load `image`. |
| `eyes` | the two eyes of the default picture | `{ x, y, r }[]`: centre and radius of each shut eye as fractions of the picture (`x` and `r` of its width, `y` of its height) |
| `crown` | `0.161` | Where the top of the head is, as a fraction of the picture's height |
| `background` | `"#90acf7"` | Footer colour. It must match the picture's own background. |
| `height` | `"100svh"` | Minimum height. A definite length, never a percentage. |
| `className` / `style` | — | Passed to the root `<footer>` |

## How it works

1. **The eyes are the picture.** The creature is rendered with its eyes shut: two felt
   balls. An open eye is a white ball and a pupil drawn exactly over each felt ball and
   clipped below a curved lid line, so the upper lid you see is the picture itself. A blink
   moves the clip line past the bottom of the eye and the felt ball is simply uncovered. A
   thin lighter rim and a soft shadow follow the lid line.
2. **Gaze.** Each eye turns toward the pointer on its own. The pull is `1 - e^(-distance /
   (1.4 × eye width))`, so nearby movement is subtle and far corners get a full look. The
   eased value (time constant 110 ms) turns the pupil up to 52° round the ball: it slides to
   0.68 of the eye's radius and flattens to 62 % along the gaze, as a disc on a sphere
   would. Looking up travels a tenth as far, so the pupil tucks under the lid as a
   half-moon and never disappears. The lid opens to 38 % looking down and rests at 47 %.
3. **Blink and wander.** A blink takes 270 ms (80 down, 40 shut, 150 up) every 2.4–6.2 s.
   After 2.6 s without pointer movement the eyes pick a new spot around the face every
   1.3–3.5 s. Touch input counts as pointer movement.
4. **Mist.** The wordmark gets an SVG filter only while it is misting: a low-frequency
   noise displaces the letters by up to 24 px, a blur turns them to cloud, and a fine noise
   eats the cloud into grain, at half opacity. It takes 0.5 s to dissolve, holds for 1.3 s after the last
   hover, and re-forms in 0.6 s. At rest the word is plain text with no filter.
5. **Layout.** The picture is hung from the top of the creature's head, 26 % down the
   footer, centred on the midpoint of the eyes, and as wide as the footer. On short
   screens it shrinks so the eyes always clear the email. Under 960 px the wordmark goes
   on top and the four columns sit in a row; under 600 px they become two rows of two.
   The art is sized in container units, so the footer works in any column width.

Under `prefers-reduced-motion` the eyes hold a still half-lidded look, nothing blinks or
wanders, and the wordmark does not mist.
