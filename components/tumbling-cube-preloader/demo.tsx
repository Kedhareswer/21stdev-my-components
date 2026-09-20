"use client"

import * as React from "react"
import TumblingCubePreloader, {
  type TumblingCubeShaderPreset,
} from "@/components/ui/tumbling-cube-preloader"

const SHADERS: { value: TumblingCubeShaderPreset; label: string }[] = [
  { value: "cinema", label: "Cinema CRT + Grain" },
  { value: "chroma", label: "Heavy Chromatic Glitch" },
  { value: "highcontrast", label: "Extreme Contrast B&W" },
  { value: "subtle", label: "Clean Video Only" },
  { value: "off", label: "No Shader (raw video)" },
]

// CC-licensed open-movie clips that send CORS headers, so the shader can
// sample them. Any reel without them falls back to the procedural plate.
const REELS = [
  {
    value: "https://mdn.github.io/shared-assets/videos/tears-of-steel-battle-clip-medium.mp4",
    label: "Reel A (15M)",
  },
  { value: "https://mdn.github.io/shared-assets/videos/friday.mp4", label: "Reel B (515K)" },
  { value: "https://mdn.github.io/shared-assets/videos/flower.mp4", label: "Reel C (1.1M, fast)" },
  { value: "", label: "No reel (procedural plate)" },
]

export default function Demo() {
  const [word, setWord] = React.useState("LOADER")
  const [shaderPreset, setShaderPreset] = React.useState<TumblingCubeShaderPreset>("cinema")
  const [reel, setReel] = React.useState(REELS[0].value)
  const [grain, setGrain] = React.useState(0.15)

  const field = "flex flex-none items-center gap-2"
  const label = "text-[10px] uppercase tracking-[0.1em] text-neutral-500"
  const input =
    "rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] uppercase text-white outline-none focus:border-white/50"

  return (
    <div className="relative w-full bg-black" style={{ height: "100svh", minHeight: 600 }}>
      <TumblingCubePreloader
        key={word}
        loop
        word={word}
        videoSrc={reel}
        shaderPreset={shaderPreset}
        grade={{ grain }}
        height="100svh"
      />

      {/* Control dock — demo chrome, not part of the component */}
      <div className="absolute bottom-6 left-1/2 z-[200] flex max-w-[94vw] -translate-x-1/2 items-center gap-4 overflow-x-auto rounded-2xl border border-white/15 bg-[#0e0e10]/90 px-4 py-2 font-mono text-[11px] text-neutral-300 shadow-[0_24px_48px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:rounded-full sm:px-5">
        <div className={field}>
          <label className={label} htmlFor="tcp-word">
            Word
          </label>
          <input
            id="tcp-word"
            type="text"
            maxLength={12}
            defaultValue={word}
            onBlur={(e) => setWord(e.target.value.trim().toUpperCase() || "LOADER")}
            className={input + " w-[92px] text-center font-bold tracking-[0.1em]"}
          />
        </div>

        <div className={field}>
          <label className={label} htmlFor="tcp-shader">
            Shader
          </label>
          <select
            id="tcp-shader"
            value={shaderPreset}
            onChange={(e) => setShaderPreset(e.target.value as TumblingCubeShaderPreset)}
            className={input}
          >
            {SHADERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className={field}>
          <label className={label} htmlFor="tcp-grain">
            Grain
          </label>
          <input
            id="tcp-grain"
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={grain}
            onChange={(e) => setGrain(Number(e.target.value))}
            className="w-20 accent-white"
          />
        </div>

        <div className={field}>
          <label className={label} htmlFor="tcp-reel">
            Reel
          </label>
          <select
            id="tcp-reel"
            value={reel}
            onChange={(e) => setReel(e.target.value)}
            className={input}
          >
            {REELS.map((r) => (
              <option key={r.label} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
