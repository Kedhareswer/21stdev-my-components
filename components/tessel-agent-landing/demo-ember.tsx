"use client"

import TesselAgentLanding from "@/components/ui/tessel-agent-landing"

// Everything is a prop. A finance-operations agent platform on the ember
// palette, with its own copy, tasks, features, numbers and a real sign-up hook.
export default function DemoEmber() {
  return (
    <TesselAgentLanding
      brand="Ledgerline"
      palette="ember"
      announcement={{ label: "is now SOC 2 Type II certified", href: "#" }}
      hero={{
        badge: { mark: "F", label: "Trusted by 400+ finance teams" },
        title: "Close the Books with Agents\nThat Show Their Work",
        text: "Agents that match transactions, chase receipts and draft the variance commentary, with an audit trail your controller will actually read.",
        primary: { label: "Start a free close", href: "#signup" },
        secondary: { label: "Book a demo", href: "#pricing" },
        prompt: {
          label: "Finance agent",
          placeholder: "What should we close today?",
          suggestions: [
            "Reconcile October invoices against bank payouts",
            "Chase missing receipts from the sales team",
            "Draft variance commentary for the board pack",
          ],
          models: ["Ledger 2", "Ledger 2 Fast", "Ledger 2 Audit"],
        },
      }}
      logos={[
        { name: "Northbeam", mark: "orbit", style: "bold" },
        { name: "cartwheel", mark: "spark", style: "italic" },
        { name: "Juniper", mark: "leaf", style: "light" },
        { name: "MERIDIAN", mark: "bars", style: "caps" },
        { name: "Ironside", mark: "bolt", style: "bold" },
        { name: "Tallyho", mark: "chevron", style: "light" },
      ]}
      problem={{
        kicker: "Why close takes ten days",
        title: "Finance Runs on Exported Spreadsheets, *Late Receipts, and Tribal Knowledge.*",
      }}
      solution={{
        kicker: "How Ledgerline works",
        title: "Cut the Monthly Close from Ten Days to Three, with Every Match Explained and Every Exception Routed to a Person",
      }}
      stats={[
        { value: 3.2, suffix: " days", decimals: 1, label: "Average close, down from 9.6" },
        { value: 96, suffix: "%", label: "Transactions matched without a human" },
        { value: 14, suffix: "k", label: "Receipts chased each month" },
        { value: 0, label: "Audit findings across 2025 customers" },
      ]}
      pricing={{ title: "Priced per entity, not per transaction." }}
      cta={{ title: "Run your next close on Ledgerline.", text: "Connect your ledger and bank in ten minutes. The first close is free." }}
      footer={{ tagline: "Agents for finance teams that would rather review than re-key." }}
      onSignUp={async (email) => {
        await new Promise((r) => setTimeout(r, 700))
        return email.endsWith("@example.com") ? false : true
      }}
    />
  )
}
