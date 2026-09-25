# Flashlight Text Reveal

Words written on a dark wall that you can only read where your light falls.
The wall is a drifting, grainy WebGL shader. The cursor is a flashlight, and
the lit patch of wall and the writing under it come up together. Take the
pointer away and the light keeps searching the wall on its own.

**No dependencies.** React is the only import. One fullscreen triangle in a
plain WebGL1 context runs the "Mesh drift" recipe from the 21st.dev Shader
Builder, unchanged. The writing is a real DOM layer, masked to the exact
falloff of the shader's spotlight, so it stays selectable and screen readers
get all of it.

## Usage

```tsx
import FlashlightTextReveal from "@/components/ui/flashlight-text-reveal"

<FlashlightTextReveal />
<FlashlightTextReveal text={"NOTHING\nIS HIDDEN\nFOREVER"} radius={0.28} ghost={0} />
<FlashlightTextReveal>
  <nav className="p-6 text-white">…</nav>   {/* children are always visible */}
</FlashlightTextReveal>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `text` | `"WHAT YOU\nSEEK IS\nSEEKING\nYOU"` | Line breaks are kept. |
| `textColor` | `"#ececec"` | Colour of the writing where it is lit. |
| `ghost` | `0.03` | How much writing shows with no light on it. `0` hides it fully. |
| `fontFamily` | Anton / Bebas Neue / Oswald / Impact… | Any heavy face; nothing is loaded. |
| `fontSize` | `"clamp(4rem, 15vw, 13rem)"` | |
| `wander` | `true` | The light roams when no pointer is over the wall. Off: it goes dark. |
| `radius` | `0.35` | Light radius, in units of the wall's short side. |
| `strength` | `1` | How much the light brightens the wall itself. |
| `colors` | `["#101010", "#3A3A3A"]` | Wall colours, hex, 1 to 8. |
| `speed`, `scale`, `intensity`, `warp`, `detail`, `contrast`, `brightness`, `saturation`, `hue`, `vignette`, `blur`, `grain`, `drift`, `seed`, `rotation`, `oklab` | the recipe | The shader's own units. |
| `paused` | `false` | Freezes the wall and parks the light; the pointer still moves it. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `className` | `""` | Appended to the root. |
| `children` | none | Always visible, above the wall and the writing. |

The wall defaults are the recipe: colours `#101010 → #3A3A3A`, speed 40, zoom
100, intensity 59, warp 0, contrast 34, brightness 40, saturation 50, hue 360°,
vignette 0, grain 45, spotlight at strength 100 / radius 34.

## Notes

- The pointer is tracked on the window, so the light still follows under
  children and the writing layer.
- Device pixel ratio is capped at 2. The loop stops while the tab is hidden.
- Reduced motion: the wall stops, and the light stops roaming and parks in the
  centre. The pointer still moves it, one frame per move.
- No WebGL: a CSS gradient wall with a fixed light in the middle, and the
  writing lit under it.
