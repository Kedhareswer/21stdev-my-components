# callsign-radio-landing: gate log

## Reference

`reference.png`: the homepage of **https://www.theverge.com**, taken from the screenshot Tailwind
publishes in its public showcase (`tailwindlabs/tailwindcss.com`,
`src/app/showcase/img/theverge.com.png`). Kept: a dark page, a giant vertical masthead running
the full height of the left edge, a feature slot where a heavy headline overlaps a big image, a
right-hand "storystream" rail of timestamped items with coloured avatar dots, and a tight
slash-separated top nav. The feel is loud, editorial and live. Not copied: the brand, logo,
copy, photos or icons.

Why that source: this run's network policy blocks every image host (images.unsplash.com,
cdn.21st.dev, awwwards.com, godly.website, land-book.com, dribbble.com). `get_inspiration`
answers, but its `previewUrl` images can't be downloaded. Only public GitHub reads work, so
the reference came from a public design-gallery repo. For the same reason the page draws its
show artwork as generated two-ink riso prints in SVG. Every show and episode takes an `image`
prop for real photos.

## Idea gate (2026-10-14)

Five takes went to a fresh critic: Kora 98.4 (independent radio station), Dispatch (paid
newsletter), Pressing Plant (record label shop), Shiplog (changelog-led dev tool), Reel House
(repertory cinema).

PICK: **Kora 98.4**. A station homepage is a real job: a working player and today's schedule.
The signature is functional, not decorative: the call sign's letters are the level meter. The
vertical masthead, the live rail and the heavy feature headline map straight onto the
reference. Nothing in components/ is close.

Rejected: Dispatch (the bland editorial family, its hover-to-swap is just a tab), Pressing
Plant (record-out-of-sleeve is the stock music trick, typographic sleeves without photos read
as generated), Shiplog (the stock SaaS skeleton with the idea only in the hero), Reel House
(lives on poster photos, which are blocked; overlaps open-slot-booking and the film-grain
preloaders).

Must get right (from the critic): no autoplay; a real `<audio>` with play/pause, volume, mute,
a stalled/error state with retry; the meter uses an analyser only when a `corsMeter` prop says
the stream sends CORS headers, otherwise a believable simulated envelope, flat when paused;
draw the call sign as SVG letters (no web fonts, Impact varies by OS) with a hidden text h1;
at 375 px the call sign runs horizontally; the clock follows a `timeZone` prop through Intl,
with an on-air tally, elapsed bar and minute refresh; schedule rows preview the show in the
feature slot with "back to live"; covers are two-ink riso prints with an `image` override; the
radio language (timecodes, tally lights, a tuner) runs through every section; palette: carbon
`#0D0E0C`, chalk text, on-air red `#E5402A`, colour only from each show's riso ink pair, no
glow, no neon, no purple-blue, no cream; light mode is a true white ground; a second preset
"daytime" community FM on signal yellow that looks like a different station.
