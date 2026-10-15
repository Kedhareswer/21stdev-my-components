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
