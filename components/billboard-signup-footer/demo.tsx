"use client"

import BillboardSignupFooter from "@/components/ui/billboard-signup-footer"

// Same component, re-branded and re-inked, with a real async handler: any
// address at example.com is "already subscribed", so the error state shows too.
export default function Demo() {
  return (
    <div className="w-full bg-[#2342ff]">
      <BillboardSignupFooter
        brand="Pulse 24"
        wordmark="PULSE 24"
        accent="#2342ff"
        paper="#eef0f7"
        tickerInk="#0d1033"
        placeholder="name@studio.com"
        buttonLabel="Join"
        tagline="One short letter a month. Unsubscribe in a click."
        onSubscribe={async (email) => {
          await new Promise((done) => setTimeout(done, 1100))
          if (email.endsWith("@example.com")) throw new Error("That address is already on the list.")
          return "Welcome aboard. Issue 01 lands Friday."
        }}
        socials={[
          { label: "Instagram", href: "#", icon: "instagram" },
          { label: "YouTube", href: "#", icon: "youtube" },
          { label: "GitHub", href: "#", icon: "github" },
        ]}
        columns={[
          { title: "Listen", links: [{ label: "Latest episode" }, { label: "Archive" }, { label: "Playlists" }] },
          { title: "Studio", links: [{ label: "About" }, { label: "Press kit" }] },
          { title: "Help", links: [{ label: "Contact" }, { label: "hello@pulse24.fm", href: "mailto:hello@pulse24.fm" }] },
        ]}
        ticker={{ lead: "Pulse", items: ["check, every Friday", "of the city", "louder than the algorithm"], speed: 90 }}
        chat={{ title: "Pulse 24 desk", status: "On air until 6pm", message: "Got a story, a track or a complaint? We read everything.", actionLabel: "Write to the desk" }}
      />
    </div>
  )
}
