"use client"

import * as React from "react"

/**
 * Swing Panel Nav — a pill navbar whose dropdowns are a single oversized sheet
 * that swings down from a pivot far off the right edge, overshoots a degree and
 * settles at a slight tilt. Switching menus throws the sheet back up and swings
 * the next one in. Hovered links slide right and fade.
 */

export type SwingLink = { label: string; href?: string }
export type SwingMenu = { label: string; links?: SwingLink[]; href?: string }

export type SwingPanelNavProps = {
  /** Wordmark next to the mark, top left. */
  brand?: string
  brandHref?: string
  /** Items in the pill. Ones with "links" open the panel; ones with only "href" are plain links. */
  menus?: SwingMenu[]
  /** The solid button at the right end. */
  cta?: { label: string; href: string }
  /** Colour of the panel's links, the chevrons and the button. */
  accent?: string
  /** Definite height for the stage. Do not pass a percentage unless every ancestor has a height. */
  height?: string
  className?: string
  /** Optional content for the stage behind the panel. */
  children?: React.ReactNode
}

const EMAIL = "kedhareswer.12110626@gmail.com"

const DEFAULT_MENUS: SwingMenu[] = [
  {
    label: "Work",
    links: [
      { label: "Project 01", href: "#project-01" },
      { label: "Project 02", href: "#project-02" },
      { label: "Project 03", href: "#project-03" },
      { label: "Project 04", href: "#project-04" },
    ],
  },
  {
    label: "About",
    links: [
      { label: "Who I am", href: "#about" },
      { label: "How I work", href: "#process" },
      { label: "Clients", href: "#clients" },
    ],
  },
  { label: "Journal", href: "#journal" },
]

const DEFAULT_CTA = { label: "Email me", href: "mailto:" + EMAIL }

// #region swing
/**
 * Measured from the reference at 30 fps and fitted against the panel outline,
 * frame by frame: the sheet hangs from a pivot 33% of the stage width past the
 * right edge, starts 58deg up and springs (k 220, c 23, mass 1) to -4deg,
 * overshooting to about -4.9deg 0.3 s in. Closing is a cubic ease-in back to
 * the start angle over 150 ms.
 */
export const SWING = { from: 58, rest: -4, stiffness: 220, damping: 23, closeMs: 150 }

/** Advance the spring by dt seconds in fixed 1/240 s substeps. Returns [angle, velocity]. */
export function stepSpring(angle: number, vel: number, dt: number) {
  let a = angle
  let v = vel
  let left = dt
  while (left > 0) {
    const h = Math.min(left, 1 / 240)
    const acc = -SWING.stiffness * (a - SWING.rest) - SWING.damping * v
    v += acc * h
    a += v * h
    left -= h
  }
  return [a, v]
}

/** Angle while closing, ms after the close began, from wherever the sheet was. */
export function closeAngle(from: number, ms: number) {
  const p = Math.min(1, Math.max(0, ms / SWING.closeMs))
  return from + (SWING.from - from) * p * p * p
}

/** True once the spring has come to rest. */
export function settled(angle: number, vel: number) {
  return Math.abs(angle - SWING.rest) < 0.01 && Math.abs(vel) < 0.02
}
// #endregion

