# Live Voice Room

A live audio room in the warm low light of a late-night lounge. The header has a pulsing LIVE pill, the audience count and a running timer. Below it, a stage of speakers in photo-real portraits; whoever is talking gets an amber ring that swells with their voice, a glow, and a three-bar meter by their name. Muted speakers wear a rose mic badge. Live captions type out word by word with the speaker's face. The audience strip stacks listener faces with your seat. A control bar holds mute, raise hand (a waving badge on your seat), a reaction picker whose emoji float up the card, and Leave quietly, which lands on a rejoin screen. The stage and faces stagger in on mount.

No dependencies beyond React. Bricolage Grotesque and Geist (Latin subset) are embedded. Nothing here records audio. By default the voice levels are simulated from the captions. Wire `getLevel` to your WebRTC or audio analyser for real meters.

```tsx
import LiveVoiceRoom from "@/components/ui/live-voice-room"

<LiveVoiceRoom
  title="Late-night design crit"
  speakers={[{ id: "ines", name: "Ines Duarte", role: "Host", avatar: "/ines.jpg" }, { id: "jonah", name: "Jonah Reid", muted: true }]}
  listeners={people}
  audience={214}
  captions={[{ by: "ines", text: "Okay, what's the one thing you want us to push on?" }]}
  getLevel={(id) => analysers[id]?.level ?? 0}
/>
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `title`, `topic` | design-crit copy | Header text. |
| `speakers` | – | `{ id, name, avatar?, role?, muted? }`. Without an avatar, the initial is shown. |
| `listeners` | `[]` | The first five show as faces. |
| `audience` | everyone listed | The number in the header. |
| `captions` | `[]` | `{ by, text }` lines, typed out in turn. The line's speaker is the one talking. |
| `you` | `{ id: "you", name: "You" }` | Your seat in the audience. |
| `getLevel` | simulated | `(id, t) => 0..1`, read every frame. Meters use a fast attack and a slow release. |
| `onLeave` | – | Called on Leave quietly. |

## Accessibility and performance

The room is a labelled region and the stage is a list. "speaking" and "muted" are spelled out for screen readers on each speaker. The mic is a toggle with `aria-pressed` and a label that says what it will do. The reaction picker is a labelled group that Escape closes. Mute, hand and reaction changes are announced politely. Captions are not re-announced word by word. With `prefers-reduced-motion`, the rings hold a steady glow and nothing staggers or floats. Below 440 px, the control labels collapse to icons but keep their accessible names.

One `requestAnimationFrame` loop writes a `--lvr-l` CSS variable per seat. It never reads layout, and the rings scale by transform only.
