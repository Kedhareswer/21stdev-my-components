"use client"

import InkOrbitFooter from "@/components/ui/ink-orbit-footer"

// A support-desk product's sign-up band and footer, light theme, with its own
// copy, sign-up handler and footer columns.
export default function DemoCustom() {
  return (
    <div className="w-full">
      <InkOrbitFooter
        theme="light"
        brand="Tessellate"
        cta={{ title: "Clear the *queue.*", description: "Thirty days free. Bring your whole team.", button: "Start free" }}
        onSubscribe={(email) => new Promise((r) => setTimeout(() => r(console.log("subscribe", email)), 700))}
        tagline="Support that answers itself — and knows when not to."
        columns={[
          { title: "Product", links: [{ label: "Drafts", href: "#" }, { label: "Routing", href: "#" }, { label: "Reports", href: "#" }] },
          { title: "Company", links: [{ label: "About", href: "#" }, { label: "Careers", href: "#" }] },
        ]}
        status="Queues clear"
      />
    </div>
  )
}
