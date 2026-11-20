# Slide-in Assistant Panel

A notes app with an AI assistant that slides in from the right. Press the panel button in the note's top bar (or Ctrl/Cmd J) and a gap opens beside the note while the assistant card slides 24 px in and fades up. The note itself is pushed over and stays centred in the space that is left.

An empty chat offers three suggestions. Pick one, or type, and your question rises in as a dark bubble with the note attached above it. A shimmering *Thinking…* line holds for a moment, then turns into *Thought for 2 seconds*, which opens a short note on how the answer was reached, and a source count. The answer streams in word by word behind a blinking dot, with numbered headings and short paragraphs, and the feed keeps the newest words in view. When it finishes, a row of actions fades in: copy, thumbs up and down, regenerate, and **Insert into note**. That appends the answer to the note, scrolls it into view and flashes it blue before the highlight fades.

The composer holds the attached context as chips you can remove. **+** attaches the note again or a second file, and the model pill switches between *Fast* and *Thorough*, which thinks for longer. While an answer streams, the send button becomes a stop button. The pencil starts a new chat, and × or Esc closes the panel.

Below 700 px of width the panel covers the note instead, rising 30 px as it fades in.

It needs nothing beyond React. There are no images to host.

```tsx
import SlideInAssistantPanel from "@/components/ui/slide-in-assistant-panel"

<SlideInAssistantPanel
  note={{
    folder: "Docs",
    title: "Release plan",
    date: "Monday, March 3",
    paragraphs: ["…", "…"],
  }}
  replies={[
    {
      prompt: "What ships first?",
      keys: ["first", "ship"],
      reasoning: "Read the plan and ordered the items by date.",
      blocks: [["p", "The import tool, on the 12th."]],
    },
  ]}
  mode="overlay"
  onInsert={(text) => console.log(text)}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `note` | a made-up Friday recap | `{ folder, title, date, paragraphs }`. The note is always the first attachment. |
| `replies` | three canned answers | `{ prompt, keys?, reasoning, sources?, blocks, insert? }`. `blocks` are `["p" \| "h" \| "li", text]`. A typed question matches `prompt` exactly, or contains one of `keys`. |
| `fallback` | a short overview | The answer for anything that matches nothing. |
| `suggestions` | the replies' prompts | Listed in an empty chat. The first one is what `autoPlay` types. |
| `files` | one PDF | Extra files the **+** menu can attach. |
| `defaultOpen` | `false` | |
| `autoPlay` | `false` | Loops open → type → ask → stream → close every 11 s, until someone clicks or types inside the component. |
| `mode` | `"push"` | `"overlay"` floats the panel over the note instead of pushing it. |
| `panelWidth` | `400` | px. |
| `shortcut` | `true` | Ctrl/Cmd J toggles the panel. Esc closes it when focus is inside the component. |
| `height` | `"100svh"` | Height of the whole piece. |
| `onOpenChange`, `onInsert` | — | |

## Timing

Measured on the reference at 1280 × 720.

| | |
|---|---|
| Slot opens / panel slides | 0.52 s, `cubic-bezier(.3, .7, .2, 1)`; panel opacity 0.3 s |
| Question rises in | 0.45 s, 10 px |
| Thinking | 1.1 s (*Fast*), 2.2 s (*Thorough*) |
| Streaming | one word every 30 ms |
| Menus | 0.18 s, 6 px lift |
| Inserted paragraph | highlighted for 1.6 s, then fades over 1.2 s |
| `autoPlay` loop | opens at 0.86 s, types from 1.96 s (38 ms a key), sends at 3.3 s, closes at 9.21 s, restarts at 11.06 s |

## Notes

- Colours come from `--color-foreground`, `--color-background`, `--color-muted-foreground` and `--color-border`, mixed with `color-mix()`, so light and dark both follow the host. The sage backdrop is mixed from the background too.
- The font stack is `Inter, ui-sans-serif, system-ui`. Nothing is loaded; Inter is used if the page already has it.
- Under `prefers-reduced-motion` nothing slides, shimmers or blinks, and answers appear whole.
- The composer grows with `field-sizing: content` (Chromium). Elsewhere it stays one line and scrolls.
