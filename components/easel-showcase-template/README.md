# Easel Showcase Template

A one-page portfolio for Kedhareswer, laid out like a gallery that sells art. A fanned deck of work collapses and re-deals itself down a staircase as you scroll. A paragraph inks in word by word while its deck riffles, then a folder files the cards away. Avatar bands drift apart, a bento holds the projects, and a banner shrinks into the centre of a portrait wall. Pricing cards follow, then a lime marquee whose doodles drop and pile up with real collisions.

```tsx
import EaselShowcaseTemplate from "@/components/ui/easel-showcase-template"

export default function Page() {
  return <EaselShowcaseTemplate />
}
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | Height of the hero and of each pinned stage. Use a definite length, never a percentage. |
| `email` | `kedhareswer.12110626@gmail.com` | Every call to action is a `mailto:` to this address. |
| `assetBase` | component site | Where the `.webp` pictures live. Point it at your own copy to self-host them. |
| `className`, `style` | | Passed to the root. |

## Sections

1. **Hero:** the headline blurs in word by word. The front card rises from below the fold, the rest of the deck appears under it, and the deck fans out. Tags pop in last.
2. **Showcase (pinned, 340vh):** the fan collapses into a stack that sinks and slides to the first stair. The cards then deal down a staircase that runs off the right edge, while the "Design, build, & ship products" copy blurs in.
3. **Gateway:** a case-study banner with a three-picture slider.
4. **Trusted by:** a marquee of Client 1 to Client 6.
5. **Process (pinned, 380vh):** a centred paragraph inks from faint to solid with the scroll while its deck riffles. The deck then deals into a staircase with an info card, then files itself into a black-tabbed folder beside "My vision" as line doodles pop in.
6. **People:** two bands of avatars drift in opposite directions around "You will find yourself among my people".
7. **Story bento:** Project 01 to Project 04.
8. **Archive:** a carousel with arrows and a progress bar.
9. **Portrait wall (pinned, 300vh):** a "Project 07, up close" lead-in fades as an orange banner rises and shrinks from 94vw into a 390 × 460 card, while fourteen portraits rise around it.
10. **Engagements:** three tilted price cards.
11. **Lime band:** a marquee tied to scroll. Fourteen doodles fall under gravity, bounce, collide and pile up. Moving the cursor through the pile throws them up again.
12. **Meet / Archive cards and footer.**

## Motion

Measured frame by frame from the reference recording at a 1440 × 862 viewport.

- **Word reveal:** each word goes from `blur(8px)`, a 0.25em rise and opacity 0 to sharp. The fade takes 0.7s on `cubic-bezier(.22,1,.36,1)`, 70ms per word.
- **Hero intro:** the front card rises from below the fold, between 0.35s and 1.25s, and untilts from −32° by 1.6s. The deck appears under it at 1.0s and fans out from 1.35s to 2.35s. Tags pop at 2.3s on a back-out spring.
- **Stage 1:** the fan collapses into a stack at 6–28% of the pin and the stack sinks at 10–34%. It slides to the first stair at 34–46%, then deals at 44–72% with 2% stagger per card. The first stair card is centred at (681, 0.62h), and each stair steps 155px right and 40px down. The reference steps 52px and lets the cards run under the next section; 40px keeps them clear of the gateway heading.
- **Stage 2:** the paragraph inks at 0–32% and fades out at 30–40%. The staircase deals at 34–58%, stepping 172px right and 0.1h down. The cards file into a 606px folder at 60–84%, and the doodles pop at 70%.
- **Stage 3:** the banner shrinks at 0–50% and the wall rises at 35–60%, staggered by column.
- **Sizing:** the stage cards scale with the smaller of `width / 1440` and `height / 862`, so a wide but short window does not push the deck into the copy under it.
- **Nav:** once the page scrolls, a frosted bar fades in behind the nav so headings never run through the links.
- **Hover:** this only applies where a mouse can hover. Nav underlines grow from the left, buttons lift 2px, and photos zoom 5%. The bento deck spreads, price cards straighten and lift, and avatars pop.

`prefers-reduced-motion` is read at runtime. It turns off the intro, the blur reveals, the logo and lime autoplay and the falling doodles, which are laid out already at rest. The three pinned stages still follow the scrollbar, so they move only when the reader scrolls.

## Pictures

All 54 pictures are original images generated with ChatGPT for this template: the posters, the avatars, the portraits and the banner photographs. They are served as WebP from `https://kedhar-components.pages.dev/easel-showcase-template/`, and the sources are in `dev/public/easel-showcase-template/` in this repo. The font is an embedded, renamed subset of Inter Tight (OFL), weights 400 to 600.

No dependencies besides React.
