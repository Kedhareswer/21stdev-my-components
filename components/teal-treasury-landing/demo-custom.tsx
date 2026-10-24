"use client"

import TealTreasuryLanding from "@/components/ui/teal-treasury-landing"

// Everything is a prop. The same page for a different treasury product on the
// plum palette: its own accounts and copy, its own coverage limit and price,
// and real handlers for confirming a transfer and starting sign-up.
export default function DemoCustom() {
  return (
    <TealTreasuryLanding
      brand="Orchard"
      palette="plum"
      fund="Orchard Seed Fund IV"
      hero={{
        title: "Every fund's cash,\n*one* quiet ledger",
        text: "Orchard runs operating cash, sweep vaults and money market funds for emerging managers, with approvals and reporting built in.",
        primary: { label: "Open an account", href: "#get-started" },
        secondary: { label: "Talk to us", href: "#faq" },
      }}
      accounts={[
        { id: "ops", name: "Operating", kind: "Checking · 2 approvers", balance: 4820000 },
        { id: "mmf", name: "Treasury fund", kind: "Gov't MMF · 4.61% 7-day", balance: 11650000 },
        { id: "sweep", name: "Sweep", kind: "Insured across 240 banks", balance: 2130000 },
      ]}
      activity={[
        { id: "c1", date: "Oct 23", text: "Capital call · close 2", account: "Operating", amount: 1850000, status: "Settled" },
        { id: "c2", date: "Oct 20", text: "Wire to Lumen Robotics", account: "Operating", amount: -750000, status: "Pending" },
        { id: "c3", date: "Oct 18", text: "Treasury fund dividend", account: "Treasury fund", amount: 44120.18, status: "Settled" },
        { id: "c4", date: "Oct 15", text: "Fund admin · October", account: "Operating", amount: -18500, status: "Scheduled" },
      ]}
      benefits={{
        text: "Emerging managers shouldn't need a back office to *keep cash safe.* Orchard opens, sweeps and reports for every vehicle you run.",
        stats: [
          { value: 3.4, decimals: 1, prefix: "$", suffix: "B", label: "Held for managers" },
          { value: 1900, suffix: "+", label: "Funds and SPVs" },
          { value: 4, suffix: " min", label: "Median account setup" },
        ],
      }}
      coverage={{ limit: 60e6, perBank: 250e3 }}
      pricing={{ price: "$3k", unit: "a year, per fund family", annual: 3000 }}
      cta={{ title: "Bring your funds\nunder *one roof*", button: "Start now" }}
      onTransfer={(t) => new Promise((ok) => setTimeout(() => ok(t.amount <= 10e6), 700))}
      onGetStarted={(email) => new Promise((ok) => setTimeout(() => ok(!email.endsWith("@example.com")), 700))}
    />
  )
}
