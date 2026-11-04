# Odometer Currency Converter

A money-transfer quote card on cream banknote paper with a faint guilloche pattern. Type an amount, and the received figure rolls into place like a mechanical odometer: each digit is its own spring-eased drum, staggered from the right. Currencies sit on embossed gold coins in an animated listbox. The swap button spins half a turn and both amounts blur back in. A 30-day sparkline wipes in under the rate. Quick-amount chips sit under that, and a "Lock this rate" button turns gold and counts down 30 seconds with a ring.

No dependencies beyond React. Fonts (Instrument Serif, Geist, Latin subset) are embedded. Rates are static demo data: pass your own `currencies`.

```tsx
import OdometerCurrencyConverter from "@/components/ui/odometer-currency-converter"

<OdometerCurrencyConverter
  from="USD"
  to="EUR"
  amount={2500}
  currencies={[{ code: "USD", name: "US Dollar", symbol: "$", perUsd: 1 }, { code: "EUR", name: "Euro", symbol: "€", perUsd: 0.92 }]}
  onLock={(q) => console.log(q)}
/>
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `currencies` | 9 majors | `{ code, name, symbol, perUsd, decimals? }`, priced as units per 1 USD. JPY uses `decimals: 0`. |
| `from` / `to` | `"USD"` / `"EUR"` | Starting pair. |
| `amount` | `1000` | Starting amount. |
| `max` | `1,000,000` | Larger amounts mark the field invalid, with a message. |
| `presets` | 100, 500, 1,000, 5,000 | Quick-amount chips. |
| `onLock` | – | `{ from, to, amount, converted, rate }` when the rate is locked. |

## Accessibility

The amount is a labelled text input (`inputMode="decimal"`). It drops anything but digits and one decimal point, groups the digits as you type, and steps with Up and Down (hold Shift for ×10). An over-limit amount sets `aria-invalid` and announces a `role="alert"` message. The currency pickers are buttons with `aria-haspopup="listbox"`. In the list, the arrow keys, Home and End move, letters jump to a code, Enter or Space picks, and Escape closes. The odometer reads as one number to screen readers, and the rate line is a polite live region. With `prefers-reduced-motion`, the digits change without rolling and every spring is off.
