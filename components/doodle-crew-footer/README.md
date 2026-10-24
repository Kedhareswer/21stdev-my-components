# Doodle Crew Footer

A site footer drawn like the last page of a sketchbook. Your brand's name is
stamped across it in giant dry-brush ink, and a crew of hand-drawn characters
lives on the letters: a yeti leans on the first one, a kid sits on top with its
legs dangling, a ghost peeks over an edge, a pirate cat curls up in a notch.
Little ink doodles (flames, sandwiches, stars, hearts) drift down around them.
Link columns, a tagline, two pill buttons and a bottom bar complete it.

## The storyboard

When the footer scrolls into view it plays once, in about three seconds:

1. The ground line draws itself left to right; grass and pebbles fade in.
2. The letters stamp down one by one, overshooting and squashing, with a puff of ink at each base.
3. The crew arrives: standing characters spring up, sitters plop down and bounce, peekers rise from behind their letter.
4. The doodles start to fall, then the tagline rises word by word and the buttons pop in.

## Interaction

- **Eyes follow the pointer.** Every character watches it, and blinks. With no pointer they glance around and at each other.
- **Click a character** (or Tab to it and press Enter) and it hops and says its line in a speech bubble.
- **Hover a letter** and it wobbles.
- **Doodles** scatter away from the pointer. Tap one to pop it; it comes back from the top.
- **The lines boil.** The crew is redrawn through three hand-drawn takes at 8 fps, like cel animation.
- Buttons press down like stickers; links get a drawn squiggle underline.

**No dependencies.** React is the only import. Every drawing is inline SVG, the ink texture is an SVG filter, and nothing is fetched.

```tsx
import DoodleCrewFooter from "@/components/ui/doodle-crew-footer"

<DoodleCrewFooter />

<DoodleCrewFooter
  preset="sunny"
  wordmark="PICNIC"
  brand="picnic club"
  tagline="Lunch, but make it an adventure."
  crew={[
    { kind: "cat", letter: 0, seat: "front", offset: -0.36, says: "I only eat the fancy tuna." },
    { kind: "kid", letter: 4, seat: "top", says: "Window seat!" },
    { kind: "ghost", letter: 3, seat: "behind", says: "I'm here for the cheese." },
  ]}
  doodles={["sandwich", "heart", "star"]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `wordmark` | `"MISCHIEF"` | The giant word. Set in upper case; 4–9 letters reads best. |
| `brand` / `blurb` | `"mischief"` / a line | Top left. |
| `tagline` | `"A hand-drawn world for the troublemaker in all of us."` | Under the wordmark. |
| `columns` | Play · Shop · Community · Studio | `{ title, links: { label, href? }[] }[]` |
| `actions` | two pills | `{ label, href?, onClick?, icon?, variant?: "solid" \| "outline" }[]`. `icon` is any doodle kind. |
| `copyright` / `legal` / `socials` | sample links | Bottom bar. |
| `backToTop` | `true` | Scrolls the window to the top. |
| `crew` | six characters | `{ kind, letter, seat?, offset?, scale?, flip?, name?, says? }[]` (see below). |
| `doodles` | flames, snacks, stars… | Which kinds drift. `[]` turns them off. |
| `doodleCount` | `12` | How many at once (max 40). |
| `preset` | `"auto"` | `auto` (follows `--color-background` / `--color-foreground`, so dark mode works) · `paper` · `night` · `riso` · `sunny` |
| `palette` | — | `{ background, ink, accent }` overrides. `accent` colours the party hat, the scarf, the solid button's shadow and the link squiggle. |
| `fontFamily` | Arial Black → Inter → Helvetica | Wordmark face. Heavy grotesks stamp best. |
| `serifFamily` | Iowan → Palatino → Georgia | Tagline and blurb. |
| `tracking` | `-0.02` | Wordmark letter spacing, em. |
| `interactive` | `true` | Pointer, hover, click and pop. |
| `height` | `760px` | Minimum height, a definite length. The footer grows if its content needs more. |

### The crew

| `kind` | Default seat | |
|---|---|---|
| `yeti` | `front` | Big horned friend with a backpack. Good at either end of the word. |
| `kid` | `top` | Bucket hat, striped shirt, legs dangling down the letter. Best on a flat top (H, E, F, T, M). |
| `bird` | `top` | Small, wears a party hat, pecks now and then. Fits on an I. |
| `cat` | `front` | Eye patch and scarf; tail swishes. Sits nicely in the notch of an F or E. |
| `ghost` | `behind` | Peeks over the top edge, hands on the letter, bobbing. |
| `mushroom` | `front` | Tiny, sways. |

`letter` is the index into the wordmark. `seat` is `front`, `top` or `behind`. `offset` slides the character along the letter in letter widths (`-0.5` is its left edge). `scale` sizes it against the letters, `flip` mirrors it, and `says` is its speech-bubble line (also its accessible label, with `name`).

## Notes

- **Late web fonts.** The word is measured with the real face once it lands, so the crew stays seated.
- **Accessibility.** The wordmark is in the page as a heading. Characters are focusable buttons labelled with their name and line, and bubbles are announced. Doodles are decorative and hidden from screen readers. Every link is a real anchor.
- **Reduced motion.** Everything shows in its finished place: no storyboard, no boil, no drift, no blinking or hopping animation.
- **Performance.** One animation loop drives the eyes, doodles and boil, and it sleeps while the footer is off-screen or the tab is hidden.
