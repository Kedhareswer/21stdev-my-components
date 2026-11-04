# Inline Label Composer

A label property for issue trackers and docs, in the spirit of a notes app. Click "Add" and a popover springs open with your current labels in the search field. Type to filter. Up and Down move, Enter toggles, and Backspace in an empty box removes the last label. Type a name that doesn't exist and a "Create" row appears with a live preview chip, plus a colour row you can cycle with Left and Right. Press Enter and the new label hops into the row with a little tumble. Chips tint themselves from their colour, so they read well in light and dark themes.

```tsx
import InlineLabelComposer from "@/components/ui/inline-label-composer"

<InlineLabelComposer
  labels={[
    { id: "bug", name: "Bug", color: "#e5484d" },
    { id: "safari", name: "Safari", color: "#0090ff" },
  ]}
  defaultValue={["bug"]}
  onChange={(ids, labels) => save(ids, labels)}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `labels` | required | `{ id, name, color }[]` |
| `defaultValue` | `[]` | Selected ids at start. |
| `palette` | 9 colours | Colours offered for new labels, cycled after each create. |
| `title` | `"Labels"` | Accessible name for the group and listbox. |
| `onChange` | none | Called with the selected ids and the full label list (which now includes created labels). |

## Notes

- React only. No other dependencies.
- The search box is an ARIA combobox over a multi-select listbox, using `aria-activedescendant`. Escape closes it and returns focus to "Add". Tab and outside clicks close it. The colour row is a radio group.
- New ids are slugged from the name and kept unique.
- Colours follow the host's semantic tokens; chips mix their own colour in with `color-mix`.
- Reduced motion makes every change instant.
