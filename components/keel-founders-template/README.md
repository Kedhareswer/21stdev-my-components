# Keel Founders Template

A one-page site for Kedhareswer's design and front-end practice for startups: a full-bleed hero, a context section, three service blocks, a testimonial slider, a three-step process, a fixed-price sprint, selected work, a closing call to action and a footer with a newsletter form. The palette is calm (lavender grey page, deep teal, a lavender accent) and the pictures are warm editorial photographs.

## What it does

- **Load.** The nav drops in from above on a critically damped spring. The call-to-action pill pops up from 80% scale. The headline then blurs into focus letter by letter, followed by the subtitle word by word and the nav labels letter by letter.
- **Hero drift.** The hero picture sits at 105% and slides down a little as you scroll away. The nav turns from clear to a frosted light bar once most of the hero has gone.
- **Ink text.** The big headings and the two lead paragraphs start at half opacity. Each block inks in word by word as it travels up the screen, and fades out again when you scroll back.
- **Reveals.** Blocks rise 20px and fade in as they enter the screen. Service pictures settle from 95% scale, and list rows follow one after another.
- **Testimonials.** Full-screen slides move sideways every six seconds, and the loop runs forwards without a visible jump. Each quote and its name rise in when the slide arrives. The slider pauses while you hover or focus it, while it is off screen, and when the tab is hidden. Two round buttons step it by hand.
- **Hover (mouse only).** A thin underline grows from the left under a nav link and retracts to the right. On the pill button a second arrow circle slides in from the left, the label moves over, and the first circle leaves. Process cards grow to 110% while their text holds its size, the rule above turns lavender and an arrow circle rises in. Work cards lift 20px. The lavender buttons darken.
- **Mobile.** Below 900px the nav folds into a square menu button with a frosted sheet, and every grid becomes one column. The layout works down to 375px.

## Motion

Measured on the reference at 1440 x 900 by sampling computed styles and element boxes every 100ms, then re-measured on this build with the same script.

| | Value |
|---|---|
| Nav drop | y -100 to 0 with fade, spring w = 8/s, no overshoot, 1.2s, 0.2s delay (CSS `linear()` easing) |
| CTA pill | y 40 to 0, scale 0.8 to 1, 0.6s `cubic-bezier(.12,.23,.5,1)`, 0.8s delay |
| Headline letters | y 30 to 0, blur 3px to 0, fade, 0.62s, 16ms per letter, from 1.6s |
| Subtitle words | y 10 to 0, blur 3px to 0, fade, 0.57s, 25ms per word, from 2.14s |
| Nav label letters | y 10 to 0, blur 3px to 0, 0.6s, 30ms per letter, from 1.68s |
| Hero drift | `clamp((scroll - 77) * 0.27, 0, 270)` px at scale 1.05 |
| Nav tone | light once 62% of the hero has scrolled away, 0.3s colour fade |
| Ink text | per block: progress runs 0 to 1 while the block's top moves from 73.3% to 33.3% of the viewport height; word *i* of *n* lights once progress passes *i / n*; 0.6s fade; reversible |
| Reveals | y 20 to 0 with fade, 0.6s ease-out-quad `cubic-bezier(.25,.46,.45,.94)`, rows 0.1s apart |
| Testimonials | every 6s, 1s slide `cubic-bezier(.2,.9,.3,1)`, name +0.1s, role +0.2s |
| Nav underline | 0.4s `cubic-bezier(.44,0,.56,1)`, in from the left, out to the right |
| Pill hover | circles and label travel 60 / 55px in 0.6s ease-out-quad, entering circle 50% to 100% opacity |
| Process card hover | card 1 to 1.1 in 0.6s (80ms delay), text 0.9 counter-scale, arrow rises 85px in 0.4s |
| Work card hover | 20px up in 0.4s, back in 0.2s |

The scroll handler runs once per frame and only while scrolling. **Reduced motion:** with `prefers-reduced-motion`, everything appears in its final state, nothing drifts or blurs, all text is fully inked and the slider doesn't autoplay.

## Usage

```tsx
import KeelFoundersTemplate from "@/components/ui/keel-founders-template"

export default function Page() {
  return <KeelFoundersTemplate />
}
```

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Height of the hero, the testimonial slider and the closing section. Use a definite length. |
| `email` | Kedhareswer's address | Where the call buttons, Contact and the cards write to. |
| `assetBase` | the component site | Base URL of the pictures, if you host them yourself. |
| `className`, `style` | | Passed to the root. |

The root is `width: 100%` and scrolls with the page. Styles are scoped to `.kf-root` and only use the component's own colours. A `.dark` ancestor switches the page to a deep teal night palette.

## Assets and dependencies

- **Only `react`.** No other packages.
- **Pictures:** 14 WebP photographs generated with ChatGPT for this template (fictional people, no logos): a hero portrait, three service portraits, three testimonial portraits, three process shots, three work shots and a landscape. They are served from `kedhar-components.pages.dev/keel-founders-template/` and kept out of the file so it stays under 21st's 200 kB limit. Pass `assetBase` to host your own; keep the file names.
- **Font:** a Latin subset of Inter (SIL Open Font License), variable weights 300–500, embedded as `KfSans`.
