# Loupe Curator Landing

A scroll-driven landing page template for a curated-recommendations product, told in six scenes.

1. **Honest recommendations.** Photos float at different depths, and scrolling flies you forward through them: they start small and faint near the centre and grow outward past the edges. They also drift on their own when you stop. The headline arrives word by word, and its first line blurs away as you scroll.
2. **The gap.** A gap opens between "from actual" and "people". A tiny photo inside it flicks through faces, then grows until it fills the screen and pushes the words off the sides. "Featuring curators from around the world" types itself in.
3. **The curator.** Leader lines draw out from the curator's name. Topic tags appear one at a time, the bio fades in, the lime "next curator" button pops in, and a deck of picks rises and fans out. Click through all three curators.
4. **The manifesto.** A paper panel slides up while the portrait drifts up behind it. The paragraph inks in word by word. The white collection panel then rises and dims the manifesto. The last pick in the column flies out, through a gap that opens in the collection title ("Weekend [ ] Field Kit"), and into its grid slot. Grid columns scroll at staggered speeds. Click "+" on any card to save it.
5. **Keep good company.** Giant words rise through the screen with their letters settling into place, over a lime band that sweeps across on a diagonal.
6. **Look closer.** A second word-gap zoom opens into the collections. The list rises in, names turn on a drum, and scenes cross-fade with a blur. A chip shows who made each collection, and its thumbnails drift up the side. Click a name to spin to it.
7. **No feeds.** Move the mouse and photos drop along the cursor's path, with a scatter of tiny squares around them. On touch screens a pile builds as you scroll. The pile gathers into a stack that flips through photos while "Be the first to try Loupe" types in. Click the pile to reshuffle it.
8. **Footer.** The page dims as the footer card rises, with the pile still peeking out above it. The "o" in the wordmark draws itself as a doodle, then fills into a lime sun.

Every scroll-driven value is eased toward the real scroll position, which gives the whole page a soft, inertial feel without taking over the browser's scrolling. The pinned scenes read layout once per frame (the root's top), and everything else is CSS custom properties and transforms. The magnetic buttons, context cursor and leaning pile only run where `(hover: hover) and (pointer: fine)` matches. On touch screens they are plain taps. With `prefers-reduced-motion`, the scroll cuts between still poses (the hero, the finished curator scene, each collection, the call to action) instead of animating.

**Easter egg:** poke the sun in the footer three times for golden hour.

The photos (three curator portraits, six collection scenes and sixteen product shots) were generated for this template with ChatGPT's image model. They're embedded as compressed WebP data URIs (about 550 KB in total), so the component makes no network requests. To use your own photos, replace the entries in `IMG` at the bottom of the file.

## Fonts

Text uses subsets of **Inter Tight** (400 and 700) and **JetBrains Mono** (500, capitals only). Both are SIL Open Font License 1.1 fonts, embedded as base64 woff2. As the licence asks of modified copies, the subsets are renamed (`LclSans` and `LclMono`). Together they add about 34 KB.

It needs nothing beyond React and Tailwind's base styles.

```tsx
import LoupeCuratorLanding from "@/components/ui/loupe-curator-landing"

<LoupeCuratorLanding
  brand="Loupe"
  launch="Launching spring 2027"
  joinAction={{ label: "Join waitlist", href: "/waitlist" }}
  signInAction={{ label: "Sign in", href: "/login" }}
/>
```

`height` sets the height of each pinned stage. It defaults to `100svh` and must be a definite length. Curators, collections, picks and copy are constants near the top of the file.
