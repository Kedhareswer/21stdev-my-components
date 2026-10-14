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
