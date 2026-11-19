# Shutter Roll Template

A scroll-driven landing page for a film-camera app that Kedhareswer builds (Project 01).

The page opens with a dot-matrix counter that winds the roll from 01 to 36. A slit shutter then opens on an olive tabletop scattered with instant prints, a yellow point-and-shoot and two film canisters. After that:

- Scrolling dives into one print. The camera rolls and pushes in until the photo fills the screen.
- The photo folds down into a phone's camera screen.
- Four film looks flip past on either side of the phone: Golden 200, Chrome 400, Instant 600 and Single Use. Each one has its own backdrop and its own grade on the photo.
- A torn sheet of night rises over the phone. A print slides out of the phone and lands beside a join code and a shared album.
- A second block names the roll on a tilted phone form. A footer with Kedhareswer's email closes the page.

```tsx
import ShutterRollTemplate from "@/components/ui/shutter-roll-template"

export default function Page() {
  return <ShutterRollTemplate />
}
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | Height of one pinned screen. Every scroll length is a multiple of it. Use a definite length, never a percentage. |
| `preloader` | `true` | Shows the winding counter and slit shutter before the page opens. |
| `className` | | Passed to the root. |

## Motion

- **Intro, about 1.8 s:**
  - The counter runs 01 → 36 on a 5 × 6 dot matrix, easing out. Each dot fades through a dim amber as it changes.
  - The counter blurs away. Two halves of the backdrop split from the centre line as a slit shutter.
  - The table settles from a 1.14 zoom. Prints and props drop onto it from above, staggered 42 ms apart, with a little overshoot.
- **Table:** prints, camera and canisters drift with the pointer, the deeper ones further.
- **Pinned reel, 10.4 screens:**
  - **Dive, 0.15 → 2.2:** the table scales about the target print on a front-loaded curve. It rolls up to 13° and back, and everything but the target blurs. The target swings flat, while the headline and card slide off down-left into a blur.
  - **Photo, 2.2 → 2.6:** a white flash, then the full-bleed photo with a slow push.
  - **Fold, 2.6 → 3.6:** the photo shrinks into the phone's screen rect, and the phone frame fades in around it.
  - **Films, 3.6 onwards, one screen each:** the words leave outward with a blur, and the next pair flies in from the edges. The backdrop crossfades and the photo's grade changes. The arrows under the phone jump to the previous or next film.
  - **Eject, 8.4 → 9.4:** the night section rises over the stage. A print travels from the phone's photo to its place in the album cluster.
- **Night:**
  - The headlines are scrubbed out of an 18 px blur as they scroll up.
  - The cards rise in and the join code fills module by module.
  - The prints drift at different depths.
  - A pill with the client line and a contact button stays pinned to the bottom.
- **Hover**, mouse pointers only: nav links, buttons, picker arrows and the night prints respond.
- **Reduced motion:** no counter, drops, pointer drift or blur transitions. Scrolling still steers the reel.

## Fonts

Anton and Sora are both under the SIL Open Font License. They are embedded as Latin subsets and renamed `SrDisplay` and `SrSans`, so the template never fetches a font.

## Pictures

Every picture is ChatGPT-generated and served from `https://kedhar-components.pages.dev/shutter-roll-template/` as WebP, about 770 kB in all. They are the tabletop, the group photo, nine table prints, six party prints, the string-light backdrop, and the camera and canisters cut out with alpha. The phone, QR-style join code, torn edge and UI are drawn in CSS.

## Dependencies

None beyond React.
