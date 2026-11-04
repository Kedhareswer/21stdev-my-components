"use client"
import { useEffect, useMemo, useRef, useState } from "react"

/**
 * Ledger Ops Dashboard — a full admin dashboard for a studio or agency, set
 * like a printed ledger: stone paper, ink sidebar, vermilion accent, serif
 * figures. A nav marker and a range pill slide on springs; KPI figures count
 * up beside self-drawing sparklines; the output chart's bars rise in turn and
 * re-grow when the range changes, with a hover tooltip; a seven-day rhythm
 * heatmap washes in; the accounts table filters with a sliding tab and
 * fades rows through. A built-in light/dark switch re-tints everything.
 * Every position is a percentage; nothing reads layout.
 */

export type Range = "7d" | "30d" | "12m"
export type AccountRow = { name: string; owner: string; stage: "Active" | "Planning" | "Review"; health: "On track" | "Needs input" | "At risk" | "Complete"; updated: string; value: number }

export interface LedgerOpsDashboardProps {
  studio?: string
  title?: string
  accounts?: AccountRow[]
  /** Output per range: labels and values. */
  output?: Record<Range, { labels: string[]; values: number[] }>
  /** 7 rows × N weeks of activity, 0–4. */
  rhythm?: number[][]
  theme?: "light" | "dark"
  height?: string
  className?: string
}

