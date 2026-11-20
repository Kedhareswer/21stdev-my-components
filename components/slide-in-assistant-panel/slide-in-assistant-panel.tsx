"use client"
import { useEffect, useRef, useState, type CSSProperties } from "react"

// #region model
/** One line of an answer: a paragraph, a numbered heading, or a bullet. */
export type AssistantBlock = ["p" | "h" | "li", string]

export interface AssistantReply {
  /** The suggestion text this reply answers. Typed questions match it exactly, or by `keys`. */
  prompt: string
  /** Lower-case fragments that also pick this reply ("short", "recap"). */
  keys?: string[]
  /** What the "Thought for N seconds" drop-down reveals. */
  reasoning: string
  /** Sources counted in the meta row (extra attachments add one each). */
  sources?: number
  blocks: AssistantBlock[]
  /** What "Insert into note" appends. Defaults to the answer's paragraphs joined. */
  insert?: string
}

export type AssistantMode = "fast" | "thorough"

/** Timings in seconds, measured off the reference at 1280 x 720. */
export const T = {
  /** Slot width and panel slide, cubic-bezier(.3,.7,.2,1). */
  slide: 0.52,
  /** Panel opacity, linear-ish default ease. */
  fade: 0.3,
  /** User turn rises in. */
  enter: 0.45,
  /** One character of the scripted prompt. */
  typeChar: 0.038,
  thinkFast: 1.1,
  thinkThorough: 2.2,
  /** One word of the streamed answer. */
  word: 0.03,
  /** Inserted paragraph keeps its highlight this long, then fades over `highlight`. */
  hold: 1.6,
  highlight: 1.2,
}

/** The scripted loop (autoPlay), seconds from the start of each cycle. */
export const AUTO = { open: 0.86, type: 1.96, send: 3.3, close: 9.21, loop: 11.06 }

export function words(s: string) {
  return s.split(/\s+/).filter(Boolean)
}

export function totalWords(blocks: AssistantBlock[]) {
  return blocks.reduce((n, b) => n + words(b[1]).length, 0)
}

/** The answer as it looks after `n` words have streamed in. Blocks with no words yet are left out. */
export function reveal(blocks: AssistantBlock[], n: number) {
  const out: AssistantBlock[] = []
  let left = n
  for (const [k, t] of blocks) {
    if (left <= 0) break
    const w = words(t)
    out.push([k, w.slice(0, left).join(" ")])
    left -= w.length
  }
  return out
}

export function pickReply(q: string, replies: AssistantReply[], fallback: AssistantReply) {
  const s = q.trim().toLowerCase()
  return (
    replies.find((r) => r.prompt.toLowerCase() === s) ||
    replies.find((r) => (r.keys || []).some((k) => s.includes(k))) ||
    fallback
  )
}

export function thoughtFor(mode: AssistantMode) {
  return mode === "thorough" ? 5 : 2
}

export function insertText(r: AssistantReply) {
  return r.insert || r.blocks.filter((b) => b[0] !== "h").slice(1).map((b) => b[1]).join(" ")
}
// #endregion

export interface AssistantNote {
  folder: string
  title: string
  date: string
  paragraphs: string[]
}

export interface AssistantFile {
  title: string
  meta: string
  kind?: "note" | "pdf"
}

export interface SlideInAssistantPanelProps {
  note?: AssistantNote
  /** Prompts listed in an empty chat. Defaults to the replies' prompts. */
  suggestions?: string[]
  replies?: AssistantReply[]
  /** Answer for a typed question that matches nothing. */
  fallback?: AssistantReply
  /** Extra files the + menu can attach. The note itself is always first. */
  files?: AssistantFile[]
  defaultOpen?: boolean
  /** Loops a scripted open → ask → stream → close until someone touches the component. */
  autoPlay?: boolean
  /** "push" squeezes the note; "overlay" floats the panel over it. */
  mode?: "push" | "overlay"
  panelWidth?: number
  /** Ctrl/Cmd J toggles the panel, Esc closes it. */
  shortcut?: boolean
  height?: string | number
  className?: string
  onOpenChange?: (open: boolean) => void
  onInsert?: (text: string) => void
}

const NOTE: AssistantNote = {
  folder: "Notes",
  title: "Friday recap",
  date: "Friday, November 14",
  paragraphs: [
    "The new onboarding checklist went out on Tuesday. Early numbers look good: more people finish setup, and fewer write in asking what to do next.",
    "Two things moved. The CSV import needs a few more days, and the pricing page is waiting on final numbers. Neither holds up the launch.",
    "Next week is about search. We'll start with the queries people run most, and keep the first version small.",
  ],
}

