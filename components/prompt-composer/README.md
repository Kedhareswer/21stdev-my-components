# Prompt Composer

The liquid-glass prompt box of an AI app builder:

- a placeholder that types example prompts out and deletes them again,
- platform chips (a radio group),
- a model menu (arrow keys, Escape),
- attachments through a real file input, listed as removable chips,
- a send button that breathes once there is something to send. `Enter` sends, `Shift + Enter` breaks the line.

Sending hands the prompt to `onSubmit`. With `simulate` on, the card then morphs into a five-step build log and into a preview card: the app's name taken from the prompt, with a phone or a screen mocked up beside it. *Refine prompt* brings the prompt back; *New app* clears it.

**Requires `gsap`.** It is a front end: nothing is generated or uploaded. Wire `onSubmit` to your own generator, and set `simulate={false}` to skip the demo build.

```tsx
import PromptComposer from "@/components/ui/prompt-composer"

<PromptComposer onSubmit={({ prompt, platform, model, files }) => startBuild(prompt, { platform, model })} />
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `prompts` | four examples | What the placeholder types. |
| `placeholder` | `"Describe your app in a sentence or two..."` | Shown while the field has focus. |
| `platforms` | Mobile app, Web app, Dashboard, Game | `{ label, icon }` chips. Icons: `spark`, `eye`, `code`, `chat`, `phone`, `rocket`, `window`, `bars`, `game`, `bolt`. |
| `models` | Turbo, Studio, Deep | Entries of the model menu. |
| `modelNotes` | fastest, balanced, most careful | One line under each model. |
| `buildSteps` | five steps | Lines of the demo build log. |
| `simulate` | `true` | Play the build log and preview after sending. |
| `hint` | `true` | The keyboard hint under the box. |
| `accent` | `"ice"` | `ice`, `ember` or `lime`. |
| `onSubmit` | | `({ prompt, platform, model, files })`. |
| `className` | | On the root. |

Built for a dark background: the glass needs something behind it. Part of the Mosaic kit. The full page is `mosaic-prompt-template`.
