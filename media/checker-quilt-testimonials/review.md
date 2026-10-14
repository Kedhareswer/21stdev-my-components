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

## Round 1: REDO (average 6.8)

Scores: usability 6, idea 7, craft 6, originality 6, install-safety 9.

Main findings: quotes clipped by their tiles at 1280×720 and 1366×768 (type sized by character
count only); muddy khaki fallback plate with initials showing through while a photo loads; an
invisible focus ring on the butter tile; the second demo (`rows={1}`) was the stock split
slider; the quote mark jumped sides during a step; 1px seams mid-sweep; about 1.4 s before a
clicked step could be read; phone measure too narrow and its vertical sweep disagreeing with a
horizontal swipe; posed stock portraits instead of documentary ones; no thumb.

Changes made:
1. Each quote tile now fits its type to its own height and width (binary search on the size,
   refit on resize and on every new quote), with at least 48px of vertical padding. Measured on
   every page at 1280×720, 1366×768, 1440×900, 1920×1080, 375×667 and 390×844: nothing leaves its
   tile. Wider measures (27/30/33ch) so the fit can pick larger type. Default height raised to
   `clamp(620px, 94svh, 1040px)`. Test asserts the fit.
2. Solid per-preset plate colours; initials only when a portrait fails or is missing; portraits
   already decoded skip the fade (module-level cache).
3. Two-tone focus ring on buttons and an inset ring overlay on the quilt.
4. Second demo replaced: `demo-wine-bar.tsx`, oxblood preset, two rows, a wine bar's regulars.
5. The quote mark fades and rises with the words; clip-paths overscan 1px; steps the visitor
   asks for run at 300 / 500 ms (autoplay keeps 420 / 680 ms).
6. Phone: the quote stays on top and the photo below; a field-coloured sweep crosses the photo
   sideways in the swipe direction. Measure is full width, type up to 30px.
7. Copy no longer ties a quote to an age the photo may not show.

Not changed: the portraits. Only images.unsplash.com is allowed, and this sandbox can neither
load it nor search Unsplash, so new photos could not be seen before choosing them. The six
defaults are verified portraits (80px copies on GitHub); `photo-path-*.png` in the round 2
screenshots shows them rendering, from those 80px copies.

## Round 2: REDO (average 7.6)

Scores: usability 8, idea 7, craft 7, originality 7, install-safety 9.

Main findings: an empty frame mid-step (both rows without words or a face, about 1 s of
unreadable copy per click); the fallback plate too close to the green field, so a text-only
quilt merged into a slab; the server/first paint on a phone was a squeezed 2×2 quilt because
the stacked layout waited for JS; the section was 1044px tall at 1440×900; README drift; no
lazy loading; Graham's crop; no `defaultPage`, `cta` without `onClick`.

Changes made:
1. The old quote stays readable while the field covers the row and fades only in the last
   130 ms; the new quote starts rising the moment it lands (no lead on a click). Text is gone
   for about 130 to 250 ms instead of about 1 s.
2. Per-preset third tones for the plate (sage, rose, slate, jade, periwinkle) that contrast
   with both fields; the header comment now says what the code does.
3. The stacked layout is a CSS container query scoped to each instance (`data-cq`), so the
   first paint on a narrow container is already stacked; JS only counts rows per page.
4. Default height `clamp(560px, 80svh, 960px)`, a slimmer band and a quote mark that hangs in
   the margin on wide layouts: the whole section is 890px at 1440×900, and the fitted quotes are
   32px at 1440, 21 to 28px at 1280×720.
5. `demo-text-only.tsx` (mint preset, no photos, autoplay off) shows a different configuration.
6. `loading="lazy"` and `sizes` on portraits; Graham's focus moved to 50% 45%.
7. `defaultPage` prop; `cta` takes `onClick`; README synced.
