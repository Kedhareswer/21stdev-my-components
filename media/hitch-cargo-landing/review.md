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
