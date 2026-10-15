# earth-limb-landing: gate log

## Reference

`reference.png`: **jpl.nasa.gov**, the Jet Propulsion Laboratory home page (a static capture and
eight frames of a scroll-through, taken from the tailwindcss.com showcase in
github.com/tailwindlabs/tailwindcss.com, `src/app/showcase/img/jpl.nasa.gov.png` and
`public/showcase-videos/jpl.nasa.gov.mp4`). What it gave us: a cinematic full-bleed planet limb
behind the hero, a small accent kicker over a bold sans headline bottom-left, a translucent
strip of "what we do" pillars along the bottom of the hero, a live data strip under it
(missions, a running clock, which antenna is transmitting), a statement with a side card,
a spotlight on one machine with spec fields and two buttons, news carousels, and a deep
navy sitemap footer topped by a landscape band. Nothing of JPL's brand, copy, logo or
images is used.

Why this source: on 2026-10-15 the environment's network policy refused every image host
again (cdn.21st.dev, images.unsplash.com, awwwards.com, godly.website, land-book.com,
siteinspire.com, dribbble.com, picsum). `get_inspiration` answered but its preview images
could not be downloaded. Public GitHub repositories could be cloned, and the Tailwind CSS
site keeps screenshots and scroll videos of 63 real production sites in its repo, so the
reference came from there. For the same reason every image in the page is generated.

## Idea gate (2026-10-15)

Five takes went to a fresh critic, all built on the reference's layout and its "an
institution doing something real right now" feel: a night-train operator, an ocean
research institute, a community wind co-op, an electric ferry line, and an Earth-imaging
satellite company.

PICK: **Earth-imaging satellite company.** It is the most faithful to the reference
(Jupiter's limb becomes Earth's limb, same composition and scale), companies like it sell
exactly this product with exactly this page shape, and its art is the one that generated
code can make convincing: an atmosphere rim, a terminator, cloud fields and sun glint need
no invented landforms, and top-down farmland, flood plains and harbours generate well.

Rejected: the night train repeats an earlier gate's rejected sleeper-train and layered
flat-ink mountains (clip-art risk, too close to kamm-trek); the ocean institute is a
textbook diagram in the helicorder family; the wind co-op is the stock clean-energy
vector illustration; the ferry line repeats the layered-landscape problem.

Must get right (from the critic): a photographic limb with a hairline atmosphere, never
neon or purple glow; no fake continents; frame one finished on a software renderer; one
signature tied to the live strip (satellites placed by a real orbit model, next pass
over your city from the time zone, never a location prompt); imagery tiles that look
like satellite imagery with a true-colour against NDVI / radar compare that works by
pointer, touch and keys; a working tasking form; the orbital language carried through
every section; the spacecraft as a technical line drawing in the spotlight only; our own
brand; props and two presets; a designed phone layout.

## Round 1 (fresh critic: brief, screenshots, source)

| | Score |
|---|---|
| Usability | 7 |
| Idea | 7 |
| Craft | 6 |
| Originality | 7 |
| Install safety | 9 |
| Template | 7 |

Awwwards lens: Design 6.5, Usability 7.5, Creativity 7, Content 8 = 7.05.
Verdict: **REDO** (average 7.17, craft below 7).

Changes asked for, most important first: the footer newsletter covered a sitemap column;
brand and fleet defaults leaked into the second demo (Kestrel spacecraft and footer, 18
satellites against a lede of twelve, a coastline use showing houses); radar tiles read as TV
static; toy imagery (identical houses, flashlight wakes); the dawn hero's lower half was a
dark smear; the ground track ran through the hero copy, worst on phones; the tab focus ring
was clipped; the form's email error read as a hint and the done state collapsed the panel;
dead space under the statement; no way to drop sections; the theme toggle sat in product
chrome; a stray satellite floated in empty space.

## Round 2 (new critic)

| | Score |
|---|---|
| Usability | 7 |
| Idea | 7 |
| Craft | 6 |
| Originality | 6 |
| Install safety | 9 |
| Template | 8 |

Awwwards lens: Design 7, Usability 7.5, Creativity 6.5, Content 8 = 7.15.
Verdict: **REDO** (average 7.17, craft and originality below 7).

Changes asked for, most important first: carry the orbit language below the hero (a live
ground-track map instead of the text roster, instrument chips, dark pages or imagery bands
so the page does not turn into a grey corporate page); the broad sun-glint lobe read as a
smudge behind the headline; the phone newsletter input collapsed; the tab focus ring cut
letters; the maritime compare showed no ships on the radar side; the stats row mixed mono
and grotesk at display size; a hard-coded footer band, no hero photo option, un-namespaced
tooltip ids; soft CG clouds; tasking step copy promised field IDs the form lacks.

## Round 3 (new critic, final round)

| | Score |
|---|---|
| Usability | 7 |
| Idea | 7 |
| Craft | 6 |
| Originality | 7 |
| Install safety | 9 |
| Template | 8 |

Awwwards lens: Design 7, Usability 7, Creativity 7, Content 8 = 7.1.
Verdict: **REDO** (average 7.33, craft below 7 for the third round). The piece moves to
`claude/review-earth-limb-landing` for the owner to judge.

What the critic still saw: generated imagery that reads as toy-like in places (the
suburb grid around the logistics park, cotton-ball clouds on the maritime optical
side, the forest's rectangular clearings, a uniform-speckle radar card); a round sun
glint that read as a smudge; tile generation blocking the main thread with an unbounded
cache; a map with no land and labels colliding with satellites; no logo prop; footer
and spacecraft defaults that invented facts for any brand; an empty done state; a hard
top edge on the dune band in light mode.

Fixed after the final round (not re-scored): tiles render in 8 ms slices with an
eight-entry cache; the broad glint is gone (only a small specular core is left); map
labels carry a halo and the chosen city's label clears its ring; light-mode night is
lighter; `logo` prop for header, footer and success state; the footer note defaults to
the brand alone; the done state summarises area, window, product and the earliest
pass; the footer band fades in from the page; the forest's rectangular clearings are
gone; the dawn demo's footer band is a coast.

Left for the owner: a coastline layer on the map (no accurate dataset ships in one
file), a non-grid suburb and industrial edge for the site tile, and thinner cloud decks
over the maritime optical view. Real photos through the `image` / `compareImage` /
`photo` props remove most of the imagery critique at once.
