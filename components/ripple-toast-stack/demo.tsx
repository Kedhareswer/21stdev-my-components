"use client"

import { useEffect } from "react"
import RippleToastStack, { toast } from "@/components/ui/ripple-toast-stack"

// Unsplash portraits, inlined so the demo fetches nothing.
const A0 = "data:image/webp;base64,UklGRuAEAABXRUJQVlA4INQEAAAwGwCdASpgAGAAPp1Am0sloyIhqPM9OLATiUAY5QCTSghdGnefZ+xlM8HvHf14TqlPKHpt/mtWmddY0FaAizbBDLYl6M/eXzmvJ5h8hs6PsTLkoxmMRsbKj1U3iV0oTIv663+5GIp77o435LK/8rJh9p8ZmNEmAmaVkav16PeMpqNvWPdhfnZ7RhCIEOREH/X68thufIBDOiiikaABdljrsB9//JBAwv7ljCXfZ9bA+okaSgnBA7+PxsAW2KxDkzwyZtsuWV5N+xBXI7REym6A9NMuntH8/9VMoYhXkLhH84kAAP79VlAJHrJbYS715EDovhNY/w+ICbj/MnUdYT7HutpsrjH2m4n98UkjqG/TN6II63PJvz4Xfouw2BYzxOFVeTDu8bTf0hzF7XlZ3+m1nm/M6zo6yQrmquFpvxuYhcrG4Afb/8ji5i+4qd9bZeg+O91tp47VqPpUSZWH9guYksqNBOQsZIEKi1CqTcXfI0SG2Brf74shrfDj56mGD29thGcBJrKIagLSikP/fhSfXC85U7eNTRTNXrVXhrEubAktVlYcOyKCsR73mC9YIYiwPPKlR61WqdmjkeavewZhAC6R853rZbXIL96lsAdHBjJTWkKJud5bb25p82fi3G39ftvnpWMPY3lTJn/KOQa/2+mPEd15N9viaDrQGdsSmoqyPd8J+e6a6/fe3BWhMyeur6rOtXF0z3RmAhznJH3wabXGkpXbOgXzd+FSnJMfM5n+StPiwsJq36/bgM2N4Rmd6T03+mF/53ait0V3ZszyIb7wXv/m2jxUzh79UEPPocBEScGNN2fDrlopQwgR6fEx8VZc9ZLTyIaU96o7EHKtBN+zgO8SU07bOXdBmAFodAPwpxzpqRS4wQdHXHlz//Zs7rUAxOMO8usQnUhBSZNLClI4a3k8Sd5hWSQfTvptVeDwRX4uQTDRrFjDoYv3uMcKc3wKmgxJOz3s4WThp7F2rz2C36EeaXIqyK+VXCbmRuZojW5iPB0PJaF/ajHbxy0qZkkVYM3VdxExPTtZ0A2e65VCI1Lhfq3wT3LmZ9V35d1MDO8R4cCDsfBs8QMleQo5HvO5J6uenLZsl4VRhc8RT1JkrT5GmAnX1bjFp5Lx0hIMMyI+41InQ+k4cwLcucQNNSVJVo/0VGYLrz6INdU/UQxGBhkdsfXbe1SJS+RZEqqnhPuz/x6rfvLNfuuqQht1SyqFhnAWEu141Zc5/TZ8C4VDx0+KbGuKXGxc8Ya5DQRs4sGB9L5YUuXpfYj/NW1ZWNoDuhVxfWh+CVoDg8gdKlWsIoTTLAq95FS4LGchKPV7w5P5+M6quMXobQC/S8T0m+sKqVlBOnMCMK9zZzdNTODP8MYcZiUQxbwA18GS1Dhk64YORMPNRuA1EiJjlJRSPGupQqJoJYQBSf3chCqD/s704P9z6kr/WCp/Jq65xMmvFxs0HwzoCQBIAAPYKEMzZzSnw/y867Z/0xfzK0DgQb6iHbhaJhZYjh7RVea07UzI+/jWopIhKeGmyPjI9M/+Z1i5k0e467mKLsyLDjBQLBOmagQrxiezkIK2BgLsvp0cqippN/rX0yHgyKgzlgrb3v6Zvp/+pVdGDPCUn4pi9mx8fAelu2nhHlMN9Zo2HRfJQAA=" // 1494790108377-be9c29b29330
const A1 = "data:image/webp;base64,UklGRqQEAABXRUJQVlA4IJgEAABQHACdASpgAGAAPp1GnEolo6KhplSdOLATiUAZXRTKVtppYEF+zd6TNudzvD2Z4QzBR7rrK7+071vtnm0WhRdg3D6Wi/MM0pekKZxp/CR9nxtGO2E7Ijee75CuiNA98kjcZeJabD+apl/ndgtRjmBlBFh8KfCvSKlb5WfVQnjN/E5rmpGaU68YXY/NYoEXtZXNuG/jr3brzZISZdwFO9OirMVzKXbrtFAnv+VxPgKT+Bqc/b3hMVB4pMmmn6y3+5nazCnBNtCKKak1A/KYEHwuE6Ulxj6pIHQV1BVtXntaqrI41vrwy5iGC/YAAP5oF9stKIqJtjgpRTkopt/5TM64e6i8llSjGNF3hVh9AdqOd+r53MK+88iJuJACz2h1zRjOoSdb7nKpchD4hTE6UFGBrD09EfRSHe63YBW/y8U8Y8hkzbhvetNBdu0ZJYIJNyhOioMZtP1cXff4VcsU9YYGWhyaN2yqdGLz/qWgyF3R45uCZA5RcvzEF34lYTfl6sFkTd3o9kvA0c8GYdArbZjP1qBuEBBGWEOE1Q+hh7urrZLoVMCHgzfOI9koOaGJSH+m/1S5t8+VqbkxIMKxdXvyrtCx08pd1DV+gPb1sLRGTZbzpFHumeXODA0ubU/bWtgJqsELT4AB8agjP6xbDcmhGK+QtzesOGWDEJJpz3zl8NFE1n/1USGetx71vKX/HDg0H7s5MLTQ6H1tz3kyF3SaQ8iN/w3p+2fPcKLgAMNxsoVEivYerc7PhGz7fTZ2CblzEJgUQAWZCa1DKc2cXLRplytIN/Hg3fIfVpzUXsY25HCBwUQ6K6QDS09vK+aJ62Ut+kgkcn7MisxlhMStSfgVP5Jz5foRvOVmqfcAlJ9o1xVRfvoF4Io02yvddSlCXLvcxbiFQJTNP7y10uoGNTt4D2s7iRvrwFu4GpajPK93w2zrlLlCqKbYMv/lRrLY9AWvKmZnImRknxNyy5j1TVF1p9sm7FNzFra3VgzFMZh5k9SB6LFrmwAdqtjjYwUa35pWjoOyDipFrc5uz153hGctIa+CHT7ZCs6GukEUci00vPe3L+kAebFDkwK0iO6ov0pAkbIyKpoC67hPlb8EGzmOWM9jW31SIJkTAKpM+vdrVk5gHMJ8fiVlyo4EGPsOmHbIrHzDIQCeUl8Me+1Gj0W9jqL5jnBAB1haW3LtmWIVhhvbmyq2Yzjo5esoQQyjTtadaZ6I/H/NczgF5pZNUMvUrzx9ypR6jQOm7kJREUGs7gv9EQWC7ZVgOPTfQB0IMiF4X7Wxx6pgNAB9k6bIwnLuFrhpd0o2RuuuDq1iAlS/K6Dql76dfHCOdGOoKyzjRStzpi0iqdU58zXf7c20kkHHEoV3GthwNDEyzzTbVb3PUnB3UHE4PfvjOnXIbn1w5Nv+vmH595XteaHS+3+Q6uvAvA+kM4OtCALE0JL2wG/esBLHOLOnNLM8150goWbkpinRzE+2RUmV0WsFV1mmJ8nTncnT12lsOrPF8mP5fR6raQ0TgA6mTicwfP/6CkmpO5Qgre8sZFoQBWrSv6D3/oubJfB3PcOjAAA=" // 1507003211169-0a1dd7228f2d
const A2 = "data:image/webp;base64,UklGRkgEAABXRUJQVlA4IDwEAADwGACdASpgAGAAPp0+mUiloyIhMBK9wLATiUAXIvtSJiK+PjG6zpYc133zeqRIpd8S52KV74f/HLS54XF8tI2r08UddOvQQv6ea57lHAOrtVj9fWysNTw/Sswg4f60Xv+w8DJOhac/uJGG5t2R6E4uqDsdQxlNEjUlYg98wRVCbnTRJ+/WbPQsZUKPq1HjO5mbjDFGMWpVMSTHLLtDsxGhufS2R0owSuwHW3WmurmoaL2AcOtd0fFp/AvEdxNdskpcdfx4XvmBwB9zrWFE3MBAAP78eE5SfCubyNDrTL+cIBldq7FHldXsBlpWFWF6vt1EkpCeA63wipe9xK79fa3MNtYOpYbwY+o/OS/xQ/JP1gNpx68Hjmts8buYYa4Cc06Q9LIAjvTrycPWJRx56NCcYM9PZX2mOAMi5DheprIbVbWxgWmWdre4he9ggcEKFk0XMy+CPw1gMQKZG8t6vEHfiALwtfX0cJJ68ecgn7Rd0YnpbfERNytS1gvEPTIPZ6Ols7suetP6ZSe0E5oeXvfLtym1D5BsrOXULDX2qtONPOgeIMjGE4ynKop95xqbALzSJm5OlLzbUMeQki7mW0fjPujVYkRp1Ws3T/V74KAK4IKObWzXSHuj8y+9htIxLfjx/GUL4/aNhAG3opGhPfT4HwQoncJsx1fxRPSy7Ir+0u95tMBihmFHEUqPPmNNk5ufdNFrY8+t5Iv9bvTcBR6o4DVCYdsM8xOTTR4XArzJmQnSIlRXBRwyqOz73Y/zouD1UjrH8wbVJ/FUC4i1tcbToaP1G8DnzgVOE2rAIOf55ohk+BJfr8YOkAIXvzPPyFOxZkxRxnCyZNBa8yWvsTeoYLINSxx/lOlBkreb15bmMZPlcaddYGxewqWJwmODeuDLfRiU6SJBlcTgHDa80Y1nO//E6j4Zf/v1mJeJNuhpU+F6zoIHoXFlogiHi5uvw1/g0QGT1snvypZ99Xy1Ul7aP8w0l23ki8k3N8nTEylg8+AOejuB6Y2C0IUONDgWlPwbI5Xe/EKMwRRdKYkn8NVAJCw2NGr52oasygV/tDe11nNEWHKqvHORiZ1b6udDxpmzzApN/gvVYbxPe5/ff5lX0MOYW3TEqI9zdiWdz2k2wkv20SI3zG2q3Vn9BZZuYtgt8bLoF/1wWhoyFp9eThROYV2J4Hl85tIZ1cOJG9RTV6yJCu7Xzwh9KLJHZHGxAfJdQysu745NOrbCNxnQbMnWBzf2rgieYbLFo7MQoF8XAUi4qfVyTqEwgzrW0D1okjW9Ry09R878lEFPtae+b5x6btivzpg4Dz/OeWINQBzt0d1p/ZrobvsCG+H7nbjNSn7dmSGc1ihX9UQJ5+zaFUI+Zj1bYHblERzJ5d0cdhPhRpfoOKmCV7S6pR7G9sms76Ybgf+nYgQbSrO2A1z7jU6bXO3C0xxBFNu+1QAA" // 1438761681033-6461ffad8d80
const A3 = "data:image/webp;base64,UklGRj4FAABXRUJQVlA4IDIFAACQGwCdASpgAGAAPp1CnEmlo6KkLjMLmLATiWMAyBg5jljV74J8v7x74fKWKXaZtZj2UN3wO8RyoQGVy9eK2UWO85gTZH8xrPPgeLbaQRczozi3nTcAnjGgTiY6BGggrXp1K0uRGp6MWgZsMhUPKCyzykcArx9/fB8OFuCx/i1WtJzw2DMPPJChmxY3zxmthRUBvpvB9sNZv24wQYEnEb1CIE2ncDiDDzthAha5qIez8a/q5IaXSikD+EKpZ3ztJ/4kSsicMPzFpl3QSXqIRr9cduUSde97+tWM6uRxWCSrLKQ98mtwAP7hovr/alvkWZtID+bSNEv9rJdNe1s7s1j26CQdPaW80Iy1hWFAzUwNyu4Q8yUrPVQgzXcJk2UJxb7ndyKfXRnbatpaioaaf9bM+NnEI+Ar857EkRRb9hUi0HjLheIGGXJ37sboEkO45De620bFGQlaM9tUnk234RsT5wif8qZI1BvH8/2b7nLw53go0CfAigwtsGXLlcK13YErjFLAq3arcHTtMG+Sdwd/ANkhg45lz3QXy2zVmBeAzrhR3LKGrjoGbutDrHmxMXmINTndMbXo6axKvo58btUloDE/oeqMWW6eCEPPO/mEUPGmNNU/fFGTNkoglX0SGlePJLPjP6nRmU9f+qhdVz2jQb3Likvt95pC5PxR/OljrkR/qokP5268ADx3CCG5GwktWz/VljAPE76PhXv2GLVL1gTXIBWyIQQ2R1qqdpvhoPmJKFRBMuXKqAiUfBEsi7ev8BQ0x5VTCePGawvdwYs2ebVQseEOV+rvceRm8GPCe9QhBVg1lhK2JOxZJI5R3VQbb/+w1WzBuWe9uOj7rijmgmkkDD6XdQndChkBLSxSX8p7vxue1ER+iz347DFCRGRQvp6fTOiM1I0mz+BzOPhsU61kkoBU7t4bDYCu+UfN1kxiRqjVomKsVvRlF2AK6FWwSzFaYsPBLIJeVH+1qUN8Hbvizd2rB0tDrXBhhqbseiPiC1hQ9tLAPsTd/kfZ9wdyxvZX/W7ZHa00kcpFgtMulY/INedWxwSKdTcPocF/T3yNf+xTh2sLNg7F6VQQANBtBUN+VTCid6iCOGj0ZO/uOWy3xKD41tODBqjArjNlWsMd3PYXh3+U/rZX5PZcMaftvxlYURE/eHg5MDSGl79IYprigP2MzD5/grtCOghvQl2tEtSvNT79ZE0N2WVSSvTc9d+lbxU+xOrpsk1uB+uzheyaH9OYKUigT1vk+1HR/9smMLmzHbEO+M2h8uWzhM9d2ftahb9+PqAR1suexDntXpqS5ZQ8WWmY4Ci2eQ4HMgHAzCBIA+G3q7nLUAlVn9zGkzx+owQAUbmjpu8YskWmrnOv8u2nmzkx9RpdK+k3cNGt2bPaJ3M7/1ZYcYtNXaAv/vsOcFxaT37KYO0JwuHV1XCd18m5RDdZVhxSHSijpGLb6eoCjRLJn+Ydfat43Zyfjm1hmdo8kk2e4au/LbqrsWHo1EzG/6JQRBxaWoVlkjQUlislZ0eDUSM7ecbNeS+9iKClv6wPGF5fOaLk55J2ITkixYy5xW+FiWCzGA8qppD7O+WiBPZBKxjjapG2c1giw6YERzYCCaGwagkHr6NeegZqG+pYP4QUhOol/K/bjwKWf3755XuCxa0xp1BYKS/3x/UhPsA/1nqCTY9kg4gQzfYzOhFS8//SBOXfSRJJhnjs1aWf6UDarJkzG1iMO1e+IpDws8+TU3c98se3/mCtcCpwZrW38EbOodaKYiNgAAAA" // 1500648767791-00dcc994a43e

