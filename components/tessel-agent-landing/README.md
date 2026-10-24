# Tessel Agent Landing

A complete landing page for an AI agent platform. The look is a pixel mosaic:
a field of blue pixels drawn on canvas. When the page opens it starts as big
blocks and sharpens. It breaks back into blocks as you scroll past. Under the
pointer the pixels get finer, like a loupe. The mosaic shows up in every
section: the hero, the product stage, the featured price, the call to action,
the case-study portrait and the footer wordmark. The type pairs a serif for
headlines with mono labels, and the page sits inside a hairline frame.

Requires `gsap` (with its bundled `ScrollTrigger`), declared in the root
`package.json`. Nothing else: React, canvas, SVG and the system type stack.

```tsx
import TesselAgentLanding from "@/components/ui/tessel-agent-landing"

<TesselAgentLanding
  brand="Ledgerline"
  palette="ember"
  hero={{ title: "Close the Books with Agents\nThat Show Their Work", prompt: { suggestions: ["Reconcile October invoices"] } }}
  onRun={async (prompt, { model, signal }) => {
    const res = await fetch("/api/agent", { method: "POST", body: JSON.stringify({ prompt, model }), signal })
    return (await res.json()).answer
  }}
  onSignUp={(email) => fetch("/api/signup", { method: "POST", body: email }).then((r) => r.ok)}
/>
```

## Play with it

| Do this | And |
|---|---|
| Load the page | The headline rises line by line, the hero panel opens from a clipped frame and the mosaic sharpens from 92px blocks to 18px pixels in nine steps |
| Move over any mosaic | Cells near the pointer split into 2×2, then 4×4 finer pixels and brighten |
| Type a task and press Enter (or pick a chip) | The agent plans it and calls four tools one at a time, each with a timing. Then the result streams in. Stop, Copy and New task all work |
| Open the model pill | A listbox you can use with the mouse or the arrow keys |
| Scroll past the hero | The mosaic breaks back into blocks and the prompt drifts up |
| Scroll the black problem section | The headline fills in word by word. Hover a card (or tap it) and its isometric icon comes apart: slabs separate, bars rise, a lid lifts off a glowing core. The description slides up |
| Scroll the solution | The stage sticks while four steps pass. The card changes to fit each step and the mosaic shifts to a new pattern: a live **agent builder** (switches, typed instructions, a test run), a **connections graph** (click tools to connect them), a **trace waterfall** (hover spans, replay) and a **deploy** panel (environment, rollout slider, auto-rollback, a ticking run counter). On phones these are tabs |
| Stats | Count up when they arrive, with pixel bars |
| The case-study portrait | Starts as big pixels and resolves to the photo. Hover it to see that again |
| Pricing | Monthly or annual, with the prices rolling between values. The featured plan has a seats stepper and a runs slider for a live estimate |
| The call to action | Opens out of a clipped frame as you scroll. The email is validated, then sent through `onSignUp` |
| The footer wordmark | Pixels fly in to spell the brand. Move through them to scatter them |

The nav sticks, has dropdown menus, a theme switch, a pixel scroll-progress bar
and a focus-trapped menu on phones. The announcement bar can be dismissed.

## Demos

- `demo.tsx`: Tessel, on the cobalt palette.
- `demo-ember.tsx`: Ledgerline, an agent platform for finance teams, on the
  ember palette. It has its own copy, tasks, models, logos, stats and a sign-up
  handler that refuses `@example.com` addresses.

