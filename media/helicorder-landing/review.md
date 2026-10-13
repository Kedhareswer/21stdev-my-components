# helicorder-landing — gate log

## Idea gate (2026-10-13), round 1

Five candidates, each a full company page carried by one medium:

1. **Helicorder drum** for Foreshock, an earthquake early-warning service for factories,
   schools, hospitals and rail.
2. **Thermal camera** for Draughtline, home heat-loss surveys.
3. **Chladni plates** for a small loudspeaker maker.
4. **Side-scan sonar** for an offshore seabed survey company.
5. **Green-sand casting mould** for a cast-iron cookware foundry.

PICK: 1. Why the critic chose it: a real instrument and recording medium, and the product
story is in the picture, because the P-to-S gap is the warning being sold. It is cheap to
draw in Canvas 2D, so the first frame looks finished in SwiftShader. Tapping to record a
knock is a tactile interaction in the raked-sand family. Nothing in `components/` is like it.

Why the others were rejected:

- **Thermal:** the ironbow palette is effectively the banned purple-neon gradient, and it
  would read as a decal.
- **Chladni:** an overused creative-coding demo that overlaps raked-sand-garden.
- **Sonar:** amber-on-black drifts into terminal glow, and it is too close to
  sectional-chart-landing.
- **Foundry:** the pour would need a fluid sim that would not finish in software.

The critic's must-get-right list:

- Density: a full, edge-to-edge drum, white paper rather than cream, and smoked soot in
  dark mode.
- Physically real seismograms: P small and fast, S large and slow, a decaying coda, and
  real knock physics.
- A finished first frame.
- Every section on the drum, with no SaaS skeleton.
- Text in quiet bands.
- A calm, scientific tone, not an emergency look.

## Critic round 1 — REDO (a 7 · b 7 · c 7 · d 9 · e 8, avg 7.6)

Reading: "an earthquake early-warning company whose hero is a live helicorder drum record,
a recorded M5.8 marked in red pen, a pen that writes your knock, and a Replay with a countdown."
Hero passes the banned-looks check; below the hero the section order reads as the stock skeleton.

1. Carry the drum through the lower page: UTC stamps in the gutter, the quote as a drill record,
   pricing as a calibration card, FAQ as pen notes on trace fragments, metrics folded into the
   station list.
2. Keep the M5.8 in view (it scrolled under the copy after minutes) and give it a fixed date.
3. Stage Replay where the eye is: countdown by the pen, full-contrast button, coda inside the drum.
4. Halo labels instead of boxes that chop the traces.
5. Remove ghost time labels under the veil.
6. Phone event slot ~0.55 and a lower clip so ALERT/P/S read.
7. Playbook strip axis collision on phones.
8. Footer trace strikes through the wordmark; strum gain too low.
9. Animate the once-a-minute row feed.
10. Visible playbook row hover. 11. Unique ids (useId). 12. Prove keyboard focus.

## Critic round 2 — REDO (a 8 · b 7 · c 7 · d 9 · e 8, avg 7.8)

Reading: "an earthquake early-warning landing printed on a seismograph drum record; every
section argues the company's case as seismograms." Banned-looks gate passes; the stock section
order is saved by working traces in each section, but below the hero the paper goes blank.

1. Make the page below the hero the same drum record: trace rows at the drum's pitch in the ink
   cycle, stamps on those rows, full-width divider rows instead of slivers.
2. Trace shows through the spaces of pen notes. 3. Unmarked time gap between archive and live
   lines. 4. Half-masked ghost stamp under the Replay button. 5. The live alert reads as a pasted
   card; make it pen work and announce only phase changes. 6. Knock too weak; note each knock.
7. Phone drawer CTA oversized. 8. Pricing dashes render two colours. 9. Building field can't be
   cleared. 10. Playbook row/tick link for keyboard and touch. 11. Footer string leaves its box.
12. Section ids collide across instances; color-mix fallback. 13. Tablet gap above the drum.
