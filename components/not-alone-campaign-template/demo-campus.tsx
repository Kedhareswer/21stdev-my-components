"use client"

import NotAloneCampaignTemplate from "@/components/ui/not-alone-campaign-template"

const photo = (id: string, alt: string, tone: string, focus?: string) => ({ src: "https://images.unsplash.com/photo-" + id, alt, tone, focus })

/** A university wellbeing week in Scotland: heather palette, UK helplines, no faith page. */
export default function DemoCampus() {
  return (
    <NotAloneCampaignTemplate
      palette="heather"
      brand={{ name: "Not", word: "Alone", org: "Students' Union Wellbeing Team" }}
      hero={{
        tagline: "Mental health is more common than you think.",
        kicker: "You are not",
        word: "alone.",
        fact: "In England, about ==1 in 5== young people aged 8 to 25 had a probable mental disorder in 2023. Most of them sit next to someone who never knew.",
        source: { label: "NHS England, 2023", href: "https://digital.nhs.uk" },
        faith: "Wellbeing Week runs 10 to 14 November. Drop in to the Union any afternoon, no appointment and no forms.",
        closing: "Asking for help is a skill. Practise it here.",
        landscape: photo("1470071459604-3b5ec3a7fe05", "The Quiraing ridge on Skye under low cloud", "#6d7f4c", "50% 70%"),
        window: photo("1484557985045-edf25e08da73", "A curious sheep at the front of the flock", "#8f9a6a", "50% 40%"),
      }}
      stats={[
        {
          value: "1 in 5",
          text: "young people aged 8 to 25 in England had a probable mental disorder in 2023.",
          fraction: 0.2,
          source: { label: "NHS England", href: "https://digital.nhs.uk" },
        },
        {
          value: "1 in 4",
          text: "of 17 to 19 year olds, the age most students arrive on campus.",
          fraction: 0.233,
          source: { label: "NHS England", href: "https://digital.nhs.uk" },
        },
      ]}
      signs={[
        {
          title: "Nights out of shape",
          body: "Awake at four, asleep through the nine o'clock, every day for a week.",
          help: "Suggest a walk to the first lecture together. Routine is easier with company.",
          shot: photo("1505322022379-7c3353ee6291", "A starry night over a misty lake", "#1f2a3a", "50% 40%"),
        },
        {
          title: "Gone from the group chat",
          body: "Muted, left on read, missing from the flat dinner they used to cook.",
          help: "Knock, do not text. \"Making pasta, want some?\" is a whole conversation.",
          shot: photo("1502082553048-f009c37129b9", "A lone tree in a green field", "#6d8f3c", "50% 60%"),
        },
        {
          title: "Deadlines piling up",
          body: "Extensions on everything, then not even asking for those.",
          help: "Offer to sit with them while they email their tutor. The first line is the hardest.",
          shot: photo("1446329813274-7c9036bd9a1f", "An autumn path through the woods", "#a8662a", "50% 55%"),
        },
        {
          title: "Talk of disappearing",
          body: "\"I just want to not exist for a while.\" Never laugh it off.",
          help: "Ask directly if they are thinking about suicide. Stay with them and call Samaritans on 116 123, or 999 if they are in danger.",
          shot: photo("1500534314209-a25ddb2bd429", "Blue ridges fading into haze", "#3d4f57", "50% 60%"),
          urgent: true,
        },
      ]}
      faith={null}
      helplines={[
        { name: "Samaritans", detail: "Free, any time, day or night. You do not have to be suicidal to call.", contact: "116 123", href: "tel:116123" },
        { name: "Shout", detail: "Text SHOUT to 85258 if talking out loud feels like too much.", contact: "85258", href: "sms:85258" },
        { name: "NHS 111", detail: "Choose the mental health option for urgent help in England.", contact: "111", href: "tel:111" },
        { name: "Emergency", detail: "If someone is in immediate danger, call and stay with them.", contact: "999", href: "tel:999", urgent: true },
      ]}
      pledge={{
        title: "Be someone's **not alone**.",
        body: "Knock on one door this week. Bring tea. Stay for the answer.",
        cta: "I'll knock on a door",
        done: "Kettle on. Whose door is it?",
        count: 642,
        shot: photo("1502082553048-f009c37129b9", "A lone tree in a green field", "#6d8f3c", "50% 70%"),
      }}
      labels={{
        navFaith: "Faith",
        factsKicker: "On campus",
        factsTitle: "Statistically, someone on your corridor.",
        footerNote: "This page shares information, not a diagnosis. If you or someone you know is in danger, call 999 now.",
      }}
    />
  )
}
