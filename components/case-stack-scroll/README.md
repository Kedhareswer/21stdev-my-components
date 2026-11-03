# Case Stack Scroll

An agency's case studies as a stack of website cards, filed up and back like folders in a drawer. The nearest card faces you. Behind it, each card shows only its top strip, shrinking with depth up to the top of the screen. Scroll, drag or swipe and the stack rolls: the front card drops out of the bottom and the next one settles into its place. Hover a card and it lifts out of the stack to face you. The cards in front slide down out of its way, and a blue "View project" disc follows the pointer.

**Requires `gsap`** (core only: the ticker and `quickTo`). Fonts: Inter Tight, JetBrains Mono and Instrument Serif from Google Fonts (SIL Open Font License). Photos inside the built-in card faces: Unsplash (Unsplash License) and Pexels (Pexels License), loaded from `images.unsplash.com` and `images.pexels.com`. Every brand on the cards (Permitly, Halo Audio, Vela Clinic and the rest) is fictional.

## Storyboard

1. **Rest.** Twelve site cards fill the middle of the screen. The front card's top edge sits at about 63% of the height and its bottom runs off the screen. The left label shows `1\12` and the front card's category. The right label shows the project count. *Filed by type. United by quality.* sits bottom left and *View all cases* bottom right.
2. **Roll.** The wheel (or a vertical drag, or a swipe) moves the stack with a smoothed lerp. When the wheel rests, the stack settles on a whole card. At either end the wheel goes back to the host page, so the component never traps page scrolling.
3. **Lift.** Hovering a card turns it flat towards you and slides the cards in front down. The left label switches to that card's category and name. On touch, the first tap lifts a card and the second tap opens it.

Under 720 px wide (container width, not viewport), the labels move to the top and the stack is clipped between them and the footer row. Touch scrolling of the page still works from those strips.

## Keyboard

The front card is the one tab stop. Focus lifts it. Use the up and down arrows, or `PageUp` and `PageDown`, to roll the stack, and `Enter` to open the focused card.

## Props

| Prop | Default | Notes |
|---|---|---|
| `cards` | 12 fictional sites | `{ title, category, image?, face?, href? }`. Front card first. `image` is a screenshot of the site; 16:10 reads best, cropped from the top. Without it, one of the built-in HTML faces (`face`) is drawn. |
| `onSelect` | none | `(card, index)` when a lifted card is clicked. `href` navigates after it. |
| `tagline` | `["Filed by type.", "United by quality."]` | Two lines, bottom left. |
| `ctaLabel`, `ctaHref` | `"View all cases"`, `"#"` | Bottom-right button. |
| `countLabel` | `"projects"` | Shown after the card count. |
| `cursorLabel` | `"View project"` | Text in the cursor disc. |
| `height` | `"100svh"` | Must be a definite length. Percentages collapse to 0 on a page with no height chain. |
| `fontHref` | Google Fonts | Pass `null` to load no web font. |

## Theming

The page uses `--color-background` and `--color-foreground` only, so it follows the host's light and dark themes. The card faces keep their own colours, as screenshots would.

`prefers-reduced-motion` turns the roll and the lift into instant moves and drops the cursor and shade transitions.
