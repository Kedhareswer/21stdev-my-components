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

## The owner's standing request (this is the job)

This is the prompt the owner gives every time they commission a component by hand. Treat it
as theirs, every run:

> Follow the rules in the current repo. Create the component as you see in the reference
> image. Make sure it is correctly coded and interactive. Great design, please. I require
> the personalization, personality and customization you see in the image. Get the assets
> you need: fetch images from the internet, or generate them (SVG / canvas / JavaScript)
> if and only if they are of such high quality. Focus on the component and its
> functionality. Every part of it is carefully curated; it must be premium quality. The
> reference is how it should feel and how the layout and design should be; it does not
> show how it is built, animated or scrolled. Take inspiration from it and do what is
> needed, with very high aesthetics.

So every run **starts from a reference image** (step 3 below finds one), and builds a
**usable component**: something a developer drops into a real product page this week.

## Usable first (2026-10-14, the owner's correction)

The owner reviewed chladni-plate (a bowed brass plate whose sand forms Chladni figures),
helicorder-landing (a seismograph-drum earthquake-warning site) and guilloche-enamel (an
engraved enamel dial) and said: **"What is the use of these components? None are good or
usable."** Physics demos and material showpieces are not the goal, however well made. The
only part kept was helicorder's footer.

Build **real UI sections and components** people need, with personality and customization:
heroes, navbars, footers, pricing, feature sections, testimonials, CTAs, galleries and
carousels, cards, product showcases, team/about sections, contact and newsletter forms,
logins, 404s, FAQs, stats, timelines, preloaders. A visual effect is welcome only when it
serves one of those jobs.

## What has landed (the bar)

The owner's own usable work: image carousels with a signature transition (index-list,
ink-blot, rgb-glitch, water-ripple, paper-curl, lens-zoom), wordmark footers
(halftone-wordmark-footer, beam-wordmark-footer, kiln-wordmark-footer), preloaders
(rangoli, weight-sweep, slat-count), afterglow pricing, keycap-orb, holo-card,
glass-folder-cards, portfolio heroes, distressed-denim (as a background). Look at their
covers in `media/` before you start. Common thread: a real job on a real page, one signature
interaction, **customization through props** (content, images, colours, presets, copy),
real photos or crafted art, a finished look on the first frame.

## What was rejected

Childish or toy-like ideas; generic dashboards/cards/buttons; anything that looks like a
template generator made it; decals painted over a flat image pretending to be physical;
glitchy artifacts (stray fragments, flipped slivers, runaway effects); text pitches and sketches.

Forge pieces the owner rejected (2026-10-13) — never make anything like these:
- **e-paper-tablet-landing** — "very normal and bland". Off-white page, quiet serif headline,
  a tasteful product mock in the hero, then stock sections. Polished, but it is the page
  every AI generator makes. Polish is not taste.
- **letterpress-studio-landing** — same bland family: cream background, serif, product card.
- **chladni-plate**, **helicorder-landing**, **guilloche-enamel**, **iron-filings-field**,
  **sectional-chart-landing** — beautiful physics or material demos with no clear use on a
  real page. Not the direction.


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

## Skills (from the owner's private `kedhar_brain` repo, checked out next to this one)

The owner's skills are what keep this work from looking like AI slop, so use them: they are
part of the job, not optional reading. Find the checkout first:
`find / -maxdepth 4 -type d -path "*/agents/skills" 2>/dev/null | head -1` (call it `$S`).
At each step, read the named skill's `SKILL.md` (and the reference files it points to) with
the Read tool and apply it. **This brief outranks every skill**: if a skill pushes toward a
Banned look (warm monochrome, beige editorial, glassmorphism, a stock section order), follow
the brief. Never follow a skill step that asks the user a question: runs are unattended.

| Step | Skills (under `$S`) |
|---|---|
| Reference & idea gate | `design-ui-ux/awwwards` (+ its `references/concepts.md`, `art-direction.md`, `quality-bar.md`), `design-ui-ux/design-taste-frontend`, `frontend-web/frontend-design` |
| Every build | `21st-dev/21st-create-component`, `design-ui-ux/emil-design-eng` |
| Motion / interaction | `animation-motion/transitions-dev`, `animation-motion/motion-design`, `animation-motion/oil-motion`, `design-ui-ux/apple-design` |
| Physical or material pieces | `specialized/physics-simulation`, `frontend-web/3d-web-experience` |
| Templates | `design-ui-ux/awwwards` (+ `references/typography.md`, `layout.md`, `motion.md`, `content.md`), `design-ui-ux/high-end-visual-design`, `design-ui-ux/visual-design-foundations`; `design-ui-ux/industrial-brutalist-ui` only when the direction is brutalist or terminal |
| Before the critic | `animation-motion/transitions-polish`, `21st-dev/21st-ui-review`, `design-ui-ux/user-interface-guidelines` (fix what they find first); templates also `design-ui-ux/accessibility-auditor` |
| Before committing | `testing-quality/verification-before-completion` |

