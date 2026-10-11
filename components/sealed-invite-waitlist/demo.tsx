"use client"

import SealedInviteWaitlist from "@/components/ui/sealed-invite-waitlist"

// Black paper, opened on load to show the invitation. "Use another email"
// under the tagline puts the form back.
export default function Demo() {
  return (
    <SealedInviteWaitlist
      variant="onyx"
      initialState="invited"
      initialEmail="kedhar@example.com"
      glow="#e8b77a"
      onSubmit={() => new Promise<number>((r) => setTimeout(() => r(42), 900))}
    />
  )
}
