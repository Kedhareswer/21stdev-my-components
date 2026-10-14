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
