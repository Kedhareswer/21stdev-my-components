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

## Round 1 (fresh critic): REDO

| | Score |
|---|---|
| (u) usability | 8 |
| (a) idea | 7 |
| (b) craft | 6 |
| (c) originality | 7 |
| (d) install-safety | 9 |

Average 7.4, craft under 7. Ranked changes: (1) passed cards left text fragments at the left
edge (a 93% veil still let 7% through): fade passed cards out completely; (2) the focused
card's text column moved between index 0 and later indices: shift by the seam inset so it
always lines up with the heading; (3) graphite had no real light version; (4) two-year
milestones read as two separate chips on the rail at rest; (5) chip outlines showed from under
the moving pill; (6) the strip's focus ring was a big rectangle cutting through cards; (7) at
the end of the strip the passed card carried the "not yet" haze; (8) the fallback numeral
clipped on phones; (9) add `imagePosition`, key image failures by URL, document keys; (10)
optional: a clearer hover answer on hazed cards.

## Round 2 (new critic): REDO

| | Score |
|---|---|
| (u) usability | 8 |
| (a) idea | 7 |
| (b) craft | 7 |
| (c) originality | 7 |
| (d) install-safety | 9 |

Average 7.6. Round 1's fixes confirmed. Ranked changes: (1) straighten the focused card's left
edge once the card before it has faded, so pill, title and edge share one line (and the phone
gutter survives); (2) rail rings vanished before the liquid arrived: fade them by real
coverage; (3) the default light theme was deep navy, so light and dark looked alike: make
harbour light a powder steel close to the reference; (4) phone text measure too narrow;
(5) hide the focus ring during a drag; (6) the plate numeral's crop looked accidental;
(7) hazed cards faded the title but not the body; (8) the second demo drifted to plain grey:
show another preset.
