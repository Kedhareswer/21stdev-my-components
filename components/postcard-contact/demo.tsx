"use client"

import PostcardContact from "@/components/ui/postcard-contact"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to fit its contents.
  return (
    <div className="w-full">
      <PostcardContact
        recipient="Kedhar"
        onSend={async (data) => {
          // Swap for your own endpoint: fetch("/api/contact", { method: "POST", body: JSON.stringify(data) })
          await new Promise((r) => setTimeout(r, 900))
          console.log("postcard", data)
        }}
      />
    </div>
  )
}
