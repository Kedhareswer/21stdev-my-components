# Summit Teams Template

A complete dark SaaS landing page for a team-management product, set against
alpine light: a framed mountain hero, a logo marquee, a four-step "how it
works", a **live** product preview with four working panels, pricing with a
monthly/yearly switch, a testimonial wall, a CTA under strings of prayer flags
and a footer whose serif wordmark rises out of the range.

**Requires `gsap`** (with its bundled `ScrollTrigger`). Everything else is React.

The page is finished before any photograph arrives. Every picture sits over a
mountain range drawn in code from a seeded ridge generator (dusk, alpenglow,
lake, haze or night), and fades in on top when it loads. A photo that cannot be
fetched simply leaves the drawn range in place, so nothing ever shows a broken
image or an empty box. Avatars fall back to tinted initials the same way.

## Sections

- **Nav.** Transparent over the hero. Once the page moves it becomes a narrower
  floating glass pill, the brand name slides in and a dot marks the section in
  view. Links scroll to their section inside whatever element scrolls the host.
  Below 1024px it collapses to a menu sheet.
- **Hero.** On load the range settles from a zoom, the eyebrow un-blurs and the
  headline rises word by word out of its masks. On scroll the frame's
  `clip-path` closes in to a rounded card, the range sinks and the copy lifts
  away. The pointer drifts the range and copy at different depths.
- **Logos.** A masked, endless marquee of wordmarks with drawn glyphs. Hover
  pauses it.
- **How it works.** Four steps that advance on their own along a progress line,
  pausing on hover and off screen. Click any step. The panel beside them swaps
  a glass card per step: an invite form that types itself, a working role
  picker, metrics with growing bars, and access switches you can flip. The
  photo pans as the steps go.
- **Features.** Four tabs with a sliding indicator and arrow-key support. The
  app preview tilts up out of the lake on scroll and lies flat as it arrives.
  Every panel works:
  - *User & Role Management:* search, role filters, pick a row to load the
    details panel, tick to-dos (the summary updates), switch account status,
    and **Invite New User** to add a real row.
  - *Activity Monitoring:* KPI tiles, a chart that morphs between 7D, 30D and
    90D with a hover readout, and a live feed that keeps arriving.
  - *Projects & Deal Tracking:* click a deal to move it a stage. Cards FLIP into
    their new column and the totals follow.
  - *Access & Account Control:* a permission matrix of switches, SSO and 2FA
    enforcement, and an audit log that records every change.
- **Pricing.** Monthly/yearly switch; prices count to the new figure and show
  what is billed. Cards deal in on scroll, the recommended one last with its
  photo ribbon sliding up. A spotlight follows the pointer. Choosing a plan
  calls `onSelectPlan(plan, billing)`.
- **Testimonials.** A featured quote that re-sets word by word and cycles every
  seven seconds, beside two columns of cards drifting in opposite directions
  over the ridges. Click a card to feature it.
- **CTA.** The card opens like a window on scroll; two strings of prayer flags
  in the five traditional colours draw themselves across it and flutter.
- **Footer.** Brand, socials and link columns over the range, and a giant serif
  wordmark that rises and spreads as you reach the bottom.
- **Waitlist.** Every "Join waitlist" opens a dialog with email validation, a
  sending state and a success state. Escape or the backdrop closes it.
  `onJoin(email)` may return a promise.

## Props

Everything is optional; the defaults are the Nexora page.

| Prop | Type | Notes |
|---|---|---|
| `brand` | `{ name, tagline }` | Name drives the logo, dialog and footer wordmark. |
| `nav` | `{ label, to?, href? }[]` | `to` is a section: `how`, `features`, `pricing`, `testimonials`, `footer`. |
| `login` | `string` | |
| `hero` | `SttHero` | `title` is an array of lines. `photo` may be `null`. |
| `logos` | `SttLogo[]` | `glyph` and `style` vary the wordmarks. |
| `how`, `steps` | heading + `SttStep[]` | `card`: `invite`, `roles`, `metrics`, `access`. |
| `features`, `tabs` | heading + `SttFeatureTab[]` | `view`: `users`, `activity`, `pipeline`, `access`. |
| `users` | `SttUser[]` | Rows and details panel, with to-dos. |
| `activity` | `SttActivity` | Ranges must have equal lengths so they can morph. |
| `deals`, `stages` | `SttDeal[]`, `string[]` | `stage` is an index into `stages`. |
| `access` | `SttAccess` | One grant per role per permission. |
| `pricing`, `plans` | `SttPricing`, `SttPlan[]` | `discount` is the yearly saving, e.g. `0.2`. Mark one plan `featured`. |
| `testimonialsHeading`, `testimonials`, `testimonialsPhoto` | | |
| `cta` | `SttCta` | `flags: false` hides the prayer flags. |
| `footer` | `SttFooter` | Columns, socials, legal line, photo. |
| `accent` | `string` | Default `#f3b27a`. Focus rings, live dots, chart, progress lines. |
| `height` | `string` | One "screen". Default `100svh`; never inherited. |
| `onJoin` | `(email) => unknown` | |
| `onSelectPlan` | `(plan, billing) => unknown` | |
| `onCta` | `(which) => unknown` | `primary` falls back to opening the waitlist. |

## Notes

- Photos are Unsplash. Pass your own `{ src, alt, focus }` anywhere a photo is
  taken, or `null` for the drawn range alone.
- Reduced motion: no intro, scrubs, marquees, auto-advance or flutter; every
  section is shown in place and stays fully usable.
- Self-contained styles in one scoped `<style>` block (`.stt-*`), no fonts
  fetched, system type stacks only.