Add `?dark` before the hash in the workshop to see the night theme.

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"Tessel"` | Nav, announcement, hero ruler and the footer wordmark. |
| `logo` | drawn 3×3 pixel mark | Replaces the mark. |
| `announcement` | seed round | `{ label, href? } \| null`. Shown after the brand name. |
| `nav` | Product, Case Study, Pricing, Company | `{ label, href?, items? }[]`. `items` (`{ label, description?, href? }`) make a dropdown. `#top`, `#product`, `#customers`, `#pricing` and `#signup` scroll within the page. |
| `signIn`, `getStarted` | | `{ label, href? }`. `signIn` can be `null`. |
| `hero` | | `{ badge, title, text, primary, secondary, prompt }`. `\n` in `title` breaks the line. `badge` is `{ mark, label } \| null`. `prompt` is `{ label, placeholder, suggestions, models }`. |
| `logos` | seven invented marks | `{ name, mark?, style? }[] \| null`. `mark`: `bolt`, `spark`, `chevron`, `orbit`, `bars`, `knot`, `leaf`. `style`: `bold`, `italic`, `light`, `caps`. |
| `problem` | | `{ kicker, title, items } \| null`. `*asterisks*` in `title` mute words. `items` are `{ title, text, icon? }`, with `icon` one of `layers`, `steps`, `eye`. |
| `solution` | four features | `{ kicker, title, features } \| null`. A feature is `{ kicker, title, text, points?, visual }`, with `visual` one of `builder`, `tools`, `trace`, `deploy`. |
| `stats` | four | `{ value, prefix?, suffix?, decimals?, label }[] \| null`. |
| `caseStudy` | Lumen Freight | `{ kicker?, company, quote, name, role, photo?, metrics? } \| null`. |
| `testimonials` | three | `{ quote, name, role, avatar? }[] \| null`. Without an avatar you get initials. |
| `pricing` | Starter, Team, Enterprise | `{ kicker, title, plans, annualDiscount, estimator } \| null`. A plan is `{ name, price (null = Custom), unit?, blurb, features, cta, featured? }`. `estimator` is `{ included, per1k, max? }` and drives the featured plan's estimate. |
| `cta` | | `{ title, text, action, placeholder, done } \| null`. |
| `footer` | | `{ tagline, columns, note } \| null`. |
| `currency` | `"$"` | |
| `palette` | `"cobalt"` | `"cobalt"`, `"ember"`, `"moss"`, or `{ stops: [deep, mid, light, lightest], accent? }` in hex. |
| `theme` | `"system"` | `"system"` follows the host's `.dark` class first, then the OS. |
| `themeToggle` | `true` | |
| `onRun` | | `(prompt, { model, signal }) => string \| Promise<string>`. While the tools animate, it runs too, and its answer is what streams in. Throw to show an error. Without it, the answer comes from a built-in playbook (support, finance, report, sales, general). |
| `onSignUp` | | `(email) => boolean \| Promise<boolean>`. Return or resolve `false`, or throw, to show an error. Without it, sending is simulated. |
| `height` | `"100svh"` | Sets the height of the hero panel and the call to action (clamped). It is a definite length, so it survives any host layout. |
| `className` | | |

## Notes

- **The mosaic** samples a value-noise field once per cell and maps it through
  a 28-step ramp built from the palette. Cells are drawn in colour buckets, so
  a frame is a few dozen fills. Each mosaic runs only while it is on screen and
  stops in background tabs. GSAP tweens its cell size. That is the "resolve"
  when the page opens, the break-up when you scroll past and the step change on
  the stage.
- **Scroll.** GSAP `ScrollTrigger` handles the hero, the scrubbed headlines,
  the step changes on the stage, the clipped reveals and the batch reveals. It
  runs inside `gsap.context`, which is reverted on unmount. A ResizeObserver
  refreshes the triggers when sections change height, for example when the run
  panel opens.
- **Reduced motion.** No choreography. The mosaics draw still frames (the
  loupe still follows the pointer), the portrait shows the photo, the
  wordmark is already set, runs finish at once, and in-page links jump instead
  of scrolling.
- **Accessibility.** A skip link and one `h1`. The disclosures, switches,
  radio groups, tabs and listbox each use their proper roles. The phone menu
  is a focus-trapped modal. The run status and form messages are announced.
  Contrast holds in both themes.
- **No network.** The portrait and avatars are small embedded WebP images
  (about 17 KB in all). Nothing loads at runtime, so it renders in 21st's
  capture sandbox.
- **Copy and data are placeholders.** Tessel, Ledgerline, Northgate Ventures,
  the logos, customers, figures and quotes are all invented. Replace them
  through props.
- **Photos:** portraits from Unsplash (Unsplash License), cropped and
  re-encoded.
- **Reference:** the owner's screenshot of an AI-agent landing page, used for
  feel and layout only (the serif headline, the pixel-mosaic hero holding a
  prompt card, the black problem section with isometric icons). No copy, brand
  or marks are taken from it. See `media/tessel-agent-landing/`.