const DEPLOYS = [
  { msg: "Ship pricing v3 behind a flag", branch: "main", sha: "8f3c2a1", who: A0, env: "Production", state: "Building", tone: "#7a5af8", when: "just now" },
  { msg: "Fix hydration warning on /docs", branch: "fix/docs-hydration", sha: "41b9e07", who: A1, env: "Preview", state: "Ready", tone: "#12b76a", when: "12m ago" },
  { msg: "Bump Next to 15.3 and prune deps", branch: "chore/deps", sha: "c07d2f4", who: A2, env: "Preview", state: "Error", tone: "#f04438", when: "38m ago" },
  { msg: "Add Kyoto to the launch cities", branch: "main", sha: "9a1e6bd", who: A3, env: "Production", state: "Ready", tone: "#12b76a", when: "2h ago" },
  { msg: "Tighten CSP for the embed widget", branch: "sec/csp", sha: "e25f810", who: A0, env: "Preview", state: "Ready", tone: "#12b76a", when: "5h ago" },
  { msg: "Lazy-load the changelog images", branch: "perf/changelog", sha: "77ac3e2", who: A1, env: "Preview", state: "Canceled", tone: "#98a2b3", when: "yesterday" },
]

const fire = {
  deploy: () =>
    toast.promise(new Promise((r) => setTimeout(r, 2400)), {
      loading: "Deploying to production",
      success: "Deployed in 2.4s",
      error: "Deploy failed",
      description: "main · 8f3c2a1 · halcyon.app",
    }),
  fail: () =>
    toast.error("Build failed on chore/deps", {
      description: "next build exited with code 1",
      action: { label: "Logs", onClick: () => toast.info("Opening build logs") },
    }),
  invite: () => toast.success("Ana joined halcyon-web", { description: "Invited by you as a Developer" }),
  undo: () => toast("Preview deleted", { description: "perf/changelog · 77ac3e2", action: { label: "Undo", onClick: () => toast.success("Preview restored") } }),
}

