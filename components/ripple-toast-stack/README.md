# Ripple Toast Stack

Toast notifications that land with a ripple. Each toast springs in. Its icon badge pops, draws its glyph, and sends out two expanding rings, while a tinted wash spreads across the toast from the icon. New toasts stack as a neat peeking deck that fans out on hover or focus. A thin progress line runs down the time left, and it pauses while you hover, while the stack has focus and while the tab is hidden. Swipe a toast sideways to throw it away. Promise toasts spin, then turn into success or error in place and ripple again. Light or dark follows the host's `.dark` class.

No dependencies beyond React. Geist (Latin subset) is embedded.

```tsx
import RippleToastStack, { toast } from "@/components/ui/ripple-toast-stack"

// once, near the root
<RippleToastStack position="bottom-right" />

// anywhere
toast.success("Changes saved", { description: "Your workspace is up to date." })
toast.error("Payment failed", { action: { label: "Retry", onClick: retry } })
toast.promise(deploy(), { loading: "Deploying", success: "Deployed", error: "Deploy failed" })
toast.dismiss(id) // or toast.dismiss() for all
```

## API

`toast(title, options)` (info), `toast.success`, `toast.error`, `toast.info`, `toast.warning`, `toast.loading` and `toast.promise`. Each returns the toast id. Pass the same `id` again to update a toast in place.

| Option | What it does |
|---|---|
| `description` | Second line. |
| `duration` | ms on screen. `0` keeps it until dismissed. Loading toasts never time out. |
| `action` | `{ label, onClick }`, a button that also dismisses. |
| `id` | Reuse it to replace an existing toast. |

| Prop | Default | What it does |
|---|---|---|
| `position` | `"bottom-right"` | `top-` or `bottom-` with `left`, `center` or `right`. |
| `contained` | `false` | Pins to the nearest positioned parent instead of the viewport. |
| `max` | `5` | Toasts kept; older ones drop off. |
| `duration` | `4500` | Default duration. |

## Accessibility

The stack is a labelled region. Each toast is focusable and is a `status` (polite) or, for errors, an `alert` (assertive). Escape or Delete dismisses the focused toast. Close buttons are labelled with the toast's title. Focusing a toast fans out the stack and pauses every timer, so keyboard users get as long as they need. Back toasts in the collapsed deck are hidden from assistive tech. With `prefers-reduced-motion`, the springs, rings and wash are off and toasts just fade.

The swipe reads only pointer deltas. The toast width comes from a `ResizeObserver` cache, so a drag never forces layout.