Critic subagents: give each one `$S` and tell it to read `21st-dev/21st-ui-review`,
`design-ui-ux/user-interface-guidelines` and `design-ui-ux/awwwards/references/quality-bar.md`
before scoring.

**Limits.** `awwwards`: use it for concept, art direction, type, motion and its quality bar;
ignore its Next.js/Astro scaffolding, deploy steps and font downloads (a 21st piece is one
`.tsx` file), and don't install anything it suggests. `transitions-dev` / `transitions-polish`: never paste their `_root.css` (the repo
bans bare `:root`); put the values you need as CSS variables on the component's own root
class, adapt rather than paste the library wholesale (its licence forbids redistributing
it), and skip their CLIs. Leave `transitions-ui-generation` alone unless the idea is about AI
generation. If the skills checkout is missing, say so in the run summary and fall back on
the craft rules below.

## Craft rules (the short version, if a skill is unavailable)

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
  no bare `:root`, no `h-full` root, definite `height` default).
- **Images:** real photos make components feel real. Use `images.unsplash.com` URLs (the
  owner's carousels do; pick each photo on purpose, credit it in the README) or generate
  art in SVG / canvas when it is truly high quality. Every image is a prop the installer
  can replace. No other external hosts, no local image files, no web fonts.
- **Customization:** content, images, colours and presets are props with good defaults;
  the demo shows the personality, a second demo shows a different preset.
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
3. **Find the reference image (before any code).** The owner always builds from a reference
   image; you find one. Pick ONE kind of section from "Usable first" that the library lacks
   or does weakly (`ls components/`), then look for a premium example of it:
   - 21st inspiration: if the `21stdev` connector is attached, call its `get_inspiration`
     tool with a query like "pricing section with personality"; each result has a
     `previewUrl` image.
   - Design galleries: WebSearch / WebFetch on awwwards.com, godly.website, land-book.com,
     siteinspire.com, dribbble.com, mobbin.com, minimal.gallery; or screenshot a live
     premium site's section in headless Chromium.
   Download the image (`curl -L -o`), look at it with the Read tool, and save it as
   `media/<slug>/reference.png` (media/ never publishes). Then write five candidate takes on
   it, two or three lines each: the component, its job on a real page, the signature
   interaction, and the personality and customization (props, presets, copy, images) you
   will give it. Spawn a fresh critic subagent with only this brief, the reference image and
   the five takes:
   > You are the owner's taste. Read forge/BRIEF.md and look at the reference image. For
   > each take: would a developer drop it into a real product page this week? Does it keep
   > the reference's feel, layout and personality while being our own, better build? Is it
   > in the Banned looks, like a rejected piece, or too close to something in components/?
   > Reject anything unusable, bland, generic, decorative or childish, and say why. Pick at
   > most ONE to build, or reject all five.
   If all five are rejected, find a different reference and try once more; if that fails
   too, stop and end the run with a short note of what was rejected and why.
   **Never copy** the reference's brand, logo, text, icons or images: it shows the feel and
   layout only. Credit the reference URL in `media/<slug>/review.md`.
4. **Branch:** `git checkout -b claude/<slug>` from the latest `main`.
5. **Build it completely**, then look at it: screenshots at 1440×900 and 375×812, light and
   dark, and after interacting (hover, drag, click). Commit and push as soon as the first
   working build exists (`git push -u origin claude/<slug>`), so a run that dies still
   leaves its work on GitHub.
6. **The critic gate.** You do not grade your own work. Spawn a fresh critic subagent and
   give it ONLY the path to this brief, the screenshot files and the source path:
   > You are a harsh senior design and engineering reviewer for a premium component
   > library whose owner rejects anything generic. Read forge/BRIEF.md. Look at every
   > screenshot, the reference image in media/<slug>/reference.png, and read the source.
   > Score 1–10: (u) usability — would a developer drop this into a real product page this
   > week, and can they customise it through props (score this FIRST; below 7 is a REDO
   > even if everything else is beautiful); (a) idea — does it keep the reference's feel
   > and personality and would a design lead stop scrolling; (b) craft — materials, light, motion, type, spacing finished and real, no
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
     then **you must** `git push origin --delete claude/<slug>` and check with
     `git ls-remote --heads origin` that only one of the two is left; every recent run
     left both, which doubles the owner's review list).
   Every round's scores and verdict go in `media/<slug>/review.md`, committed with it.
7. **Finish:** `npm run check` and `node tests/<slug>.test.mjs` must pass. Add the
   tsconfig path line, the README and `media/<slug>/thumb.webp` (640×400 from a
   screenshot). Commit (end the message with `Co-Authored-By: Claude <noreply@anthropic.com>`)
   and push.

**Never** push to `main`, merge, open a pull request, publish to 21st, deploy anything, or
sign in anywhere. The owner reviews `claude/*` branches and decides.
