import { ChannelShareBar } from "@/components/ui/channel-share-bar"

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 640px)",
        placeContent: "center",
        padding: 16,
        background: "var(--color-background)",
        backgroundImage: "radial-gradient(color-mix(in oklab, var(--color-foreground) 14%, transparent) 1px, transparent 1px)",
        backgroundSize: "14px 14px",
      }}
    >
      <ChannelShareBar />
    </div>
  )
}
