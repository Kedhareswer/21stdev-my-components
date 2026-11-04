# AI Workspace Shell

A full-page AI assistant layout on warm black with a slow coral bloom.

- **Sidebar.** New chat, search and recent threads. A lit marker slides to the active thread with a spring.
- **Empty state.** A turning flower emblem, a serif greeting that rises in word by word, and suggestion chips that send on click.
- **Composer.** Hints rotate in the empty field. The **Tools** menu pins a removable mode chip (Deep research, Agent mode…). The **model picker** springs open from its button with a check that pops onto the chosen model. The send button lights up once there's text.
- **Conversation.** Sending clears the greeting and shows your message. A shimmering "Thinking through it…" line follows, then the answer streams in a couple of words at a time.

Menus close on outside press or Escape and move with the arrow keys (↑/↓ on the button opens them). Below 820 px the sidebar becomes a drawer behind a menu button.

```tsx
import AiWorkspaceShell from "@/components/ui/ai-workspace-shell"

<AiWorkspaceShell
  userName="Ada"
  threads={["Q4 launch narrative", "Pricing page teardown"]}
  models={[{ id: "swift", name: "Swift 2", note: "Fast answers" }]}
  reply={(prompt, model) => "…your backend's answer…"}
  height="100svh"
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `userName` / `greeting` | `"Ada"` / time-of-day greeting | Greeting text. Without `greeting` it is worked out on the client, after mount. |
| `threads` | 6 samples | Sidebar list. |
| `suggestions` / `hints` | samples | Chips under the greeting and rotating placeholders. |
| `models` | Swift 2, Atlas Pro, Lumen Vision | `{ id, name, note }[]`. |
| `tools` | image, file, deep research, agent | `{ id, label, hint }[]`. |
| `reply` | canned answer | `(prompt, model, tool?) => string`, which is streamed in. Swap it for your own call when you wire it up. |
| `height` | `"100svh"` | A definite height. The layout never relies on `h-full`. |

## Notes

- React only. Streaming, hint rotation and menus run on timeouts and intervals. Auto-scroll writes `scrollTop` and reads nothing.
- `aria-live` announces the conversation. The menus are `role="menu"` with `menuitemradio` items, and the composer is a labelled textarea (Enter sends, Shift+Enter adds a line).
- `prefers-reduced-motion` removes the animations and shows answers whole.
