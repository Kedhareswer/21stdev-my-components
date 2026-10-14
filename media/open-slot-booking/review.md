# open-slot-booking: gate log

## Reference

`reference.png` is the savvycal.com landing hero, taken from the Tailwind CSS
showcase screenshots in the public `tailwindlabs/tailwindcss.com` repository
(`src/app/showcase/img/savvycal.com.png`,
https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/app/showcase/img/savvycal.com.png).
What was taken from it is the feel and layout only: a heavy rounded headline set in
two lines, the second line in a warm gradient, then a dark app window sitting on a
tilted, saturated yellow slab, with a host and meeting on the left and a week to
pick from on the right. Its brand, copy, logo and images were not copied.

Why it came from GitHub: this sandbox's egress policy blocks every image host:
cdn.21st.dev (so `get_inspiration` returned results but none of their `previewUrl`
images would download), images.unsplash.com, awwwards, dribbble, godly,
land-book, pexels, picsum and jsdelivr. Public GitHub clones work, so the
reference came from a repository of real-site screenshots. The same block is why
the component uses no photos: hosts get a stamped monogram, and `host.avatar`
takes a photo URL.

## Idea gate (fresh critic)

Five takes on the reference were judged:

1. open-slot-booking: a "book a call" section with a live week scheduler
2. office-hours-strip
3. demo-request-hero
4. availability-poll-card
5. calendar-overlay-pricing

The critic **picked 1**. Every agency, consultant or SaaS contact page needs one,
the library has no booking piece, and a working scheduler beats the reference's
static mock. The others were rejected:

- 2 is too thin, and it drops the reference's slab and window.
- 3 is a banned look: a product mock used as the hero.
- 4 is a niche job that needs a backend and reads like a dashboard.
- 5 is contrived, and it overlaps the existing pricing pieces.

Must get right (from the critic):

- The slab and the type carry the personality.
- The monogram must look crafted and stamped.
- The overlay toggle is the signature: hatching, with clashes struck through.
- A real shared-element morph from slot to confirm card to ticket, with Escape
  and focus return.
- A finished first frame.
- Trimmed scope.
- No banned looks.
- Install safety, with the logic in a `#region` for the test.

## Round 1: REDO (average 7.2)

| | Score |
|---|---|
| Usability | 7 |
| Idea | 7 |
| Craft | 7 |
| Originality | 6 |
| Install safety | 9 |

The critic asked for these changes, most important first. All were made except
the last:

1. **The overlay must be real.** The component no longer ships fake "your
   calendar" data: `visitorEvents` now defaults to `[]` and the sample week moved
   into the demo. New props: `loadVisitorEvents` (connect on demand, with a
   "Connecting your calendar…" state and a retry) and `onOverlayChange`.
2. **Give it a signature of its own, since the overlay is SavvyCal's.** On
   confirm, the host's stamp comes down on the ticket as an ink impression
   ("BOOKED · 19 Oct" around a check). The ticket and the slab take the hit. That
   ties stamp, slab and ticket into one print language. A `chrome` prop was
   added, and it defaults to "plain" (no window dots).
3. **Slivers under the day header.** The grid now snaps its scroll to an hour
   line, and there is a top fade.
4. **The overlay read the visitor's weekly calendar in the displayed zone.** It
   now reads it in the visitor's own zone. Tested.
5. **Dead columns.** Past days and days with no slots are now narrow. Columns
   follow the host's working days, so the lagoon demo shows just Tue and Thu.
6. **Contrast.** Faint text went from 0.38 to 0.62 alpha, and muted text from
   0.64 to 0.74.
7. **Time formats.** One clock style everywhere: the host clock, the hour labels
   and the slots.
8. **Ticket wrap.** "(Lisbon time)" no longer wraps by itself.
9. **Error focus ring.** An error field keeps a red ring when focused.
10. **Phone layout.** The agenda is clamped to two lines, durations and timezone
    sit side by side, the meta lines and the "Pick an open slot" row are hidden,
    and the labels are visually hidden. The first row of slots now ends inside
    812 px.
11. **Modal focus.** While the card is open, everything outside it (headline,
    header, host card, calendar) is inert.
12. **Slot size.** Slots are now 30 px tall (36 px rows), and the default
    `gridHeight` is 444.
13. **A real face (not done).** The sandbox blocks images.unsplash.com, so a
    photo couldn't be verified in screenshots. `host.avatar` is supported and
    documented.
