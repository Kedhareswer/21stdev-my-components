"use client"

import MallowSupportTemplate from "@/components/ui/mallow-support-template"

// The same template as an internal IT service desk, in the lavender palette.
export default function DemoLavender() {
  return (
    <MallowSupportTemplate
      brand="Larkspur"
      palette="lavender"
      seed={4}
      logos={["Halden", "Quarry", "Brightline", "Osier", "Meridian", "Copse", "Fathom", "Tallow"]}
      hero={{
        badge: "Now resolving Okta and Jamf requests",
        title: "IT help that's there\nbefore the coffee is.",
        text: "{brand} answers your team's IT questions in Slack and email, resets what it's allowed to reset, and sends the rest to the right engineer with the logs attached.",
        primary: "Try it with your team",
        secondary: "See how it works",
        note: "Works with Slack, Teams, Jira and Okta.",
        workspace: "Halden IT",
        agent: "Marcus",
        tickets: [
          { name: "Grace Liu", subject: "Locked out of Okta", channel: "chat", took: 3, message: "I typed my password wrong too many times and now Okta won't let me in. Big client call in 20 minutes!", reply: "You're unlocked, Grace. I've verified you with your phone and reset the lockout. Sign in normally, and you'll be asked for a new MFA push." },
          { name: "Tomás Varga", subject: "VPN drops every hour", channel: "email", took: 6, message: "My VPN disconnects about every 60 minutes since yesterday's update.", reply: "That's the new 60-minute session policy on the old client. I've pushed GlobalProtect 6.2 to your Mac through Jamf. Restart once it finishes and the drops will stop." },
          { name: "Aisha Bello", subject: "New starter laptop", channel: "chat", handTo: "Marcus", message: "Our new designer starts Monday and still doesn't have a laptop.", reply: "I've opened a hardware request for a 16-inch MacBook Pro and handed it to Marcus, who's at the office today. He has the start date and the designer's role." },
          { name: "Ben Ito", subject: "Access to the Figma team", channel: "chat", took: 4, message: "Can I get edit access to the Brand team in Figma?", reply: "Done, Ben. Your manager approved it in Slack, so you now have editor access to the Brand team. It can take a minute to show up." },
          { name: "Clara Novak", subject: "Printer on floor 3", channel: "email", took: 5, message: "The printer by the kitchen on floor 3 just says 'offline'.", reply: "Thanks, Clara. It dropped off the network after a firmware update. I've restarted it remotely and it's printing again; your queued jobs are going through now." },
          { name: "Rafael Ortiz", subject: "Suspicious email", channel: "email", handTo: "Security", message: "Got an email from 'payroll' asking me to confirm my bank details. Looks off.", reply: "Good catch, Rafael. Don't click anything. I've reported it, pulled it from 14 other inboxes, and handed it to the security team with the headers attached." },
          { name: "Nina Park", subject: "Install Docker Desktop", channel: "chat", took: 3, message: "Can I install Docker Desktop? Self Service doesn't have it.", reply: "It's approved for engineering. I've added Docker Desktop to your Self Service, so you'll see it in the app within a minute." },
        ],
      }}
      ways={{
        title: "Three ways {brand}\nruns your help desk.",
        items: [
          { kind: "resolve", title: "Answers in seconds", text: "Password resets, access requests and how-tos, answered in Slack before anyone opens a ticket.", from: "Ben Ito", ask: "How do I add the office printer on my Mac?", answer: "Open System Settings, then Printers, and pick 'Floor 3 Kitchen'. I've also pushed the driver to your Mac, so it's ready." },
          { kind: "learn", title: "Learns your stack", text: "It reads your runbooks, Confluence and past tickets, and knows which apps each team is allowed.", sources: [{ name: "Confluence", meta: "318 runbooks" }, { name: "Okta groups", meta: "Live sync" }, { name: "Jira tickets", meta: "9,410 resolved" }, { name: "Jamf catalog", meta: "212 apps" }] },
          { kind: "escalate", title: "Knows when to page someone", text: "Hardware, security and anything risky goes to the right engineer, with logs and context.", from: "Ines Duarte", ask: "My laptop got wet and won't turn on. I've got a demo at 2pm.", handTo: "Marcus", answer: "On my way with a loaner, Ines. Your files are synced, so you'll be set up by 1pm." },
        ],
      }}
      features={{
        title: "One desk.\nEvery request, handled.",
      }}
      pricing={{
        title: "Simple pricing.\nNo surprise invoices.",
        trust: "Trusted by 340 IT teams",
      }}
      cta={{
        title: "Give your engineers\ntheir afternoons back.",
        text: "Connect Slack and your knowledge base. {brand} starts answering in about ten minutes.",
        button: "Start with your team",
        morning: "Good morning, Marcus",
        waiting: [
          { name: "Aisha Bello", subject: "New starter laptop", tag: "Hardware" },
          { name: "Rafael Ortiz", subject: "Suspicious email", tag: "Security" },
          { name: "Leo Grant", subject: "Salesforce admin rights", tag: "Approval" },
        ],
      }}
      footer={{
        tagline: "The AI service desk that answers IT questions where your team already works.",
      }}
    />
  )
}
