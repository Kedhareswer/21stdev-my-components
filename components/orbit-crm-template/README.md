# Orbit CRM Template

A complete landing page and interactive revenue suite for an AI-powered CRM startup, replicating the aesthetic conceived by Saboor (@uisabor).

The visual language pairs **classical antiquity engravings** (a Roman emperor addressing a vast legion across the horizon, classical Greek philosopher sculptures, Roman architectural colonnades, and an ancient trireme warship in storm waves) with **modern royal cobalt blue AI SaaS ergonomics** and **crisp retro-futuristic pixel / bitmap display typography**.

**Requires `gsap`** (with bundled `ScrollTrigger`), declared in root `package.json`. No external dependencies beyond React and GSAP.

```bash
http://localhost:5173/#orbit-crm-template
http://localhost:5173/?dark#orbit-crm-template
```

```tsx
import OrbitCrmTemplate from "@/components/ui/orbit-crm-template"

export default function Page() {
  return (
    <OrbitCrmTemplate
      onStartFree={() => console.log("Start free clicked")}
      onBookDemo={() => console.log("Book demo clicked")}
      onWatchDemo={() => console.log("Watch demo clicked")}
    />
  )
}
```

## Interactive Highlights

| Section | Interactive Features |
|---|---|
| **Top Navigation** | Products and Solutions hover/click dropdown menus with deep link sub-items; mobile hamburger sheet; modal triggers. |
| **Social Proof Bar** | Animated `[New]` announcement badge; 3-avatar stack; monochrome client marks (`classpass`, `Calendly`, `GitHub`, `Basecamp`, `attentive`). |
| **Hero Stage** | Pixel headline (*Manage customers and revenue with AI*); parallax depth on Roman general and legion; interactive product walkthrough video modal. |
| **Bento Feature Grid** | **Card 1 (AI Sales Assistant):** Live interactive chat prompt runner with simulated streaming response.<br>**Card 2 (Contact Intelligence):** Working permissions and team access manager with invite input and role selector.<br>**Card 3 (Revenue Forecasting):** Interactive retention rate bar chart with hover tooltips for SMEs, Enterprises, and Startups across 7 months.<br>**Card 4 (Management Finance):** Real-time finance indicators, currency tags, and progress bar.<br>**Card 5 (Automated Workflows):** Interactive toggle switches for Slack, Shopify, and Notion.<br>**Card 6 (Integrations Hub):** Interactive satellite node network. |
| **Comparison Matrix** | "Why Traditional CRM Slows Teams Down" side-by-side analysis featuring classical philosopher bust background and interactive row highlights. |
| **Feature Showcase** | 3-column architecture featuring "Monday.com Redesign" project card with interactive 30-tick segmented progress bar, team avatars, and task expander. |
| **Lead to Revenue** | 3-stage vertical accordion morphs between capture, signal analysis, and deal velocity; ancient galleon trireme warship with interactive dot-matrix revenue chart. |
| **AI CRM Workspace** | Complete functional CRM application suite: search bar (⌘K), tabbed leads board (Status, Sources, Qualification), KPI counters, and deal schedule. |
| **Stripe Case Study** | Deep dark quote card paired with Greek philosopher Chrysippus/Socrates sculpture and floating B2B system management team tasks card. |
| **Roman Army Footer** | Monumental Roman general and army backdrop; functional email newsletter signup with validation and animated feedback. |

## Props

```ts
export interface OrbitCrmTemplateProps {
  /** Height of the hero viewport stage; defaults to 100svh. */
  height?: string
  className?: string
  /** Classical Roman emperor and legion engraving backdrop. */
  heroImage?: string
  /** Clean Caesar army engraving for the footer. */
  caesarImage?: string
  /** Classical galleon trireme warship for the revenue chart. */
  shipImage?: string
  /** Classical Greek philosopher thinker statue for the Stripe testimonial. */
  thinkerImage?: string
  /** Classical bust engraving for the comparison matrix. */
  tableBustImage?: string
  /** Classical Roman architectural colonnade/arch for the showcase. */
  romanArchImage?: string
  onStartFree?: () => void
  onBookDemo?: () => void
  onWatchDemo?: () => void
}
```