const FONT_DISPLAY = "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"
const FONT_SANS = "d09GMgABAAAAAB6oABAAAAAAQlwAAB5LAAOaHQAAAAAAAAAAAAAAAAAAAAAAAAAAGhwboQocMAZgP1NUQVREAIE+EQgK1ATAOAE2AiQDgxQLgUwABCAFhAIHIAwHG642RQdi2DgAZFCeFVHFaS3+LxO4Q+QLD1xglwTFOFyQ1smsXXBze+n8qxO+vjIN07CxFQKvXBxknhh6PlaNDDK2eoTGPsnl+e/347fOfu+rQDJpohK6SvJqHgqRzHRCZrpXS0Tyhad3mX5pVPbm9mmbzqU3aIDMUmDDITwIhuBQ7Bmen9v/GaEgy1u7d1GMWJArFk30Rixg0Bsl0UZTigGY/yEWPn1f7BdlY/94BaivCuNFwosSns/b3eDd08FgNxnwkAYDi7pIEv9WCQaaNN871buW71o2CIoAOimxCwzOxvI+DYJAQWg3wKw4g6+9fg0L4P9/3bLDvHXq1E23vl38dBLXgCfgH7gQ8n+21HbnQJKDBux0Rii6QOemSp8u1e58ze7O7NzpbtdwpAMDrWIfPEkGGp3y3u0az2Eu1SW85nMIuCJuCbq0eWmKlGVStHkuk6LsUWul0t3KIgQIzpl/3qxynWyPOzsHMpUQJAQREQnp8euvx37z1bFXaSMcGcbn3nIKxgHCc/aRHFIicTDqTIrgI8dyiwFycVVnM0BuVXe3AkQIaE9xUDcvd7aCMCgogdfw1FckW0Jg1BPDvd/mz3w8SNQgURIFC6t8DgWKkBygI7lCRgzq9ju8W9CkUwgmb0/JJYqWD3lbBmijk8Vmh46YeduGm7sOngAUmFjkGtUkEA5SskupIRgGr+67Nnzk99R0mCdPd5VjhA4WwxLRoNOpQvqay6QJOQqKlzUBkYGEEfn0kz3RglGqzfnIApg7Sn4rBVJjjZSxFBVHi+b6SGcq5001oNFLNUGt9pFZHmBDW7XmNpaa6XQJHk4S8yrVGsYckoVEy4o4AN8gzE8UkxnDAilPhzyVuQZATSkdYIzUuD4zv5GsnXMvnDB2KjSgRFwTkYqiQqkfq4755V2cmoXlK+Tf/q3hn7QAS0VA7Z3CNgBLggFs2yz9detsoxsVAkjsCQoJNdIppR5uNN4nABuHQ7+rD0zsWNXCtBKUPMCEYwXDgtk2sNMaWtnQrKNqpRd7CzN4SsWz1vuKCul4C3vV2gla6cQJiIY5wLpzLeUCY97SclDnOhxKoFwCp8O2mGutzn4VYpCvOlhQW60MHg/7KazOX7o8c1UJGO046iCRPZHEzLdgh3XrQGAaCvd72NMDKHxkH4LZkcfmRFkD2bLQQchV9zZo/ejYj7GCrSnuKGzPH7YEjCsdUhKeE+mUU0JH4CTuZZRpAXH61RT7WWBgODyZMSLEgABEX5SKzxwDcRLK0nlcPH7QKqGyMt7RGbRONgHEsh9FAWI4mLqfTdI96JjqRkyBFB/cKT3hc1nrW4y0ntKNqkkSB5sfYxDsD86TVg87yjasA6s3gdrqFJgUMFT/JSXewskmCAaKLArKYmtSezAFnK4woqqIvpRYq8SxK/tSUXrf+ZAuCGcvK63ZoGMyRtYbYVxxGCPL3hX4BUEcAr6BN1CftwcYpmJWcUVnlfFXkyzbcWdXN510Q5FGZ0QLtBuF+dlQcRrp3H/jMExFCO6hE7QVrIPUCVoENSvWT8UZgYjQClsVPNRYTO5WbuK8FDJGOIXSF5UVKDw1H1plvsKTL81EW4MNkatgITu4JCTacNOY2gzIpSrpOlKAbNMvqL+a2Ta2QmjfhnrWGoFwL0T2JaKddtlzWLvQUmiBEGksP6QtfAAv0SNlyEXxCzOm5oFaeKnoesEuLQISWTc/iqi4HbaMSqWYiEcAMamI1TpE3dRJyEPl9GrZ/NxhUEcqCaxIIJ1A1tUkrIPGeTZs6mRL1hSgx6wvQBjERys0ZrD8ZusHc7nWYCPAaQZbdFCEZ5EqfmPAk3SLhdWZAQQJ3XlAqxR8puyByR3MlDdLnnRrwX2N76clUkLSBk3HRs2NdhKvIaELOKAlST+BcZx80S8GWGHZFbygcqfuzgbG6XmQNEsLPbSWbw7uaVMv4bEp7H8JVIjIeQAckEEpi4NBgSJ2LqXSkTjfLbULRRIdwAQTq0ToggnnEMkgwrJwa1iika0L460IkZwDhgXBJkiYhuddgFFUwCh1bZlOposyirw+qThUJ4B1JKiXxRsEgEHUxcBSPD8uybFgrvyHUJ6wqofsqiAUNsB//Y0BA0+ECSKEew0tkARjY0uTD7tNcavIZv7oHwrXA2gWsW2RSJQ27VWEKLB4xIKDfyXFhMlLt6OT9EEXI8GoC/G/R/h5DTzBc9tJXrxCkdcwEDjdS53BKdGr28OJB/+7hAcMriFYRgT//JkB9FtLDihQvzINWCYvKJnC/FZatcqDqw3dJIA/3bBIJOnCfTEbbABeT+lLaEwU1BnzBAPp7X+AheZ6tJJrWhalqqy23qvLEAHxlINlEulY+VRbMwzC4YFvK/ujCwC00U+1nxoAyRJgE2AP4AgA2C+VWyafGiU8HJwylLHKYZHFxq5SuQppvIpkK1Ytn1+BUoWqkLjG6aD8BvAZ4Bkw8RGY/gKAhYBlAIgEp825qWasfK4Wck8WoEf3YjmSakCr2aOb1XgCnUW6FJ/Nxtc5xgwPlzAihGyFgMoUwxIBRIXDaRA1KjyFyScksRyehk+V8KlyiZwqppJRciRLK4ao/FjAVcSJCZmmc7ueApmJH6qKoeMCMsUmyBj5LI90STVX7Qwl1yUItRrHMVou9YVKo2QLwlwME2GfuAUUQSRiTGFvq3EctOmbsmQhWo/hN47ZzEnW7aRFYxf4cI7D4SmSnMsHBsBDh4O7KOJp50GYkkAIvg29KCYS+uBb0ZfbqMuSpc0r+9FdJDoOeLiozOY2m7o9OoWrwoHFiDuAfPBZxeg7Nmifp4XGgP5GkXU1QwJiHLA13ODBKL9+BURHKAnhTgKSq8SBVFI6Y4f2aR+UbnzomCEBsLTOXKtROXb+/OJ+SHCpBBxnD61h+HrUrCO5rsy+aqdZSDQ815C6tYXpdafPZQZ1+iq6rpoSLBmOk0IaQMyH+frrrZuoT9qkwdzCErRvsavFB1+IBZzE6nGEwGLE7zp211ifdgbDK21ICHYu5SnKOebFq2kipwZPbVYbC4iLVRdFFDVuuksH5k6zi+c95Z8n1bT17iWc2UVexGN8vMnCSNuqhP0BVpsC0jRzS4nn1Fl0vh+XqRt3PJ89p2Sj9W/xTOqM5EMUe4mUp7N+4FMyTJ5KRn7f2GlUEkzWtNRgfDhJ0qQ876HEF1mdE4YEcJQPybO3wRgRglXX97PUDeh5bAS9PxVggESnojNWJw5210Na14xu0A6Yq6jecheYIH4eNwYhTq1pMWexIOvH2yz02VVKCnT7OkhQ+Pr5xmRoijWlWipy7ouaF0d1edTmspz1GG1jJkqBMwDpD9AYWb0DaReHY+coRld4AP3c4GJTz2puRYZmHF2wmxDmm2M5d5zT0AN4sGMhb5duiiiqGiWXhPiDg5TIzqSgl50+oRzEHs58u8le6sOSgTAqSM46J5Ylvbz1wUrBwxJOMxQ17m2ujiL+eh2IKCa2KUT7ZQEXB0k4ZpKLeMTjMAm99pGPeqPh/VPOCWncLYyE7jMFDdR1MyVu74lqlVK+R+aZjQkUbNteZ2EQsIQt0kXB8gLC8VABPjhUQqsKpk3L1pw5jjZO4s/SbphSto5velJjMSC1d4CH9tpsB320wkx4R4QIA5btZ3qDQyVXqEAoAL7aBggfFp1TBgI+nJqklZI2ROa15AU8H+J4Q7vCCoAvBCPdBAnRgRwkHTw85kLaVwWmyTOS1h1F9V4HqJ/kuoKRdLHFNiR/WxBGYWyPXQ3HXMiIKapXMA8GYhjAUkbh/o18A25ruadnbeGKDc4uqL7+uax+m3YAnoD2epB0zxoIBrFhjOGZXnxdNbXmHCXmhuIrUNw6sa2+E8pswdEFsaId0lmAssUU3g+3EcKqu6IWq+vKqIZ1Wlyoq8wOjMwNSaNqrQcDQZvuTcz8yqtjJGRVFVqqD7mvn14BH5Ym4HwuVTClGgcrwcMKEtIMxRvPgPRcTWoO3qb5SITWEAKVZR9LUpILtyyTgs/1y+PZGcC6vOfTGuZffk7NFqvmCxXStq5/K/dHFFaguQvMbZ1LKF5RvVGdJkhQTXdYpjhGMB2273k8S2TJFTIYHnOSRsRdey0SjUjsZNcIcyfMOUJoKPsR3NfnnS09HCXO+RPK/wtTo6guFLCASEh7ytQ8H90vCihyTlFNzLvPylKXCz4m0UamDj82MNG5E4MT140jRE1dpvCZ0yaypBmW5+zlMpfgFVXibu82E7EtD1pZ68AS3uLsVqSffQ6JFoA95ZQgGCzNBQL2fIRISeNLJfnlGIhlUFWx7GKtRKnMtfqtrOALEOghZSPv6lWmO8jq4ddSOhg37A8X5j9j4RCxdZnipMsQqC7U+OTs+Tk97VCPzc5I8o4ZkjQxgpVDOJOntkd1ZPhOeYE63ptXveXXd2/eTNVVq1WOsASp+YPTa0KU+tC2FjAHIhRFVpNvZdspfu2CkosGO1/r95BWuRCVd2fDlCpLgKJQYWYtTBQpny1Vz89qW8e7M+I6Dqx5haVC0nyx9c+JBdxi8NC6nHp8hNRa/mBxuRBWRui6lb4MLh1c5sXC4zt5+VLRKZ9fviSlLsCLu1fBZbFtU1nRxSqgPLRcdjcOtm4sLU1mORt55a4vHYKosAdKdGrymnZWZJc/5Exvz+p2drtS/K3y/DsrsZrrQ4zDDN6Tc3xEjZu6m4QlzTg6wvVw66Nx56NfJ0/6GoV7+822Ey5POLL34z+xP/Z8jD4Zw0Wu/njxevQqENkO9qR55P4/eG3xupObdhwWdowbf3D0ad/Bc6+vPOh01OXs37Rly/6Nh+uceQcObtywwb2MB/LAu1G3o8KJT/dPL/2OP/du5YnNd6a/RVm3V/3JjjruXXLk+ra1z3l+7Yvr244sOUFtYGpX3vrlr8D9mTwfXm1WRUGcOAYT+su8g/HeMfc2W5XAauXX2gf7+vu24Xq2oMUI6kKtH8mwtHrsVEz22Iq6VixGwRZY/2OX3N4UfiwVQdMw5WcCxI+gAUQQpgETdh10Oyfbi+MHvBUbkwoNXbyf3lvVFPns700uXJnfZFatdA+uG14b56ZvsD/ZhPhhuAY5g7rQv6C780e6EDAIcYoIsE4SxElW0Lagtmg/K0BMEN04eRvZC3h4/gEA1RxHaDH0z37GFbOscYKYYs0apMUFCTfwk3WsqYUngh6UHPvtaQYz3fydKQHKMdPhXgzZ8I85MYhNTIDN9SLho/zMaNRYL4quwEA/zGFmC/4MhrbuCn3MD3m8qwLFVuItzEYmcxUzBHt0ej2XTjete3IGD/X7Bn0wx/FGYisKya9N8AjyETo+rewsB0Mt18a5zAh2K0G//j1e59HWorgBV8WqpNzAbo9z0vUddFd6Zpek15iVq9ybunY0ITKlN3aPauJRwbpAfN+5pr2u3nh3XvqSmCCWn8nJtdms7rtezhnQdzxvTP3y60lr02NdVIEgoerkO1Jub+bltRaNrykhZwcr9t9rXId3gloUO3q0YTq9VN6xSEwQK07l5pnNpjxz7ilgMN5DyeN8+dWpbHjPH/+vZeldTkNS7CE7pQmtgMt8+QnReWkp1VydqZl/5O7WLMYLyxqdWFJSJjcQJS34phGtRao9WQlR2WmqGg5IksXDMIf2omgPSsOCjDeMzRmIbaA1LGO5ODMrqiVzpVc9eusrAr6y8kB9L/2Dx4lx1soqS98GKyhfgt0cIFd1r9sIMbu6/syI+j2zrx+DqsoHIqoGXgImsOND9/3DfVysP3DdGHVHP9iDIIGhGzrhTaN/AGX1jT8IDO7FmHt7L3GwK9yeQeBZguxJvPa1QfqxbFq4B6aPTE+HC66GT48wkD2CmY9l0q8M1wR7UNrht98gov9PXDsH4iFOsYyY9Rf3WfoQSj93/haE34Km10OoH0wvuBCrUQ0qkdHtfTOjkshVTI2XY04hh7f1z4x5cwtT9VvMBJ+HKZwxcXaZunU9qznBFJ9ZRBFwo+FVHdUZEdOl/VEjSKXZlvbMhd1ZfMnFiLa7JRJXKglfzcT249bw7mN/gtwwS7llcbIY38/E9+ONxDiOTxE4eeGsyWyrNCrbHHnKzipDSZ70gTBP6872mCUP8xvIlVMCuOY0m/Sd+Tph2felopTIXGTpnboM0PmgnccU15UmSApzyzKY3PYHXZ+mr7jzSzYMgJYqg6ozz6FqqzJaLGWmhQicbb4R349/3RHv8cUyS3Se5IEoT+vO8Zik90Uc/5bJdHYaTO35ucaO5eY0hUMwwilJYSQiTpOSksxJG5AmWGTCPOUSb6HXwbPRZsInaZrXnmAlGNgHfhJvTYGLIbgIdv1XXFvtLw/7jGR0pf94XnDMq4v5pA21w1AqWt2qAJGP2o9uebQv48fA7Vfz6aL0tPS0uvCHlWazrdqgas7S8DyjTlGSpcJ8f6yImGLi48Tuzp6ulUz5A2FWck62xyp7IMpMzs3xgJVLjLp9lOopTzHqcqVRbhupqxPR409zuNKYmWN5rNDHDsUPsIZYE/RU9SQewEt5FDaHzOOROWwKGHGZ3jIYDd6GvlfeIaZwYpi4aop1OmJCumhf0l/Ov3k+IX1BF15/uhNFXfzvb91IeHD/Kb8bYk4y7kwHvagAX4Tl55e6v715PkreGBP+dtX5Q0wUayQTwWooaey2MvFhovC4skivN+ZoP6BG+0zGlAxppArspLNW/Ms0laQx59jnicyVszSOTKdUgJUwJzh/Uvd9s8xuMuo78vRCn8nmFWmy2Njt+Tphucm6IVUgFK28gI8TqX+gVGt4ji2WWyzWqij9aCoNNnO5eYG8QE8dfRqubI68l4WIhTNmSxSOYy2zLB7zAPjpTL3zlHN21RJCqTdB1rI/idEWQreHIN5qoSXUnmb8At8KflReBtff3Rv9ae3tQAY9UuUSsAyaCuhDs1URn2QvEevleWjo7d60H2ruz5zjqtKFxFOsArKQbUZVWosDYBoKJDEF+m8MSKAuQQz1xJRcf03qe5AiGCpGer5U3VJAz22M+BilTc2+OAQW1OfLot02wDpx/ASLpP9VqU3PNT9mPUPgz7DGFEnM/bjrlsajB8FL0Pl9z/V3mHdhcMHgvi7OeNdgNQrZ8jtODAwtgt9AvxzaNdBVsQmBqlb0teObu2s6YHhT4UA3NtDZO0pH7PHVuwYG5xF0fnDb6uStq3vmgScU8tNmTswkH7z5I72LAW8/O3BCPHji7HYI8oPPDk7HnXjrM9ANQTsuj7wo2vHi6RHw+gXVxFfbn5FdeKFangm6Oc90D7W/bX437RsFpXRTQ/MlWhXxD6yEYAUcD7fV+y7BfnZEbDSUCgOZazZeOLdCe7itoHDthlee79FOthUVuPIyh0ZGM/vycrP6RkeyhsBEWYGgPehqRLmz7LdnhY2nHg+7w7+hMmqwzPaD4kkH/W0lRn3vjbkvgqVueYpda4vNYmY/2SksWfNkZLkwJcsvV7hMUpZDXXj5P7NcE+n+TmBKF+/s76e9whfCpwoweaKVHRqtzU7JSGX2okgvUye7FBKtsKktkkx0+ZOjgsaJJ4caBSnpfpmyQCvjpx0Zj8iMcFRkmHSlLQngMPgFvJZM3GNS3lgqeu7IeQg9wTpnxgMoFsDNtfjJnG+q2SFrOUCtpo339uOJUuELvzcUEnHxVqFcYs5y2KKtrI/rm6moCy7CVmAOWd+6+D+c416J2l6tUfntqfq6Fi1IDXP1Fpj2t/hituVUNielxZXzWu82eRlHn+A2RGhy6WUrSlwRAWV+kURhqtCq/Fa7trFOl1kkmRVaZDL+nERyM0EmE1lugCmgjfl9KcUxXqwXQXuxYew5FBreEGvcdLVE39I4g9eUHJObkTAPWSi5FTa9rni5LDPLyOCtl4syf/g3Iz3cXZVtmq7XEecscDgMRqND78h36v3tdhryUuO+QcTqbKPdnmVUa7JM4FflFRL7oEa0n1/paDJWNgcsqdqGTnZ3j9M0oWcdUWXsrMgqlYkss7GSGzYqkzLPG2BFMFfB4SRzuZD/8sCgb53p5+JX0DchLc/G5UBcXmw0NlqAG+W0tw5gc08Yl72xhv/aWo8Vl+nBDOYkd5b/pcfBuUjBlGnmT/j9KzSEIfxD/87qqVfQaF+SLAPHZNOC7P9HrG3kKwwlMUkZSXxmg/C7QqqEzKddB2jiBXUKBs//x02Gu8cQWN/0OO+Irf6LtSGJHQxGR+La0Flbw2Tuo/fe3KSoI38V9L3x5LF8cm7ojTWhlgKo3bIm5AZ7pI7IH//2/w5FPVlZv+kSWL0EfqRg745xUGJGIxgWpMwT/91UMwU/lG7YCa/6jbsn2cmAHiqJ/jH2tidv1vYTGVTmSATdhrierEj/RsxxrciqX/kTougvynN8jLM7PAK2v0alH46CNL6jnJW72fLVA0fFxtyhRPA5/6t3LfsMYxWOTt3EzbmsPNDwGbSCAfVCHzKMzkAPwPppIgpVQLvqF1IpIupk8MXc/zQhBXK0f1FF6dkVUoFzXOtXvduWzdyZuCPaNvrw1Bu9hEWwgb7ebqNvEK1nWnvfOPUIrD4+8uji5V6Wlb+evsFmZ6wXrMfHiy7eH9XW/uJZa8/GdyXsAH+HCN8knpPMb6TF0BlRn26cj51Tb1FmwD0MejpdjqRhc7y+g6wQ1oFN/DksDZGPVmH0wEAe0CBeE6qamr/pDBFCnO7jHahCfx4GoXRx2CbxXOxiFcAyjcmoWpTMqVeqwb6AtkB8eDO0HXIx6G6o8L1CyE1nuCAgiWnFJzbD/J29gL7vTD8Hv4K9EYq+mHqg6xC1mEG7HfsjQT/0X3r9Z4uUCr58tvKgob3TcMhfazra03PUVNNzrqzqeLsnYb0rTWcw2yM2jvisSoe72p2l6ay2mlSpqknq6eJoOEopnomPjRC8xRG7ubW2CseWsaza1mNlvqnOLvfxQ57l6R2Rk18fm9d9fW9ItlYosSSLvVrVl4kSa4K4UK3lALGZDXGaAo2IsLVGhdx7OzpPkijPLIzR5Pjy08Qcq9W4MezFm9jtLKpdLC5GUE90IurmZzuWVdd9R61FoOY30nLwsV6NyakukIbL3v64b8b7tYWnSNeVamIpMcgLy64QH2hX4VF3wfBNjBO83e854SmAaofqGZXJaaBN5H33Yg68O/yLMr5dncqmCVgB3Yk6tBT2+nL0Kb46VWrwtz5GfeQ9Kz7K2/Uix+uN9fzn/1jMJVTpBVZVLP10A1qJ+DxZWq3bn2wNDapi1ANZh8XQC+egZOir+dwZKBK5QejMOVgEQSL43AuQGLjL1/CTC+bU7VGUFBVC0RsGFcn3AjPYS7cuXE12t/TWS8x36u4dfKUtCtbHgN/HwZfbYmBtzKPwXt07zGPzr4tyuOfzx7CZAJh4ib6A/ywNSXg0sjt/1UjqnJho94tmGUhi6LurvLHOPVA9QPw9+OqRjvVQ5KfV8oPfsqicjgunk8Nz0EEGG9L64Z4fJetXjW0YDpC0IzOrCn2dgVRJZV6yuqCsI2CPrcpTqNM5GxxJWfEZ0sHy2fHpUFOBr6NOQJXK1jB/amyVnvbII5akzOn67FFHYvasTMgAUWtr9+zQJu2Tl7/PA2U9vloQsoYHMOSLC0A/BH5a9HO7owG763AFcldNeEUODtnQGvOzPfL2AiJB935x8r7Qj+dphv8GBz8G+Ll8fAAA/m7pWf9s/3wdGt2zAIM8UHg4IzawTZG6TgPJ7dZcrgWS8yleTirMMbp8DzTPICn9gEpPY0X2Uxc2N/0KE1vUlSvOozhqKXhLn3T8UU2rxNQ2lo/k5RJKXyQqe0SnAj3FYkNIikNGzZIClcZxpeUTnMLtW2T4mc4vmwkRS5NldDWyFq2oiFgGYax6hNv6JVm1NBqt1ISB5S6fMJj4iRVqTly8Eg1qRUaUgCQoC+mQGsmPaUKFAfxDM7euCx4kbuLLtrgkze2mPsNcCxZ1j6epBSjlFAjJqlNMKKjyNBtBALd2kt4j9N1LdLnJUDBPvGQ+mISkSIUMPyZtNyUZaC3VqgYJLqux1B+hnjP6yRsb81cw14cDfAAmRjl7jo7yiv+jxIuZ6oA5KlqrZSOTvRJ3IAHGK71FpGDhqCWgr4p7L7SsWtm1abdKp0b1GnQTSJYoibLQYo4Ctz9fj1aNurURcOrUpklALVHCqgdow6C8UxeBWLBEt3a2qk6CBPUa8XbWo0a8Wm1almhb/DzrNQuo06ZVty4JWnm6SSRIpFl5X9apWq7cP8VCAfV6NKvWSSGeWqJkevkc8qXRQx15HHJjLYxGeaoEYMcVAHnUNpGlW0DNxbWKBLSUVW3aNPMr1D9brfWRxvM7Dzh+Sj/V07vzITsA"

