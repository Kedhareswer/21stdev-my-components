# hitch-cargo-landing: gate log

## Reference

`reference.png`: the hero of **https://slate.auto** (Slate Auto's truck site), taken from the
screenshot Tailwind publishes in its public showcase, `tailwindlabs/tailwindcss.com`
`src/app/showcase/img/slate.auto.png`. Kept: a charcoal page, a big rounded dark panel, a
heavy all-caps two-tone headline, the product standing in a carousel with round arrow buttons,
segmented ticks with a counter and caption, one hot signal-colour button. Not copied: the
brand, the truck, the copy, the logo or any image.

Why that source: this run's network policy blocks every image host (images.unsplash.com,
cdn.21st.dev, awwwards.com, godly.website, land-book.com, dribbble.com, wikimedia), and
WebFetch cannot resolve them either. Only public GitHub reads work, so the reference came from
a public design-gallery repo. For the same reason the page draws its product in SVG instead of
using photos (each build accepts an `image` prop).

## Idea gate (2026-10-14)

Five takes went to a fresh critic: Hitch (modular cargo e-bike), Brick (stackable home
battery), Vanbay (camper-van interior plan), Tiller (electric outboard), Rail (steel shelving).

PICK: **Hitch**. One plain base product that becomes many things is exactly what the
reference's carousel is for; a cargo bike is sold by its configurations, so the carousel and
the configurator have a real job.

Rejected: Brick (stacked grey boxes, no silhouette, a generic calculator), Vanbay (a floor
plan loses the side-on hero; drag-to-arrange is a planner tool), Tiller (the product is a
speck on each boat), Rail (grids of rectangles, the bland furniture-planner family).

Must get right (from the critic): a true side elevation with filled tonal planes and a ground
shadow, never children or clip-art; the frame stays still while parts swap; the reference's
working controls; stay clear of exploded-assembly-scroll (no isometric, no orange flood, no
italic mono) and stencil-labs-template; the catalogue language carried into every section; an
honest configurator (shared mounts swap); a reserve form with no payment fields; light mode as
cool concrete grey, never cream; a fleet preset that looks like a different company.

## Critic round 1 (fresh subagent)

Reading: a modular-longtail landing built on Slate's hero; one fixed frame where numbered parts
drop on and off, then the same drawing runs a configurator, a dimensioned spec sheet and a
reservation form. Banned-looks gate passed.

| u usability | a idea | b craft | c originality | d install-safety | e template | avg |
|---|---|---|---|---|---|---|
| 6 | 7 | 6 | 6 | 8 | 7 | 6.7 |

Verdict: **REDO**. Main findings: the product was closed (a fixed union of 8 parts, fixed
mounts, fixed art; a build photo only replaced the hero); no way to hide or reorder sections;
a built-in sticky header and hard-coded ids that collide with a host page; English UI strings
outside props; a synchronous `onReserve` that claimed an email was sent; an "HX-" code on
Kerbside. Hero: a dead band under the headline, a grip and a tag straddling the card edge, a
small bike on phones, dead space on tablets. Drawing: a floating battery, plain grey cases, a
kid seat that read as an empty cage, a crate with no stays. Footer wordmark stretched. Tablet
spec table and FAQ cramped. Theme flipped after mount (light flash in dark hosts). Phone menu
without a backdrop.

## Critic round 2 (new subagent)

| u usability | a idea | b craft | c originality | d install-safety | e template | avg |
|---|---|---|---|---|---|---|
| 7 | 7 | 7 | 6 | 9 | 7 | 7.17 |

Verdict: **REDO** (originality below 7). Findings: under reduced motion the hero skipped to
build 2 on load (the tick animation ended at .01 ms before the preference was read); the phone
configurator gave no visible feedback below the fold; the catalogue idea stopped after the spec
sheet (riders and ownership were ordinary rows); the phone hero cropped the rear deck; faded
neighbour bikes painted over the headline card; dark-mode spec drawing lost its fork and bars;
part art flatter than the frame; small phone ticks; a thin success state; a forced `<main>` and
`<h1>` when embedded; the fleet preset mostly a recolour; a lower callout crowding the caption.

## Critic round 3 (new subagent, final round)

Reading: a Slate-style product landing for a modular electric longtail; the hero is a carousel
of builds on one frame with part-number callouts, and the configurator, the dimensioned spec
drawing, the dimension-line timeline and the reserve flow keep the "parts catalogue on charcoal
sheets" language. Banned-looks gate passed.

| u usability | a idea | b craft | c originality | d install-safety | e template | avg |
|---|---|---|---|---|---|---|
| 8 | 8 | 7 | 7 | 9 | 8 | 7.83 |

Verdict: **REDO**. Nothing below 7; the critic called every missing point "a fixable craft
defect, not a concept problem". Three rounds are spent, so the piece goes to
`claude/review-hitch-cargo-landing` for the owner.

Fixed after round 3 (not re-scored): ownership steps share one baseline; the phone dock shows
only between the drawing scrolling away and the button arriving (measured on scroll, since an
observer misses a jump past the drawing) and takes no space when hidden; "with two" range copy
rewritten; every callout leader vertical; kid seats drawn as shells with harnesses and rail
clamps; the hero bike rides higher into the headline card on desktop; phone hero copy moved
under the headline; the monthly label shortened and stats bottom-aligned; dark-mode paper
sheets lifted with a hairline.

Left for the owner: the section order is still close to a familiar product page (hero,
configurator, specs, steps, testimonial, form, FAQ, footer); the template only fits a modular
product drawn in a 1000 x 600 plate; the flat vector bike is less arresting than the reference's
photo (any build can take `productImage` and part `image`s once photos load).
