import { ChannelShareBar } from "@/components/ui/channel-share-bar"

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 680px)",
        placeContent: "center",
        padding: 16,
        background: "radial-gradient(80% 60% at 50% 0%, #1a2030 0%, #0a0c11 70%)",
      }}
    >
      <ChannelShareBar />
    </div>
  )
}