const REPLIES: AssistantReply[] = [
  {
    prompt: "Sum this up for the team",
    keys: ["sum", "recap", "team", "overview"],
    reasoning: "Read the note, pulled out what changed this week, and grouped it into three points.",
    sources: 3,
    blocks: [
      ["p", "A solid week. Three things stand out:"],
      ["h", "1. Onboarding is easier"],
      ["p", "The checklist is live, more people finish setup, and fewer ask for help."],
      ["h", "2. Two items move a few days"],
      ["p", "CSV import and the pricing page, and neither blocks the launch."],
      ["h", "3. Search is next"],
      ["p", "Starting with the most common queries, kept small."],
    ],
    insert: "For the team: onboarding is easier, CSV import and pricing move a few days without blocking the launch, and search is next.",
  },
  {
    prompt: "Make it shorter",
    keys: ["short", "brief", "condense", "tl;dr"],
    reasoning: "Kept the three points and cut each one down to a single line.",
    sources: 3,
    blocks: [
      ["p", "Here it is in three lines:"],
      ["p", "The onboarding checklist is live and more people finish setup."],
      ["p", "CSV import and pricing slip a few days; the launch is safe."],
      ["p", "Next up: a small first version of search."],
    ],
  },
  {
    prompt: "What's still open?",
    keys: ["open", "left", "pending", "todo", "blocked"],
    reasoning: "Looked for anything in the note that still has no date or no owner.",
    sources: 3,
    blocks: [
      ["p", "Two things are still open:"],
      ["h", "1. CSV import"],
      ["p", "Needs a few more days of testing."],
      ["h", "2. Pricing page"],
      ["p", "Waiting on the final numbers."],
      ["p", "Want me to add these as tasks at the end of the note?"],
    ],
    insert: "Open: CSV import (a few more days of testing) and the pricing page (waiting on final numbers).",
  },
]

const FALLBACK: AssistantReply = {
  prompt: "",
  reasoning: "Read the note looking for anything that answers the question.",
  sources: 2,
  blocks: [
    ["p", "Here's what this note covers:"],
    ["li", "The onboarding checklist shipped on Tuesday."],
    ["li", "CSV import and the pricing page move a few days."],
    ["li", "Search starts next week, kept small."],
    ["p", "Ask me to sum it up, shorten it, or list what's still open."],
  ],
  insert: "This week: onboarding checklist shipped, CSV import and pricing move a few days, search starts next week.",
}

const FILES: AssistantFile[] = [{ title: "launch-plan.pdf", meta: "PDF · 4 pages", kind: "pdf" }]

