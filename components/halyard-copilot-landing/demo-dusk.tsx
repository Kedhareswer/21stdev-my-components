"use client"

import HalyardCopilotLanding from "@/components/ui/halyard-copilot-landing"

const photo = (id: string) => "https://images.unsplash.com/photo-" + id + "?w=160&h=160&fit=crop&crop=faces&auto=format&q=70"

// Everything is a prop. An electrical distributor on the dusk palette, its own
// rep, inbox, accounts and quote, and real handlers for sending and booking.
export default function DemoDusk() {
  return (
    <HalyardCopilotLanding
      brand="Ferrule"
      tagline="Supply"
      product="Assist"
      palette="dusk"
      badge="Orders → quotes → reorders"
      title={"Every contractor gets\nyour best counter rep."}
      subtitle="Assist reads stock, job pricing and order history, then drafts the follow-up before the buyer has to ask."
      primaryAction={{ label: "Book a walkthrough" }}
      demoAction={{ label: "Talk to sales" }}
      user={{ name: "Maya Ortega", avatar: photo("1573496359142-b8d87734a5a2") }}
      totalEmails={642}
      groups={[{ category: "Job Quotes", total: 41 }, { category: "Reorders", total: 17 }]}
      threads={[
        {
          id: "f1",
          contact: "Diego Ferreira",
          avatar: photo("1507003211169-0a1dd7228f2d"),
          account: "Ferreira Electric",
          title: "Lakeside Job: Wire & Boxes",
          category: "Job Quotes",
          when: "Today",
          status: "active",
          insight: "Diego's crew starts Lakeside on Monday. Everything on his takeoff is in stock in Columbus.",
          recipients: ["diego@ferreiraelectric.com", "office@ferreiraelectric.com"],
          subject: "Lakeside: full takeoff priced and on the shelf",
          draft:
            "Hi Diego,\n\nI priced the full Lakeside takeoff at your job tier: 2,400 ft of 12 AWG THHN, 120 4\" boxes and 36 breakers comes to $4,212, copper-indexed through Friday.\n\nIt's all in Columbus, so we can stage it for 6 am pickup Monday.\n\nWant me to hold it?\n\nBest,\nMaya",
        },
        {
          id: "f2",
          contact: "Aisha Mensah",
          avatar: photo("1531123897727-8f129e1688ce"),
          account: "Mensah Builders",
          title: "Breaker Panel Back-order",
          category: "Job Quotes",
          when: "Yesterday",
          status: "active",
          insight: "The 200 A panel Aisha ordered is back-ordered 2 weeks. A compatible panel is in stock.",
          recipients: ["aisha@mensahbuilders.com"],
          subject: "Your 200 A panel: an in-stock alternative",
          draft:
            "Hi Aisha,\n\nThe 200 A panel on your order is two weeks out from the factory. The Eaton equivalent is on our shelf at the same price and fits the same breakers.\n\nShall I swap it so the rough-in stays on schedule?\n\nBest,\nMaya",
        },
        {
          id: "f3",
          contact: "Tom Becker",
          avatar: photo("1500648767791-00dcc994a43e"),
          account: "Becker Service Co.",
          title: "Monthly Van Restock",
          category: "Reorders",
          when: "Mon",
          status: "active",
          insight: "Tom restocks his three vans on the first Monday of the month. His usual list is ready.",
          recipients: ["tom@beckerservice.com"],
          subject: "Van restock for November is ready",
          draft: "Hi Tom,\n\nYour usual van restock is ready: wire nuts, 14/2 and 12/2 NM-B, and the GFCI receptacles. Same pricing as October.\n\nReply \"yes\" and it'll be at the counter by 7.\n\nBest,\nMaya",
        },
      ]}
      customers={[
        { account: "Ferreira Electric", contact: "Diego Ferreira", avatar: photo("1507003211169-0a1dd7228f2d"), rep: "Maya O.", lastOrder: "Oct 18", weekly: [18, 20, 19, 22, 24, 23, 26, 29, 28, 31, 34, 37] },
        { account: "Mensah Builders", contact: "Aisha Mensah", avatar: photo("1531123897727-8f129e1688ce"), rep: "Maya O.", lastOrder: "Oct 02", weekly: [38, 36, 39, 37, 35, 36, 30, 27, 25, 22, 21, 19] },
        { account: "Becker Service Co.", contact: "Tom Becker", avatar: photo("1500648767791-00dcc994a43e"), rep: "Luis R.", lastOrder: "Oct 07", weekly: [12, 13, 12, 14, 13, 12, 14, 13, 12, 14, 13, 14] },
        { account: "Brightline Solar", contact: "Hannah Cho", avatar: photo("1534528741775-53994a69daeb"), rep: "Luis R.", lastOrder: "Sep 21", weekly: [22, 24, 25, 23, 21, 18, 16, 15, 12, 10, 9, 7] },
      ]}
      cta={{ title: "Answer every contractor like they're your only one.", action: { label: "Book a walkthrough" } }}
      onSend={async ({ recipients, subject }) => {
        console.log("send", subject, "to", recipients)
        return true
      }}
      onBookDemo={async (data) => {
        console.log("demo request", data)
        return true
      }}
    />
  )
}
