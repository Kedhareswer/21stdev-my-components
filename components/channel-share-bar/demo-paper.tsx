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
        background: "radial-gradient(80% 60% at 50% 0%, #fbfaf6 0%, #e9e6dd 80%)",
      }}
    >
      <ChannelShareBar
        tone="light"
        eyebrow="Growth · last 90 days"
        title="Signups by source"
        subtitle="First touch, de-duplicated by workspace"
        unit="signups"
        periods={[
          {
            label: "30 days",
            slices: [
              { label: "Organic", value: 4210, color: "#2f8a68" },
              { label: "Referral", value: 2380, color: "#c2662d" },
              { label: "Paid", value: 1460, color: "#4a63b8" },
              { label: "Partners", value: 520, color: "#a24d78" },
              { label: "Events", value: 190, color: "#857a5c" },
            ],
          },
          {
            label: "90 days",
            slices: [
              { label: "Organic", value: 11840, color: "#2f8a68" },
              { label: "Referral", value: 7020, color: "#c2662d" },
              { label: "Paid", value: 5190, color: "#4a63b8" },
              { label: "Partners", value: 1310, color: "#a24d78" },
              { label: "Events", value: 880, color: "#857a5c" },
            ],
          },
        ]}
      />
    </div>
  )
}
