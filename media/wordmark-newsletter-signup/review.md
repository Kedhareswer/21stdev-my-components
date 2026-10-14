# wordmark-newsletter-signup: review log

## Reference

`reference.png` is the hero of https://www.mathesonfoodcompany.com (a newsletter popup over a
giant red brand wordmark on a grey field) and `reference-2.png` is the same site's footer (red
field, heavy capitals, inline email signup). Both are screenshots from the public design-gallery
repository https://github.com/Landing-Pages-Websites/inspiration-library, entry
`siteinspire-2026-0036` (`shots/siteinspire-2026-0036__scroll0.webp` and `__scroll1.webp`),
harvested from siteinspire.

What was taken from it: the feel and layout only. A brand wordmark in heavy condensed capitals
filling the field edge to edge and cropped by the section, a white card with hard black borders
and no radius on top of it, an uppercase headline in the field colour, a flat button in that
colour, one saturated colour plus black and white. Its brand, copy, logo (the heart mark) and
food photo were not copied. Our demo brands (Big Sunday Sauce Co., Brine House, Mustard Club)
are invented.

**Why a GitHub source.** This sandbox's egress policy blocks every image host: cdn.21st.dev (so
the 21st `get_inspiration` results came back but none of their preview images would download),
images.unsplash.com, godly, land-book, dribbble, awwwards, siteinspire, pexels, picsum, jsdelivr,
unpkg. Public GitHub clones work, so the reference came from a repository of real-site
screenshots. The same block is why the component carries no photo by default (`image` is an
optional prop that hides itself if it fails to load).

## Idea gate (fresh critic)

Five takes on the reference were judged:

1. **wordmark-newsletter-signup**: newsletter section, the brand wordmark fills the field and a
   hard-bordered card sits on it; on signup the wordmark re-sets into a confirmation word
2. hot-stamp-newsletter: same card, a round brand seal that slams down on success
3. madlib-signup-cta: the form is a display-size sentence with inline blanks
4. sticker-contact-section: giant email address that copies with a peel-off sticker
5. big-type-footer-signup: the reference's footer

