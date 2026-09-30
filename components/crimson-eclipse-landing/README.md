# Crimson Eclipse Landing

A preloader that becomes the page it was loading.

A thin red ring counts to 100 on black. At 100 it ignites, drifts up and
shrinks until it *is* the eclipse hanging over the landing page. An iris opens
outward from it, and the camera settles back through a red maple canopy onto a
flooded floor that mirrors the whole scene. Then the type arrives: a widely
tracked eyebrow, a thin serif **WELCOME**, the nav, a red line of kana and a
tagline at the foot.

**No dependencies.** React is the only import. One 2D canvas, one scoped
`<style>` block, no images, no fonts to download.

```tsx
import CrimsonEclipseLanding from "@/components/ui/crimson-eclipse-landing"

// Intro, then the landing page
<CrimsonEclipseLanding />

// Your words, a blue moon, and the loader driven by real work
<CrimsonEclipseLanding
  hue={214}
  title="HELLO"
  eyebrow="STUDIO"
  navItems={[{ label: "WORK", href: "/work" }, { label: "CONTACT", href: "/contact" }]}
  progress={assetsLoadedPercent}
  onIntroComplete={() => {}}
/>
```

## Everything is generated

There are no assets. Every piece of the picture is drawn in code:

```
piece         how
------------  -----------------------------------------------------------------
canopy        ~110k maple and blade leaves grown from `seed` into three depth
              layers (far is blurred), lit from the eclipse, mirrored with jitter
limbs         recursive bezier branches arching in from the edges
eclipse       black disc, hot white rim, red corona, slow rotating rays
wings         two fans of tapered white light strands flanking the eclipse
petals        glowing sprites that flutter (3D flip), drift on a gusting wind
light rain    thin slanted streaks falling through the scene
embers        red specks rising around the rim of the canopy's pocket
water         the frame above the horizon, mirrored strip by strip with a
              travelling ripple offset, splotched and tinted
ripples       rings spawned wherever a petal lands on the water
loader        SVG ring + 60 ticks, CSS petals, corner marks, vertical 紅月
```

The canopy is grown **across frames** (≤12ms a frame while the gate is up), so
mounting never freezes the page — and the gate never opens onto an unbuilt
scene: on a slow device the lit ring simply holds at 100 until it is ready.

## Interaction

- **Pointer** — the canopy's three layers, the eclipse and the type parallax
  at different depths; petals are blown away from the cursor.
- **Click / tap** — a gust of petals bursts from the pointer. Below the
  horizon it also rings the water.
- **The eclipse is a button** — hover it and the corona swells and the wings
  flutter; click (or focus + Enter) to replay the intro. `replayOnEclipse={false}`
  turns that off.
- **Title letters** lift and glow individually on hover.
- **Nav** — active item is underlined and marked `aria-current="page"`;
  hover slides the underline in. `href` defaults to `"#"` (which does not
  jump); `onNavigate` fires on every click.

## Props

| Prop | Default | Description |
|---|---|---|
| `title` | `"WELCOME"` | The big word, one span per letter |
| `eyebrow` | `"PORTFOLIO"` | Widely tracked line above the title and the loader ring |
| `navItems` | Home / About / Portfolio / Contact | `{ label, href? }[]` |
| `activeNav` | `0` | Index marked current |
| `onNavigate` | — | `(item, index, event) => void` |
| `kanji` | `"ようこそ未来へ"` | Red line at the foot. `""` hides it |
| `tagline` | two lines | Footer lines under the kanji |
| `loadingLabels` | 4 lines | Status lines the loader steps through |
| `hue` | `354` | Hue of the whole world — foliage, water, light, type. Try `214`, `280`, `18` |
| `seed` | `11` | Same seed, same trees |
| `petalCount` | `60` | Petals in the air |
| `durationMs` | `3800` | Simulated load length. Ignored when `progress` is set |
| `progress` | — | Drive the loader from real work, 0–100. The ring eases toward it |
| `skipIntro` | `false` | Start on the landing page (read on mount) |
| `replayOnEclipse` | `true` | The eclipse replays the intro |
| `onIntroComplete` | — | Fired once the iris has fully opened |
| `titleFont` | Cinzel → Cormorant → Trajan → … → serif | Font stack for title and counter. Nothing is downloaded — load a display serif in your app for the best result |
| `height` | `"100svh"` | Root height — a definite length, never a percentage |
| `className` | `""` | Extra root class names |

## Notes

- **Reduced motion:** the loader still counts (it is information, not motion),
  then the gate fades straight to a single still frame of the scene: no
  petals, no parallax, no iris, no letter animation.
- **Offscreen:** the render loop idles while the component is not intersecting
  the viewport.
- **Resizing** keeps painting the previous canopy, stretched, and regrows it
  180ms after the size settles.
- **Memory:** layers are capped at 0.9× / 1.25× / 1× device pixels (far / mid /
  near) and the main canvas at 1.5×, which keeps a 1080p screen around 55MB of
  canvas.
- **Tokens:** assumes none. The page is its own dark world at any theme.
