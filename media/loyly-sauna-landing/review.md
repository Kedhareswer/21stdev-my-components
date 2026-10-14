# loyly-sauna-landing: gate log

## Reference

`reference.png`: the owner's own "safety orange halftone" style image, from
`kedhar_brain/agents/skills/document-processing/guizang-ppt-skill/assets/screenshot-backgrounds/style-b/safety-orange-halftone.webp`
(style B "Swiss International": Vignelli and Helvetica, hairline grid paper with
registration marks, two inks only, safety orange and black halftone, no gradients,
shadows or radius, extreme type-size contrast).

Why not a web reference: on 2026-10-13 the cloud environment's network policy
refused every image host (cdn.21st.dev, 21st.dev, images.unsplash.com, awwwards.com,
godly.website, land-book.com, dribbble.com, pexels, picsum, jsdelivr), and WebFetch
could not resolve them either. `get_inspiration` returned results, but their
`previewUrl` images could not be downloaded. The owner was notified. For the same
reason the page uses generated canvas halftone art and no photos, so the cloud
screenshots show what 21st will show.

## Idea gate (2026-10-13)

Five takes went to a fresh critic: Löyly sauna house, Emberline wildfire detection,
Halfday solar and battery, Roastworks coffee subscription, Thermwell heat pumps.

PICK: **Löyly sauna house**. It is a real business with real UI (a bookable
timetable, memberships, visit). The two inks mean something (heat and cold), and
throwing water on the stones comes from the subject's own world: a ritual, not a toy.
It suits saunas, spas, cold-plunge clubs and bathhouses.

Rejected: Emberline is helicorder-landing again (a hazard site carried by its
medium; the smoke reticle is a demo). Halfday is the stock SaaS skeleton with the
idea only in the hero. Roastworks: roast-level re-inking is a gimmick, and coffee
pages are everywhere. Thermwell: a heat-loss diagram, not a landing page.

Must get right (from the critic): usable before pretty, with working state for
tabs, spots, full sessions, booking, the billing switch and FAQ. Löyly as a real
labelled button, with a capped wave of about 1.5 s. Stay clear of stencil-labs-template:
system Helvetica only, no mono body, no chamfers, no 3D object, no halftone portraits,
no stats strip under the hero. Rooms as a real section. A footer that is not a giant
halftone wordmark. Cool white paper, never cream, with a confident ink mass. Software
renderer safe. Phone layouts designed.

## Round 1 (fresh critic: brief, screenshots, source)

| | Score |
|---|---|
| Usability | 8 |
| Idea | 8 |
| Craft | 7 |
| Originality | 8 |
| Install safety | 9 |
| Template | 7 |

Awwwards lens: Design 7.5, Usability 7.5, Creativity 8, Content 8 = 7.65.
Verdict: **REDO** (average 7.83, two scores at 7).

Changes asked for, most important first: the featured plan's dot strip painted
over its button; the spots meter wrapped to two lines; the throw wave flooded the
hero and showed a hard box behind the copy; the phone hero art was a leftover strip
under the readout; the Klein demo leaked default copy; the room plates' labels read
as stickers over a ragged print; the ritual hover faded too far; the back half
(quote, FAQ, visit) lost the halftone language; the Night/Paper switch was weak and
the FAQ heading left a dead column.

## Round 2 (new critic)

| | Score |
|---|---|
| Usability | 7 |
| Idea | 7 |
| Craft | 7 |
| Originality | 7 |
| Install safety | 9 |
| Template | 7 |

Awwwards lens: Design 7, Usability 7.5, Creativity 7, Content 7 = 7.15.
Verdict: **REDO** (average 7.33).

Changes asked for, most important first: the Klein demo still showed Kiuas sessions,
quotes and FAQ; plan and hero CTAs needed their own hrefs and callbacks, plus a badge and
a way to hide the theme switch; the tablet layout was the phone stack stretched; the
back half needed the print language (quote field, registration marks, less dead
space); the plate numerals were grey, the rest-deck numeral sat on dots, and captions
were on different baselines; the ritual's last block read as a placeholder; the wave
ran behind the headline and CTAs and read as a ripple, not rising steam; dark mode's
cold ink was bright white; the phone FAQ marker sat outside the gutter.

## Round 3 (new critic, the last round)

| | Score |
|---|---|
| Usability | 8 |
| Idea | 7 |
| Craft | 6 |
| Originality | 7 |
| Install safety | 9 |
| Template | 7.5 |

Awwwards lens: Design 7, Usability 7.5, Creativity 7, Content 8 = 7.25.
Verdict: **REDO** (average 7.4, craft below 7). The piece moves to
`claude/review-loyly-sauna-landing` for the owner to judge.

What the critic asked for, most important first: the phone FAQ dot strip sat on
the open question; the quote buttons let the plume show through; the keep-clear
zones left boxy clearings and stray dot patches (tablet hero, the wave around the
headline); the plates had flat slabs behind the numerals; dark mode's grey cold ink
lost the punch; the middle sections went back to plain Swiss layout (dead space
under the timetable, an empty FAQ column); the tablet featured plan stacked too
tall; the form error used no accent. It also felt the hero copied the reference's
diagonal too literally.

### After round 3 (not re-scored)

Fixed in the last commit without another critic, since the brief allows three
rounds: the phone FAQ strip starts below the question; the quote buttons are
opaque; dark cold ink is a deeper #4c535b; the button fill stays inside its
border; the plans stay three across at 768; the invalid email field gets an accent
border and an accent marker; the plate screens run to the top, with the numeral on
a feathered knockout.

Still open for the owner: the clearings around text still read slightly boxy;
the middle sections could carry more of the print; and the hero could move further
from the reference's diagonal.
