# Connectome Arc Explorer

A mirrored radial wiring diagram. Pick a cell type in the middle column and two arcs light up around it. The left arc shows where that type **receives** synapses and the right arc shows where it **sends** them, with bundled curves running out to the neuron classes upstream and downstream.

```tsx
<ConnectomeArcExplorer defaultSelected="PAM" defaultExpanded={["PAM", "KC"]} />
```

Both arcs hold the same regions in the same order, mirrored, so any region reads straight across from input to output. Regions are tiles grouped into neuropil bands, and those bands sit inside optional super-regions (the mushroom body in the sample). A tile's tint is its share of the busiest region on that side. Curve width and node size follow how much each neuron class talks to the selected type.

Changing the selection morphs everything instead of swapping it. Tints, curves, node sizes, the legend and the totals all ease from the old type to the new one, and a second click mid-morph turns around from wherever it is. The first time the card scrolls into view the arcs unfurl from the column, the curves draw out to their nodes and the nodes pop in.

**No dependencies.** React is the only import. The diagram is SVG on a fixed 1200 × 800 stage, and the whole stage scales to the card's width, so text and lines stay crisp at any size. The tooltip sits outside the scaled stage and is always drawn at real pixel size.

## Interaction

| | |
|---|---|
| Click a cell type | Select it. A group header selects the whole group, summed |
| `+` / `−` | Expand or collapse a group. The column scrolls when it is longer than the arcs, fades at the edges, and keeps the selection in view |
| Hover a tile | Tooltip with input and output synapses, neurons that reach it, share of the type and the top upstream and downstream classes. The same region outlines on **both** arcs and only its curves stay lit, with a slow flow along them |
| Hover a band | The same for a whole neuropil, or a super-region such as the mushroom body |
| Hover a neuron node | Its curves and the regions they reach, with its busiest regions in the tooltip |
| Click anything | Pin it. Click again, click empty space or press `Esc` to release |
| Keyboard, column | `↑` `↓` move, `→` opens a group (or steps into it), `←` closes it (or steps out), `Home` / `End`, `Enter` selects |
| Keyboard, arcs | The arcs are one tab stop. `↑` `↓` walk the regions, `←` `→` jump between the input and output arc, `Enter` pins, `Esc` clears. Every move is announced |

On a card narrower than 720px the diagram shows one arc at a time with an **inputs / outputs** switch.

## Props

| Prop | Default | |
|---|---|---|
| `data` | the sample | `Partial<ConnectomeData>`. Anything left out falls back to the sample. See below |
| `selected` / `defaultSelected` | — / the first group | Controlled or uncontrolled selection, a cell type or group id |
| `onSelectedChange` | — | `(id) => void` |
| `defaultExpanded` | the selection's group | Group ids open at first render. A selection made from outside always opens its group |
| `colors` | `{ input: "#ea8a2e", output: "#3b88e6", accent: "#4f9f5b" }` | Any CSS colours. `accent` is the column's selection |
| `labels` | `cell types`, `input`, `output`, `regions of interest`, `neurons of interest` | Override any of `{ cellTypes, input, output, regions, neurons }` |
| `unit` / `unitPlural` | `"synapse"` / `unit + "s"` | What a connection is called |
| `locale` | `"en-US"` | Number formatting |
| `duration` | `720` | Selection morph length, ms |
| `seed` | `7` | Seed for the sample numbers |
| `onRegionClick` | — | `({ region, side, cellType }) => void`. Also fires on `Enter` |
| `className` | `""` | Appended to the card |

## Data

```ts
type ConnectomeData = {
  cellTypes: { id; label; hint?; children?: { id; label; hint? }[] }[]
  regionGroups: { id; label; name?; within?: string; regions: { id; label; name? }[] }[]
  supers?: { id; label; name? }[]          // a group's `within` names one of these
  inputNeurons: { id; label; name? }[]
  outputNeurons: { id; label; name? }[]
  profiles: Record<cellTypeId, {
    count?: number                          // neurons of this type
    inputs?: Record<regionId, number>       // synapses received per region
    outputs?: Record<regionId, number>      // synapses made per region
    inputLinks?: Record<neuronId, Record<regionId, number>>
    outputLinks?: Record<neuronId, Record<regionId, number>>
    innervation?: Record<regionId, number>  // neurons of this type reaching each region
  }>
}
```

A group without its own profile is the sum of its children. Negative, missing and non-numeric counts read as zero. The regions are laid out top to bottom in the order you give them, with a small gap between groups and a wider one where a super-region ends.

The sample is a sketch of the fly mushroom body: 14 PAM and 6 PPL1 dopaminergic types, 6 Kenyon cell types, 8 output neurons, APL and DPM, across 20 mushroom-body compartments and 18 neighbouring neuropils. The cell counts and compartments follow the published anatomy (Aso et al. 2014, the hemibrain). The synapse numbers are invented to have the right shape. `sampleConnectome(seed)` and the `SAMPLE_*` constants are exported if you want to start from them.

## Colours and theme

Surfaces and text use `--color-background`, `--color-foreground`, `--color-border` and `--color-muted-foreground`, each with a literal fallback, so the card follows the host's light or dark theme. Tiles, bands and curves are `color-mix()` blends of those tokens, and the three accent colours are the only fixed colours.

## Motion

`prefers-reduced-motion` makes the selection morph instant, skips the entrance, stops the flowing curves and turns off every CSS transition.
