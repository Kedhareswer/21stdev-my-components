# rally-wordmark-footer

A full-screen footer with a giant monoline wordmark across its bottom half and a red ball
resting in the hook of the first "l". Tap the ball to knock it up and keep it in the air;
every letter is a sprung rigid body that swings when the ball lands on it and throws it on.
Drop it out of the bottom and the score resets while a new ball falls back into the hook.
Left alone for a couple of seconds, a ghost player keeps a short rally going.

## Props

| Prop | Default | Notes |
|---|---|---|
| `word` | `"hello"` | Letters available: `a e f h i l n o t u`. Others are skipped. The first `l` is the ball's home. |
| `headline` / `subline` | two lines about Kedhareswer | First line in ink, second muted. |
| `email` | `kedhareswer.12110626@gmail.com` | Rendered as a mailto link. |
| `contactLines`, `links`, `legalLinks`, `socials`, `copyright` | placeholders | Footer columns. |
| `hint` | `"Keep the ball up · tap it"` | Shown beside Score and Best. |
| `ballColor` | `#e2321b` | |
| `autoPlay` | `true` | Ghost rally when idle. Off under reduced motion. |
| `onSubscribe` | – | Called with the address from the signup field. |
| `height` | `"100svh"` | Min-height of the footer. A definite length. |

## Notes

- No dependencies beyond React. The wordmark and ball are drawn on one canvas behind the
  text; the canvas ignores pointer events, so every link stays clickable. Taps on the ball
  are caught on the footer itself.
- Colours: the letters use `--color-foreground`, text uses the semantic tokens, the ball
  uses `ballColor`.
- The best score is kept in `localStorage` when it is available.
- Keyboard: a "Tap the ball" button appears on focus.
- `prefers-reduced-motion`: the letters stay still and the ghost player is off; the ball
  still answers your taps.