Verdict: **build #1**, with cuts. The library had no newsletter or signup section, and #1 keeps
exactly what makes the reference loud. #2 is decoration and close to dragon-seal-preloader, #4 is
toy-like and next to sticker-hello-portfolio, #5 would be a fifth wordmark footer and copies the
heart logo, #3 drops the reference's layout. Cut from #1: letters parting while you type, and a
receipt success state. Keep one signature: the letters drop out and the confirmation word drops
in. Must-haves named by the gate: the wordmark must read as a condensed display cut in system
fonts (scale each line to the width and stretch it upright, check in the sandbox); measured line
breaks; a designed phone and dark mode; a real form (validation, required consent, async
loading / error / success, labels, focus); a section **and** a popup variant (focus trap, Escape,
scroll lock); hard 2-3px borders, zero radius, no offset-shadow brutalism; props and presets.
Stolen details: the email typed in display type (#3), a subscriber count (#1), a compact band
layout (#5).

## Decisions

- The wordmark is still at rest. The signature is the letter swap on signup (and the same drop
  as the popup opens); hovers and focus carry the life. A drifting wordmark behind a form people
  are typing into would be noise.
- Primary hover (submit): ink floods up from the bottom while the label rolls. Chips and the
  reset link only change colour; they are utility controls.

## Round 1 (fresh critic): REDO

| | Score |
|---|---|
| (u) usability | 8 |
| (a) idea / reference feel | 7 |
| (b) craft | 6 |
| (c) originality | 6 |
| (d) install-safety | 9 |
| average | 7.2 |

What the critic found, most important first, and what changed:

1. The success word hid behind the card ("SEE Y U SUNDAY", "WEI COME IN") and so did the brand at
   rest ("BIG" under the card, "S Y S E" on tablet).
2. Faux-condensed stretch (ratio up to 1.75) visibly distorted the type.
3. Focus dropped to the body while pending and after an error.
4. The address broke mid-word in the success copy; the placeholder clipped at 375 px.
5. The phone card jumped on success; the phone band was one puny line touching the edges.
6. Accents (É, Ü) would be clipped by the line clip.
7. About half a second of empty field mid-swap, with translucent ghosts.
8. The popup was always a full takeover; it autofocused on touch (keyboard pops on open).
9. The email error sat below the consent line, far from the field.
10. The default preset was the reference's own grey and red.

Changes made for round 2:

- **Frame layout.** On wide screens the name frames the card: the first line sits on top and the
  last drops just past the bottom edge, so both stay readable around a centred card ("BIG SUNDAY"
  / "SAUCE CO.", "SEE YOU" / "SUNDAY", "WELCOME" / "IN"). The split is the even one with the
  biggest capitals. Phones stack shorter lines above the card.
- Stretch capped at 1.35x (was 1.75x), and the README names `displayFont` as the upgrade path.
- **Two-layer swap.** The old letters fall through the baseline while the new ones drop through
  the cap line 120 ms behind them, so the field is never empty. Both clip exactly at the cap height
  while moving, which removes the slivers and ghosts. No opacity fade. At rest the window opens up
  (0.32 cap above) so accents show; tested with CAFÉ.
- Pending uses `readOnly` / `aria-disabled`, so focus stays put. Errors focus the field (or the
  checkbox for consent), and the email error renders right under the field.
- `overflow-wrap: anywhere` for the address. The field is sized for the longer of the address and
  the placeholder (22px max on phones). Only the placeholder is uppercased.
- Phone layout is top-aligned, so the card does not jump. The phone band breaks MUSTARD / CLUB with
  side padding. In the flow, a swapped word keeps the name's height.
- Popup: `backdrop="dim"` option; touch screens focus the dialog rather than the field.
- Default sauce preset now sits on a tomato-pink ground of our own, not the reference's grey.
- Section default height `min(100svh, 880px)`.

## Round 2 (fresh critic): REDO

| | Score |
|---|---|
| (u) usability | 7 |
| (a) idea / reference feel | 7 |
| (b) craft | 6 |
| (c) originality | 6 |
| (d) install-safety | 9 |
| average | 7.0 |

Found: the submit hover label (accent on ink) failed contrast in six of eight palettes; mustard light
lost its band borders and checkbox (ink on a near-black ground) and its focus ring (yellow on white);
the card re-centred when an error line appeared; the phone success state floated in empty ground;
on tablet the card never touched the letters; a single-line word left the field lopsided; the band's
strip did not line up with the wordmark and grew on success; the type read as stretched rather than
condensed; the success state was a dead end.

Changes made for round 3:

- Submit hover label is paper on the ink flood (tested at 4.5:1 or better for all eight palettes).
- Focus rings use the accent only when it reads at 3:1 on the card, otherwise ink (mustard light).
  A checkbox on the band's ground is drawn in the readable ground colour, with a transparent fill.
  The band submit's focus ring sits inside the button.
- The error slot under the field is reserved, so the card never re-centres when an error appears.
  Consent errors use the same slot ("Tick the box below...") and focus the checkbox.
- Phones and tablets (below 1024px) stack the wordmark above the card. The section's height applies
  only on wide screens. A swapped word bottom-aligns against the card or strip.
- A single line in a tall field is set twice, top and bottom, so the field never sits lopsided.
  The popup demo's success word is "In the brine" (an even split).
- The band's strip runs full width, so its edges line up with the wordmark's ink. The success strip
  holds the form strip's height, so the page below does not move.
- Wordmark stack: "Helvetica Neue" (its Condensed Black on Apple systems via `font-stretch:
  condensed`), "Arial Narrow" and "Roboto Condensed" go first. The canvas measures with
  `fontStretch` where supported; elsewhere the SVG draws at normal width too, so measuring and
  drawing always agree. The sandbox has none of these faces, so the screenshots still show
  Inter Black.
- New `successAction` prop: a hard-bordered button so the success state leads somewhere
  (demos: "Read last week's recipe", "See this month's jars").
- Smaller fixes: no font-size transition on the field; the size floor is 14px; the invalid ring is
  2px.

Decision: on wide screens the card shrinks to its content on success. The section height is fixed
there, so nothing outside moves, and a tall empty card read worse than a compact one.
