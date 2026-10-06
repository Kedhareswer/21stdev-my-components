# Perforated Stripe Curtain

A curtain of punched-tape strips hung in front of a picture. Idle, the strips
hang grey and ragged over a dimmed image, with a play button. Move over it and
the strips part around the pointer like a bead curtain, hinged at the top.
Press play: the music starts, the strips turn to your colour, the picture
brightens and the whole curtain swings open from the middle, swaying with the
beat. Strip lengths never change — only their angle moves.

**No dependencies, no assets.** The picture defaults to a painted landscape
(`backdrop` palette) and the music is an original groove synthesized live with
Web Audio — no file, no network. Pass `image` and/or `audioSrc` for your own.

## Usage

```tsx
import PerforatedStripeCurtain from "@/components/ui/perforated-stripe-curtain"

<PerforatedStripeCurtain />
<PerforatedStripeCurtain
  image="/photos/stage.jpg"
  strips={30}
  stripColor="#ffd23f"
  idleColor="#3b4a6b"
  background="#0a1022"
  lightColor="#2f6bff"
  captions={["TONIGHT", "ROOM 27"]}
  title="Live at Room 27"
  bpm={132}
/>
<PerforatedStripeCurtain backdrop="alpine" audioSrc="/audio/teaser.mp3" />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** |
| `image` | — | The picture behind the curtain (CORS-enabled works best). Falls back to the painted one if it fails. |
| `backdrop` | `"dusk"` | Painted landscape when there's no `image`: `dawn` · `alpine` · `dusk` · `mist`. |
| `strips` | `22` | 4–64. |
| `stripColor` / `idleColor` | `#f4f3ef` / `#8d8d8b` | Playing / idle strip colour (6-digit hex). |
| `background` | `#0b0b0c` | Page colour and the idle dimming. |
| `lightColor` | `#d21f1f` | Colour wash over the picture while playing (6-digit hex). |
| `openOnPlay` | `true` | Swing the curtain open from the middle while playing. |
| `captions` | `[]` | Words over the picture, one per bar while playing. |
| `title` / `credit` | — | Bottom-left / bottom-right labels. Empty hides. |
| `audioSrc` | — | Your track (same-origin or CORS-enabled). Loops. |
| `bpm` | `124` | Tempo of the built-in groove. |
| `volume` | `0.7` | 0–1. |
| `interactive` | `true` | Strips part around the pointer. |
| `onPlayChange` | — | `(playing) => void` |

## Notes

- Audio starts only on the play press (browsers require a gesture) and the
  audio context is closed on unmount.
- The music drives the sway — louder is wider — and every kick nudges the curtain.
- `prefers-reduced-motion`: the strips stay still and the curtain doesn't swing
  open; the music and the picture still play.
- Drawing pauses when the curtain is off-screen.
