# Handoff: put real photos into `alto-coffee-template`

**Status:** open. Delete this file and its pointer in `CLAUDE.md` ("Open handoffs") when done.

**Why this exists.** The owner's reference (`media/alto-coffee-template/reference.webp`) is a
photographic page. The template was built in a session whose network blocked every
photo host, so every picture is drawn in SVG/canvas. The owner's verdict on the
drawn version: *"not good enough compared to the reference"*. The layout now matches
the reference. The remaining gap is **real photography**. Your job is to close it.

Branch with the work: `kedhar/kind-knuth-ey99nj` (or `main` if it has been merged).

---

## 0. Check you can reach the photos first

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200"
```

- `200`: carry on.
- `000` or `403`: this session can't reach Unsplash either. **Stop.** Tell the owner to add
  `images.unsplash.com` and `unsplash.com` under Allowed domains (cloud environment
  menu in the session title bar → Edit → Network access), then start a new session.
  Don't route around the block through other tools (an attempt to fetch through
  Adobe's servers was refused by the session's safety check). Don't guess photo IDs you
  can't load: a broken image in the hero is worse than the drawing.

Repo rules for images (from `forge/BRIEF.md`): `images.unsplash.com` URLs only, each
picked on purpose and credited in the README, and every image stays a replaceable prop.
No local image files and no other hosts.

## 1. Find and check every photo

For each slot below: find candidates (Unsplash search, or WebSearch with
`site:unsplash.com`), **download each one** (`curl -L -o /tmp/x.jpg "https://images.unsplash.com/photo-…?w=1200&q=80"`),
**look at it with the Read tool**, and only then use it. Write down the photographer's
name for the credits.

| # | Slot | What the reference shows | Search terms | Notes |
|---|---|---|---|---|
| 1 | Hero background (needs a new prop, see §2) | A single conical volcano, deep-blue sky, a sea of white cloud around its lower half | `volcan de agua`, `antigua guatemala volcano`, `volcano above clouds` | Landscape, peak in the upper middle, empty sky above for the white title. Keep the drawn clouds on top. |
| 2 | `hero.fieldImage` | Close rows of green tea or coffee hedges, misty | `coffee plantation rows`, `tea plantation rows`, `coffee farm guatemala` | Fills the stage after the white-out; bottom-left needs to be dark enough for white caption text. |
| 3 | New Crop cherries (needs a new prop, see §2) | Ripe red coffee cherries on a branch, cut out, over a blue disc | `coffee cherries`, `red coffee berries` | Ideally plain or dark background, so `mix-blend-mode` or a round crop works over the disc. If none cuts out well, keep the drawing here. |
| 4–5 | `BEAN_CARDS[0].image`, `BEAN_CARDS[4].image` | Product shot; cherries close-up | `coffee bag`, `coffee cherries close up` | 4:5 crop. Card 0 is a bag: use a neutral bag shot or keep the drawn ALTO bag (it carries the brand). |
| 6–11 | `STEPS[0..5].image` (farm to cup) | Photo strip: picking, farm landscape, drying patio, beans, roasting… | `coffee picking`, `coffee farm`, `coffee drying patio`, `green coffee beans`, `coffee roaster`, `pour over coffee` | 4:5 crop, one per step in order: Picked ripe, Floated, Fermented & washed, Sun-dried, Rested & hulled, Roasted to order. |
| 12 | `STICK_CARDS[3].image` (optional) | Instant coffee or stick close-up | `instant coffee`, `coffee cup top view` | Optional; the drawn ALTO sticks are on-brand. |

Use the URL form `https://images.unsplash.com/photo-<id>?auto=format&fit=crop&w=1600&q=80`
(`w=900` for cards and steps). Pass `focus: [x, y]` where the subject isn't centred.

## 2. Wire them in

All edits are in `components/alto-coffee-template/alto-coffee-template.tsx`.

1. **Defaults.** Add `image: { src, alt, focus }` to the default content:
   - `STEPS` (around line 321): every step.
   - `BEAN_CARDS` (around line 306): the cards you replaced.
   - `const H = { … fieldImage: hero?.fieldImage …}` (around line 1108): change to
     `hero?.fieldImage ?? DEFAULT_FIELD` with a new `DEFAULT_FIELD` constant. Allow
     `null` to mean "use the drawing" and type it as `AltoImage | null`.

   The slots already render `<Photo>` whenever `image` is set (`Photo` is around line 570).
2. **New prop `hero.image` (volcano photo).** In the hero JSX (around lines 1745–1752),
   when `H.image` is set, render one `<Photo className="ac-hero-photo">` in place of
   `.ac-sky`, `<Stars/>`, `.ac-sun`, `<FarRidge/>` and `<VolcanoArt/>`. Keep the three
   `.ac-cloud` layers, the title, the veil, the field and the HUD.
   - In the scroll timeline, point the tweens that move `.ac-peak`, `.ac-far` and `.ac-sun`
     at `.ac-hero-photo` (`yPercent: -16, scale: 1.3`). Include it in the `.set(…, { opacity: 0 }, 4.6)` too.
   - Add CSS `.ac-hero-photo{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;transform-origin:50% 62%}`.
   - Dark mode: add `filter:brightness(.55) saturate(.8)` to it under the existing
     `:where(.dark) .ac-root:not(.ac-light)` / `.ac-root.ac-dark` selector pair.
   - Default `hero.image` to photo #1 and allow `null` for the drawn volcano.
     `demo-huila.tsx` should keep the drawn snowy volcano (`hero={{ image: null, … }}`)
     unless you find a good Nevado del Huila photo.
3. **New prop `crop.image` (cherries).** If you found a usable cut-out, render it in
   `.ac-cherry-wrap` instead of `<CherryArt uid={uid} />` (around line 1812). Style it
   `width:100%;height:auto;max-width:none` with a drop shadow. Otherwise leave it drawn.
4. **Test** `tests/alto-coffee-template.test.mjs` line 69: allow `images.unsplash.com`
   next to `fonts.googleapis.com`, and add `ac-hero-photo` to the Preflight `max-width:none`
   list.
5. **README** (`components/alto-coffee-template/README.md`):
   - Replace "Every picture is drawn…" with what's photographed.
   - Add `hero.image` and `crop.image` to the props table.
   - Add a **Photo credits (Unsplash)** section: photographer, short description and
     `photo-<id>` for each photo, the same as `components/vernissage-museum-template/README.md` does.

## 3. Verify, then commit

```bash
npm run check
node tests/alto-coffee-template.test.mjs
npm test
```

Then `npm run dev` and look at it in headless Chromium at 1440 × 900 and 390 × 844, in
light and `?dark`, scrolling through the hero descent, the crop, the bean and stick floats
and the strip. Compare against `media/alto-coffee-template/reference.webp`: the hero should
now read as a photograph like the reference's. Wait about 2 s per scroll stop; the
stages are scrubbed. Re-shoot `media/alto-coffee-template/default.png` (hero, 1440 × 900),
`demo-huila.png`, `crop.png`, `map.png` and `thumb.webp` (640 × 400 from default.png).
Commit on the working branch, push, and delete this handoff and its `CLAUDE.md` pointer
in the same commit.

## What not to change

The layout, the scroll choreography (sticky stages, no pinning), the map, the floating
cards, the brew interaction and the comparison block were reviewed against the
reference and are done. This handoff is only about photography.

## Also available (not needed if Unsplash works)

A photoreal hero was generated in the owner's Canva (media id `MAHZlQgqLvc`: Volcán de
Agua above clouds, blue sky). It can't be hotlinked; it would only help if the owner
exports it and hosts it somewhere the template may reference. Prefer Unsplash.
