"use client"

import FuelplateRecipesTemplate from "@/components/ui/fuelplate-recipes-template"

// Same template, rebranded for a strength audience: clay palette, a barbell
// hero, a higher calorie target and its own copy.
export default function DemoLifters() {
  return (
    <FuelplateRecipesTemplate
      brand="Ironleaf"
      tagline="Strength-first meals, macro-matched."
      palette="clay"
      target={3200}
      hero={{
        title: "Strength-first\nrecipes for lifters.",
        text: "High-protein meals built around your training split, so every session has the fuel it needs and every rest day does its job.",
        cta: "Start lifting better",
        image: {
          src: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712",
          alt: "A lifter gripping a loaded barbell on a gym floor",
          tone: "#3a3a36",
          focus: "50% 60%",
        },
      }}
      showcase={{ title: "Protein doesn't\nhave to be plain.", text: "Forty grams a plate, and still the best thing you'll eat all day." }}
      cta={{ title: "Lift more. Eat well.\nRecover faster.", text: "Plans, grocery lists and cooking mode, tuned to your split.", button: "Get Ironleaf" }}
      onSave={(dish, saved) => console.log(saved ? "saved" : "unsaved", dish.name)}
    />
  )
}
