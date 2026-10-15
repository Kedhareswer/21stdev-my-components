# odometer-stage-stats: review log

## Reference

`reference.png` and `reference-2.png` are the stats section of https://alovehatestory.com (a
branding and consulting agency). They come from the public design-gallery repository
https://github.com/Landing-Pages-Websites/inspiration-library, entry `lapa-ninja-2026-1307`
(`shots/lapa-ninja-2026-1307__scroll1.webp` and a crop of the full-page shot), harvested from
lapa.ninja. They show a saturated red field with ONE enormous condensed white numeral centred
(96, then 38, then 1) that changes in place as you scroll, short paragraphs pinned to
alternating corners under a small bracket mark, a big faint label word (BRANDS) along the
bottom, and a script signature under the final number.

Taken: the feel and layout only (one figure on stage at a time, the colour field, the
alternating corner stories, the faint backdrop word). Not taken: the brand, copy, logo,
script signature or any image. The demo studio (Halden Studio) and product (Tallyline) are
invented and their figures are sample copy.

**Why a GitHub source.** This run's egress policy blocks every image host: cdn.21st.dev (so
the `get_inspiration` results, e.g. "Bold Stats" and "Stats Section", came back but their
`previewUrl` images would not download), images.unsplash.com, godly, land-book, awwwards,
dribbble, siteinspire, minimal.gallery and mobbin. Public GitHub clones work.

## Idea gate (fresh critic, 2026-10-15)

Five takes on the reference: (1) stepped big-number stats section, (2) funnel countdown
"from 96 to 1", (3) two-letter service dividers, (4) corner-frame agency hero, (5) signature
footer.

Verdict: **build take 1**, folding in take 2's segment bar as the step index and an optional
CTA on the last stat only. Rejected: 2 as a narrower gimmick of 1; 3 as decorative and close to
hover-expand-gallery / slit-type-faq; 4 as the generic agency hero; 5 as a fifth wordmark
footer. Must get right: (a) the numeral is the whole personality, so draw the digits in SVG
rather than trust system condensed fonts, and avoid slat/split-flap digits (too close to
slat-count-preloader); (b) a sticky stage inside a track `n × height` tall with a definite
height, index / arrows / click mode working without scroll, frame one finished, `aria-live`
announcing whole stats; (c) clean roll transitions across different figure lengths, alternating
corner story, 4.5:1 text contrast on every preset.

## Round 1 (fresh critic): REDO

Scores: usability 7, idea 7, craft 6, originality 6, install-safety 9 (average 7.0).
Findings, most important first: B and K clipped at their sides, notch in K, % slash cut,
2 short of the cap line; stray slivers where the outgoing and incoming figures overlap
mid-step; only `$` drawn (other currencies fell back to the system font); backdrop word wide
and pink rather than a dark condensed ghost, and cut mid-word on phones; DIN road-sign
figures rather than the reference's compressed poster figure; click mode cramped under the
header; grain invisible; `label` text only.

Changes made:
- New glyph set: 42-unit stroke, narrower bodies, slit counters (a compressed poster figure),
  B/K/% rebuilt, 2 reaches the cap line, `€ £ ¥ ₹` drawn. The test now samples every stroke
  edge and fails if any glyph leaves its width (it catches the first draft's B).
- Hand-off: the outgoing figure fades while it leaves (220 ms, 20 ms stagger); slots are 1.6em
  apart so a digit that is nearly home never shows its neighbour's edge; the new figure starts
  120 ms in.
- Backdrop word: field mixed with 20% black (or `palette.ghost`), compressed with `scaleX(.72)`
  and fitted to the stage width by its letter count.
- Figure and label block centred between the header and the segment bar; `numberSize` cap
  42cqh.
- Grain visible (soft-light, 0.38). Controls and CTA squared to match the poster language.
- `label` accepts any node, with `alt` for what screen readers hear.