// #region ledger
export function niceTop(max: number) {
  if (!(max > 0)) return 1
  const p = Math.pow(10, Math.floor(Math.log10(max)))
  for (const m of [1, 1.2, 1.6, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= max) return m * p
  return 10 * p
}
export function usd(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US")
}
export function filterRows(rows: AccountRow[], tab: string) {
  if (tab === "All") return rows
  if (tab === "At risk") return rows.filter((r) => r.health === "At risk" || r.health === "Needs input")
  return rows.filter((r) => r.stage === tab)
}
// #endregion

const SPRING =
  "linear(0,0.009,0.035 2.1%,0.141,0.281 6.7%,0.723 12.9%,0.938 16.7%,1.017,1.077,1.121,1.149 24.3%,1.159,1.163,1.161,1.154 29.9%,1.129 32.8%,1.051 39.6%,1.017 43.1%,0.991,0.977 51%,0.974 53.8%,0.975 57.1%,0.997 69.8%,1.003 76.9%,1)"
const SERIF = "'Fraunces','Iowan Old Style','Palatino Linotype',Georgia,serif"

const CSS = [
  ".lod-root{--bg:#f2f1ec;--panel:#fbfaf7;--ink:#171a17;--mute:rgba(23,26,23,.55);--faint:rgba(23,26,23,.07);--line:rgba(23,26,23,.09);--side:#151a17;--acc:#e5482b;--heat:#e5482b;",
  "position:relative;width:100%;display:grid;grid-template-columns:232px minmax(0,1fr);overflow:hidden;background:var(--bg);color:var(--ink);",
  "font-family:'Inter Tight','Inter',ui-sans-serif,system-ui,sans-serif;font-size:13.5px;transition:background .5s,color .5s}",
  ".lod-root[data-theme=dark]{--bg:#0f1210;--panel:#171b18;--ink:#eef0ea;--mute:rgba(238,240,234,.55);--faint:rgba(238,240,234,.07);--line:rgba(238,240,234,.09);--side:#0b0d0c}",
  ".lod-side{display:flex;flex-direction:column;gap:4px;padding:16px 12px;background:var(--side);color:#e9ece6;min-height:0;transition:background .5s}",
  ".lod-brand{display:flex;align-items:center;gap:10px;padding:4px 8px 16px;font-weight:650}",
  ".lod-brand small{display:block;font-size:11px;font-weight:500;color:rgba(233,236,230,.45)}",
  ".lod-logo{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--acc);color:#fff;font-family:" + SERIF + ";font-weight:700;font-size:16px;box-shadow:0 6px 14px -6px var(--acc)}",
  ".lod-find{display:flex;align-items:center;gap:8px;height:34px;padding:0 10px;border-radius:9px;background:rgba(233,236,230,.06);color:rgba(233,236,230,.45);margin-bottom:10px}",
  ".lod-nav{position:relative;display:flex;flex-direction:column}",
  ".lod-mark{position:absolute;left:0;right:0;top:0;height:36px;border-radius:9px;background:rgba(233,236,230,.09);transform:translateY(calc(var(--n)*36px));transition:transform .5s " + SPRING + ";pointer-events:none}",
  ".lod-mark:after{content:'';position:absolute;right:10px;top:50%;width:6px;height:6px;margin-top:-3px;border-radius:50%;background:var(--acc);box-shadow:0 0 8px var(--acc)}",
  ".lod-nb{position:relative;appearance:none;border:0;background:transparent;cursor:pointer;height:36px;display:flex;align-items:center;gap:10px;padding:0 10px;border-radius:9px;font:inherit;color:rgba(233,236,230,.6);transition:color .2s}",
  ".lod-nb:hover,.lod-nb[aria-current=page]{color:#fff}",
  ".lod-nb:focus-visible,.lod-seg button:focus-visible,.lod-cta:focus-visible,.lod-tab:focus-visible,.lod-sw:focus-visible,.lod-bar:focus-visible{outline:2px solid var(--acc);outline-offset:2px}",
  ".lod-bot{margin-top:auto;display:flex;flex-direction:column;gap:6px}",
  ".lod-sw{appearance:none;border:0;cursor:pointer;display:flex;align-items:center;gap:10px;height:36px;padding:0 10px;border-radius:9px;background:transparent;font:inherit;color:rgba(233,236,230,.6)}",
  ".lod-sw i{margin-left:auto;position:relative;width:32px;height:18px;border-radius:99px;background:rgba(233,236,230,.18);transition:background .3s}",
  ".lod-sw i:after{content:'';position:absolute;left:2px;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .45s " + SPRING + "}",
  ".lod-sw[aria-checked=true] i{background:var(--acc)}",
  ".lod-sw[aria-checked=true] i:after{transform:translateX(14px)}",
  ".lod-me{display:flex;align-items:center;gap:10px;padding:10px;border-radius:11px;background:rgba(233,236,230,.06)}",
  ".lod-me b{display:block;font-weight:600}.lod-me small{font-size:11px;color:rgba(233,236,230,.45)}",
  ".lod-av{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;color:#fff;background:var(--c,#5b6b62)}",
  ".lod-main{min-width:0;min-height:0;overflow:auto;padding:22px 26px 28px}",
  ".lod-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap}",
  ".lod-crumb{font-size:12px;color:var(--mute)}",
  ".lod-h1{font-family:" + SERIF + ";font-size:34px;font-weight:500;letter-spacing:-.03em;line-height:1.1;margin-top:4px}",
  ".lod-tools{display:flex;gap:10px;align-items:center}",
  ".lod-seg{position:relative;display:grid;grid-template-columns:repeat(3,1fr);padding:3px;border-radius:11px;background:var(--faint)}",
  ".lod-seg>i{position:absolute;top:3px;bottom:3px;left:3px;width:calc((100% - 6px)/3);border-radius:8px;background:var(--panel);box-shadow:0 1px 3px rgba(0,0,0,.12);transform:translateX(calc(var(--r)*100%));transition:transform .45s " + SPRING + "}",
  ".lod-seg button{position:relative;appearance:none;border:0;background:transparent;cursor:pointer;height:30px;padding:0 14px;font:inherit;font-weight:600;color:var(--mute);transition:color .2s}",
  ".lod-seg button[aria-pressed=true]{color:var(--ink)}",
  ".lod-cta{appearance:none;border:0;cursor:pointer;height:36px;padding:0 14px;border-radius:10px;display:inline-flex;align-items:center;gap:7px;font:inherit;font-weight:600;color:#fff;background:var(--acc);",
  "box-shadow:0 1px 0 rgba(255,255,255,.3) inset,0 8px 18px -8px var(--acc);transition:transform .3s " + SPRING + "}",
  ".lod-cta:hover{transform:translateY(-1px)}.lod-cta:active{transform:scale(.96)}",
  ".lod-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:20px}",
  ".lod-card{background:var(--panel);border-radius:18px;padding:16px 18px;box-shadow:0 0 0 1px var(--line),0 1px 2px rgba(0,0,0,.04),0 14px 30px -24px rgba(0,0,0,.35);",
  "opacity:0;transform:translateY(12px);transition:opacity .5s,transform .8s " + SPRING + ",background .5s;transition-delay:calc(var(--i)*60ms),calc(var(--i)*60ms),0s}",
  ".lod-in .lod-card{opacity:1;transform:none}",
  ".lod-kl{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--mute);font-weight:500}",
  ".lod-kv{font-family:" + SERIF + ";font-size:32px;font-weight:500;letter-spacing:-.03em;margin-top:10px;font-variant-numeric:tabular-nums lining-nums}",
  ".lod-kf{display:flex;justify-content:space-between;align-items:flex-end;margin-top:6px}",
  ".lod-dl{white-space:nowrap;font-size:11.5px;font-weight:650;padding:3px 7px;border-radius:6px;background:rgba(31,150,95,.12);color:#1a8a56}",
  ".lod-dl.lod-neg{background:rgba(229,72,43,.12);color:#c9361b}",
  ".lod-spk{width:84px;height:28px;overflow:visible}",
  ".lod-spk path{fill:none;stroke:var(--acc);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.2s cubic-bezier(.6,0,.2,1) .4s}",
  ".lod-in .lod-spk path{stroke-dashoffset:0}",
  ".lod-wide{grid-column:span 3}",
  ".lod-ct{display:flex;justify-content:space-between;align-items:baseline}",
  ".lod-ct b{font-weight:650;font-size:14px}",
  ".lod-ct span{color:var(--mute);font-size:12px}",
  ".lod-total{font-family:" + SERIF + ";font-size:24px;letter-spacing:-.02em;margin-top:4px}",
  ".lod-chart{position:relative;display:grid;grid-template-columns:38px minmax(0,1fr);gap:8px;margin-top:14px}",
  ".lod-y{position:relative;height:200px;font-size:10.5px;color:var(--mute);font-variant-numeric:tabular-nums}",
  ".lod-y span{position:absolute;right:0;transform:translateY(-50%)}",
  ".lod-plot{position:relative;height:200px;display:flex;align-items:flex-end;justify-content:space-around;gap:6px;border-bottom:1px solid var(--line)}",
  ".lod-gl{position:absolute;left:0;right:0;height:0;border-top:1px dashed var(--line);pointer-events:none}",
  ".lod-bar{position:relative;flex:1;max-width:72px;height:100%;appearance:none;border:0;padding:0;background:transparent;cursor:pointer;display:flex;align-items:flex-end}",
  ".lod-bar i{display:block;width:100%;height:100%;border-radius:4px 4px 0 0;background:color-mix(in oklab,var(--acc) 22%,var(--panel));transform-origin:50% 100%;transform:scaleY(0);transition:background .25s}",
  ".lod-in .lod-bar i{transform:scaleY(var(--v));animation:lod-grow .9s " + SPRING + " both;animation-delay:calc(var(--i)*45ms)}",
  ".lod-bar[data-last] i,.lod-bar:hover i,.lod-bar:focus-visible i{background:var(--acc)}",
  ".lod-xl{display:flex;justify-content:space-around;gap:6px;grid-column:2;font-size:10.5px;color:var(--mute);margin-top:6px}",
  ".lod-xl span{flex:1;max-width:72px;text-align:center}",
  ".lod-tip{position:absolute;bottom:calc(var(--v)*100% + 8px);left:50%;transform:translate(-50%,4px);opacity:0;pointer-events:none;white-space:nowrap;padding:5px 8px;border-radius:8px;font-size:11.5px;font-weight:650;",
  "color:var(--panel);background:var(--ink);transition:opacity .2s,transform .3s " + SPRING + ";z-index:2}",
  ".lod-bar:hover .lod-tip,.lod-bar:focus-visible .lod-tip{opacity:1;transform:translate(-50%,0)}",
  ".lod-heat{display:grid;grid-template-rows:repeat(7,auto);grid-auto-columns:minmax(0,1fr);grid-auto-flow:column;gap:3px;margin-top:14px}",
  ".lod-cell{aspect-ratio:1;border-radius:3px;background:color-mix(in oklab,var(--heat) calc(var(--h)*22%),var(--faint));opacity:0;transform:scale(.4);transition:opacity .4s,transform .6s " + SPRING + ",background .5s;transition-delay:calc(var(--d)*9ms)}",
  ".lod-in .lod-cell{opacity:1;transform:none}",
  ".lod-peak{display:flex;justify-content:space-between;align-items:baseline;margin-top:14px;padding-top:12px;border-top:1px solid var(--line);color:var(--mute);font-size:12px}",
  ".lod-peak b{font-family:" + SERIF + ";font-size:20px;font-weight:500;color:var(--ink)}",
  ".lod-leg{display:flex;align-items:center;gap:4px;justify-content:flex-end;margin-top:10px;font-size:10.5px;color:var(--mute)}",
  ".lod-leg i{width:10px;height:10px;border-radius:2px;background:color-mix(in oklab,var(--heat) calc(var(--h)*22%),var(--faint))}",
  ".lod-tabs{position:relative;display:flex;gap:2px;border-bottom:1px solid var(--line);margin:4px -18px 0;padding:0 18px}",
  ".lod-tab{appearance:none;border:0;background:transparent;cursor:pointer;height:38px;padding:0 12px;font:inherit;font-weight:600;color:var(--mute);position:relative;transition:color .2s}",
  ".lod-tab[aria-selected=true]{color:var(--ink)}",
  ".lod-tab[aria-selected=true]:after{content:'';position:absolute;left:10px;right:10px;bottom:-1px;height:2px;border-radius:2px;background:var(--acc);animation:lod-ul .4s " + SPRING + "}",
  ".lod-tab em{font-style:normal;font-size:11px;margin-left:6px;padding:1px 6px;border-radius:99px;background:var(--faint);color:var(--mute)}",
  ".lod-table{width:100%;border-collapse:collapse;margin-top:4px}",
  ".lod-table th{text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);font-weight:600;padding:12px 10px 8px}",
  ".lod-table td{padding:11px 10px;border-top:1px solid var(--line);white-space:nowrap}",
  ".lod-table tbody tr{animation:lod-row .5s " + SPRING + " both;animation-delay:calc(var(--i)*40ms);transition:background .2s}",
  ".lod-table tbody tr:hover{background:var(--faint)}",
  ".lod-acct{display:flex;align-items:center;gap:10px;font-weight:600}",
  ".lod-acct .lod-av{width:26px;height:26px;font-size:10px}",
  ".lod-stage{display:inline-flex;align-items:center;gap:6px;color:var(--mute)}",
  ".lod-stage i{width:6px;height:6px;border-radius:50%;background:var(--s)}",
  ".lod-hl{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:3px 8px;border-radius:99px;color:var(--s);background:color-mix(in oklab,var(--s) 13%,transparent)}",
  ".lod-num{text-align:right;font-variant-numeric:tabular-nums;font-family:" + SERIF + ";font-size:14.5px}",
  ".lod-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  "@keyframes lod-grow{from{transform:scaleY(0)}}",
  "@keyframes lod-ul{0%{transform:scaleX(.2);opacity:0}100%{transform:none;opacity:1}}",
  "@keyframes lod-row{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:none}}",
  "@media (max-width:1100px){.lod-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.lod-wide{grid-column:span 2}.lod-heatc{grid-column:span 2}}",
  "@media (max-width:760px){.lod-root{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}.lod-side{flex-direction:row;align-items:center;padding:10px 12px;overflow-x:auto}.lod-find,.lod-nav,.lod-me,.lod-brand small{display:none}.lod-brand{padding:0}.lod-bot{margin:0 0 0 auto;flex-direction:row}",
  ".lod-tabs{overflow-x:auto}.lod-main{padding:16px 14px 22px}.lod-h1{font-size:27px}.lod-grid{gap:10px}.lod-kv{font-size:25px}.lod-tblwrap{overflow-x:auto}.lod-tools{width:100%}.lod-cta{margin-left:auto}}",
  "@media (prefers-reduced-motion:reduce){.lod-root,.lod-root *,.lod-root *:after{animation:none!important;transition:none!important}}",
].join("")

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const NAV = ["Overview", "Workstreams", "Schedule", "Signals", "Accounts"]
const NAV_ICONS = ["M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z", "M4 6h16M4 12h16M4 18h10", "M7 3v3M17 3v3M4 8h16M5 5h14v15H5z", "M3 12h4l3-8 4 16 3-8h4", "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0"]
const STATUS = { "On track": "#1a8a56", "Needs input": "#c98a0b", "At risk": "#d23a1f", Complete: "#3a6fd8" } as const
const STAGE = { Active: "#1a8a56", Planning: "#3a6fd8", Review: "#c98a0b" } as const
const AVC = ["#5b6b62", "#8a5a44", "#46627f", "#7a5c86", "#6f7a3a", "#3f7a75"]

function spark(values: number[]) {
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  return values.map((v, i) => (i ? "L" : "M") + ((i / (values.length - 1)) * 84).toFixed(1) + " " + (26 - ((v - min) / span) * 24).toFixed(1)).join(" ")
}

function CountUp({ to, go, format }: { to: number; go: boolean; format: (n: number) => string }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!go) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setV(to)
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1300)
      setV(to * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, go])
  return <>{format(v)}</>
}

