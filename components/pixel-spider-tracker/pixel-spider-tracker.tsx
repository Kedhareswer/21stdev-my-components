"use client"

import * as React from "react"

// #region tracker
/* Everything the tracker knows, as plain data and pure functions, so the test
   can lift it out and run it: the world, the places, the projections, the
   pixel font and the sprites. The component below only paints it. */

export type SightingKind = "red" | "green" | "white" | "result"

export type Place = {
  name: string
  country?: string
  lat: number
  lon: number
  note?: string
  aka?: string[]
}

export type Sighting = Place & { id: string; kind?: SightingKind; time?: string }

export type ViewMode = "globe" | "map"

export type View = { mode: ViewMode; lon: number; lat: number; zoom: number }

export type Field = {
  bw: number
  bh: number
  kind: Uint8Array
  cell: Int16Array
  light: Uint8Array
}

/* Natural Earth 1:50m land (public domain), rasterised to 0.5° cells and
   run-length encoded: runs alternate sea/land from the north-west corner,
   base-32 digits with a continuation bit. */
export const LAND_W = 720
export const LAND_H = 360
const LAND_RLE = "ptCBDDCZzCBCFCRCGhEFDhHyQFDhJMDCBEFECBhGyMhWHFBiDCFJGkPCseEGGCNBZJiOCRkIFiKCqSIFDBMEUGjGjaCBBBFGGEFCDhZKqMOBCCFCaGifBFiHBBCDBCDhLEGECBBCBCiDKqOSCICPBDNiaCChZHBBCECCCLkDCCMpVFVPBSUidhcBBHBGICkNJFDpTHDDHMBZJjChfBCTkeJpTEDFHDBBBBCYGjGEBiABEHEDkaHGBoWBCGPDKFLEBPPjGDBiDFGHtPIUCcBGKBCXjDBBiCGkPBYIoMJDCICXIFZRieBBiLCjCGiAMiUBlQHGEBBGEJCBCBGJIQCWJBBCiUDBkfCCKhXDFaBBnfCCLFHGJMGKGhMiPkcMhYhIBChLBDGBHmEXCDHEEFCahLiLBBBCkWIhXhShPLBECFBBmBHfDDRBGhOiIBCkXIhUBBhShVCmAJDCjaiJkWHhYhPEChXBleQUCIIEJGFIBhRhdBJkVHhWBBDBhKCCBCCBhXElZQCDMBDDIFFIFGCIBIhKhaCEkaFcDSLBhHEVKKcClXNBHCEDCCFGCCHDDCCFGCKhRCBhYBIkVGbHFBHBCiBBfYClZMDTBGIJDCIHDICEBFhHhfCCkVGaIFBFEEicBCTKCIlNIDWBGKFDDIIBVCBhEEBhekTIaICEBLCBBicGBNLCGheFhJCiBDKZQHJGCbhCBBhXCGkUBBFWLCFEJBidFLBbhXChIBBNiFcPIHhEBDdDDhPBEDFiZBCCBBBCBChSGUKDSBkYiObhJBXFBWKKKPBSCBbCBhUCDidCBDBLhXCPLDRBkaiKhLTDBHDBDDJdBCFCEGODHCFSBBYGBBBhWiUCBTBCBDhVGJLClNQDCMhIhSFHBaKOBJHFDBBFDBHIFBCBDSfhUiUhDBBaDVJGJDldFRBCajHCJEDHBGGEGBEGHKBDMhDhSiREChIWBICIDCNEIDFBlHBhKXjGNCCDNEEMDBBHMDDNBBbBBhLiXBBBChOKEJGBBBhEDGBmVWjEFFDLDDBCCCBPDJJFFQWBCBBhEjAhTHDHhQEmcWjQBhIBLJBJSShJjChTGDFhQEmeCFSjNBhOBESXRhGifhHCOHhRCDDmXBSIEGkWCBUOCISfBEZCLDhYBBhIGGEDBoRCQGkbCFBDWLFGTDBbcECMhWUEVLoYHHMkeDENVEDWZhDShVRISLoYLDNJCkTCIJGBQBBbBDThBBCRhTTHVDFCoOBCBEhIkSDKJBHPcUBBhFNhUVGYEoZhJkJBEGGDEQQaWhIGhUBBWFpXWEMkQKBNCMHCEcUjCWGpahAkRSDWBCFDBdRjCWGpYBEekRTBGBDGBDJFhBOiHBYYIobCYhEkRbBDMhNOifZIoQGFCUhJdCjQhBMhOMifYJoOHDFRhNBCXBGEjIhCQhLBDHifZIoNIBFRhLDCYCJFjEhCQCBGBhGCBCiTBMbCBEHHncOHCBGBhXSCESCBiZhDQIDkKBBaTncNFiFQECYiYhCRIEkJBBJBPKnOHBLGKGiGBEBBCBHfDBiTBBeRBCEHkJIDMNnNhDGCBiNHCChACBiTfdjQBCEUEGKLBEnIhEHiREDDhBBCBBiSfejRDfKEBLnHhCMiNEEDhCCBBBiShAdjPJXCDJDBGDDnFhEMiMDhNCDiYYejPHWEEJInLhDOiJEhPBCBBiZRCEejQGVGEGKnKhEPiFEhVCCiaThBjMBCGUEEBBCOnIhFNiGCCBhWjELhDBBjIBEHUCBFEBMnGhHNiDDhcBFjAFhLjDGEEUDCCLCDnHEBhDNLBjcifGhKjBJEGTECCGnSDBBBFBaIiCBiDBEjBGhGCFidIGGRLBnWCEEBaIhfBiHBFBBidGhOidHDKKoQBCaIkIBEBBidCBDhOidHELGoSBDZFhWBiVBHibHhOiaIEMGoVbEhQCjBifDhNidDHMGoSCDaDkVifBhKDCjKJDoTDDaCkUCCkHECjHHFoWDDZBkXjcFBCEFCjGBCBKoWDEWCkaECjSGCKCBBjRoYDElUECjOKCIFBDjIocDCCBlVDCjLCHMJjFBDobEClZBDjKBJLLjCpBEBlaDBjJBJLKCCjCoeFBlbjWTBCCjGiRBmIGClajWBBGBOBjGiODXGlLHDlajFBQCCCDjWhfCIGVIlKIBlbjaDBBBjWcBhBGEGUKlJYBlMjDBQEGjYaDhAHHBVIlLJCLBlPjSDFjcbFcJCGTIlLLCIBlRjOGDjeUCGFbVQHlLLEDBlVjMICjfSGFGZWQHlJMHlVjMjbZECIHGWZOIlBBEOIlUjLjcYOBBGIUbMKkeDBNIlXjLjdXLCEGJSbNJkcTBEClZjLjbYLCGHHRJGMOIBCkYUBlfjGkBVXGGTFLIQLkWXBldjGkBTODKGEJBBCDFhHHBCkFCPVDlcjFkCTQCLECBCGBDEhOGkIDNXElcjEkCSFCKCNBGHGhPIkEEECGZElcifBBBBkCSSCNCHGFhPIkDFBHEZEldieBCifBhDThABJEIhMKjfQFXElficCCkERhACKBCDEhNKkAOHWDmCibBBjEBhAQbFLBBDHhNKkCDBLFUEmBickHOXBHDNDJhOHkCCFJFSFmCickLFCBLEBLHBZGCGBBBeEkJJHOImDickMBMUhGBFDElJMGHBFJmEickLBKXhSlINGNKmEiZkNDBBEZZEBBNCElHOGGNCBmGiYkMhEhKCFlGPBKFBDCCmMiTkPhBhTlKRBDDCGmTiOkPhFhRlKSBBBDECBmViMkOhHhQlLLBGFBBmbiLjeBPhOODZlMPBCEmeiJkOhSJGYlNSCnAiHkPhSJKTlPPEnADEhfkPhVHPFFDlPnVDDhfkPhYEmLnVDDhNBBCBEJkQoEBBnWDDhDBBCHIBDFkOjVEkPnWEChCICBBMEkNiWBDBaFkPnXDChBaEjdBNibBbFkNnWBCCDddEjfBKiZBeGkLQBnHBBDEadFkHidEbGkJnaFDaeFkFifEbHkHndDDZfEkFifEcHDBBCjdRBnOCEYfEkDjBFbOjdQBnQBEZfDkDjCFaCBJBCjcoBCFWhBBkDjEEbBBICJDBBGjKoBDFVhGBjejEEdGEVjHFCndDFUhHBjcjGEdFFVjFFCoACFTlDjHGhHUjDFDoBBGRlEjHGhJTjAHDoJQcJKBjTjJGhJWhIBhQKCoLPbCDHjcjKFhKSGBhFChLOBoLQdBFFjZjMEhJUFBhCFhIoePPGREjXjMEhIWEBdKfFBlaBjFRNHSEjXjLFhGYBEcLcHBpARNGUHjUjKGhEBBcbNbmDCjDSMGcDBCjMjMHhBeZRZHDlaBjFSKHdIjJjMHhCeYRZFEpDQJIeIjJjLHhAhAXTXGEpFRBMTEFGBBCBDDjDjNGehBWVXdEoQbhOBjBjNHbhDVWYcDoSZkRjOHZhETYZbEoUWkQjPHWhISYDBBBUaEoWHBMhVCiZjPIThKPaEDVZDoaCFKBIkHjQGThLOhCWXDpDSjYBNjRGShNMhEWWDpESkEjVENhRMhEWYBpFSkEjVDMhTLhEWXCCBpGNkGjVBBBIhWLhEWWBBBBBBDpFCBIhMBiYjXBFhaMhEDCRWCEBpJIkFjYBChdKZBLDCRXBpPHXCjNjYhfKhFDFNYBDCBCpIGWCjQjVPBhRJZBLDGMaBFBpJEUEDEjJjXKFhSIhFCHMaCBBBCpKEQOOBidjVDLhSIhEDHKcBBBpNFQHBLDECBidkDhSHhGBLEZBHCpNBBDPHCTjAkBhTFCBhEBMDYBHBCBpPDFEEICUifkAhUGBChDDKCYBJBEBpNICCCfjAjfhUDEChCEhDBODpPDEhGidjehWCEDhCEhNHpQDDhHidjdhcDhDChMDBFpRBFhHidjbhdEhDChBBJBDDBBpYhHidjZheEhEDeCNDpahIieZFiZheDhFEcDNDpahPiYUKiYjHEbFNBpahSiWMBENiWidEHFZIqGhTiXEYiVifFFGWIqIhUjZiOjAFEGVIqKhUjXBBiMjCFEFJBKIqKhVjaiKjEFEETJqJhWjaiJjCBDFDEQNqHhYjZiHjJFDEOOUBkUBkchajXiHjLGDCLBCOTBpShajXiFjKBDHNTFBGBFCpPhbjYiEjMBCHNSEJGCpPhbBBjWiDjRGBBLRUBoZCUhaCEjUiCjTHLREBPBGBoSBViABCjQiCjUHMQEBGBHDGFDBoeiABFjOiCjRBDILOFCBDRGpChfBJjMiAjWICBINGFFBKBDEECBCoZiJjMhfjVBCIKNFGVBHGoZiLjJhcjbKCBENFDBCUBBDDLoViRjEhbjbJMCBFGDBDHCDEEFBOSBneiVjDhajcIRCBBGCBDIBHBEBBUoOiWjDhYjeHbCCDYUNBBBnbiYjDhWkBFbCCBdSMCndibifhWBBkAEbCEBdRKCneiciehWkFBhVBCBHREGGBnYicifhWkFEhUBISECJBnZiaifhWkEGEChNBJQRBnZiZjAhVkGMhURUBnWiZjAhVkJBCKXBJBNMCFSBDBnUiYjBhUkPJPEZDCHFESCnWiYjBhUkXBBBBDDEGEbGGEYBnRiWjBhVlJDhCBIECBVBnQiVjChVlACGDhNFUCnSiUjDhVlHBhSEoGiSjFhWlFBiNBnQiRjGhVlVBBBTCoYiPjHhVFBlNCDCRCoYiOjHhWRBlDBBIBBJDoZiNjGhXRBlCMLDoYiLjHhYRClAMLEiYBmAiKjHhYPElANKEoZiKjHhYPEkYDENBBJEoZiKjGhaNFkWGDMMHoYiIjGhZNHkVGBPLIhKBnNiHjGhZMGBBkUYKIoaiFjGhYJLkTBBaIIhNBWBmXiDjGhXKKkSBBeFJhNBUBmbiBjFhVMLkRhCEKkBBkciAjFhTOLkRhQhfCmehejHhSOLkRhRoehejIhQPKkRhSoehejIhOSJkRhToehcjKhLUJkPhWodhbjLhLUISBjahbobhbjMhLSJkIiBfBEBnVhajNhLRKOBjYiChABnZhajOhLQJkGiFhACnXhZjQhKQJkFiGhCBnVhZjRhKQJkDiLoVhUjWhKQIkFiKoVhSjYhKQIkEiMoUhPjbhKQIkEiNoThOjchJSGkFiOBBoQhNjehFWDkIiNBBoQhMjfhDlDiOoRhMjfhElABBiOoQhNjfhElBiPoQhNkAhDlCiOoQhNkAhClDiPoPhNkBhBlEiOoOhNkDflFiOoOhMkFdlHiNoOhLkGclIiNoOhIBCkHblIiMoPhIkKalJiMoPhIkLYlLiLoPhHkMXlMbGhKoPhHkNVlNYMhGoQhGkNUlPTShEoRhGkNTlQRVGBboRhFkQPlSRXEBcoRbBJkRGlaJhACCboScDEkUBmAFhCBDBBZoResIYhNCnDesECDWhPCnBhAsJVhRBnAhBsJUhRBBBmdhBsKUhRDmdhAsMShTDCCmYfsPGBFhWImYcuUHmaVuZGmbXuZFmbWubDmbXseBhcDmbStDIhPCBFmdBBPtEHhOGmfBBTtCFhPFnABBQCBtCFhOFnACBQtGChOFWBmOPuVInEPuTHnEBBQuSHnGOuUInHMuVHnFCBMuWFnGQ2BR1fBBP1eR1fQ2APoRBBBtMP2BBBM2DM2EBBK2GKSE1OBBJBBRB1UBBDBE2HCBBBE2GCBCCF2IBDFhcB0MBBJBBhXB0OBBCroTBBD2EBCD2HBCECB2DCBE2JE2LF2GBCGBBnBKiaJKHhBHCCpYBCFnBBDMiEhEDLPIFXhMBnfCBFnEUhShcDHDhQpJDmdhKfjdBEpFEmXhXSkIpEFBBFBlbCNhaRkSBCCDoKEGIBBldFJhcPlDncBGFCMkdBhBIBBDhbOlIoECCLjfBFBJBHBFBEBOCIiJKlRnYDFFCLjQBECOOBOEDCCHiSGlTBKnRICNjFDDDNkIGmCnIGBICMjDkeHmIlRHBChQBBEDNjCkeCBCmIlOBWBEBhKOicBClACmMlOMDCBFCGDBKDGDBBHQCCiYlGBmHkFBFFhEEBhECJCeiQBJrMkOEMDDCTiPiSBLrIjWDNIFPFCViKBBiYrJCBjQhfFJGiFibrIjMkfiSrVjBFBkbiRrdidCBCGkJKBiSsDiOIFBECFkKiXsJGBiFRBkZiNsNFBiNkOBJhaLQsRBBBChbCNkRFFSEhCKTsLBDiAIRkNUEDChBPNFIrdiMFVkRSCeQWBBBKrTjDkVTBJEMSdrajIkTHDPGLKcsIiVlUhTsUiblRhOsaiYlPJCNQFsdiVlYLtfhNLRlfFuFhR1LhN1PZSn2G"
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

