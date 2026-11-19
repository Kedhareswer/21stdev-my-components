"use client"

import FlipboardCheckoutCounter from "@/components/ui/flipboard-checkout-counter"

export default function Demo() {
  return (
    <FlipboardCheckoutCounter
      height="max(640px, 100svh)"
      defaultDetails={{ email: "rider@example.com", address: "12 Ledge Lane, Pune 411001", card: "4242 4242 4242 4242", expiry: "08 / 29", cvc: "123" }}
      onPay={(order) => console.log("paid", order)}
    />
  )
}
