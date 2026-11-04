"use client"

import ApprovalMorphTray, { type AccessRequest } from "@/components/ui/approval-morph-tray"

// Free Unsplash portraits. Swap in your own avatar URLs.
const face = (id: string) => "https://images.unsplash.com/photo-" + id + "?w=120&h=120&fit=crop&crop=faces&q=70"

const requests: AccessRequest[] = [
  { id: "1", name: "Maya Okafor", avatar: face("1531123897727-8f129e1688ce"), role: "Editor access", time: "2m" },
  { id: "2", name: "Theo Lindqvist", avatar: face("1500648767791-00dcc994a43e"), role: "Can comment", time: "14m" },
  { id: "3", name: "Priya Raman", avatar: face("1580489944761-15a19d654956"), role: "Editor access", time: "1h" },
  { id: "4", name: "Jonah Weiss", avatar: face("1506794778202-cad84cf45f1d"), role: "View only", time: "3h" },
  { id: "5", name: "Lena Ferreira", avatar: face("1534528741775-53994a69daeb"), role: "Admin", time: "Yesterday" },
  { id: "6", name: "Kai Moreno", avatar: face("1472099645785-5658abf4ff4e"), role: "Can comment", time: "2d" },
]

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "48px 16px",
        background: "var(--color-background)",
      }}
    >
      <ApprovalMorphTray requests={requests} resource="Q4 Brand kit · Figma" defaultOpen />
    </div>
  )
}
