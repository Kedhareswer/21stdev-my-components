# Guideline Fan Preloader

A print-layout preloader in four scenes, cut like a title reel, and looping. Dashed guides slide and open around a condensed wordmark and a fan of photos. A flurry of photos collapses into a red cell, where the same photos come back as a turning cube. The palette inverts and a ring of five frames pops in and orbits. Three words pop in, then a mounted print slides on, spins and settles showing its other side. A whip pan hands back to the start.

```tsx
<GuidelineFanPreloader text="Slow North Studio" />
```

It loops until you unmount it. To use it as a page gate, play it once: it pans away, reveals its children and calls `onComplete`.

```tsx
<GuidelineFanPreloader loop={false} scenes={1} onComplete={() => console.log("in")}>
  <YourPage />
</GuidelineFanPreloader>
```

**No dependencies.** One `requestAnimationFrame` loop writes CSS variables and transforms. The geometry is container units, so nothing is measured. The three solids are plain CSS 3D (`preserve-3d`) boxes textured with your own pictures: no canvas, no WebGL, no model files.

## Props

| Prop | Default | |
|---|---|---|
| `text` | `"Slow North Studio"` | Scene 1 wordmark. One word per line, or pass `\n` to pick the breaks. Words longer than six letters step the size down |
| `title` | `"Full Circle"` | Scene 3 title, two lines beside the white cell |
| `headline` | `"Made to move"` | Scene 4: three short words that pop in one by one, then sit small beside the print |
| `scenes` | `4` | How many scenes play: 1 (3.3 s), 2 (8.1 s), 3 (12.7 s) or 4 (18.6 s) |
| `loop` | `true` | Run the reel over and over. `false` plays it once, then exits |
| `duration` | the reference's own pace | Seconds for one pass, closing pan included. Scales every timing |
| `onComplete` | none | With `loop={false}`: fires once, when the overlay has left the screen |
| `children` | none | With `loop={false}`: the page underneath. Mounted from the start, `inert` until the exit ends |
| `images` | seven catalog photos | Seven square pictures. Index 3 leads the fan and fronts the print. The same seven build the cube and the ring, and are regraded (mono, cream, red duotone) for the corner cells |
| `labels` | see the source | Small print for every scene. Any key left out keeps its default |
| `counterLabel` | `"Loading"` | Word before the live 000 to 100 counter in each scene. `""` drops it |
| `place`, `region` | `"OSL"`, `"NOR"` | The pin badge in scene 1 |
| `paper`, `ink`, `accent` | built-in light and dark palettes | Overlay colours |
| `height` | `"100svh"` | Root height. A definite length, never a percentage |
| `fontHref` | Google Fonts: Anton, Montserrat | Pass `null` if the host already loads them |
| `className` | none | Extra classes on the root |

## How it works

**Timeline.** `gfpPose(t, scenes)` is exported and pure: reference seconds in; guide positions, seven card poses, the cell block, the solid's turn and the pans out. Its numbers were read off the reference frame by frame on a 720 x 540 canvas at 30 fps. The guides were tracked by script on every frame.

**The solids.** The reference turns a chair, a croissant and a bicycle in scenes 2 to 4. Here those three slots are played by solids made from the photos, so the reel is about your pictures and stays sharp at any size. Their entrances, sizes, positions and turns keep the reference's timing: the cube fades in as the red cell fills, the ring pops in at half size and overshoots to 132%, and the print follows the bicycle's measured spin.

| Time | Stage |
|---|---|
| 0 to 0.4 s | Right guide slides from 32.8% to 61.3% of the width (exponential settle, 85 ms time constant) |
| 0.53 to 0.83 s | Frame opens to 11.5% / 76.5% across and 13% / 85.7% down (cubic ease-out) |
| 0.9 to 1.03 s | Pin, then place name, fade in |
| 1.3 to 1.75 s | Lead card pops at half size, overshoots to 111%, settles |
| 1.7 to 2.05 s | Six cards fan out, one ring 40 ms after the other |
| 2.43 to 2.64 s | Staircase: each card rises or drops on its own delay |
| 2.83 to 3.23 s | Sweep over the top and out to the right, from 11 measured key frames |
| 3.17 to 3.27 s | Whip pan left, cut. Scene 2 arrives 73 px to the right and settles |
| 3.43 to 4.55 s | Six photos fly up from the bottom-left corner into the centre and shrink to a dot |
| 4.55 to 4.75 s | The dot grows into the red cell; the grid opens; the photo cube fades in and turns |
| 7.9 to 8.0 s | Whip pan down, cut. Scene 3 drops in from 177 px above |
| 8.7 to 9.17 s | The white cell opens; the ring of frames pops in oversized and settles by 9.6 s |
| 11.0 to 12.3 s | The grid pulls back, then zooms in 1.85x |
| 12.63 to 13.4 s | Cut to the zoomed grid; three words pop in 55 ms apart; the grid zooms out |
| 13.4 to 14.1 s | Cut to the print layout; a bright block strobes in the cell, one frame on and one off; the print slides in from the right |
| 14.3 to 15.3 s | The cell stretches to hold it, then the frame re-centres |
| 15.4 to 18.0 s | Spin: face-on to 128 degrees, hold while the view zooms to 1.66x, come edge-on at 17.0 s, whip through face-on in a tenth of a second and settle on its other side |
| 18.4 to 18.55 s | Whip pan right, back to the start (or off the page, with `loop={false}`) |

`duration` scales the whole table. With `scenes` below 4 the closing pan starts where that scene ends.

**Sizing.** One unit is `min(100cqh / 540, 100cqw / 720)`. Guides are placed in percent of the stage and snapped to whole pixels; type and solids are sized in units, so the layout holds at any size. On screens wider than 4:3 the cards get an extra push so they still enter and leave at the screen edge on the same frame.

**Light.** Each face of a solid carries its outward normal. The same rotation matrix that turns the solid dims the faces turned away from the light, so the cube and ring read as volumes rather than flat pictures.

**Loading.** The sequence starts once the fonts and the seven pictures have decoded, or after 2.5 s without them.

**Flashing.** The reference strobes the scene 4 block four times in a quarter second. This keeps three, the limit WCAG 2.3.1 sets for one second.

**Reduced motion.** No choreography and no strobe: the open frame with the fan is held. With `loop={false}` it holds for up to 1.6 s, then fades.

**Assets.** The default pictures are served from `kedhar-components.pages.dev/guideline-fan-preloader/`. Pass your own through `images`.

Run the check: `node tests/guideline-fan-preloader.test.mjs` from the repo root.
