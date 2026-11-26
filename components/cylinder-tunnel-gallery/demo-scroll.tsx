import CylinderTunnelGallery from "@/components/ui/cylinder-tunnel-gallery"

export default function CylinderTunnelGalleryScrollDemo() {
  return (
    <div style={{ width: "100%" }}>
      <CylinderTunnelGallery />
      <div style={{ height: "60svh", display: "grid", placeItems: "center", color: "var(--color-muted-foreground)" }}>
        Scroll back up to fly out of the tunnel.
      </div>
    </div>
  )
}
