# Ink Orbit SaaS Template

A complete monochrome landing page for an AI product. White panels sit on a
hatched page, held together by thin corner brackets. In the hero is a
generative ink sculpture: stippled loops caged around a glass sphere.

Sections, top to bottom:

- **Nav**: a sticky, frosted bar with corner brackets. The links scroll to
  their sections, and a caret slides under whichever one you're reading. Below
  820px of template width it folds into a menu. It also has a theme switch.
- **Hero**: a grey band behind the headline. The serif line cycles through
  `titleAccent`. *Start Free Trial* scrolls to pricing unless you pass
  `onStartTrial`. *Watch Demo* opens a dialog that plays a live workflow run
  (steps tick, a timer counts, a progress bar fills, and you can replay it).
- **Sculpture**: a seeded 3D point cloud on canvas, with about 19k ink grains
  and depth shading. The sphere is a real lens: it shows an inverted, shrunken
  copy of the ink behind it. The sculpture turns on its own and leans toward
  the pointer. Drag to spin and flick it. **Click (or Enter) to reforge**:
  every grain morphs into a new seed's shape. The arrow keys rotate it.
- **Features**: a bento of live diagrams.
  - *Collaboration → reports*: presence dots pulse, packets travel along the
    connectors, hovering an avatar shows what that person is doing, and a new
    numbered report slides onto the stack every few seconds.
  - *Integrations hub*: the connectors light up one by one. Hover or focus a
    tool to pin it.
  - *Predictive insights*: the line draws itself in. Move the pointer over the
    chart to read each week, with the forecast region marked.
- **Testimonials**: framed cards with drawn greyscale portraits. Swipe, use the
  arrows or click the dots, with snap scrolling. Under the cards is a logo
  marquee that pauses on hover.
- **Pricing**: a monthly/yearly toggle with a sliding pill. Prices tick to the
  new value, and yearly shows how much you save. Picking a plan marks it
  selected and calls `onSelectPlan`.
- **About + FAQ**: the stats count up when they come into view. The FAQ is an
  accordion that animates its height.
- **Sign-up band**: checks the email, shows loading and done states, and shows
  an error if your `onSubscribe` rejects.
- **Footer**: link columns, a live status dot and a light/dark switch.

```tsx
import InkOrbitSaasTemplate from "@/components/ui/ink-orbit-saas-template"

<InkOrbitSaasTemplate
  brand="Tessellate"
  sculptureSeed={4211}
  hero={{ titleTop: "Resolve Tickets With", titleAccent: ["Quiet Precision", "Fewer Escalations"] }}
  features={{ title: "One *queue*,\nzero busywork" }}
  pricing={{ currency: "€", yearlyDiscount: 0.15 }}
  onSelectPlan={(plan, billing) => router.push(`/signup?plan=${plan}&billing=${billing}`)}
  onSubscribe={(email) => fetch("/api/signup", { method: "POST", body: JSON.stringify({ email }) })}
/>
```

**No dependencies beyond React.** The sculpture, portraits, logo marks,
diagrams and icons are all drawn in the file, and the fonts are system
stacks. Nothing loads at runtime.

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"NeuraForge AI"` | Shown in the nav and the footer. |
| `nav` | Home, Features, Testimonials, Pricing, About | `{ label, target }[]`. A `target` of `home`, `features`, `testimonials`, `pricing` or `about` scrolls to that section. Anything else (`/blog`, `https://…`) is a normal link. |
| `navCta` | `"Get Started"` | Calls `onGetStarted`, or scrolls to pricing. |
| `hero` | see source | `{ titleTop, titleAccent: string[], description, primaryCta, secondaryCta, sculptureHint }`. |
| `features` | see source | `{ tag, title, collaboration, reports, integrations: { title, description, tools[4] }, insights: { title, description, values, forecastFrom } }`. Each part merges over its defaults. |
| `testimonialsTag`, `testimonialsTitle` | `"Testimonial"`, `"Trusted by *Teams*\nWorldwide."` | |
| `testimonials` | 6 quotes | `{ quote, name, role, rating?, avatar? }[]`. `avatar` is an image URL, shown greyscale. Without one, a drawn portrait is used. |
| `logos` | 7 placeholder names | Marquee names. Each gets a generic drawn mark. `[]` hides the marquee. |
| `pricing` | Starter / Pro / Enterprise | `{ tag, title, subtitle, plans, yearlyDiscount, currency }`. Plans take `{ name, description, price (monthly, or null for "Custom"), features, cta, featured?, badge? }`. |
| `about` | see source | `{ tag, title, body, stats: { value, label }[] }`. Stats such as `"12,400+"`, `"99.98%"` and `"4.9/5"` count up. |
| `faq` | 4 items | `{ question, answer }[]`. `[]` hides it. |
| `cta` | see source | `{ title, description, placeholder, button, success }`. |
| `footerTagline`, `footerColumns` | see source | `{ title, links: { label, href }[] }[]`. |
| `demoSteps` | 5 steps | `{ label, detail }[]` for the Watch Demo dialog. |
| `sculptureSeed` | `7` | The starting shape. Every integer gives a different one. |
| `onReforge` | – | Called with the new seed after a click. |
| `onGetStarted`, `onStartTrial`, `onWatchDemo` | – | Button hooks. |
| `onSelectPlan` | – | `(plan, "monthly" \| "yearly") => void`. |
| `onSubscribe` | – | `(email) => void \| Promise`. If the promise rejects, the band shows an error. Without it, the form only simulates the send. |
| `accent` | `"#111111"` | Focus rings and selection colour. |
| `fonts` | system stacks | `{ sans?, serif?, mono? }`, as CSS font-family lists. Load the webfonts in your app, then name them here. |
| `defaultTheme` | `"system"` | `"system"` follows the host's `.dark` class, then the OS. |
| `onThemeChange` | – | Called with `"light"` or `"dark"`. |
| `maxWidth` | `"1180px"` | Width of the page column. |
| `height` | `"100svh"` | Minimum height of the page. The hero sizes itself from it. |

## Notes

- In titles, `*word*` sets a word in the muted tone and `\n` breaks the line.
  `\n` works as a JS string and inside a plain JSX attribute.
- The serif line asks for Newsreader first, then falls back to Iowan /
  Palatino / Georgia. The sans asks for Manrope, then Inter, then the system
  sans. For the exact look, load Newsreader and Manrope in your app.
- The layout responds to the template's own width (container queries), so it
  also works inside a narrow preview pane.
- `prefers-reduced-motion` stops the sculpture's auto-spin and makes reforging
  instant. It also turns off the packets, marquee, word cycling, count-ups and
  reveals. You can still drag the sculpture.
- The sculpture stops drawing while it's off-screen.
- Default logo marks are generic shapes, not real brands. Pass your
  customers' names, and replace the marks if you have permission to use their
  real logos.
