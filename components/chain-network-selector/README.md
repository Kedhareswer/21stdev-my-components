# Chain Network Selector

A multi-select dropdown for wallets and dashboards. The pill shows a cluster of the selected networks' marks, with "+N" for the rest, and a summary such as "All networks", "Base" or "3 networks". The panel opens with a springy scale and its rows stagger in. Behind the list, a soft glow mixes the colours of whatever you've selected and shifts as you choose. Each row's check fills in the network's own colour and draws its tick. Unselected rows fade their mark and balance.

```tsx
import ChainNetworkSelector from "@/components/ui/chain-network-selector"

<ChainNetworkSelector
  networks={[
    { id: "eth", name: "Ethereum", color: "#627eea", value: "$12,480.22", detail: "Gas 14 gwei" },
    { id: "base", name: "Base", color: "#0052ff", logo: "/base.svg" },
  ]}
  onChange={(ids) => setChains(ids)}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `networks` | required | `{ id, name, color, logo?, value?, detail? }[]`. Without `logo`, the mark is a one-letter monogram on `color`. |
| `defaultValue` | all ids | Selected ids at start. |
| `onChange` | none | Called with the selected ids, in list order. |
| `label` | `"Networks"` | Accessible name for the listbox. |
| `defaultOpen` | `false` | |

## Notes

- React only. No other dependencies. The demo uses monograms; pass `logo` to use real logos.
- WAI-ARIA multi-select listbox with `aria-activedescendant`. Up, Down, Home and End move. Space or Enter toggles. Escape closes and returns focus. Tab and outside clicks close it.
- The list height comes from the row count (52 px rows), so nothing is measured.
- Reduced motion makes every change instant.
