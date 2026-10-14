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