export function decodeLand(rle: string = LAND_RLE, w: number = LAND_W, h: number = LAND_H): Uint8Array {
  const out = new Uint8Array(w * h)
  let i = 0
  let v = 0
  let n = 0
  for (let k = 0; k < rle.length; k++) {
    const d = B64.indexOf(rle[k])
    n = n * 32 + (d & 31)
    if (d < 32) {
      out.fill(v, i, Math.min(i + n, out.length))
      i += n
      v ^= 1
      n = 0
    }
  }
  return out
}

export function wrapLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180
}

export function landAt(mask: Uint8Array, lat: number, lon: number): boolean {
  const x = Math.min(LAND_W - 1, Math.max(0, Math.floor(((wrapLon(lon) + 180) / 360) * LAND_W)))
  const y = Math.min(LAND_H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * LAND_H)))
  return mask[y * LAND_W + x] === 1
}

/* [name, country, lat, lon, aliases] — a pocket gazetteer so search works with
   no network. Pass `onSearch` to plug in a real geocoder. */
const RAW_PLACES: [string, string, number, number, string?][] = [
  ["Tokyo", "Japan", 35.68, 139.69], ["Osaka", "Japan", 34.69, 135.5], ["Kyoto", "Japan", 35.01, 135.77],
  ["Sapporo", "Japan", 43.06, 141.35], ["Seoul", "South Korea", 37.57, 126.98], ["Busan", "South Korea", 35.18, 129.08],
  ["Beijing", "China", 39.9, 116.4, "peking"], ["Shanghai", "China", 31.23, 121.47], ["Hong Kong", "China", 22.32, 114.17, "hk"],
  ["Shenzhen", "China", 22.54, 114.06], ["Chengdu", "China", 30.57, 104.07], ["Taipei", "Taiwan", 25.03, 121.57],
  ["Manila", "Philippines", 14.6, 120.98], ["Bangkok", "Thailand", 13.76, 100.5], ["Hanoi", "Vietnam", 21.03, 105.85],
  ["Ho Chi Minh City", "Vietnam", 10.82, 106.63, "saigon"], ["Singapore", "Singapore", 1.35, 103.82],
  ["Kuala Lumpur", "Malaysia", 3.14, 101.69, "kl"], ["Jakarta", "Indonesia", -6.21, 106.85], ["Denpasar", "Indonesia", -8.65, 115.22, "bali"],
  ["New Delhi", "India", 28.61, 77.21, "delhi"], ["Mumbai", "India", 19.08, 72.88, "bombay"], ["Bengaluru", "India", 12.97, 77.59, "bangalore"],
  ["Chennai", "India", 13.08, 80.27, "madras"], ["Kolkata", "India", 22.57, 88.36, "calcutta"], ["Hyderabad", "India", 17.39, 78.49],
  ["Pune", "India", 18.52, 73.86], ["Jaipur", "India", 26.91, 75.79], ["Kochi", "India", 9.93, 76.27, "cochin"],
  ["Karachi", "Pakistan", 24.86, 67.01], ["Lahore", "Pakistan", 31.55, 74.34], ["Dhaka", "Bangladesh", 23.81, 90.41],
  ["Kathmandu", "Nepal", 27.72, 85.32], ["Mount Everest", "Nepal", 27.99, 86.93, "everest"], ["Colombo", "Sri Lanka", 6.93, 79.86],
  ["Dubai", "United Arab Emirates", 25.2, 55.27], ["Abu Dhabi", "United Arab Emirates", 24.45, 54.38], ["Riyadh", "Saudi Arabia", 24.71, 46.68],
  ["Doha", "Qatar", 25.29, 51.53], ["Tehran", "Iran", 35.69, 51.39], ["Istanbul", "Turkey", 41.01, 28.98], ["Ankara", "Turkey", 39.93, 32.86],
  ["Cairo", "Egypt", 30.04, 31.24], ["Lagos", "Nigeria", 6.52, 3.38], ["Nairobi", "Kenya", -1.29, 36.82],
  ["Addis Ababa", "Ethiopia", 9.03, 38.74], ["Johannesburg", "South Africa", -26.2, 28.05, "joburg"], ["Cape Town", "South Africa", -33.92, 18.42],
  ["Casablanca", "Morocco", 33.57, -7.59], ["Marrakesh", "Morocco", 31.63, -8.01, "marrakech"], ["Accra", "Ghana", 5.6, -0.19],
  ["Dakar", "Senegal", 14.72, -17.47], ["Kinshasa", "DR Congo", -4.44, 15.27], ["Luanda", "Angola", -8.84, 13.23],
  ["Antananarivo", "Madagascar", -18.88, 47.51], ["London", "United Kingdom", 51.51, -0.13], ["Manchester", "United Kingdom", 53.48, -2.24],
  ["Edinburgh", "United Kingdom", 55.95, -3.19], ["Dublin", "Ireland", 53.35, -6.26], ["Paris", "France", 48.86, 2.35],
  ["Marseille", "France", 43.3, 5.37], ["Nice", "France", 43.7, 7.27], ["Berlin", "Germany", 52.52, 13.4], ["Munich", "Germany", 48.14, 11.58],
  ["Hamburg", "Germany", 53.55, 9.99], ["Amsterdam", "Netherlands", 52.37, 4.9], ["Brussels", "Belgium", 50.85, 4.35],
  ["Madrid", "Spain", 40.42, -3.7], ["Barcelona", "Spain", 41.39, 2.17], ["Lisbon", "Portugal", 38.72, -9.14],
  ["Rome", "Italy", 41.9, 12.5], ["Milan", "Italy", 45.46, 9.19], ["Venice", "Italy", 45.44, 12.32], ["Zurich", "Switzerland", 47.38, 8.54],
  ["Vienna", "Austria", 48.21, 16.37], ["Prague", "Czechia", 50.08, 14.44], ["Warsaw", "Poland", 52.23, 21.01],
  ["Budapest", "Hungary", 47.5, 19.04], ["Athens", "Greece", 37.98, 23.73], ["Stockholm", "Sweden", 59.33, 18.07],
  ["Oslo", "Norway", 59.91, 10.75], ["Copenhagen", "Denmark", 55.68, 12.57], ["Helsinki", "Finland", 60.17, 24.94],
  ["Reykjavik", "Iceland", 64.15, -21.94], ["Moscow", "Russia", 55.76, 37.62], ["Saint Petersburg", "Russia", 59.93, 30.34, "st petersburg"],
  ["Novosibirsk", "Russia", 55.01, 82.93], ["Vladivostok", "Russia", 43.12, 131.89], ["Kyiv", "Ukraine", 50.45, 30.52, "kiev"],
  ["New York", "United States", 40.71, -74.01, "nyc|new york city|manhattan"], ["Los Angeles", "United States", 34.05, -118.24, "la"],
  ["Chicago", "United States", 41.88, -87.63], ["San Francisco", "United States", 37.77, -122.42, "sf"], ["Seattle", "United States", 47.61, -122.33],
  ["Miami", "United States", 25.76, -80.19], ["Houston", "United States", 29.76, -95.37], ["Washington", "United States", 38.91, -77.04, "dc|washington dc"],
  ["Boston", "United States", 42.36, -71.06], ["Las Vegas", "United States", 36.17, -115.14, "vegas"], ["Denver", "United States", 39.74, -104.99],
  ["Austin", "United States", 30.27, -97.74], ["Atlanta", "United States", 33.75, -84.39], ["Phoenix", "United States", 33.45, -112.07],
  ["New Orleans", "United States", 29.95, -90.07], ["Honolulu", "United States", 21.31, -157.86, "hawaii"], ["Anchorage", "United States", 61.22, -149.9, "alaska"],
  ["Toronto", "Canada", 43.65, -79.38], ["Vancouver", "Canada", 49.28, -123.12], ["Montreal", "Canada", 45.5, -73.57], ["Calgary", "Canada", 51.05, -114.07],
  ["Mexico City", "Mexico", 19.43, -99.13, "cdmx"], ["Guadalajara", "Mexico", 20.66, -103.35], ["Cancun", "Mexico", 21.16, -86.85],
  ["Havana", "Cuba", 23.11, -82.37], ["Panama City", "Panama", 8.98, -79.52], ["Bogota", "Colombia", 4.71, -74.07], ["Medellin", "Colombia", 6.24, -75.58],
  ["Caracas", "Venezuela", 10.48, -66.9], ["Quito", "Ecuador", -0.18, -78.47], ["Lima", "Peru", -12.05, -77.04], ["Cusco", "Peru", -13.53, -71.97],
  ["La Paz", "Bolivia", -16.49, -68.12], ["Santiago", "Chile", -33.45, -70.67], ["Buenos Aires", "Argentina", -34.6, -58.38],
  ["Montevideo", "Uruguay", -34.9, -56.16], ["Sao Paulo", "Brazil", -23.55, -46.63], ["Rio de Janeiro", "Brazil", -22.91, -43.17, "rio"],
  ["Brasilia", "Brazil", -15.79, -47.88], ["Manaus", "Brazil", -3.12, -60.02, "amazon"], ["Sydney", "Australia", -33.87, 151.21],
  ["Melbourne", "Australia", -37.81, 144.96], ["Brisbane", "Australia", -27.47, 153.03], ["Perth", "Australia", -31.95, 115.86],
  ["Auckland", "New Zealand", -36.85, 174.76], ["Wellington", "New Zealand", -41.29, 174.78], ["Suva", "Fiji", -18.14, 178.44],
  ["Ulaanbaatar", "Mongolia", 47.89, 106.91], ["Almaty", "Kazakhstan", 43.24, 76.89], ["Tashkent", "Uzbekistan", 41.3, 69.24],
  ["McMurdo Station", "Antarctica", -77.85, 166.67, "south pole|antarctica"], ["Nuuk", "Greenland", 64.18, -51.72, "greenland"],
]

const COUNTRY_AKA: Record<string, string[]> = {
  "united states": ["usa", "us", "america", "united states of america"],
  "united kingdom": ["uk", "britain", "great britain", "england", "scotland"],
  "united arab emirates": ["uae", "emirates"],
  "south korea": ["korea"],
  "dr congo": ["congo"],
  czechia: ["czech republic"],
  netherlands: ["holland"],
}

export const PLACES: Place[] = RAW_PLACES.map(([name, country, lat, lon, aka]) => ({
  name,
  country,
  lat,
  lon,
  aka: aka ? aka.split("|") : undefined,
}))

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

export function formatCoord(lat: number, lon: number): string {
  return (
    Math.abs(lat).toFixed(2) + (lat < 0 ? "S" : "N") + " " + Math.abs(wrapLon(lon)).toFixed(2) + (wrapLon(lon) < 0 ? "W" : "E")
  )
}

/* "35.68, 139.69", "35.68N 139.69E", "12 S 77 W" */
export function parseCoords(q: string): Place | null {
  const m = q
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*°?\s*([NSns])?\s*[\s,;]\s*(-?\d+(?:\.\d+)?)\s*°?\s*([EWew])?$/)
  if (!m) return null
  let lat = Number(m[1])
  let lon = Number(m[3])
  if (m[2] && /s/i.test(m[2])) lat = -Math.abs(lat)
  if (m[4] && /w/i.test(m[4])) lon = -Math.abs(lon)
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return { name: formatCoord(lat, lon), lat, lon }
}

export function searchPlaces(query: string, places: Place[] = PLACES, limit = 6): Place[] {
  const coords = parseCoords(query)
  if (coords) return [coords]
  const n = normalize(query)
  if (!n) return []
  const scored: [number, number, Place][] = []
  places.forEach((p, i) => {
    const name = normalize(p.name)
    const country = normalize(p.country ?? "")
    const aka = (p.aka ?? []).map(normalize)
    const countryAka = COUNTRY_AKA[country] ?? []
    let s = 0
    if (name === n) s = 100
    else if (aka.includes(n)) s = 96
    else if (country && (name + " " + country).startsWith(n) && n.length > name.length) s = 92
    else if (name.startsWith(n)) s = 80
    else if (name.split(" ").some((w) => w.startsWith(n))) s = 70
    else if (country === n || countryAka.includes(n)) s = 60
    else if (n.length >= 3 && country.startsWith(n)) s = 45
    else if (n.length >= 3 && name.includes(n)) s = 35
    if (s) scored.push([s, i, p])
  })
  scored.sort((a, b) => b[0] - a[0] || a[1] - b[1])
  // A real hit hides the loose substring matches ("usa" is not Busan).
  const floor = scored.length && scored[0][0] >= 60 ? 45 : 0
  return scored
    .filter((e) => e[0] >= floor)
    .slice(0, limit)
    .map((e) => e[2])
}

export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const r = Math.PI / 180
  const dLat = (bLat - aLat) * r
  const dLon = (bLon - aLon) * r
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function nearestPlace(lat: number, lon: number, places: Place[] = PLACES, maxKm = 600): { place: Place; km: number } | null {
  let best: { place: Place; km: number } | null = null
  for (const p of places) {
    const km = distanceKm(lat, lon, p.lat, p.lon)
    if (km <= maxKm && (!best || km < best.km)) best = { place: p, km }
  }
  return best
}

/* Shortest way round from one longitude to another. */
export function lonDelta(from: number, to: number): number {
  return wrapLon(to - from)
}

export function globeRadius(w: number, h: number, zoom: number): number {
  return Math.min(w, h) * 0.42 * zoom
}

export function mapScale(w: number, h: number, zoom: number): number {
  return Math.max(w / 360, h / 180) * zoom
}

export const ZOOM = { globe: [0.7, 6], map: [1, 10] } as const

export function clampView(v: View, w: number, h: number): View {
  const [lo, hi] = ZOOM[v.mode]
  v.zoom = Math.min(hi, Math.max(lo, v.zoom))
  v.lon = wrapLon(v.lon)
  if (v.mode === "globe") {
    v.lat = Math.min(85, Math.max(-85, v.lat))
  } else {
    const max = Math.max(0, 90 - h / 2 / mapScale(w, h, v.zoom))
    v.lat = Math.min(max, Math.max(-max, v.lat))
  }
  return v
}

