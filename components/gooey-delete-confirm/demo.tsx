import GooeyDeleteConfirm from "@/components/ui/gooey-delete-confirm"

export default function GooeyDeleteConfirmDemo() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100svh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        placeItems: "center",
        padding: 16,
        boxSizing: "border-box",
        background: "radial-gradient(110% 80% at 50% 45%, #1d1712 0%, #0b0806 65%, #050403 100%)",
      }}
    >
      <GooeyDeleteConfirm autoPlay />
    </div>
  )
}
