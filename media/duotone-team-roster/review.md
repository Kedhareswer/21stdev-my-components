# duotone-team-roster: review log

## Reference

`media/duotone-team-roster/reference.png` is the hero of https://meetyourlegend.com (a mentoring
school for VFX and animation). The screenshot comes from the public design-gallery repository
https://github.com/Landing-Pages-Websites/inspiration-library, entry `lapa-ninja-2026-0455`,
which was harvested from lapa.ninja. It shows a hot orange field that burns down to oxblood at the
edges, a heavy extended grotesk headline ("MEET / YOUR / LEGEND") set huge in cream at the bottom
left, and three tall, staggered columns of portraits. Every portrait is pushed into one warm duotone
and carries a small dark chip naming the person's craft.

We took the feel and layout from it and nothing else: no brand, copy, logo or images.

**Why a GitHub source.** This sandbox's egress policy blocks every image host: cdn.21st.dev (so
`get_inspiration` found results but none of their `previewUrl` images would download),
images.unsplash.com, picsum, awwwards, godly, land-book, dribbble, pexels and wikimedia. Only
GitHub and the package registries are reachable.

**Why the screenshots show different faces from the defaults.** images.unsplash.com is blocked
here, so in the screenshot browser each default Unsplash URL was routed to a stand-in Unsplash
portrait from a public template repo (creativetimofficial/notus-react and
creativetimofficial/material-kit on GitHub). The component ships with the real `images.unsplash.com`
URLs. Those ten portrait IDs are the ones the owner already uses in `hover-expand-gallery` and
`checker-quilt-testimonials`, and they render on 21st. The local `thumb.webp` was shot with the
stand-ins too.

## Idea gate (fresh critic)

Five takes on the reference were judged:

1. duotone-team-roster: a team section with a headline and drifting tritone portrait columns
2. speaker-lineup-band: the same idea as a conference speaker line-up
3. mentor-match-section: discipline words that re-sort the mentors, with booking
4. hiring-wall: empty frames for open roles in a team grid
5. portrait-headline-reveal: huge names that reveal a portrait on hover

Verdict: **build #1**. The library had no team or "meet the people" section. #1 keeps the
reference's ember-to-oxblood field, the huge cream headline and the staggered duotone columns
with craft chips, and it avoids every Banned look.

- #2 was rejected as #1 plus session times, and the brief rules out event pieces.
- #3 was rejected as a niche marketplace widget that turns into dashboard churn.
- #4 was rejected as a gimmick that only helps while a team is hiring.
- #5 was rejected as a worn-out trope, too close to flashlight-text-reveal and pigment-experience-ledger.

**Folded in:** `openRoles[]` from #4, off by default and shown in the second demo, and a second
preset demo (cobalt). **Cut:** discipline filter chips and the side bio panel; the chip unfolds in
place instead. The colour bloom stops at about 70% so the unified tritone keeps its hold.
**Risks named:** the system-font headline going bland, the drift reading as a stock marquee, a
duotone that looks like a tint, the mobile layout, and install safety. Each was addressed in the
build: a fitted, stretched heavy face; slow opposed drift with phase offsets that pauses on
intent; an SVG tritone filter; a designed phone strip; and a definite height, `max-width: none`
on images, and scoped CSS.

## Skills used

- Gate: `design-ui-ux/awwwards` with `concepts.md`, `art-direction.md` and `quality-bar.md`,
  plus `design-ui-ux/design-taste-frontend` and `frontend-web/frontend-design`.
- Build: `21st-dev/21st-create-component` and `design-ui-ux/emil-design-eng`.
- Before the critic: `animation-motion/transitions-polish`, `21st-dev/21st-ui-review` and
  `design-ui-ux/user-interface-guidelines`. Hover and open timings came down to 300 ms or less,
  closes became faster than opens, the box-shadow animation moved to pseudo-element opacity, the
  invalid list and `aria-expanded` semantics were removed, and `font-synthesis: none` was added.
  The `21st review` CLI was not run, because no 21st sign-in is allowed in these runs.

## Critic rounds
