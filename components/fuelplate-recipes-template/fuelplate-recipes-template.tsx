"use client"

// Fuelplate Recipes Template: a landing page for a meal-planning app built for
// athletes. Warm paper background, light editorial serif, sage pills, real food
// photography, and a phone that actually works.
//
// - Hero: a full-bleed photo that folds into a rounded card as you scroll, a
//   headline that rises word by word, and a floating "today's plate" widget.
// - Features: three hand-drawn SVG illustrations (sneaker, beet, salmon).
// - Planner: a pinned scene. Scrolling walks the tabs (plan your week, grocery
//   list, swap recipes) and morphs the phone between three working screens.
// - Showcase: a coverflow of dishes you can drag, swipe, click or arrow through,
//   with a heart that saves to the nav.
// - Bento: live recipe search with filters, a nutrient marquee, diet toggles
//   that count matching recipes, and testimonials.
// - Cook: a step-by-step cooking mode with a real timer, a servings stepper
//   that rescales the ingredients, and a metric / imperial switch.
// - Categories, resources (filterable), a scroll-scrubbed call to action and
//   a footer.
//
// Motion is GSAP with ScrollTrigger. Under prefers-reduced-motion nothing is
// hidden, pinned or scrubbed: the page is simply there.
//
// The default photographs are from Unsplash (Unsplash License), served by its
// CDN at the width each slot needs. Every picture and every string is a prop.
import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

/** A photograph. */
export type FptShot = {
  /** Any image URL. Unsplash URLs get a responsive srcset automatically. */
  src: string
  alt?: string
  /** Shown while it loads, and if it fails. */
  tone?: string
  /** CSS object-position. */
  focus?: string
}

export type FptDish = {
  id: string
  name: string
  image: FptShot
  /** Minutes. */
  time: number
  kcal: number
  /** Grams. */
  protein: number
  carbs: number
  fat: number
  /** "Breakfast", "Lunch", "Dinner", "Snack", "Dessert". */
  course?: string
  /** "vegan", "vegetarian", "gluten-free", "dairy-free", "high-protein"... */
  tags?: string[]
}

export type FptTestimonial = { quote: string; name: string; role: string; image?: FptShot }

export type FptIngredient = {
  name: string
  /** For the recipe's base servings. */
  qty: number
  /** "g", "ml", "tbsp", "tsp" or "pc". Grams and millilitres convert to imperial. */
  unit: string
}

export type FptRecipe = {
  name: string
  image: FptShot
  time: number
  kcal: number
  servings: number
  ingredients: FptIngredient[]
  /** Cooking mode. `minutes` adds a timer to the step. */
  steps: { title: string; text: string; minutes?: number }[]
}

export type FptCategory = { name: string; count: number; image: FptShot; href?: string }

export type FptArticle = {
  id: string
  title: string
  kind: "Blog" | "Knowledge" | "Podcasts"
  date: string
  read: string
  image: FptShot
  href?: string
}

export type FptPlanTab = {
  tab: string
  eyebrow: string
  title: string
  text: string
  points: string[]
}

export type FptLink = { label: string; href?: string }

export type FptPalette = { accent: string; soft: string; ink?: string }

export type FptProps = {
  brand?: string
  tagline?: string
  nav?: FptLink[]
  hero?: { title: string; text: string; cta: string; image: FptShot } | null
  features?: { title: string; text: string }[] | null
  planner?: FptPlanTab[] | null
  /** Daily calorie target shown on the planner phone. */
  target?: number
  showcase?: { title: string; text: string } | null
  dishes?: FptDish[]
  bento?: { title: string; text: string } | null
  nutrients?: string[]
  testimonials?: FptTestimonial[]
  cook?: { title: string } | null
  recipe?: FptRecipe
  categories?: { title: string; items: FptCategory[] } | null
  resources?: { title: string; items: FptArticle[] } | null
  cta?: { title: string; text: string; button: string } | null
  footer?: { columns: { title: string; links: FptLink[] }[]; social: FptLink[]; note: string } | null
  palette?: "sage" | "clay" | "ocean" | "plum" | FptPalette
  theme?: "system" | "light" | "dark"
  /** Instrument Serif + Inter from Google Fonts. `null` uses the system stacks. */
  fontHref?: string | null
  /** Links in the download sheet. */
  appStoreHref?: string
  playStoreHref?: string
  onDownload?: () => unknown
  /** Return or resolve `false`, or throw, to show an error. Without it, sending is simulated. */
  onRequestLink?: (email: string) => unknown
  onSave?: (dish: FptDish, saved: boolean) => unknown
  /** A definite floor for the hero. */
  height?: string
  className?: string
}

// #region content
const U = "https://images.unsplash.com/photo-"

const shot = (id: string, alt: string, tone: string, focus?: string): FptShot => ({ src: U + id, alt, tone, focus })

const DEFAULT_DISHES: FptDish[] = [
  { id: "shawarma", name: "Chicken Shawarma Wrap", image: shot("1626700051175-6818013e1d4f", "Two halves of a chicken shawarma wrap with red cabbage", "#c9b48f"), time: 30, kcal: 480, protein: 38, carbs: 44, fat: 16, course: "Lunch", tags: ["high-protein", "dairy-free"] },
  { id: "salmon", name: "Seared Salmon Plate", image: shot("1467003909585-2f8a72700288", "Seared salmon on greens with diced vegetables", "#6b5a3e"), time: 25, kcal: 540, protein: 41, carbs: 22, fat: 30, course: "Dinner", tags: ["high-protein", "gluten-free", "dairy-free"] },
  { id: "farfalle", name: "Pesto Farfalle Salad", image: shot("1473093295043-cdd812d0e601", "Farfalle with pesto, rocket and cherry tomatoes", "#c7cc9a"), time: 20, kcal: 610, protein: 19, carbs: 82, fat: 22, course: "Lunch", tags: ["vegetarian"] },
  { id: "power", name: "Green Power Bowl", image: shot("1512621776951-a57141f2eefd", "A bowl of avocado, chickpeas, tomatoes and greens", "#7c8a4a"), time: 15, kcal: 520, protein: 21, carbs: 58, fat: 24, course: "Lunch", tags: ["vegan", "vegetarian", "gluten-free", "dairy-free"] },
  { id: "steak", name: "Flank Steak & Herb Fries", image: shot("1600891964092-4316c288032e", "Sliced flank steak with herb fries", "#5b4030"), time: 35, kcal: 720, protein: 52, carbs: 54, fat: 31, course: "Dinner", tags: ["high-protein", "gluten-free", "dairy-free"] },
  { id: "toast", name: "Berry French Toast", image: shot("1484723091739-30a097e8f929", "French toast stacked with banana and blueberries", "#4a3a2c"), time: 15, kcal: 460, protein: 17, carbs: 68, fat: 13, course: "Breakfast", tags: ["vegetarian"] },
  { id: "linguine", name: "Garlic Shrimp Linguine", image: shot("1563379926898-05f4575a45d8", "Shrimp linguine with tomatoes and basil in a pan", "#5a3a28"), time: 25, kcal: 650, protein: 36, carbs: 78, fat: 18, course: "Dinner", tags: ["high-protein", "dairy-free"] },
  { id: "meatball", name: "Turkey Meatball Salad", image: shot("1529042410759-befb1204b468", "Turkey meatballs over a green salad", "#5a4a36"), time: 30, kcal: 430, protein: 39, carbs: 16, fat: 22, course: "Dinner", tags: ["high-protein", "gluten-free", "dairy-free"] },
  { id: "chicken", name: "Lemon Herb Chicken", image: shot("1532550907401-a500c9a57435", "Grilled chicken breast with lemon and peppers", "#9a6a3a"), time: 40, kcal: 410, protein: 47, carbs: 9, fat: 19, course: "Dinner", tags: ["high-protein", "gluten-free", "dairy-free"] },
  { id: "curry", name: "Coconut Salmon Curry", image: shot("1574484284002-952d92456975", "Salmon in an orange coconut curry with lemon", "#b0581f"), time: 35, kcal: 590, protein: 37, carbs: 18, fat: 40, course: "Dinner", tags: ["high-protein", "gluten-free", "dairy-free"] },
  { id: "eggtoast", name: "Avocado Egg Toast", image: shot("1525351484163-7529414344d8", "A fried egg on avocado toast", "#cfc6b8"), time: 10, kcal: 390, protein: 18, carbs: 32, fat: 21, course: "Breakfast", tags: ["vegetarian", "dairy-free"] },
  { id: "parfait", name: "Strawberry Yogurt Pots", image: shot("1488477181946-6428a0291777", "Yogurt pots topped with strawberries", "#e9dcd6"), time: 5, kcal: 240, protein: 16, carbs: 30, fat: 6, course: "Snack", tags: ["vegetarian", "gluten-free"] },
]

const DEFAULT_TESTIMONIALS: FptTestimonial[] = [
  { quote: "Delicious recipes and helpful nutritional info, especially important for managing my wife's Type 1 Diabetes.", name: "Daniel R.", role: "Amateur triathlete", image: shot("1500648767791-00dcc994a43e", "Portrait of Daniel", "#8a8f96") },
  { quote: "Fuelplate has been life saving when having to balance grad school, clinicals, AND running races. Truly the best recipes and so delicious!", name: "Mariana", role: "Marathon runner", image: shot("1571008887538-b36bb32f4571", "A runner mid-stride on an empty road", "#8d8f8c") },
  { quote: "I currently work a 9 to 5 commute, and I'm training for a half marathon. With little time to plan, Fuelplate has helped me improve my health, performance, and even cooking abilities.", name: "Samantha", role: "Half-marathon finisher", image: shot("1486218119243-13883505764c", "A runner on a gravel road through green fields", "#7d9a6a") },
]

const DEFAULT_RECIPE: FptRecipe = {
  name: "Tomato Basil Beef Penne",
  image: shot("1621996346565-e3dbc646d9a9", "Penne in a tomato sauce on a white plate", "#c1563a"),
  time: 30,
  kcal: 612,
  servings: 4,
  ingredients: [
    { name: "Lean ground beef", qty: 400, unit: "g" },
    { name: "Penne pasta", qty: 320, unit: "g" },
    { name: "Crushed tomatoes", qty: 480, unit: "ml" },
    { name: "Olive oil", qty: 2, unit: "tbsp" },
    { name: "Garlic cloves", qty: 3, unit: "pc" },
    { name: "Parmesan", qty: 40, unit: "g" },
  ],
  steps: [
    { title: "Boil", text: "Bring a large pot of salted water to the boil and cook the penne until just al dente.", minutes: 9 },
    { title: "Brown", text: "Warm the oil in a wide pan, add the beef and brown it, breaking it up as it cooks.", minutes: 6 },
    { title: "Simmer", text: "Stir in the garlic, then the tomatoes. Simmer until glossy and thick.", minutes: 8 },
    { title: "Toss", text: "Fold the drained pasta through the sauce with a splash of pasta water." },
    { title: "Serve", text: "Finish with parmesan and torn basil. Eat within the hour after training." },
  ],
}

const DEFAULT_CATEGORIES: FptCategory[] = [
  { name: "Breakfast", count: 64, image: shot("1525351484163-7529414344d8", "", "#d8d0c4") },
  { name: "Lunch", count: 88, image: shot("1546069901-ba9599a7e63c", "", "#b7a580") },
  { name: "Dinner", count: 112, image: shot("1504674900247-0877df9cc836", "", "#6b5a44") },
  { name: "Snacks", count: 41, image: shot("1488477181946-6428a0291777", "", "#eadfd9") },
  { name: "Dessert", count: 27, image: shot("1565958011703-44f9829ba187", "", "#a4505a") },
  { name: "Vegetarian", count: 73, image: shot("1540189549336-e6e99c3679fe", "", "#4e5a34") },
  { name: "Dairy-Free", count: 96, image: shot("1511690656952-34342bb7c2f2", "", "#6a6a3e") },
  { name: "Vegan", count: 52, image: shot("1543339308-43e59d6b73a6", "", "#e2ddd2") },
  { name: "Gluten-Free", count: 81, image: shot("1482049016688-2d3e1b311543", "", "#3d3a2e") },
]

const DEFAULT_ARTICLES: FptArticle[] = [
  { id: "a1", title: "Fuelplate is on the App Store", kind: "Blog", date: "2026-02-21", read: "2 min read", image: shot("1528712306091-ed0763094c98", "Hands stirring vegetables in a pan", "#c9c4bb") },
  { id: "a2", title: "Balancing strength and endurance nutrition as a hybrid athlete", kind: "Knowledge", date: "2026-03-14", read: "8 min read", image: shot("1502904550040-7534597429ae", "Runners on a red track seen from above", "#c25b45") },
  { id: "a3", title: "The key to fueling active rest days", kind: "Knowledge", date: "2026-04-02", read: "6 min read", image: shot("1490645935967-10de6ba17061", "A bowl of greens, egg and avocado", "#43586a") },
  { id: "a4", title: "Carb loading without the crash, with sports dietitian Ana Ruiz", kind: "Podcasts", date: "2026-05-09", read: "41 min listen", image: shot("1552674605-db6ffd4facb5", "Three runners silhouetted against a blue sky", "#1e4f8a") },
  { id: "a5", title: "Twelve pantry staples that make race week easy", kind: "Blog", date: "2026-06-18", read: "5 min read", image: shot("1606787366850-de6330128bfc", "A table spread with fruit, grains and vegetables", "#c08a4a") },
  { id: "a6", title: "Cooking for a household of athletes", kind: "Podcasts", date: "2026-07-01", read: "36 min listen", image: shot("1556910103-1c02745aae4d", "Three friends cooking in a bright kitchen", "#9a9a92") },
]

const DEFAULT_PLANNER: FptPlanTab[] = [
  { tab: "Plan your week", eyebrow: "Meal planning", title: "Fuel with precision", text: "Plan your meals, track your macros, and see exactly what you're eating each day. One recipe at a time, your nutrition lines up with your training.", points: ["Track macros day-by-day to hit your targets", "Align your nutrition with your training schedule"] },
  { tab: "Create grocery list", eyebrow: "Grocery lists", title: "Shop in one sweep", text: "Every planned meal rolls into one list, merged and sorted by aisle. Tick things off as you go and never buy a third jar of cumin again.", points: ["Quantities merged across every recipe", "Sorted by aisle, checked off in a tap"] },
  { tab: "Swap recipes", eyebrow: "Smart swaps", title: "Same macros, new flavor", text: "Not feeling salmon tonight? Swap any meal for one with a near-identical macro profile, so the plan holds even when your appetite doesn't.", points: ["Matches ranked by macro similarity", "Your weekly totals stay on target"] },
]

const DEFAULT_NUTRIENTS = ["Vitamin B12", "Omega-3", "Vitamin C", "Iron", "Zinc", "Magnesium", "Omega-6", "Sodium", "Fiber", "Vitamin A", "Calcium", "Vitamin B6", "Potassium", "Lutein", "Phosphorus", "Vitamin D", "Choline", "Folate", "Selenium", "Vitamin K"]

const DEFAULT_PLAN = [
  { day: "Mon", training: "Tempo run, 8 km", meals: ["eggtoast", "power", "salmon"] },
  { day: "Tue", training: "Lower body strength", meals: ["toast", "shawarma", "steak"] },
  { day: "Wed", training: "Easy spin, 45 min", meals: ["parfait", "farfalle", "meatball"] },
  { day: "Thu", training: "Intervals, 6 x 800 m", meals: ["eggtoast", "shawarma", "linguine"] },
  { day: "Fri", training: "Rest day", meals: ["parfait", "power", "chicken"] },
  { day: "Sat", training: "Long run, 18 km", meals: ["toast", "farfalle", "curry"] },
  { day: "Sun", training: "Mobility and swim", meals: ["eggtoast", "meatball", "salmon"] },
]

