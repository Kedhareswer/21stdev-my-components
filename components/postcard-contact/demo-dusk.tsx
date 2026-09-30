"use client"

import * as React from "react"
import PostcardContact from "@/components/ui/postcard-contact"

export default function DemoDusk() {
  // The first send bounces so the RETURN TO SENDER state can be seen; the
  // second one goes through.
  const tries = React.useRef(0)
  return (
    <div className="w-full">
      <PostcardContact
        scene="dusk"
        recipient="Kedhar"
        envelopeNote="a note from {firstName}, with love"
        thanksTitle="Got it, {firstName}."
        thanksBody="Sealed, stamped and on my desk. Expect a reply within a couple of days."
        signoff="Warmly,"
        subjectPlaceholder="Sunset in Santorini"
        imprint="K. D. STUDIO"
        sendLabel="Post it"
        fields={["lastName", "phone"]}
        ink="#23192b"
        printInk="#8a3a2e"
        paper="#f2e7d8"
        envelope="#e9d8c4"
        seal="#274a6b"
        onSend={async () => {
          await new Promise((r) => setTimeout(r, 700))
          if (tries.current++ === 0) throw new Error("The mail truck got a flat tyre.")
        }}
      />
    </div>
  )
}
