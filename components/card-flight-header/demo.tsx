import CardFlightHeader from "@/components/ui/card-flight-header"

export default function CardFlightHeaderDemo() {
  return (
    <div style={{ width: "100%", minHeight: "100svh", background: "#0c0d11" }}>
      <CardFlightHeader autoPlay panelHeight="calc(100svh - 46px)" />
    </div>
  )
}