const DEFAULT_GROCERIES = [
  { aisle: "Produce", items: ["Avocados x3", "Baby spinach, 200 g", "Cherry tomatoes", "Lemons x4", "Red cabbage"] },
  { aisle: "Protein", items: ["Salmon fillets x2", "Chicken thighs, 600 g", "Greek yogurt, 1 kg", "Eggs x12"] },
  { aisle: "Pantry", items: ["Penne, 500 g", "Chickpeas x2", "Whole wheat wraps"] },
]

const DEFAULT_FOOTER = {
  columns: [
    { title: "Categories", links: [{ label: "Breakfast" }, { label: "Lunch" }, { label: "Dinner" }, { label: "Dessert" }, { label: "Snack" }, { label: "View all" }] },
    { title: "Diet", links: [{ label: "Dairy-Free" }, { label: "Gluten-Free" }, { label: "Vegan" }, { label: "Vegetarian" }] },
    { title: "Resources", links: [{ label: "Articles" }, { label: "Knowledge" }, { label: "Podcasts" }] },
    { title: "Company", links: [{ label: "About" }, { label: "Contact" }, { label: "Privacy" }, { label: "Terms" }] },
  ],
  social: [{ label: "Instagram" }, { label: "TikTok" }],
  note: "Recipes reviewed by sports dietitians. Not medical advice.",
}

const PALETTES = {
  sage: { accent: "#2f5b3c", soft: "#d6e5c8", ink: "#1b1d18" },
  clay: { accent: "#9c4528", soft: "#f3d9c8", ink: "#1f1814" },
  ocean: { accent: "#1d4e7a", soft: "#d3e2f3", ink: "#141a22" },
  plum: { accent: "#6a2f5e", soft: "#ecd6e6", ink: "#1e151c" },
}

const DEFAULT_FONT = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap"
// #endregion content

// #region logic
function resolvePalette(p: string | FptPalette | undefined): FptPalette {
  if (p && typeof p === "object") return { ink: "#1b1d18", ...p }
  const table = PALETTES as { [k: string]: FptPalette }
  return table[p || "sage"] || PALETTES.sage
}

/** Unsplash URLs sized for the slot; any other URL passes through. */
function sized(src: string, w: number, h?: number) {
  if (!src.startsWith("https://images.unsplash.com/")) return src
  const base = src.split("?")[0]
  return base + "?auto=format&fit=crop&q=75&w=" + w + (h ? "&h=" + h : "")
}

function srcSet(src: string, max: number) {
  if (!src.startsWith("https://images.unsplash.com/")) return ""
  return [480, 800, 1200, 1800, 2400].filter((w) => w <= max).map((w) => sized(src, w) + " " + w + "w").join(", ")
}

/** Shortest signed distance from `pos` to card `i` on a ring of `n`. */
function wrapOffset(i: number, pos: number, n: number) {
  if (n <= 0) return 0
  let d = (i - pos) % n
  if (d > n / 2) d -= n
  if (d < -n / 2) d += n
  return d
}

function mod(a: number, n: number) {
  return ((a % n) + n) % n
}

/** Where a coverflow card sits `d` steps from the centre. `unit` is the step in px. */
function cardPose(d: number, unit: number, spread = 1) {
  const a = Math.abs(d)
  const near = Math.max(0, 1 - a)
  const scale = 1 + 0.34 * near
  // the centre card is wider, so its neighbours make room for it
  const x = Math.sign(d) * (a * unit + Math.min(a, 1) * unit * 0.2) * spread
  const opacity = a > 3.6 ? 0 : Math.min(1, Math.max(0, 3.6 - a))
  return { x: Math.round(x * 10) / 10, y: Math.round(-18 * near * 10) / 10, scale: Math.round(scale * 1000) / 1000, opacity, zIndex: 100 - Math.round(a * 10) }
}

/** Which planner tab a pinned scroll progress (0..1) lands on. */
function tabAt(progress: number, n: number) {
  if (n <= 1) return 0
  return Math.min(n - 1, Math.max(0, Math.floor(progress * n)))
}

function fold(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

const FILTERS = {
  protein: (d: FptDish) => d.protein >= 30,
  quick: (d: FptDish) => d.time <= 20,
  lowcarb: (d: FptDish) => d.carbs <= 30,
  plant: (d: FptDish) => (d.tags || []).includes("vegetarian"),
}

/** Every word of the query (any order, any case, accents folded) and every active filter. */
function filterDishes(list: FptDish[], query: string, active: string[]) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  const table = FILTERS as { [k: string]: (d: FptDish) => boolean }
  return list.filter((d) => {
    const hay = fold([d.name, d.course || "", ...(d.tags || [])].join(" "))
    return words.every((w) => hay.includes(w)) && active.every((k) => !table[k] || table[k](d))
  })
}

/** Dishes carrying every tag. */
function withTags(list: FptDish[], tags: string[]) {
  return list.filter((d) => tags.every((t) => (d.tags || []).includes(t)))
}

/** 0..100, how close two dishes' macros are, weighted towards protein. */
function macroMatch(a: FptDish, b: FptDish) {
  const rel = (x: number, y: number) => Math.min(1, Math.abs(x - y) / Math.max(x, y, 1))
  const miss = rel(a.kcal, b.kcal) * 0.3 + rel(a.protein, b.protein) * 0.4 + rel(a.carbs, b.carbs) * 0.15 + rel(a.fat, b.fat) * 0.15
  return Math.round((1 - miss) * 100)
}

function swapsFor(current: FptDish, list: FptDish[], count = 3) {
  return list
    .filter((d) => d.id !== current.id)
    .map((d) => ({ dish: d, match: macroMatch(current, d) }))
    .sort((a, b) => b.match - a.match || a.dish.name.localeCompare(b.dish.name))
    .slice(0, count)
}

function dayTotals(ids: string[], list: FptDish[]) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  for (const id of ids) {
    const d = list.find((x) => x.id === id)
    if (!d) continue
    t.kcal += d.kcal
    t.protein += d.protein
    t.carbs += d.carbs
    t.fat += d.fat
  }
  return t
}

const FRACTIONS = ["", "¼", "½", "¾"]

/** 1.5 -> "1½", 0.25 -> "¼", rounded to the nearest quarter. */
function quarter(n: number) {
  const q = Math.round(n * 4)
  const whole = Math.floor(q / 4)
  const frac = FRACTIONS[q % 4]
  if (!whole && !frac) return "0"
  return (whole ? String(whole) : "") + frac
}

function trim(n: number, digits: number) {
  return String(Number(n.toFixed(digits)))
}

/** An ingredient amount for `servings`, in metric or imperial. */
function amount(ing: FptIngredient, base: number, servings: number, system: "metric" | "imperial") {
  const q = (ing.qty * servings) / Math.max(1, base)
  if (ing.unit === "g") {
    if (system === "metric") return q >= 1000 ? trim(q / 1000, 2) + " kg" : Math.round(q) + " g"
    const oz = q / 28.349523125
    return oz >= 16 ? trim(oz / 16, 2) + " lb" : trim(oz, oz < 10 ? 2 : 1) + " oz"
  }
  if (ing.unit === "ml") {
    if (system === "metric") return q >= 1000 ? trim(q / 1000, 2) + " l" : Math.round(q) + " ml"
    const cups = q / 236.5882365
    return cups >= 0.25 ? quarter(cups) + (cups > 1.125 ? " cups" : " cup") : trim(q / 29.5735, 1) + " fl oz"
  }
  if (ing.unit === "pc") return quarter(q)
  return quarter(q) + " " + ing.unit
}

