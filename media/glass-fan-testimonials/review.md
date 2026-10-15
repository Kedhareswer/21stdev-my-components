# glass-fan-testimonials: review log

## Reference

Commissioned by hand from the owner's "Client Highlights" section markup: three 340px frosted
glass panes, overlapping by 100px and rotated -10 / -6 / 0deg. Each holds a white testimonial
card with a quote chip, the quote, a hairline, an avatar, a name and role, and a star rating.
The layout, the glass and the card anatomy are kept. The copy, the names and the reference's
images are not reused.

## What was added

- The shuffle (Web Animations API): the front pane lifts out to the right and tucks behind the
  fan. Prev reverses it, and clicking a pane further back shuffles it forward.
- On hover the fan parts, the pane lifts, and it tilts with a glare.
- An avatar strip, a counter, prev / next, and autoplay with a progress ring and a pause button.
  Keys and swipe work too.
- Fitted type shared by every card, a deck layout on phones, `auto` / `light` / `dark` themes,
  palette overrides, and dots / grid backdrops.

## Checks

Screenshots at 1440×900 (light, dark, midnight, hover, mid-shuffle, after next, after 2× prev)
and 375×812 (light, midnight, reduced motion with keyboard). The stripped-height check renders
a 493px stage. `npm run check` and `node tests/glass-fan-testimonials.test.mjs` pass.
images.unsplash.com is blocked in the cloud sandbox, so the screenshots show the initials
fallback where the avatars would be.
