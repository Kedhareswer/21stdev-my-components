<!-- Read by the cloud forge routines. The owner edits this file to steer them. -->
# Forge brief — the bar every scheduled piece must clear

Repo: this repository (free 21st.dev library of Kedhareswer,
https://21st.dev/@kedhareswer). Read its `CLAUDE.md` and `CONTRIBUTING.md` before building;
every rule there applies (one file, no `h-full`, definite `height` default, scoped CSS, no
generics before the first JSX close tag, tsconfig path line, test in `tests/<slug>.test.mjs`
following the `// #region` pattern, README, `media/<slug>/thumb.webp`).

## 21st compatibility (required for every GPU piece)

21st renders covers and videos with a software GPU (SwiftShader), and real visitors include
big 4K screens and weak laptops. Raked-sand-garden crashed the GPU at 1920px, and
hoarfrost-pane grew no frost in software, until both were fixed. So:
- **Pixel budget:** a per-pixel-heavy shader (ray-marching, shadow loops, simulations)
  holds the canvas to a fixed pixel budget (about 2.2M px on a GPU) and lets the device
  pixel ratio drop below 1 on big screens rather than tripping the GPU watchdog.
- **Software path:** detect a software renderer (`WEBGL_debug_renderer_info` matching
  swiftshader|llvmpipe|software) and start smaller; a simulation measures its own speed and
  coarsens its grid until it can finish growing in time. Frame one must look finished.
- **Prove it:** the cloud has no GPU, so every screenshot is SwiftShader (that is what 21st
  sees). Wait about 10 s before shooting. Blank, bare or placeholder output means it is not
  ready. Keep pieces light enough to look finished in software.

## Who this is for

Pieces people would pay for, given away free. Not AI slop, not generic code. The owner judges
from the finished thing on screen — never pitch in text, never ship a sketch.

## What has landed (the bar)

- **rangoli-preloader** — a powder rangoli that pours itself, grain by grain, as the page loads.
- **murmuration-wordmark** — thousands of starlings fold and roll, then converge into a word.
- **halftone-wordmark-footer**, **weight-sweep-preloader** — one typographic idea, executed perfectly.
- **distressed-denim** — real verlet cloth that tears: the warp snaps, the flap sags, the edge frays into white weft.
- **raked-sand-garden**, **hoarfrost-pane** (forge, 2026-10-13, published) — the owner loved
  both after the critic had discarded them with craft scores of 4–6. That was wrong: a real
  phenomenon (a raked karesansui garden, frost crystals growing on glass) with a working,
  tactile interaction and a finished material look is exactly what this library wants.
  Build more like these. (iron-filings-field from the same batch was declined by the owner.)

Common thread: a real phenomenon or material, physically believable behaviour, a finished
look on the first frame, one strong idea, restraint. Cinematic means realistic (practical
light, believable materials) — never neon.

## What was rejected

Childish or toy-like ideas; generic dashboards/cards/buttons; anything that looks like a
template generator made it; decals painted over a flat image pretending to be physical;
glitchy artifacts (stray fragments, flipped slivers, runaway effects); text pitches and sketches.

Forge pieces the owner rejected (2026-10-13) — never make anything like these:
- **e-paper-tablet-landing** — "very normal and bland". Off-white page, quiet serif headline,
  a tasteful product mock in the hero, then stock sections. Polished, but it is the page
  every AI generator makes. Polish is not taste.
- **letterpress-studio-landing** — same bland family: cream background, serif, product card.


## Banned looks (an automatic SCRAP at the idea gate)

- The "tasteful minimal" page: off-white/beige/cream background, a serif headline, muted
  grey body, one product mock or card in the hero. Bland by default.
- Stock SaaS skeleton: hero → logo strip → 3 feature cards → pricing → FAQ → footer, with
  the art direction only in the hero.
- Seasonal or holiday decoration, clip-art, emoji-like icons, bokeh backgrounds.
- Neon/cyberpunk glow, purple-blue gradients, glassmorphism for its own sake.
- A product mock (phone, tablet, card, dashboard) as the hero idea.

## Templates

Full pages (`<slug>-template` / `<slug>-landing`) are templates, not components.

**Templates the owner kept** (look at `media/<slug>/` covers in the repo before starting):
- **cobalt-toile-landing** — the hero IS an engraved cobalt toile world (arch, statues,
  foliage, moons) and the blue-on-cream engraving language runs through the page.
- **pixel-park-template** — the page is a pixel-art night park with people on benches and
  fireflies you can scatter; the copy floats in that world.
- **stencil-labs-template** — brutalist stencil display type, a hard grid, orange accent,
  a draggable 3D chain, halftone portraits. Every section speaks the same language.
- **long-exposure-agency-template** — prismatic long-exposure light painted behind the hero.

What they share: **a committed art direction** — a medium, a world or a visual language
(engraving, pixel art, stencil/brutalist type, light painting, print process, cartography…)
that fills the hero AND carries through every section, so the whole page could only be
this template. A buyer remembers it after closing the tab.

Still required: a real product or company a team would ship, real copy, real hierarchy,
functional, responsive at 375 / 768 / 1440, dark mode, accessible. Not conference/event
templates. Clean and minimal means disciplined, not beige.

## Craft rules (this cloud run has none of the owner's local skills, so they live here)

- **One point of view.** Build around one idea taken from the subject's own world, not a
  trend. Every static frame is a poster: pause anywhere and type, space and image look
  intentional. Motion amplifies a composition; it never rescues one.
- **One signature moment, executed perfectly;** everything around it quiet and precise.
- **Motion:** ease-out for entrances (about 150–300 ms for UI, longer only for scene-scale
  moves); exits faster than entrances; stagger 30–60 ms; animate transforms, not layout;
  every primary target answers the pointer; honour `prefers-reduced-motion` with a
  finished still state.
- **Materials and light:** practical light, believable materials, a finished first frame.
  Physical pieces use real integration (verlet or semi-implicit Euler, fixed timestep,
  constraint iterations), stay stable at any frame rate and sleep when settled.
- **Templates:** a real type scale (about 3 sizes per section at most), a spacing system,
  real copy for a believable product, a phone layout designed rather than squished,
  visible keyboard focus, body-text contrast of at least 4.5:1.
- **Install safety:** follow CLAUDE.md and CONTRIBUTING.md exactly (one file, scoped CSS,
  no bare `:root`, no `h-full` root, definite `height` default, no off-origin assets).
- The critic also uses the Awwwards lens: Design 40 / Usability 30 / Creativity 20 /
  Content 10, aiming for 8 or more.

## Process (every run)

1. **Setup:** `npm install` at the root. For screenshots, `npx playwright install chromium`
   once, then drive headless Chromium (Playwright from a small script in a temp folder, or
   CDP) against `npm run dev` (Vite on 5173; open `http://127.0.0.1:5173/#<slug>`, add
   `?dark` before the `#` for dark mode). Start the dev server after the new component
   folder exists, or the workshop won't see it.
2. **Don't repeat work:** `ls components/`, `git ls-remote --heads origin` (every
   `claude/*` and `claude/review-*` branch is a piece already made), and this brief.
