"use client"

import VaultDialReveal from "@/components/ui/vault-dial-reveal"

export default function Demo() {
  // Full-bleed: the scene paints its own room. w-full keeps it from shrinking
  // to nothing inside 21st's centring flex wrapper.
  return (
    <div className="w-full">
      <VaultDialReveal code={[12, 30, 7]} />
    </div>
  )
}