/* Screen position of a lat/lon: [x, y, depth]. depth <= 0 is the far side. */
export function projectPoint(v: View, w: number, h: number, lat: number, lon: number): [number, number, number] {
  const r = Math.PI / 180
  if (v.mode === "map") {
    const s = mapScale(w, h, v.zoom)
    return [w / 2 + lonDelta(v.lon, lon) * s, h / 2 - (lat - v.lat) * s, 1]
  }
  const R = globeRadius(w, h, v.zoom)
  const l = (lon - v.lon) * r
  const p = lat * r
  const s0 = Math.sin(v.lat * r)
  const c0 = Math.cos(v.lat * r)
  const x = Math.cos(p) * Math.sin(l)
  const y = Math.sin(p)
  const z = Math.cos(p) * Math.cos(l)
  return [w / 2 + x * R, h / 2 - (y * c0 - z * s0) * R, y * s0 + z * c0]
}

/* Lat/lon under a screen point, or null off the world. */
export function invertPoint(v: View, w: number, h: number, sx: number, sy: number): [number, number] | null {
  const r = Math.PI / 180
  if (v.mode === "map") {
    const s = mapScale(w, h, v.zoom)
    const lat = v.lat - (sy - h / 2) / s
    if (lat > 90 || lat < -90) return null
    return [lat, wrapLon(v.lon + (sx - w / 2) / s)]
  }
  const R = globeRadius(w, h, v.zoom)
  const nx = (sx - w / 2) / R
  const ny = (h / 2 - sy) / R
  const r2 = nx * nx + ny * ny
  if (r2 > 1) return null
  const z = Math.sqrt(1 - r2)
  const s0 = Math.sin(v.lat * r)
  const c0 = Math.cos(v.lat * r)
  const yy = ny * c0 + z * s0
  const zz = -ny * s0 + z * c0
  return [Math.asin(Math.max(-1, Math.min(1, yy))) / r, wrapLon(v.lon + Math.atan2(nx, zz) / r)]
}

export function makeField(bw: number, bh: number): Field {
  const n = Math.max(1, bw * bh)
  return { bw, bh, kind: new Uint8Array(n), cell: new Int16Array(n), light: new Uint8Array(n) }
}

/* One pass per frame: for each art pixel, what is under it (0 space, 1 sea,
   2 land), which 30° graticule cell it is in, and how lit it is. The same
   maths as invertPoint, inlined because it runs ~70k times a frame. */
export function renderField(f: Field, v: View, w: number, h: number, px: number, mask: Uint8Array): void {
  const { bw, bh, kind, cell, light } = f
  const r = Math.PI / 180
  const cx = w / 2 / px
  const cy = h / 2 / px
  const globe = v.mode === "globe"
  const R = globeRadius(w, h, v.zoom) / px
  const s = mapScale(w, h, v.zoom) / px
  const s0 = Math.sin(v.lat * r)
  const c0 = Math.cos(v.lat * r)
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const i = y * bw + x
      let lat: number
      let lon: number
      if (globe) {
        const nx = (x + 0.5 - cx) / R
        const ny = (cy - y - 0.5) / R
        const r2 = nx * nx + ny * ny
        if (r2 >= 1) {
          const d = Math.sqrt(r2)
          kind[i] = 0
          cell[i] = -1
          light[i] = d < 1.06 ? Math.round((1 - (d - 1) / 0.06) * 255) : 0
          continue
        }
        const z = Math.sqrt(1 - r2)
        lat = Math.asin(ny * c0 + z * s0) / r
        lon = v.lon + Math.atan2(nx, -ny * s0 + z * c0) / r
        light[i] = Math.round(z * 255)
      } else {
        lat = v.lat - (y + 0.5 - cy) / s
        lon = v.lon + (x + 0.5 - cx) / s
        if (lat > 90 || lat < -90) {
          kind[i] = 0
          cell[i] = -1
          light[i] = 0
          continue
        }
        light[i] = 255
      }
      lon = ((((lon + 180) % 360) + 360) % 360) - 180
      let mx = ((lon + 180) * LAND_W / 360) | 0
      let my = ((90 - lat) * LAND_H / 180) | 0
      if (mx >= LAND_W) mx = LAND_W - 1
      if (my >= LAND_H) my = LAND_H - 1
      if (my < 0) my = 0
      kind[i] = mask[my * LAND_W + mx] ? 2 : 1
      cell[i] = (((lat + 90) / 30) | 0) * 12 + (((lon + 180) / 30) | 0)
    }
  }
}

/* 5×7 pixel font. Rows top-down, "#" is ink. */
export const FONT: Record<string, string> = {
  A: ".###.|#...#|#...#|#####|#...#|#...#|#...#",
  B: "####.|#...#|#...#|####.|#...#|#...#|####.",
  C: ".###.|#...#|#....|#....|#....|#...#|.###.",
  D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
  E: "#####|#....|#....|####.|#....|#....|#####",
  F: "#####|#....|#....|####.|#....|#....|#....",
  G: ".###.|#...#|#....|#.###|#...#|#...#|.####",
  H: "#...#|#...#|#...#|#####|#...#|#...#|#...#",
  I: ".###.|..#..|..#..|..#..|..#..|..#..|.###.",
  J: "..###|...#.|...#.|...#.|...#.|#..#.|.##..",
  K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#",
  L: "#....|#....|#....|#....|#....|#....|#####",
  M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#",
  N: "#...#|#...#|##..#|#.#.#|#..##|#...#|#...#",
  O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.",
  P: "####.|#...#|#...#|####.|#....|#....|#....",
  Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#",
  R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
  S: ".####|#....|#....|.###.|....#|....#|####.",
  T: "#####|..#..|..#..|..#..|..#..|..#..|..#..",
  U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
  V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
  W: "#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.",
  X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
  Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..",
  Z: "#####|....#|...#.|..#..|.#...|#....|#####",
  "0": ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.",
  "1": "..#..|.##..|..#..|..#..|..#..|..#..|.###.",
  "2": ".###.|#...#|....#|...#.|..#..|.#...|#####",
  "3": "#####|...#.|..#..|...#.|....#|#...#|.###.",
  "4": "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.",
  "5": "#####|#....|####.|....#|....#|#...#|.###.",
  "6": "..##.|.#...|#....|####.|#...#|#...#|.###.",
  "7": "#####|....#|...#.|..#..|.#...|.#...|.#...",
  "8": ".###.|#...#|#...#|.###.|#...#|#...#|.###.",
  "9": ".###.|#...#|#...#|.####|....#|...#.|.##..",
  ".": ".....|.....|.....|.....|.....|.....|..#..",
  ",": ".....|.....|.....|.....|.....|..#..|..#..|.#...",
  "!": "..#..|..#..|..#..|..#..|..#..|.....|..#..",
  "?": ".###.|#...#|....#|...#.|..#..|.....|..#..",
  "'": "..#..|..#..|.#...",
  '"': ".#.#.|.#.#.",
  "-": ".....|.....|.....|.###.",
  ":": ".....|..#..|.....|.....|.....|..#..",
  ";": ".....|..#..|.....|.....|.....|..#..|.#...",
  "/": "....#|....#|...#.|..#..|.#...|#....|#....",
  "(": "...#.|..#..|.#...|.#...|.#...|..#..|...#.",
  ")": ".#...|..#..|...#.|...#.|...#.|..#..|.#...",
  "[": ".###.|.#...|.#...|.#...|.#...|.#...|.###.",
  "]": ".###.|...#.|...#.|...#.|...#.|...#.|.###.",
  "+": ".....|..#..|..#..|#####|..#..|..#..",
  "=": ".....|.....|#####|.....|#####",
  "<": "...#.|..#..|.#...|#....|.#...|..#..|...#.",
  ">": ".#...|..#..|...#.|....#|...#.|..#..|.#...",
  "#": ".#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.",
  "&": ".##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#",
  "@": ".###.|#...#|#.###|#.#.#|#.###|#....|.###.",
  "*": ".....|..#..|#.#.#|.###.|#.#.#|..#..",
  "%": "##..#|##..#|...#.|..#..|.#...|#..##|#..##",
  "~": ".....|.....|.#...|#.#.#|...#.",
}

export const ADVANCE = 6

export function textWidth(text: string): number {
  return Math.max(0, text.length * ADVANCE - 1)
}

/* One SVG path for a whole string, runs merged per row. */
export function textPath(text: string): string {
  let d = ""
  const up = text.toUpperCase()
  for (let c = 0; c < up.length; c++) {
    const ch = up[c]
    if (ch === " ") continue
    const g = FONT[ch] ?? FONT["?"]
    const rows = g.split("|")
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y]
      let x = 0
      while (x < row.length) {
        if (row[x] !== "#") {
          x++
          continue
        }
        let e = x
        while (row[e] === "#") e++
        d += "M" + (c * ADVANCE + x) + " " + y + "h" + (e - x) + "v1h-" + (e - x) + "z"
        x = e
      }
    }
  }
  return d
}

/* Sprite rows to one path per palette key. "." is transparent. */
export function spritePaths(rows: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      if (ch === ".") {
        x++
        continue
      }
      let e = x
      while (row[e] === ch) e++
      out[ch] = (out[ch] ?? "") + "M" + x + " " + y + "h" + (e - x) + "v1h-" + (e - x) + "z"
      x = e
    }
  })
  return out
}

/* The mascot, built rather than drawn: a round body, two big lenses, an
   outline pass and eight jointed legs, mirrored so it is always symmetric.
   k outline, r body, d body shade, b belly, w lens, h shine. */
export type SpiderPose = "hang" | "stand" | "face"

const LEGS: Record<"hang" | "stand", [number, number][][]> = {
  hang: [
    [[4, -6], [7, -9], [10, -8], [12, -5]],
    [[7, -3], [10, -5], [12, -3], [13, 0]],
    [[7.5, 1], [10.5, 0], [12.5, 3], [13, 5]],
    [[6, 4.5], [9, 6], [10.5, 9], [10.5, 10]],
  ],
  stand: [
    [[5, -5], [10, -9], [14, -7], [16, 12]],
    [[7.5, -1], [11, -4], [13, -2], [13.5, 12]],
    [[7.5, 3], [10, 2], [11, 4], [11, 12]],
    [[5, 6.5], [8, 7.5], [8.5, 12]],
  ],
}

export function spiderRows(pose: SpiderPose, frame = 0): string[] {
  const face = pose === "face"
  const R = face ? 6 : 7.5
  const side = face ? 1 : pose === "stand" ? 8 : 6
  const top = face ? 1 : 3
  const W = 2 * Math.ceil(R) + 2 * side + 2
  const H = top + 2 * Math.ceil(R) + (face ? 1 : pose === "hang" ? 2 : 6)
  const cx = W / 2
  const cy = top + R + 1
  const g: string[][] = Array.from({ length: H }, () => Array(W).fill("."))
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < W && y < H ? g[y][x] : "")
  const body = (c: string) => c === "r" || c === "d" || c === "b" || c === "h"
  const four = [[1, 0], [-1, 0], [0, 1], [0, -1]]

  // Right half only; mirrored at the end so the sprite is always symmetric.
  for (let y = 0; y < H; y++) {
    for (let x = W / 2; x < W; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      if (dx * dx + dy * dy * 1.08 <= R * R) g[y][x] = dy > R * 0.46 ? "b" : dy > R * 0.1 && dx > R * 0.74 ? "d" : "r"
    }
  }
  // Lenses: tall tilted ovals, inner tops raised.
  const ex = cx + R * 0.4
  const ey = cy - R * 0.14
  for (let y = 0; y < H; y++) {
    for (let x = W / 2; x < W; x++) {
      const dx = x + 0.5 - ex
      const dy = y + 0.5 - ey - dx * 0.2
      if ((dx / (R * 0.3)) ** 2 + (dy / (R * 0.42)) ** 2 <= 1 && body(g[y][x])) g[y][x] = "w"
    }
  }
  const mark = (test: (x: number, y: number) => boolean) => {
    const hits: [number, number][] = []
    for (let y = 0; y < H; y++) for (let x = W / 2; x < W; x++) if (test(x, y)) hits.push([x, y])
    for (const [x, y] of hits) g[y][x] = "k"
  }
  mark((x, y) => body(g[y][x]) && four.some(([i, j]) => at(x + i, y + j) === "w"))
  mark((x, y) => g[y][x] === "." && four.some(([i, j]) => body(at(x + i, y + j)) || (x === W / 2 && at(x - 1, y) === ".") ? body(at(x + i, y + j)) : false))

  if (!face) {
    const plot = (x0: number, y0: number, x1: number, y1: number) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
      for (let t = 0; t <= n; t++) {
        const x = Math.round(x0 + ((x1 - x0) * t) / n)
        const y = Math.round(y0 + ((y1 - y0) * t) / n)
        if (x >= W / 2 && at(x, y) === ".") g[y][x] = "l"
      }
    }
    // Right-hand legs as polylines from the body centre; frame 1 lifts
    // alternate knees for a two-frame scuttle.
    const legs = LEGS[pose === "hang" ? "hang" : "stand"]
    legs.forEach((leg, i) => {
      const lift = frame ? (i % 2 ? 1 : -1) : 0
      const pts = leg.map(([x, y], j) => [cx - 0.5 + x, cy - 0.5 + y + (j > 0 && j < leg.length - (pose === "stand" ? 1 : 0) ? lift : 0)])
      for (let j = 1; j < pts.length; j++) plot(pts[j - 1][0], pts[j - 1][1], pts[j][0], pts[j][1])
    })
  }
  for (let y = 0; y < H; y++) for (let x = W / 2; x < W; x++) g[y][W - 1 - x] = g[y][x]
  // Shine on the upper left only.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - (cx - R * 0.5)
      const dy = y + 0.5 - (cy - R * 0.74)
      if (g[y][x] === "r" && dx * dx + dy * dy <= (R * 0.2) ** 2 + 0.5) g[y][x] = "h"
    }
  }
  return g.map((row) => row.join(""))
}

/* Eyelids for the blink: every lens pixel becomes body, the lowest row a lash. */
export function lidRows(rows: string[]): string[] {
  return rows.map((row, y) =>
    [...row]
      .map((c, x) => (c !== "w" ? "." : rows[y + 1]?.[x] === "w" ? "r" : "k"))
      .join(""),
  )
}

export const SPIDER_ICON = [
  "..k.....k..",
  "...k...k...",
  "k...kkk...k",
  ".k.kkkkk.k.",
  "..kkkkkkk..",
  "kk.kkkkk.kk",
  "..kkkkkkk..",
  ".k.kkkkk.k.",
  "k...kkk...k",
  "...k...k...",
]

export const STAR_ICON = [
  "....k....",
  "....k....",
  "...kkk...",
  "kkkkkkkkk",
  ".kkkkkkk.",
  "..kkkkk..",
  "..kk.kk..",
  ".kk...kk.",
  ".k.....k.",
]

// #endregion