const CSS =
  "@font-face{font-family:SpnDisplay;font-weight:400;font-style:normal;font-display:swap;src:url(data:font/woff2;base64," +
  FONT_DISPLAY +
  ") format('woff2')}" +
  "@font-face{font-family:SpnSans;font-weight:600;font-style:normal;font-display:swap;src:url(data:font/woff2;base64," +
  FONT_SANS +
  ") format('woff2')}" +
  ".spn-root{position:relative;width:100%;overflow:hidden;isolation:isolate;container-type:inline-size;" +
  "background:var(--color-foreground,#0b0b09);color:var(--color-background,#fff);--spn-ink:var(--spn-accent)}" +
  ".dark .spn-root,.spn-root.spn-dark{--spn-ink:color-mix(in oklab,var(--spn-accent) 72%,#fff)}" +
  ".spn-sans{font-family:SpnSans,ui-rounded,'SF Pro Rounded',system-ui,sans-serif;font-weight:600}" +
  ".spn-bar{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 42px 0;pointer-events:none}" +
  ".spn-bar>*{pointer-events:auto}" +
  ".spn-brand{display:inline-flex;align-items:center;gap:10px;font-size:24px;line-height:1;letter-spacing:-0.01em;color:var(--color-background,#fff);text-decoration:none;white-space:nowrap}" +
  ".spn-mark{width:28px;height:28px;flex:none}" +
  ".spn-right{display:flex;align-items:center;gap:6px;min-width:0}" +
  ".spn-pill{display:flex;align-items:center;height:58px;padding:0 10px;border-radius:999px;" +
  "background:color-mix(in oklab,var(--color-background,#fff) 90%,var(--color-foreground,#000))}" +
  ".spn-item{display:inline-flex;align-items:center;gap:7px;height:44px;padding:0 13px;border:0;margin:0;background:none;border-radius:999px;" +
  "font-size:19px;line-height:1;color:var(--color-foreground,#0b0b09);text-decoration:none;cursor:pointer;white-space:nowrap;transition:color .25s ease}" +
  ".spn-item[aria-expanded='true']{color:color-mix(in oklab,var(--color-foreground,#0b0b09) 58%,transparent)}" +
  ".spn-item:focus-visible,.spn-cta:focus-visible,.spn-brand:focus-visible{outline:2px solid var(--spn-ink);outline-offset:2px}" +
  ".spn-chev{width:10px;height:10px;flex:none;color:var(--spn-ink);transition:transform .3s cubic-bezier(.22,1,.36,1)}" +
  ".spn-item[aria-expanded='true'] .spn-chev{transform:rotate(180deg)}" +
  ".spn-cta{display:inline-flex;align-items:center;height:58px;padding:0 31px;border-radius:999px;background:var(--spn-accent);color:#fff;" +
  "font-size:19px;line-height:1;text-decoration:none;white-space:nowrap;transition:filter .2s ease}" +
  ".spn-panel{position:absolute;z-index:2;left:24.8%;right:-32.8%;top:-4.3%;height:76%;transform-origin:100% 0;transform:rotate(58deg);" +
  "visibility:hidden;background:var(--color-background,#fff);will-change:transform;backface-visibility:hidden}" +
  ".spn-links{position:absolute;left:6.2cqw;bottom:12%;margin:0;padding:0;list-style:none}" +
  ".spn-link{display:block;width:max-content;font-family:SpnDisplay,'Anton','Bebas Neue',Impact,'Arial Narrow',sans-serif;font-weight:400;" +
  "font-size:clamp(34px,5.6cqw,108px);line-height:.9;text-transform:uppercase;letter-spacing:0;color:var(--spn-ink);text-decoration:none;" +
  "transition:transform .22s cubic-bezier(.22,1,.36,1),opacity .22s cubic-bezier(.22,1,.36,1)}" +
  ".spn-link:focus-visible{outline:none;opacity:.66;transform:translateX(.37em)}" +
  ".spn-stage{position:absolute;inset:0;z-index:1}" +
  "@media (hover:hover) and (pointer:fine){.spn-link:hover{opacity:.66;transform:translateX(.37em)}.spn-cta:hover{filter:brightness(1.12)}}" +
  "@container (max-width:720px){.spn-bar{padding:14px 16px 0}.spn-brand{font-size:19px;gap:8px;transition:opacity .2s ease}.spn-root[data-open] .spn-brand{opacity:0;pointer-events:none}.spn-mark{width:22px;height:22px}" +
  ".spn-pill{height:46px;padding:0 4px}.spn-item{height:38px;padding:0 10px;font-size:15px;gap:5px}" +
  ".spn-cta{height:46px;padding:0 18px;font-size:15px}" +
  ".spn-panel{left:4%;right:-40%;top:-3%;height:70%}.spn-links{left:7cqw;bottom:10%}.spn-link{font-size:clamp(30px,11cqw,64px)}}" +
  "@container (max-width:520px){.spn-cta{display:none}.spn-brand-text{display:none}}" +
  "@media (prefers-reduced-motion:reduce){.spn-panel{transition:opacity .16s linear}.spn-link,.spn-chev,.spn-item,.spn-cta{transition:none}" +
  ".spn-link:hover,.spn-link:focus-visible{transform:none}}"

