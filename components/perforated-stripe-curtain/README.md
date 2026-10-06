# Perforated Stripe Curtain

A curtain of punched-tape strips that plays music. Idle, the strips hang grey
and ragged under a play button. Press play and they turn to your colour, a
stage lights up behind them — a roaming spotlight and huge captions you only
ever see through the gaps and the punched holes — and every strip stretches
with its own slice of the spectrum, jolting on each kick. Move over it and the
strips swing aside around the pointer, hinged at the top.

**No dependencies, no assets.** The music is an original drum-and-bass groove
synthesized live with Web Audio — no file, no network. Pass `audioSrc` to make
the curtain listen to your own track instead.

## Usage

```tsx
import PerforatedStripeCurtain from "@/components/ui/perforated-stripe-curtain"

<PerforatedStripeCurtain />
<PerforatedStripeCurtain
  strips={30}
  stripColor="#ffd23f"
  idleColor="#3b4a6b"
  background="#0a1022"
  lightColor="#2f6bff"
  captions={["TONIGHT", "MIDNIGHT", "ROOM 27"]}
  title="Live at Room 27"
  bpm={132}
/>
<PerforatedStripeCurtain audioSrc="/audio/teaser.mp3" />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** |
| `strips` | `22` | 4–64. |
| `stripColor` / `idleColor` | `#f4f3ef` / `#8d8d8b` | Playing / idle strip colour (6-digit hex). |
| `background` | `#0b0b0c` | Page behind the curtain. |
| `lightColor` | `#d21f1f` | Spotlight on the stage (6-digit hex). |
| `captions` | 4 words | One per bar on the stage behind the strips. |
| `title` / `credit` | — | Bottom-left / bottom-right labels. Empty hides. |
| `audioSrc` | — | Your track (same-origin or CORS-enabled). Loops. |
| `bpm` | `124` | Tempo of the built-in groove. |
| `volume` | `0.7` | 0–1. |
| `interactive` | `true` | Strips swing aside around the pointer. |
| `onPlayChange` | — | `(playing) => void` |

## Notes

- Audio starts only on the play press (browsers require a gesture) and the
  audio context is closed on unmount.
- Each strip listens to its own band of a log-spaced spectrum, so the bass
  doesn't move the whole curtain.
- `prefers-reduced-motion`: the strips stay still; the music and stage still play.
- Drawing pauses when the curtain is off-screen.
