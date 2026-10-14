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
