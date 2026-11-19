"use client"

import * as React from "react"

/**
 * Serum Product Card — a dark teal buy section for a single product. The card
 * pairs a moody product photograph with the details: name, one-line promise,
 * price, size pills, a wide "Add to bag" pill that carries the price, the
 * shipping and returns lines, and an ingredients accordion.
 *
 * Motion: the card rises into place when it scrolls into view. Picking a size
 * rolls the price to the new amount in both places it shows. Adding to the
 * bag swaps the label for a check, then settles back. The accordion opens on
 * a height transition and its plus turns into a cross. All of it is instant
 * under prefers-reduced-motion.
 *
 * Self-contained: React is the only import. The photograph comes from the
 * catalog site and was generated with ChatGPT.
 */

export interface SerumSize {
  label: string
  price: number
}

export interface SerumProductCardProps {
  name?: string
  tagline?: string
  sizes?: SerumSize[]
  currency?: string
  /** Lines under the button. */
  notes?: string[]
  /** Shown inside the accordion; its count goes into the accordion's label. */
  ingredients?: string[]
  imageSrc?: string
  imageAlt?: string
  addLabel?: string
  addedLabel?: string
  onAddToBag?: (size: SerumSize) => void
  /** Minimum height of the section. Must be a definite length. */
  height?: string
  /** Google Fonts stylesheet, or null to bring your own. */
  fontHref?: string | null
  className?: string
}

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&display=swap"

const DEFAULT_SIZES: SerumSize[] = [
  { label: "30 ml", price: 64 },
  { label: "50 ml", price: 86 },
]

const DEFAULT_INGREDIENTS = [
  "Aqua",
  "Sodium hyaluronate (2%)",
  "Hydrolyzed hyaluronic acid",
  "Glycerin",
  "Panthenol",
  "Betaine",
  "Allantoin",
  "Pentylene glycol",
  "Sodium PCA",
  "Xanthan gum",
  "Citric acid",
]

// #region price
export function formatPrice(currency: string, n: number) {
  return currency + (Number.isInteger(n) ? String(n) : n.toFixed(2))
}
// #endregion price