export default function Demo() {
  // A resting stack, so the first frame already shows the deck.
  useEffect(() => {
    const at = (ms: number, f: () => void) => setTimeout(f, ms)
    const t = [
      at(200, () => toast.warning("Bandwidth at 92 %", { description: "1.84 of 2 TB this cycle · upgrade to raise it", duration: 0 })),
      at(500, () => toast.success("Preview ready", { description: "fix/docs-hydration · 41b9e07", duration: 0, action: { label: "Visit", onClick: () => {} } })),
      at(800, () => toast.error("Build failed on chore/deps", { description: "next build exited with code 1", duration: 0, action: { label: "Logs", onClick: () => {} } })),
      at(1100, () => toast.loading("Deploying to production", { description: "main · 8f3c2a1 · halcyon.app" })),
    ]
    return () => {
      t.forEach(clearTimeout)
      toast.dismiss()
    }
  }, [])

  return (
    <div className="flex min-h-[760px] w-full items-center justify-center bg-background px-4 py-10">
      <div className="relative w-full max-w-[1100px] overflow-hidden rounded-[28px] border border-border bg-background shadow-[0_30px_80px_-40px_rgba(0,0,0,.45)]" style={{ minHeight: 680 }}>
        <header className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-[13px] font-bold text-background">h</span>
          <span className="text-[14px] font-semibold text-foreground">halcyon</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-[14px] text-foreground">web</span>
          <span className="ml-1 rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">Pro</span>
          <nav className="ml-6 hidden gap-1 text-[13px] sm:flex">
            {["Overview", "Deployments", "Analytics", "Logs", "Settings"].map((n) => (
              <span key={n} className={"rounded-lg px-3 py-1.5 " + (n === "Deployments" ? "bg-foreground/[.06] font-medium text-foreground" : "text-muted-foreground")}>
                {n}
              </span>
            ))}
          </nav>
          <img src={A2} alt="" className="ml-auto h-7 w-7 rounded-full object-cover" style={{ maxWidth: "none" }} />
        </header>

        <main className="px-5 pb-40 pt-6 sm:px-8">
          <div className="mb-5 flex flex-wrap items-end gap-3">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Deployments</h2>
              <p className="text-[13px] text-muted-foreground">Every push to a branch gets its own preview.</p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-1.5 text-[12px]">
              <span className="mr-1 text-muted-foreground">Simulate</span>
              {(Object.keys(fire) as (keyof typeof fire)[]).map((k) => (
                <button key={k} type="button" onClick={fire[k]} className="rounded-md border border-border px-2 py-1 capitalize text-foreground transition hover:bg-foreground/[.05] active:scale-95">
                  {k}
                </button>
              ))}
            </div>
          </div>
          <ul className="overflow-hidden rounded-2xl border border-border">
            {DEPLOYS.map((d, i) => (
              <li key={d.sha} className={"grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_140px_120px_90px] " + (i ? "border-t border-border" : "")}>
                <div className="flex min-w-0 items-center gap-3">
                  <img src={d.who} alt="" className="h-8 w-8 flex-none rounded-full object-cover" style={{ maxWidth: "none" }} />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-foreground">{d.msg}</p>
                    <p className="truncate font-mono text-[11.5px] text-muted-foreground">
                      {d.branch} · {d.sha}
                    </p>
                  </div>
                </div>
                <span className="hidden text-[12.5px] text-muted-foreground sm:block">{d.env}</span>
                <span className="flex items-center gap-2 text-[12.5px] text-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.tone, boxShadow: "0 0 0 3px " + d.tone + "22" }} />
                  {d.state}
                </span>
                <span className="hidden text-right text-[12px] text-muted-foreground sm:block">{d.when}</span>
              </li>
            ))}
          </ul>
        </main>
        <RippleToastStack contained position="bottom-right" />
      </div>
    </div>
  )
}
