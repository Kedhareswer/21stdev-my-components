# slit-type-faq: review log

## Reference

`media/slit-type-faq/reference.png` is the "Table of contents" section of
https://learntype.eu (the Blaze Type Guide, a book on type design). `reference-2.png` is another
section header from the same page. Both are crops of a full-page screenshot in the public
design-gallery repository https://github.com/Landing-Pages-Websites/inspiration-library, entry
`lapa-ninja-2026-0758`, which was harvested from lapa.ninja.

What it shows: one saturated signal red on white, a heavy display headline whose letters are cut
by a horizontal mask as they rise, a bold grotesk for row labels, full-width red rules with thin +
toggles, and a red ticker strip between rules.

We took the feel and layout from it and nothing else: no brand, copy, logo or images.

**Why a GitHub source.** This sandbox's egress policy blocks every image host: cdn.21st.dev
(so `get_inspiration` returned results but none of their preview images would download),
images.unsplash.com, awwwards, godly, land-book, dribbble, mobbin, siteinspire, behance. Only
GitHub and the package registries are reachable.

## Idea gate (fresh critic)

Five takes on the reference were judged:

1. slit-type-faq: a FAQ section whose open question floods its row with ink
2. slit-type-curriculum: a course "what's inside" list
3. slit-type-pricing: two-plan pricing with rolling prices
4. slit-marquee-cta: a closing CTA band with a ticker and email capture
5. slit-type-changelog: release notes as ruled rows

Verdict: **build #1**. The library had no standalone FAQ (FAQs only lived inside templates). #1
keeps the reference's layout (sliced headline, full-width rules, thin +) and adds a signature of
its own: the open row floods with ink and inverts. #2 is #1 reskinned for a narrower job, #3
repeats existing pricing pieces and the most common pricing trick, #4 is decorative and close to
the wordmark footers, #5 is a niche job. Must-haves named by the gate: a readable, finished
headline on frame one; a crisp clip-path flood with a duplicated inverted layer, not a colour
fade; a real accessible accordion with deep links and search; presets with designed dark
versions; a designed phone layout; and restraint (no help-centre dashboard, ticker optional).

## Round 1 (fresh critic): REDO

| | Score |
|---|---|
| (u) usability | 8 |
| (a) idea / reference feel | 6 |
| (b) craft | 6 |
| (c) originality | 6 |
| (d) install-safety | 9 |
| average | 7.0 |

Findings and what changed:

1. The headline lost the reference's sliced type at rest (the cut only existed mid-entrance).
   Now the capitals rise into a hard slit and rest there, cut through (`slit`, 0.42 by default,
   0 sets it whole); hovering the headline lifts them clear. Reduced motion keeps the cut.
2. A real artifact: on desktop the hover pre-clip moved the ink ahead of the inverted text,
   so letters vanished at the flood edge. The ink and the inverted copy now share every clip
   state, and a test asserts it.
3. The hover cue was a tab in the far margin and the text roll swapped identical text. Now the
   square behind the + floods with ink (the flood in miniature) and the question nudges along.
4. Focus ring hugged the glyphs: now drawn in the gutter, clear of the text and the +.
5. Motion shortened: flood 400 ms in / 280 ms out, panel 360 / 240 ms.
6. Ticker ends fade out with a mask; uppercase tracked +0.02em.
7. Rules are 1px so they render crisp at 1x; the + and x are SVG strokes.
8. Search shows an excerpt around a match found only in an answer; the mark no longer crowds
   the next letter.
9. `Arial Black` added before Arial so Windows keeps the headline's weight.
10. Controlled `open`, `idPrefix` for two FAQs on one page, and `minHeight` now defaults to 0
    (the section sizes to its questions).
