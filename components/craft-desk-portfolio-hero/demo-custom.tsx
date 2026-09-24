"use client"

import CraftDeskPortfolioHero from "@/components/ui/craft-desk-portfolio-hero"

/* Everything on the desk is a prop: the words, the list, the mat, the crayons. */
export default function DemoCustom() {
  return (
    <CraftDeskPortfolioHero
      title="Showreel"
      name="Your Name"
      nameHref="https://21st.dev/@kedhareswer"
      tag="Motion"
      year="Vol. 3"
      todoTitle="This week"
      todos={["Storyboard", { text: "Animatic", done: true }, "Sound pass"]}
      matColor="#1f6fa8"
      crayons={["#ff5a7a", "#ffb000", "#7c4dff", "#00b894"]}
      height="44rem"
    />
  )
}
