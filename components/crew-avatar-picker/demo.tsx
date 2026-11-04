"use client"

import CrewAvatarPicker, { type CrewMember } from "@/components/ui/crew-avatar-picker"

// Free Unsplash portraits. Swap in your own.
const face = (id: string) => "https://images.unsplash.com/photo-" + id + "?w=160&h=160&fit=crop&crop=faces&q=70"

const people: CrewMember[] = [
  { id: "maya", name: "Maya Okafor", role: "Design lead", photo: face("1531123897727-8f129e1688ce"), color: "#ff7a1a" },
  { id: "theo", name: "Theo Lindqvist", role: "Engineer", photo: face("1500648767791-00dcc994a43e"), color: "#3b82f6" },
  { id: "priya", name: "Priya Raman", role: "Product", photo: face("1580489944761-15a19d654956"), color: "#e5468b" },
  { id: "jonah", name: "Jonah Weiss", role: "Engineer", photo: face("1506794778202-cad84cf45f1d"), color: "#10b981" },
  { id: "lena", name: "Lena Ferreira", role: "Research", photo: face("1534528741775-53994a69daeb"), color: "#8b5cf6" },
]

const directory: CrewMember[] = [
  { id: "kai", name: "Kai Moreno", role: "Marketing", photo: face("1472099645785-5658abf4ff4e"), color: "#f59e0b" },
  { id: "ana", name: "Ana Souza", role: "Support", photo: face("1438761681033-6461ffad8d80"), color: "#06b6d4" },
  { id: "omar", name: "Omar Haddad", role: "Data", photo: face("1507003211169-0a1dd7228f2d"), color: "#ef4444" },
]

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "88px 16px",
        background: "radial-gradient(60% 45% at 50% 0%, rgba(255,122,26,.14), transparent 70%), var(--color-background)",
      }}
    >
      <CrewAvatarPicker people={people} directory={directory} defaultValue={["maya", "priya"]} />
    </div>
  )
}
