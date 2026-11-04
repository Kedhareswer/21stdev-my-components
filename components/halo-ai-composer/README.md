# Halo AI Composer

The message box of an AI chat app, ringed by an ember halo. On focus, a turning conic gradient (orange, rose, gold) lights the border and casts a soft blurred glow behind the card. While a reply runs, the glow breathes faster and the send button becomes a stop button with a spinning ring. Typing `/` opens a command palette above the box. Files can be attached, dropped or pasted, and they show as chips with image previews. Search and Think toggle as pills. The mic dictates through the Web Speech API, with a live bar meter and a timer. Starter prompts stagger in while the box is empty. It follows the host theme: porcelain in light, graphite under `.dark`.

No dependencies beyond React. Geist (Latin subset) is embedded.

```tsx
import HaloAiComposer from "@/components/ui/halo-ai-composer"

<HaloAiComposer
  onSubmit={async ({ text, command, attachments, modes }) => {
    await streamReply(text, { command, modes, files: attachments })
  }}
  onStop={() => abortController.abort()}
/>
```

`onSubmit` can return a promise. The composer shows its busy state and stop button until the promise settles. Attachments carry `{ id, name, size, preview }`; keep your own `File` references if you upload them.

## Props

| Prop | Default | What it does |
|---|---|---|
| `placeholder` | `"Ask anything, or type / for commands"` | Empty-field text. |
| `commands` | Summarize, Rewrite, Translate, Explain code, Make a plan | `{ id, label, hint, prompt }`. Picking one fills `prompt` and shows a removable tag. |
| `suggestions` | three starters | Chips shown while the box is empty. |
| `modes` | Search, Think | Toggle pills. The ids of the ones turned on arrive in `modes`. |
| `maxLength` | `2000` | The counter appears at 80 % and turns red past the limit, which blocks sending. |
| `onSubmit` | – | Called with the message. Return a promise for the busy state. |
| `onStop` | – | Called by the stop button. |

## Accessibility

The textarea is a labelled combobox. When the slash menu is open, `aria-activedescendant` tracks the active command: Up and Down move, Enter or Tab picks, Escape clears. Enter sends and Shift + Enter breaks the line, and IME composition is respected. Every icon button has a label, the toggles use `aria-pressed`, and the character count is linked with `aria-describedby`. Attach, remove, send and finish are announced politely. The textarea grows with its content through a CSS grid mirror, not by measuring. With `prefers-reduced-motion`, the halo stops turning and the springs are off.
