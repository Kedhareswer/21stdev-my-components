# Automation Flow Card

A workflow card for an automation builder's dashboard. The cover is a live mini-flow: four glass step chips over a drifting aurora, with light pulses running along the wires from the trigger to each branch and a ping on the trigger. Below it: when it was edited, an Active/Paused status with a spring switch, a "more" menu that pops from the corner, the title and description, three stats, collaborators' faces that spread on hover, and the connected apps.

Pausing the workflow freezes the cover and desaturates it, so state reads at a glance. The card surface comes from your `--color-background` and `--color-foreground`, so it matches light and dark pages.

```tsx
import AutomationFlowCard from "@/components/ui/automation-flow-card"

<AutomationFlowCard
  title="Inbox triage assistant"
  description="Reads every new support email, sorts it by intent and drafts a first reply."
  steps={[{ label: "New email", icon: "mail" }, { label: "Classify", icon: "spark" }, { label: "Draft reply", icon: "doc" }, { label: "Apply label", icon: "tag" }]}
  stats={[{ label: "Runs · 7d", value: "1,284" }, { label: "Success", value: "99.2%" }, { label: "Avg time", value: "1.4 s" }]}
  people={[{ name: "Maya", photo: "/maya.webp" }]}
  extraPeople={3}
  onActiveChange={(on) => save({ active: on })}
  menu={[{ label: "Duplicate", onSelect: duplicate }, { label: "Delete", danger: true, onSelect: remove }]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `title` | required | Workflow name. |
| `description` | none | One or two lines. |
| `edited` | `"Edited 5 days ago"` | Meta text. |
| `steps` | email triage | Four `{ label, icon? }`: trigger, action, two branches. Icons: `mail`, `spark`, `tag`, `chat`, `bolt`, `doc`. |
| `stats` | `[]` | Up to three `{ label, value }`. |
| `people` / `extraPeople` | `[]` / `0` | Collaborator photos and a "+N" count. |
| `integrations` | `["mail", "spark", "chat"]` | Icon chips bottom right. |
| `defaultActive` / `onActiveChange` | `true` / none | The switch. |
| `menu` | Duplicate, Rename, Delete | `{ label, onSelect?, danger? }[]`. Closes on outside click and Escape. |
| `height` | `"100svh"` | Minimum height of the stage. |
| `className` | `""` | On the stage. |

## Notes

- The cover is CSS and one SVG; node positions and wires share percentage coordinates, so nothing is measured.
- Reduced motion: no drift, pulses, pings or pop-ins.
- The demo inlines four free Unsplash portraits as tiny WebP so it makes no off-origin requests.