const css =
  ".spc-root{position:relative;width:100%;display:grid;place-items:center;padding:clamp(56px,9svh,110px) var(--spc-g);box-sizing:border-box;background:radial-gradient(120% 95% at 30% 18%,#0f4f49 0%,#0a3a36 46%,#05211f 100%);font-family:'Instrument Sans',ui-sans-serif,system-ui,sans-serif;color:#eef6f3}" +
  ".spc-root *,.spc-root *::before,.spc-root *::after{box-sizing:border-box}" +
  ".spc-root img{max-width:none}" +
  ".spc-card{display:grid;grid-template-columns:46% 54%;width:min(920px,100%);border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.12);box-shadow:0 40px 90px rgba(0,0,0,.35),0 2px 0 rgba(255,255,255,.04) inset;transition:transform .8s cubic-bezier(.2,.7,.2,1),opacity .8s cubic-bezier(.2,.7,.2,1)}" +
  ".spc-root[data-in=false] .spc-card{transform:translate3d(0,44px,0);opacity:0}" +
  ".spc-media{position:relative;background:#061716;min-height:100%;overflow:hidden}" +
  ".spc-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}" +
  ".spc-body{padding:40px 44px 26px;background:linear-gradient(160deg,#0f5a52 0%,#0c4b45 55%,#0a403b 100%);display:flex;flex-direction:column}" +
  ".spc-name{margin:0;font-size:clamp(28px,2.4vw,34px);font-weight:600;letter-spacing:-.02em;line-height:1.2;color:#f5ddd6}" +
  ".spc-tag{margin:10px 0 0;font-size:15px;line-height:1.4;color:rgba(232,244,240,.82)}" +
  ".spc-row{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:24px}" +
  ".spc-price{font-size:26px;font-weight:600;letter-spacing:-.01em;color:#f8eeea;line-height:1}" +
  ".spc-roll{display:inline-grid;overflow:hidden;vertical-align:bottom;line-height:1.15}" +
  ".spc-roll>span{grid-area:1/1;animation:spc-roll .38s cubic-bezier(.2,.7,.2,1) both}" +
  "@keyframes spc-roll{0%{transform:translate3d(0,70%,0);opacity:0}100%{transform:none;opacity:1}}" +
  ".spc-sizes{display:flex;gap:8px}" +
  ".spc-size{height:38px;padding:0 17px;border-radius:999px;border:1px solid rgba(255,255,255,.42);background:transparent;color:#fff;font:600 13.5px/1 'Instrument Sans',ui-sans-serif,sans-serif;cursor:pointer;transition:background-color .25s,color .25s,border-color .25s}" +
  ".spc-size[aria-checked=true]{background:#f0c3bb;border-color:#f0c3bb;color:#5b3833;font-weight:500}" +
  ".spc-size:hover:not([aria-checked=true]){border-color:rgba(255,255,255,.75)}" +
  ".spc-add{position:relative;margin-top:16px;width:100%;height:54px;padding:0 24px;border:0;border-radius:999px;background:#dbeadf;color:#1d2d2a;font:500 15.5px/1 'Instrument Sans',ui-sans-serif,sans-serif;display:flex;align-items:center;justify-content:space-between;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.22);transition:background-color .2s}" +
  ".spc-add:hover{background:#e7f2ea}" +
  ".spc-add .spc-lbl{display:inline-grid;justify-items:start;overflow:hidden;line-height:1.2}" +
  ".spc-add .spc-lbl>span{grid-area:1/1;transition:transform .35s cubic-bezier(.2,.7,.2,1),opacity .35s}" +
  ".spc-add[data-added=true] .spc-a{transform:translate3d(0,-110%,0);opacity:0}" +
  ".spc-add[data-added=false] .spc-b{transform:translate3d(0,110%,0);opacity:0}" +
  ".spc-b{display:inline-flex;align-items:center;gap:8px}" +
  ".spc-notes{margin:18px 0 0;padding:0;list-style:none;font-size:13.5px;line-height:1.75;color:rgba(232,244,240,.86)}" +
  ".spc-acc{margin-top:16px;border-top:1px solid rgba(255,255,255,.12)}" +
  ".spc-acc>button{width:100%;display:flex;align-items:center;justify-content:space-between;padding:16px 0 4px;background:none;border:0;color:#fff;font:600 14px/1.2 'Instrument Sans',ui-sans-serif,sans-serif;cursor:pointer;text-align:left}" +
  ".spc-plus{position:relative;width:12px;height:12px;flex:none;transition:transform .35s cubic-bezier(.2,.7,.2,1)}" +
  ".spc-plus::before,.spc-plus::after{content:'';position:absolute;left:50%;top:50%;width:10px;height:1.6px;margin:-.8px 0 0 -5px;border-radius:1px;background:currentColor}" +
  ".spc-plus::after{transform:rotate(90deg)}" +
  ".spc-acc[data-open=true] .spc-plus{transform:rotate(45deg)}" +
  ".spc-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s cubic-bezier(.2,.7,.2,1)}" +
  ".spc-acc[data-open=true] .spc-panel{grid-template-rows:1fr}" +
  ".spc-panel>div{overflow:hidden;min-height:0}" +
  ".spc-panel p{margin:0;padding:10px 0 4px;font-size:13.5px;line-height:1.65;color:rgba(232,244,240,.8)}" +
  ".spc-size:focus-visible,.spc-add:focus-visible,.spc-acc>button:focus-visible{outline:2px solid #f0c3bb;outline-offset:3px}" +
  "@media (max-width:720px){.spc-card{grid-template-columns:1fr}.spc-media{aspect-ratio:1/1;min-height:0}.spc-body{padding:26px 22px 18px}}" +
  "@media (prefers-reduced-motion:reduce){.spc-card,.spc-size,.spc-add,.spc-add .spc-lbl>span,.spc-plus,.spc-panel{transition:none}.spc-roll>span{animation:none}.spc-root[data-in=false] .spc-card{transform:none;opacity:1}}"

