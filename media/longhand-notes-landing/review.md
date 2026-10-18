# longhand-notes-landing: gate log

## Reference

`reference.png`: the owner's screenshot of a handwritten-notes-at-scale service
(line-art robot pen arms, coral dashed flight paths, envelopes and cards, a
serif headline). Used for feel and layout only. The first build reused too much
of it: its headline, sublines, greeting names, sign-offs, eyebrow and title,
nav labels, the chalk "hello" card and the teal ring. Round 1 flagged this, and
all of it was replaced with our own copy and motifs.

Assets: images.unsplash.com was unreachable from the cloud environment, so
everything is drawn in SVG. The handwriting comes from the EMS Allure, Felix
and Elfin single-line fonts (SIL OFL), taken from the `hersheytext` npm package
and re-encoded as compact strokes. The tests caught two encoder bugs:

- line simplification collapsed closed loops, so every "o" disappeared;
- Elfin's ";" carries a stray subpath at x = 4000.

## Round 1 (fresh critic): REDO

u 7 · a 6 · b 6.5 · c 3 · d 9 · e 8 (average 6.6)

- Copy and motifs lifted from the reference. **Fixed:** new headline (*Typed by
  you. Penned + posted.*), CTA, subline, letters, names, composer copy
  (*Keys in, ink out.*), nav and price point ($3.40 flat, from $2.55).
- Hero arrangement copied one for one. **Fixed:**
  - the aside note is now a stack of addressed, stamped envelopes;
  - the chalk "hello" card is now the propped kraft card, set by the `hero.card` prop;
  - the teal ring is now an ink bottle feeding the spare pen arm;
  - the smiley is now a drawn arrow.
- Hero hand, ink and card were hard-coded. **Fixed:** `hero.hand`, `hero.ink`
  and `hero.card` props; the fountain demo changes all three.
- The forearm lay across the line being written. **Fixed:** the shoulder is
  above the frame and the elbow rides up and to the right like a writing hand.
  The letter is set larger (14 to 22) so it fills the sheet. The pace scales
  with the size.
- The chalk and chalk-CTA lettering read as a hollow outline. **Fixed:** the
  stroke is wide enough to fill the double line.
- Steps, pricing and FAQ had no art direction. **Fixed:** the receipt gets a
  handwritten "you save N%" scrawl, and the FAQ gets a handwritten sticky note
  that links to the samples.
- Phone. **Fixed:** the envelope aside is hidden, the stage clips the arm above
  it, the "ink out." arm clears the eyebrow, and the form now comes before the
  stage.
- MAILBOX label collision. **Fixed:** the path re-routed.
- Card cover occluded its neighbour. **Fixed:** the card now flips 180 degrees
  in place, with the printed inside on its back.
- Bugs:
  - `.lnh-fold` is now a toggle `button` with `aria-pressed`.
  - Hero timers are pruned each cycle and skip while off screen.
  - The composer and pricing are seeded from props once; this is documented
    (reset with `key`).
  - The `stuck` nav reads the root's rect on captured scroll, so it works
    inside scrolling containers.
  - `useLayoutEffect` is now an isomorphic layout effect.
- Not changed: the grey paper ground. The owner asked for this reference's
  feel, and the line-art robot world carries the art direction.
