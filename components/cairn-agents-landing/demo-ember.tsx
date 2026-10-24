"use client"

import CairnAgentsLanding from "@/components/ui/cairn-agents-landing"

const photo = (id: string, w: number) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&q=72&w=" + w

// The same page reprinted for a different business: a patient-access line for
// a clinic network, on the warm ember palette with its own photos and copy.
export default function DemoEmber() {
  return (
    <CairnAgentsLanding
      brand="Wayfern"
      palette="ember"
      announcement={{ label: "New: Wayfern now books in 31 languages", href: "#demo" }}
      title={"Every patient call,\nanswered kindly."}
      subtitle="Voice agents for clinic networks: booking, refills and triage questions, with the patience of your best front desk and none of the hold music."
      liveCalls={386}
      images={{
        hero: photo("1500964757637-c85e8a162699", 2400),
        canvas: photo("1426604966848-d7adac402bff", 2000),
        call: photo("1501785888041-af3ef285b470", 2200),
        cta: photo("1519681393784-d120267933ba", 2400),
      }}
      scenarios={[
        {
          label: "Flu season",
          alert: "Flu season just hit. The phone lines have been red since 7 a.m.",
          reply: "I'm booking every caller into the nearest open slot and sending the address by text. Nobody waits.",
          replyLink: { label: "See how", href: "#product" },
          voice: "Can you get my daughter in today?",
        },
        {
          label: "Snow day",
          alert: "Two clinics closed for snow. 300 appointments need moving.",
          reply: "I'm calling every patient now, offering video visits first and the next in-person slot second.",
          replyLink: { label: "Hear a call", href: "#demo" },
          voice: "Oh, you called me first? Thank you.",
        },
      ]}
      logos={[
        { name: "Aldermoor Health", style: "serif", color: "#7a2e1d" },
        { name: "pulse+", style: "round", color: "#0f7c6e" },
        { name: "Meridian", style: "mono", color: "#5b3a8c" },
        { name: "Calloway", style: "script", color: "#b4471f" },
        { name: "Brightwell", style: "badge", color: "#d9480f" },
      ]}
      logosLabel="Answering for 140 clinics across three time zones"
      call={{
        kicker: "Listen in",
        title: "Patient, every time.\nEven at 2 a.m.",
        text: "A refill call, start to finish. The agent knows the patient, checks the pharmacy, and never once says “please hold”.",
        data: {
          caller: "Arthur Bell",
          topic: "Pharmacy line · inbound",
          memory: ["Patient since 2014", "Hard of hearing: speak slowly"],
          outcome: "Refill sent in 1:21 · no hold · pharmacy confirmed",
          lines: [
            { who: "caller", mood: -0.5, text: "Hello? I've run out of my blood pressure tablets and the pharmacy says it needs the doctor." },
            { who: "agent", mood: -0.25, memory: "Lisinopril 10 mg · last filled Sep 2", text: "Good evening, Arthur. I can see your lisinopril, last filled on the second of September. Dr. Osei has approved refills." },
            { who: "caller", mood: -0.1, text: "So I don't need to come in?" },
            { who: "agent", mood: 0.45, memory: "Pharmacy · Elm Street CVS", text: "Not this time. I've sent it to the Elm Street pharmacy, and it's ready after 9 tomorrow morning." },
            { who: "caller", mood: 0.85, text: "Well, that was easy. Thank you, dear." },
          ],
        },
      }}
      stats={{
        kicker: "Zero wait time",
        title: "The waiting room, emptied.",
        items: [
          { value: 0, from: 548, clock: true, label: "Average hold time", note: "Before Wayfern 9:08" },
          { value: 97, suffix: "%", label: "Calls finished without staff" },
          { value: 31, label: "Languages spoken natively" },
          { value: 64, suffix: "k", label: "Appointments booked a week" },
        ],
      }}
      quotes={{
        kicker: "From the front desk",
        items: [
          {
            quote: "Our receptionists used to spend the morning on hold music. Now they spend it with the patients standing in front of them.",
            name: "Grace Whitfield",
            role: "Practice Manager",
            company: "Aldermoor Health",
            avatar: photo("1438761681033-6461ffad8d80", 200),
          },
          {
            quote: "It speaks slowly to the patients who need it and quickly to the ones who don't. We never had to tell it which was which.",
            name: "Dr. Kwame Osei",
            role: "Medical Director",
            company: "Meridian Clinics",
            avatar: photo("1507003211169-0a1dd7228f2d", 200),
          },
        ],
      }}
      cta={{
        kicker: "Talk to us",
        title: "Quiet phones.\nHappier patients.",
        text: "Live on your own numbers in two weeks, connected to your EHR and pharmacy systems.",
        action: "Book a demo",
        assurances: ["HIPAA compliant", "SOC 2 Type II", "EHR integrations"],
      }}
    />
  )
}
