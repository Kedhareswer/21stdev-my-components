# spotlight-offer-quiz: review log

## Reference

`media/spotlight-offer-quiz/reference.png` is the first-visit offer screen of https://moremud.co
(a dog-care shop), a screenshot from the public design-gallery repository
https://github.com/Landing-Pages-Websites/inspiration-library, entry `lapa-ninja-2026-0407`
(`shots/lapa-ninja-2026-0407__scroll1.webp`, harvested from lapa.ninja).

It shows a spotlit graphite studio backdrop, one dark monochrome product photo bleeding off the
right edge, a heavy grotesk offer stacked under a small kicker, one personal question, five outlined
translucent answer pills and a cheeky decline line. Only that feel and layout were taken. Nothing
from its brand, copy, logo or photo was reused. The demo brands (Kettle & Crow roasters,
Understory plants) are invented.

**Why a GitHub source.** This run's network policy blocks every image host: cdn.21st.dev (so the
21st `get_inspiration` results came back, among them the owner's bookmarked lumina-interactive-list,
but none of their preview images would download), images.unsplash.com, picsum, unsplash.com,
awwwards, godly, land-book, dribbble, siteinspire and minimal.gallery. Public GitHub clones work.
The same block is why every screenshot shows the no-photo stage: in a normal browser the demos
show the Unsplash photos named in the README.

## Idea gate (fresh critic)

Five takes: (1) spotlight-offer-quiz, a one-question discount popup or section; (2) a 3-step
product finder; (3) a spotlight product hero; (4) an exit-intent offer sheet; (5) a choice CTA band.

Verdict: **build #1**. #2 is the generic quiz funnel ending in a product card; #3 is a tired
pointer-spotlight trope, too close to flashlight-text-reveal and to "product as the hero idea";
#4 is a generic bottom sheet with a fake-urgency countdown; #5 is sound but weaker. Folded in:
trigger props (manual, delay, exit intent, remember dismissal) from #4, copy that adapts to the
pick from #5, a one-line recommendation from #2. Risks named: the no-photo fallback must look
finished, too much choreography, offer type that must fit any string without web fonts, a
squished phone layout, modal accessibility, sliding into cream/glass/neon, duplicating
wordmark-newsletter-signup.

## Skills used

- Reference & idea gate: `design-ui-ux/awwwards` (+ `references/concepts.md`,
  `art-direction.md`, `quality-bar.md`), `design-ui-ux/design-taste-frontend`,
  `frontend-web/frontend-design`.
- Build: `21st-dev/21st-create-component`, `design-ui-ux/emil-design-eng`.
- Motion: `animation-motion/transitions-dev` (modal, texts-reveal, success-check values, adapted
  not pasted), `animation-motion/motion-design`, `design-ui-ux/apple-design` (interruptible CSS
  transitions). `animation-motion/oil-motion` is a video-generation API pipeline and does not apply
  to a CSS component.
- Before the critic: `animation-motion/transitions-polish` (modal 250 ms in / 150 ms out, hover
  250 ms, 80 ms intent delay on previews, 40 ms stagger), `21st-dev/21st-ui-review` (the `21st`
  CLI is not installed here, so its review was done by hand against its priority list),
  `design-ui-ux/user-interface-guidelines`.
- Before committing: `testing-quality/verification-before-completion`.
