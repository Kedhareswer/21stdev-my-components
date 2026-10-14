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

### Round 1 (fresh critic): REDO, average 6.8

Scores: usability 7, idea 7, craft 6, originality 6, install-safety 8 (templates N/A).

Banned looks: passes. One risk was flagged: the cobalt preset's soft radial glow sits close to a
stock blue gradient hero.

Changes asked for, most important first:

1. The open card hides the face. Cap the panel, pan the photo up and bring colour fully back.
2. The tritone crushes dark subjects. Soften the curve, lift the shadow end and add a per-member
   exposure.
3. Re-home Pause to the wall corner, styled as a chip. It wrapped to an orphan line at 768 and
   375.
4. The open-role panel slices "You?" in half.
5. Poster energy: let the headline run into the portrait wall, and give the field a hard-edged
   shaped light instead of a blob.
6. The keyboard nudge offset is never reset.
7. UI strings should be props (`labels`).
8. A mouse click on a card does nothing.
9. Semantics: use a disclosure button with `aria-expanded` instead of a focusable article.
10. First paint: no `visibility: hidden`, and use an isomorphic layout effect.
11. The phone strip shows a card sliver at its left edge.

All eleven changes were made. The card is now a `<button aria-expanded>` disclosure with the link
as a sibling. The panel is capped and the bio clamped to two lines (hidden when the card is
narrower than 230px). The photo pans up and the colour returns fully. The tritone curve was
softened and its shadow end mixed 40% toward the field, and `exposure` was added per member.
Pause is now a chip in the wall's corner, or under the strip on phones. The open-role "You?" mark
moves up out of the panel's way. The widest headline line overhangs about 18% into the wall.
A hard-edged dark arc was added to the field. The keyboard nudge eases back on blur, the strings
moved into `labels`, a mouse click follows the person's link, the title has a CSS fallback size
instead of `visibility: hidden`, the layout effect is isomorphic, and the phone strip has a 20px
inset.

### Round 2 (fresh critic): REDO, average 7.4

Scores: usability 7, idea 8, craft 6, originality 7, install-safety 9 (templates N/A). Banned
looks: passes.

Changes asked for, most important first:

1. The overhanging headline covers chips in the first column. Lift the wall above the type while
   a card is open, and anchor first-column chips on the right.
2. A mouse-hover panel can unfold out of sight at the frame edges.
3. The open card still buries the face. Drop the repeated craft line, scale the photo less, and
   do not clip or hide the bio.
4. The tritone midtone is too saturated, so the portraits melt into the field. Use a paler mid
   and give installers control of it.
5. The drift cannot be turned off, and `driftSeconds={0}` makes it faster.
6. Pause placement: it sits on a face on desktop and is an orphan row on phones.
7. Accessibility: folded panels are still read aloud, and the strip has no group label.
8. Safari risk: the SVG filter runs on many images inside animated tracks.

All eight changes were made:

- The first-column chips and panels are anchored on the right. While a first-column card is
  open, the headline eases back into its own column (scaled to 0.84), so nothing slices the type.
- On hover, a card near the bottom edge unfolds its panel from the top.
- The repeated craft line is gone. The photo zooms to only 1.05, and the full bio shows (smaller
  on narrow cards).
- The tritone midtone is a paler mix of `hot` and `highlight`, and the highlight is pushed toward
  `ink`. `palette.mid` is a new prop.
- `drift={false}` (or `driftSeconds <= 0`) gives a still, scannable wall with a sticky headline.
  The cobalt demo uses it.
- Pause is a chip in the top-left corner and first in the tab order. On phones it sits at the
  strip's top-right.
- Folded panels are `aria-hidden` and `visibility: hidden`, and the strip is a labelled group.
- Safari: the SVG filter was kept. The tracks are composited layers (`will-change: transform`), so
  the filtered images rasterise once rather than every frame. The drift also pauses off screen and
  on hover. Teams that want no motion cost at all can use `drift={false}`.

### Round 3 (fresh critic): REDO, average 7.8

Scores: usability 8, idea 8, craft 7, originality 7, install-safety 9 (templates N/A). Banned
looks: passes. Nothing scored below 7, but the average is under the 8.0 needed to SHIP.

Changes asked for, most important first:

1. The overhanging "W" turned see-through over dimmed portraits while a card was open (a
   compositing-order problem with the filtered images).
2. Panels flipped to the top covered the eyes.
3. Cap the colour bloom near 72%.
4. The README disagreed with the code.
5. Pause on phones.
6. Pause on desktop.
7. A plain click on a default portrait opened a mail client.
8. Soften the hard arc.
9. Fill the empty top-left on tablets.
10. Returning to the tab resumed the drift off screen.
11. `.dtr-name` measured the wrong container.

This was the last critic round the brief allows. The clear-cut fixes from it were made and
checked in screenshots, but no fourth critic reviewed them:

- Copy at `z-index: 5` with `isolation: isolate` and explicit grid cells. A zoomed crop confirms
  the W stays opaque. The DOM order is kept so the CTA stays ahead of the portraits in the tab
  order.
- The top flip was removed. A card cut off by the frame now slides into view on hover (it stays
  under the pointer) and eases back on leave. The panel stays at the bottom, `focus` defaults to
  `50% 22%`, and bios hide below a 230px card width.
- The colour bloom is 0.72, and the README matches it.
- Pause sits in the wall's bottom-right corner (z-index 6) and is first in the tab order. On
  phones it sits in the actions row beside the CTA.
- `clickFollowsLink` (default true) never follows a `mailto:`. The cursor is a pointer only when a
  click does something.
- The arc's edge is feathered from 72% to 100%.
- Two-column layouts split 50/50, so the tablet headline grows from 96px to 117px.
- Out-of-view and tab-hidden are now separate states.
- `.dtr-name` uses `clamp(15px, 7cqw, 19px)` against the card.

**Outcome:** no SHIP after three rounds, so per the brief the piece is kept on
`claude/review-duotone-team-roster` for the owner to judge.
