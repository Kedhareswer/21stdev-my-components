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