/** A stable, made-up % daily value for a nutrient in a dish (placeholder data). */
function dailyValue(nutrient: string, dishId: string) {
  let h = 2166136261
  for (const ch of nutrient + "/" + dishId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return 12 + (Math.abs(h) % 128)
}

function mmss(sec: number) {
  const s = Math.max(0, Math.round(sec))
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0")
}

function fmtDate(iso: string, locale = "en-US") {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
}

function nextIndex(i: number, key: string, n: number) {
  if (key === "ArrowRight" || key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowLeft" || key === "ArrowUp") return (i - 1 + n) % n
  if (key === "Home") return 0
  if (key === "End") return n - 1
  return -1
}
// #endregion logic

const FPT_CSS = `
.fpt-root{--fpt-bg:#f3f1eb;--fpt-surface:#ebe8df;--fpt-card:#fbfaf6;--fpt-ink:#1b1d18;--fpt-muted:#6a6c63;--fpt-line:rgba(27,29,24,.1);--fpt-peach:#f8e2d1;--fpt-sage:#e0e9d1;--fpt-sky:#dce6f9;--fpt-shadow:0 1px 2px rgba(27,29,24,.06),0 12px 32px -12px rgba(27,29,24,.18);--fpt-serif:"Instrument Serif","Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;--fpt-sans:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;position:relative;min-height:var(--fpt-h);background:var(--fpt-bg);color:var(--fpt-ink);font-family:var(--fpt-sans);font-size:15px;line-height:1.5;overflow-x:clip;-webkit-font-smoothing:antialiased;color-scheme:light}
.fpt-root[data-theme="dark"]{--fpt-bg:#11130f;--fpt-surface:#191c16;--fpt-card:#1f231c;--fpt-ink:#efede4;--fpt-muted:#a4a698;--fpt-line:rgba(239,237,228,.1);--fpt-peach:#33251c;--fpt-sage:#1f2a1b;--fpt-sky:#1a2334;--fpt-shadow:0 1px 2px rgba(0,0,0,.4),0 18px 40px -16px rgba(0,0,0,.6);color-scheme:dark}
.fpt-root *,.fpt-root *::before,.fpt-root *::after{box-sizing:border-box}
.fpt-root :where(svg,img,canvas){display:block;max-width:none}
.fpt-root :where(h1,h2,h3,h4,p,ul,ol,figure,blockquote){margin:0;padding:0}
.fpt-root :where(ul,ol){list-style:none}
.fpt-root :where(button,input){font:inherit;color:inherit}
.fpt-root :where(button){background:none;border:0;padding:0;cursor:pointer}
.fpt-root :where(a){color:inherit;text-decoration:none}
.fpt-root :where(button,a,input,[tabindex]):focus-visible{outline:2px solid var(--fpt-accent);outline-offset:3px;border-radius:999px}
.fpt-serif{font-family:var(--fpt-serif);font-weight:400;letter-spacing:-.01em}
.fpt-h2{font-family:var(--fpt-serif);font-weight:400;font-size:clamp(34px,5vw,58px);line-height:1.02;letter-spacing:-.02em;text-wrap:balance}
.fpt-lede{color:var(--fpt-muted);max-width:44ch;font-size:14px}
.fpt-w{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em}
.fpt-wi{display:inline-block;will-change:transform}
.fpt-wrap{width:min(1180px,100% - 32px);margin-inline:auto}
.fpt-sec{padding-block:clamp(72px,11vw,140px)}
.fpt-center{text-align:center;display:grid;justify-items:center;gap:14px}
.fpt-btn{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 18px 0 14px;border-radius:999px;font-size:13px;font-weight:500;white-space:nowrap;transition:transform .25s cubic-bezier(.2,.8,.2,1),background .25s,box-shadow .25s}
.fpt-btn:hover{transform:translateY(-1px)}
.fpt-btn:active{transform:translateY(0) scale(.97)}
.fpt-btn-accent{background:var(--fpt-accent);color:#fff;box-shadow:0 8px 20px -10px var(--fpt-accent)}
.fpt-btn-light{background:#fff;color:#1b1d18}
.fpt-btn-ghost{background:var(--fpt-card);color:var(--fpt-ink);box-shadow:inset 0 0 0 1px var(--fpt-line)}
.fpt-dot{width:8px;height:8px;border-radius:50%;background:currentColor;opacity:.9}
.fpt-chip{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border-radius:999px;font-size:11.5px;background:var(--fpt-card);box-shadow:inset 0 0 0 1px var(--fpt-line);color:var(--fpt-ink);white-space:nowrap;transition:background .2s,color .2s,box-shadow .2s}
.fpt-chip[aria-pressed="true"]{background:var(--fpt-accent);color:#fff;box-shadow:none}
.fpt-pic{position:relative;overflow:hidden;background:var(--tone,#ccc)}
.fpt-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s ease,transform .8s cubic-bezier(.2,.8,.2,1)}
.fpt-pic[data-state="ok"] img{opacity:1}
.fpt-pic[data-state="failed"] img{display:none}
/* nav */
.fpt-navwrap{position:sticky;top:0;z-index:60;height:0}
.fpt-nav{position:absolute;left:50%;top:14px;transform:translateX(-50%);width:min(1180px,100% - 32px);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;height:52px;padding:0 8px 0 18px;border-radius:999px;color:#fff;transition:width .6s cubic-bezier(.2,.8,.2,1),background .4s,color .4s,box-shadow .4s,backdrop-filter .4s}
.fpt-nav[data-compact="true"]{width:min(860px,100% - 24px);background:color-mix(in srgb,var(--fpt-bg) 78%,transparent);color:var(--fpt-ink);box-shadow:0 0 0 1px var(--fpt-line),0 10px 30px -14px rgba(0,0,0,.25);-webkit-backdrop-filter:blur(16px) saturate(1.4);backdrop-filter:blur(16px) saturate(1.4)}
.fpt-nav-links{display:flex;gap:4px}
.fpt-nav-links a,.fpt-nav-links button{font-size:12.5px;padding:7px 11px;border-radius:999px;opacity:.86;transition:background .2s,opacity .2s}
.fpt-nav-links a:hover,.fpt-nav-links button:hover{opacity:1;background:color-mix(in srgb,currentColor 12%,transparent)}
.fpt-logo{display:flex;align-items:center;gap:7px;font-weight:600;font-size:15px;letter-spacing:-.02em}
.fpt-nav-end{display:flex;justify-content:flex-end;align-items:center;gap:6px}
.fpt-iconbtn{position:relative;display:grid;place-items:center;width:36px;height:36px;border-radius:50%;transition:background .2s}
.fpt-iconbtn:hover{background:color-mix(in srgb,currentColor 12%,transparent)}
.fpt-badge{position:absolute;top:2px;right:0;min-width:16px;height:16px;padding:0 4px;border-radius:99px;background:var(--fpt-accent);color:#fff;font-size:10px;font-weight:600;display:grid;place-items:center}
.fpt-menu-btn{display:none}
.fpt-sheet{position:absolute;top:74px;left:50%;transform:translateX(-50%);width:calc(100% - 24px);padding:10px;border-radius:24px;background:var(--fpt-card);color:var(--fpt-ink);box-shadow:var(--fpt-shadow),0 0 0 1px var(--fpt-line);display:grid;gap:2px;animation:fpt-drop .35s cubic-bezier(.2,.8,.2,1)}
.fpt-sheet a,.fpt-sheet button{padding:12px 14px;border-radius:14px;text-align:left;font-size:15px}
.fpt-sheet a:hover,.fpt-sheet button:hover{background:var(--fpt-surface)}
@keyframes fpt-drop{from{opacity:0;transform:translate(-50%,-8px) scale(.98)}}
/* hero */
.fpt-hero{position:relative;min-height:var(--fpt-h);display:grid}
.fpt-hero-frame{position:absolute;inset:0;overflow:hidden;background:#3a3026;will-change:clip-path}
.fpt-hero-img{position:absolute;inset:-6% 0 0 0}
.fpt-hero-img .fpt-pic{position:absolute;inset:0}
.fpt-hero-frame::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,14,10,.42) 0%,rgba(18,14,10,.08) 30%,rgba(18,14,10,.18) 55%,rgba(18,14,10,.72) 100%)}
.fpt-hero-copy{position:relative;z-index:2;align-self:end;justify-self:center;text-align:center;color:#fff;padding:0 16px clamp(56px,9vh,96px);display:grid;justify-items:center;gap:16px}
.fpt-hero h1{font-family:var(--fpt-serif);font-weight:400;font-size:clamp(44px,7.4vw,92px);line-height:.98;letter-spacing:-.025em;text-shadow:0 2px 30px rgba(0,0,0,.25)}
.fpt-hero p{max-width:46ch;font-size:14px;opacity:.86}
.fpt-plate{position:absolute;z-index:3;right:max(24px,6vw);top:28%;width:210px;padding:10px;border-radius:22px;color:#1b1d18;background:rgba(255,255,255,.72);-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5);box-shadow:0 20px 50px -20px rgba(0,0,0,.5);display:grid;gap:8px}
.fpt-plate .fpt-pic{height:96px;border-radius:14px}
.fpt-plate b{font-size:12.5px;font-weight:600}
.fpt-plate small{font-size:10.5px;color:#55574f}
.fpt-plate-bars{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:9.5px;color:#55574f}
.fpt-bar{height:4px;border-radius:9px;background:rgba(27,29,24,.1);overflow:hidden;margin-top:3px}
.fpt-bar i{display:block;height:100%;border-radius:inherit;background:var(--fpt-accent);transform-origin:left}
.fpt-scrollcue{position:absolute;z-index:3;left:50%;bottom:20px;transform:translateX(-50%);width:22px;height:34px;border-radius:99px;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.6)}
.fpt-scrollcue::after{content:"";position:absolute;left:50%;top:7px;width:3px;height:7px;margin-left:-1.5px;border-radius:9px;background:#fff;animation:fpt-cue 1.8s ease-in-out infinite}
@keyframes fpt-cue{0%{opacity:0;transform:translateY(0)}30%{opacity:1}100%{opacity:0;transform:translateY(12px)}}
/* features */
.fpt-feats{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(20px,4vw,56px);padding-block:clamp(64px,9vw,110px) clamp(40px,6vw,70px)}
.fpt-feat{display:grid;justify-items:center;text-align:center;gap:10px}
.fpt-feat-art{position:relative;width:150px;height:112px;display:grid;place-items:center}
.fpt-feat-art svg{transition:transform .6s cubic-bezier(.2,.8,.2,1)}
.fpt-feat:hover .fpt-feat-art svg{transform:translateY(-6px) rotate(-4deg) scale(1.04)}
.fpt-feat h3{font-size:14px;font-weight:600}
.fpt-feat p{font-size:12.5px;color:var(--fpt-muted);max-width:30ch}
.fpt-tag{position:absolute;font-size:9.5px;font-weight:500;padding:3px 8px;border-radius:99px;background:var(--fpt-card);box-shadow:var(--fpt-shadow);white-space:nowrap}
/* planner */
.fpt-plan-outer{padding-inline:clamp(8px,1.4vw,18px)}
.fpt-plan{position:relative;border-radius:clamp(24px,3vw,40px);background:var(--fpt-surface);min-height:min(800px,calc(100svh - 88px));display:grid;align-content:center;padding:clamp(28px,4vw,48px) 0;overflow:hidden}
.fpt-tabs{position:relative;justify-self:center;display:inline-flex;gap:2px;padding:4px;border-radius:999px;background:var(--fpt-card);box-shadow:inset 0 0 0 1px var(--fpt-line);margin-bottom:clamp(24px,4vw,44px);max-width:calc(100% - 24px);overflow-x:auto;scrollbar-width:none}
.fpt-tab{position:relative;z-index:1;height:32px;padding:0 14px;border-radius:999px;font-size:12px;color:var(--fpt-muted);white-space:nowrap;transition:color .3s}
.fpt-tab[aria-selected="true"]{color:#fff}
.fpt-tab-ind{position:absolute;z-index:0;top:4px;height:32px;border-radius:999px;background:var(--fpt-accent);transition:left .5s cubic-bezier(.2,.8,.2,1),width .5s cubic-bezier(.2,.8,.2,1);overflow:hidden}
.fpt-tab-ind i{position:absolute;inset:0;background:rgba(255,255,255,.18);transform-origin:left;transform:scaleX(var(--fpt-tp,0))}
.fpt-plan-grid{display:grid;grid-template-columns:1fr auto;align-items:center;gap:clamp(24px,6vw,96px);padding-inline:clamp(20px,6vw,96px)}
.fpt-plan-copy{position:relative;display:grid}
.fpt-plan-pane{grid-area:1 / 1;display:grid;align-content:center;gap:14px;transition:opacity .5s,transform .6s cubic-bezier(.2,.8,.2,1),filter .5s}
.fpt-plan-pane[data-on="false"]{opacity:0;transform:translateY(18px);filter:blur(6px);pointer-events:none}
.fpt-eyebrow{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--fpt-muted)}
.fpt-eyebrow i{width:3px;height:12px;border-radius:2px;background:var(--fpt-accent)}
.fpt-plan-copy h3{font-family:var(--fpt-serif);font-weight:400;font-size:clamp(32px,4vw,46px);line-height:1;letter-spacing:-.02em}
.fpt-plan-copy p{color:var(--fpt-muted);max-width:40ch;font-size:13.5px}
.fpt-points{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px;max-width:440px}
.fpt-points li{display:grid;gap:8px;font-size:12.5px}
.fpt-points svg{color:var(--fpt-accent)}
.fpt-plan-progress{display:flex;gap:6px;margin-top:10px}
.fpt-plan-progress span{height:3px;width:28px;border-radius:9px;background:var(--fpt-line);overflow:hidden}
.fpt-plan-progress span i{display:block;height:100%;background:var(--fpt-accent);transform-origin:left;transition:transform .3s}
/* phone */
.fpt-phone{position:relative;width:286px;height:584px;flex:none;border-radius:50px;padding:10px;background:linear-gradient(145deg,#2b2d2a,#0d0e0c);box-shadow:inset 0 0 0 1.5px #4a4c48,0 40px 80px -30px rgba(20,20,10,.55),0 10px 24px -12px rgba(0,0,0,.35)}
.fpt-phone::before{content:"";position:absolute;left:50%;top:20px;width:86px;height:24px;margin-left:-43px;border-radius:99px;background:#000;z-index:5}
.fpt-screen{position:relative;height:100%;border-radius:41px;overflow:hidden;background:#fbfaf6;color:#1b1d18;font-size:11px}
.fpt-root[data-theme="dark"] .fpt-screen{background:#181b15;color:#efede4}
.fpt-status{display:flex;justify-content:space-between;padding:16px 26px 0;font-size:11px;font-weight:600;height:44px}
.fpt-scr{position:absolute;inset:44px 0 0;padding:6px 14px 14px;display:grid;align-content:start;gap:10px;transition:opacity .45s,transform .6s cubic-bezier(.2,.8,.2,1),filter .45s}
.fpt-scr[data-on="false"]{opacity:0;transform:scale(.94) translateY(16px);filter:blur(4px);pointer-events:none;visibility:hidden;transition:opacity .45s,transform .6s cubic-bezier(.2,.8,.2,1),filter .45s,visibility 0s .6s}
.fpt-scr h4{font-size:17px;font-weight:600;letter-spacing:-.02em}
.fpt-days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.fpt-day{display:grid;justify-items:center;gap:1px;padding:6px 0;border-radius:12px;font-size:9.5px;color:inherit;opacity:.7;transition:background .25s,color .25s,opacity .25s}
.fpt-day b{font-size:12px}
.fpt-day[aria-pressed="true"]{background:var(--fpt-accent);color:#fff;opacity:1}
.fpt-ring-row{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;padding:10px;border-radius:16px;background:var(--fpt-surface)}
.fpt-ring circle{transition:stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)}
.fpt-macros{display:grid;gap:5px;font-size:9.5px}
.fpt-macros .fpt-bar i{transition:transform .8s cubic-bezier(.2,.8,.2,1)}
.fpt-meal{display:grid;grid-template-columns:44px 1fr auto;gap:9px;align-items:center;padding:6px;border-radius:14px;background:var(--fpt-card);box-shadow:inset 0 0 0 1px var(--fpt-line)}
.fpt-meal .fpt-pic{width:44px;height:44px;border-radius:10px}
.fpt-meal small,.fpt-sub{font-size:9.5px;color:var(--fpt-muted)}
.fpt-train{display:flex;align-items:center;gap:6px;font-size:10px;padding:7px 10px;border-radius:12px;background:var(--fpt-soft-c);color:var(--fpt-ink)}
.fpt-check{display:flex;align-items:center;gap:9px;width:100%;padding:7px 2px;border-bottom:1px solid var(--fpt-line);text-align:left;font-size:11px}
.fpt-box{flex:none;width:17px;height:17px;border-radius:6px;box-shadow:inset 0 0 0 1.5px var(--fpt-line);display:grid;place-items:center;color:#fff;transition:background .25s,box-shadow .25s}
.fpt-check[aria-pressed="true"] .fpt-box{background:var(--fpt-accent);box-shadow:none}
.fpt-check[aria-pressed="true"] span{text-decoration:line-through;opacity:.5}
.fpt-box svg{transform:scale(0);transition:transform .3s cubic-bezier(.3,1.6,.5,1)}
.fpt-check[aria-pressed="true"] .fpt-box svg{transform:scale(1)}
.fpt-aisle{font-size:9.5px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--fpt-muted);margin-top:4px}
.fpt-swap-card{position:relative;border-radius:18px;overflow:hidden;background:var(--fpt-card);box-shadow:inset 0 0 0 1px var(--fpt-line)}
.fpt-swap-card .fpt-pic{height:150px}
.fpt-swap-body{padding:10px 12px;display:grid;gap:6px}
.fpt-macro-row{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;text-align:center;font-size:9px;color:var(--fpt-muted)}
.fpt-macro-row b{display:block;font-size:12px;color:var(--fpt-ink)}
.fpt-alt{display:grid;grid-template-columns:34px 1fr auto;gap:8px;align-items:center;width:100%;padding:5px;border-radius:12px;text-align:left;transition:background .2s}
.fpt-alt:hover{background:var(--fpt-surface)}
.fpt-alt .fpt-pic{width:34px;height:34px;border-radius:9px}
.fpt-match{font-size:9.5px;font-weight:600;color:var(--fpt-accent)}
.fpt-root[data-theme="dark"] .fpt-match{color:color-mix(in srgb,var(--fpt-accent) 40%,#fff)}
.fpt-tabbar{position:absolute;left:12px;right:12px;bottom:12px;height:46px;border-radius:99px;background:var(--fpt-card);box-shadow:0 6px 20px -8px rgba(0,0,0,.2),inset 0 0 0 1px var(--fpt-line);display:flex;justify-content:space-around;align-items:center;color:var(--fpt-muted)}
.fpt-tabbar span[data-on="true"]{color:var(--fpt-accent)}
@media (min-width:961px) and (max-height:860px){.fpt-plan .fpt-phone{scale:.84;margin-block:-46px}.fpt-tabs{margin-bottom:16px}}
/* showcase */
.fpt-flow{position:relative;height:clamp(330px,40vw,420px);margin-top:clamp(28px,5vw,56px);touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none;outline:none}
.fpt-flow:active{cursor:grabbing}
.fpt-card{position:absolute;left:50%;top:50%;width:var(--fpt-cw);height:calc(var(--fpt-cw) * 1.16);margin:calc(var(--fpt-cw) * -0.58) 0 0 calc(var(--fpt-cw) * -0.5);border-radius:18px;overflow:hidden;will-change:transform;box-shadow:0 18px 36px -22px rgba(30,25,10,.55)}
.fpt-card .fpt-pic{position:absolute;inset:0}
.fpt-card[data-center="true"]{box-shadow:0 30px 60px -26px rgba(30,25,10,.7)}
.fpt-card::after{content:"";position:absolute;inset:0;background:var(--fpt-bg);opacity:var(--fpt-fade,0);pointer-events:none}
.fpt-heart{position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.86);color:#1b1d18;transform:scale(0);transition:transform .35s cubic-bezier(.3,1.6,.5,1)}
.fpt-card[data-center="true"] .fpt-heart{transform:scale(1)}
.fpt-heart[aria-pressed="true"]{color:#d4413a}
.fpt-heart[aria-pressed="true"] svg{animation:fpt-pop .45s cubic-bezier(.3,1.6,.5,1)}
@keyframes fpt-pop{0%{transform:scale(.6)}60%{transform:scale(1.25)}100%{transform:scale(1)}}
.fpt-caption{display:grid;justify-items:center;gap:8px;margin-top:22px;min-height:64px}
.fpt-caption h3{font-size:15px;font-weight:500;animation:fpt-cap .5s cubic-bezier(.2,.8,.2,1)}
.fpt-caption div{display:flex;gap:6px;animation:fpt-cap .5s .05s cubic-bezier(.2,.8,.2,1) backwards}
@keyframes fpt-cap{from{opacity:0;transform:translateY(8px)}}
.fpt-pager{display:flex;justify-content:center;align-items:center;gap:10px;margin-top:18px}
.fpt-pager-dots{display:flex;align-items:center;gap:5px;padding:8px 10px;border-radius:99px;background:var(--fpt-surface)}
.fpt-pd{position:relative;width:6px;height:6px;border-radius:99px;background:color-mix(in srgb,var(--fpt-ink) 22%,transparent);overflow:hidden;transition:width .45s cubic-bezier(.2,.8,.2,1)}
.fpt-pd[aria-current="true"]{width:26px}
.fpt-pd[aria-current="true"] i{position:absolute;inset:0;background:var(--fpt-ink);transform-origin:left;animation:fpt-fill var(--fpt-dur,5s) linear forwards}
.fpt-pager[data-paused="true"] .fpt-pd i{animation-play-state:paused}
@keyframes fpt-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.fpt-round{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--fpt-surface);transition:background .2s,transform .2s}
.fpt-round:hover{background:var(--fpt-line);transform:scale(1.06)}
/* bento */
.fpt-bento-head{display:flex;justify-content:space-between;align-items:end;gap:24px;flex-wrap:wrap;margin-bottom:clamp(24px,4vw,40px)}
.fpt-bento{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.fpt-tile{position:relative;min-width:0;border-radius:22px;background:var(--fpt-surface);padding:18px;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr);align-content:space-between;gap:14px;min-height:300px}
.fpt-tile-t{font-size:12.5px;color:var(--fpt-muted);max-width:38ch}
.fpt-tile-t b{color:var(--fpt-ink);font-weight:600}
.fpt-wide{grid-column:span 2}
.fpt-search{display:flex;align-items:center;gap:8px;height:38px;padding:0 12px;border-radius:12px;background:var(--fpt-card);box-shadow:inset 0 0 0 1px var(--fpt-line);color:var(--fpt-muted)}
.fpt-search input{flex:1;min-width:0;border:0;background:none;outline:none;font-size:13px;color:var(--fpt-ink)}
.fpt-filters{display:flex;flex-wrap:wrap;gap:5px}
.fpt-results{display:grid;gap:6px;height:154px;overflow-y:auto;scrollbar-width:thin;align-content:start}
.fpt-result{display:grid;grid-template-columns:40px 1fr auto;gap:10px;align-items:center;padding:5px;border-radius:12px;background:var(--fpt-card);animation:fpt-cap .4s cubic-bezier(.2,.8,.2,1) backwards}
.fpt-result .fpt-pic{width:40px;height:40px;border-radius:9px}
.fpt-result b{font-size:12px;font-weight:500;display:block}
.fpt-empty{display:grid;place-items:center;height:100%;font-size:12px;color:var(--fpt-muted);text-align:center}
.fpt-marquee{display:grid;gap:7px;mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);margin-inline:-18px}
.fpt-mrow{display:flex;gap:6px;width:max-content;animation:fpt-mq 38s linear infinite}
.fpt-mrow[data-rev="true"]{animation-direction:reverse;animation-duration:44s}
.fpt-marquee:hover .fpt-mrow,.fpt-marquee:focus-within .fpt-mrow{animation-play-state:paused}
@keyframes fpt-mq{to{transform:translateX(-50%)}}
.fpt-nutri{display:grid;gap:8px;padding:12px;border-radius:14px;background:var(--fpt-card)}
.fpt-nutri-row{display:grid;grid-template-columns:84px 1fr 38px;gap:10px;align-items:center;font-size:11.5px;animation:fpt-cap .4s cubic-bezier(.2,.8,.2,1)}
.fpt-nutri-row .fpt-bar{height:6px;margin:0}
.fpt-nutri-row .fpt-bar i{transition:transform .6s cubic-bezier(.2,.8,.2,1)}
.fpt-nutri-row b{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}
.fpt-quote{font-family:var(--fpt-serif);font-size:clamp(20px,2.1vw,25px);line-height:1.18;letter-spacing:-.01em}
.fpt-who{display:flex;align-items:center;gap:10px;font-size:11.5px}
.fpt-who .fpt-pic{width:34px;height:34px;border-radius:50%}
.fpt-who small{display:block;color:var(--fpt-muted);font-size:10.5px}
.fpt-peach{background:var(--fpt-peach)}
.fpt-sage{background:var(--fpt-sage)}
.fpt-sky{background:var(--fpt-sky)}
.fpt-story{grid-template-columns:minmax(150px,240px) 1fr;align-items:center;align-content:center;gap:clamp(16px,3vw,36px)}
.fpt-story .fpt-pic{height:100%;min-height:200px;border-radius:16px}
.fpt-diets{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fpt-diet{position:relative;display:grid;justify-items:center;gap:6px;padding:12px 6px 10px;border-radius:16px;background:var(--fpt-card);font-size:11.5px;transition:box-shadow .25s,transform .25s}
.fpt-diet .fpt-pic{width:54px;height:54px;border-radius:50%;transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.fpt-diet:hover .fpt-pic{transform:rotate(-14deg) scale(1.05)}
.fpt-diet[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--fpt-accent)}
.fpt-diet em{position:absolute;top:7px;right:7px;width:16px;height:16px;border-radius:50%;background:var(--fpt-accent);color:#fff;display:grid;place-items:center;transform:scale(0);transition:transform .3s cubic-bezier(.3,1.6,.5,1)}
.fpt-diet[aria-pressed="true"] em{transform:scale(1)}
/* cook */
.fpt-cook{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:clamp(28px,4vw,44px)}
.fpt-cook-phone{grid-row:span 2;display:grid;justify-items:center;align-content:space-between;gap:18px;padding:28px 18px 18px;min-height:0}
.fpt-cook-phone .fpt-phone{width:250px;height:510px}
.fpt-step-list{display:grid;gap:4px}
.fpt-step{display:grid;grid-template-columns:20px 1fr;gap:8px;align-items:start;padding:7px 8px;border-radius:12px;text-align:left;width:100%;transition:background .3s,opacity .3s}
.fpt-step[aria-current="step"]{background:var(--fpt-surface)}
.fpt-step[data-done="true"]{opacity:.45}
.fpt-step i{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:9.5px;font-weight:600;box-shadow:inset 0 0 0 1.5px var(--fpt-line)}
.fpt-step[aria-current="step"] i,.fpt-step[data-done="true"] i{background:var(--fpt-accent);color:#fff;box-shadow:none}
.fpt-step b{font-size:11px}
.fpt-step p{font-size:9.5px;color:var(--fpt-muted);line-height:1.4}
.fpt-timer{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 8px 8px 12px;border-radius:14px;background:var(--fpt-accent);color:#fff}
.fpt-timer b{font-variant-numeric:tabular-nums;font-size:18px;font-weight:600;letter-spacing:-.02em}
.fpt-timer button{height:28px;padding:0 12px;border-radius:99px;background:rgba(255,255,255,.2);font-size:10.5px;font-weight:600}
.fpt-stepnav{display:flex;gap:6px}
.fpt-stepnav button{flex:1;height:34px;border-radius:99px;font-size:11px;font-weight:600;background:var(--fpt-surface)}
.fpt-stepnav button:last-child{background:var(--fpt-ink);color:var(--fpt-bg)}
.fpt-stepnav button:disabled{opacity:.4;cursor:default}
.fpt-recipe{justify-items:center;text-align:center;align-content:center}
.fpt-recipe .fpt-pic{width:92px;height:92px;border-radius:50%;box-shadow:0 14px 26px -14px rgba(0,0,0,.6)}
.fpt-stepper{display:inline-grid;grid-template-columns:34px 54px 34px;align-items:center;justify-items:center;padding:4px;border-radius:16px;background:var(--fpt-card)}
.fpt-stepper output{display:grid;justify-items:center;line-height:1.1}
.fpt-stepper output b{font-size:22px;font-weight:500;font-variant-numeric:tabular-nums}
.fpt-stepper output small{font-size:9.5px;color:var(--fpt-muted)}
.fpt-switch{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:500}
.fpt-switch button{position:relative;width:46px;height:26px;border-radius:99px;background:var(--fpt-accent)}
.fpt-switch button i{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .4s cubic-bezier(.3,1.4,.5,1)}
.fpt-switch button[aria-checked="true"] i{transform:translateX(20px)}
.fpt-switch span{opacity:.5;transition:opacity .3s}
.fpt-switch span[data-on="true"]{opacity:1}
.fpt-ings{width:100%;display:grid;gap:4px}
.fpt-ing{display:flex;justify-content:space-between;gap:12px;padding:9px 12px;border-radius:12px;background:var(--fpt-card);font-size:12px}
.fpt-ing b{font-weight:600;font-variant-numeric:tabular-nums}
.fpt-ing b[data-tick]{animation:fpt-tick .45s cubic-bezier(.2,.8,.2,1)}
@keyframes fpt-tick{from{opacity:0;transform:translateY(-6px)}}
.fpt-cook .fpt-wide2{grid-column:1 / -1}
/* categories */
.fpt-cats{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:clamp(28px,4vw,48px)}
.fpt-cat{position:relative;flex:0 0 calc((100% - 48px) / 5);aspect-ratio:1 / 1.02;border-radius:20px;background:var(--fpt-surface);display:grid;place-items:center;overflow:hidden;transition:background .35s}
.fpt-cat:hover{background:var(--fpt-sage)}
.fpt-cat-spin{display:grid;place-items:center;width:62%;aspect-ratio:1}
.fpt-cat .fpt-pic{width:100%;aspect-ratio:1;border-radius:50%;box-shadow:0 18px 30px -16px rgba(40,30,10,.6),inset 0 0 0 4px rgba(255,255,255,.9);transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.fpt-cat:hover .fpt-pic{transform:rotate(28deg) scale(1.07) translateY(-6px)}
.fpt-cat-l{position:absolute;left:12px;right:12px;bottom:10px;display:flex;justify-content:space-between;align-items:center;font-size:12px}
.fpt-cat-l small{font-size:10.5px;color:var(--fpt-muted);opacity:0;transform:translateX(-6px);transition:opacity .3s,transform .3s}
.fpt-cat:hover .fpt-cat-l small,.fpt-cat:focus-visible .fpt-cat-l small{opacity:1;transform:none}
/* resources */
.fpt-res{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(24px,6vw,80px);align-items:start}
.fpt-articles{display:grid;gap:4px;min-height:272px;align-content:start}
.fpt-article{display:grid;grid-template-columns:96px 1fr auto;gap:14px;align-items:center;padding:6px;border-radius:16px;transition:background .3s;animation:fpt-cap .45s cubic-bezier(.2,.8,.2,1) backwards}
.fpt-article:hover{background:var(--fpt-surface)}
.fpt-article .fpt-pic{height:64px;border-radius:10px}
.fpt-article:hover img{transform:scale(1.08)}
.fpt-article b{font-size:13px;font-weight:500;display:block;line-height:1.3}
.fpt-article small{font-size:10.5px;color:var(--fpt-muted)}
.fpt-article svg{opacity:0;transform:translateX(-6px);transition:opacity .3s,transform .3s}
.fpt-article:hover svg{opacity:1;transform:none}
.fpt-kinds{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}
.fpt-kind{display:grid;gap:2px;padding:12px;border-radius:14px;text-align:left;font-size:12.5px;font-weight:500;transition:transform .3s,box-shadow .3s}
.fpt-kind small{font-weight:400;font-size:10.5px;color:var(--fpt-muted)}
.fpt-kind:hover{transform:translateY(-2px)}
.fpt-kind[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--fpt-ink)}
.fpt-alltab{font-size:12px;color:var(--fpt-muted);margin-top:10px;text-decoration:underline;text-underline-offset:3px}
/* cta */
.fpt-cta{position:relative;text-align:center;display:grid;justify-items:center;gap:18px;padding-block:clamp(110px,15vw,190px)}
.fpt-cta .fpt-h2 .fpt-wi{color:color-mix(in srgb,var(--fpt-ink) var(--fpt-lit,100%),transparent)}
.fpt-orbit{position:absolute;border-radius:50%;box-shadow:0 20px 40px -18px rgba(40,30,10,.55),inset 0 0 0 3px rgba(255,255,255,.85);pointer-events:none}
/* footer */
.fpt-foot{margin:0 auto clamp(12px,2vw,24px);width:min(1180px,100% - 24px);border-radius:28px;background:var(--fpt-surface);padding:clamp(28px,4vw,44px)}
.fpt-foot-top{display:grid;grid-template-columns:1.2fr repeat(4,1fr);gap:24px}
.fpt-foot h4{font-size:11px;font-weight:500;color:var(--fpt-muted);margin-bottom:10px}
.fpt-foot li a,.fpt-foot li button{display:inline-block;font-size:12.5px;padding:3px 0;transition:opacity .2s,transform .2s}
.fpt-foot li a:hover,.fpt-foot li button:hover{opacity:.6;transform:translateX(2px)}
.fpt-foot-bot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;margin-top:clamp(40px,7vw,90px);font-size:11px;color:var(--fpt-muted)}
.fpt-foot-bot div{display:flex;gap:14px;align-items:center}
.fpt-foot-word{font-family:var(--fpt-serif);font-size:clamp(64px,15vw,200px);line-height:.8;letter-spacing:-.04em;margin-top:clamp(28px,5vw,60px);color:color-mix(in srgb,var(--fpt-ink) 9%,transparent);user-select:none;white-space:nowrap;overflow:hidden}
/* download sheet */
.fpt-modal{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:16px;background:rgba(12,12,8,.42);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:fpt-fade .3s ease}
@keyframes fpt-fade{from{opacity:0}}
.fpt-dialog{position:relative;width:min(400px,100%);border-radius:28px;background:var(--fpt-bg);color:var(--fpt-ink);padding:26px;display:grid;gap:14px;box-shadow:0 40px 90px -30px rgba(0,0,0,.6);animation:fpt-rise .5s cubic-bezier(.2,.8,.2,1)}
@keyframes fpt-rise{from{opacity:0;transform:translateY(24px) scale(.96)}}
.fpt-dialog h3{font-family:var(--fpt-serif);font-weight:400;font-size:34px;line-height:1}
.fpt-dialog p{font-size:13px;color:var(--fpt-muted)}
.fpt-stores{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fpt-store{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:14px;background:var(--fpt-ink);color:var(--fpt-bg);font-size:12.5px;font-weight:600;line-height:1.1}
.fpt-store small{display:block;font-size:9.5px;font-weight:400;opacity:.7}
.fpt-form{display:flex;gap:6px;padding:4px;border-radius:99px;background:var(--fpt-card);box-shadow:inset 0 0 0 1px var(--fpt-line)}
.fpt-form input{flex:1;min-width:0;border:0;background:none;outline:none;padding:0 12px;font-size:13px}
.fpt-note{font-size:11.5px;min-height:18px;color:var(--fpt-muted)}
.fpt-note[data-tone="ok"]{color:var(--fpt-accent)}
.fpt-root[data-theme="dark"] .fpt-note[data-tone="ok"]{color:color-mix(in srgb,var(--fpt-accent) 40%,#fff)}
.fpt-note[data-tone="err"]{color:#c2412d}
.fpt-x{position:absolute;top:14px;right:14px}
.fpt-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
/* responsive */
@media (max-width:960px){
.fpt-plan-grid{grid-template-columns:1fr;justify-items:center;text-align:left}
.fpt-plan-copy{width:100%;max-width:520px}
.fpt-bento{grid-template-columns:repeat(2,minmax(0,1fr))}
.fpt-wide{grid-column:1 / -1}
.fpt-cat{flex-basis:calc((100% - 24px) / 3)}
.fpt-res{grid-template-columns:1fr}
.fpt-foot-top{grid-template-columns:repeat(2,1fr)}
.fpt-foot-top>div:first-child{grid-column:1 / -1}
.fpt-plate{display:none}
}
@media (max-width:720px){
.fpt-nav{grid-template-columns:auto 1fr auto;padding-left:16px}
.fpt-nav-links{display:none}
.fpt-menu-btn{display:grid}
.fpt-logo{grid-column:1;grid-row:1}
.fpt-nav-end{grid-column:3}
.fpt-nav-end .fpt-btn{display:none}
.fpt-feats{grid-template-columns:1fr;gap:40px}
.fpt-bento,.fpt-cook{grid-template-columns:minmax(0,1fr)}
.fpt-cook-phone{grid-row:auto}
.fpt-story{grid-template-columns:1fr}
.fpt-story .fpt-pic{min-height:220px}
.fpt-cat{flex-basis:calc((100% - 12px) / 2)}
.fpt-kinds{grid-template-columns:1fr 1fr 1fr}
.fpt-article{grid-template-columns:76px 1fr}
.fpt-article svg{display:none}
.fpt-points{grid-template-columns:1fr}
.fpt-orbit{width:68px !important;height:68px !important}
.fpt-orbit:nth-child(1),.fpt-orbit:nth-child(2){top:5% !important;bottom:auto !important}
.fpt-orbit:nth-child(3),.fpt-orbit:nth-child(4){bottom:3% !important;top:auto !important}
.fpt-phone{transform:scale(.92);transform-origin:top center;margin-bottom:-46px}
}
@media (prefers-reduced-motion:reduce){
.fpt-root *,.fpt-root *::before,.fpt-root *::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}
.fpt-mrow{animation:none !important;flex-wrap:wrap;width:auto}
.fpt-scrollcue{display:none}
}
`

/* ---------- small pieces ---------- */

function useIsoLayout(fn: () => void | (() => void), deps: unknown[]) {
  const hook = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  hook(fn, deps)
}

function prefersReduced() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
}

function useTheme(pref: "system" | "light" | "dark") {
  const [dark, setDark] = React.useState(pref === "dark")
  React.useEffect(() => {
    if (pref !== "system") {
      setDark(pref === "dark")
      return
    }
    const mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null
    const read = () => {
      const el = document.documentElement
      if (el.classList.contains("dark")) return setDark(true)
      if (el.classList.contains("light")) return setDark(false)
      setDark(!!(mq && mq.matches))
    }
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    if (mq) mq.addEventListener("change", read)
    return () => {
      mo.disconnect()
      if (mq) mq.removeEventListener("change", read)
    }
  }, [pref])
  return [dark, setDark] as const
}

function Pic({ shot: s, w, h, eager, className, style }: { shot: FptShot; w: number; h?: number; eager?: boolean; className?: string; style?: React.CSSProperties }) {
  const [state, setState] = React.useState("loading")
  const ref = React.useRef(null as HTMLImageElement | null)
  React.useEffect(() => {
    const img = ref.current
    if (img && img.complete && img.naturalWidth) setState("ok")
  }, [s.src])
  const set = h ? undefined : srcSet(s.src, w * 2) || undefined
  return (
    <div className={"fpt-pic " + (className || "")} data-state={state} style={{ ["--tone" as string]: s.tone || "#cbc6b9", ...style }}>
      <img
        ref={ref}
        src={sized(s.src, w, h)}
        srcSet={set}
        sizes={set ? w + "px" : undefined}
        alt={s.alt || ""}
        aria-hidden={s.alt ? undefined : true}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onLoad={() => setState("ok")}
        onError={() => setState("failed")}
        style={{ maxWidth: "none", objectPosition: s.focus }}
      />
    </div>
  )
}

/** Each word in its own mask, so GSAP can raise them one at a time. */
function Words({ text }: { text: string }) {
  const lines = text.split("\n")
  return (
    <>
      {lines.map((line, li) => (
        <React.Fragment key={li}>
          {li > 0 && <br />}
          {line.split(" ").map((w, wi) => (
            <React.Fragment key={wi}>
              {wi > 0 && " "}
              <span className="fpt-w">
                <span className="fpt-wi">{w}</span>
              </span>
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </>
  )
}

type IconName = "arrow" | "left" | "right" | "heart" | "search" | "x" | "check" | "menu" | "moon" | "sun" | "bag" | "clock" | "flame" | "minus" | "plus" | "play" | "pause" | "chart" | "calendar" | "swap" | "home" | "book" | "user" | "bolt" | "leaf" | "phone"

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }
  switch (name) {
    case "arrow": return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    case "left": return <svg {...p}><path d="M15 6l-6 6 6 6" /></svg>
    case "right": return <svg {...p}><path d="M9 6l6 6-6 6" /></svg>
    case "heart": return <svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
    case "search": return <svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
    case "x": return <svg {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case "check": return <svg {...p} strokeWidth={2.6}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    case "menu": return <svg {...p}><path d="M4 8h16M4 16h16" /></svg>
    case "moon": return <svg {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
    case "sun": return <svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    case "bag": return <svg {...p}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
    case "flame": return <svg {...p}><path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.6-5.3 3.9-8.3 1 1.9 1.6 2.6 2.6 3.3.4-2.2 1.3-4.1 2.6-5.8.6 3.3 3.9 5.6 3.9 10.2 0 4-2.6 6.8-6.5 6.8z" /></svg>
    case "minus": return <svg {...p}><path d="M6 12h12" /></svg>
    case "plus": return <svg {...p}><path d="M12 6v12M6 12h12" /></svg>
    case "play": return <svg {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5z" /></svg>
    case "pause": return <svg {...p} fill="currentColor" stroke="none"><rect x="6.5" y="5" width="4" height="14" rx="1.2" /><rect x="13.5" y="5" width="4" height="14" rx="1.2" /></svg>
    case "chart": return <svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
    case "calendar": return <svg {...p}><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
    case "swap": return <svg {...p}><path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" /></svg>
    case "home": return <svg {...p}><path d="M4 11l8-7 8 7v9H4z" /></svg>
    case "book": return <svg {...p}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></svg>
    case "user": return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
    case "bolt": return <svg {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
    case "leaf": return <svg {...p}><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" /><path d="M5 19c3-4 6-6 10-8" /></svg>
    case "phone": return <svg {...p}><rect x="6.5" y="2.5" width="11" height="19" rx="3" /><path d="M10.5 18.5h3" /></svg>
  }
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="currentColor" opacity=".14" />
      <path d="M9 21c0-7.5 5-12.5 14-12.5 0 9-5.5 14-13 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M9 21.5c2.6-3.7 5.6-6 9-7.6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/* ---------- the three feature illustrations ---------- */

function Sneaker({ uid }: { uid: string }) {
  return (
    <svg width="132" height="84" viewBox="0 0 132 84" aria-hidden="true">
      <defs>
        <linearGradient id={uid + "sk"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fb4dd" />
          <stop offset="1" stopColor="#3f6ea5" />
        </linearGradient>
        <linearGradient id={uid + "so"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d8d4c8" />
        </linearGradient>
      </defs>
      <ellipse cx="66" cy="76" rx="54" ry="5" fill="#000" opacity=".08" />
      <path d="M14 60c-4 0-6-4-4-8l8-16c2-4 6-6 10-5l14 3c4 1 8 0 11-3l7-7c3-3 8-3 11 0l18 17c6 6 14 9 22 10 7 1 11 5 11 10v3H14z" fill={"url(#" + uid + "sk)"} />
      <path d="M53 31l7-7c3-3 8-3 11 0l9 8-17 10z" fill="#dce8f5" opacity=".9" />
      <path d="M8 60h116c2 0 3 2 3 4v2c0 4-3 7-7 7H18c-6 0-11-5-11-11 0-1 0-2 1-2z" fill={"url(#" + uid + "so)"} />
      <path d="M10 66h116" stroke="#b9b4a6" strokeWidth="1.2" />
      <path d="M30 50c14 2 30 0 44-6 10-4 22-3 32 3" fill="none" stroke="#f4f7fb" strokeWidth="3" strokeLinecap="round" opacity=".9" />
      <path d="M36 56c12 1 26-1 38-5" fill="none" stroke="#f9b44b" strokeWidth="2.6" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={"M" + (58 + i * 6) + " " + (34 + i * 2) + "l7 -4"} stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      ))}
      <circle cx="22" cy="44" r="3" fill="#fff" opacity=".7" />
    </svg>
  )
}

function Beet({ uid }: { uid: string }) {
  return (
    <svg width="96" height="110" viewBox="0 0 96 110" aria-hidden="true">
      <defs>
        <radialGradient id={uid + "bt"} cx=".35" cy=".35" r=".8">
          <stop offset="0" stopColor="#c94a7a" />
          <stop offset=".6" stopColor="#8e1f4d" />
          <stop offset="1" stopColor="#5e1032" />
        </radialGradient>
        <linearGradient id={uid + "lf"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fb35a" />
          <stop offset="1" stopColor="#3f7a35" />
        </linearGradient>
      </defs>
      <ellipse cx="48" cy="104" rx="26" ry="4" fill="#000" opacity=".08" />
      <path d="M44 46c-6-12-20-16-28-30 10-2 26 4 30 22z" fill={"url(#" + uid + "lf)"} />
      <path d="M50 44c2-14 10-30 26-36 2 14-8 28-22 38z" fill={"url(#" + uid + "lf)"} />
      <path d="M47 46c-1-14 2-28 0-40 8 8 10 26 4 40z" fill="#5f9a46" />
      <path d="M45 50L30 22M49 48l2-36M52 49l18-34" stroke="#b02a5a" strokeWidth="2" strokeLinecap="round" />
      <path d="M48 46c18 0 30 12 28 28-2 14-14 22-26 26l-2 9-3-9C33 96 21 88 20 74c-2-16 10-28 28-28z" fill={"url(#" + uid + "bt)"} />
      <path d="M33 62c3-5 8-8 13-9" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".35" />
    </svg>
  )
}

function Salmon({ uid }: { uid: string }) {
  return (
    <svg width="132" height="80" viewBox="0 0 132 80" aria-hidden="true">
      <defs>
        <linearGradient id={uid + "sa"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffa071" />
          <stop offset="1" stopColor="#e2653a" />
        </linearGradient>
      </defs>
      <ellipse cx="66" cy="72" rx="52" ry="5" fill="#000" opacity=".08" />
      <path d="M12 46c0-14 18-28 48-30 30-2 58 6 62 22 3 14-14 26-52 28-38 2-58-6-58-20z" fill="#fff4ee" />
      <path d="M14 44c0-12 18-25 46-27 28-2 54 5 58 20 3 12-13 23-49 25-36 2-55-6-55-18z" fill={"url(#" + uid + "sa)"} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={"M" + (30 + i * 14) + " 22c-6 10-6 24 2 38"} fill="none" stroke="#fff3ea" strokeWidth="2.6" strokeLinecap="round" opacity=".85" />
      ))}
      <path d="M18 40c4-8 14-14 26-17" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".4" />
      <path d="M96 64c8-1 16-5 18-10" stroke="#9e9a8a" strokeWidth="1.4" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}

/* ---------- planner phone screens ---------- */

function Ring({ value, max }: { value: number; max: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  const p = Math.min(1, value / Math.max(1, max))
  return (
    <svg className="fpt-ring" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--fpt-line)" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--fpt-accent)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 32 32)" />
      <text x="32" y="31" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor">{Math.round(p * 100)}%</text>
      <text x="32" y="42" textAnchor="middle" fontSize="7" fill="currentColor" opacity=".55">of goal</text>
    </svg>
  )
}

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="fpt-bar">
      <i style={{ transform: "scaleX(" + Math.min(1, value / Math.max(1, max)) + ")" }} />
    </div>
  )
}

function StatusBar() {
  return (
    <div className="fpt-status" aria-hidden="true">
      <span>9:41</span>
      <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <svg width="16" height="10" viewBox="0 0 16 10"><path d="M1 9h2V7H1zM5 9h2V5H5zM9 9h2V3H9zM13 9h2V1h-2z" fill="currentColor" /></svg>
        <svg width="22" height="11" viewBox="0 0 22 11"><rect x=".5" y=".5" width="18" height="10" rx="3" fill="none" stroke="currentColor" opacity=".5" /><rect x="2" y="2" width="13" height="7" rx="1.6" fill="currentColor" /><rect x="19.5" y="3.5" width="1.6" height="4" rx=".8" fill="currentColor" opacity=".5" /></svg>
      </span>
    </div>
  )
}

function PlannerPhone({ tab, dishes, target, brand }: { tab: number; dishes: FptDish[]; target: number; brand: string }) {
  const [day, setDay] = React.useState(0)
  const [checked, setChecked] = React.useState([] as string[])
  const [current, setCurrent] = React.useState(dishes[1] || dishes[0])
  const plan = DEFAULT_PLAN.map((d) => ({ ...d, meals: d.meals.filter((id) => dishes.some((x) => x.id === id)) }))
  const today = plan[day]
  const mealsToday = today.meals.map((id) => dishes.find((d) => d.id === id)).filter(Boolean) as FptDish[]
  const fallback = mealsToday.length ? mealsToday : dishes.slice(day % Math.max(1, dishes.length - 2), (day % Math.max(1, dishes.length - 2)) + 3)
  const totals = dayTotals(fallback.map((d) => d.id), dishes)
  const allItems = DEFAULT_GROCERIES.flatMap((g) => g.items)
  const swaps = current ? swapsFor(current, dishes, 3) : []
  const slots = ["Breakfast", "Lunch", "Dinner"]
  const toggle = (item: string) => setChecked((c) => (c.includes(item) ? c.filter((x) => x !== item) : c.concat(item)))

  return (
    <div className="fpt-phone">
      <div className="fpt-screen">
        <StatusBar />
        <div className="fpt-scr" data-on={tab === 0} aria-hidden={tab !== 0}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
            <h4>My week</h4>
            <span className="fpt-sub">{brand} plan</span>
          </div>
          <div className="fpt-days">
            {plan.map((d, i) => (
              <button key={d.day} className="fpt-day" aria-pressed={day === i} onClick={() => setDay(i)} tabIndex={tab === 0 ? 0 : -1}>
                <span>{d.day.charAt(0)}</span>
                <b>{12 + i}</b>
              </button>
            ))}
          </div>
          <div className="fpt-train" style={{ ["--fpt-soft-c" as string]: "var(--fpt-sage)" }}>
            <Icon name="bolt" size={12} /> {today.training}
          </div>
          <div className="fpt-ring-row">
            <Ring value={totals.kcal} max={target} />
            <div className="fpt-macros">
              <div style={{ fontSize: 11, fontWeight: 600 }}>{totals.kcal.toLocaleString("en-US")} / {target.toLocaleString("en-US")} kcal</div>
              {[["Protein", totals.protein, 160], ["Carbs", totals.carbs, 300], ["Fat", totals.fat, 90]].map(([k, v, m]) => (
                <div key={k as string}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>{k}</span><span>{v}g</span></div>
                  <Bar value={v as number} max={m as number} />
                </div>
              ))}
            </div>
          </div>
          {fallback.slice(0, 3).map((d, i) => (
            <div className="fpt-meal" key={day + d.id}>
              <Pic shot={d.image} w={88} h={88} />
              <div>
                <small>{slots[i]}</small>
                <div style={{ fontWeight: 600, fontSize: 11 }}>{d.name}</div>
              </div>
              <small>{d.kcal} kcal</small>
            </div>
          ))}
        </div>

        <div className="fpt-scr" data-on={tab === 1} aria-hidden={tab !== 1}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
            <h4>Grocery list</h4>
            <span className="fpt-sub">{checked.length} of {allItems.length}</span>
          </div>
          <Bar value={checked.length} max={allItems.length} />
          <div>
            {DEFAULT_GROCERIES.map((g) => (
              <div key={g.aisle}>
                <div className="fpt-aisle">{g.aisle}</div>
                {g.items.map((it) => (
                  <button key={it} className="fpt-check" aria-pressed={checked.includes(it)} onClick={() => toggle(it)} tabIndex={tab === 1 ? 0 : -1}>
                    <span className="fpt-box"><Icon name="check" size={11} /></span>
                    <span>{it}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="fpt-scr" data-on={tab === 2} aria-hidden={tab !== 2}>
          <h4>Swap dinner</h4>
          {current && (
            <div className="fpt-swap-card" key={current.id} style={{ animation: "fpt-cap .5s cubic-bezier(.2,.8,.2,1)" }}>
              <Pic shot={current.image} w={520} h={300} />
              <div className="fpt-swap-body">
                <b style={{ fontSize: 13 }}>{current.name}</b>
                <div className="fpt-macro-row">
                  <span><b>{current.kcal}</b>kcal</span>
                  <span><b>{current.protein}g</b>protein</span>
                  <span><b>{current.carbs}g</b>carbs</span>
                  <span><b>{current.fat}g</b>fat</span>
                </div>
              </div>
            </div>
          )}
          <div className="fpt-sub" style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="swap" size={11} /> Closest macro matches</div>
          {swaps.map(({ dish, match }) => (
            <button key={dish.id} className="fpt-alt" onClick={() => setCurrent(dish)} tabIndex={tab === 2 ? 0 : -1} aria-label={"Swap to " + dish.name + ", " + match + "% macro match"}>
              <Pic shot={dish.image} w={68} h={68} />
              <span style={{ fontSize: 11, fontWeight: 500 }}>{dish.name}</span>
              <span className="fpt-match">{match}%</span>
            </button>
          ))}
        </div>

        <div className="fpt-tabbar" aria-hidden="true">
          <span data-on={tab === 0}><Icon name="calendar" size={18} /></span>
          <span data-on={tab === 1}><Icon name="bag" size={18} /></span>
          <span data-on={tab === 2}><Icon name="swap" size={18} /></span>
          <span><Icon name="user" size={18} /></span>
        </div>
      </div>
    </div>
  )
}

/* ---------- cooking mode ---------- */

function CookPhone({ recipe }: { recipe: FptRecipe }) {
  const [step, setStep] = React.useState(0)
  const [left, setLeft] = React.useState(-1)
  const [running, setRunning] = React.useState(false)
  const s = recipe.steps[step]
  const total = s && s.minutes ? s.minutes * 60 : 0

  React.useEffect(() => {
    setRunning(false)
    setLeft(-1)
  }, [step])

  React.useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRunning(false)
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running])

  const shown = left < 0 ? total : left
  const listRef = React.useRef(null as HTMLDivElement | null)
  React.useEffect(() => {
    const el = listRef.current && (listRef.current.querySelector('[aria-current="step"]') as HTMLElement | null)
    const box = listRef.current
    if (el && box) box.scrollTo({ top: el.offsetTop - box.offsetTop - 30, behavior: prefersReduced() ? "auto" : "smooth" })
  }, [step])

  return (
    <div className="fpt-phone">
      <div className="fpt-screen">
        <StatusBar />
        <div className="fpt-scr" data-on="true" style={{ bottom: 0 }}>
          <div className="fpt-sub" style={{ textAlign: "center" }}>Cooking mode</div>
          <h4 style={{ fontSize: 14 }}>{recipe.name}</h4>
          <Bar value={step + 1} max={recipe.steps.length} />
          <div ref={listRef} className="fpt-step-list" style={{ maxHeight: 238, overflowY: "auto", scrollbarWidth: "none" }}>
            {recipe.steps.map((st, i) => (
              <button key={i} className="fpt-step" aria-current={i === step ? "step" : undefined} data-done={i < step} onClick={() => setStep(i)}>
                <i>{i < step ? <Icon name="check" size={10} /> : i + 1}</i>
                <span>
                  <b>{st.title}</b>
                  <p>{st.text}</p>
                </span>
              </button>
            ))}
          </div>
          {total > 0 ? (
            <div className="fpt-timer" role="timer" aria-live={running ? "off" : "polite"}>
              <span style={{ display: "grid" }}>
                <small style={{ fontSize: 9.5, opacity: 0.8 }}>{left === 0 ? "Done!" : "Step timer"}</small>
                <b>{mmss(shown)}</b>
              </span>
              <button onClick={() => {
                if (left === 0) {
                  setLeft(-1)
                  setRunning(false)
                } else {
                  if (left < 0) setLeft(total)
                  setRunning((r) => !r)
                }
              }}>
                {left === 0 ? "Reset" : running ? "Pause" : left > 0 && left < total ? "Resume" : "Start"}
              </button>
            </div>
          ) : (
            <div className="fpt-timer" style={{ background: "var(--fpt-surface)", color: "var(--fpt-ink)" }}>
              <span style={{ fontSize: 11 }}>No timer for this step</span>
            </div>
          )}
          <div className="fpt-stepnav">
            <button onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0}>Back</button>
            <button onClick={() => setStep((x) => (x + 1) % recipe.steps.length)}>{step === recipe.steps.length - 1 ? "Start over" : "Next step"}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- the coverflow ---------- */

function Showcase({ dishes, saved, onSave, uid }: { dishes: FptDish[]; saved: string[]; onSave: (d: FptDish) => void; uid: string }) {
  const n = dishes.length
  const [idx, setIdx] = React.useState(0)
  const [hold, setHold] = React.useState(false)
  const [playing, setPlaying] = React.useState(true)
  const [onScreen, setOnScreen] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)
  const flowRef = React.useRef(null as HTMLDivElement | null)
  const cards = React.useRef([] as (HTMLDivElement | null)[])
  const st = React.useRef({ pos: 0, spread: 1, unit: 200, tween: null as gsap.core.Tween | null, drag: null as null | { x: number; pos: number; moved: boolean; t: number; vx: number }, dragged: 0 })

  const layout = React.useCallback(() => {
    const s = st.current
    cards.current.forEach((el, i) => {
      if (!el) return
      const d = wrapOffset(i, s.pos, n)
      const p = cardPose(d, s.unit, s.spread)
      gsap.set(el, { x: p.x, y: p.y, scale: p.scale, opacity: p.opacity, zIndex: p.zIndex })
      el.style.setProperty("--fpt-fade", String(Math.min(0.55, Math.max(0, Math.abs(d) - 1) * 0.22)))
      el.dataset.center = String(Math.abs(d) < 0.5)
    })
  }, [n])

  const goTo = React.useCallback(
    (target: number) => {
      const s = st.current
      if (s.tween) s.tween.kill()
      const r = prefersReduced()
      setIdx(mod(Math.round(target), n))
      s.tween = gsap.to(s, {
        pos: target,
        duration: r ? 0 : 0.9,
        ease: "expo.out",
        onUpdate: layout,
        onComplete: () => {
          s.pos = mod(s.pos, n)
          layout()
        },
      })
    },
    [layout, n],
  )

  const step = (dir: number) => goTo(Math.round(st.current.pos) + dir)

  React.useEffect(() => {
    const el = flowRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const cw = Math.round(Math.min(200, Math.max(128, w / 6.2)))
      el.style.setProperty("--fpt-cw", cw + "px")
      st.current.unit = cw * 1.08
      layout()
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    setReduced(prefersReduced())
    // the cards fan out from the middle the first time it comes into view
    let trig: ScrollTrigger | null = null
    if (!prefersReduced()) {
      st.current.spread = 0.08
      layout()
      trig = ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () => gsap.to(st.current, { spread: 1, duration: 1.4, ease: "expo.out", onUpdate: layout }),
      })
    }
    return () => {
      ro.disconnect()
      io.disconnect()
      if (trig) trig.kill()
      if (st.current.tween) st.current.tween.kill()
    }
  }, [layout])

  const auto = playing && !hold && onScreen && !reduced && n > 1

  const down = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const s = st.current
    if (s.tween) s.tween.kill()
    s.drag = { x: e.clientX, pos: s.pos, moved: false, t: performance.now(), vx: 0 }
  }
  const move = (e: React.PointerEvent) => {
    const s = st.current
    if (!s.drag) return
    const dx = e.clientX - s.drag.x
    if (Math.abs(dx) > 5 && !s.drag.moved) {
      s.drag.moved = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    if (!s.drag.moved) return
    const now = performance.now()
    const next = s.drag.pos - dx / s.unit
    s.drag.vx = (next - s.pos) / Math.max(1, now - s.drag.t)
    s.drag.t = now
    s.pos = next
    layout()
  }
  const up = () => {
    const s = st.current
    const d = s.drag
    s.drag = null
    if (d && d.moved) s.dragged = performance.now()
    if (d && d.moved) goTo(Math.round(s.pos + Math.max(-2, Math.min(2, d.vx * 180))))
  }
  const clickCard = (i: number) => {
    const s = st.current
    if (performance.now() - s.dragged < 300) return
    const d = wrapOffset(i, s.pos, n)
    if (Math.abs(d) > 0.5) goTo(s.pos + d)
  }

  const dish = dishes[idx]
  const isSaved = dish ? saved.includes(dish.id) : false

  return (
    <>
      <div
        ref={flowRef}
        className="fpt-flow"
        role="region"
        aria-roledescription="carousel"
        aria-label="Recipes"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") (e.preventDefault(), step(-1))
          if (e.key === "ArrowRight") (e.preventDefault(), step(1))
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onMouseEnter={() => setHold(true)}
        onMouseLeave={() => setHold(false)}
        onFocus={() => setHold(true)}
        onBlur={() => setHold(false)}
      >
        {dishes.map((d, i) => (
          <div
            key={d.id}
            ref={(el) => {
              cards.current[i] = el
            }}
            className="fpt-card"
            role="group"
            aria-roledescription="slide"
            aria-label={i + 1 + " of " + n + ": " + d.name}
            aria-hidden={i !== idx}
            onClick={() => clickCard(i)}
          >
            <Pic shot={d.image} w={420} h={490} eager={i < 3 || i > n - 3} />
            <button
              className="fpt-heart"
              aria-pressed={saved.includes(d.id)}
              aria-label={(saved.includes(d.id) ? "Unsave " : "Save ") + d.name}
              tabIndex={i === idx ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation()
                onSave(d)
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill={saved.includes(d.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      {dish && (
        <div className="fpt-caption" aria-live="polite" key={dish.id}>
          <h3>{dish.name}{isSaved ? " ♥" : ""}</h3>
          <div>
            <span className="fpt-chip"><Icon name="clock" size={12} /> {dish.time} mins</span>
            <span className="fpt-chip"><Icon name="flame" size={12} /> {dish.kcal} cals</span>
            <span className="fpt-chip">{dish.protein}g protein</span>
          </div>
        </div>
      )}
      <div className="fpt-pager" data-paused={!auto}>
        <button className="fpt-round" onClick={() => step(-1)} aria-label="Previous recipe"><Icon name="left" /></button>
        <div className="fpt-pager-dots" id={uid + "dots"}>
          {dishes.map((d, i) => (
            <span
              key={d.id + (i === idx ? "on" : "")}
              className="fpt-pd"
              aria-current={i === idx}
              style={{ ["--fpt-dur" as string]: "5s" }}
              onAnimationEnd={() => auto && step(1)}
            >
              {i === idx && <i style={auto ? undefined : { animationPlayState: "paused" }} />}
            </span>
          ))}
        </div>
        <button className="fpt-round" onClick={() => step(1)} aria-label="Next recipe"><Icon name="right" /></button>
        {!reduced && (
          <button className="fpt-round" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause autoplay" : "Play autoplay"}>
            <Icon name={playing ? "pause" : "play"} size={12} />
          </button>
        )}
      </div>
    </>
  )
}

/* ---------- download sheet ---------- */

function DownloadSheet({ brand, appStoreHref, playStoreHref, onRequestLink, onClose }: { brand: string; appStoreHref?: string; playStoreHref?: string; onRequestLink?: (email: string) => unknown; onClose: () => void }) {
  const [email, setEmail] = React.useState("")
  const [note, setNote] = React.useState({ tone: "", text: "" })
  const [busy, setBusy] = React.useState(false)
  const boxRef = React.useRef(null as HTMLDivElement | null)
  React.useEffect(() => {
    const back = document.activeElement as HTMLElement | null
    const box = boxRef.current
    const first = box && (box.querySelector("a,button,input") as HTMLElement | null)
    if (first) first.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Tab" && box) {
        const f = Array.from(box.querySelectorAll("a,button,input")) as HTMLElement[]
        const a = f[0]
        const z = f[f.length - 1]
        if (e.shiftKey && document.activeElement === a) (e.preventDefault(), z.focus())
        else if (!e.shiftKey && document.activeElement === z) (e.preventDefault(), a.focus())
      }
    }
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("keydown", key)
      if (back) back.focus()
    }
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setNote({ tone: "err", text: "That email doesn't look right." })
    setBusy(true)
    let ok = true
    try {
      const res = onRequestLink ? await onRequestLink(email) : await new Promise((r) => setTimeout(() => r(true), 700))
      if (res === false) ok = false
    } catch {
      ok = false
    }
    setBusy(false)
    setNote(ok ? { tone: "ok", text: "Sent. Check your inbox for the link." } : { tone: "err", text: "Couldn't send it. Try again in a moment." })
    if (ok) setEmail("")
  }

  return (
    <div className="fpt-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={boxRef} className="fpt-dialog" role="dialog" aria-modal="true" aria-labelledby="fpt-dl-title">
        <button className="fpt-iconbtn fpt-x" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        <Logo />
        <h3 id="fpt-dl-title">Get {brand}</h3>
        <p>Free for 14 days. Plans, grocery lists and cooking mode on iPhone and Android.</p>
        <div className="fpt-stores">
          <a className="fpt-store" href={appStoreHref || "#"} onClick={(e) => !appStoreHref && e.preventDefault()}>
            <Icon name="phone" size={20} />
            <span><small>Download on the</small>App Store</span>
          </a>
          <a className="fpt-store" href={playStoreHref || "#"} onClick={(e) => !playStoreHref && e.preventDefault()}>
            <Icon name="play" size={18} />
            <span><small>Get it on</small>Google Play</span>
          </a>
        </div>
        <form className="fpt-form" onSubmit={submit}>
          <label className="fpt-sr" htmlFor="fpt-dl-email">Email</label>
          <input id="fpt-dl-email" type="email" placeholder="Email me the link" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="fpt-btn fpt-btn-accent" disabled={busy}>{busy ? "Sending" : "Send"}</button>
        </form>
        <div className="fpt-note" data-tone={note.tone} role="status">{note.text}</div>
      </div>
    </div>
  )
}

/* ---------- the page ---------- */

export default function FuelplateRecipesTemplate({
  brand = "Fuelplate",
  tagline = "Healthy, performance-driven recipes.",
  nav = [{ label: "Recipes", href: "#recipes" }, { label: "Resources", href: "#resources" }, { label: "Company" }, { label: "Pricing" }],
  hero = { title: "Performance driven\nrecipes for athletes.", text: "Discover a wide range of recipes crafted to fuel your training, optimize recovery, and help you become your best self.", cta: "Download app", image: shot("1483721310020-03333e577078", "An athlete crouching on a city street to tie a running shoe", "#6b5a48", "50% 40%") },
  features = [
    { title: "Designed for Athletes", text: "Every recipe is crafted with your training in mind, meals that support recovery, endurance, and strength." },
    { title: "Whole Ingredients Only", text: "No fillers, no processed additives, just real food that your body recognises and uses efficiently." },
    { title: "Key Micronutrients", text: "Track essential nutrients like omega-3, magnesium, and B vitamins that directly impact your performance." },
  ],
  planner = DEFAULT_PLANNER,
  target = 2600,
  showcase = { title: "Healthy doesn't\nhave to be boring.", text: "Every recipe is specially crafted to taste good because food that fuels you should also make you excited to eat." },
  dishes = DEFAULT_DISHES,
  bento = { title: "The all-in-one meal\nplanning app for athletes.", text: "Explore performance-driven recipes, track nutrition, and stay consistent with your goals." },
  nutrients = DEFAULT_NUTRIENTS,
  testimonials = DEFAULT_TESTIMONIALS,
  cook = { title: "Cook like a pro, without\nneeding to be one." },
  recipe = DEFAULT_RECIPE,
  categories = { title: "Find what fuels you best.", items: DEFAULT_CATEGORIES },
  resources = { title: "Resources", items: DEFAULT_ARTICLES },
  cta = { title: "Eat better. Feel better.\nPerform better.", text: "Discover healthy recipes, plan meals, create shopping lists, and track macros, all in one app.", button: "Download app" },
  footer = DEFAULT_FOOTER,
  palette = "sage",
  theme = "system",
  fontHref = DEFAULT_FONT,
  appStoreHref,
  playStoreHref,
  onDownload,
  onRequestLink,
  onSave,
  height = "100svh",
  className,
}: FptProps) {
  const uid = "fpt" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const heroRef = React.useRef(null as HTMLElement | null)
  const planRef = React.useRef(null as HTMLDivElement | null)
  const planTrig = React.useRef(null as ScrollTrigger | null)
  const tabsRef = React.useRef(null as HTMLDivElement | null)
  const [dark, setDark] = useTheme(theme)
  const pal = resolvePalette(palette)
  const [compact, setCompact] = React.useState(!hero)
  const [menu, setMenu] = React.useState(false)
  const [sheet, setSheet] = React.useState(false)
  const [tab, setTab] = React.useState(0)
  const [saved, setSaved] = React.useState(["salmon"] as string[])
  const [bump, setBump] = React.useState(0)
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState(["protein"] as string[])
  const [tracked, setTracked] = React.useState(["Omega-3", "Iron", "Magnesium"] as string[])
  const [diets, setDiets] = React.useState(["gluten-free"] as string[])
  const [servings, setServings] = React.useState(recipe.servings)
  const [system, setSystem] = React.useState("imperial" as "metric" | "imperial")
  const [kind, setKind] = React.useState("" as string)
  const [ind, setInd] = React.useState({ left: 4, width: 0 })

  const plannerTabs = planner || []
  const results = filterDishes(dishes, query, filters)
  const dietMatches = withTags(dishes, diets)
  const articles = resources ? resources.items.filter((a) => !kind || a.kind === kind).slice(0, 4) : []

  const openDownload = () => {
    setMenu(false)
    if (onDownload) onDownload()
    setSheet(true)
  }
  const closeSheet = React.useCallback(() => setSheet(false), [])

  const toggleSave = (d: FptDish) => {
    const on = !saved.includes(d.id)
    setSaved((s) => (on ? s.concat(d.id) : s.filter((x) => x !== d.id)))
    setBump((b) => b + 1)
    if (onSave) onSave(d, on)
  }

  const scrollTo = (href?: string) => {
    setMenu(false)
    if (!href || !href.startsWith("#") || !rootRef.current) return false
    const el = rootRef.current.querySelector('[data-anchor="' + href.slice(1) + '"]') as HTMLElement | null
    if (!el) return false
    el.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" })
    return true
  }

  /** A tab click scrolls the pinned scene to that tab's slice, or just switches when nothing is pinned. */
  const pickTab = (i: number) => {
    const t = planTrig.current
    if (t) {
      const y = t.start + ((i + 0.5) / plannerTabs.length) * (t.end - t.start)
      window.scrollTo({ top: y, behavior: prefersReduced() ? "auto" : "smooth" })
    }
    setTab(i)
  }

  // the tab indicator slides to the active pill
  useIsoLayout(() => {
    const box = tabsRef.current
    if (!box) return
    const place = () => {
      const b = box.querySelectorAll(".fpt-tab")[tab] as HTMLElement | undefined
      if (b) setInd({ left: b.offsetLeft, width: b.offsetWidth })
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(box)
    return () => ro.disconnect()
  }, [tab, plannerTabs.length])

  // every scroll-driven motion on the page
  useIsoLayout(() => {
    const root = rootRef.current
    if (!root) return
    let mm = null as gsap.MatchMedia | null
    const ctx = gsap.context(() => {
      // the nav compacts once the hero is behind it (motion or not)
      if (heroRef.current) {
        ScrollTrigger.create({
          trigger: heroRef.current,
          start: "bottom 90px",
          onEnter: () => setCompact(true),
          onLeaveBack: () => setCompact(false),
        })
      }

      mm = gsap.matchMedia()
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", desk: "(min-width: 961px)" }, (c) => {
        const { motion, desk } = c.conditions as { motion: boolean; desk: boolean }

        // planner: pinned on desktop, scroll walks the tabs
        if (planRef.current && plannerTabs.length > 1 && desk && motion) {
          planTrig.current = ScrollTrigger.create({
            trigger: planRef.current,
            start: "top top+=8",
            end: "+=" + plannerTabs.length * 70 + "%",
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            snap: { snapTo: (v) => (Math.floor(v * plannerTabs.length) + 0.5) / plannerTabs.length, duration: { min: 0.2, max: 0.6 }, delay: 0.15, ease: "power2.inOut" },
            onUpdate: (self) => {
              const n = plannerTabs.length
              setTab(tabAt(self.progress, n))
              const local = Math.min(1, Math.max(0, self.progress * n - tabAt(self.progress, n)))
              root.style.setProperty("--fpt-tp", String(local))
            },
          })
        }
        if (!motion) return () => {
          planTrig.current = null
        }

        // hero: photo settles, words rise, the plate widget pops
        const intro = gsap.timeline({ defaults: { ease: "expo.out" } })
        intro
          .from(".fpt-hero-img .fpt-pic", { scale: 1.18, duration: 2.2, ease: "power3.out" }, 0)
          .fromTo(".fpt-hero-frame", { clipPath: "inset(14% 10% 14% 10% round 48px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.6, ease: "expo.inOut" }, 0)
          .from(".fpt-nav", { y: -30, autoAlpha: 0, duration: 1 }, 0.7)
          .from(".fpt-hero h1 .fpt-wi", { yPercent: 115, rotate: 4, duration: 1.3, stagger: 0.06 }, 0.8)
          .from(".fpt-hero-copy > :not(h1)", { y: 20, autoAlpha: 0, duration: 1, stagger: 0.1 }, 1.2)
          .from(".fpt-plate", { y: 40, scale: 0.85, rotate: -6, autoAlpha: 0, duration: 1.2, ease: "back.out(1.6)" }, 1.4)
          .from(".fpt-plate .fpt-bar i", { scaleX: 0, duration: 1.2, stagger: 0.12 }, 1.8)

        // hero: as it scrolls away the photo folds into a rounded card
        if (heroRef.current) {
          const out = gsap.timeline({ scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 0.6 } })
          out
            .fromTo(".fpt-hero-frame", { clipPath: "inset(0% 0% 0% 0% round 0px)" }, { clipPath: "inset(6% 3% 4% 3% round 40px)", ease: "none", immediateRender: false }, 0)
            .to(".fpt-hero-img", { yPercent: 14, scale: 1.08, ease: "none" }, 0)
            .to(".fpt-hero-copy", { yPercent: -40, autoAlpha: 0.1, ease: "none" }, 0)
            .to(".fpt-plate", { yPercent: -120, ease: "none" }, 0)
        }

        // section titles: words rise as they enter
        gsap.utils.toArray("[data-fpt-split]").forEach((el) => {
          const words = (el as HTMLElement).querySelectorAll(".fpt-wi")
          gsap.from(words, { yPercent: 115, rotate: 3, duration: 1.1, ease: "expo.out", stagger: 0.05, scrollTrigger: { trigger: el as HTMLElement, start: "top 86%" } })
        })

        // anything marked to reveal
        gsap.utils.toArray("[data-fpt-reveal]").forEach((el) => {
          gsap.from(el as HTMLElement, { y: 36, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el as HTMLElement, start: "top 90%" } })
        })

        // features: the illustrations drop in and the tags float
        gsap.from(".fpt-feat", { y: 50, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".fpt-feats", start: "top 82%" } })
        gsap.from(".fpt-feat-art", { scale: 0.4, rotate: -25, duration: 1.4, ease: "elastic.out(1,.6)", stagger: 0.12, scrollTrigger: { trigger: ".fpt-feats", start: "top 82%" } })
        gsap.to(".fpt-tag", { y: -6, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.4 })

        // planner card opens from a narrower rounded shape
        if (planRef.current) {
          gsap.fromTo(".fpt-plan", { clipPath: "inset(8% 6% 8% 6% round 60px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".fpt-plan", start: "top 85%" } })
          gsap.from(".fpt-plan .fpt-phone", { y: 120, rotate: 6, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".fpt-plan", start: "top 75%" } })
        }

        // bento: tiles unfold one by one
        gsap.from(".fpt-bento .fpt-tile", { y: 60, scale: 0.94, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: { each: 0.08, from: "start" }, scrollTrigger: { trigger: ".fpt-bento", start: "top 82%" } })

        // cook: the phone swings in from the left, the cards from the right
        gsap.from(".fpt-cook-phone .fpt-phone", { x: -60, rotate: -8, autoAlpha: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".fpt-cook", start: "top 80%" } })
        gsap.from(".fpt-cook > .fpt-tile:not(.fpt-cook-phone)", { x: 60, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".fpt-cook", start: "top 80%" } })

        // categories: plates spin onto their tiles
        gsap.from(".fpt-cat", { y: 40, autoAlpha: 0, duration: 0.9, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: ".fpt-cats", start: "top 85%" } })
        gsap.from(".fpt-cat-spin", { rotate: -160, scale: 0.4, duration: 1.5, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: ".fpt-cats", start: "top 85%" } })

        // resources slide in
        gsap.from(".fpt-kind", { y: 30, autoAlpha: 0, duration: 0.9, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".fpt-kinds", start: "top 92%" } })

        // call to action: the words light up as you read down, the plates drift
        const ctaEl = root.querySelector(".fpt-cta")
        if (ctaEl) {
          const words = ctaEl.querySelectorAll(".fpt-wi")
          gsap.fromTo(words, { "--fpt-lit": "18%" }, { "--fpt-lit": "100%", ease: "none", stagger: 0.3, scrollTrigger: { trigger: ctaEl, start: "top 75%", end: "center 45%", scrub: 0.5 } })
          gsap.utils.toArray(".fpt-orbit").forEach((o, i) => {
            gsap.fromTo(o as HTMLElement, { yPercent: 60 + i * 30, rotate: -40 + i * 25 }, { yPercent: -60 - i * 30, rotate: 40 - i * 20, ease: "none", scrollTrigger: { trigger: ctaEl, start: "top bottom", end: "bottom top", scrub: 1 } })
          })
        }

        gsap.from(".fpt-foot", { y: 60, autoAlpha: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".fpt-foot", start: "top 95%" } })
        gsap.from(".fpt-foot-word", { yPercent: 60, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".fpt-foot", start: "top 80%" } })

        return () => {
          planTrig.current = null
        }
      })
    }, root)

    // fonts and late images change heights; let the triggers re-measure
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
    const late = window.setTimeout(() => ScrollTrigger.refresh(), 1200)
    return () => {
      window.clearTimeout(late)
      if (mm) mm.revert()
      ctx.revert()
    }
  }, [!!hero, !!planner, !!showcase, !!bento, !!cook, !!categories, !!resources, !!cta, !!footer, plannerTabs.length])

  const vars = {
    "--fpt-h": height,
    "--fpt-accent": pal.accent,
    "--fpt-soft": pal.soft,
  } as React.CSSProperties

  const t = testimonials
  const nutrientRows = [nutrients.slice(0, Math.ceil(nutrients.length / 2)), nutrients.slice(Math.ceil(nutrients.length / 2))]
  const dietCards = [
    { tag: "vegan", label: "Vegan", image: shot("1543362906-acfc16c67564", "", "#cfe0c3") },
    { tag: "vegetarian", label: "Vegetarian", image: shot("1505576399279-565b52d4ac71", "", "#b7a37a") },
    { tag: "gluten-free", label: "Gluten-Free", image: shot("1547496502-affa22d38842", "", "#28302a") },
    { tag: "dairy-free", label: "Dairy-Free", image: shot("1490474418585-ba9bad8fd0ea", "", "#3c5267") },
  ]
  const filterChips = [["protein", "High protein"], ["quick", "Under 20 min"], ["lowcarb", "Low carb"], ["plant", "Vegetarian"]]
  const orbitShots = [dishes[0], dishes[4], dishes[3], dishes[9] || dishes[1]].filter(Boolean)
  const orbitPlaces: { size: number; at: React.CSSProperties }[] = [
    { size: 120, at: { left: "6%", top: "18%" } },
    { size: 96, at: { right: "7%", top: "10%" } },
    { size: 84, at: { left: "14%", bottom: "8%" } },
    { size: 132, at: { right: "12%", bottom: "14%" } },
  ]

  return (
    <div ref={rootRef} className={"fpt-root " + (className || "")} data-theme={dark ? "dark" : "light"} style={vars}>
      <style>{FPT_CSS}</style>
      {fontHref && <link rel="stylesheet" href={fontHref} />}

      {/* nav */}
      <div className="fpt-navwrap">
        <nav className="fpt-nav" data-compact={compact || menu} aria-label="Main">
          <div className="fpt-nav-links">
            {nav.map((l) => (
              <a key={l.label} href={l.href || "#"} onClick={(e) => (scrollTo(l.href) || !l.href) && e.preventDefault()}>
                {l.label}
              </a>
            ))}
          </div>
          <a className="fpt-logo" href="#" onClick={(e) => (e.preventDefault(), rootRef.current && rootRef.current.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth" }))}>
            <Logo />
            {brand}
          </a>
          <div className="fpt-nav-end">
            <button className="fpt-iconbtn" aria-label={saved.length + " saved recipes"} onClick={() => scrollTo("#recipes")}>
              <Icon name="heart" size={17} />
              {saved.length > 0 && <span className="fpt-badge" key={bump} style={{ animation: "fpt-pop .45s cubic-bezier(.3,1.6,.5,1)" }}>{saved.length}</span>}
            </button>
            <button className="fpt-iconbtn" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setDark(!dark)}>
              <Icon name={dark ? "sun" : "moon"} size={17} />
            </button>
            <button className="fpt-btn fpt-btn-accent" onClick={openDownload}>
              <span className="fpt-dot" style={{ background: pal.soft }} /> {hero ? hero.cta : "Download app"}
            </button>
            <button className="fpt-iconbtn fpt-menu-btn" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu((m) => !m)}>
              <Icon name={menu ? "x" : "menu"} size={18} />
            </button>
          </div>
        </nav>
        {menu && (
          <div className="fpt-sheet" role="menu">
            {nav.map((l) => (
              <a key={l.label} role="menuitem" href={l.href || "#"} onClick={(e) => (scrollTo(l.href) || !l.href) && e.preventDefault()}>{l.label}</a>
            ))}
            <button role="menuitem" onClick={openDownload} style={{ color: "var(--fpt-accent)", fontWeight: 600 }}>Download app</button>
          </div>
        )}
      </div>

      {/* hero */}
      {hero && (
        <header ref={heroRef} className="fpt-hero">
          <div className="fpt-hero-frame">
            <div className="fpt-hero-img">
              <Pic shot={hero.image} w={2400} eager />
            </div>
          </div>
          {dishes[0] && (
            <div className="fpt-plate" aria-hidden="true">
              <Pic shot={(dishes[1] || dishes[0]).image} w={420} h={200} eager />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <b>{(dishes[1] || dishes[0]).name}</b>
              </div>
              <small>Tonight, after intervals</small>
              <div className="fpt-plate-bars">
                {[["Protein", (dishes[1] || dishes[0]).protein, 50], ["Carbs", (dishes[1] || dishes[0]).carbs, 90], ["Fat", (dishes[1] || dishes[0]).fat, 40]].map(([k, v, m]) => (
                  <div key={k as string}>
                    {k} {v}g
                    <Bar value={v as number} max={m as number} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="fpt-hero-copy">
            <h1><Words text={hero.title} /></h1>
            <p>{hero.text}</p>
            <button className="fpt-btn fpt-btn-light" onClick={openDownload}>
              <span className="fpt-dot" style={{ background: pal.accent }} /> {hero.cta}
            </button>
          </div>
          <div className="fpt-scrollcue" aria-hidden="true" />
        </header>
      )}

      <main>
        {/* features */}
        {features && features.length > 0 && (
          <section className="fpt-wrap fpt-feats" aria-label="Why it works">
            {features.slice(0, 3).map((f, i) => (
              <div className="fpt-feat" key={f.title}>
                <div className="fpt-feat-art">
                  {i === 0 && <Sneaker uid={uid} />}
                  {i === 1 && <Beet uid={uid} />}
                  {i === 2 && (
                    <>
                      <Salmon uid={uid} />
                      <span className="fpt-tag" style={{ left: -6, top: 8 }}>{nutrients[0] || "Vitamin B12"}</span>
                      <span className="fpt-tag" style={{ right: -4, top: -6 }}>{nutrients[1] || "Omega-3"}</span>
                    </>
                  )}
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </section>
        )}

        {/* planner */}
        {planner && plannerTabs.length > 0 && (
          <section className="fpt-plan-outer" aria-label={plannerTabs[0].eyebrow}>
            <div ref={planRef}>
              <div className="fpt-plan">
                <div ref={tabsRef} className="fpt-tabs" role="tablist" aria-label="App features" onKeyDown={(e) => {
                  const k = nextIndex(tab, e.key, plannerTabs.length)
                  if (k < 0) return
                  e.preventDefault()
                  pickTab(k)
                  const b = tabsRef.current && (tabsRef.current.querySelectorAll(".fpt-tab")[k] as HTMLElement | undefined)
                  if (b) b.focus()
                }}>
                  <span className="fpt-tab-ind" style={{ left: ind.left, width: ind.width }} aria-hidden="true"><i /></span>
                  {plannerTabs.map((p, i) => (
                    <button key={p.tab} className="fpt-tab" role="tab" id={uid + "tab" + i} aria-selected={tab === i} aria-controls={uid + "pane" + i} tabIndex={tab === i ? 0 : -1} onClick={() => pickTab(i)}>
                      {p.tab}
                    </button>
                  ))}
                </div>
                <div className="fpt-plan-grid">
                  <div className="fpt-plan-copy">
                    {plannerTabs.map((p, i) => (
                      <div key={p.tab} className="fpt-plan-pane" data-on={tab === i} role="tabpanel" id={uid + "pane" + i} aria-labelledby={uid + "tab" + i} hidden={false} aria-hidden={tab !== i}>
                        <span className="fpt-eyebrow"><i />{p.eyebrow}</span>
                        <h3>{p.title}</h3>
                        <p>{p.text}</p>
                        <ul className="fpt-points">
                          {p.points.map((pt, j) => (
                            <li key={pt}>
                              <Icon name={j === 0 ? "chart" : "calendar"} size={18} />
                              {pt}
                            </li>
                          ))}
                        </ul>
                        <div className="fpt-plan-progress" aria-hidden="true">
                          {plannerTabs.map((_, j) => (
                            <span key={j}><i style={{ transform: "scaleX(" + (j < i ? 1 : j === i ? "var(--fpt-tp,1)" : 0) + ")" }} /></span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <PlannerPhone tab={tab} dishes={dishes} target={target} brand={brand} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* showcase */}
        {showcase && dishes.length > 2 && (
          <section className="fpt-sec" data-anchor="recipes" aria-labelledby={uid + "sc"}>
            <div className="fpt-wrap fpt-center">
              <h2 className="fpt-h2" id={uid + "sc"} data-fpt-split=""><Words text={showcase.title} /></h2>
              <p className="fpt-lede" data-fpt-reveal="">{showcase.text}</p>
            </div>
            <Showcase dishes={dishes} saved={saved} onSave={toggleSave} uid={uid} />
          </section>
        )}

        {/* bento */}
        {bento && (
          <section className="fpt-wrap" style={{ paddingBottom: "clamp(72px,10vw,130px)" }} aria-labelledby={uid + "bt"}>
            <div className="fpt-bento-head">
              <h2 className="fpt-h2" id={uid + "bt"} data-fpt-split="" style={{ fontSize: "clamp(30px,4vw,44px)" }}><Words text={bento.title} /></h2>
              <p className="fpt-lede" style={{ maxWidth: "34ch" }} data-fpt-reveal="">{bento.text}</p>
            </div>
            <div className="fpt-bento">
              <div className="fpt-tile">
                <div style={{ display: "grid", gap: 8 }}>
                  <label className="fpt-search">
                    <Icon name="search" size={15} />
                    <span className="fpt-sr">Search recipes</span>
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try salmon, wrap, breakfast" />
                    {query && <button aria-label="Clear search" onClick={() => setQuery("")}><Icon name="x" size={13} /></button>}
                  </label>
                  <div className="fpt-filters">
                    {filterChips.map(([k, label]) => (
                      <button key={k} className="fpt-chip" aria-pressed={filters.includes(k)} onClick={() => setFilters((f) => (f.includes(k) ? f.filter((x) => x !== k) : f.concat(k)))}>{label}</button>
                    ))}
                  </div>
                  <div className="fpt-results" aria-live="polite">
                    {results.length === 0 ? (
                      <div className="fpt-empty">No recipes match. Loosen a filter?</div>
                    ) : (
                      results.map((d, i) => (
                        <div className="fpt-result" key={d.id} style={{ animationDelay: i * 0.04 + "s" }}>
                          <Pic shot={d.image} w={80} h={80} />
                          <span><b>{d.name}</b><span className="fpt-sub">{d.time} min · {d.kcal} kcal</span></span>
                          <span className="fpt-sub">{d.protein}g P</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <p className="fpt-tile-t"><b>Advanced Search & Filtering.</b> Zero in by protein, carbs, calories, key nutrients, cook time, dietary needs and ingredients you have on hand. {results.length} of {dishes.length} shown.</p>
              </div>

              <div className="fpt-tile">
                <div className="fpt-marquee">
                  {nutrientRows.map((row, ri) => (
                    <div className="fpt-mrow" data-rev={ri === 1} key={ri}>
                      {row.concat(row).map((nu, i) => (
                        <button
                          key={nu + i}
                          className="fpt-chip"
                          aria-pressed={tracked.includes(nu)}
                          tabIndex={i < row.length ? 0 : -1}
                          aria-hidden={i >= row.length}
                          onClick={() => setTracked((tr) => (tr.includes(nu) ? tr.filter((x) => x !== nu) : tr.concat(nu)))}
                        >
                          {tracked.includes(nu) && <Icon name="check" size={10} />}
                          {nu}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="fpt-nutri" aria-live="polite">
                  <div className="fpt-sub" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{(dishes[1] || dishes[0]).name}</span>
                    <span>% daily value</span>
                  </div>
                  {tracked.length === 0 && <div className="fpt-sub">Tap a nutrient to track it.</div>}
                  {tracked.slice(-3).map((nu) => {
                    const v = dailyValue(nu, (dishes[1] || dishes[0]).id)
                    return (
                      <div key={nu} className="fpt-nutri-row">
                        <span>{nu}</span>
                        <Bar value={v} max={150} />
                        <b>{v}%</b>
                      </div>
                    )
                  })}
                </div>
                <p className="fpt-tile-t"><b>Key nutrients.</b> See key nutrients on every recipe card and sort by what matters to your health. Tracking {tracked.length}: {tracked.slice(0, 3).join(", ")}{tracked.length > 3 ? " and more" : ""}.</p>
              </div>

              {t[0] && (
                <figure className="fpt-tile fpt-peach">
                  <blockquote className="fpt-quote">&ldquo;{t[0].quote}&rdquo;</blockquote>
                  <figcaption className="fpt-who">
                    {t[0].image && <Pic shot={t[0].image} w={68} h={68} />}
                    <span>{t[0].name}<small>{t[0].role}</small></span>
                  </figcaption>
                </figure>
              )}

              {t[1] && (
                <figure className="fpt-tile fpt-sage fpt-wide fpt-story">
                  {t[1].image && <Pic shot={t[1].image} w={480} />}
                  <div style={{ display: "grid", gap: 18 }}>
                    <blockquote className="fpt-quote">&ldquo;{t[1].quote}&rdquo;</blockquote>
                    <figcaption className="fpt-who"><span>{t[1].name}<small>{t[1].role}</small></span></figcaption>
                  </div>
                </figure>
              )}

              <div className="fpt-tile">
                <div className="fpt-diets">
                  {dietCards.map((d) => (
                    <button key={d.tag} className="fpt-diet" aria-pressed={diets.includes(d.tag)} onClick={() => setDiets((x) => (x.includes(d.tag) ? x.filter((y) => y !== d.tag) : x.concat(d.tag)))}>
                      <em><Icon name="check" size={9} /></em>
                      <Pic shot={d.image} w={108} h={108} />
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="fpt-tile-t" aria-live="polite"><b>Diets & Preferences.</b> From plant-based to gluten-free, find recipes that match your needs. <b>{dietMatches.length}</b> {dietMatches.length === 1 ? "recipe fits" : "recipes fit"} your picks.</p>
              </div>
            </div>
          </section>
        )}

        {/* cook */}
        {cook && (
          <section className="fpt-wrap" style={{ paddingBottom: "clamp(72px,10vw,130px)" }} aria-labelledby={uid + "ck"}>
            <h2 className="fpt-h2" id={uid + "ck"} data-fpt-split="" style={{ fontSize: "clamp(30px,4vw,44px)" }}><Words text={cook.title} /></h2>
            <div className="fpt-cook">
              <div className="fpt-tile fpt-cook-phone">
                <CookPhone recipe={recipe} />
                <p className="fpt-tile-t" style={{ justifySelf: "start" }}><b>Cooking Mode.</b> Step-by-step, full-screen instructions with timers to keep you focused on cooking.</p>
              </div>
              <div className="fpt-tile fpt-recipe">
                <Pic shot={recipe.image} w={184} h={184} />
                <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                  <b style={{ fontWeight: 500 }}>{recipe.name}</b>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span className="fpt-chip"><Icon name="clock" size={12} /> {recipe.time} mins</span>
                    <span className="fpt-chip"><Icon name="flame" size={12} /> {recipe.kcal} cals</span>
                  </div>
                </div>
                <div className="fpt-stepper">
                  <button className="fpt-iconbtn" onClick={() => setServings((s) => Math.max(1, s - 1))} aria-label="Fewer servings" disabled={servings <= 1}><Icon name="minus" /></button>
                  <output aria-live="polite"><b>{servings}</b><small>Servings</small></output>
                  <button className="fpt-iconbtn" onClick={() => setServings((s) => Math.min(12, s + 1))} aria-label="More servings" disabled={servings >= 12}><Icon name="plus" /></button>
                </div>
                <p className="fpt-tile-t" style={{ textAlign: "left", justifySelf: "start" }}><b>Serving Sizes.</b> Adjust the portion size you need and ingredients will adjust accordingly.</p>
              </div>
              <div className="fpt-tile">
                <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
                  <div className="fpt-switch">
                    <span data-on={system === "metric"}>Metric</span>
                    <button role="switch" aria-checked={system === "imperial"} aria-label="Imperial units" onClick={() => setSystem((s) => (s === "metric" ? "imperial" : "metric"))}><i /></button>
                    <span data-on={system === "imperial"}>Imperial</span>
                  </div>
                  <div className="fpt-ings">
                    {recipe.ingredients.slice(0, 4).map((ing) => (
                      <div className="fpt-ing" key={ing.name}>
                        <span>{ing.name}</span>
                        <b key={system + servings} data-tick="">{amount(ing, recipe.servings, servings, system)}</b>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="fpt-tile-t"><b>Measurement Types.</b> Metric or imperial, switch with a tap and cook the way you're used to.</p>
              </div>
              {t[2] && (
                <figure className="fpt-tile fpt-sky fpt-wide2 fpt-story" style={{ minHeight: 0 }}>
                  {t[2].image && <Pic shot={t[2].image} w={480} />}
                  <div style={{ display: "grid", gap: 18 }}>
                    <blockquote className="fpt-quote">&ldquo;{t[2].quote}&rdquo;</blockquote>
                    <figcaption className="fpt-who"><span>{t[2].name}<small>{t[2].role}</small></span></figcaption>
                  </div>
                </figure>
              )}
            </div>
          </section>
        )}

        {/* categories */}
        {categories && (
          <section className="fpt-wrap" style={{ paddingBottom: "clamp(72px,10vw,130px)" }} aria-labelledby={uid + "ct"}>
            <div className="fpt-center">
              <h2 className="fpt-h2" id={uid + "ct"} data-fpt-split="" style={{ fontSize: "clamp(30px,4vw,44px)" }}><Words text={categories.title} /></h2>
            </div>
            <div className="fpt-cats">
              {categories.items.map((c) => (
                <a key={c.name} className="fpt-cat" href={c.href || "#"} onClick={(e) => !c.href && e.preventDefault()} aria-label={c.name + ", " + c.count + " recipes"}>
                  <span className="fpt-cat-spin">
                    <Pic shot={c.image} w={260} h={260} />
                  </span>
                  <span className="fpt-cat-l">
                    <span>{c.name}</span>
                    <small>{c.count} recipes</small>
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* resources */}
        {resources && (
          <section className="fpt-wrap" data-anchor="resources" style={{ paddingBottom: "clamp(40px,6vw,80px)" }} aria-labelledby={uid + "rs"}>
            <div className="fpt-res">
              <div>
                <h2 className="fpt-h2" id={uid + "rs"} data-fpt-split="" style={{ fontSize: "clamp(30px,4vw,44px)" }}><Words text={resources.title} /></h2>
                <p className="fpt-lede" style={{ marginTop: 10 }} data-fpt-reveal="">Notes from our sports dietitians, recipes in context, and conversations with athletes who cook.</p>
              </div>
              <div>
                <div className="fpt-articles" aria-live="polite">
                  {articles.map((a, i) => (
                    <a key={kind + a.id} className="fpt-article" href={a.href || "#"} onClick={(e) => !a.href && e.preventDefault()} style={{ animationDelay: i * 0.06 + "s" }}>
                      <Pic shot={a.image} w={200} h={130} />
                      <span>
                        <b>{a.title}</b>
                        <small>{a.kind} · {fmtDate(a.date)} · {a.read}</small>
                      </span>
                      <Icon name="arrow" />
                    </a>
                  ))}
                </div>
                <div className="fpt-kinds">
                  {(["Knowledge", "Blog", "Podcasts"] as const).map((k, i) => (
                    <button key={k} className={"fpt-kind " + ["fpt-sage", "fpt-peach", "fpt-sky"][i]} aria-pressed={kind === k} onClick={() => setKind((x) => (x === k ? "" : k))}>
                      {k}
                      <small>{resources.items.filter((a) => a.kind === k).length} {k === "Podcasts" ? "episodes" : "articles"}</small>
                    </button>
                  ))}
                </div>
                {kind && <button className="fpt-alltab" onClick={() => setKind("")}>Show everything</button>}
              </div>
            </div>
          </section>
        )}

        {/* call to action */}
        {cta && (
          <section className="fpt-cta" aria-labelledby={uid + "cta"}>
            {orbitShots.map((d, i) => {
              const { size, at } = orbitPlaces[i]
              return <Pic key={d.id + i} shot={d.image} w={size * 2} h={size * 2} className="fpt-orbit" style={{ ...at, width: size, height: size }} />
            })}
            <h2 className="fpt-h2 fpt-wrap" id={uid + "cta"} style={{ position: "relative" }}><Words text={cta.title} /></h2>
            <p className="fpt-lede" style={{ position: "relative" }}>{cta.text}</p>
            <button className="fpt-btn fpt-btn-accent" style={{ position: "relative" }} onClick={openDownload}>
              <span className="fpt-dot" style={{ background: pal.soft }} /> {cta.button}
            </button>
          </section>
        )}
      </main>

      {/* footer */}
      {footer && (
        <footer className="fpt-foot">
          <div className="fpt-foot-top">
            <div>
              <div className="fpt-logo"><Logo /> {brand}</div>
              <p style={{ fontSize: 12.5, color: "var(--fpt-muted)", marginTop: 6 }}>{tagline}</p>
            </div>
            {footer.columns.map((col) => (
              <div key={col.title}>
                <h4>{col.title}</h4>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}><a href={l.href || "#"} onClick={(e) => !l.href && e.preventDefault()}>{l.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="fpt-foot-word" aria-hidden="true">{brand}</div>
          <div className="fpt-foot-bot">
            <div>
              <span>&copy; {brand} {new Date().getFullYear()}</span>
              {footer.social.map((s) => (
                <a key={s.label} href={s.href || "#"} onClick={(e) => !s.href && e.preventDefault()}>{s.label}</a>
              ))}
            </div>
            <span>{footer.note}</span>
          </div>
        </footer>
      )}

      {sheet && <DownloadSheet brand={brand} appStoreHref={appStoreHref} playStoreHref={playStoreHref} onRequestLink={onRequestLink} onClose={closeSheet} />}
    </div>
  )
}
