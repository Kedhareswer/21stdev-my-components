# wirebound-inquiry: review log

## Reference

`media/wirebound-inquiry/reference.png` (and `reference-2.png` for context): the bottom of
https://www.commissioner.design/, a product designer's portfolio, taken from the public
design-gallery repository https://github.com/Landing-Pages-Websites/inspiration-library (entry
`lapa-ninja-2026-0740`, harvested from lapa.ninja). It closes the page with a kraft-paper,
wire-bound notebook: a huge condensed name printed on the cover, a yellow tab strip, and the
contact email and socials written in marker on yellow rules.

Taken: the feel and the layout of that block (kraft cover, left coil, big condensed print, a
yellow band, contact lines on rules). Not taken: the brand, name, copy, the handwriting, the
collage hero or any image. The demo studio (Marlowe & Pike) and the second demo (Oddfellow
Audio) are invented.

**Why a GitHub source.** This run's egress policy blocks every image host: cdn.21st.dev (so the
`get_inspiration` results came back but their `previewUrl` images would not download),
images.unsplash.com, awwwards, godly, land-book, dribbble, siteinspire, minimal.gallery, mobbin
and the gallery repo's own GitHub Pages host. Public GitHub clones work, so the screenshot was read
straight from the repository.

## Idea gate (fresh critic, 2026-10-15)

Five takes on the reference: (1) wire-bound project inquiry (contact section, one question per
page), (2) notebook footer, (3) taped testimonials, (4) cut-out collage hero, (5) torn-out-page 404.

Verdict: **build take 1**. Rejected #2 (the library already has six footers; without a form it is
a kraft card with links), #3 (tape strips are the "decals over a flat surface" look, needs web
fonts for the handwriting, two testimonial pieces exist), #4 (too close to the five portfolio
heroes already in the library, drifts childish), #5 (one joke on a page rarely installed). Fold
in: #2's marker lines on the cover, the tab strip as step tabs. Risks named: fake materials (build
the coil in two halves through holes, real fibre texture), the banned cream look (bold colour
fields only), web fonts (SVG cover title, mono answers, no fake handwriting), the closed cover
must work alone, real form semantics, no backface flicker in SwiftShader, install safety.

## Round 1 (fresh critic, 2026-10-15): REDO

Scores: usability 6, idea 7, craft 7, originality 8, install-safety 7 (average 7.0).
Banned looks: passed (cobalt or orange field, no beige, no SaaS skeleton, the notebook is the form).

Changes asked, most important first, and what was done:
1. `inert: ""` is false under React 19, so hidden pages stayed tabbable. Now each face's `inert`
   property is set from an effect (same under React 18 and 19); checked with a Tab pass: from the
   band, Tab reaches the cover links, then after opening the heading, chips, Back, Next and tabs,
   never a hidden page.
2. Hydration: the width started from `window.innerWidth`. Now a constant first render (1440 × 900),
   measured in a layout effect before paint.
3. Phone coil clipped at x≈0: the single-page book now reserves the coil overhang (14px).
4. Hard-coded copy: every small string (labels, errors, announcements) is in a `copy` prop with
   `{n}`, `{total}`, `{studio}`, `{time}` fills; validation returns copy keys. Added
   `layout="notebook"` for the notebook alone.
5. The email appeared three times: the column's email and socials are gone on wide screens (the
   cover carries them). Added `notes`: a client note on paper, held by a strip of tape.
6. Handwriting voice: `handFont` prop (Segoe Print, Bradley Hand, Noteworthy, Ink Free, Marker
   Felt) for answers, cover entries and notes; it falls back to the mono stack where no handwriting
   face exists (as in the cloud renderer). No web fonts.
7. Focus on kraft was ~1.6:1: cover links and the band now take a `coverText` outline with a
   highlight ring.
8. Scale: pages grow with the viewport height (about 68%, ratio 1.3 to 1.48) and the copy column
   is narrower, so the closed book is about 470 × 640 at 1440 × 900.
9. Index tabs: 11px labels and a 40px hit area.
10. Hover peek was invisible: the cover now lifts to -26deg with a shade, showing the first page's edge.
