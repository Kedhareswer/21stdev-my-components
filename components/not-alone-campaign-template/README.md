# Not Alone Campaign Template

A mental-health awareness page for a youth ministry, a school, a students'
union or a charity, printed like a zine. Every photograph is cut down to a
handful of flat colours, so the page reads as one screen-printed booklet: a
vellum frame over a pasture, a blue highlighter label, hand-drawn stick
figures and page numbers in the corner.

**Requires `gsap`** (with its bundled `ScrollTrigger`). Everything else is React.

- **01, You are not alone.** The reference page, built for the web. A pale sky
  band carries the tagline. Below it the pasture develops like a print, the
  vellum frame settles into place and *alone.* is wiped on in the label colour.
  The statistic sits beside it (`==Indo==nesia` sets the accent) with its
  source chip. The three friends draw themselves and keep bobbing. Click one
  and it jumps and says something kind. Move the mouse and the land and the
  window drift against each other, like looking through glass. On scroll the
  land sinks and the frame lifts away faster than the copy.
- **02, The facts.** The stage sticks while you scroll through it, one fact
  per stretch. The big number rolls in letter by letter. The lens beside it
  morphs from a print to a porthole to a chapel window, zooming somewhere new
  in the landscape each time. A crowd of fifty lights up to match: 17 for
  *1 in 3*, one for *2.6%*. The dashes under the copy jump to a fact.
- **03, Signs.** The page scroll walks a row of cards sideways. Each card tilts
  as it passes and its photo pans inside the frame. Tap a card to flip it to
  *What helps*. The urgent sign flips to the accent colour and says who to call.
- **04, Faith.** The words of the paragraph come up as you read them. Five
  friends join hands, drawn by the scroll, above two verses on vellum.
  `faith={null}` removes the page.
- **05, Get help.**
  - *How are you, really?* is a slider with a face that goes from worried
    to glad as you drag (or use the arrow keys). Each mood answers and offers
    one action: see who to call, breathe, or copy a check-in text for a friend.
  - *Breathe with me* runs four rounds of 4, 7, 8 with an orb that fills and
    empties.
  - *Who to call* lists real `tel:`, `sms:` or web links, with copy buttons.
- **06, Pass it on.** A pledge card over the hills. Pressing it adds you to
  the crowd and the count, and calls `onPledge`.
- **Header.** It is transparent over the sky, then turns solid. It has an
  underline that follows the section you're in, a page counter (*02 / 06*),
  **Quick exit** (also triple Escape) that replaces the page with a weather
  search, and *Talk to someone*. On phones the links fold into a menu.

```tsx
import NotAloneCampaignTemplate from "@/components/ui/not-alone-campaign-template"

<NotAloneCampaignTemplate
  palette="meadow"
  brand={{ name: "Not", word: "Alone", org: "Harbour Youth Ministry" }}
  hero={{
    tagline: "Mental Health is More Common Than you Think.",
    kicker: "You are not",
    word: "alone.",
    fact: "In ==Indo==nesia, about 1 in 3 adolescents aged 10 to 17 ...",
    source: { label: "qcmhr.org", href: "https://qcmhr.org" },
    faith: "God entrusts us with our lives ...",
    closing: "Seeking help will make you stronger!",
    landscape: { src: "/pasture.jpg", alt: "A pasture", tone: "#6f8f45", focus: "50% 80%" },
    window: { src: "/cows.jpg", alt: "Cows in the mist", tone: "#9a9677" },
  }}
  helplines={[{ name: "Emergency", detail: "Immediate danger", contact: "112", href: "tel:112", urgent: true }]}
  onPledge={() => api.pledge()}
  onCheckin={(mood, i) => analytics.track("checkin", { i })}
/>
```

## Play with it

- `demo.tsx`: the reference page. An Indonesian youth ministry, meadow
  palette, with faith.
- `demo-campus.tsx`: a Scottish students' union *Wellbeing Week* in the
  heather palette. It has NHS England figures, UK helplines (Samaritans, Shout,
  NHS 111, 999), its own signs and no faith page. The page counter and the
  nav adapt to five pages.

Open `?dark` before the hash in the workshop for the night print.

## Props

