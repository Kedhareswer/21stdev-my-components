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

## Round 1: REDO (average 6.4)

Scores: usability 6, idea 7, craft 5, originality 6, install-safety 8.

Findings, most important first: the phone email row grew to a 190 px tall box and pushed the
button below the fold (a column flex row turned the input's flex-basis into height); on phones
the copy scrolled over a fixed stage, and the done step kept the claim step's height; the
no-photo lettering was clipped at the right edge and its first letter eaten by the mask (sized
with a guessed glyph width); the six default photos were all cups, so pointing at an answer
swapped cup for cup; `inert: ""` would read as false on React 19 and trap focus on hidden pills;
a focus frame around the whole popup; still lettering double-exposed on fast sweeps and the wipe
was slow (700 ms); the no-email flow showed a dead claim panel for 700 ms; unsafe defaults
(`defaultOpen` true, no dismissal memory, a "Shop" button that only closed); the chalk row
wrapped by accident; no thumb.

Changes made:
- Phone form: the input keeps a 46 px height in a stacked row; the question hides after a pick
  on phones so the button sits inside 375×812.
- The stage now lives inside the popup's scroll frame; hidden steps leave the flow; each step
  starts scrolled to the top.
- Lettering is measured on a canvas in the display face and fitted to the stage box (70 % of the
  plate on desktop, 90 % on phones), right-aligned clear of the mask; "&" and other short words
  join the next word (`stillSize`, `stillWords`, tested).
- New default content: a gift finder ("Your first gift, 15% off. Who are you shopping for?")
  whose answers lead to visibly different studio product shots (headphones, watch, instant
  camera, sunglasses) and one answer, the gift card, that shows the lettered stage on purpose.
  Graphite lifted toward the reference's mid-grey studio with a second soft light on the left.
  New `imageFit` / option `fit`: `"contain"` stands a transparent packshot on the floor with a
  shadow.
- `inert` is set as a DOM property from an effect; the focus trap also skips `[data-hidden]`.
- `.soq-modal:focus { outline: none }`.
- Swaps: photos wipe up in 420 ms over the previous photo; lettering cross-fades in 240 ms while
  the previous layer fades out in 180 ms; non-current layers hide at once.
- `collectEmail={false}` with no `onClaim` goes straight to the code; with `onClaim` it shows a
  pending line.
- `defaultOpen` false; `rememberDismissDays` defaults to 7 with a self-opening trigger; without
  an `href` the last button says "Start shopping".
- A submit label longer than the row stacks the form deliberately (`data-stack`).
- `media/spotlight-offer-quiz/thumb.webp` added (640×400, cut from the 1440 render; photos
  cannot load in this sandbox, so it shows the lettered stage).
