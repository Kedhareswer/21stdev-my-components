"use client"

import SealedInviteWaitlist from "@/components/ui/sealed-invite-waitlist"

// Stands in for a real waitlist endpoint: a short wait, then a place in line.
// Type "taken@" anything to see the error path.
async function join(email: string) {
  await new Promise((r) => setTimeout(r, 900))
  if (email.startsWith("taken@")) throw new Error("That address is already on the list.")
  let h = 0
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0
  return 120 + (h % 880)
}

export default function Demo() {
  return <SealedInviteWaitlist onSubmit={join} />
}
