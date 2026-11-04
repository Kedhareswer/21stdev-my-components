# Crew Avatar Picker

A participant picker for calls, huddles and shared docs. A row of round portraits sits in greyscale until you tap one. Then it fills with colour, lifts, gets a ring in that person's colour, and its "+" badge spins into a tick. The picked faces stack up in the corner and the action button counts them ("Start huddle with 3"). The dashed "Add" tile opens a small directory with search, and picking someone there brings them into the row already selected.

```tsx
import CrewAvatarPicker from "@/components/ui/crew-avatar-picker"

<CrewAvatarPicker
  people={[{ id: "maya", name: "Maya Okafor", role: "Design lead", photo: "/maya.jpg", color: "#ff7a1a" }]}
  directory={[{ id: "kai", name: "Kai Moreno", role: "Marketing", photo: "/kai.jpg" }]}
  defaultValue={["maya"]}
  onAction={(ids) => startCall(ids)}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `people` | required | `{ id, name, photo, role?, color? }[]`. `color` is the ring and badge colour when picked. |
| `directory` | `[]` | More people for the "Add" tile. With none, the tile is hidden. |
| `defaultValue` | `[]` | Picked ids at start. |
| `title` | `"Participants"` | |
| `action` | `"Start huddle"` | Button text, followed by "with N". |
| `onChange` / `onAction` | none | Called with the picked ids. |

## Notes

- React only. No other dependencies.
- Faces are toggle buttons (`aria-pressed`) in a labelled group, with Left, Right, Home and End between them. The directory is a combobox with `aria-activedescendant`, and Escape closes it and returns focus to "Add".
- On narrow screens the row scrolls sideways with snap points.
- Reduced motion makes every change instant.
