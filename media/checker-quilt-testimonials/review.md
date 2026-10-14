# checker-quilt-testimonials: review log

## Reference

`media/checker-quilt-testimonials/reference.png`: the testimonial section of a neighbourhood
dental practice, https://omp.dentist, taken from the public design-gallery repository
https://github.com/Landing-Pages-Websites/inspiration-library (entry `lapa-ninja-2026-0586`,
harvested from lapa.ninja). It shows a 2×2 checkerboard: a quote on a deep bottle-green field
next to a warm documentary portrait, then a portrait next to a quote on a butter-yellow field.
Only the feel and layout were taken. No brand, copy, logo or image is reused.

Why that source: this run's network policy blocks every image host (cdn.21st.dev, so
`get_inspiration` previews could not download, plus images.unsplash.com, awwwards, godly,
land-book, dribbble, pexels, picsum, jsdelivr, wikimedia). Only public GitHub reads work.

Why the screenshots show monogram plates: images.unsplash.com is blocked here, so every
portrait fails to load in the cloud browser and the component's no-photo fallback is what
renders. In a normal browser the defaults are Unsplash portraits. The portrait identities
were checked against small GitHub-hosted copies (80px) of four of them.

## Idea gate (fresh critic, 2026-10-14)

Five takes on the reference: (1) checkerboard testimonial quilt, (2) patient-story scroller,
(3) hover-to-meet 3×3 grid, (4) quote + booking split, (5) filterable review quilt.

Verdict: **build #1**. Rejected #2 (generic scroll reveal, a page not a component), #3 (a wall
of text, fragile hover mechanic, close to hover-expand-gallery), #4 (the stock testimonial
slider, throws away the checkerboard), #5 (filters plus FLIP is gallery behaviour, overkill
for 4 to 8 quotes). Fold in: the portrait settling from a tight crop (#2), an optional CTA
(#4). Risks named: sliding into the banned cream-and-serif look, duplicating
shutter-blinds-carousel's wipe, timid type, a squished phone layout.