3. **The idea gate (before any code).** Write 5 genuinely different candidate ideas, two or
   three lines each: the concept, the art direction or phenomenon, and what makes it
   unforgettable. Spawn a fresh critic subagent with only this brief and the 5 ideas:
   > You are the owner's taste. Read forge/BRIEF.md. For each idea: is it in the Banned
   > looks or like a rejected piece? Would it stop a design lead scrolling? Would someone
   > pay for it? Is it too close to something already in components/? Reject every idea
   > that is bland, safe, generic, decorative or childish, and say why. Pick at most ONE
   > to build, or reject all five.
   If all five are rejected, write 5 new ones (one more round). If that fails too, stop
   and end the run with a short note of the rejected ideas and why.
4. **Branch:** `git checkout -b claude/<slug>` from the latest `main`.
5. **Build it completely**, then look at it: screenshots at 1440×900 and 375×812, light and
   dark, and after interacting (hover, drag, click). Commit and push as soon as the first
   working build exists (`git push -u origin claude/<slug>`), so a run that dies still
   leaves its work on GitHub.
6. **The critic gate.** You do not grade your own work. Spawn a fresh critic subagent and
   give it ONLY the path to this brief, the screenshot files and the source path:
   > You are a harsh senior design and engineering reviewer for a premium component
   > library whose owner rejects anything generic. Read forge/BRIEF.md. Look at every
   > screenshot and read the source. Score 1–10: (a) idea — would a design lead stop
   > scrolling; (b) craft — materials, light, motion, type, spacing finished and real, no
   > artifacts, flicker, clipping or placeholder feel; (c) originality; (d) install-safety
   > per the repo rules; (e) templates only: functional, real copy, responsive, dark mode.
   > Judge the idea against the Banned looks first. Verdict: SHIP (average ≥ 8, nothing
   > below 7), REDO (list exact changes, most important first) or SCRAP (say why).
   > Screenshots come from a software renderer: judge form, composition and behaviour,
   > not GPU-only polish. Never soften the verdict.
   On REDO: make every change, re-shoot, push, and ask a NEW critic. Up to 3 rounds.
   **Never delete built work.** The owner has overruled the critic before (loved three
   pieces it scored 4–6). Whatever the verdict, the piece stays on GitHub:
   - SHIP → `claude/<slug>`
   - anything else → `claude/review-<slug>` (`git push origin claude/<slug>:claude/review-<slug>`,
     then `git push origin --delete claude/<slug>`).
   Every round's scores and verdict go in `media/<slug>/review.md`, committed with it.
7. **Finish:** `npm run check` and `node tests/<slug>.test.mjs` must pass. Add the
   tsconfig path line, the README and `media/<slug>/thumb.webp` (640×400 from a
   screenshot). Commit (end the message with `Co-Authored-By: Claude <noreply@anthropic.com>`)
   and push.

**Never** push to `main`, merge, open a pull request, publish to 21st, deploy anything, or
sign in anywhere. The owner reviews `claude/*` branches and decides.
