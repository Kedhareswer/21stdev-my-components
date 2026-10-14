# kamm-trek-landing: gate log

## Reference

`reference.png`: the homepage hero of **https://www.nationalparks.org** (National Park
Foundation), taken from the screenshot Tailwind publishes in its public showcase
(`tailwindlabs/tailwindcss.com`, `src/app/showcase/img/nationalparks.org.png`,
https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/app/showcase/img/nationalparks.org.png).
Kept: a full-bleed, dramatic mountain landscape filling the first screen at golden-hour light,
receding into haze; a large calm headline bottom-left over a dark scrim with one short
paragraph; a solid button bottom-right; a thin top nav with a solid button. Grand, outdoorsy,
trustworthy. Not copied: the brand, logo, copy, photo or the serif type.

Why that source: this run's network policy refused every design gallery and image host
(awwwards.com, godly.website, land-book.com, dribbble.com, images.unsplash.com,
cdn.21st.dev, picsum, wikimedia, jsdelivr, unpkg). `get_inspiration` answered, but its
`previewUrl` images could not be downloaded. Only GitHub and npm were reachable, so the
reference came from a public design-gallery repo. For the same reason the landscape is not a
photo: it is a generated relief model, rendered on a 2D canvas (and every hut takes an
`image` prop for real photos).

## Idea gate (2026-10-14)

Five takes went to a fresh critic: Kamm hut-to-hut treks (Swiss topographic map), Parkfund
conservation membership (screen-print landscapes), Nachtlinie sleeper trains (window view +
departure board), Saltmarsh sea-kayak outfitter (nautical chart + tide clock), Firnline
avalanche forecast app (slope-angle relief).

PICK: **Kamm**. Guided treks you can book are a real product; the signature (an elevation
profile linked to the map marker, the hut card and the day's numbers) helps someone choose a
trek rather than decorating the page; departures with places left and a hold form make it
shippable; cartography is on the brief's list of art directions the owner keeps.

Rejected: Parkfund (layered flat-ink mountains are the most overused landscape hero and slide
into clip-art; "more trees for a bigger gift" is toy gamification), Nachtlinie (a window frame
loses the reference's full-bleed vista; split-flap boards are a trope), Saltmarsh (a nautical
chart repeats sectional-chart-landing; the tide clock is an instrument demo), Firnline (an
educational toy, the material/physics-demo failure again).

Must get right (from the critic): keep the reference's grand vista (perspective relief, low
golden sun, haze; headline bottom-left over a scrim, solid button bottom-right); the relief
must read as real terrain (hillshade, index contours, glacier blue, red trail), not
isoline-bloom wallpaper; no cream paper or serif; profile to map link flawless with pointer,
touch, keys, aria-live and a still state under reduced motion; never a map demo (real dates,
places left, working hold form, specific copy); the map language in every section; hut cards
default to relief crops, with an `image` prop; render cheaply on a 2D canvas inside a pixel
budget; props for brand, copy, stages, departures, two presets and a seed; a designed phone
layout.

## Critic round 1 (fresh subagent)

Banned-looks gate: passes (reference layout kept; the map language runs below the hero).

| | Score | Evidence |
|---|---|---|
| (u) usability | 7 | real props (`stages`, `departures` + `onHold`, `preset`, `accent`, `seed`) and a working hold flow, but much UI copy is hard-coded ("Walkers" on a ski tour); peak names drift with viewport |
| (a) idea | 7 | keeps the reference composition; relief reads as a CG model, soft green foreground |
| (b) craft | 6 | hard orange sky stripe, trail fragments behind ridges, unreadable pin label on snow, winter streaks, pins colliding with the headline at phone/tablet, dark full-page capture lost a section head |
| (c) originality | 7 | relief hero, printed sheet, profile-driven walker and hut stamps come from the subject |
| (d) install-safety | 9 | checks pass, scoped CSS, react only, no URLs |
| (e) template | 8 | functional throughout, real copy, designed dark mode |

Average 7.33. **REDO.** Fixes asked for, most important first: continuous sky, trail shown
faint behind ridges instead of dropped, plates under pin labels, foreground detail, no winter
streaks; collision pass for hero pins and keep them out of the headline; peak names stable
across widths; a `labels` prop for all UI copy; more map language below the hero (section
collars, map behind the closing CTA); reveals that never hide content; ruled reviews starting
at the text; a cleaner trail-sign blaze; no shift on the active hut; phone departure status
under the meter; re-shoot focus and success states.

## Critic round 2 (new subagent)

Banned-looks gate: passes; the map language keeps the lower page out of the "tasteful minimal" family.

| | Score | Evidence |
|---|---|---|
| (u) usability | 7 | excellent props (`labels`, computed `stages`, `onHold` with error, waitlist and done) but the hero cannot take a photo of the installer's own range; winter demo shows summer guide copy |
| (a) idea | 8 | relief hero matches the reference composition; map language through the page |
| (b) craft | 7 | trail stops short of the last pin under the scrim; labels on the trail; night-1 hut missing; murky dark hero with a flat horizon band; "6 kg" descender; stamp ring text runs end into start; clipped signpost tip; phone tabs cut mid-word |
| (c) originality | 8 | profile-driven walker on a printed relief, signpost, hut stamps |
| (d) install-safety | 9 | all gates pass, software-renderer safe |
| (e) template | 8 | functional, real copy, dark mode, reduced motion, focus, menu |

Average 7.83. **REDO.** Fixes asked for: a photo option for the hero with positioned pins;
pins above the scrim, the trail reaching the last stop, every hut in view, labels kept off the
trail, fewer labels on phones; a stronger dark relief and a soft horizon; spacing under the big
figure; stamp ring text with a separator and a date inside the ring; winter guide copy; a
solid signpost tip; phone day tabs that read as scrollable; draped contours fading with
distance; trail casing drawn with the line; guide badges in the map language.
