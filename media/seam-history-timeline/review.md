# seam-history-timeline: review log

## Reference

`media/seam-history-timeline/reference.png` is the "Our History" section of
https://www.clearwater.london (a wellness-hub development in London): a horizontal row of wide
milestone cards on a steel-blue field, each a photo over one sentence, neighbours cut on a
shared slanted seam, the focused card in full colour and the next ones washed into a pale
haze, dark year pills on the photos, two of them fused like liquid where a milestone spans
2021 and 2022. `reference-2.png` is the values section of the same page (the same slanted-cut
photo language). Both are crops of a full-page screenshot in the public design-gallery
repository https://github.com/Landing-Pages-Websites/inspiration-library, entry
`lapa-ninja-2026-0784`, harvested from lapa.ninja.

Only the feel and layout were taken. No brand, copy, logo or image is reused.

Why a GitHub source: this run's network policy blocks every image host (cdn.21st.dev, so
`get_inspiration` returned results whose previews could not download; images.unsplash.com,
awwwards, godly, land-book, dribbble, siteinspire, minimal.gallery, lapa.ninja, picsum,
jsdelivr, unpkg, wikimedia). Only GitHub and the package registries are reachable.

Why the screenshots show year plates instead of photos: images.unsplash.com is blocked here, so
every photo fails in the cloud browser and the component's no-image fallback is what renders.
In a normal browser the defaults are Unsplash photos.

## Idea gate (fresh critic)

Five takes: 1 seam-history-timeline, 2 seam-values-collage, 3 seam-case-showcase,
4 fused-pill-roadmap, 5 seam-contact-band.

Verdict: build take 1. The library has no history / milestones timeline; the take keeps the
reference's two marks (slanted seam, fused year pills) and its interaction is the job of a
timeline. Rejected: 2 (decorative values block, close to the banned bland family and to
focus-pull-carousel), 3 (another carousel with a wipe), 4 (stock SaaS roadmap widget, drops
photos and seams), 5 (template filler; wordmark-newsletter-signup already covers it).
Must-haves named by the critic: a flawless goo pill (shapes in the filter, text crisp on top,
clean neck), haze that reads as "not yet" (wash toward the field, no blur, no scale), real
clip-path seams that survive 375 px, a confident field colour rather than pale blue-white,
and full usability (drag with momentum, horizontal-only wheel, keys, buttons, live region,
onChange / startIndex, a second demo with another company in graphite).
