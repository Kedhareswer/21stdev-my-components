# Fuelplate Recipes Template

A full landing page for a meal-planning app for athletes. It has a warm paper
background, a light editorial serif, sage pills, real food photography and a
phone that actually works. Every section moves with GSAP and ScrollTrigger.

**Real photographs.** The default pictures come from
[Unsplash](https://unsplash.com) (Unsplash License: free to use, no permission
needed): a shawarma wrap, seared salmon, a green power bowl, flank steak, a
salmon curry, an athlete tying a shoe, runners on a track and more. They're
served from Unsplash's CDN at the size each slot needs, with a `srcset`. A
tone colour shows while each one loads, then the photo fades in. Every
picture is a prop.

- **Nav.** A transparent pill over the hero. Once the hero has scrolled past,
  it narrows into a frosted bar. It has a saved-recipes heart with a count,
  a light/dark switch and *Download app*. Below 720 px it becomes a menu.
- **Hero.** The photo opens out from an inset card. The headline rises word
  by word and a frosted *today's plate* widget pops in with filling macro
  bars. As you scroll away, the photo folds back into a rounded card and the
  copy drifts up.
- **Features.** Three hand-drawn SVG illustrations (sneaker, beet, salmon
  with floating *Vitamin B12* / *Omega-3* tags) that spring in.
- **Planner (pinned).** On desktop the scene pins, and scrolling walks the
  three tabs, *Plan your week*, *Create grocery list* and *Swap recipes*.
  The active pill slides and fills as you go, and the copy and the phone
  morph between three working screens:
  - a week strip with a calorie ring and macro bars for each day's meals;
  - a grocery list you can tick off;
  - recipe swaps ranked by macro similarity (click one to swap).

  Clicking a tab scrolls to its slice. On mobile, or under reduced motion,
  the tabs just switch.
- **Showcase.** A coverflow of dishes. The cards fan out from the middle the
  first time it comes into view. You can drag or swipe it, click a side card,
  use the arrows or ← →, or let it autoplay. The active pager pill is the
  timer, and it pauses on hover, on focus and off screen. The heart saves a
  recipe to the nav count.
- **Bento.**
  - Live recipe search (any word order, accents ignored) with filter chips:
    high protein, under 20 min, low carb, vegetarian.
  - A nutrient marquee. Click a chip to track that nutrient, and it shows up
    in the % daily value panel.
  - Diet toggles that count the recipes matching your picks.
  - Two testimonials.
- **Cook.**
  - Cooking mode on a phone, with steps, a real countdown timer for each
    step, and back/next.
  - A servings stepper that rescales the ingredients.
  - A metric/imperial switch: g ↔ oz/lb, ml ↔ cups/fl oz. Spoons and pieces
    scale in quarters.
  - A testimonial.
- **Categories.** Nine plates that spin onto their tiles, then tilt and show
  a count on hover.
- **Resources.** Articles you can filter with the *Knowledge / Blog /
  Podcasts* tiles.
- **Call to action.** The words light up as you scroll through it, and dish
  plates drift past at different speeds.
- **Footer.** Link columns and a big serif wordmark.
- **Download sheet.** A modal with store buttons and *email me the link*.
  It has a focus trap, closes on Escape, and returns focus when it closes.

```tsx
import FuelplateRecipesTemplate from "@/components/ui/fuelplate-recipes-template"

<FuelplateRecipesTemplate
  brand="Fuelplate"
  palette="sage"
  hero={{ title: "Performance driven\nrecipes for athletes.", text: "...", cta: "Download app", image: { src: "/hero.jpg", alt: "..." } }}
  dishes={[{ id: "wrap", name: "Chicken Shawarma Wrap", image: { src: "/wrap.jpg", alt: "..." }, time: 30, kcal: 480, protein: 38, carbs: 44, fat: 16, course: "Lunch", tags: ["high-protein"] }]}
  appStoreHref="https://apps.apple.com/..."
  onRequestLink={(email) => api.sendLink(email)}
  onSave={(dish, saved) => api.save(dish.id, saved)}
/>
```

## Play with it

- `demo.tsx`: Fuelplate, sage palette.
- `demo-lifters.tsx`: rebranded as *Ironleaf* for lifters: clay palette, a
  barbell hero, a 3,200 kcal target and its own copy.

Open `?dark` before the hash in the workshop for the dark theme.

## Props

