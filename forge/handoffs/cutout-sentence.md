# Handoff: cutout-sentence (finish it)

**Status:** built, tested and pushed on branch `kedhar/elegant-darwin-vipc16`. It is **blocked on
one file**: the default photo `media/cutout-sentence/flock.jpg` is not in the repo yet. Everything
below is what the next agent must do to finish it. Delete this file and its pointer in
`CLAUDE.md` ("Open handoffs") once every step is done.

Read `CLAUDE.md` and `CONTRIBUTING.md` first; every rule there applies.

---

## 1. What the owner asked for (do not drift from this)

A landing-page section built from the owner's reference image (a flock of colourful pigeons
in a blue sky; a sentence whose words have image pieces between them in braces, and the photo
with matching empty holes). The owner's corrections after the first version:

- **Photo on top, sentence below.** The pieces travel **down** from the photo into the
  sentence. (The first version had them flying up; the owner said it was "supposed to be
  reversed".)
- **It must look like the reference:** a real photograph (not an illustration), a light-grey
  page, pieces about **3× the text height**, braces that hug the next word (`{ ▢ }sky`), a calm
  centred sentence, holes the exact colour of the page. No invented caption line.
- **Assets:** the owner asked for the photo to be made with the **Adobe or Canva** connectors.
  Do **not** use the Figma connector to generate images: the connected Figma account belongs to
  a different organisation (Neo Health), and its credits are not ours to spend.

Decisions already made in code (keep them):

| Decision | Where |
|---|---|
| Scroll story: photo's lower edge rises (`LOWER`), sentence types itself with empty braces (`TYPE`), cut lines traced (`SCORE`), pieces lift and drop in reading order (`FLY`), braces clamp on landing | `// #region cutout` in `components/cutout-sentence/cutout-sentence.tsx` |
| `{id}word` written flush = the braces hug that word on one line | `parseSentence` |
| Defaults: `pieceHeight` 2.9em, grey `background` (7.5% ink over the page), `eyebrow` empty, `split` 0.48 | component props |
| Default content: the reference sentence + 7 cuts on the flock photo | `FLOCK_SRC`, `FLOCK_SENTENCE`, `FLOCK_PIECES` |
| The canvas-painted harbour from v1 is gone on purpose (owner: "not good enough" next to a real photo) | — |

## 2. The blocker: get the photo into the repo

The photo was generated in the owner's **Canva** library:

- Canva media id **`MAHZlQ3-il8`**, 1536 × 1024 JPEG, link: https://www.canva.com/M/MAHZlQ3-il8
- Prompt used (if it ever has to be regenerated, use `mcp__Canva__generate-image`, aspect
  `LANDSCAPE_3_2`; then re-pick every region, step 3): *"Candid documentary photograph, shot on a
  300mm telephoto lens looking straight up: a loose, irregular flock of about sixty pigeons with
  naturally vivid, multicoloured plumage (scarlet, saffron yellow, emerald, magenta, tangerine,
  with dark wingtips) flying across an empty, cloudless, even cerulean-blue sky. Birds at many
  different sizes and angles, clustered densely in the lower right and thinning out to sparse
  open sky in the upper left. Natural, organic, random spacing, crisp feathers, bright midday
  light, realistic photographic grain. No text, no ground, no clouds, no repeated pattern."*

Why it isn't in the repo yet (so you don't repeat the dead ends):
- The cloud sandbox's egress proxy blocks `media.canva.com`, `export-download.canva.com`,
  `www.canva.com`, Unsplash, Pexels and Wikimedia. `mcp__Canva__get-assets` only returns a 200 px
  thumbnail through the tool result.
- The Adobe connector refuses to fetch from `media.canva.com` ("URL domain not whitelisted") and
  from `raw.githubusercontent.com` ("host not allowed"), and has no image generation here.
- Don't probe more hosts with curl: the session's safety classifier blocks host scouting.

**What to do:**
1. `git fetch origin && git pull` on the branch, then check whether
   `media/cutout-sentence/flock.jpg` exists. The owner was asked to download it from Canva and
   commit it at that exact path.
2. If it isn't there, try once inside your session: make a Canva design containing media
   `MAHZlQ3-il8` full-bleed (`edit-design` → `insert_fill`), `export-design` as JPG, and download
   the export URL. If any download is blocked, stop and ask the owner to commit the file (or
   attach it to the chat). Don't substitute a different image silently.
3. Confirm it is 1536 × 1024 (aspect 1.5). If the aspect differs, update `imageAspect`'s
   default and recheck step 3.

## 3. Verify every cut on the full-resolution photo

The regions in `FLOCK_PIECES` were placed on the 200 px preview, as fractions of the image, so
they should line up, but check them at full size. Crop each one and look at it with the Read
tool:

```bash
python3 - <<'EOF'
from PIL import Image
im = Image.open("media/cutout-sentence/flock.jpg"); W, H = im.size
R = {  # copy from FLOCK_PIECES in cutout-sentence.tsx
  "kal": [0.5667, 0.6938, 0.1125, 0.0938], "paint": [0.4417, 0.375, 0.0667, 0.0813],
  "wings": [0.4792, 0.5688, 0.0667, 0.1], "dance": [0.6458, 0.5875, 0.0792, 0.0938],
  "vast": [0.0333, 0.3375, 0.1417, 0.1188], "tranq": [0.5958, 0.3875, 0.0625, 0.075],
  "sky": [0.3333, 0.475, 0.075, 0.1125],
}
tiles = [im.crop((int(x*W), int(y*H), int((x+w)*W), int((y+h)*H))).resize((int(240*w*W/(h*H)), 240)) for x, y, w, h in R.values()]
out = Image.new("RGB", (sum(t.width + 12 for t in tiles), 240), "white"); x = 0
for t in tiles: out.paste(t, (x, 0)); x += t.width + 12
out.save("/tmp/cutout-tiles.jpg")
EOF
```

Each piece must show the word it sits in front of:

| id | word | must show |
|---|---|---|
| `kal` | kaleidoscope | a cluster of several differently coloured birds |
| `paint` | painted | the single bright yellow bird |
| `wings` | wings | the red bird with its wings spread |
| `dance` | across | the yellow-green pair banking together |
| `vast` | vast | empty blue sky only (no birds, no bird edges) |
| `tranq` | tranquil | the lone small green bird in open sky |
| `sky` | sky | empty blue sky only |

Rules for any adjustment (enforced by `tests/cutout-sentence.test.mjs`): regions don't overlap;
their bounding box stays about 45% of the image height or less, so a 1440 × 900 stage keeps the
photo full-bleed; every id stays written as `{id}word` in `FLOCK_SENTENCE`. A bird cut in half at
a region's edge looks broken: nudge the region rather than accept it.

## 4. Look at it working

`FLOCK_SRC` points at jsDelivr `@main`, so it **404s until the file is merged to `main`**. To see it
locally before that, serve the local file in Playwright:

```js
await page.route("**/media/cutout-sentence/flock.jpg", (r) =>
  r.fulfill({ path: "media/cutout-sentence/flock.jpg", contentType: "image/jpeg" }))
```

Run `npm run dev` (start it after the folder exists), then screenshot with Playwright. Scroll
progress: `scrollTo(0, top + p * (rootHeight - innerHeight))`, then wait about 1.5 s for the scrub
to catch up. Check:

- **1440 × 900** at p = 0, 0.15, 0.3, 0.45, 0.6, 0.75, 1:
  - The full photo comes first, then its lower edge rises.
  - The sentence types with empty braces, then the white cut lines appear.
  - Pieces lift and drop with no stray bar or outline left under a lifting piece.
  - The final state reads like the reference flipped: photo top half, centred three-line
    sentence below.
- **390 × 844** and **768 × 1024**: photo flush to the top, sentence wraps, nothing overflows,
  each brace pair stays with its word.
- **Dark mode** (`?dark#cutout-sentence`): holes match the dark page.
- **Autoplay** (`#cutout-sentence/autoplay`): plays once on view, the Replay button works, and
  hovering a piece pulses its hole with the word tag.
- **Reduced motion** (`reducedMotion: 'reduce'`): the final sentence is shown immediately, with
  no scroll track.
- **Stripped-height check** from CONTRIBUTING.md: the stage keeps real height with
  `html, body, #root { height: auto }`.

## 5. Media, checks, commit

1. Save `media/cutout-sentence/cover.jpg`: a 1440 × 900 frame mid-flight (p ≈ 0.6, several pieces
   in the air, some already landed). Save `media/cutout-sentence/thumb.webp` (640 × 400, from the
   final state) so the workshop index shows a card. Keep `flock.jpg` itself in `media/`.
2. `npm run check` and `npm test` must both be clean.
3. `node scripts/prep-publish.mjs cutout-sentence`. If the `21st` CLI is available, run
   `21st render <prepared file> --demo ./demo.tsx` on the prepared copy. 21st's capture sandbox
   blocks external origins (jsDelivr included), so expect "Capture request left its allowed
   origin" and supply the cover with `--preview` when publishing.
4. Commit on `kedhar/elegant-darwin-vipc16` and push. Note in the commit or PR that the default
   photo only resolves after this reaches `main`. Don't publish to 21st unless the owner asks.
5. Delete this file and the "Open handoffs" pointer in `CLAUDE.md` in the same commit.
