# postmark-cta: review log

## Reference

`reference.webp` is the closing call-to-action section of https://fynza.com (a fintech /
travel-tech landing page), taken from the public design-gallery repository
https://github.com/Landing-Pages-Websites/inspiration-library, entry `one-page-love-2026-0014`
(`shots/one-page-love-2026-0014__scroll1.webp`, harvested from onepagelove).

What it shows: a heavy two-line uppercase headline with one accent-coloured phrase and a single
orange pill button in the centre, six illustrated collectible postage stamps (perforated edges,
one round sticker, postmark cancellations, tilted) scattered around it, on a halftone dot field
that grades from cool blue at the top to warm peach at the bottom.

What was taken: the feel and layout only. No brand, copy, logo or stamp art is reused; every
stamp subject is drawn by our own engraving renderer, and the demo copy and products are
invented.

**Why a GitHub source.** This sandbox's egress policy blocks every image host: cdn.21st.dev (the
21st `get_inspiration` tool returned login, product-showcase and 404 results, but none of their
preview images would download), images.unsplash.com, dribbble, awwwards, godly, land-book,
siteinspire, mobbin, jsdelivr, unpkg, wikimedia. Public GitHub reads work, so the reference came
from a repository of real-site screenshots. The same block is why the stamps' default art is
generated: the component ships 16 engraved subjects and takes any photo as a duotone.

## Idea gate (fresh critic)

Five takes on the reference were judged:

1. **postmark-cta**: closing CTA with draggable stamps and a postmark on press
2. stamp-sheet-pricing: pricing tiers as a sheet of stamps, tear one out to choose
3. airmail-newsletter: newsletter signup drawn as an airmail envelope
4. stamp-album-testimonials: customer portraits as stamps hinged into an album
5. return-to-sender-404: a 404 page as a letter returned to sender

Verdict: **build #1.** Rejected #2 (stamp-sized cells hurt the comparison a pricing table
exists for; tearing to choose is a toy that slows conversion), #3 (same job as
wordmark-newsletter-signup; an envelope drawn round a form is decal-over-flat-UI), #4 (overlaps
checker-quilt-testimonials; flip cards are generic; an album page drifts to beige), #5 (a
novelty page with little reuse; a cream letter is the banned tasteful-minimal family). Folded in:
the stamp drop-and-cancel moment (#3) and a real denomination / offer on one stamp (#2). Risks
named: clip-art stamp art, a postmark that blocks the click, a flat cream ground, a squashed
phone layout, jittery drag, template-looking type, a cheap postmark.

## Round 1: REDO (average 7.8)

| | Score |
|---|---|
| Usability | 8 |
| Idea | 8 |
| Craft | 7 |
| Originality | 7 |
| Install-safety | 9 |

Critic's changes, most important first, and what was done:

1. The default voyage scenes were the weakest (Dolomiti peaks as black slabs, a blank white
   wedge on the Portugal headland, crude dune wedges). **Done:** peaks are outlined, faceted and
   striated with hatched shadow faces and no solid black; the lighthouse beam (the white wedge)
   is gone and the headland is hatched and outlined; dunes are rebuilt as curved crests with a
   slip face in shadow that widens as it falls.
2. The postmark covered "from €49" and its bars were grey fuzz running far past the stamp.
   **Done:** it lands on the lower right of the art, never on the label or value; the overhang is
   cut to about 40% of the stamp; the bars are 4-unit ink strokes with a light skip texture. Long
   values ("from €49", "half price") now stack under the label instead of truncating it.
3. The button did not answer hover. **Done:** the pill lifts 2 px, a darker fill floods across
   from the left and the arrow rolls; the ghost postmark preview is at 50% so it reads.
4. Stamps could rest touching the note. **Done:** the safe zone now measures the rotated paper
   (not the upright slot) with a 24 px margin, both on layout and when a thrown stamp comes to
   rest.
5. The posting moment was never seen when the CTA navigates. **Done:** new `postDelay` (default
   0, so navigation is never delayed unless asked; modifier-clicks and `target` links are left
   alone) and an `onPosted` callback.
6. Small art fixes. **Done:** the lemon's leaf has a stalk, the pear's notch is gone (a shading
   floor), and the second-ink plate's misregistration is halved so the sun has no white halo.