| Prop | Type | Default |
|---|---|---|
| `brand` / `tagline` | `string` | `"Fuelplate"` / footer line |
| `nav` | `{ label, href? }[]` | Recipes, Resources, Company, Pricing. `#recipes` and `#resources` scroll to their sections. |
| `hero` | `{ title, text, cta, image } \| null` | `\n` in `title` breaks the line. |
| `features` | `{ title, text }[] \| null` | Three. The illustrations are fixed: sneaker, beet, salmon. |
| `planner` | `FptPlanTab[] \| null` | Three tabs `{ tab, eyebrow, title, text, points }`. |
| `target` | `number` | `2600` kcal on the planner ring. |
| `showcase` | `{ title, text } \| null` | Needs 3+ dishes. |
| `dishes` | `FptDish[]` | Twelve. They feed the coverflow, search, swaps, diets and the plan. |
| `bento` | `{ title, text } \| null` | |
| `nutrients` | `string[]` | Twenty, in the marquee. The first two tag the salmon. |
| `testimonials` | `FptTestimonial[]` | Three: peach, sage (with photo), blue (with photo). |
| `cook` / `recipe` | `{ title } \| null` / `FptRecipe` | |
| `categories` | `{ title, items: FptCategory[] } \| null` | Nine. |
| `resources` | `{ title, items: FptArticle[] } \| null` | Six. |
| `cta` | `{ title, text, button } \| null` | |
| `footer` | `{ columns, social, note } \| null` | |
| `palette` | `"sage" \| "clay" \| "ocean" \| "plum" \| { accent, soft, ink? }` | `"sage"` |
| `theme` | `"system" \| "light" \| "dark"` | `"system"` follows the host's `.dark` class, then the OS. The nav switch overrides it. |
| `fontHref` | `string \| null` | Instrument Serif + Inter from Google Fonts. `null` uses system stacks. |
| `appStoreHref` / `playStoreHref` | `string` | The download sheet's buttons. |
| `onDownload` | `() => unknown` | Fires when any download button opens the sheet. |
| `onRequestLink` | `(email) => unknown` | Return or resolve `false`, or throw, to show an error. Without it, sending is simulated. |
| `onSave` | `(dish, saved) => unknown` | |
| `height` | `string` | `"100svh"`: a definite floor for the hero, so it survives any host layout. |
| `className` | `string` | |

Types:

- `FptShot { src, alt?, tone?, focus? }`. `tone` shows while it loads, and
  `focus` is the CSS `object-position`.
- `FptDish { id, name, image, time, kcal, protein, carbs, fat, course?, tags? }`.
  Tags used by the UI: `vegan`, `vegetarian`, `gluten-free`, `dairy-free`,
  `high-protein`.
- `FptRecipe { name, image, time, kcal, servings, ingredients, steps }`.
  An ingredient is `{ name, qty, unit }`, where `unit` is `g`, `ml`, `tbsp`,
  `tsp` or `pc`. A step is `{ title, text, minutes? }`, and `minutes` adds a
  timer.
- `FptCategory { name, count, image, href? }`.
- `FptArticle { id, title, kind: "Blog" | "Knowledge" | "Podcasts", date, read, image, href? }`.

## Notes

- **Dependencies: `react` and `gsap`** (with its bundled `ScrollTrigger`).
  Install `gsap` if you copy the source by hand. The illustrations and
  icons are inline SVG.
- **Motion.** All tweens and triggers live in one `gsap.context` and are
  reverted on unmount. Under `prefers-reduced-motion` nothing is hidden,
  pinned or scrubbed, the coverflow jumps instead of gliding, autoplay is
  off, and the marquee stops.
- **The pin needs window scrolling.** The planner pins against the page
  scroll. Inside a fixed-height scrolling box, give ScrollTrigger a
  `scroller`, or it won't pin.
- **The 21st cover.** 21st's capture sandbox blocks external origins, so it
  can't load the photos. Publish with your own `--preview`
  (`media/fuelplate-recipes-template/template-cover.jpg`).
- **Placeholder data.** Fuelplate, Ironleaf, the people, quotes, nutrient
  percentages, counts and articles are invented. The people in the photos
  are Unsplash models.
- **State is seeded once.** Saved recipes, filters, diets, servings and units
  belong to the visitor after the first render. Change `key` to reset them.
- Reference: the owner's screenshot of an athlete-recipes landing page
  (`media/fuelplate-recipes-template/reference.webp`), used for feel and
  layout.
