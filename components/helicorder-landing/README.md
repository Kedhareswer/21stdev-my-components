# Helicorder Landing

A full company page for an earthquake early-warning service, printed on a
seismograph drum. The hero is a working helicorder record: pen traces one line
per minute, ink cycling black, blue, red and green like a real drum. In dark mode
it becomes smoked paper, with white scratches in soot. The rest of the page stays
on the same ruled paper, with the drum's left time margin, three-component trace
bands between sections, and a pen that lifts off the roll in the footer.

- **Hero drum** (Canvas 2D): the record of one day (`quake.at`, 14 Mar 2026 by
  default) is already on the paper on the first frame. A recorded M5.8 is annotated in
  red pen (ALERT, P, S and a bracket for the
  17.1 s of warning). Ground noise, the quake (band-limited P, S and coda with real
  arrival times) and knocks come from one seeded seismometer model, so the record
  looks the same on every visit. The pen keeps writing in real time and sleeps off
  screen. The lines above the quake and its coda are the archive and never move.
  Only the lines below feed, sliding up one line when the last one fills. **Tap or click the record** and the pen writes your knock as a damped
  two-mode seismometer response. **Replay the M5.8** records the quake live and
  raises the alert a building would get. The countdown to the S-wave appears beside
  the pen and on the button. The
  canvas holds a pixel budget (about 2.2 MP), so big screens and software
  renderers stay light. Times print in UTC on the left and local time on the right.
- **Where the seconds come from**: the four steps from rupture to alert, beside a
  **warning-time calculator**. Drag the distance and the seismogram, the P and S
  marks and the hatched warning window move (P at 6 km/s, S at 3.5 km/s, alert
  4.6 s after rupture). Inside about 16 km it says there is no warning.
- **Site playbooks**: tabs for factory, school, hospital and rail (arrow keys,
  Home and End work). Each one is a timed log of actions, drawn as red ticks on the
  last seconds before the S-wave. Hover a row to find its tick.
- **Network**: the recorded M5.8 as six stations heard it, nearest first. Each P pick
  is a red tick, and a red line marks the alert at 4.6 s, where the third station
  agrees. The network's readings are the table's footer.
- **Drill record**: the customer quote, with the campus sensor's trace of the drill
  under it. The tone, a burst of footsteps and a red bracket mark the seconds to
  under the desks.
- **Rate card**: a building stepper with a volume price, laid out as a calibration
  card with a pen note.
- **FAQ**: each question has a trace fragment in the margin, and each answer is a
  pen note.
- **Footer**: the record ends, and the pen lifts off along the wordmark's baseline.
  Strum the trace with the pointer and it ripples like a plucked string, then
  settles and stops.

Under the whole page runs more of the same record: faint trace lines at the drum's
pitch, in its inks, with minute stamps in the margin. The copy sits on paper slips
over them. Each section starts with a red pen tick, and each divider is two more
lines with a small event the network logged and let pass.

Theme: `defaultTheme="system"` follows the host's `.dark` class, then the OS. The
round button in the header switches paper. Under `prefers-reduced-motion` the pen
stands still, Replay prints the quake at once, and the station traces stop.

In-page links scroll inside the template and leave the host URL alone.

```tsx
import HelicorderLanding from "@/components/ui/helicorder-landing"

<HelicorderLanding
  brand="Foreshock"
  height="100svh"
  quake={{ magnitude: 5.8, distanceKm: 76, place: "Sea of Marmara" }}
  cta={{ label: "Book a site survey", href: "#fsk-survey" }}
/>
```

Every block takes its content as a prop: `nav`, `cta`, `hero`, `quake`, `how`,
`sites`, `network`, `quote`, `pricing`, `faq`, `footer`. The defaults are a
fictional company, Foreshock, with stations along the North Anatolian Fault. The
station names are real places, but the network, metrics, customer and quote are
invented sample content. Replace them before shipping.

`height` sets the header plus the drum, so it must be a definite length. Never use
a percentage.

No dependencies beyond React. No images, fonts or network requests. Fonts fall back
to Helvetica Neue / Arial and the system monospace.
