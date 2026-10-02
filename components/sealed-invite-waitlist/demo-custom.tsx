"use client"

import SealedInviteWaitlist from "@/components/ui/sealed-invite-waitlist"

// Your own copy, mark and colour, at a fixed height inside a page.
export default function Demo() {
  return (
    <div className="w-full">
      <SealedInviteWaitlist
        height="640px"
        variant="steel"
        placeholder="you@studio.com"
        buttonLabel="Request access"
        pendingLabel="Posting"
        invitedTitle="A seat is saved for you."
        tagline="Doors open this winter"
        resetLabel="Invite someone else"
        glow="#7aa7e8"
        lean={-4}
        mark={
          <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden style={{ display: "block", maxWidth: "none" }}>
            <path d="M12 3 L20 12 L12 21 L4 12 Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        }
        onSubmit={() => new Promise<void>((r) => setTimeout(r, 700))}
      />
    </div>
  )
}