export type Palette = {
  frame: string
  frameLight: string
  frameDark: string
  outline: string
  screen: string
  ocean: string
  oceanDeep: string
  land: string
  landDark: string
  coast: string
  grid: string
  glow: string
  text: string
  accent: string
  red: string
  green: string
  white: string
  star: string
  body: string
  belly: string
}

export const DEFAULT_PALETTE: Palette = {
  frame: "#3c8fca",
  frameLight: "#7cc4ee",
  frameDark: "#23659c",
  outline: "#0d2138",
  screen: "#0b1628",
  ocean: "#12264a",
  oceanDeep: "#0d1c38",
  land: "#2b5985",
  landDark: "#214870",
  coast: "#4a86bd",
  grid: "#1a3561",
  glow: "#1f4f8a",
  text: "#9fd6fb",
  accent: "#ff9f2f",
  red: "#e5413f",
  green: "#52b456",
  white: "#e9eff6",
  star: "#8fc6f1",
  body: "#e5413f",
  belly: "#2d6fd6",
}

export const DEFAULT_SIGHTINGS: Sighting[] = [
  { id: "s1", name: "New York", country: "United States", lat: 40.71, lon: -74.01, kind: "white", note: "Web strung between two water towers.", time: "2M AGO" },
  { id: "s2", name: "Chicago", country: "United States", lat: 41.88, lon: -87.63, kind: "red", note: "Blur spotted on the L tracks.", time: "14M AGO" },
  { id: "s3", name: "Washington", country: "United States", lat: 38.91, lon: -77.04, kind: "red", note: "Upside down on a lamppost.", time: "31M AGO" },
  { id: "s4", name: "Denver", country: "United States", lat: 39.74, lon: -104.99, kind: "red", note: "Swinging past the capitol dome.", time: "1H AGO" },
  { id: "s5", name: "San Francisco", country: "United States", lat: 37.77, lon: -122.42, kind: "red", note: "Webline on the bridge cables.", time: "2H AGO" },
  { id: "s6", name: "Houston", country: "United States", lat: 29.76, lon: -95.37, kind: "red", note: "Spotted near the launch pad.", time: "3H AGO" },
  { id: "s7", name: "Bogota", country: "Colombia", lat: 4.71, lon: -74.07, kind: "green", note: "Friendly neighbourhood check-in.", time: "5H AGO" },
  { id: "s8", name: "Caracas", country: "Venezuela", lat: 10.48, lon: -66.9, kind: "green", note: "All clear, web cleaned up.", time: "6H AGO" },
  { id: "s9", name: "London", country: "United Kingdom", lat: 51.51, lon: -0.13, kind: "red", note: "Clock tower, quarter past midnight.", time: "7H AGO" },
  { id: "s10", name: "Cairo", country: "Egypt", lat: 30.04, lon: 31.24, kind: "white", note: "Unconfirmed: web on a pyramid tip.", time: "9H AGO" },
  { id: "s11", name: "Mumbai", country: "India", lat: 19.08, lon: 72.88, kind: "red", note: "Monsoon rooftop run.", time: "11H AGO" },
  { id: "s12", name: "Tokyo", country: "Japan", lat: 35.68, lon: 139.69, kind: "red", note: "Crossing Shibuya on a single line.", time: "12H AGO" },
  { id: "s13", name: "Sydney", country: "Australia", lat: -33.87, lon: 151.21, kind: "green", note: "Harbour patrol, all quiet.", time: "1D AGO" },
  { id: "s14", name: "Cape Town", country: "South Africa", lat: -33.92, lon: 18.42, kind: "green", note: "Table Mountain lookout.", time: "1D AGO" },
  { id: "s15", name: "Rio de Janeiro", country: "Brazil", lat: -22.91, lon: -43.17, kind: "red", note: "Sugarloaf cable car, hitching a ride.", time: "2D AGO" },
]

export type PixelSpiderTrackerProps = {
  /** Pins on the globe. `kind`: red sighting, green ally, white unverified. */
  sightings?: Sighting[]
  /** Replace the built-in gazetteer search, e.g. with a real geocoder. */
  onSearch?: (query: string) => Promise<Place[]> | Place[]
  /** Local places used for autocomplete (and search, without `onSearch`). */
  places?: Place[]
  /** Called when a pin or result is opened. */
  onSelect?: (s: Sighting) => void
  /** Called when a pin is dropped with a double-click. */
  onPinDrop?: (s: Sighting) => void
  /** Two words either side of the mascot badge. */
  title?: [string, string]
  welcomeText?: string
  placeholder?: string
  /** Show the welcome screen with the sound choice first. */
  intro?: boolean
  defaultSound?: boolean
  defaultView?: ViewMode
  autoRotate?: boolean
  /** Floor for the loading drop, so the spider always gets its moment. */
  minLoadingMs?: number
  /** Screen pixels per art pixel on the globe. */
  pixelSize?: number
  colors?: Partial<Palette>
  height?: string
  className?: string
}

type Sfx = "tap" | "thwip" | "ping" | "error" | "type" | "sense" | "up"

function useSfx(on: boolean) {
  const ctxRef = React.useRef(null as AudioContext | null)
  const onRef = React.useRef(on)
  onRef.current = on
  React.useEffect(
    () => () => {
      ctxRef.current?.close().catch(() => {})
      ctxRef.current = null
    },
    [],
  )
  return React.useCallback((name: Sfx, force = false) => {
    if ((!onRef.current && !force) || typeof window === "undefined") return
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    try {
      const ctx = ctxRef.current ?? (ctxRef.current = new AC())
      if (ctx.state === "suspended") ctx.resume().catch(() => {})
      const t = ctx.currentTime
      const out = ctx.destination
      const tone = (f0: number, f1: number, dur: number, type: OscillatorType, vol: number, delay = 0) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = type
        o.frequency.setValueAtTime(f0, t + delay)
        o.frequency.exponentialRampToValueAtTime(f1, t + delay + dur)
        g.gain.setValueAtTime(0.0001, t + delay)
        g.gain.exponentialRampToValueAtTime(vol, t + delay + 0.008)
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur)
        o.connect(g)
        g.connect(out)
        o.start(t + delay)
        o.stop(t + delay + dur + 0.03)
      }
      const hiss = (dur: number, f0: number, f1: number, vol: number) => {
        const len = Math.floor(ctx.sampleRate * dur)
        const buf = ctx.createBuffer(1, len, ctx.sampleRate)
        const ch = buf.getChannelData(0)
        for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len)
        const src = ctx.createBufferSource()
        src.buffer = buf
        const bp = ctx.createBiquadFilter()
        bp.type = "bandpass"
        bp.Q.value = 3
        bp.frequency.setValueAtTime(f0, t)
        bp.frequency.exponentialRampToValueAtTime(f1, t + dur)
        const g = ctx.createGain()
        g.gain.value = vol
        src.connect(bp)
        bp.connect(g)
        g.connect(out)
        src.start(t)
      }
      if (name === "tap") tone(520, 820, 0.07, "square", 0.05)
      else if (name === "type") tone(1900, 1500, 0.025, "square", 0.018)
      else if (name === "thwip") {
        hiss(0.24, 4200, 500, 0.5)
        tone(1500, 260, 0.22, "triangle", 0.07)
      } else if (name === "up") {
        hiss(0.16, 600, 4000, 0.35)
        tone(300, 1300, 0.16, "triangle", 0.05)
      } else if (name === "ping") {
        tone(988, 980, 0.18, "square", 0.045)
        tone(1480, 1470, 0.3, "square", 0.04, 0.09)
      } else if (name === "error") {
        tone(240, 120, 0.32, "sawtooth", 0.05)
      } else if (name === "sense") {
        for (let i = 0; i < 3; i++) tone(700 + i * 300, 1600 + i * 300, 0.09, "square", 0.035, i * 0.07)
      }
    } catch {
      /* audio is a garnish; never let it break the tracker */
    }
  }, [])
}

function PixelText({
  text,
  scale = 2,
  color = "currentColor",
  shadow,
  className,
  style,
}: {
  text: string
  scale?: number
  color?: string
  shadow?: string
  className?: string
  style?: React.CSSProperties
}) {
  const d = React.useMemo(() => textPath(text), [text])
  const w = Math.max(1, textWidth(text))
  return (
    <svg
      aria-hidden
      width={w * scale}
      height={7 * scale}
      viewBox={"0 0 " + w + " 7"}
      shapeRendering="crispEdges"
      className={className}
      style={{ display: "block", overflow: "visible", flex: "none", ...style }}
    >
      {shadow ? <path d={d} fill={shadow} transform="translate(0.5 0.5)" /> : null}
      <path d={d} fill={color} />
    </svg>
  )
}

function Sprite({
  rows,
  colors,
  scale = 2,
  className,
  style,
  overlay,
  overlayClass,
}: {
  rows: string[]
  colors: Record<string, string>
  scale?: number
  className?: string
  style?: React.CSSProperties
  overlay?: string[]
  overlayClass?: string
}) {
  const paths = React.useMemo(() => spritePaths(rows), [rows])
  const over = React.useMemo(() => (overlay ? spritePaths(overlay) : null), [overlay])
  const w = rows[0].length
  const h = rows.length
  return (
    <svg
      aria-hidden
      width={w * scale}
      height={h * scale}
      viewBox={"0 0 " + w + " " + h}
      shapeRendering="crispEdges"
      className={className}
      style={{ display: "block", overflow: "visible", flex: "none", ...style }}
    >
      {Object.entries(paths).map(([k, d]) => (
        <path key={k} d={d} fill={colors[k] ?? "#000"} />
      ))}
      {over ? (
        <g className={overlayClass}>
          {Object.entries(over).map(([k, d]) => (
            <path key={k} d={d} fill={colors[k] ?? "#000"} />
          ))}
        </g>
      ) : null}
    </svg>
  )
}

function hexRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "")
  if (h.length === 3) h = h.replace(/./g, (c) => c + c)
  const n = parseInt(h.slice(0, 6), 16)
  return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/* Little-endian RGBA packed for a Uint32Array view on ImageData. */
