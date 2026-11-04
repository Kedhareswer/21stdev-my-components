# Aura Team Cards

A row of dark team cards with a soft colour aura behind each portrait. Hovering or focusing a card widens it with an eased flex change, lifts it, and blooms its aura upward while a sheen sweeps across. The portrait grows and regains its colour, and the bio, two facts and the links rise in. The other cards dim and desaturate. On load the cards deal in one after another. Each aura drifts slowly on its own.

On touch screens (and below 760 px) the row becomes a swipeable snap carousel with every card's details shown.

```tsx
import AuraTeamCards from "@/components/ui/aura-team-cards"

<AuraTeamCards
  heading="Small team,"
  headingMuted="long memory."
  members={[
    { name: "Amara Okafor", role: "Founder", photo: "/amara.webp", bio: "Ran brand at two labels…", facts: [["Based", "Lisbon"], ["Since", "2016"]], colors: ["#7c5cff", "#ff6ad5"], links: [{ label: "Mail", href: "mailto:…" }] },
    { name: "Tomás Reyes", role: "Design engineer", photo: "/tomas.webp" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `members` | required | `{ name, role, photo, bio?, facts?, colors?, links? }[]`. `colors` is the aura pair; without it a built-in palette cycles. |
| `eyebrow` | `"The team"` | Mono label over the heading. |
| `heading` / `headingMuted` | `"Small team,"` / `"long memory."` | Heading; the second part is muted. |
| `defaultActive` | `-1` | Card open at rest. Touch screens open the first card when this is `-1`. |
| `height` | `"100svh"` | Minimum height of the section. |
| `className` | `""` | On the section. |

## Notes

- Pure CSS motion driven by one `data-active` attribute; no animation library, no measuring.
- Reduced motion: no entrance, drift, sheen or eased resizing.
- The demo inlines four free Unsplash portraits as small WebP so it makes no off-origin requests.