const CSS =
  ".sap-root{--sap-ink:var(--color-foreground,#161616);--sap-bgc:var(--color-background,#fff);--sap-muted:var(--color-muted-foreground,#8d8d86);--sap-line:var(--color-border,#ececea);" +
  "--sap-text:color-mix(in oklab,var(--sap-ink) 88%,var(--sap-bgc));--sap-body:color-mix(in oklab,var(--sap-ink) 80%,var(--sap-bgc));--sap-sub:color-mix(in oklab,var(--sap-ink) 68%,var(--sap-bgc));" +
  "--sap-faint:color-mix(in oklab,var(--sap-muted) 75%,var(--sap-bgc));--sap-soft:color-mix(in oklab,var(--sap-ink) 4.5%,var(--sap-bgc));--sap-press:color-mix(in oklab,var(--sap-ink) 6%,var(--sap-bgc));" +
  "--sap-pill:color-mix(in oklab,var(--sap-ink) 90%,var(--sap-bgc));--sap-shine:color-mix(in oklab,var(--sap-muted) 30%,var(--sap-bgc));--sap-pad:28px;" +
  "position:relative;box-sizing:border-box;width:100%;overflow:hidden;container-type:inline-size;color:var(--sap-ink);font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;text-align:left;" +
  "background:radial-gradient(120% 90% at 85% 100%,color-mix(in oklab,#8fb27a 42%,var(--sap-bgc)) 0%,transparent 60%),radial-gradient(90% 70% at 10% 0%,color-mix(in oklab,#8fb27a 5%,var(--sap-bgc)) 0%,transparent 70%),color-mix(in oklab,#8fb27a 21%,var(--sap-bgc))}" +
  ".sap-root :where(*){box-sizing:border-box}" +
  ".sap-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit;letter-spacing:inherit}" +
  ".sap-root :where(h1),.sap-root :where(h3),.sap-root :where(h4),.sap-root :where(p){margin:0;font-size:inherit;font-weight:inherit}" +
  ".sap-root :where(svg){display:block;flex:none;max-width:none}" +
  ".sap-root :where(button):focus-visible{outline:2px solid color-mix(in oklab,var(--sap-ink) 45%,transparent);outline-offset:2px}" +
  ".sap-row{position:relative;display:flex;height:100%;padding:var(--sap-pad)}" +
  ".sap-card{background:var(--sap-bgc);border-radius:22px;display:flex;flex-direction:column;min-height:0;overflow:hidden}" +
  ".sap-app{flex:1;min-width:0}" +
  ".sap-slot{width:0;flex:none;display:flex;justify-content:flex-end;overflow:hidden;transition:width .52s cubic-bezier(.3,.7,.2,1)}" +
  ".sap-open .sap-slot{width:calc(var(--sap-w) + 8px)}" +
  ".sap-panel{width:var(--sap-w);flex:none;transform:translateX(24px);opacity:0;transition:transform .52s cubic-bezier(.3,.7,.2,1),opacity .3s ease}" +
  ".sap-open .sap-panel{transform:translateX(0);opacity:1}" +
  ".sap-over .sap-slot{position:absolute;top:var(--sap-pad);right:var(--sap-pad);bottom:var(--sap-pad);width:var(--sap-w);pointer-events:none;overflow:visible}" +
  ".sap-over.sap-open .sap-slot{pointer-events:auto}" +
  ".sap-over .sap-panel{border:1px solid var(--sap-line)}" +
  ".sap-bar{height:60px;flex:none;display:flex;align-items:center;gap:8px;padding:0 14px 0 22px;border-bottom:1px solid color-mix(in oklab,var(--sap-line) 70%,var(--sap-bgc))}" +
  ".sap-logo{display:flex;align-items:center;color:var(--sap-ink)}" +
  ".sap-crumb{min-width:0;color:var(--sap-muted);margin-left:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".sap-crumb b{color:var(--sap-ink);font-weight:500}" +
  ".sap-sp{flex:1}" +
  ".sap-saved{color:var(--sap-muted);font-size:13px;margin-right:8px;display:flex;align-items:center;gap:6px;white-space:nowrap}" +
  ".sap-saved i{width:6px;height:6px;border-radius:50%;background:#3fae6a}" +
  ".sap-tg{width:36px;height:36px;flex:none;border-radius:11px;display:grid;place-items:center;color:var(--sap-sub);border:1px solid var(--sap-line);transition:background-color .2s,border-color .2s,color .2s}" +
  ".sap-tg:hover{background:var(--sap-soft)}" +
  ".sap-open .sap-tg{background:var(--sap-press);border-color:var(--sap-press);color:var(--sap-ink)}" +
  ".sap-main{flex:1;min-height:0;overflow:auto;scrollbar-width:none}" +
  ".sap-main::-webkit-scrollbar,.sap-feed::-webkit-scrollbar,.sap-ta::-webkit-scrollbar{display:none}" +
  ".sap-doc{width:540px;max-width:calc(100% - 48px);margin:0 auto;padding:64px 24px 40px;box-sizing:content-box}" +
  ".sap-date{color:var(--sap-muted);font-size:13px}" +
  ".sap-doc h1{font-size:34px;font-weight:400;letter-spacing:-.8px;margin-top:10px;line-height:1.2;color:var(--sap-ink)}" +
  ".sap-doc p{font-size:15.5px;line-height:1.7;color:var(--sap-body);margin-top:18px;border-radius:6px;transition:background-color 1.2s ease}" +
  ".sap-doc p.sap-new{background:color-mix(in oklab,#3b6cff 9%,var(--sap-bgc))}" +
  ".sap-ph{height:60px;flex:none;display:flex;align-items:center;gap:2px;padding:0 12px 0 22px}" +
  ".sap-ph b{flex:1;min-width:0;font-weight:500;font-size:17px;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".sap-hb{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;color:var(--sap-ink);transition:background-color .15s}" +
  ".sap-hb:hover{background:var(--sap-soft)}" +
  ".sap-feed{flex:1;min-height:0;overflow-y:auto;scrollbar-width:none;padding:8px 20px 20px;display:flex;flex-direction:column;line-height:1.6}" +
  ".sap-empty{margin:auto 0;padding-bottom:20px;display:flex;flex-direction:column;align-items:flex-start;gap:6px}" +
  ".sap-empty h3{font-size:22px;font-weight:400;letter-spacing:-.4px;margin:14px 0 10px;line-height:1.3}" +
  ".sap-sug{display:flex;align-items:center;gap:8px;padding:7px 0;font-size:14.5px;color:var(--sap-sub);transition:color .2s}" +
  ".sap-sug svg{color:var(--sap-faint);transition:transform .2s,color .2s}" +
  ".sap-sug:hover{color:var(--sap-ink)}" +
  ".sap-sug:hover svg{transform:translateX(3px);color:var(--sap-ink)}" +
  ".sap-att{position:relative;display:flex;align-items:center;gap:10px;width:max-content;max-width:240px;padding:9px 14px 9px 10px;border-radius:14px;background:var(--sap-soft);line-height:1.3}" +
  ".sap-att-ic{width:30px;height:30px;flex:none;border-radius:9px;background:var(--sap-bgc);display:grid;place-items:center;color:var(--sap-ink)}" +
  ".sap-att-t{min-width:0}" +
  ".sap-att-t b{display:block;font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".sap-att-t span{display:block;font-size:12.5px;color:var(--sap-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".sap-rm{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:var(--sap-bgc);border:1px solid var(--sap-line);display:grid;place-items:center;color:var(--sap-ink)}" +
  ".sap-turn{display:flex;flex-direction:column;margin-top:22px}" +
  ".sap-turn:first-child{margin-top:12px}" +
  ".sap-u{align-self:flex-end;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;max-width:100%;margin-bottom:8px;animation:sap-up .45s cubic-bezier(.3,.7,.2,1) both}" +
  ".sap-bub{align-self:flex-end;max-width:88%;padding:10px 18px;border-radius:22px;background:var(--sap-pill);color:var(--sap-bgc);font-size:14.5px;line-height:1.45;overflow-wrap:anywhere;animation:sap-up .45s cubic-bezier(.3,.7,.2,1) both}" +
  "@keyframes sap-up{from{opacity:0;transform:translateY(10px)}}" +
  "@keyframes sap-fade{from{opacity:0}}" +
  ".sap-meta{display:flex;align-items:center;gap:6px;min-height:22px;margin-top:20px;color:var(--sap-muted);font-size:13.5px;line-height:22px}" +
  ".sap-th{display:flex;align-items:center;gap:4px;transition:color .15s}" +
  ".sap-th svg{transition:transform .25s ease}" +
  ".sap-th.sap-x svg{transform:rotate(90deg)}" +
  ".sap-src{margin-left:auto;display:flex;align-items:center;gap:6px;transition:color .15s}" +
  ".sap-src i{width:5px;height:5px;border-radius:50%;background:currentColor}" +
  ".sap-th:hover,.sap-src:hover{color:var(--sap-ink)}" +
  ".sap-shim{background:linear-gradient(90deg,var(--sap-muted) 0%,var(--sap-muted) 40%,var(--sap-shine) 50%,var(--sap-muted) 60%,var(--sap-muted) 100%) 0 0/250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sap-sh 1.4s linear infinite}" +
  "@keyframes sap-sh{from{background-position:100% 0}to{background-position:-50% 0}}" +
  ".sap-drop{margin-top:6px;padding-left:12px;border-left:2px solid var(--sap-line);color:var(--sap-muted);font-size:13px;line-height:1.55;animation:sap-fade .25s both}" +
  ".sap-ans{display:flex;gap:12px;margin-top:10px}" +
  ".sap-mk{flex:none;margin-top:4px;color:var(--sap-ink)}" +
  ".sap-t{flex:1;min-width:0;font-size:14.5px;color:var(--sap-text)}" +
  ".sap-t p+p{margin-top:8px}" +
  ".sap-t h4{margin-top:14px;font-size:14.5px;font-weight:500;color:var(--sap-ink)}" +
  ".sap-t h4+p{margin-top:2px;color:var(--sap-body)}" +
  ".sap-li{position:relative;padding-left:14px}" +
  ".sap-li::before{content:'';position:absolute;left:2px;top:.7em;width:4px;height:4px;border-radius:50%;background:currentColor}" +
  ".sap-caret{display:inline-block;width:7px;height:7px;margin-left:5px;border-radius:50%;background:var(--sap-ink);vertical-align:middle;animation:sap-bl 1s ease-in-out infinite}" +
  "@keyframes sap-bl{50%{opacity:.25}}" +
  ".sap-stopped{color:var(--sap-muted)}" +
  ".sap-acts{display:flex;align-items:center;gap:2px;margin:12px 0 0 26px;color:var(--sap-muted);animation:sap-fade .35s both}" +
  ".sap-acts button{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;transition:background-color .15s,color .15s}" +
  ".sap-acts button:hover{background:var(--sap-soft);color:var(--sap-ink)}" +
  ".sap-acts button.sap-on{color:var(--sap-ink)}" +
  ".sap-acts .sap-lbl{width:auto;padding:0 8px;font-size:13.5px;white-space:nowrap}" +
  ".sap-acts .sap-lbl.sap-on{background:var(--sap-soft)}" +
  ".sap-sep{width:1px;height:16px;margin:0 8px;background:var(--sap-line)}" +
  ".sap-boxw{position:relative;flex:none;margin:0 12px 12px}" +
  ".sap-box{position:relative;border:1px solid var(--sap-line);border-radius:18px;padding:12px;transition:border-color .2s}" +
  ".sap-box:focus-within{border-color:color-mix(in oklab,var(--sap-line) 65%,var(--sap-muted))}" +
  ".sap-ctx{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}" +
  ".sap-ctx .sap-att{padding-right:22px;animation:sap-up .3s both}" +
  ".sap-ta{display:block;width:100%;min-height:22px;max-height:140px;field-sizing:content;margin:0;padding:0 2px;border:0;outline:0;resize:none;background:none;font:inherit;font-size:14.5px;line-height:1.5;color:var(--sap-ink);scrollbar-width:none;box-shadow:none}" +
  ".sap-ta::placeholder{color:var(--sap-faint);opacity:1}" +
  ".sap-brow{display:flex;align-items:center;gap:10px;margin-top:20px}" +
  ".sap-model{height:32px;padding:0 12px;border-radius:10px;border:1px solid var(--sap-line);display:flex;align-items:center;gap:7px;font-size:13.5px;white-space:nowrap;transition:background-color .15s}" +
  ".sap-model i{width:8px;height:8px;border-radius:50%;background:var(--sap-ink)}" +
  ".sap-model:hover,.sap-plus:hover{background:var(--sap-soft)}" +
  ".sap-vs{width:1px;height:16px;background:var(--sap-line)}" +
  ".sap-plus{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:var(--sap-muted);transition:background-color .15s}" +
  ".sap-send{margin-left:auto;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--sap-press);color:var(--sap-faint);transition:background-color .2s,color .2s}" +
  ".sap-send.sap-go{background:var(--sap-ink);color:var(--sap-bgc)}" +
  ".sap-menu{position:absolute;left:0;bottom:calc(100% + 8px);z-index:5;width:220px;padding:6px;border-radius:14px;border:1px solid var(--sap-line);background:var(--sap-bgc);opacity:0;transform:translateY(6px);pointer-events:none;visibility:hidden;transition:opacity .18s,transform .18s,visibility .18s}" +
  ".sap-menu.sap-on{opacity:1;transform:translateY(0);pointer-events:auto;visibility:visible}" +
  ".sap-menu button{width:100%;display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px}" +
  ".sap-menu button:hover{background:var(--sap-soft)}" +
  ".sap-menu button:disabled{opacity:.4;cursor:default;background:none}" +
  ".sap-menu small{display:block;font-size:12px;color:var(--sap-muted)}" +
  ".sap-ck{margin-left:auto}" +
  ".sap-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@container (max-width:700px){" +
  ".sap-row{--sap-pad:10px}" +
  ".sap-row .sap-slot{position:absolute;top:var(--sap-pad);left:var(--sap-pad);right:var(--sap-pad);bottom:var(--sap-pad);width:auto;pointer-events:none;overflow:visible}" +
  ".sap-open .sap-row .sap-slot{pointer-events:auto}" +
  ".sap-row .sap-panel{width:100%;transform:translateY(30px)}" +
  ".sap-open .sap-row .sap-panel{transform:translateY(0)}" +
  ".sap-saved{display:none}" +
  ".sap-doc{padding-top:40px}}" +
  "@media (prefers-reduced-motion:reduce){" +
  ".sap-slot,.sap-row .sap-slot,.sap-panel,.sap-row .sap-panel,.sap-menu,.sap-doc p,.sap-sug svg,.sap-th svg{transition:none}" +
  ".sap-shim,.sap-caret,.sap-u,.sap-bub,.sap-acts,.sap-drop,.sap-ctx .sap-att{animation:none}}"

type Phase = "think" | "stream" | "done"

interface Turn {
  id: number
  q: string
  atts: AssistantFile[]
  reply: AssistantReply
  mode: AssistantMode
  phase: Phase
  n: number
  open: boolean
  fb: number
  copied: boolean
  inserted: boolean
  stopped: boolean
}

interface Added {
  id: number
  text: string
  fresh: boolean
}

const Ico = {
  logo: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 3.5h9.5L20 9v11.5H5z" fill="currentColor" />
      <path d="M14.5 3.5V9H20" fill="none" stroke="var(--sap-bgc)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  mark: (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5c.7 5.2 4 8.7 9.5 9.5-5.5.8-8.8 4.3-9.5 9.5-.7-5.2-4-8.7-9.5-9.5 5.5-.8 8.8-4.3 9.5-9.5z" fill="currentColor" />
    </svg>
  ),
  panel: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3.5" />
      <path d="M14.5 4v16" />
    </svg>
  ),
  pen: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h8M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  ),
  x: (s: number, w: number) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  arrow: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  chev: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  doc: (pdf: boolean) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={"M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20zM14 3.5V8h4" + (pdf ? "M9 13h6M9 16.5h4" : "")} />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  up: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  ),
  stop: (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
    </svg>
  ),
  check: (s: number) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  ),
  copy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  ),
  thumb: (down: boolean, on: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} fillOpacity={on ? 0.14 : 0} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={down ? { transform: "scaleY(-1)" } : undefined}>
      <path d="M7 10v10H4V10zM7 10l4-7a2 2 0 0 1 2.6 2.4L13 9h5.5a2 2 0 0 1 2 2.4l-1.5 7A2 2 0 0 1 17 20H7z" />
    </svg>
  ),
  again: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5" />
    </svg>
  ),
}