function Chevron() {
  return (
    <svg className="spn-chev" viewBox="0 0 10 10" aria-hidden="true" fill="none">
      <path d="M2 3.6 5 6.6 8 3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** A disc with a hinge notch — the sheet's pivot, as a mark. */
function Mark() {
  return (
    <svg className="spn-mark" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12" fill="currentColor" />
      <path d="M14 14 26 9.6A12 12 0 0 0 20.3 3.9Z" fill="var(--color-foreground,#0b0b09)" />
      <circle cx="14" cy="14" r="2.4" fill="var(--color-foreground,#0b0b09)" />
    </svg>
  )
}

export default function SwingPanelNav({
  brand = "Kedhareswer",
  brandHref = "#",
  menus = DEFAULT_MENUS,
  cta = DEFAULT_CTA,
  accent = "#3355ff",
  height = "100svh",
  className,
  children,
}: SwingPanelNavProps) {
  const uid = React.useId().replace(/:/g, "")
  const panelId = "spn-panel-" + uid
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const panelRef = React.useRef(null as HTMLDivElement | null)
  const pillRef = React.useRef(null as HTMLDivElement | null)
  const triggerRefs = React.useRef([] as (HTMLButtonElement | null)[])
  const [active, setActive] = React.useState(-1)
  const [shown, setShown] = React.useState(-1)
  const sim = React.useRef({ mode: "idle", angle: SWING.from, vel: 0, from: 0, t: 0, next: -1, raf: 0, last: 0, focusFirst: false })
  const leaveTimer = React.useRef(0)
  const shownRef = React.useRef(shown)
  shownRef.current = shown
  const activeRef = React.useRef(active)
  activeRef.current = active


  const reduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const finePointer = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches

  const paint = React.useCallback(() => {
    const el = panelRef.current
    if (!el) return
    const s = sim.current
    const visible = s.mode !== "idle"
    el.style.transform = "rotate(" + s.angle.toFixed(3) + "deg)"
    el.style.visibility = visible ? "visible" : "hidden"
    if (visible) el.removeAttribute("inert")
    else el.setAttribute("inert", "")
  }, [])

  const tick = React.useCallback(
    (now: number) => {
      const s = sim.current
      const dt = Math.min(0.05, Math.max(0, (now - s.last) / 1000))
      s.last = now
      if (s.mode === "open") {
        const r = stepSpring(s.angle, s.vel, dt)
        s.angle = r[0]
        s.vel = r[1]
        if (settled(s.angle, s.vel)) {
          s.angle = SWING.rest
          s.vel = 0
          s.mode = "rest"
        }
      } else if (s.mode === "close") {
        s.t += dt * 1000
        s.angle = closeAngle(s.from, s.t)
        if (s.t >= SWING.closeMs) {
          if (s.next >= 0) {
            setShown(s.next)
            s.next = -1
            s.mode = "open"
            s.angle = SWING.from
            s.vel = 0
          } else {
            s.mode = "idle"
            setShown(-1)
          }
        }
      }
      paint()
      if (s.mode === "open" || s.mode === "close") s.raf = requestAnimationFrame(tick)
      else s.raf = 0
    },
    [paint],
  )

  const run = React.useCallback(() => {
    const s = sim.current
    if (s.raf) return
    s.last = performance.now()
    s.raf = requestAnimationFrame(tick)
  }, [tick])

  const openMenu = React.useCallback(
    (i: number, focusFirst: boolean) => {
      const s = sim.current
      setActive(i)
      s.focusFirst = focusFirst
      if (reduced()) {
        cancelAnimationFrame(s.raf)
        s.raf = 0
        setShown(i)
        s.mode = "rest"
        s.angle = SWING.rest
        s.vel = 0
        paint()
        const el = panelRef.current
        if (el) {
          el.style.opacity = "0"
          requestAnimationFrame(() => {
            if (panelRef.current) panelRef.current.style.opacity = "1"
          })
        }
        return
      }
      if (s.mode === "idle") {
        setShown(i)
        s.mode = "open"
        s.angle = SWING.from
        s.vel = 0
      } else if (s.mode === "close" && s.next < 0 && shownRef.current === i) {
        s.mode = "open"
        s.vel = 0
      } else if (s.mode === "close") {
        s.next = i
      } else if (shownRef.current !== i) {
        s.mode = "close"
        s.from = s.angle
        s.t = 0
        s.next = i
      }
      paint()
      run()
    },
    [paint, run],
  )

  const closeMenu = React.useCallback(() => {
    const s = sim.current
    setActive(-1)
    if (s.mode === "idle") return
    if (reduced()) {
      cancelAnimationFrame(s.raf)
      s.raf = 0
      s.mode = "idle"
      s.angle = SWING.from
      setShown(-1)
      paint()
      return
    }
    if (s.mode === "close") {
      s.next = -1
      return
    }
    s.mode = "close"
    s.from = s.angle
    s.t = 0
    s.next = -1
    run()
  }, [paint, run])

  // Keyboard opens move focus into the sheet once its links exist.
  React.useEffect(() => {
    const s = sim.current
    if (shown < 0 || !s.focusFirst) return
    s.focusFirst = false
    const first = panelRef.current?.querySelector("a") as HTMLAnchorElement | null
    first?.focus({ preventScroll: true })
  }, [shown])

  // Escape and outside presses close; cancel the loop on unmount.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || activeRef.current < 0) return
      const back = triggerRefs.current[activeRef.current]
      closeMenu()
      back?.focus({ preventScroll: true })
    }
    const onDown = (e: PointerEvent) => {
      if (activeRef.current < 0) return
      const t = e.target as Node
      if (panelRef.current?.contains(t) || pillRef.current?.contains(t)) return
      closeMenu()
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    const s = sim.current
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
      cancelAnimationFrame(s.raf)
      window.clearTimeout(leaveTimer.current)
    }
  }, [closeMenu])

  React.useEffect(() => {
    paint()
  }, [paint])

  // On a mouse, leaving the pill and the sheet closes it — the way the reference drops away.
  const onRegionLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !finePointer()) return
    window.clearTimeout(leaveTimer.current)
    leaveTimer.current = window.setTimeout(() => {
      if (activeRef.current >= 0) closeMenu()
    }, 90)
  }
  const onRegionEnter = () => window.clearTimeout(leaveTimer.current)

  const current = shown >= 0 ? menus[shown] : undefined

  return (
    <div
      ref={rootRef}
      className={"spn-root" + (className ? " " + className : "")}
      data-open={active >= 0 ? "" : undefined}
      style={{ height, width: "100%", ["--spn-accent" as string]: accent } as React.CSSProperties}
    >
      <style>{CSS}</style>

      {children ? <div className="spn-stage">{children}</div> : null}

      <div
        ref={panelRef}
        id={panelId}
        className="spn-panel"
        role="region"
        aria-label={current ? current.label : undefined}
        onPointerEnter={onRegionEnter}
        onPointerLeave={onRegionLeave}
      >
        {current?.links ? (
          <ul className="spn-links">
            {current.links.map((l) => (
              <li key={l.label}>
                <a className="spn-link" href={l.href ?? "#"} onClick={() => closeMenu()}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <nav className="spn-bar spn-sans" aria-label="Main">
        <a className="spn-brand" href={brandHref}>
          <Mark />
          <span className="spn-brand-text">{brand}</span>
        </a>
        <div className="spn-right">
          <div ref={pillRef} className="spn-pill" onPointerEnter={onRegionEnter} onPointerLeave={onRegionLeave}>
            {menus.map((m, i) =>
              m.links && m.links.length ? (
                <button
                  key={m.label}
                  ref={(el) => {
                    triggerRefs.current[i] = el
                  }}
                  type="button"
                  className="spn-item spn-sans"
                  aria-expanded={active === i}
                  aria-controls={panelId}
                  onClick={(e) => (active === i ? closeMenu() : openMenu(i, e.detail === 0))}
                >
                  {m.label}
                  <Chevron />
                </button>
              ) : (
                <a key={m.label} className="spn-item" href={m.href ?? "#"}>
                  {m.label}
                </a>
              ),
            )}
          </div>
          {cta ? (
            <a className="spn-cta" href={cta.href}>
              {cta.label}
            </a>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