export default function SerumProductCard({
  name = "Hyaluronic Serum",
  tagline = "Soft, calm skin from the first week.",
  sizes = DEFAULT_SIZES,
  currency = "$",
  notes = ["Free shipping. Arrives in two days.", "30 days to send it back."],
  ingredients = DEFAULT_INGREDIENTS,
  imageSrc = "https://kedhar-components.pages.dev/serum-product-card/serum.webp",
  imageAlt = "A glass dropper bottle of serum on wet black stone, lit by a teal glow",
  addLabel = "Add to bag",
  addedLabel = "Added to bag",
  onAddToBag,
  height = "100svh",
  fontHref = FONT_HREF,
  className,
}: SerumProductCardProps) {
  const rootRef = React.useRef(null as HTMLElement | null)
  const [inView, setInView] = React.useState(true)
  const [sel, setSel] = React.useState(0)
  const [open, setOpen] = React.useState(false)
  const [added, setAdded] = React.useState(false)
  const id = React.useId().replace(/:/g, "")
  const size = sizes[Math.min(sel, sizes.length - 1)] || DEFAULT_SIZES[0]
  const price = formatPrice(currency, size.price)

  // Rise in once, when a quarter of the section is on screen.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const r = root.getBoundingClientRect()
    if (r.top < window.innerHeight * 0.85) return
    setInView(false)
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  React.useEffect(() => {
    if (!added) return
    const t = window.setTimeout(() => setAdded(false), 1600)
    return () => window.clearTimeout(t)
  }, [added])

  const onKeySizes = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    const n = (sel + (e.key === "ArrowRight" ? 1 : sizes.length - 1)) % sizes.length
    setSel(n)
    const el = rootRef.current && (rootRef.current.querySelector("#" + id + "-s" + n) as HTMLButtonElement | null)
    if (el) el.focus()
  }

  const add = () => {
    setAdded(true)
    if (onAddToBag) onAddToBag(size)
  }

  return (
    <section
      ref={rootRef}
      className={"spc-root" + (className ? " " + className : "")}
      style={{ minHeight: height, width: "100%", ["--spc-g" as string]: "clamp(16px, 4.4vw, 72px)" } as React.CSSProperties}
      data-in={inView}
      aria-label={name}
    >
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{css}</style>
      <article className="spc-card">
        <div className="spc-media">
          <img src={imageSrc} alt={imageAlt} width={1000} height={1000} loading="lazy" style={{ maxWidth: "none" }} />
        </div>
        <div className="spc-body">
          <h2 className="spc-name">{name}</h2>
          <p className="spc-tag">{tagline}</p>
          <div className="spc-row">
            <span className="spc-price" aria-live="polite">
              <span className="spc-roll">
                <span key={price}>{price}</span>
              </span>
            </span>
            <div className="spc-sizes" role="radiogroup" aria-label="Size" onKeyDown={onKeySizes}>
              {sizes.map((s, i) => (
                <button
                  key={s.label}
                  id={id + "-s" + i}
                  type="button"
                  role="radio"
                  className="spc-size"
                  aria-checked={i === sel}
                  tabIndex={i === sel ? 0 : -1}
                  onClick={() => setSel(i)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="spc-add" data-added={added} onClick={add} aria-label={(added ? addedLabel : addLabel) + ", " + size.label + ", " + price}>
            <span className="spc-lbl" aria-hidden="true">
              <span className="spc-a">{addLabel}</span>
              <span className="spc-b">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M2.5 7.4 5.6 10.4 11.5 3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {addedLabel}
              </span>
            </span>
            <span className="spc-roll" aria-hidden="true">
              <span key={price}>{price}</span>
            </span>
          </button>
          <ul className="spc-notes">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <div className="spc-acc" data-open={open}>
            <button type="button" aria-expanded={open} aria-controls={id + "-ing"} onClick={() => setOpen(!open)}>
              <span>{"All " + ingredients.length + " ingredients"}</span>
              <span className="spc-plus" aria-hidden="true" />
            </button>
            <div className="spc-panel" id={id + "-ing"} role="region" aria-hidden={!open}>
              <div>
                <p>{ingredients.join(", ") + "."}</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}
