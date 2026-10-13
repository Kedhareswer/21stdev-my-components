# guilloche-enamel — critic rounds

## Idea gate (2026-10-13)

Five candidates: ebru marbling bath, ferrofluid wordmark, guilloché enamel dial, Alexeieff pinscreen,
soap-film frame. PICK: 3. "A material nobody has on the web; fits practical light / believable
material; luxury, fintech and watch brands would pay for it as a hero surface." Must be real per-pixel
groove geometry with anisotropic glints along the tool marks, enamel with depth, a finished first
frame, no watch-face kitsch. Killers: moiré, flat plastic enamel, glint invisible in a still.
Rejected: marbling (third ink piece, drop rings repeat anodized-ink), ferrofluid (too close to
holo-chrome-flow, mush under swiftshader), pinscreen (desk toy, grey static), soap film (oil-slick
rainbow, toy pop).

## Round 1 — REDO (a 7 · b 6 · c 6 · d 9)

1. Coat softbox reflection is a hard rounded rectangle: reads as a pasted decal (intro, reduced, lamp-left).
2. Intro blank is near-black navy, not polished silver; beads exist before anything is cut.
3. Default cobalt crushes half the frame; silver never flashes through the enamel; reads CD / speaker cone.
4. Zone order reads wrong: the 36-lobe rose ring throws the sunburst bands, the outer rays read as dead satin; no rosette form.
5. Press-and-hold blows the spiral out to a cyan bullseye.
6. Mobile: rose cuts become chunky squiggles, bottom third empty; picker overflows at 375 and is a glass pill.
7. Perf: 4x SS at 1.5 DPR plus idle drift never stops.
8. Docblock says clous de Paris, README overclaims "does not moiré".

Changes after round 1: coat gloss became a feathered ellipse at 0.5 gain; the blank is polished and mirrors a
feathered lamp; beads appear only as the cutter passes; cobalt lightened with more room fill (upper-right
quadrant 28% mean luminance); 14-lobe rosette petals; flame-swayed sunburst; soft-capped lamp and LOW 0.4;
2x supersampling on HiDPI and software renderers, 30 fps idle; phone scale and centre reworked; picker solid,
wrapping, swatch-only under sm; docblock fixed.

## Round 2 — REDO (a 7 · b 6 · c 6 · d 9)

1. Reads as spun / circular-brushed aluminium (CD, speaker cone): no crossing lattice, which is what makes guilloché recognisable.
2. Enamel never reads as glass: coat gloss invisible head-on; pooled vs ridge contrast too low.
3. Beads read as matte grey strokes, not polished mirror beads.
4. Pitch coarse on phones (vinyl / hypnotic spiral).
5. Pixel knot at the spiral singularity; wants a centre boss.
6. Intro first frame is a flat gradient with a blurry oval: engine-turn bare silver, then fire the enamel.
7. Composition crops the outer bead; demo leaves the quiet side empty, wants real copy.
8. README stale (36 lobes, straight rays, 4x); fallback breaks on 3-digit hex; radiogroup lacks arrow keys; idle drift forever.

Changes after round 2: the rose ring became barleycorn (two 48-lobe rose-engine passes half a lobe apart, deeper
cut wins); chrome beads (mirror the bright ceiling) with a dark cusp either side; a polished boss over the spiral
centre; enamel pools harder (thickness 1 + 1.3 depth); a defined feathered-oval gloss on the fired coat; intro cuts
bare silver then fires the enamel in over 0.6 s; demo-hero with real copy on the quiet side; idle drift at 20 fps;
README corrected; fallback colours through rgba(); picker uses aria-pressed buttons.
