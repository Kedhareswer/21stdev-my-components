"use client"

import ReceiptPortfolio from "@/components/ui/receipt-portfolio"

// Night shift: the same roll on a dark wall, re-worded for a developer, with
// the About section opened and a custom set of sections.
export default function DemoNight() {
  return (
    <div className="w-full">
      <ReceiptPortfolio
        title="Works"
        receiptNo={24}
        cashier="Theo Park"
        terminal="07"
        note={"Frontend engineer, printed daily.\nTap a line to expand it."}
        defaultOpen={0}
        wall="#18181a"
        paper="#efece4"
        ink="#111111"
        items={[
          {
            label: "Hello",
            blocks: [
              { type: "art", art: "portrait", caption: "Theo, at the terminal" },
              { type: "text", text: "I build interfaces that load fast and feel slow in the right places." },
              { type: "row", label: "Stack", value: "React / TS" },
              { type: "row", label: "Years", value: "9" },
            ],
          },
          {
            label: "Design systems",
            code: "D01",
            blocks: [
              { type: "art", art: "marks", caption: "Tokens, icons, primitives" },
              { type: "row", label: "Components", value: "140" },
              { type: "tags", items: ["Tokens", "A11y", "Docs"] },
            ],
          },
          {
            label: "Commerce",
            code: "C02",
            blocks: [
              { type: "art", art: "box", caption: "Checkout for a coffee roaster" },
              { type: "row", label: "Conversion", value: "+18%" },
              { type: "row", label: "LCP", value: "1.1 s" },
            ],
          },
          { label: "Open source", code: "O03", blocks: [{ type: "text", text: "Maintainer of a handful of small, well-tested packages." }, { type: "row", label: "Stars", value: "6.2k" }] },
          {
            label: "Say hi",
            code: "S04",
            blocks: [
              { type: "art", art: "stamp" },
              { type: "row", label: "Email", value: "theo@example.com", href: "mailto:theo@example.com" },
              { type: "row", label: "GitHub", value: "@theo", href: "#" },
            ],
          },
        ]}
        totalValue="1 engineer"
        footer="Keep this receipt"
      />
    </div>
  )
}