const DEFAULT_ACCOUNTS: AccountRow[] = [
  { name: "Aster & Field", owner: "Nia Bennett", stage: "Active", health: "On track", updated: "Sep 03", value: 8400 },
  { name: "Northstar Works", owner: "Eli Navarro", stage: "Planning", health: "Needs input", updated: "Sep 01", value: 5250 },
  { name: "Atelier Nami", owner: "Sora Okafor", stage: "Review", health: "Complete", updated: "Aug 29", value: 12800 },
  { name: "Goodland Studio", owner: "Theo Marin", stage: "Active", health: "On track", updated: "Aug 26", value: 7900 },
  { name: "Form & Function", owner: "Nia Bennett", stage: "Planning", health: "At risk", updated: "Aug 22", value: 3600 },
  { name: "Cedar House", owner: "Eli Navarro", stage: "Review", health: "Needs input", updated: "Aug 18", value: 9150 },
  { name: "Orbit Supply", owner: "Sora Okafor", stage: "Active", health: "On track", updated: "Aug 16", value: 6700 },
]

export default function LedgerOpsDashboard({
  studio = "Halden Studio",
  title = "Studio overview",
  accounts = DEFAULT_ACCOUNTS,
  output = {
    "7d": { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], values: [18, 26, 31, 24, 38, 9, 6] },
    "30d": { labels: ["W1", "W2", "W3", "W4", "W5"], values: [112, 138, 126, 164, 184] },
    "12m": { labels: ["O", "N", "D", "J", "F", "M", "A", "M", "J", "J", "A", "S"], values: [410, 452, 380, 498, 530, 512, 601, 588, 640, 566, 702, 748] },
  },
  rhythm,
  theme: themeProp,
  height = "100svh",
  className = "",
}: LedgerOpsDashboardProps) {
  const root = useRef(null as HTMLDivElement | null)
  const [seen, setSeen] = useState(false)
  const [nav, setNav] = useState(0)
  const [range, setRange] = useState("30d" as Range)
  const [tab, setTab] = useState("All")
  const [theme, setTheme] = useState(themeProp || "light")

  useEffect(() => {
    const el = root.current
    if (!el) return
    // Follow a host's .dark class when no theme is forced.
    if (!themeProp && el.closest(".dark")) setTheme("dark")
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [themeProp])

  const heat = useMemo(
    () => rhythm || Array.from({ length: 7 }, (_, d) => Array.from({ length: 12 }, (_, w) => (d > 4 ? (w * 7 + d) % 5 === 0 ? 1 : 0 : Math.min(4, Math.round(((Math.sin(w * 1.7 + d * 2.3) + 1) / 2) * 3 + (w > 8 ? 1 : 0)))))),
    [rhythm],
  )
  const sums = heat.map((row) => row.reduce((s, v) => s + v, 0))
  const peakDay = sums.indexOf(Math.max(...sums))
  const series = output[range]
  const top = niceTop(Math.max(0, ...series.values))
  const total = series.values.reduce((s, v) => s + v, 0)
  const tabs = ["All", "Active", "Planning", "Review", "At risk"]
  const rows = filterRows(accounts, tab)
  const kpis = [
    { label: "Booked revenue", to: accounts.reduce((s, a) => s + a.value, 0), fmt: usd, d: "+11.2%", up: true, s: [3, 4, 3.6, 5, 4.8, 6, 6.4, 7.1] },
    { label: "Active accounts", to: accounts.filter((a) => a.stage === "Active").length + 25, fmt: (n: number) => String(Math.round(n)), d: "+3", up: true, s: [20, 21, 21, 23, 24, 26, 27, 28] },
    { label: "On-time delivery", to: 91, fmt: (n: number) => Math.round(n) + "%", d: "+4 pts", up: true, s: [80, 84, 82, 86, 85, 88, 90, 91] },
    { label: "Open flags", to: accounts.filter((a) => a.health === "At risk" || a.health === "Needs input").length, fmt: (n: number) => String(Math.round(n)), d: "+1", up: false, s: [5, 4, 4, 2, 3, 2, 2, 3] },
  ]

  return (
    <div ref={root} className={"lod-root " + (seen ? "lod-in " : "") + className} data-theme={theme} style={{ height }}>
      <style>{CSS}</style>
      <aside className="lod-side">
        <div className="lod-brand">
          <span className="lod-logo" aria-hidden="true">
            {studio[0]}
          </span>
          <span>
            {studio}
            <small>Operations</small>
          </span>
        </div>
        <div className="lod-find" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          Search workspace
        </div>
        <nav className="lod-nav" style={{ ["--n" as string]: nav }} aria-label="Sections">
          <span className="lod-mark" aria-hidden="true" />
          {NAV.map((n, i) => (
            <button key={n} type="button" className="lod-nb" aria-current={i === nav ? "page" : undefined} onClick={() => setNav(i)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={NAV_ICONS[i]} />
              </svg>
              {n}
            </button>
          ))}
        </nav>
        <div className="lod-bot">
          <button type="button" className="lod-sw" role="switch" aria-checked={theme === "dark"} onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
            </svg>
            Dark mode
            <i aria-hidden="true" />
          </button>
          <div className="lod-me">
            <span className="lod-av" style={{ ["--c" as string]: "#e5482b" }} aria-hidden="true">
              MV
            </span>
            <span>
              <b>Mara Voss</b>
              <small>Studio lead</small>
            </span>
          </div>
        </div>
      </aside>

      <main className="lod-main">
        <div className="lod-head">
          <div>
            <div className="lod-crumb">
              {studio} / {NAV[nav]}
            </div>
            <h1 className="lod-h1">{title}</h1>
          </div>
          <div className="lod-tools">
            <div className="lod-seg" role="group" aria-label="Range" style={{ ["--r" as string]: ["7d", "30d", "12m"].indexOf(range) }}>
              <i aria-hidden="true" />
              {(["7d", "30d", "12m"] as Range[]).map((r) => (
                <button key={r} type="button" aria-pressed={r === range} onClick={() => setRange(r)}>
                  {r}
                </button>
              ))}
            </div>
            <button type="button" className="lod-cta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New request
            </button>
          </div>
        </div>

        <div className="lod-grid">
          {kpis.map((k, i) => (
            <section key={k.label} className="lod-card" style={{ ["--i" as string]: i }}>
              <div className="lod-kl">{k.label}</div>
              <div className="lod-kv">
                <CountUp to={k.to} go={seen} format={k.fmt} />
              </div>
              <div className="lod-kf">
                <span className={"lod-dl" + (k.up ? "" : " lod-neg")}>{k.d}</span>
                <svg className="lod-spk" viewBox="0 0 84 28" aria-hidden="true">
                  <path d={spark(k.s)} pathLength={1} />
                </svg>
              </div>
            </section>
          ))}

          <section className="lod-card lod-wide" style={{ ["--i" as string]: 4 }}>
            <div className="lod-ct">
              <b>Delivery output</b>
              <span>points shipped · {range}</span>
            </div>
            <div className="lod-total">{total.toLocaleString("en-US")} pts</div>
            <div className="lod-chart">
              <div className="lod-y" aria-hidden="true">
                {[1, 0.5, 0].map((f) => (
                  <span key={f} style={{ top: (1 - f) * 100 + "%" }}>
                    {Math.round(top * f)}
                  </span>
                ))}
              </div>
              <div className="lod-plot" role="list" aria-label={"Delivery output, " + range}>
                {[0.5, 1].map((f) => (
                  <span key={f} className="lod-gl" style={{ bottom: f * 100 + "%" }} aria-hidden="true" />
                ))}
                {series.values.map((v, i) => (
                  <button
                    key={range + i}
                    type="button"
                    role="listitem"
                    className="lod-bar"
                    data-last={i === series.values.length - 1 ? "" : undefined}
                    style={{ ["--v" as string]: v / top, ["--i" as string]: i }}
                    aria-label={series.labels[i] + ": " + v + " points"}
                  >
                    <i />
                    <span className="lod-tip" aria-hidden="true">
                      {series.labels[i]} · {v}
                    </span>
                  </button>
                ))}
              </div>
              <div className="lod-xl" aria-hidden="true">
                {series.labels.map((l, i) => (
                  <span key={i}>{l}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="lod-card lod-heatc" style={{ ["--i" as string]: 5 }}>
            <div className="lod-ct">
              <b>Team rhythm</b>
              <span>commits / day</span>
            </div>
            <div className="lod-heat" role="img" aria-label={"Activity over the last " + heat[0].length + " weeks, darker is busier"}>
              {heat[0].map((_, w) =>
                heat.map((row, d) => <span key={w + "-" + d} className="lod-cell" style={{ ["--h" as string]: row[w], ["--d" as string]: w * 2 + d }} />),
              )}
            </div>
            <div className="lod-leg" aria-hidden="true">
              Less
              {[0, 1, 2, 3, 4].map((h) => (
                <i key={h} style={{ ["--h" as string]: h }} />
              ))}
              More
            </div>
            <div className="lod-peak">
              <span>Busiest day</span>
              <b>{DAYS[peakDay]}</b>
            </div>
          </section>

          <section className="lod-card" style={{ ["--i" as string]: 6, gridColumn: "1 / -1" }}>
            <div className="lod-ct">
              <b>Accounts</b>
              <span>{accounts.length} total</span>
            </div>
            <div className="lod-tabs" role="tablist" aria-label="Filter accounts">
              {tabs.map((t) => (
                <button key={t} type="button" role="tab" aria-selected={t === tab} className="lod-tab" onClick={() => setTab(t)}>
                  {t}
                  <em>{filterRows(accounts, t).length}</em>
                </button>
              ))}
            </div>
            <div className="lod-tblwrap">
              <table className="lod-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Stage</th>
                    <th>Health</th>
                    <th>Updated</th>
                    <th style={{ textAlign: "right" }}>Value</th>
                  </tr>
                </thead>
                <tbody key={tab}>
                  {rows.map((r, i) => (
                    <tr key={r.name} style={{ ["--i" as string]: i }}>
                      <td>
                        <span className="lod-acct">
                          <span className="lod-av" style={{ ["--c" as string]: AVC[(r.name.charCodeAt(0) + r.name.length) % AVC.length] }} aria-hidden="true">
                            {r.name
                              .split(/[\s&]+/)
                              .filter(Boolean)
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)}
                          </span>
                          <span>
                            {r.name}
                            <span style={{ display: "block", fontWeight: 400, fontSize: 12, color: "var(--mute)" }}>{r.owner}</span>
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className="lod-stage" style={{ ["--s" as string]: STAGE[r.stage] }}>
                          <i aria-hidden="true" />
                          {r.stage}
                        </span>
                      </td>
                      <td>
                        <span className="lod-hl" style={{ ["--s" as string]: STATUS[r.health] }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            {r.health === "On track" || r.health === "Complete" ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : r.health === "At risk" ? <path d="M12 7v6M12 17h.01" /> : <path d="M12 8v4l3 2" />}
                          </svg>
                          {r.health}
                        </span>
                      </td>
                      <td style={{ color: "var(--mute)" }}>{r.updated}</td>
                      <td className="lod-num">{usd(r.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
