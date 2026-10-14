# Duotone Team Roster

A "meet the people" section for an about page, a studio site or a careers page. A heavy display headline sits bottom-left on a burning colour field. Beside it, the team hangs in tall columns of portraits that drift slowly in opposite directions. Every photo goes through one tritone (shadow, midtone, highlight) built from the palette, so portraits shot on ten different phones read as one set.

**The signature.** Point at a portrait, tab to it or tap it. It lifts out of the wall and colour bleeds back into it, while the rest of the wall sinks into the field. Its craft chip unfolds into a card with the name, role, one line of bio and a link. The columns hold still while you read.

- One file. Its only dependency is React; no other packages, fonts or CSS files.
- Below about 700px of container width the columns become one drifting strip above the headline. Tablets get two columns.
- A **Pause** button (bottom-right corner of the wall, first in the tab order; beside the CTA on phones) stops the drift (WCAG 2.2.2). Or pass `drift={false}` for a still wall. The drift also pauses on hover, on focus, while a card is open and while the section is off screen.
- Under reduced motion, the columns stay still in their staggered positions and the entrances are skipped.
- Each portrait is a disclosure button (`aria-expanded`). Keyboard: Tab moves through the portraits, each one unfolds and slides fully into view, Enter moves to its link and Escape folds it. Folded cards are hidden from screen readers.
- The headline's widest line runs on into the first column, like a poster. While a first-column card is open, the headline eases back into its own column.
- If a photo fails to load, a monogram plate in the palette takes its place.

## Usage

```tsx
import DuotoneTeamRoster from "@/components/ui/duotone-team-roster"

export default function About() {
  return (
    <DuotoneTeamRoster
      preset="ember"
      eyebrow="Meet"
      title={"The\ncrew"}
      intro="Ten editors, colourists and sound people finishing features, series and ads."
      cta={{ label: "Start a project", href: "/contact" }}
      members={[
        { name: "Priya Nair", role: "Supervising colourist", craft: "Colour", bio: "Grades every feature that leaves the building.", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=720&h=960&fit=crop", href: "mailto:priya@example.com" },
        // ...
      ]}
      openRoles={[{ title: "Senior colourist", note: "Full time, Leeds", href: "/careers/colourist" }]}
    />
  )
}
```

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `members` | `TeamMember[]` | ten demo people | `{ name, role, craft?, bio?, photo?, focus?, href?, linkLabel?, exposure? }`. `craft` is the chip label (falls back to `role`). `focus` is the `object-position` of the portrait. `exposure` (e.g. `1.2`) brightens one photo before the tritone. |
| `openRoles` | `OpenRole[]` | `[]` | `{ title, href, craft?, note?, mark? }`. Each one becomes an empty frame among the portraits ("You?" plus the role title) that unfolds into a link to the job. |
| `eyebrow` | `string` | `"Meet"` | Small display word above the headline. |
| `title` | `string` | `"The\ncrew"` | `\n` breaks lines. The widest line is fitted to the column width. |
| `intro` | `string` | demo copy | One or two sentences. |
| `cta` | `{ label, href } \| null` | `Start a project` | Primary button. |
| `secondaryCta` | `{ label, href } \| null` | `null` | Underlined text link, e.g. "See open roles". |
| `preset` | `"ember" \| "cobalt" \| "moss" \| "mono"` | `"ember"` | Field, chips and tritone together. |
| `palette` | `Partial<RosterPalette>` | | Override any of `ground, deep, hot, glow, ink, shadow, highlight`, plus `mid`, the tritone midtone (defaults to a paler mix of `hot` and `highlight` so the prints lift off the field). |
| `columns` | `number` | `3` | Columns on wide screens (2 to 4). |
| `driftSeconds` | `number` | `9` | Seconds a column takes to drift past one portrait. `0` turns the drift off. |
| `drift` | `boolean` | `true` | `false` gives a still, scannable wall: every person once, columns staggered, the section grows with the team and the headline stays pinned beside it (sticky). The cobalt demo uses it. |
| `height` | `string` | `"100svh"` | Tablet and desktop height; min 600px. A definite length, never a percentage. Phones size to content. |
| `fontFamily` | `string` | `"Arial Black", "Archivo Black", "Helvetica Neue", Inter, …` | The display face. Pass your brand's heavy grotesk if the page already loads one. |
| `stretch` | `number` | `1.16` | Horizontal stretch of the display face, for the wide poster look. `1` turns it off. |
| `uppercase` | `boolean` | `true` | |
| `grain` | `boolean` | `true` | Static film grain over the field. |
| `labels` | `Partial<RosterLabels>` | English | `pause, play, team, openRole, hiring, roleLink, memberLink`, for translation. |
| `className` | `string` | | |
| `onMemberSelect` | `(member) => void` | | Called when a portrait is clicked or opened with Enter. |
| `clickFollowsLink` | `boolean` | `true` | A mouse click on a portrait follows its `href`, except `mailto:` links, which stay on the card's "Say hello" link. |

## Notes

- The section paints its own colour field, so it looks the same on light and dark pages.
- Repeated portraits (the columns loop) are `aria-hidden` and out of the tab order. Every person appears once to assistive tech.
- The tritone is an SVG `feComponentTransfer` filter, so it works in every modern browser and in software rendering. The full-colour photo sits underneath and fades in to about 72% when a card opens.

## Photo credits

The default portraits are from [Unsplash](https://unsplash.com) under the Unsplash License, loaded from `images.unsplash.com`:
`photo-1494790108377-be9c29b29330`, `photo-1507003211169-0a1dd7228f2d`, `photo-1438761681033-6461ffad8d80`, `photo-1500648767791-00dcc994a43e`, `photo-1544005313-94ddf0286df2`, `photo-1472099645785-5658abf4ff4e`, `photo-1517841905240-472988babdf9`, `photo-1506794778202-cad84cf45f1d`, `photo-1502823403499-6ccfcf4fb453`, `photo-1524504388940-b1c1722653e1`. The names, roles and the studio are fictional; replace them with your own team.
