import GlassLogoButton from "@/components/ui/glass-logo-button"

export default function GlassLogoButtonDemo() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        background: "radial-gradient(120% 90% at 50% 40%, #10142a 0%, #05060c 60%, #020205 100%)",
      }}
    >
      <GlassLogoButton replayEvery={3200} />
    </div>
  )
}
