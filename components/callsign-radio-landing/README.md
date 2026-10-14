# Callsign Radio Landing

A complete homepage for an independent radio station, laid out like a live front page. The
station's call sign runs up the left edge as a giant masthead, and that masthead is the level
meter: press play and the letters drain, then fill segment by segment with the signal (two
channels, a peak tick, and a red zone where the frequency sits). The feature slot shows the
show on air now. The right rail is today's schedule, ticking in the station's own time zone,
and clicking any row previews that show in the feature slot.

Below the fold it keeps the same language: the ways to tune in set in the call sign's face, the
residents as an index with their artwork following the pointer, an archive whose play buttons
drive the same player, a support tuner you drag like a dial, and a footer whose wordmark is the
meter again. A mini player docks to the bottom of the page while something is playing.

- One file, React only. No fonts, images or network requests unless you pass them.
- The display face is drawn in SVG strokes (A to Z, 0 to 9, common marks), so the masthead
  looks the same on every OS.
- Show artwork is generated as two-ink riso prints (five layouts: rings, bars, dots, stripes,
  blocks). Any show or episode takes an `image` instead.
- Light and dark themes for both presets. It follows the host's `.dark` class, then the OS.
- Keyboard and screen-reader complete: real buttons, a slider for the dial, a modal phone menu,
  live announcements. Under reduced motion the meter holds a steady level.

```tsx
import CallsignRadioLanding from "@/components/ui/callsign-radio-landing"

export default function Page() {
  return (
    <CallsignRadioLanding
      station={{ name: "Kora Radio", callsign: "KORA", frequency: "98.4", city: "Rotterdam", timeZone: "Europe/Amsterdam" }}
      streamUrl="https://stream.example.com/live.mp3"
      corsMeter
      onSupport={async (amount, cadence) => { /* start checkout */ }}
    />
  )
}
```

## The player and the meter

There is one `<audio>` element and it never autoplays. With a `streamUrl`, play starts the
stream; without one, play still works and the meter runs on a simulated signal (music pumps on a
beat, `kind: "talk"` shows speak in syllables), which is what the demos do. An episode with an
`audioUrl` plays the same way.

The meter reads the real signal only when you set `corsMeter`, because a browser analyser
returns silence for a stream that does not send CORS headers (and routing a non-CORS stream
through Web Audio mutes it). Leave it off for those streams: the letters then follow the
simulated envelope while audio plays.

A stream that fails shows "The stream did not start" with a retry.

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `station` | `{ name, callsign, frequency, city, tagline, timeZone }` | Kora Radio, 98.4, Rotterdam | `callsign` is the masthead; `frequency` is printed after it and lit red. `timeZone` is an IANA zone. |
| `links` | `{ label, href }[]` | Listen / Schedule / Residents / Archive / Support | `#listen`, `#schedule`, `#residents`, `#archive`, `#support` scroll inside the page. |
| `memberCta` | `string` | `"Become a member"` | The nav button; scrolls to the support tuner. |
| `streamUrl` | `string` | none | Live stream. |
| `corsMeter` | `boolean` | `false` | Set when the stream sends CORS headers. |
| `shows` | `CrShow[]` | 9 shows | `{ id, title, host, genres, blurb, ink?: [a, b], art?, image?, kind?, slot?, href?, hidden? }` |
| `schedule` | `{ start: "13:00", show: id }[]` | a full day | Each slot runs until the next one starts. |
| `week` | `{ mon: CrSlot[], ... }` | none | Per-day running orders, picked by the station's weekday. |
| `episodes` | `CrEpisode[] \| null` | 7 episodes | `{ id, show, title, date, minutes, audioUrl?, image? }`. `null` hides the archive. |
| `listen` | `{ title, ways } \| null` | FM, DAB+, stream, studio line | `ways: { value, unit, text, href? }[]` |
| `residents` | `{ title, text } \| null` | | Shows with `hidden: true` are left out. |
| `archive` | `{ title, text } \| null` | | Genre filters come from each show's first genre. |
| `support` | `{ title, text, currency, min, max, start, tiers, fallbackPerk, fallbackTier, doneTitle, doneText } \| null` | €3 to €30, 4 tiers | Perks accumulate as the dial passes each tier. `doneTitle` replaces `{tier}`. |
| `footer` | `{ columns, address, addressTitle, email, newsletterTitle, newsletterText, successText, legal } \| null` | | |
| `labels` | `Partial<CrLabels>` | English | Every interface string ("On air now", "Listen back", "Give", "a month", "Menu"...), for any language. |
| `preset` | `"night" \| "daytime"` | `"night"` | Night: carbon and chalk, on-air red. Daytime: signal yellow, green tally, chunkier meter segments. |
| `palette` | `{ light?: {...}, dark?: {...} }` | | Override any token: `ground, ink, muted, line, dim, tally, onTally, panel, paper`. |
| `theme` | `"system" \| "light" \| "dark"` | `"system"` | |
| `themeToggle` | `boolean` | `true` | |
| `onPlay` | `(source) => void` | | `{ kind: "live" }` or `{ kind: "episode", episode }`. |
| `onRemind` | `(show, start) => unknown` | | "Remind me" on a later slot. Return `false` or reject to show it failed. |
| `onSupport` | `(amount, cadence, tier) => unknown` | | Same contract. Without it the button simulates success. |
| `onSubscribe` | `(email) => unknown` | | Same contract. |
| `height` | `string` | `"100svh"` | Hero height, clamped to 640 to 1000 px. Never a percentage. |

## Demos

- `demo.tsx`: Kora Radio, a listener-funded club station in Rotterdam, night preset.
- `demo-daytime.tsx`: Veld FM, a volunteer community station in Deventer on signal yellow, with
  a talk-heavy schedule and its own tiers.

## Notes

- No dependencies beyond React.
- The reference was the Verge's homepage layout (a vertical masthead, a feature slot and a
  timestamped rail). The brand, copy and imagery here are all original; every show, person,
  address and phone number in the defaults is fictional.