| Prop | Type | Default |
|---|---|---|
| `brand` | `{ name, word, org }` | *Not **Alone***, Harbour Youth Ministry. `word` sits in the label. |
| `hero` | `NacHero` | The reference page. |
| `stats` | `NacStat[] \| null` | Three I-NAMHS 2022 facts. `null` removes the page. |
| `signs` | `NacSign[] \| null` | Five signs. `null` removes the page. |
| `faith` | `NacFaith \| null` | Stewardship, Galatians 6:2 and 1 Peter 5:7. |
| `helplines` | `NacHelpline[]` | Indonesia: SEJIWA 119 ext. 8, 112, Into The Light, your youth pastor. |
| `moods` | `NacMood[]` | Five, from *Really struggling* to *Great*. |
| `breath` | `number[]` | `[4, 7, 8]` seconds in, hold, out. |
| `pledge` | `NacPledge \| null` | *Be someone's not alone.*, 1,284 promises. |
| `labels` | `NacLabels` | Every other string on the page. `**bold**` and `{count}` work where the defaults use them. |
| `palette` | `"meadow" \| "heather" \| "tide" \| NacPalette` | `"meadow"`: the reference's blue label, red accent, yellow friend. |
| `theme` | `"system" \| "light" \| "dark"` | `"system"` follows the host's `.dark` class, then the OS. |
| `colors` | `number` | `10` flat colours per photo. `0` shows the photos as they are. |
| `quickExitUrl` | `string \| null` | A weather search. `null` hides the button and the Escape shortcut. |
| `onPledge` / `onCheckin` | `() => unknown` / `(mood, index) => unknown` | |
| `height` | `string` | `"100svh"`: a definite floor for every page and sticky stage. |
| `className` | `string` | |

Types:

- `NacShot { src, alt?, tone?, focus? }`. `tone` shows while it loads and
  if it fails. `focus` is the CSS `object-position`.
- `NacHero { tagline, kicker, word, fact, source?, faith?, closing, landscape, window }`.
- `NacStat { value, text, fraction, source? }`. `fraction` (0 to 1) is how much
  of the crowd lights up. Digits in `value` take the label colour.
- `NacSign { title, body, help, shot, urgent? }`.
- `NacHelpline { name, detail, contact, href?, urgent? }`. `tel:` links get a
  copy button.
- `NacMood { label, reply, action: "talk" | "breathe" | "reach" }`.
- `NacFaith { kicker, title, body, verses: { text, cite }[], shot }`.
- `NacPledge { title, body, cta, done, count, shot }`.
- `NacPalette { paper, ink, label, labelInk, accent, buddy }`.

## Notes

- **The print.** Each photo is drawn into a canvas, cut to `colors` flat
  colours (a median-cut palette, then a 3 x 3 mode filter twice so the speckle
  melts into shapes) and handed back as a blob. It runs one photo at a time,
  in idle moments, and the result fades in like a print developing. This needs
  CORS. Unsplash sends it. A host that doesn't is retried without it and shown
  as a plain photo.
- **The first frame is drawn.** Until a photo arrives (or if it never can)
  an SVG landscape in the same flat colours stands in: ridges, a tree line,
  cows and white flowers. 21st's capture sandbox blocks external origins, so
  that drawing is what a server cover shows. Publish with your own `--preview`
  (`media/not-alone-campaign-template/template-cover.jpg`).
- **Scrolling.** The facts and the signs are CSS `position: sticky` stages
  of definite height. GSAP only reads the scroll, nothing is pinned, so it
  works in any host layout and inside a scrolling panel (the template finds
  the element that actually scrolls). Every tween and trigger lives in one
  `gsap.context` and is reverted on unmount.
- **Reduced motion.** There's no intro, parallax, tilt, morph or word
  reveal. Facts switch in place, the signs become a plain swipe row, cards
  swap faces instead of flipping, and the breathing orb doesn't scale.
- **Accessibility.** There is one `h1` (*You are not alone.*), and every page
  has an `h2`. Nav buttons use `aria-current`. The mood slider is a real
  `role="slider"` with keyboard support and a spoken value. Sign cards and
  the pledge are toggle buttons. Replies and the breathing count are
  `aria-live`. The label colours carry white text at 4.5:1 or better, and
  body text on paper is above 7:1 (the test checks both).
- **Fonts.** None are loaded. The stack is Helvetica Neue, Helvetica, Arial:
  the reference's bold label and light italics.
- **Content.** The I-NAMHS 2022 figures (Indonesia National Adolescent Mental
  Health Survey, with QCMHR) and the NHS England 2023 figures are real. The
  helpline numbers were correct when written, but check them before you run
  a real campaign. Harbour Youth Ministry, the counts and the campus details
  are invented placeholders.
- **Photos** come from [Unsplash](https://unsplash.com) (Unsplash License):
  Glen Etive, Highland cows in mist, a lone oak, autumn woods, peaks in cloud,
  layered ridges, a starry lake, the Fairy Glen on Skye and rolling green
  hills. The campus demo adds the Quiraing and a curious sheep.
- Reference: the owner's slide *Mental Health is More Common Than you Think*
  (`media/not-alone-campaign-template/reference.png`), used for feel and layout.
