# Morph Filter Bar

A filter row where the "+" button at the start of the row grows into the picker. Click it and the small black square stretches on a spring into a search panel listing fields (Status, Assignee, Priority…). Pick a field and a lime crumb drops into the search box while its values stagger in, with colour dots or faces. Pick a value and the panel shrinks back into the "+" as a new segmented chip ("Status | is | In progress | ×") pops into the row. Removing a chip shrinks it out.

```tsx
import MorphFilterBar from "@/components/ui/morph-filter-bar"

<MorphFilterBar
  title="Issues"
  fields={[
    { key: "status", label: "Status", options: [{ value: "done", label: "Done", swatch: "#3ccf8e" }] },
    { key: "assignee", label: "Assignee", options: [{ value: "maya", label: "Maya", avatar: "/maya.jpg" }] },
  ]}
  defaultValue={[{ key: "status", value: "done" }]}
  onChange={(filters) => setQuery(filters)}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `fields` | required | `{ key, label, icon?, options: { value, label, swatch?, avatar? }[] }[]`. `icon` is an SVG path on a 24-unit grid. |
| `defaultValue` | `[]` | `{ key, value }[]`. One filter per field; picking a new value replaces the old one. |
| `onChange` | none | Called with the full filter list. |
| `onOpenChange` | none | Called when the picker opens or closes, e.g. to dim the results behind it. |
| `title` | `"Filters"` | Label above the row, with a count and "Clear all". |

## Notes

- React only. No other dependencies.
- The search box is an ARIA combobox with `aria-activedescendant`. Up and Down move through options, Enter picks one, Backspace in an empty box or Escape goes back to the fields, and Escape again closes. Tab and outside clicks close it.
- The panel height comes from the row count (40 px rows, six visible), so nothing is measured.
- Reduced motion makes every change instant.