function Att({ f, onRemove }: { f: AssistantFile; onRemove?: () => void }) {
  return (
    <div className="sap-att">
      <span className="sap-att-ic">{Ico.doc(f.kind === "pdf")}</span>
      <span className="sap-att-t">
        <b>{f.title}</b>
        <span>{f.meta}</span>
      </span>
      {onRemove && (
        <button type="button" className="sap-rm" aria-label={"Remove " + f.title} onClick={onRemove}>
          {Ico.x(9, 3)}
        </button>
      )}
    </div>
  )
}

export default function SlideInAssistantPanel({
  note = NOTE,
  suggestions,
  replies = REPLIES,
  fallback = FALLBACK,
  files = FILES,
  defaultOpen = false,
  autoPlay = false,
  mode = "push",
  panelWidth = 400,
  shortcut = true,
  height = "100svh",
  className,
  onOpenChange,
  onInsert,
}: SlideInAssistantPanelProps) {
  const noteFile: AssistantFile = { title: note.title, meta: note.folder + " · " + note.paragraphs.length + " paragraphs", kind: "note" }
  const sugs = suggestions || replies.map((r) => r.prompt)

  const [open, setOpenRaw] = useState(defaultOpen)
  const [turns, setTurns] = useState([] as Turn[])
  const [ctx, setCtx] = useState([noteFile] as AssistantFile[])
  const [text, setText] = useState("")
  const [menu, setMenu] = useState("" as "" | "plus" | "model")
  const [model, setModel] = useState("fast" as AssistantMode)
  const [added, setAdded] = useState([] as Added[])
  const [busy, setBusy] = useState(0)
  const [auto, setAuto] = useState(autoPlay)
  const [status, setStatus] = useState("")

  const rootRef = useRef(null as HTMLDivElement | null)
  const slotRef = useRef(null as HTMLDivElement | null)
  const feedRef = useRef(null as HTMLDivElement | null)
  const mainRef = useRef(null as HTMLDivElement | null)
  const taRef = useRef(null as HTMLTextAreaElement | null)
  const tgRef = useRef(null as HTMLButtonElement | null)
  const run = useRef({ iv: 0, to: 0, id: 0 })
  const timers = useRef(new Set() as Set<number>)
  const seq = useRef(0)
  const stick = useRef(false)
  const reduced = useRef(false)
  const openRef = useRef(open)
  openRef.current = open
  const menuRef = useRef(menu)
  menuRef.current = menu
  const autoRef = useRef(auto)
  autoRef.current = auto

  const later = (ms: number, fn: () => void) => {
    const t = window.setTimeout(() => {
      timers.current.delete(t)
      fn()
    }, ms)
    timers.current.add(t)
    return t
  }

  const setOpen = (v: boolean) => {
    setOpenRaw(v)
    setMenu("")
    if (v !== openRef.current) onOpenChange?.(v)
  }

  const patch = (id: number, p: Partial<Turn>) => setTurns((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t)))

  const settle = () => {
    window.clearInterval(run.current.iv)
    window.clearTimeout(run.current.to)
    run.current = { iv: 0, to: 0, id: 0 }
    setBusy(0)
    // Stay pinned for the render that adds the action row, then let go.
    later(120, () => {
      const f = feedRef.current
      if (f && stick.current) f.scrollTop = 1e6
      stick.current = false
    })
  }

  const stream = (id: number, reply: AssistantReply) => {
    const total = totalWords(reply.blocks)
    if (reduced.current) {
      patch(id, { phase: "done", n: total })
      setStatus("Answer ready")
      settle()
      return
    }
    patch(id, { phase: "stream", n: 0 })
    let n = 0
    run.current.iv = window.setInterval(() => {
      n++
      if (n >= total) {
        patch(id, { phase: "done", n: total })
        setStatus("Answer ready")
        settle()
      } else patch(id, { n })
    }, T.word * 1000)
  }

  const think = (id: number, reply: AssistantReply, m: AssistantMode) => {
    run.current.id = id
    setBusy(id)
    stick.current = true
    setStatus("Thinking")
    run.current.to = window.setTimeout(() => stream(id, reply), (m === "thorough" ? T.thinkThorough : T.thinkFast) * 1000)
  }

  const send = (q: string) => {
    const s = q.trim()
    if (!s || run.current.id) return
    const reply = pickReply(s, replies, fallback)
    const id = ++seq.current
    setTurns((ts) => [...ts, { id, q: s, atts: ctx, reply, mode: model, phase: "think", n: 0, open: false, fb: 0, copied: false, inserted: false, stopped: false }])
    setText("")
    setMenu("")
    think(id, reply, model)
  }
  const sendRef = useRef(send)
  sendRef.current = send

  const stop = () => {
    const id = run.current.id
    if (!id) return
    setTurns((ts) => ts.map((t) => (t.id === id ? { ...t, phase: "done", stopped: true } : t)))
    setStatus("Stopped")
    settle()
  }

  const regenerate = (t: Turn) => {
    if (run.current.id) return
    patch(t.id, { phase: "think", n: 0, open: false, inserted: false, copied: false, fb: 0, stopped: false, mode: model })
    think(t.id, t.reply, model)
  }

  const newChat = () => {
    stop()
    setTurns([])
    setText("")
    setStatus("")
  }

  const insert = (t: Turn) => {
    if (t.inserted) return
    const body = insertText(t.reply)
    const id = ++seq.current
    setAdded((a) => [...a, { id, text: body, fresh: true }])
    patch(t.id, { inserted: true })
    onInsert?.(body)
    later(60, () => mainRef.current?.scrollTo({ top: 1e6, behavior: reduced.current ? "auto" : "smooth" }))
    later(T.hold * 1000, () => setAdded((a) => a.map((x) => (x.id === id ? { ...x, fresh: false } : x))))
  }

  const copy = (t: Turn) => {
    const body = t.reply.blocks.map((b) => b[1]).join("\n")
    navigator.clipboard?.writeText(body).catch(() => {})
    patch(t.id, { copied: true })
    later(1400, () => patch(t.id, { copied: false }))
  }

  const stopAuto = () => {
    if (autoRef.current) setAuto(false)
  }

  const toggle = (from: "user" | "script") => {
    const v = !openRef.current
    setOpen(v)
    if (from === "user" && v) later(T.slide * 500, () => taRef.current?.focus({ preventScroll: true }))
  }

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    reduced.current = mq.matches
    const on = () => (reduced.current = mq.matches)
    mq.addEventListener("change", on)
    const set = timers.current
    return () => {
      mq.removeEventListener("change", on)
      set.forEach((t) => window.clearTimeout(t))
      window.clearInterval(run.current.iv)
      window.clearTimeout(run.current.to)
    }
  }, [])

  // Closed panel: out of the tab order and the accessibility tree.
  useEffect(() => {
    const s = slotRef.current
    if (s) s.inert = !open
  }, [open])

  // Keep the newest words in view while an answer streams, unless the reader scrolled up.
  useEffect(() => {
    const f = feedRef.current
    if (f && stick.current) f.scrollTop = 1e6
  }, [turns])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current
      if (!root) return
      if (shortcut && (e.ctrlKey || e.metaKey) && !e.altKey && (e.key === "j" || e.key === "J")) {
        e.preventDefault()
        stopAuto()
        toggle("user")
        return
      }
      if (e.key !== "Escape") return
      const a = document.activeElement
      if (a && a !== document.body && !root.contains(a)) return
      if (menuRef.current) setMenu("")
      else if (shortcut && openRef.current) {
        stopAuto()
        setOpen(false)
        tgRef.current?.focus({ preventScroll: true })
      }
    }
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current) return
      const el = e.target as Element | null
      if (!el || !el.closest || !el.closest(".sap-menu,.sap-model,.sap-plus")) setMenu("")
    }
    window.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  })

  // The scripted loop: open, type the first suggestion, ask, stream, close, start over.
  useEffect(() => {
    if (!auto) return
    const ts: number[] = []
    const at = (s: number, fn: () => void) => ts.push(window.setTimeout(fn, s * 1000))
    const q = sugs[0] || ""
    const cycle = () => {
      ts.length = 0
      if (run.current.id) settle()
      setTurns([])
      setText("")
      setCtx([noteFile])
      setOpen(false)
      at(AUTO.open, () => setOpen(true))
      if (reduced.current) at(AUTO.type, () => setText(q))
      else for (let i = 1; i <= q.length; i++) at(AUTO.type + (i - 1) * T.typeChar, () => setText(q.slice(0, i)))
      at(AUTO.send, () => sendRef.current(q))
      at(AUTO.close, () => setOpen(false))
      at(AUTO.loop, cycle)
    }
    cycle()
    return () => ts.forEach((t) => window.clearTimeout(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto])

  const title = turns.length ? turns[0].q : "New chat"
  const attached = (f: AssistantFile) => ctx.some((c) => c.title === f.title)
  const style = { height, "--sap-w": panelWidth + "px" } as CSSProperties

  return (
    <div
      ref={rootRef}
      className={"sap-root" + (open ? " sap-open" : "") + (mode === "overlay" ? " sap-over" : "") + (className ? " " + className : "")}
      style={style}
      onPointerDownCapture={stopAuto}
      onKeyDownCapture={stopAuto}
    >
      <style>{CSS}</style>
      <div className="sap-row">
        <section className="sap-card sap-app" aria-label={note.title}>
          <div className="sap-bar">
            <span className="sap-logo">{Ico.logo}</span>
            <span className="sap-crumb">
              {note.folder} / <b>{note.title}</b>
            </span>
            <span className="sap-sp" />
            <span className="sap-saved">
              <i />
              Saved
            </span>
            <button
              ref={tgRef}
              type="button"
              className="sap-tg"
              aria-label="Assistant"
              aria-expanded={open}
              title={shortcut ? "Assistant (Ctrl J)" : "Assistant"}
              onClick={() => toggle("user")}
            >
              {Ico.panel}
            </button>
          </div>
          <div className="sap-main" ref={mainRef}>
            <article className="sap-doc">
              <div className="sap-date">{note.date}</div>
              <h1>{note.title}</h1>
              {note.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {added.map((a) => (
                <p key={a.id} className={a.fresh ? "sap-new" : undefined}>
                  {a.text}
                </p>
              ))}
            </article>
          </div>
        </section>

        <div className="sap-slot" ref={slotRef}>
          <section className="sap-card sap-panel" aria-label="Assistant">
            <div className="sap-ph">
              <b>{title}</b>
              <button type="button" className="sap-hb" aria-label="New chat" title="New chat" onClick={newChat}>
                {Ico.pen}
              </button>
              <button
                type="button"
                className="sap-hb"
                aria-label="Close panel"
                title="Close (Esc)"
                onClick={() => {
                  setOpen(false)
                  tgRef.current?.focus({ preventScroll: true })
                }}
              >
                {Ico.x(18, 1.8)}
              </button>
            </div>

            <div
              className="sap-feed"
              ref={feedRef}
              aria-busy={busy > 0}
              onWheel={(e) => {
                if (e.deltaY < 0) stick.current = false
              }}
            >
              {turns.length === 0 ? (
                <div className="sap-empty">
                  {Ico.mark(24)}
                  <h3>Ask about this note</h3>
                  {sugs.map((s) => (
                    <button key={s} type="button" className="sap-sug" onClick={() => send(s)}>
                      {Ico.arrow}
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                turns.map((t) => {
                  const shown = reveal(t.reply.blocks, t.n)
                  const live = t.phase === "stream"
                  return (
                    <div className="sap-turn" key={t.id}>
                      {t.atts.length > 0 && (
                        <div className="sap-u">
                          {t.atts.map((f) => (
                            <Att key={f.title} f={f} />
                          ))}
                        </div>
                      )}
                      <div className="sap-bub">{t.q}</div>
                      <div className="sap-meta">
                        {t.phase === "think" ? (
                          <span className="sap-shim">Thinking…</span>
                        ) : t.stopped && t.n === 0 ? (
                          <span>Stopped</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={"sap-th" + (t.open ? " sap-x" : "")}
                              aria-expanded={t.open}
                              onClick={() => patch(t.id, { open: !t.open })}
                            >
                              Thought for {thoughtFor(t.mode)} seconds {Ico.chev}
                            </button>
                            <button type="button" className="sap-src">
                              <i />
                              {(t.reply.sources ?? 3) + Math.max(0, t.atts.length - 1)} sources
                            </button>
                          </>
                        )}
                      </div>
                      {t.open && t.phase !== "think" && <div className="sap-drop">{t.reply.reasoning}</div>}
                      {shown.length > 0 && (
                        <div className="sap-ans">
                          <span className="sap-mk">{Ico.mark(20)}</span>
                          <div className="sap-t">
                            {shown.map(([k, s], i) => {
                              const caret = live && i === shown.length - 1 ? <span className="sap-caret" aria-hidden="true" /> : null
                              return k === "h" ? (
                                <h4 key={i}>
                                  {s}
                                  {caret}
                                </h4>
                              ) : (
                                <p key={i} className={k === "li" ? "sap-li" : undefined}>
                                  {s}
                                  {caret}
                                </p>
                              )
                            })}
                            {t.stopped && <p className="sap-stopped">Stopped</p>}
                          </div>
                        </div>
                      )}
                      {t.phase === "done" && t.n > 0 && (
                        <div className="sap-acts">
                          <button type="button" aria-label={t.copied ? "Copied" : "Copy"} className={t.copied ? "sap-on" : ""} onClick={() => copy(t)}>
                            {t.copied ? Ico.check(16) : Ico.copy}
                          </button>
                          <button type="button" aria-label="Good reply" aria-pressed={t.fb === 1} className={t.fb === 1 ? "sap-on" : ""} onClick={() => patch(t.id, { fb: t.fb === 1 ? 0 : 1 })}>
                            {Ico.thumb(false, t.fb === 1)}
                          </button>
                          <button type="button" aria-label="Bad reply" aria-pressed={t.fb === -1} className={t.fb === -1 ? "sap-on" : ""} onClick={() => patch(t.id, { fb: t.fb === -1 ? 0 : -1 })}>
                            {Ico.thumb(true, t.fb === -1)}
                          </button>
                          <button type="button" aria-label="Regenerate" onClick={() => regenerate(t)}>
                            {Ico.again}
                          </button>
                          <span className="sap-sep" />
                          <button type="button" className={"sap-lbl" + (t.inserted ? " sap-on" : "")} onClick={() => insert(t)}>
                            {t.inserted ? "Inserted" : "Insert into note"}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            <span className="sap-sr" aria-live="polite">
              {status}
            </span>

            <div className="sap-boxw">
              <div className={"sap-menu" + (menu === "plus" ? " sap-on" : "")} role="menu" aria-label="Add context">
                {[noteFile, ...files].map((f) => (
                  <button
                    key={f.title}
                    type="button"
                    role="menuitem"
                    disabled={attached(f)}
                    tabIndex={menu === "plus" ? 0 : -1}
                    onClick={() => {
                      setCtx((c) => [...c, f])
                      setMenu("")
                    }}
                  >
                    {Ico.doc(f.kind === "pdf")}
                    <span>
                      {f.title}
                      <small>{f.meta}</small>
                    </span>
                  </button>
                ))}
              </div>
              <div className={"sap-menu" + (menu === "model" ? " sap-on" : "")} role="menu" aria-label="Model">
                {(
                  [
                    ["fast", "Fast", "Quick answers"],
                    ["thorough", "Thorough", "Thinks longer, reads more"],
                  ] as [AssistantMode, string, string][]
                ).map(([k, label, sub]) => (
                  <button
                    key={k}
                    type="button"
                    role="menuitemradio"
                    aria-checked={model === k}
                    tabIndex={menu === "model" ? 0 : -1}
                    onClick={() => {
                      setModel(k)
                      setMenu("")
                    }}
                  >
                    <span>
                      {label}
                      <small>{sub}</small>
                    </span>
                    <span className="sap-ck">{model === k && Ico.check(16)}</span>
                  </button>
                ))}
              </div>

              <form
                className="sap-box"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (busy) stop()
                  else send(text)
                }}
              >
                {ctx.length > 0 && (
                  <div className="sap-ctx">
                    {ctx.map((f) => (
                      <Att key={f.title} f={f} onRemove={() => setCtx((c) => c.filter((x) => x.title !== f.title))} />
                    ))}
                  </div>
                )}
                <textarea
                  ref={taRef}
                  className="sap-ta"
                  rows={1}
                  value={text}
                  placeholder="Ask about this note…"
                  aria-label="Message"
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault()
                      if (!busy) send(text)
                    }
                  }}
                />
                <div className="sap-brow">
                  <button
                    type="button"
                    className="sap-model"
                    aria-label={"Model: " + (model === "fast" ? "Fast" : "Thorough")}
                    aria-haspopup="menu"
                    aria-expanded={menu === "model"}
                    onClick={() => setMenu(menu === "model" ? "" : "model")}
                  >
                    <i />
                    {model === "fast" ? "Fast" : "Thorough"}
                  </button>
                  <span className="sap-vs" />
                  <button
                    type="button"
                    className="sap-plus"
                    aria-label="Add context"
                    aria-haspopup="menu"
                    aria-expanded={menu === "plus"}
                    onClick={() => setMenu(menu === "plus" ? "" : "plus")}
                  >
                    {Ico.plus}
                  </button>
                  <button type="submit" className={"sap-send" + (busy || text.trim() ? " sap-go" : "")} aria-label={busy ? "Stop" : "Send"}>
                    {busy ? Ico.stop : Ico.up}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