function packed(hex: string): number {
  const [r, g, b] = hexRgb(hex)
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

const notch = (s: number) =>
  "polygon(0 " + s + "px, " + s / 2 + "px " + s / 2 + "px, " + s + "px 0, calc(100% - " + s + "px) 0, calc(100% - " + s / 2 + "px) " + s / 2 + "px, 100% " + s + "px, 100% calc(100% - " + s + "px), calc(100% - " + s / 2 + "px) calc(100% - " + s / 2 + "px), calc(100% - " + s + "px) 100%, " + s + "px 100%, " + s / 2 + "px calc(100% - " + s / 2 + "px), 0 calc(100% - " + s + "px))"

const bevel = (light: string, dark: string, outline: string, w = 3) =>
  "inset " + w + "px " + w + "px 0 " + light + ", inset -" + w + "px -" + w + "px 0 " + dark + ", 0 0 0 " + w + "px " + outline

const HANG_A = spiderRows("hang", 0)
const HANG_B = spiderRows("hang", 1)
const STAND_A = spiderRows("stand", 0)
const STAND_B = spiderRows("stand", 1)
const FACE = spiderRows("face")
const HANG_LIDS = lidRows(HANG_A)
const STAND_LIDS = lidRows(STAND_A)
const FACE_LIDS = lidRows(FACE)

const QUIPS = [
  "ALL QUIET ON THE WEB",
  "SPIDER SENSE: TINGLING",
  "THWIP!",
  "DOUBLE-CLICK TO DROP A PIN",
  "DRAG TO SPIN THE WORLD",
  "WITH GREAT POWER COMES GREAT BANDWIDTH",
]

const CSS =
  ".pst-anim{animation-fill-mode:both}" +
  "@keyframes pst-drop{0%{transform:translateY(-105%)}58%{transform:translateY(5%)}78%{transform:translateY(-2%)}100%{transform:translateY(0)}}" +
  "@keyframes pst-zip{0%{transform:translateY(0)}20%{transform:translateY(3%)}100%{transform:translateY(-110%)}}" +
  "@keyframes pst-swing{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}" +
  "@keyframes pst-frame{0%,49.9%{opacity:1}50%,100%{opacity:0}}" +
  "@keyframes pst-frame2{0%,49.9%{opacity:0}50%,100%{opacity:1}}" +
  "@keyframes pst-blink{0%,90%,100%{opacity:0}92%,97%{opacity:1}}" +
  "@keyframes pst-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}" +
  "@keyframes pst-eq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}" +
  "@keyframes pst-sweep{to{transform:rotate(360deg)}}" +
  "@keyframes pst-ping{0%{transform:scale(.7);opacity:.95}100%{transform:scale(2.4);opacity:0}}" +
  "@keyframes pst-pop{0%{transform:scale(0)}65%{transform:scale(1.3)}100%{transform:scale(1)}}" +
  "@keyframes pst-caret{0%,49.9%{opacity:1}50%,100%{opacity:0}}" +
  "@keyframes pst-twinkle{0%,100%{opacity:.25}50%{opacity:1}}" +
  "@keyframes pst-hop{0%,100%{transform:translateY(0)}35%{transform:translateY(-38%)}60%{transform:translateY(0)}75%{transform:translateY(-8%)}}" +
  "@keyframes pst-shake{0%,100%{transform:translate(0,0)}20%{transform:translate(-3px,1px)}40%{transform:translate(3px,-1px)}60%{transform:translate(-2px,-1px)}80%{transform:translate(2px,1px)}}" +
  "@keyframes pst-flash{0%{opacity:.85}100%{opacity:0}}" +
  "@keyframes pst-in{0%{opacity:0;transform:translateY(-8px)}100%{opacity:1;transform:translateY(0)}}" +
  ".pst-drop{animation:pst-drop .9s cubic-bezier(.3,.7,.3,1) both}" +
  ".pst-zip{animation:pst-zip .42s cubic-bezier(.6,0,.9,.4) both}" +
  ".pst-swing{animation:pst-swing 2.6s ease-in-out infinite;transform-origin:50% 0}" +
  ".pst-fa{animation:pst-frame .36s steps(1) infinite}" +
  ".pst-fb{animation:pst-frame2 .36s steps(1) infinite}" +
  ".pst-blink{opacity:0;animation:pst-blink 4.2s steps(1) infinite}" +
  ".pst-marquee{animation:pst-marquee var(--pst-dur,14s) linear infinite}" +
  ".pst-eq{animation:pst-eq .9s steps(4) infinite;transform-origin:50% 100%}" +
  ".pst-sweep{animation:pst-sweep 3.6s linear infinite;transform-origin:50% 50%}" +
  ".pst-ping{animation:pst-ping 1.6s ease-out infinite}" +
  ".pst-pop{animation:pst-pop .45s cubic-bezier(.3,1.6,.5,1) both}" +
  ".pst-caret{animation:pst-caret 1s steps(1) infinite}" +
  ".pst-twinkle{animation:pst-twinkle 3s ease-in-out infinite}" +
  ".pst-hop{animation:pst-hop .6s ease-out}" +
  ".pst-shake{animation:pst-shake .32s steps(4) 2}" +
  ".pst-flash{animation:pst-flash .6s ease-out both}" +
  ".pst-in{animation:pst-in .3s ease-out both}" +
  ".pst-btn{transition:transform .08s,filter .15s}" +
  ".pst-btn:hover{filter:brightness(1.1)}" +
  ".pst-btn:active{transform:translateY(2px)}" +
  ".pst-btn:focus-visible,.pst-stage:focus-visible{outline:3px solid #ffd35c;outline-offset:2px}" +
  "@media (prefers-reduced-motion: reduce){.pst-drop,.pst-zip,.pst-swing,.pst-fa,.pst-fb,.pst-blink,.pst-marquee,.pst-eq,.pst-sweep,.pst-ping,.pst-pop,.pst-caret,.pst-twinkle,.pst-hop,.pst-shake,.pst-in{animation:none !important}.pst-fb{opacity:0}.pst-zip{opacity:0}}"

type Phase = "intro" | "ready" | "loading"

export default function PixelSpiderTracker({
  sightings = DEFAULT_SIGHTINGS,
  onSearch,
  places = PLACES,
  onSelect,
  onPinDrop,
  title = ["SPIDER", "TRACKER"],
  welcomeText = "Welcome to the spider tracker. Search any place on Earth to trace sightings all over the world.",
  placeholder = "Search a city, country or lat, lon to track a sighting",
  intro = true,
  defaultSound = false,
  defaultView = "globe",
  autoRotate = true,
  minLoadingMs = 1600,
  pixelSize = 3,
  colors,
  height = "100svh",
  className,
}: PixelSpiderTrackerProps) {
  const pal = React.useMemo(() => ({ ...DEFAULT_PALETTE, ...colors }), [colors])
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")

  const [phase, setPhase] = React.useState((intro ? "intro" : "ready") as Phase)
  const [spider, setSpider] = React.useState((intro ? "down" : "gone") as "down" | "up" | "gone")
  const [sound, setSound] = React.useState(defaultSound)
  const [mode, setMode] = React.useState(defaultView as ViewMode)
  const [layers, setLayers] = React.useState({ red: true, green: true })
  const [results, setResults] = React.useState([] as Sighting[])
  const [pins, setPins] = React.useState([] as Sighting[])
  const [selected, setSelected] = React.useState(null as string | null)
  const [query, setQuery] = React.useState("")
  const [caret, setCaret] = React.useState(0)
  const [focused, setFocused] = React.useState(false)
  const [hi, setHi] = React.useState(-1)
  const [status, setStatus] = React.useState(intro ? "SELECT SOUND OPTION" : "")
  const [menu, setMenu] = React.useState(false)
  const [history, setHistory] = React.useState([] as { q: string; n: number }[])
  const [hud, setHud] = React.useState({ lat: 20, lon: -40, zoom: 1 })
  const [sense, setSense] = React.useState(0)
  const [hop, setHop] = React.useState(0)
  const [barW, setBarW] = React.useState(320)
  const [rootW, setRootW] = React.useState(1024)
  const compact = rootW < 600

  const play = useSfx(sound)

  const rootRef = React.useRef(null as HTMLElement | null)
  const screenRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const inputRef = React.useRef(null as HTMLInputElement | null)
  const barRef = React.useRef(null as HTMLDivElement | null)
  const radarDotRef = React.useRef(null as SVGRectElement | null)
  const markerEls = React.useRef(new Map() as Map<string, HTMLElement>)
  const timers = React.useRef(new Set() as Set<ReturnType<typeof setTimeout>>)
  const reqRef = React.useRef(0)
  const statusTimer = React.useRef(null as ReturnType<typeof setTimeout> | null)

  const S = React.useRef({
    view: { mode: defaultView, lon: -40, lat: 22, zoom: 1 } as View,
    tween: null as null | { from: View; to: View; t0: number; dur: number },
    drag: null as null | { x: number; y: number; lon: number; lat: number; moved: boolean },
    pinch: null as null | { d: number; zoom: number },
    pointers: new Map() as Map<number, { x: number; y: number }>,
    idleAt: 0,
    dirty: true,
    W: 0,
    H: 0,
    reduced: false,
    wake: () => {},
  })

  const later = React.useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t)
      fn()
    }, ms)
    timers.current.add(t)
  }, [])

  React.useEffect(() => {
    const set = timers.current
    return () => {
      set.forEach(clearTimeout)
      set.clear()
      if (statusTimer.current) clearTimeout(statusTimer.current)
    }
  }, [])

  const flash = React.useCallback((text: string, ms = 3200) => {
    setStatus(text)
    if (statusTimer.current) clearTimeout(statusTimer.current)
    statusTimer.current = setTimeout(() => setStatus(""), ms)
  }, [])

  const markers = React.useMemo(() => {
    const base = sightings.filter((s) => ((s.kind ?? "red") === "green" ? layers.green : layers.red))
    return [...base, ...(layers.red ? pins : []), ...results]
  }, [sightings, pins, results, layers])
  const everything = React.useMemo(() => [...sightings, ...pins, ...results], [sightings, pins, results])
  const markersRef = React.useRef(markers)
  markersRef.current = markers

  const flyTo = React.useCallback((lat: number, lon: number, zoom?: number) => {
    const s = S.current
    const from = { ...s.view }
    const to: View = { ...from, lat, lon: from.lon + lonDelta(from.lon, lon), zoom: zoom ?? from.zoom }
    s.tween = { from, to, t0: performance.now(), dur: s.reduced ? 1 : 1300 }
    s.idleAt = performance.now()
    s.wake()
  }, [])

  const select = React.useCallback(
    (m: Sighting | null, fly = true) => {
      setSelected(m ? m.id : null)
      if (!m) return
      if (fly) flyTo(m.lat, m.lon, Math.max(S.current.view.zoom, S.current.view.mode === "globe" ? 1.6 : 2.5))
      onSelect?.(m)
    },
    [flyTo, onSelect],
  )

  // --- the render loop ----------------------------------------------------
  const palRef = React.useRef(pal)
  palRef.current = pal
  const spinRef = React.useRef(autoRotate)
  spinRef.current = autoRotate
  const phaseRef = React.useRef(phase)
  phaseRef.current = phase

  React.useEffect(() => {
    S.current.dirty = true
    S.current.wake()
  }, [pal, markers])

  React.useEffect(() => {
    const s = S.current
    if (s.view.mode === mode) return
    s.view.mode = mode
    s.view.zoom = mode === "globe" ? 1 : 1.2
    s.tween = null
    s.dirty = true
    s.wake()
  }, [mode])

  React.useEffect(() => {
    const screen = screenRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!screen || !canvas || !ctx) return
    const s = S.current
    const mask = decodeLandCached()
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    s.reduced = reduced.matches
    let px = Math.max(1, Math.round(pixelSize))
    let field = makeField(1, 1)
    let img = ctx.createImageData(1, 1)
    let u32 = new Uint32Array(img.data.buffer)
    let raf = 0
    let last = 0
    let hudAt = 0
    let onscreen = true

    const resize = () => {
      const r = screen.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) return
      s.W = r.width
      s.H = r.height
      px = Math.max(1, Math.round(pixelSize))
      const bw = Math.ceil(r.width / px)
      const bh = Math.ceil(r.height / px)
      canvas.width = bw
      canvas.height = bh
      canvas.style.width = bw * px + "px"
      canvas.style.height = bh * px + "px"
      field = makeField(bw, bh)
      img = ctx.createImageData(bw, bh)
      u32 = new Uint32Array(img.data.buffer)
      s.dirty = true
      start()
    }

    const paint = () => {
      const p = palRef.current
      const c = {
        screen: packed(p.screen),
        ocean: packed(p.ocean),
        deep: packed(p.oceanDeep),
        land: packed(p.land),
        landDark: packed(p.landDark),
        coast: packed(p.coast),
        grid: packed(p.grid),
        glow: packed(p.glow),
        star: packed(p.text),
      }
      const { bw, bh, kind, cell, light } = field
      for (let y = 0; y < bh; y++) {
        for (let x = 0; x < bw; x++) {
          const i = y * bw + x
          const k = kind[i]
          const th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16
          const l = light[i] / 255
          if (k === 0) {
            if (l > 0 && l * 0.8 > th) u32[i] = c.glow
            else u32[i] = ((x * 73856093) ^ (y * 19349663)) % 997 === 0 ? c.star : c.screen
            continue
          }
          const limb = l < 0.16 + th * 0.3
          if (k === 2) {
            const coast =
              (x > 0 && kind[i - 1] === 1) || (x < bw - 1 && kind[i + 1] === 1) || (y > 0 && kind[i - bw] === 1) || (y < bh - 1 && kind[i + bw] === 1)
            u32[i] = coast ? c.coast : limb ? c.landDark : c.land
          } else {
            const edge =
              (x < bw - 1 && kind[i + 1] !== 0 && cell[i + 1] !== cell[i]) || (y < bh - 1 && kind[i + bw] !== 0 && cell[i + bw] !== cell[i])
            u32[i] = edge ? c.grid : limb ? c.deep : c.ocean
          }
        }
      }
      ctx.putImageData(img, 0, 0)
    }

    const place = () => {
      const v = s.view
      for (const m of markersRef.current) {
        const el = markerEls.current.get(m.id)
        if (!el) continue
        const [x, y, z] = projectPoint(v, s.W, s.H, m.lat, m.lon)
        const show = z > 0.08 && x > -40 && y > -40 && x < s.W + 40 && y < s.H + 40
        const k = v.mode === "globe" ? 0.55 + 0.45 * Math.min(1, z * 1.6) : 1
        el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) translate(-50%,-50%) scale(" + k.toFixed(3) + ")"
        el.style.visibility = show ? "visible" : "hidden"
        el.style.zIndex = String(Math.round(z * 100) + (m.kind === "result" ? 200 : 0))
      }
      const dot = radarDotRef.current
      if (dot) {
        const r = ((90 - v.lat) / 180) * 44
        const a = (v.lon * Math.PI) / 180
        dot.setAttribute("x", (r * Math.sin(a) - 2).toFixed(1))
        dot.setAttribute("y", (r * Math.cos(a) - 2).toFixed(1))
      }
    }

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(64, last ? t - last : 16)
      last = t
      const v = s.view
      if (s.tween) {
        const { from, to, t0, dur } = s.tween
        const k = Math.min(1, (t - t0) / dur)
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
        v.lon = from.lon + (to.lon - from.lon) * e
        v.lat = from.lat + (to.lat - from.lat) * e
        v.zoom = from.zoom + (to.zoom - from.zoom) * e
        if (k >= 1) s.tween = null
        s.dirty = true
      } else if (spinRef.current && !s.drag && !s.reduced && v.mode === "globe" && t - s.idleAt > 4000 && phaseRef.current !== "loading") {
        v.lon += dt * 0.005
        s.dirty = true
      }
      if (s.dirty && s.W > 0) {
        s.dirty = false
        clampView(v, s.W, s.H)
        renderField(field, v, s.W, s.H, px, mask)
        paint()
        place()
        if (t - hudAt > 120) {
          hudAt = t
          setHud({ lat: v.lat, lon: v.lon, zoom: v.zoom })
        }
      } else if (!s.tween && !(spinRef.current && !s.reduced)) {
        // Nothing moving: sleep until something wakes us.
        cancelAnimationFrame(raf)
        raf = 0
        last = 0
      }
    }
    const start = () => {
      if (raf || !onscreen || document.hidden) return
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
      last = 0
    }
    s.wake = start

    const ro = new ResizeObserver(resize)
    ro.observe(screen)
    const io = new IntersectionObserver(([e]) => {
      onscreen = e.isIntersecting
      if (onscreen) start()
      else stop()
    })
    io.observe(screen)
    const onVis = () => (document.hidden ? stop() : start())
    const onMotion = () => {
      s.reduced = reduced.matches
      start()
    }
    document.addEventListener("visibilitychange", onVis)
    reduced.addEventListener("change", onMotion)

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      s.tween = null
      s.view.zoom *= Math.exp(-e.deltaY * 0.0015)
      s.idleAt = performance.now()
      s.dirty = true
      start()
    }
    screen.addEventListener("wheel", onWheel, { passive: false })

    resize()
    return () => {
      stop()
      s.wake = () => {}
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      reduced.removeEventListener("change", onMotion)
      screen.removeEventListener("wheel", onWheel)
    }
  }, [pixelSize])

  // --- pointer & keyboard on the globe ------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    const s = S.current
    if (e.button !== 0 && e.pointerType === "mouse") return
    e.currentTarget.setPointerCapture(e.pointerId)
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    s.tween = null
    s.idleAt = performance.now()
    if (s.pointers.size === 1) {
      s.drag = { x: e.clientX, y: e.clientY, lon: s.view.lon, lat: s.view.lat, moved: false }
    } else if (s.pointers.size === 2) {
      const [a, b] = [...s.pointers.values()]
      s.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: s.view.zoom }
      s.drag = null
    }
    s.wake()
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = S.current
    if (!s.pointers.has(e.pointerId)) return
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const v = s.view
    if (s.pinch && s.pointers.size >= 2) {
      const [a, b] = [...s.pointers.values()]
      v.zoom = (s.pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / s.pinch.d
    } else if (s.drag) {
      const dx = e.clientX - s.drag.x
      const dy = e.clientY - s.drag.y
      if (Math.abs(dx) + Math.abs(dy) > 4) s.drag.moved = true
      if (v.mode === "globe") {
        const R = globeRadius(s.W, s.H, v.zoom)
        v.lon = s.drag.lon - (dx / R) * 57.3
        v.lat = s.drag.lat + (dy / R) * 57.3
      } else {
        const k = mapScale(s.W, s.H, v.zoom)
        v.lon = s.drag.lon - dx / k
        v.lat = s.drag.lat + dy / k
      }
    }
    s.idleAt = performance.now()
    s.dirty = true
    s.wake()
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const s = S.current
    const wasTap = s.drag && !s.drag.moved && s.pointers.size === 1
    s.pointers.delete(e.pointerId)
    if (s.pointers.size < 2) s.pinch = null
    if (s.pointers.size === 0) {
      s.drag = null
      if (wasTap) {
        setSelected(null)
        setMenu(false)
      }
    }
    s.idleAt = performance.now()
  }
  const dropPin = (clientX: number, clientY: number) => {
    const s = S.current
    const r = screenRef.current?.getBoundingClientRect()
    if (!r) return
    const ll = invertPoint(s.view, s.W, s.H, clientX - r.left, clientY - r.top)
    if (!ll) return
    const [lat, lon] = ll
    const near = nearestPlace(lat, lon, places, 450)
    const pin: Sighting = {
      id: "pin-" + Date.now().toString(36),
      name: near ? "Near " + near.place.name : landAt(decodeLandCached(), lat, lon) ? "Uncharted land" : "Open water",
      country: near?.place.country,
      lat,
      lon,
      kind: "white",
      note: near ? Math.round(near.km) + " km from " + near.place.name + ". Pinned by you." : "Nothing on file here. Pinned by you.",
      time: "JUST NOW",
    }
    setLayers((l) => ({ ...l, red: true }))
    setPins((p) => [...p.slice(-11), pin])
    setSelected(pin.id)
    onPinDrop?.(pin)
    play("ping")
    flash("PIN DROPPED " + formatCoord(lat, lon))
  }
  const onKey = (e: React.KeyboardEvent) => {
    const s = S.current
    const v = s.view
    const step = 12 / v.zoom
    let lat = v.lat
    let lon = v.lon
    let zoom = v.zoom
    if (e.key === "ArrowLeft") lon -= step
    else if (e.key === "ArrowRight") lon += step
    else if (e.key === "ArrowUp") lat += step
    else if (e.key === "ArrowDown") lat -= step
    else if (e.key === "+" || e.key === "=") zoom *= 1.3
    else if (e.key === "-" || e.key === "_") zoom /= 1.3
    else if (e.key === "m" || e.key === "M") return setMode((m) => (m === "globe" ? "map" : "globe"))
    else if (e.key === "0" || e.key === "Home") zoom = mode === "globe" ? 1 : 1.2
    else if (e.key === "Escape") return setSelected(null)
    else return
    e.preventDefault()
    s.tween = { from: { ...v }, to: { ...v, lat, lon, zoom }, t0: performance.now(), dur: s.reduced ? 1 : 260 }
    s.idleAt = performance.now()
    s.wake()
  }

  // --- search ----------------------------------------------------------------
  const suggestions = React.useMemo(
    () => (focused && query.trim().length >= 2 && phase === "ready" ? searchPlaces(query, places, 5) : []),
    [focused, query, places, phase],
  )

  const runSearch = React.useCallback(
    async (raw: string) => {
      const q = raw.trim()
      if (!q || phaseRef.current !== "ready") return
      const id = ++reqRef.current
      inputRef.current?.blur()
      setMenu(false)
      setSelected(null)
      setPhase("loading")
      setSpider("down")
      setStatus("")
      play("thwip")
      const t0 = performance.now()
      let found: Place[] = []
      try {
        const coords = parseCoords(q)
        found = coords ? [coords] : await Promise.resolve(onSearch ? onSearch(q) : searchPlaces(q, places))
      } catch {
        found = []
      }
      const wait = S.current.reduced ? 300 : Math.max(0, minLoadingMs - (performance.now() - t0))
      later(() => {
        if (id !== reqRef.current) return
        const list: Sighting[] = (found ?? []).slice(0, 12).map((p, i) => {
          // Bare coordinates get a name from the nearest known place.
          const near = !p.country && !p.note ? nearestPlace(p.lat, p.lon, places, 800) : null
          return {
            ...p,
            country: p.country ?? (near ? "Near " + near.place.name : undefined),
            note: p.note ?? (near ? Math.round(near.km) + " km from " + near.place.name + (near.place.country ? ", " + near.place.country : "") + "." : undefined),
            id: "r" + id + "-" + i,
            kind: "result",
            time: "LIVE",
          }
        })
        setSpider("up")
        play("up")
        later(() => setSpider((s) => (s === "up" ? "gone" : s)), 450)
        setPhase("ready")
        setResults(list)
        setHistory((h) => [{ q, n: list.length }, ...h.filter((x) => x.q.toLowerCase() !== q.toLowerCase())].slice(0, 8))
        if (list.length) {
          later(() => {
            play("ping")
            select(list[0])
          }, 260)
          flash(list.length === 1 ? "NEW SIGHTING: " + list[0].name.toUpperCase() : list.length + " SIGHTINGS FOR " + q.toUpperCase(), 4200)
        } else {
          play("error")
          flash("NO SIGHTINGS FOR " + q.toUpperCase(), 4200)
        }
      }, wait)
    },
    [later, minLoadingMs, onSearch, places, play, select, flash],
  )

  const startTracking = (withSound: boolean) => {
    setSound(withSound)
    if (withSound) play("tap", true)
    setSpider("up")
    later(() => {
      setSpider("gone")
      if (withSound) play("up", true)
    }, 450)
    setPhase("ready")
    flash(withSound ? "SOUND ON. HAPPY TRACKING" : "SOUND OFF. HAPPY TRACKING", 2600)
    S.current.idleAt = 0
    S.current.wake()
  }

  const spiderSense = () => {
    if (phase !== "ready") return
    const pool = markers.length ? markers : sightings
    if (!pool.length) return
    const pick = pool[Math.floor(Math.random() * pool.length)]
    setSense((n) => n + 1)
    // Restart the shake without remounting the screen (the canvas lives there).
    const el = screenRef.current
    if (el) {
      el.classList.remove("pst-shake")
      void el.offsetWidth
      el.classList.add("pst-shake")
    }
    play("sense")
    flash("SPIDER SENSE: " + pick.name.toUpperCase())
    select(pick)
  }

  const recenter = () => {
    play("tap")
    const cur = everything.find((m) => m.id === selected) ?? results[0]
    if (cur) flyTo(cur.lat, cur.lon, S.current.view.mode === "globe" ? 1.8 : 3)
    else flyTo(22, -40, mode === "globe" ? 1 : 1.2)
  }

  // --- input bar geometry ----------------------------------------------------
  React.useEffect(() => {
    const el = barRef.current
    if (!el) return
    const root = rootRef.current
    const ro = new ResizeObserver(() => {
      setBarW(el.clientWidth)
      if (root) setRootW(root.clientWidth)
    })
    ro.observe(el)
    if (root) ro.observe(root)
    return () => ro.disconnect()
  }, [])
  const tScale = compact ? 2 : 3
  const maxChars = Math.max(6, Math.floor((barW - 36) / (ADVANCE * tScale)))
  const winStart = Math.max(0, caret - maxChars + 1)
  const shown = query.slice(winStart, winStart + maxChars)
  const syncCaret = () => setCaret(inputRef.current?.selectionStart ?? query.length)

  const sel = everything.find((m) => m.id === selected) ?? null
  const resIndex = sel && sel.kind === "result" ? results.findIndex((r) => r.id === sel.id) : -1

  const kindColor = (k?: SightingKind) =>
    k === "green" ? pal.green : k === "white" ? pal.white : k === "result" ? pal.star : pal.red
  const kindLabel = (k?: SightingKind) =>
    k === "green" ? "ALLY CHECK-IN" : k === "white" ? "UNVERIFIED" : k === "result" ? "NEW SIGHTING" : "SIGHTING LOG"

  const barText = (() => {
    if (phase === "intro") return { text: "SELECT SOUND OPTION", dim: true, scroll: false }
    if (phase === "loading") return { text: "LOADING", dim: false, scroll: false }
    if (status && !focused) return { text: status, dim: false, scroll: status.length > maxChars }
    return { text: placeholder.toUpperCase(), dim: false, scroll: true }
  })()

  const stars = React.useMemo(() => {
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: 70 }, () => ({ x: rnd() * 100, y: rnd() * 100, s: rnd() < 0.15 ? 3 : 2, d: rnd() * 3 }))
  }, [])

  const spiderColors = { k: pal.outline, r: pal.body, d: shade(pal.body, -0.25), b: pal.belly, w: "#ffffff", h: shade(pal.body, 0.45), l: shade(pal.body, -0.15) }
  const btnSize = "clamp(46px, 9cqmin, 70px)"

  return (
    <section
      ref={rootRef}
      aria-label={title.join(" ")}
      className={"relative w-full overflow-hidden select-none " + (className ?? "")}
      style={{
        height,
        containerType: "size",
        background: "radial-gradient(120% 90% at 50% 20%, #13306a 0%, #0a1733 55%, #050b1c 100%)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        color: pal.text,
      }}
    >
      <style>{CSS}</style>

      {/* Deep-space backdrop */}
      <svg aria-hidden className="pointer-events-none absolute inset-0" width="100%" height="100%">
        {stars.map((s, i) => (
          <rect
            key={i}
            x={s.x + "%"}
            y={s.y + "%"}
            width={s.s}
            height={s.s}
            fill={i % 5 === 0 ? pal.star : "#ffffff"}
            className={i % 3 === 0 ? "pst-twinkle" : undefined}
            style={{ animationDelay: s.d + "s", opacity: 0.7 }}
          />
        ))}
      </svg>

      {/* The handheld */}
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(calc(100cqw - 24px), 1040px)",
          height: "min(calc(100cqh - 24px), 1000px)",
        }}
      >
        <div className="absolute inset-0" style={{ background: pal.outline, clipPath: notch(18) }} />
        <div
          className="absolute"
          style={{
            inset: 4,
            background: pal.frame,
            clipPath: notch(16),
            boxShadow: "inset 5px 5px 0 " + pal.frameLight + ", inset -5px -5px 0 " + pal.frameDark,
          }}
        />

        {/* Screen */}
        <div
          className="absolute"
          style={{
            top: "clamp(44px, 8.5cqmin, 64px)",
            bottom: "clamp(62px, 11cqmin, 88px)",
            left: "clamp(14px, 3.4cqmin, 30px)",
            right: "clamp(14px, 3.4cqmin, 30px)",
            background: pal.outline,
            padding: 4,
            clipPath: notch(8),
          }}
        >
          <div
            ref={screenRef}
            className="relative h-full w-full overflow-hidden"
            style={{ background: pal.screen, boxShadow: "inset 0 0 0 2px " + shade(pal.screen, 0.25) }}
          >
            {/* Globe stage */}
            <div
              role="application"
              aria-label="World tracker. Drag to rotate, scroll or pinch to zoom, double-click to drop a pin, arrow keys to pan, M to switch globe and map."
              tabIndex={0}
              className="pst-stage absolute inset-0 outline-none"
              style={{
                touchAction: "none",
                cursor: "grab",
                opacity: phase === "ready" ? 1 : 0,
                transform: phase === "ready" ? "scale(1)" : "scale(0.82)",
                transition: "opacity .55s ease, transform .75s cubic-bezier(.2,1.3,.4,1)",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onDoubleClick={(e) => dropPin(e.clientX, e.clientY)}
              onKeyDown={onKey}
            >
              <canvas
                ref={canvasRef}
                aria-hidden
                className="absolute left-0 top-0"
                style={{ imageRendering: "pixelated", maxWidth: "none" }}
              />
              {markers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  ref={(el) => {
                    if (el) markerEls.current.set(m.id, el)
                    else markerEls.current.delete(m.id)
                  }}
                  aria-label={kindLabel(m.kind) + ": " + m.name + (m.country ? ", " + m.country : "")}
                  className="pst-btn absolute left-0 top-0"
                  style={{ visibility: "hidden", width: m.kind === "result" ? 40 : 34, height: m.kind === "result" ? 40 : 34, padding: 0, background: "none", border: 0 }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onClick={() => {
                    play("tap")
                    select(m)
                  }}
                >
                  <Marker kind={m.kind} color={kindColor(m.kind)} outline={pal.outline} active={m.id === selected} />
                </button>
              ))}
            </div>

            {/* Rulers and graticule dressing */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div
                className="absolute"
                style={{
                  left: "12%",
                  right: "12%",
                  top: 6,
                  height: 12,
                  backgroundImage:
                    "repeating-linear-gradient(90deg, " + pal.coast + " 0 2px, transparent 2px 64px), repeating-linear-gradient(90deg, " + pal.glow + " 0 1px, transparent 1px 8px)",
                  backgroundSize: "100% 12px, 100% 6px",
                  backgroundRepeat: "no-repeat",
                  borderBottom: "2px solid " + pal.glow,
                  opacity: 0.8,
                }}
              />
              {[16, 38, 60, 82].map((top) => (
                <div
                  key={top}
                  className="absolute"
                  style={{
                    left: 8,
                    top: top + "%",
                    width: 14,
                    height: "13%",
                    backgroundImage:
                      "repeating-linear-gradient(180deg, " + pal.glow + " 0 2px, transparent 2px 7px)",
                    borderLeft: "2px solid " + pal.coast,
                    opacity: 0.75,
                  }}
                />
              ))}
              {[25, 50, 75].map((top) => (
                <div key={top} className="absolute left-0 right-0" style={{ top: top + "%", height: 1, background: pal.grid, opacity: 0.55 }} />
              ))}
            </div>

            {/* HUD */}
            {phase === "ready" ? (
              <div aria-hidden className="pointer-events-none absolute flex flex-col gap-1.5" style={{ left: 30, top: 26 }}>
                <PixelText text={"LAT " + formatCoord(hud.lat, hud.lon).split(" ")[0]} color={pal.coast} scale={1.5} />
                <PixelText text={"LON " + formatCoord(hud.lat, hud.lon).split(" ")[1]} color={pal.coast} scale={1.5} />
                <PixelText text={"ZOOM " + hud.zoom.toFixed(1) + "X"} color={pal.coast} scale={1.5} />
              </div>
            ) : null}

            {/* Detail card */}
            {sel && phase === "ready" && !menu ? (
              <div
                key={sel.id}
                role="dialog"
                aria-label={sel.name}
                className="absolute flex justify-center"
                style={{ top: 28, left: 0, right: 0, zIndex: 30, pointerEvents: "none" }}
              >
                <div className="pst-in" style={{ width: "min(300px, 82%)", pointerEvents: "auto" }}>
                <div style={{ background: pal.outline, padding: 3, clipPath: notch(6) }}>
                  <div
                    className="flex items-center justify-between gap-2 px-3 py-2"
                    style={{ background: sel.kind === "result" ? pal.accent : kindColor(sel.kind), boxShadow: bevel(shade(sel.kind === "result" ? pal.accent : kindColor(sel.kind), 0.3), shade(sel.kind === "result" ? pal.accent : kindColor(sel.kind), -0.25), "transparent", 2) }}
                  >
                    <PixelText text={kindLabel(sel.kind)} color={pal.outline} scale={2} />
                    <PixelText text={sel.time ?? ""} color={pal.outline} scale={1.5} />
                  </div>
                  <div className="flex flex-col gap-2 px-3 py-3" style={{ background: "#0e1d38" }}>
                    <PixelText text={sel.name.slice(0, 22)} color="#ffffff" scale={2.5} />
                    {sel.country ? <PixelText text={sel.country.slice(0, 30)} color={pal.text} scale={1.5} /> : null}
                    {sel.name !== formatCoord(sel.lat, sel.lon) ? <PixelText text={formatCoord(sel.lat, sel.lon)} color={pal.coast} scale={1.5} /> : null}
                    {sel.note ? <p className="m-0 text-[12px] leading-snug" style={{ color: pal.text, opacity: 0.9 }}>{sel.note}</p> : null}
                    <div className="mt-1 flex items-center gap-2">
                      {resIndex > -1 && results.length > 1 ? (
                        <>
                          <CardButton label="Previous result" onClick={() => { play("tap"); select(results[(resIndex - 1 + results.length) % results.length]) }} pal={pal}>
                            <PixelText text="<" color={pal.outline} scale={2} />
                          </CardButton>
                          <PixelText text={resIndex + 1 + "/" + results.length} color={pal.text} scale={1.5} />
                          <CardButton label="Next result" onClick={() => { play("tap"); select(results[(resIndex + 1) % results.length]) }} pal={pal}>
                            <PixelText text=">" color={pal.outline} scale={2} />
                          </CardButton>
                        </>
                      ) : null}
                      <span className="flex-1" />
                      <CardButton label="Center on this" onClick={() => { play("tap"); select(sel) }} pal={pal}>
                        <PixelText text="CENTER" color={pal.outline} scale={1.5} />
                      </CardButton>
                      <CardButton label="Close" onClick={() => { play("tap"); setSelected(null) }} pal={pal}>
                        <PixelText text="X" color={pal.outline} scale={1.5} />
                      </CardButton>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            ) : null}

            {/* Web radar */}
            {phase === "ready" ? (
              <div className="absolute" style={{ right: 10, bottom: 10, width: "clamp(96px, 20cqmin, 150px)", aspectRatio: "1" }}>
                <svg
                  viewBox="-50 -50 100 100"
                  width="100%"
                  height="100%"
                  role="img"
                  aria-label="Radar: click to fly there"
                  style={{ cursor: "crosshair", display: "block", overflow: "visible" }}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - r.left) / r.width) * 100 - 50
                    const y = ((e.clientY - r.top) / r.height) * 100 - 50
                    const d = Math.hypot(x, y)
                    if (d > 46) return
                    play("tap")
                    flyTo(90 - (d / 44) * 180, (Math.atan2(x, y) * 180) / Math.PI)
                  }}
                >
                  <defs>
                    <linearGradient id={uid + "sw"} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor={pal.star} stopOpacity="0" />
                      <stop offset="1" stopColor={pal.star} stopOpacity=".45" />
                    </linearGradient>
                  </defs>
                  <polygon points={octagon(47)} fill={shade(pal.screen, 0.08)} stroke={pal.coast} strokeWidth="1.6" />
                  {[12, 24, 36].map((r) => (
                    <polygon key={r} points={octagon(r)} fill="none" stroke={pal.glow} strokeWidth="1" />
                  ))}
                  {Array.from({ length: 8 }, (_, i) => {
                    const a = (i * Math.PI) / 4 + Math.PI / 8
                    return <line key={i} x1="0" y1="0" x2={(47 * Math.cos(a)).toFixed(2)} y2={(47 * Math.sin(a)).toFixed(2)} stroke={pal.glow} strokeWidth="1" />
                  })}
                  <clipPath id={uid + "oct"}>
                    <polygon points={octagon(46)} />
                  </clipPath>
                  <g clipPath={"url(#" + uid + "oct)"}>
                  <g className="pst-sweep">
                    <path d="M0 0 L50 0 A50 50 0 0 0 35.4 -35.4 Z" fill={"url(#" + uid + "sw)"} />
                  </g>
                  </g>
                  {markers.map((m) => {
                    const r = ((90 - m.lat) / 180) * 44
                    const a = (m.lon * Math.PI) / 180
                    return <rect key={m.id} x={(r * Math.sin(a) - 1.8).toFixed(1)} y={(r * Math.cos(a) - 1.8).toFixed(1)} width="3.6" height="3.6" fill={kindColor(m.kind)} />
                  })}
                  <rect ref={radarDotRef} width="4" height="4" fill="#ffffff" className="pst-caret" />
                </svg>
                <RoundButton
                  label={mode === "globe" ? "Switch to flat map" : "Switch to globe"}
                  pal={pal}
                  style={{ position: "absolute", right: -8, top: "34%" }}
                  onClick={() => {
                    play("tap")
                    setMode((m) => (m === "globe" ? "map" : "globe"))
                    flash(mode === "globe" ? "FLAT MAP VIEW" : "GLOBE VIEW", 1800)
                  }}
                >
                  {mode === "globe" ? <GlobeIcon c={pal.star} /> : <MapIcon c={pal.star} />}
                </RoundButton>
                <RoundButton label="Center on current sighting" pal={pal} style={{ position: "absolute", right: 14, bottom: -8 }} onClick={recenter}>
                  <TargetIcon c={pal.star} />
                </RoundButton>
              </div>
            ) : null}

            {/* Autocomplete */}
            {suggestions.length ? (
              <ul
                id={uid + "list"}
                role="listbox"
                className="pst-in absolute m-0 list-none p-0"
                style={{ left: 30, bottom: 12, width: "min(340px, 70%)", background: pal.outline, padding: 3, zIndex: 40, clipPath: notch(6) }}
              >
                {suggestions.map((p, i) => (
                  <li
                    key={p.name + p.lat}
                    id={uid + "opt" + i}
                    role="option"
                    aria-selected={i === hi}
                    aria-label={p.name + (p.country ? ", " + p.country : "")}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2"
                    style={{ background: i === hi ? pal.glow : "#0e1d38", borderTop: i ? "1px solid " + pal.grid : undefined }}
                    onPointerDown={(e) => {
                      e.preventDefault()
                      setQuery(p.name + (p.country ? ", " + p.country : ""))
                      runSearch(p.name + (p.country ? ", " + p.country : ""))
                    }}
                    onPointerEnter={() => setHi(i)}
                  >
                    <Sprite rows={SPIDER_ICON} colors={{ k: pal.red }} scale={1.5} />
                    <PixelText text={p.name.slice(0, 18)} color="#ffffff" scale={2} />
                    <span className="flex-1" />
                    <PixelText text={(p.country ?? "").slice(0, 14)} color={pal.coast} scale={1.5} />
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Menu / log */}
            {menu && phase === "ready" ? (
              <div
                className="pst-in absolute flex flex-col gap-3 overflow-y-auto p-4"
                style={{ left: 8, top: 8, bottom: 8, width: "min(300px, 86%)", background: "rgba(8,18,36,.96)", boxShadow: "inset 0 0 0 3px " + pal.glow, zIndex: 50 }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <PixelText text="TRACKER LOG" color="#ffffff" scale={2.5} />
                  <CardButton label="Close menu" pal={pal} onClick={() => { play("tap"); setMenu(false) }}>
                    <PixelText text="X" color={pal.outline} scale={1.5} />
                  </CardButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Toggle on={mode === "globe"} label={mode === "globe" ? "GLOBE" : "MAP"} pal={pal} onClick={() => { play("tap"); setMode((m) => (m === "globe" ? "map" : "globe")) }} />
                  <Toggle on={sound} label={sound ? "SOUND ON" : "SOUND OFF"} pal={pal} onClick={() => { setSound((s) => !s); if (!sound) play("tap", true) }} />
                </div>
                <div className="flex flex-col gap-2">
                  <PixelText text="LEGEND" color={pal.coast} scale={1.5} />
                  {(["red", "green", "white", "result"] as SightingKind[]).map((k) => (
                    <div key={k} className="flex items-center gap-2">
                      <span style={{ width: 10, height: 10, background: kindColor(k), boxShadow: "0 0 0 2px " + pal.outline }} />
                      <PixelText text={kindLabel(k)} color={pal.text} scale={1.5} />
                    </div>
                  ))}
                </div>
                {history.length ? (
                  <div className="flex flex-col gap-1">
                    <PixelText text="RECENT SEARCHES" color={pal.coast} scale={1.5} />
                    {history.map((h) => (
                      <button key={h.q} type="button" aria-label={"Search again: " + h.q} className="pst-btn flex items-center justify-between px-2 py-1.5 text-left" style={{ background: "#0e1d38", border: 0 }} onClick={() => { setQuery(h.q); runSearch(h.q) }}>
                        <PixelText text={h.q.slice(0, 18)} color="#ffffff" scale={1.5} />
                        <PixelText text={String(h.n)} color={pal.accent} scale={1.5} />
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-col gap-1">
                  <PixelText text={"SIGHTINGS " + (sightings.length + pins.length)} color={pal.coast} scale={1.5} />
                  {[...pins, ...sightings].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      aria-label={kindLabel(m.kind) + ": " + m.name}
                      className="pst-btn flex items-center gap-2 px-2 py-1.5 text-left"
                      style={{ background: "#0e1d38", border: 0 }}
                      onClick={() => {
                        play("tap")
                        setMenu(false)
                        select(m)
                      }}
                    >
                      <span style={{ width: 8, height: 8, background: kindColor(m.kind), flex: "none" }} />
                      <PixelText text={m.name.slice(0, 16)} color="#ffffff" scale={1.5} />
                      <span className="flex-1" />
                      <PixelText text={(m.time ?? "").slice(0, 8)} color={pal.coast} scale={1} />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Intro + loading: the spider drops in */}
            {phase !== "ready" || spider !== "gone" ? (
              <div
                aria-hidden={phase === "ready"}
                className="absolute inset-0 flex flex-col items-center"
                style={{
                  zIndex: 60,
                  background: phase === "ready" ? "transparent" : "linear-gradient(180deg, #262b33 0%, #1c2027 100%)",
                  pointerEvents: phase === "ready" ? "none" : "auto",
                  transition: "background .4s",
                }}
              >
                {phase === "intro" ? <Emblem uid={uid} color={pal.text} /> : null}
                <div
                  className={"relative flex w-full flex-col items-center " + (spider === "up" ? "pst-zip" : "pst-drop")}
                  style={{ height: phase === "intro" ? "46%" : "52%", flex: "none" }}
                >
                  <div className="pst-swing flex h-full flex-col items-center">
                    <div style={{ width: 3, flex: 1, background: "#f4f7fb", boxShadow: "0 0 6px rgba(255,255,255,.4)" }} />
                    <div className="relative" style={{ marginTop: -2 }}>
                      <Sprite rows={HANG_A} colors={spiderColors} scale={compact ? 4 : 5} className="pst-fa" overlay={HANG_LIDS} overlayClass="pst-blink" />
                      <Sprite rows={HANG_B} colors={spiderColors} scale={compact ? 4 : 5} className="pst-fb" style={{ position: "absolute", left: 0, top: 0 }} overlay={HANG_LIDS} overlayClass="pst-blink" />
                    </div>
                  </div>
                </div>
                {phase === "intro" ? (
                  <div className="relative mt-6 flex flex-col items-center gap-5 px-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {wrapWords(welcomeText.toUpperCase(), compact ? 22 : 34).map((line, i) => (
                        <PixelText key={i} text={line} color={pal.text} scale={compact ? 2 : 2.5} />
                      ))}
                    </div>
                    <Equalizer color={pal.star} />
                    <div className="flex flex-col items-center gap-1.5">
                      {wrapWords("CHOOSE YOUR SETTINGS AND START TRACKING", compact ? 24 : 60).map((line) => (
                        <PixelText key={line} text={line} color={pal.text} scale={compact ? 1.5 : 2} />
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <SoundChoice label="SOUND ON" primary pal={pal} onClick={() => startTracking(true)} />
                      <SoundChoice label="SOUND OFF" pal={pal} onClick={() => startTracking(false)} />
                    </div>
                  </div>
                ) : phase === "loading" ? (
                  <div className="mt-6 flex flex-col items-center gap-4">
                    <PixelText text={"TRACKING " + (query.trim().toUpperCase().slice(0, 24) || "")} color={pal.text} scale={2} />
                    <Equalizer color={pal.star} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* CRT scanlines, spider-sense flash */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ zIndex: 70, backgroundImage: "repeating-linear-gradient(180deg, rgba(0,0,0,.16) 0 1px, transparent 1px 3px)" }}
            />
            {sense ? (
              <div
                key={"f" + sense}
                aria-hidden
                className="pst-flash pointer-events-none absolute inset-0"
                style={{ zIndex: 71, background: "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,211,92,.45) 0 6deg, transparent 6deg 24deg)" }}
              />
            ) : null}
            <div role="status" aria-live="polite" className="sr-only absolute" style={{ width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
              {phase === "loading" ? "Searching " + query : status}
            </div>
          </div>
        </div>

        {/* Title plate */}
        <div
          className="absolute flex items-center"
          style={{ left: "50%", top: "clamp(4px, 1.2cqmin, 10px)", transform: "translateX(-50%)", zIndex: 5 }}
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5"
            style={{ background: "#0f2a4d", boxShadow: bevel(pal.frameLight, "#081a31", pal.outline, 3), borderRadius: 6 }}
          >
            <PixelText text={title[0]} color="#dff1ff" shadow={pal.outline} scale={compact ? 2 : 3} />
            <Sprite rows={FACE} colors={spiderColors} scale={compact ? 2 : 2.5} overlay={FACE_LIDS} overlayClass="pst-blink" style={{ margin: "-10px 0" }} />
            <PixelText text={title[1]} color="#dff1ff" shadow={pal.outline} scale={compact ? 2 : 3} />
          </div>
        </div>

        {/* Menu */}
        <button
          type="button"
          aria-label={menu ? "Close tracker log" : "Open tracker log"}
          aria-expanded={menu}
          className="pst-btn absolute flex items-center justify-center"
          style={{
            left: -4,
            top: -4,
            width: btnSize,
            height: btnSize,
            borderRadius: "50%",
            background: phase === "ready" ? pal.accent : pal.outline,
            boxShadow: bevel(shade(pal.accent, 0.35), shade(pal.accent, -0.35), pal.outline, 4),
            border: 0,
            zIndex: 6,
          }}
          onClick={() => {
            if (phase !== "ready") return
            play("tap")
            setMenu((m) => !m)
          }}
        >
          {phase === "ready" && !menu ? (
            <span className="flex flex-col gap-[4px]" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ display: "block", width: 22, height: 4, background: pal.outline, boxShadow: "0 0 0 1px " + shade(pal.accent, 0.4) }} />
              ))}
            </span>
          ) : (
            <Eyes outline={pal.outline} />
          )}
        </button>

        {/* Spider sense */}
        <button
          type="button"
          aria-label="Spider sense: jump to a random sighting"
          className="pst-btn absolute flex items-center justify-center"
          style={{
            right: -4,
            top: -4,
            width: btnSize,
            height: btnSize,
            background: pal.white,
            boxShadow: bevel("#ffffff", "#b9c6d4", pal.outline, 4),
            border: 0,
            borderRadius: 8,
            zIndex: 6,
          }}
          onClick={spiderSense}
        >
          <Sprite rows={SPIDER_ICON} colors={{ k: pal.outline }} scale={3} />
        </button>

        {/* Layer tabs */}
        <div className="absolute flex flex-col gap-2" style={{ left: -10, top: "22%", zIndex: 6 }}>
          {(["green", "red"] as const).map((k) => {
            const on = layers[k] && phase === "ready"
            return (
              <button
                key={k}
                type="button"
                aria-pressed={layers[k]}
                aria-label={(k === "green" ? "Allies" : "Sightings") + " layer"}
                className="pst-btn flex items-center justify-center"
                style={{
                  width: "clamp(44px, 8cqmin, 58px)",
                  height: "clamp(34px, 6cqmin, 42px)",
                  background: pal.outline,
                  clipPath: "polygon(0 0, 72% 0, 100% 50%, 72% 100%, 0 100%)",
                  border: 0,
                  padding: 0,
                }}
                onClick={() => {
                  play("tap")
                  setLayers((l) => ({ ...l, [k]: !l[k] }))
                }}
              >
                <span
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    margin: 3,
                    paddingRight: "22%",
                    background: on ? (k === "green" ? pal.green : pal.red) : pal.white,
                    clipPath: "polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%)",
                    boxShadow: "inset 3px 3px 0 rgba(255,255,255,.35), inset -3px -3px 0 rgba(0,0,0,.2)",
                  }}
                >
                  <Sprite rows={SPIDER_ICON} colors={{ k: pal.outline }} scale={2} />
                </span>
              </button>
            )
          })}
        </div>

        {/* Mascot */}
        <button
          type="button"
          aria-label="Say hi to the tracker spider"
          className="pst-btn absolute"
          style={{ left: -6, bottom: 4, zIndex: 6, background: "none", border: 0, padding: 0 }}
          onClick={() => {
            setHop((h) => h + 1)
            play("thwip")
            flash(QUIPS[hop % QUIPS.length], 2600)
          }}
        >
          <span key={"hop" + hop} className={"relative block " + (hop ? "pst-hop" : "")}>
            <Sprite rows={STAND_A} colors={spiderColors} scale={compact ? 2 : 3} className="pst-fa" overlay={STAND_LIDS} overlayClass="pst-blink" style={{ animationDuration: "1.4s" }} />
            <Sprite rows={STAND_B} colors={spiderColors} scale={compact ? 2 : 3} className="pst-fb" style={{ position: "absolute", left: 0, top: 0, animationDuration: "1.4s" }} overlay={STAND_LIDS} overlayClass="pst-blink" />
          </span>
        </button>

        {/* Search bar */}
        <div
          ref={barRef}
          className="absolute"
          style={{
            left: "clamp(70px, 13cqmin, 104px)",
            right: "clamp(64px, 12cqmin, 96px)",
            bottom: "clamp(10px, 2.2cqmin, 18px)",
            height: "clamp(44px, 7.6cqmin, 58px)",
            background: pal.outline,
            padding: 3,
            borderRadius: 8,
            zIndex: 6,
          }}
        >
          <div
            className="relative flex h-full w-full items-center overflow-hidden px-4"
            style={{
              background: phase === "intro" ? "#2a2f38" : "#16202f",
              borderRadius: 5,
              boxShadow: "inset 0 3px 0 rgba(0,0,0,.45), inset 0 -2px 0 " + (focused ? pal.star : "#3a4a60"),
              cursor: phase === "ready" ? "text" : "default",
            }}
            onClick={() => inputRef.current?.focus()}
          >
            {focused || (query && !status) ? (
              <div className="flex items-center" aria-hidden>
                {shown ? <PixelText text={shown} color="#ffffff" scale={tScale} /> : null}
                {focused ? (
                  <span
                    className="pst-caret"
                    style={{
                      display: "block",
                      width: 5 * tScale,
                      height: 7 * tScale,
                      marginLeft: tScale,
                      background: pal.accent,
                      transform: "translateX(" + -(shown.length - (caret - winStart)) * ADVANCE * tScale + "px)",
                    }}
                  />
                ) : null}
              </div>
            ) : barText.scroll ? (
              <div className="pst-marquee flex" style={{ ["--pst-dur" as string]: Math.max(8, barText.text.length * 0.28) + "s", width: "max-content" } as React.CSSProperties} aria-hidden>
                {[0, 1].map((i) => (
                  <span key={i} className="flex" style={{ paddingRight: 48 * tScale / 2 }}>
                    <PixelText text={barText.text} color={pal.text} scale={tScale} />
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex w-full items-center justify-center gap-1" aria-hidden>
                <PixelText text={barText.text} color={barText.dim ? "#5d6878" : pal.text} scale={Math.min(tScale, (barW - 40) / textWidth(barText.text + (phase === "loading" ? "..." : "")))} />
                {phase === "loading" ? <PixelText text="..." color={pal.text} scale={tScale} className="pst-caret" /> : null}
              </div>
            )}
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-label="Search a place to track"
              aria-expanded={suggestions.length > 0}
              aria-controls={uid + "list"}
              aria-activedescendant={hi > -1 && suggestions.length ? uid + "opt" + hi : undefined}
              aria-autocomplete="list"
              disabled={phase !== "ready"}
              value={query}
              autoComplete="off"
              spellCheck={false}
              maxLength={80}
              className="absolute inset-0 h-full w-full border-0 bg-transparent p-0 outline-none"
              style={{ color: "transparent", caretColor: "transparent", fontSize: 16, opacity: 0.01 }}
              onFocus={() => {
                setFocused(true)
                setStatus("")
                setMenu(false)
                requestAnimationFrame(syncCaret)
              }}
              onBlur={() => {
                setFocused(false)
                setHi(-1)
              }}
              onChange={(e) => {
                setQuery(e.target.value)
                setCaret(e.target.selectionStart ?? e.target.value.length)
                setHi(-1)
                play("type")
              }}
              onSelect={syncCaret}
              onKeyUp={syncCaret}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && suggestions.length) {
                  e.preventDefault()
                  setHi((h) => (h + 1) % suggestions.length)
                } else if (e.key === "ArrowUp" && suggestions.length) {
                  e.preventDefault()
                  setHi((h) => (h <= 0 ? suggestions.length - 1 : h - 1))
                } else if (e.key === "Enter") {
                  e.preventDefault()
                  const p = hi > -1 ? suggestions[hi] : null
                  const q = p ? p.name + (p.country ? ", " + p.country : "") : query
                  if (p) setQuery(q)
                  runSearch(q)
                } else if (e.key === "Escape") {
                  if (query) setQuery("")
                  else inputRef.current?.blur()
                }
              }}
            />
          </div>
        </div>

        {/* Sound */}
        <button
          type="button"
          aria-label={sound ? "Mute sound" : "Turn sound on"}
          aria-pressed={sound}
          className="pst-btn absolute flex items-center justify-center"
          style={{
            right: "clamp(8px, 2cqmin, 16px)",
            bottom: "clamp(10px, 2.2cqmin, 18px)",
            width: "clamp(48px, 9cqmin, 68px)",
            height: "clamp(44px, 7.6cqmin, 58px)",
            background: sound ? pal.green : "#d9dee6",
            boxShadow: bevel(sound ? shade(pal.green, 0.35) : "#ffffff", sound ? shade(pal.green, -0.3) : "#9aa4b2", pal.outline, 3),
            border: 0,
            borderRadius: 8,
            zIndex: 6,
          }}
          onClick={() => {
            const next = !sound
            setSound(next)
            if (next) play("tap", true)
          }}
        >
          <SpeakerIcon on={sound} c={pal.outline} />
        </button>
      </div>
    </section>
  )
}

let landCache: Uint8Array | null = null
function decodeLandCached() {
  return landCache ?? (landCache = decodeLand())
}

function shade(hex: string, amt: number): string {
  const [r, g, b] = hexRgb(hex)
  const f = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt))
  return "#" + [f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, "0")).join("")
}

function octagon(r: number): string {
  return Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4 + Math.PI / 8
    return (r * Math.cos(a)).toFixed(2) + "," + (r * Math.sin(a)).toFixed(2)
  }).join(" ")
}

function wrapWords(text: string, max: number): string[] {
  const lines: string[] = []
  let line = ""
  for (const w of text.split(/\s+/)) {
    if (!w) continue
    if (line && (line + " " + w).length > max) {
      lines.push(line)
      line = w
    } else line = line ? line + " " + w : w
  }
  if (line) lines.push(line)
  return lines
}

function Marker({ kind, color, outline, active }: { kind?: SightingKind; color: string; outline: string; active: boolean }) {
  const result = kind === "result"
  return (
    <span className="pst-pop relative block h-full w-full">
      {active || result ? (
        <span
          className="pst-ping absolute inset-0"
          style={{ borderRadius: result ? 0 : "50%", clipPath: result ? HEX : undefined, background: color, opacity: 0.6 }}
        />
      ) : null}
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={
          result
            ? { clipPath: HEX, background: outline }
            : { borderRadius: "50%", background: outline }
        }
      >
        <span
          className="flex items-center justify-center"
          style={{
            width: "calc(100% - 6px)",
            height: "calc(100% - 6px)",
            background: color,
            borderRadius: result ? 0 : "50%",
            clipPath: result ? HEX : undefined,
            boxShadow: "inset 2px 2px 0 rgba(255,255,255,.35), inset -2px -2px 0 rgba(0,0,0,.25)",
          }}
        >
          <Sprite rows={result ? STAR_ICON : SPIDER_ICON} colors={{ k: outline }} scale={result ? 2 : 1.8} />
        </span>
      </span>
      {active ? (
        <span className="absolute" style={{ inset: -6, border: "2px solid #ffffff", borderRadius: result ? 4 : "50%", opacity: 0.9 }} />
      ) : null}
    </span>
  )
}

const HEX = "polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)"

function CardButton({ children, onClick, label, pal }: { children: React.ReactNode; onClick: () => void; label: string; pal: Palette }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="pst-btn flex items-center justify-center px-2"
      style={{ height: 26, minWidth: 26, background: pal.star, border: 0, boxShadow: bevel("#d6ecff", shade(pal.star, -0.3), pal.outline, 2) }}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function RoundButton({ children, onClick, label, pal, style }: { children: React.ReactNode; onClick: () => void; label: string; pal: Palette; style?: React.CSSProperties }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="pst-btn flex items-center justify-center"
      style={{ width: 30, height: 30, borderRadius: "50%", background: "#123061", border: 0, boxShadow: "0 0 0 2px " + pal.star + ", 0 0 0 4px " + pal.outline, ...style }}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function Toggle({ on, label, onClick, pal }: { on: boolean; label: string; onClick: () => void; pal: Palette }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      className="pst-btn px-3 py-2"
      style={{ background: on ? pal.glow : "#1b2433", border: 0, boxShadow: "0 0 0 2px " + (on ? pal.star : "#3a4658") }}
      onClick={onClick}
    >
      <PixelText text={label} color={on ? "#ffffff" : pal.text} scale={1.5} />
    </button>
  )
}

function SoundChoice({ label, primary, onClick, pal }: { label: string; primary?: boolean; onClick: () => void; pal: Palette }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="pst-btn px-4 py-2.5"
      style={{
        background: primary ? "#0f2542" : "#3a3f47",
        border: 0,
        borderRadius: 6,
        boxShadow: primary ? "0 0 0 3px " + pal.star + ", 0 0 0 5px " + pal.outline + ", 0 0 18px " + pal.glow : "0 0 0 3px #5b626d, 0 0 0 5px " + pal.outline,
      }}
      onClick={onClick}
    >
      <PixelText text={label} color={primary ? pal.text : "#9aa3ae"} scale={2} />
    </button>
  )
}

function Equalizer({ color }: { color: string }) {
  const h = [5, 8, 4, 7, 10, 6, 9, 4, 6]
  return (
    <div aria-hidden className="flex items-end gap-[4px]" style={{ height: 22 }}>
      {h.map((v, i) => (
        <span key={i} className="pst-eq" style={{ display: "block", width: 10, height: v * 2 + 4, background: color, animationDelay: -i * 0.13 + "s", opacity: 0.85 }} />
      ))}
    </div>
  )
}

function Eyes({ outline }: { outline: string }) {
  return (
    <svg aria-hidden width="34" height="22" viewBox="0 0 17 11" shapeRendering="crispEdges">
      <path d="M1 2h6v1h1v6h-1v1h-6v-1h-1v-6h1z M10 2h6v1h1v6h-1v1h-6v-1h-1v-6h1z" fill={outline} />
      <path d="M2 3h4v1h1v4h-1v1h-4v-1h-1v-4h1z M11 3h4v1h1v4h-1v1h-4v-1h-1v-4h1z" fill="#ffffff" />
    </svg>
  )
}

function Emblem({ uid, color }: { uid: string; color: string }) {
  // A big dotted spider behind the welcome copy, like an old dot-matrix screen.
  const legs = [
    "M44 38 L22 18 L14 -2", "M42 46 L14 38 L0 22", "M42 54 L14 62 L2 84", "M44 62 L24 84 L18 104",
    "M56 38 L78 18 L86 -2", "M58 46 L86 38 L100 22", "M58 54 L86 62 L98 84", "M56 62 L76 84 L82 104",
  ]
  return (
    <svg aria-hidden className="pointer-events-none absolute" viewBox="-6 -8 112 118" style={{ left: "8%", right: "8%", top: "6%", bottom: "14%", width: "84%", height: "80%", opacity: 0.16 }}>
      <defs>
        <pattern id={uid + "dots"} width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="1.1" height="1.1" fill={color} />
        </pattern>
      </defs>
      <g fill="none" stroke={"url(#" + uid + "dots)"} strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter">
        {legs.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <ellipse cx="50" cy="36" rx="10" ry="9" fill={"url(#" + uid + "dots)"} />
      <ellipse cx="50" cy="62" rx="14" ry="20" fill={"url(#" + uid + "dots)"} />
    </svg>
  )
}

function GlobeIcon({ c }: { c: string }) {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.6">
      <circle cx="9" cy="9" r="7" />
      <ellipse cx="9" cy="9" rx="3" ry="7" />
      <path d="M2 9h14M3.5 5h11M3.5 13h11" />
    </svg>
  )
}

function MapIcon({ c }: { c: string }) {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M2 4l4.5-2 5 2L16 2v12l-4.5 2-5-2L2 16z M6.5 2v12 M11.5 4v12" />
    </svg>
  )
}

function TargetIcon({ c }: { c: string }) {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.6">
      <circle cx="9" cy="9" r="6" />
      <circle cx="9" cy="9" r="2" fill={c} />
      <path d="M9 0v3M9 15v3M0 9h3M15 9h3" />
    </svg>
  )
}

function SpeakerIcon({ on, c }: { on: boolean; c: string }) {
  return (
    <svg aria-hidden width="30" height="22" viewBox="0 0 15 11" shapeRendering="crispEdges">
      <path d="M0 3h3v5h-3z M3 3h1v-1h1v-1h1v-1h1v11h-1v-1h-1v-1h-1v-1h-1z" fill={c} />
      {on ? (
        <path d="M9 4h1v3h-1z M11 2h1v1h1v5h-1v1h-1v-1h1v-5h-1z M13 0h1v1h1v9h-1v1h-1v-1h1v-9h-1z" fill={c} />
      ) : (
        <path d="M9 3h1v1h1v1h1v-1h1v-1h1v1h-1v1h-1v1h1v1h1v1h-1v-1h-1v-1h-1v1h-1v1h-1v-1h1v-1h1v-1h-1v-1h-1z" fill={c} />
      )}
    </svg>
  )
}
