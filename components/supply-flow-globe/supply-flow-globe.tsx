"use client"

import * as React from "react"
import { geoContains, geoDistance, geoGraticule10, geoMercator, geoOrthographic, geoPath } from "d3-geo"
import type { GeoContext, GeoProjection } from "d3-geo"

/**
 * Supply Flow Globe — a hand-tinted globe of goods moving between countries.
 *
 * Every flow is a Sankey ribbon laid on the sphere itself: it follows a bowed
 * great circle from source to target, its width is its share of the biggest
 * flow, and little particles (coffee beans, tea leaves, dots) ride it at their
 * own pace. Countries are tinted by the role they play — producer, hub,
 * consumer — and every node is a disc sized by its throughput.
 *
 * Drag to spin the globe, pinch or ⌘/Ctrl-scroll to zoom, hover anything for
 * its numbers, click a node to swing it to the front and trace its flows, and
 * flip the Globe / Map switch to unroll the whole thing into Mercator.
 *
 * Canvas + DOM. Country outlines (Natural Earth 1:110m, public domain) are
 * embedded below, so nothing is fetched. Requires `d3-geo`.
 */

// #region geo
// Pure: the embedded world, sphere maths, flow layout, palettes. Lifted out and run by the test.

export type Role = "producer" | "hub" | "consumer"
export type LonLat = [number, number]
export type SupplyFlow = { source: string; target: string; value: number }
export type SupplyNode = { id: string; name?: string; role?: Role; coordinates?: LonLat }
export type Ring = LonLat[]
export type Country = { id: string; name: string; label: LonLat; rings: Ring[] }

// Natural Earth 1:110m admin-0 countries — encoded by scripts/encode-world.mjs.
export const WORLD = "FJ;Fiji;ovDjL;wwDhKAJZHBI;qvD9KGEGFBLNBJCBKIG;rwD-JDLAK~TZ;Tanzania;8V5D;mVRsCrBCLcTJXCLMFDRAPOfIDPLVHLAFFTBXGNBFaLQREpBSJYLMDMCKDSKAUWFUGCAMHMIC~EH;W. Sahara;7HgP;tFqRAjBhCACxBTBDJEdtCAFFCIsBCMQGccWKYGCGQQCSBGEMAAM~CA;Canada;1-B2lB;3sC0e3BcjBILSCMXKDQXOAKKKAMhBOhBkBdSLKTFTLdWTGTAA8F6CPSIYGeBeIgBGOHOEGKOBgBRcOCPYEIGYBgBHuBHcDUCaJbJkBD2BCSEULWKTIMIqBCQDULWCiBJ_BEDMSEgBHARMQQAKUVMXICWYOaBUJcVRJmBDBTcQYNFNSNWOOSCW6BDaJCJPLOJBJlBNbBVGFJXZXNbBPHBLVDZPTVHPBXeBShBcEmBHUHOJuBN2BDBPGTOVeTQGKWJeNMgBIWOMOBONSXOYWJSFeOG2BHSEqBRGHkBAARGXSDQLcMUWMIgChCHNaJSLgBFOFIPODIFCXbNhBFXRhBBrBExBBPNZHzBtBQEiBaoBQeCSJRLMlBaJiBEUWCNMHXL-BTXPNCBSkBQ1BDNMAcHGNDFEPNNXNDBFjCAfTFHlBAJBGLZJVDVJNGUgBJiBTKCEHCDIJBCCFCBGlCcRFdGPDTIhBEFCDMHAAH;v0BinBOIcAADXJNA;7xBwtBVKCIICuBBkBLAF;lyB6mBIGIAEDHLHC;v6B8uBLHbCXEKKcESF;z6BuwBvBCDEoBAOD;v8BoxBYHDFdDPEJIAI;j3BwuBzCIJWTIpBCVIIIoBBWFoBASHFFkBJ4BBgBEqCAUHGHNDbFZE;xlC8wBcDFFlBFbGQI;rlCoxBaDXDfAAEUE;3iBigBXdOIMFFFSFIGUHFNOEKXJPVCEQDEXRLAOKTE7BABGMIHEQMUgBOMQGKA;t0B2oBuBLAJQCOHRFdGLIvBTHKZBQKKiBOAEJKE;nxBotBUGoCRCJmBGUNwBHSHSRjBJwBLeFeReAFNhBXXIfUZBBL4BZMTFNrCUyBbCH1BIpBMXKGG5BUAF5BDRIOOuCEFGIKYULQdKpBGOEVORAPIJFjBDnCGrCIPIUIbAFUQSUI0BGPLQNSQ0BKiBVBL;h7BquBqBAmBDdRXDVPVCLQAKKK;5sCyvBiBQqBM6BCBNPH3CL;9yC4hBUCFVQPHAdYBKAG;9hCyxB_CJWRfCfGtBCUGXE;ltCqeJBhBIFIRGBGVEFKAG0BJSPUH;9rCwuBcDyBAqBNpCTZNAHzBJJItBMoBkBTM;rjCsvBSEUAEJLJjCBxBJdADGqBK5CDbEcUSG4BHkBLiBAbSSIWB;xiC2tBWHShBmCTBHfBMHFFnCI7BH1CFLKZGRBXQiDIlBEnCBJIuBIfAhBGeW2BMUDJHuBGaJYKSHQRKINUSC;3_ButBVOWIYDkBEGFTJgBHDRhBHRCNGxBQAG;ziCguBaAQDRLdO;x9B_vBQHALJNfBVEAKfABOWAeGcA;-7BsyBOGUCHEuBCaLiCHQLYHbFjBNtCAVKCGQGlBAVGLK;n5BmzB8CIeIYBWFQM_BEoCA6BCsEDwCHBDzDRsBAvCRhBPnBDND7BBcBNDQJRFfFJHbFEDiBAAD1BLzBG5BDjCEBKkBEJOOC0BJZOhBEQIkBEGGbIHMmCDgBIzDAjBIPIXG;-uBkqBNFVADKIKSEQF;l8BurBOHNFZGPBbIgBO;poBmfGCaFWHADjBG;-nBsdGHiBDJHHAXIFG~US;United States of America;98B2Y;3sC0eoRAAIIAELGBiBDUHQEeFSGmCbCFGBBBKCEHIBBDUJKhBTdCFGBsCYFMKCmBAGIgBUkCACGOEOYQOGDOEIFAbQR9BVNPALGJIABGGDBF5BHPFeEGDbFNAAEFFGBDNNPBGJGEJEDAHPXEOJIBSDJELNCOFARGBGZNPTFNLJAJHBFVNTVDNENQdAJIVAVFLFBJCBIHGXoBGOFKPQHETJNMLEVBRCXDEFAHEDDBHCHDNANMRBNEdFRPTHJJFHANGPHBdMJWLMRaNIPALPPGLGJUdYhBAAJ3BArCYCEvBDDKLMJCBGLCFETCDEBMTUPcAEXYDQJKEQASFQISEkBDcLaCEeHKRGG;jhDyMMLRLDEDMEGAG;vhDgNHDFGCC;-hDoNABJAAC;3iDyNGHHADG;zjD8NBFFE;hoD4lBQBCHLBZI;3-CokBMBKFlBRJGDK;j4CyrBA7FUAUFeVUMUGMJeRiBjBiBNALJJdOFSXQLSxBCXGpBU1BMbB9BSVDENhBFnBJDKKUWGFGZLNLbNOJRPpBNFHdJFJXHNA3BRhBFBE_BaYCKIcMUMCOMMXFFELHLKFFHKTHLABMEGLIZDdOBMNIIMQKGKQCOBQIQAOGDIJEOIhBDFFNGdDbGHIZMoCSQABJqBAPMXIhBSbIMKkBAYKGKUI6BMSBeMeFQHIEiBBBDgBDUCgDJaE;prD8nBMDMCkBHPFXIRBDC~KZ;Kazakhstan;_qB2e;02B4ePNPABTJJnBGNjBxBLShBNFCLNEJI9BCHBbILDBLhBGLBDHlBRJNFAFIZCDQJACUXO5BDRSzBYzBLCpCJANONGXDHFBEGIDIXGHSLGAGUBAOSEQBESDOTBPEpBLJECKLMPAPOKQDEOWWLCOqBWeAkCVWIgBCYLGGcAGKfOSIDGUGNOIGsCIKEyBISIkBDGVUGaHBJUAyBUHFaPsBxBMKaLeGKDKLODIHaC~UZ;Uzbekistan;goBia;gjB6ZBqC0BM0BXSR6BEYNBTKAEPaBGHGAKOmBSGBRNQHOGYJZPXCBGEKbFPXPCFJQDENLVZGAMtBSjBYJUHETBHEBQbMPLRHEJ~PG;Papua New Guinea;_5CxD;k4CzBoCZYTELgBLGJRBENSLMVMAAHODFDWHBFNBDGlBGZYLQZKbLCPPFfE;s-CpCIFCJFFHUTQNGEEaN;y_CzDVJJAbMCGSDKCEKCACJMAQOBMMCEDALFLJB;4gDpDYXBFFBHIJMDQEC~ID;Indonesia;2-BT;k4CzBAhERQTEDFZAIQOGFWJQlBSPAdUFJHBDIAIPKWGOABGdAHMREHKcEKGgBHInBWLQWWMSAgBN;kuCxFCJNNPFBEKS;8zCpEBQIOEFAJ;2pCyCLRORBJWRXBFNARRNBTHdBGVHHMNCJGXHHKdCBaJGJQBSCSMOCNOJOEMBMKKCSFQEKcIIIW;8wC3BWFGPPKpBAEM;qvCrCNEDIUCEH;_vCsBCLMBCHBPJCBNIJFBHMFaEQ;6sCSYAUOCDPTNDTExBDDNSRMIkBIAJJEHLRHUZDFSXALLFHGKQTHDGCINMCUNFCzBLDHGGSDUHAFOIOMuBEISOQF;mrCtGZOSESLBD;6rCpFOASIBJdFbCAIQE;_pCnFMCEHvBFIKKCGG;6jC-DCHmBBGIkBHINeDYLVHVKnBApBMNCHDjBIDKRAOUYB;ohCVCNIJOBKNDXBfVAPSZQXcZqBPSNgBROJQPMTWBKsBF_B9BWAQNMPOJHPMH~AR;Argentina;joB9U;7qB7gBSXaLcFJJRALGfA;-jB7SJjBATDFDVaRDNOHBJRZdJnBDVCELDPEJLFVDRIHFCTOFKIGLRFPLBTFJRAPLFNUNUDHRXLLXRHHHGVOJrCGHMAONAFGBWQIGOBKKQGaBMKEBIJEGIHIDWIEDaKmBMGFUASOOAQMUASFEHiBMWBSGSOUOMFIEGAiBWKGUBGQSaFMNIQYAoBlBQBYPUHEHTdqBHQCSQESKEKLAPfT~CL;Chile;ltB7X;7qB7gBAtBgBAFHPF5BKtBWbYoCZKKGOUI;vrB-KKNCNMHHTMVIbOECFFTVJAhBDFGHNLNTFRCRLVIhBGDARLTAPNNARGTLFJlBEZHDEVIHFHKDCHJDCLFZJPCJFNPHCVGFOAANILiCFRAZLDRHBXItBYHOGMJMBiBIUWQdGSQGiBYHKqBNGFZLEMiCKMFUBWICagCKeFeGQBYMaQ8DF_BKE~CD;Dem. Rep. Congo;2OlB;qS5CERBJELMLKXHCfFFNGHFrBSLGECVPCNSPEDKLFPCHKVAAGPCZDAYFIBMCMDIAMXACIJABDLBHPJETFLSLa5BAVDBGECEOIEGBGIKACFIDceAQIUWUCGEOCcKYCaIKMGcNeFIOKBWKIDGAEGICaDICMPIBaGGHQNAXIBNLLTBPDHANFFFXGJ~SO;Somalia;ocoC;gahBLQAqCWcOCSOaA4B8BWeAmBcGIGIABbHbVvBRdnBvBlCzBVX~KE;Kenya;2XK;wY9CbUBMrCsBAUWkBJiBJMaaKDAJIHOAYPeDGISKIHOARVApCMPNHFHFBDNFHDL~SD;Sudan;qSmK;sPkFVQCWLMBOHGAMDGHAIQBIGGDEOcSBA4CWAAoBuHAGTDDCTIXSLJLNBFFLrBCHBPHTLJLXHFFTARAQDABQJIBOCQJAADLAEFCLTZLBPMHDBFJDADTADENAFBFCNQNBLbLF~TD;Chad;0LuJ;8OoMCvCRCNbEDFFCHHPIAEFALIFAFNBJHNVRJZACHRNZHHGDFPBCGHWJEJKEKaALSAaHOCILCAMJIKaYSCaIqBEIHGAGHGDgBUK~HT;Haiti;jtBiM;5sBqMARDDEFAFNEVAHDLGCIiBFIGJIAILCEG~DO;Dominican Rep.;lsB_L;5sBoLAGDGEEASCEQAQFEFMABFKAKHHHJEPAJDDEFBHNFE~RU;Russia;_bskB;2vDusBaIANVA;2egdJLRDTTSRBNWXPLHANMRGFITELBBCbKtBIBDZSXIPKOEQQJIcIAGRDCIKGSCEGDMIKAGpBGLKPDXIAEHIPCBGGELKbADDHAJUUAIGFENECEHELMEGBKTEJBDETGHUJGIGFSOMBEWKTK8BmBIKdOIMROOSVWSQfOEOmCQiBL2BDsCXQHANVJfF5CQNDgBNCdqBLCKLKOGwBLQGLOuBUSBSFMOPMKMNM4BFKLXBALOFgBEEMwDcQBTLYBOGmBCeIWLYMVMMI6BHkDbOKTKBGXCIILQAGkBSOSOE2BDELTPOFGNDbWLJNlBbWBIGWGGKSKLKIOVCDKQUZQkBODOKCKLHTWBJOiBIqBAkBJRQBUkBG6CAPMYMWAoBK0BEGE2BCQDsBKmBAEKUIwBIiBFbFuBBEJUE6BAsBJQHDJpCPPF2BHSEKNKGgBEgCDEJ0CBCOqCBgBLKLLHYPgBHUUgBHiBGmBHOGiBBPScI0FLSL0BPwCEoBBQHBPYFcEkBCkBDmBCkBRYGPOKI_BFqBC6BJcHAvCZJZCSJMPKFCHFFjBEpCP7BbHHbOzBPJIRJbEFNXTCHWDBbTBHPIHhBLHVdDFVbRHOTqCKcSMAIgBGmCsBkBQQeXBLRzBVPazBHxBfQNpCFAOdEZJ7BChCFtE1CgBBKLUDMKWBcVCRPTBXHfdbHNhC5BbLLALKbNBHDEAKKAEYFSSGYDOUGWIIKSfFRHdAHSXOhBIHSbqBPIdGzBDPJKFAJJHRTAJbLXIXBJGLCdNrBHrBELKTKTCrBFbIDQpBGVIVTILRNxBGNKTARGdJlBPbFLMZBHINEJMJEdFZMLJrByBZQIGxBTTACKZITFFWjBERHxBHJDrCHHFONTFEFRHgBNFJbAFFXMfBVHjCWdApBVBNVMNVEDJPQNQAMLBJ;06B0yBqBGoBLuBRFRpBB3BEhBIPOZE;ogCyxB0BLFHxDHmBa;42CyvB2BAoCJPPpCAfDnBOKM;08CivByBDVHfClBIGG;u3C8tBSIaCcHCF;gcsyBmCEEFeIeDtCNVEMI;mO_hB7BCEKcGeF;uhBiuBwBSFKwDYiCCiBIoBCOHNFjER9BT9BlBERmBPrCCFIjBGBKUEBMoBQ;q5CyhBITBRe3BdGLbSVANPMLNDQCUBWEOCcLSCcSKHIKE;ptDgqBBLOFFQ2BDoBRTJfBBRHDRAPGZGDKTCXBJGEIXDKJLHAwC;1vDqsBZBAOUCcFBD;8U4cGEUDQLUCDHVDZJLEEITGWM~BS;Bahamas;lwBwQ;rxB4QYAADVD;zwB8QQHDNDCCK;7wB4PGAIRAJFBDMHG~FK;Falkland Is.;1kBngB;nmBrgBYMSFMIQHFHbFHIRJ~NO;Norway;iGsmB;uJ6xBIGeC6CVxBHJPRDJPXApBMSGdGnBSPQ4BGKF;uTwrBxBJIOZIdHJNTJTGZBXMLFLABNlBEFLRAhBjBdbGHFHTCNTCZMJFXZXLMnBXbDZKHWFuBSM2BSmBU2CiC4CoBsBKgBBeQmBAkBE_BNZF;kRiyBdL5BB5BEDEbCVI_BGcDUG;uP2wBrBJjBGOELIqBEIH~GL;Greenland;xYuuB;nd0zBkCMmCAaGmCCgFB_DPlBH3FBKDmCC_BFmBGQHVJ0BGgDI8BDMHxCNJD-BDuBBnBZAXYLdBhBFmBJERVAaRrBBYHHF3BDaNAHnBIJFcDaLGPhBDnBSGLXLyCBrDfxCHTHbTrBNjCJRNANJLfPIPTjBbBdSnBARKNUhBYJODSbSIONIUYeGIIEQzBLXGBOIK8BDzBSTBPGWSzBqBZIAI1BMvEA5BS0BGoBCzCEtBICI2EUII1BGQImCOeCJKuDI_BAWF0BK2DNvBK~TF;Fr. S. Antarctic Lands;mrB5e;irBreOFSDCDFHfBAM~TL;Timor-Leste;2uCvF;kuCxFCEQGWCGBrBT~ZA;South Africa;6OxS;mK7RKKIFEHWDKASKAqCGBMTBLEFOCUOEKKESHQAOEEQMCMUSQcOkBDOpBBVAFJCFAFNAFMLMCEKOAFfFJRLXhBlBhBNHfJBDLCJDVETBlBJLHJAHGFCJIABBQHOGEAO~LS;Lesotho;0RtS;kSjSGFJPJBDFHBNOWUIG~MX;Mexico;9-B_O;lpCqUwBEBDsCX4BAAKiBAeXKTMFQFMQQAOHSZMLKVeLICLfDlBOjBONMVWDIJ8BQMIKiBkBKcAGDAJLJDNEBHXFEHAFLDCBDlBAAJJAWRBFXAJPCDBLhBcPGlBJzCeVOfIHIVMJMDKGCBGEGAGNcvBwBRIBECMVQDOLATWBGReCIPIFBLGBHEXcbEHCAELYVGTMRAJKAQRJLBAFMlBaCQDKXQBDRKLMKAIIAKNOLG~UY;Uruguay;-iBzU;-jB7SMCUPIAkBVMNJJGLHLVLPEJBRKNBLMCMEGAU~BR;Brazil;-exH;rhBjVFMKKLOjBWHATQLBwBuBgBUAQJMJDGWAMHEFDHADaDGNGHDTEAcFKGEAMEIEQDMLGBIEMnBAFYEADaLGLAVKHIVCVSCkBZBbPFFXALBHCAePLRAHMLAEKLMHSGEAIMGBKEICIYOSGSAKgCDMHGAOKEEBCILCAMmBAIGIREEMLQCCGYICIOGAERCBaHGEAeFGEkBKIIBGKAEDBHGDGHFHDPITMJKACEOEIEaBAOSAUHGGEBEDKAGISiBIAQtBKDCNPPGFkBBATQM6BTKJDLYGmBJeAePaVOFSAIHKjBHhBlBnBNXNPFBFNClBHrBFHDZTZBTRJDLVAdHPHVFVPRTBNCLHdNJVjBfXHT~BO;Bolivia;roBtK;trB7GYAGGcQaCBjBWRWBIHWJMAMFEZDAGXoBADLCHMFELDPDHALFDAGRKRCjBFJRALHVBEXAHPLOZGPRNDHcLWIULIBOJOMWHQEIBGIKAgBEG~PE;Peru;xtBjI;1rB1CRARFXNBHDHCJLFAHFDIRMLDJMAILSAQMAdIBMCQfDFAfHJCFDHIPRfJDTKBIlBUzBkBHQCGPa1BkDbWGIJUGOQMCHFFCFQBIJMKCMOSYIWUGODOGCcXMTQBKEIBMAQHNTGB~CO;Colombia;3tBkC;5pBaDDHSHFlBAALMBBHDCJDANIFELJ-BJKFCOUPILAHCJDPCLUbYFBRMFBPCFIXMBGICBKGGKCQWHGEMDSEEDSHKCKIBEGFMCEMBOOICEYMKMACEQBYQIIIAGFDFNDDJNLHZKBINATEBEFaCMBORiBEIDHRBNKXJJMJ~PA;Panama;nyBuF;rwBuFBDGLDFHCBJFGDMEEROJBDFLFBDKLHDJBDMBDFCDIVEBDBCCMECDEAIICGHADKAGDeKGGMABBUF~CR;Costa Rica;x0BqG;xzBgGHBAHEDDBBLJEDGCITKBGFECFDDLGBECODCGGODECGBKFEEGJ~NI;Nicaragua;l1B_H;p0B6GDDPIDBNEBBnBkBCEEDICGGBKKAEEGDMMGIKDSIIADFCHFNAXBBBNDD~HN;Honduras;p2BoJ;9zBsJHARHJEFHLLFEDDJACJLFDGFCCIDCLBRMGGBIaQUBSEMBICMD~SV;El Salvador;x3ByI;73BgJSLIEIDDNRETEFEMKBE~GT;Guatemala;x4BsJ;z5BiJCMBEKQYACGVSKAAKmBABlBUDTLCHFFDACDLJVE~BZ;Belize;t3B4K;13BkLCEEBGMIDFjBJLFA~VE;Venezuela;roBwE;9lBoDCFHHjBJFDdGDAIFCZSBADNFBHXHBFPBLMFULKKKJYCOISHEhBDNSLCZBDGDCAUHOJCIaOMEKOEBFJBGHALJJIPIAGQHGAQYIBIIIGNOBOJAFoBAKHQBMGAEwBCPFGJQAQJCPKAIDPLAHGHRFCJFD~GY;Guyana;5kBmD;pjBmBPAHDNDBDJALKHUEQGIFIFECIDEJANQGEBKSGFIAIQMOHMNAJIAUPDRLFBNIPGACJ~SR;Suriname;9iByC;hiBuBLERAANJCNSBKFAHQCOMGESYDCEQAUDJRCNIL~FR;France;0Bmd;pgB0CRhBFHJADEDCFFHEKaHMBOKSWHWP;8D_eKFcDJNBNFDJCCDPLAHKCGHAFGHHFGNKDBHRLlBGdFBLXDVKHDjBIHIKMEoBTWPKdIBOaEiBFFYSJuBQGQSEEFIAYRKCWL;uF0aOIEPHPHEFO~EC;Ecuador;7wBZ;jvBDENFNVTXHNRBLLJHKPCBGGGBIKODKHJLKEEBSGEMaBIYMYLGHQBGC~PR;Puerto Rico;xpBsL;tpByLKBEDDDbBAKCC~JM;Jamaica;pwBqL;vwByLOBKDEFNAFDLEJGCG~CU;Cuba;3wBqN;tzBwOiBBSFIHUCkBZSDBFQAOHBDND3BAOKHGLAHGDMLAXIZEHEIETCNJHADFHBJCYS~ZW;Zimbabwe;2S5L;wT9NjBELKPCFUHCVWRgBiBDecGCCIMIQCAHSAOHIBKFBnCJP~BW;Botswana;kP5N;sS5NbNRPLTLBDPNDPARIJDDJTNNBDGCMLUFCA8BUAAmCuBIIHMIWESfWVIBGTQB~NA;Namibia;2K7M;uMvPApCRJJAVEDIHGJJNQHOPgCBkBRYPmBPSBQWIOBMH0CCOJwBB0BMOBIDdNHItBHAlCTA~SN;Senegal;nJuJ;tKwIHQJGIEWgBKBKEKAYLYbGXGFCNTBNGtBAXDBQSBQIQDKEDGNDHGFADF~ML;Mali;nB2L;lH4HBOFGFYIECMUFMEIACEyCAEODCTuFgBAmE3CGJUHCLWCAtBLNBLrBFHFZBDELBRHDHPHBFHDJEFFBNPPAFFHCLNFBIJBDFVCFGAGBCDBEMNSDARJPIJB~MR;Mauritania;hGoM;1KkNGGuCADeEKUCByBiCAAesCvBfAUtFEBDNxCABDHALDTGBLHDXcXMJAJDJCHHAMEKESFeCKDK~BJ;Benin;wBuG;2B_DPDFOCuBDEBKLOCKGCEIKCMMGAQJAHELDHCDPTDL~NE;Niger;_F8K;qJqOEfIFAFIFDHHpBBZXRJZKHALMBBHFBAFDANWDAPLZIFDLCLHJBXKJDJAHITITDFDBJFHBRPKFAFFAOXGAILOBICKMCIGsBGCMMOAuBcI6BoBkCmBgBJKJ~NG;Nigeria;2E8F;2B_DAsBEMQUBEEIDMCaGICKGEUEUHIHKAKEYJKCMIMBGEaHQMEAOVEAIHDJPPPpBLHJZLHLKHBLJFBNfTHHCHFPCJMHONO~CM;Cameroon;6H8C;iJiIINAZMRZADJKJKDIVLZFDAdKJIRKFCNBLfK9CCEQHMJEDKDCGUISGCMKICMJMIKaMIQqBQQEKHIAG~TG;Togo;WwF;S8GBJMNCJEDBtBGNPDJUBKESDIBeHKAG~GH;Ghana;T6E;A8GAFIJCdEHDRCJKT9BXRGCIHSEWIQHsBCM~CI;Côte d'Ivoire;vD2E;-EsGWBEGKCCHOGWPGGKAOFEbHPDVIRBHhBEXDlBLCaTQEIBKCGCAAMKGJYCG~GN;Guinea;nG0G;xI8HYFUCAFKCQHSKEAORDLECCBAFGFDBBFKXJFALHADHFADECIJMNDBUJOPAJDFJJHRUJGDOFCIKGAOGBG~GW;Guinea-Bissau;hJ0H;tK4HYEkBABJCFNFFAHJLKHA~LR;Liberia;9FgE;nF6EAPDHUPBZZIvBoBGMSUICKLBHEDGAEI~SL;Sierra Leone;rHsF;nIyFKIGKKEQAKNCTGCRTFLTKJK~BF;Burkina Faso;b_H;rDwGBMGIAGQQCOGGKDIECGQIEISIMCEDOABJCHMNAHYFANFFJBDHFBZCHDpBCCbNGJAFF~CF;Central African Rep.;iNsE;kRoDHBZERHHEVJJCHNdGbOLFHJANbELJJRBOJGHSJKAQAOGEKUQCEGIFaISOBIaASKOWKIOCCHMLBVgBXAFWTGLOF~CG;Congo;_JC;yLmCBLJXBbDNBFVTHTAPbdHEBGJAFHNKNLPUQMHMGGOCCKKJSBGKCOBOJMKYFENBFKCKYBgBJCMKSMK~GA;Gabon;sHH;iHuBWBMCCABJGJOCGDJXKLCNBNFJRCJKBJNBFFILPLhBmBLUOqBkBC~GQ;Eq. Guinea;0FuB;gGuBiBAAXjBBDE~ZM;Zambia;wQlJ;mTlFqBRIJGPHVEPFHFRKF7BPCNPBLHBHFBdbhBELGNCPDZcAgCqBABGEIDKCKBGIBAFWAIJQBMGEJQDORQBBWFDRMGsBFIGOGCaE~MW;Malawi;gVrI;wU3FSDMPGZFPGZGAIFINCZJDFNLMBOEKAIHEFBVQGSGIDQIWFQ~MZ;Mozambique;0X1I;0VlHOCYFUCGGMAWIQMEJCjCEJNbLLpBRzBrBBNKPEPEADbEDBHJHnBRHFCHEBBJNAFYCWNqBUYKQCoCJGHCNIRABW8BQMJGCIDAHDJCNMLGOKEBaHOHGFAFa~SZ;eSwatini;2TxQ;iU1QDJLBLMAGGOGAKB~AO;Angola;oLzH;kI-CHDDNDBFQOM;2H5DWE6BAMZMRUGKDIQMCCEKABHYAALEHBLCLGHAXaEIACFBJEJDHCFpBAA-BabjBHvBCNKzCBLINCVHBMMuBKaSWCOAMFGJYGMJiBJM~BI;Burundi;2ShC;iTvBGTTVJAAYFKMBGM~IL;Israel;4VqT;qWuUDFFCDLEBDDBDKCAHJfLiBGGKgBOE~LB;Lebanon;wWqV;sW6UNDIQKOIAEHJH~MG;Madagascar;mdzL;_e5HMVCXGHBJDFFMDFEPBHFDBRtBpEhBNbMDKBSHQAOCQKCAIKOCOJWASGKCOmBIcYGKBIIBKOCMGK~PS;Palestine;iWgU;kW2TJBCEEEDCEMGB~GM;Gambia;rJwI;tKwIWAEGGAIFOEEFJDPEPHRC~TN;Tunisia;0FiV;_F_SHkBdYBQMMGQDSEKWIOBAJQICDJJAJGDBRNJEJMAEJIDBNbTAR~DZ;Algeria;4BkR;tFkRAcgBQmBIGKYICOKCKIaEEIFEHgBHOUKWEMIUGiCGKDUIUAIDOADJERFPLLCPeXO1BDtBCLHHMNAJIJKEQJILjClB5BnBbHVBBMTIFK~JO;Jordan;4WoT;mWoUEGWHoBWIXrBNUTFDDFPBLNVEBCKgB~AE;United Arab Emirates;iiB2O;ogBkPECAFQEcBqBoBEHCPJABLEDJDAHJT7BK~QA;Qatar;_f4P;4fwPBOGKGCGFALDLFA~KW;Kuwait;ydsS;ge4SIbNBDKRCOU~IQ;Iraq;ib2U;wYkUHYsBUIYBQKEKMKEWBIFKEMXOFCLLHDNOTYJKPBNGAAJMLZENTlBC3BoBdO~OM;Oman;6jB6N;wiBmOAIGIAIKEDECMKAINMFaFQRGDADZlBJCDFBJAPJALFBJDDLAHFAHJDLAVFVuB8BUOoB;mjBiQDIGGCB~VU;Vanuatu;qoDzJ;woD9JMLFBFI;ooD5JDWKFEP~KH;Cambodia;qhC8H;kgC0HFYOQaESBQHKOSHENBXhBNILTBRHPC~TH;Thailand;m-B2J;4hC_IRCZDNPGXRIRAEQRABVPtBAPOAIRERKJMDKJFHLBBKPIDBHGDKTWDLBMIeUoBHSBURaGEISdsBIEKWOCWMIFCLOAFVCRUMGDMCEGQBOPCTQPBR~LA;Laos;igCkM;kjC8IRIJNPIGICSPQBUNQPCDFLBFETLBSGWNABMHGEISMCDKABWKEUhBYAIRLFFFYLepBONGN~MM;Myanmar;87BwN;y_B4MVLNBJVHDerBHRFDSZCTIRTnBBQGOHMCWHKJyBHQjBXXGGaDSPYEGLENQBQIDAOKGBIEGAWQDKQAKMQBMaOODAMGEBIMAGLKDAfTPBXWEETMDFPYJQEAHRL~VN;Vietnam;8hCyN;mhCyGSIUCHMiBOCYDOEUFONOdqBXMGGMGHSXATiBKEkBCQMKHSDBLIHWDbRPRDNiBvBSLMPIlBBhBnBZPRXRHMGO~KP;North Korea;gvC_Y;0xCwaEDHCNNANVNVHBLSLBDVBHJJBJEHDBEJEKMBCGMBETGQOWKOOIFSABKeIIM~KR;South Korea;iwC4W;8uCyXKCIKWCCESXGLAXHJRDPHRBBKEQJUQE~MN;Mongolia;khC4c;82B6eUEmBQeKSFUAOJyBFSOHMWUWHqBFEPcHsBGUBUJMJsBDsBIeOMBKFYCXjBEHMEUDQIQHSNBFPCdBNFNNdHTJfGLLKPbPXHdAfHVJJGXAdMTEZD-BEJMJSLEXMzBGFIIYNQbIRK~IN;India;0xBmO;68B2RCHFDALNEZNCLLPAJJPPEAVDFCHJFLgBDADLJKGMIAKSLClBEBOHAPIHLOLLFDHMFDLINCPBHlBDAPJJbNXXhBZAHbLJBFPGpBHRAhBLBHPGFRFHLHFRSRwBPcJmBRcNgCAYDUbLNCZYIIFGVSMOsBADQJKBQNIWWYBUWOUSUAOSMPKPeKIgBDWESQWXBPIJAJNCEVwBZLJHRgCbcDMJmBFSAAeMECTSHOEgBBCOHGQCSOYOQFOKKNHH~BD;Bangladesh;i4BkP;_5B4NANHECPLeHMRACHFLJEBBNEBQHOEMLGEIMGNMIMQHIACNmBDMBJRHAFLKJEMEA~BT;Bhutan;o4BmR;q5BsRIFBNfCNDRIAEOOKGaF~NP;Nepal;o0B2R;i3BuRAdRAlBGLKbE-BcISUOQFULMDGJQDQH~PK;Pakistan;6qBqS;0wBmWRPVDfEJHQdQJRLANRTNTTVXCVVOHCPKJEPrBALNPEFQNOhDFIWcMBIHEBSRIRWgBJWEKDGGMBaICQKMQACGQCGBIGAMIMMGHMUAGGBIKKFSKIkCMOHGP~AF;Afghanistan;ypBsV;ypBsXMAUHQGGBGIMAGKIIKDBFGBBPIHQGOKiBBEFjCLJHGRJJCHFFTAILLFHLALHFFCPBBFPAJLBPZHLCFFJEVDfKSSBOPCHeKKJEOoBUHQCEKQCKGEQSECI~TJ;Tajikistan;stB8X;sqBmXMWDOPEGKQBQYcGDJCFIAHFTEBLUCaFmBCERICMDCThBCNJPFHICQFCCGJEHHFJLAFHFCPF~KG;Kyrgyzstan;yuBia;ssBuaEIMCiBFCMMEcHIC_BBKHODDDfJFHZBHNTEhBNEDFFlBBZGTBCMUDIGQBaQXKNFPISO~TM;Turkmenistan;2kB_Y;6gBkaIGYEOFONgBADKSIQMcLCPIDUCIDKTkBXuBRALPGBHRDDPJFPBDJPBTIBQNAXSPCVKNCHDNCNLRDDOEWPGGONAESUFQINMFKPDBP~IR;Iran;qiBkU;se2SLMAKFACOJQXKNUEOMIBMNGXoBEGFWOGEHKHMDICYOICGFHJMJGAGNSDOJeDeGCESEOMOBIEOBWJQBYROACPNnBKDJJIdQBCNRRSVSHCRIDCHbLHVxCMHaJCPBTJXGTQTGbsBJBNG~SY;Syria;_X8V;qWuUIWKIDIHABQQSAKIDWGKDQAYIgBCJLJDCPHXzCpB~AM;Armenia;gcqZ;idoYHBHQHAFEZMCIDIcCMHDDKHFFSH~SE;Sweden;8LmpB;8G6kBaYGYLKBaOUUBGIFIeciBkBSAGMmBDCOMA6BXCdGHhBFTNELnChBNbONUJRVVFHhBJRXCLPXAFSPW~BY;Belarus;4R0hB;0RkjBUFEDKCUDCJDFMLIDBDODGDHFTAKTRBFDAJZCFEHDhCKNALFJAAIFKMEAIFIAIUAUIGKQIBI~UA;Ukraine;iUif;8TygBIAEEcAMJFDCFQBIHADYHQEMJqBFAFHJELDFRBJFBHPBLFTBPFALFGTEFDhBGAITBVZJEHDJEGCIOACWAHKDIFEAGHGXIZFFDTFJGZCHDBGJEKOEBFKSQKCCGJSKAMGOAiCJIEGDaBAKGE~PL;Poland;mMwgB;2O2hBAHGHAHLDQjBBFJBRPGJXKNDJCLDJIHDJMPAAINCDFJEAGNCJGHMCIFKFIGEFMmCWUDCFwCBKB~AT;Austria;6I2d;0KieBHLAEDJPRAJFrBIDGTDDBdGCIGCKFCGSBOEKAGDCCBOGCIKOFUIOFKCKD~HU;Hungary;kMud;6NoeKDCFLDVbPDLCVHRETKDGDCGMDEMACISFQCCEcEMGWF~MD;Moldova;6R0d;0QkeSGYHIFAFGDEHIJVAABHNFBBIASXa~RO;Romania;0Pyc;0RucKDIEKDAFJDFCDXbKVFJD1BCHMEEDCHDJGBILEBGLIQEWcUIaBKFUGGEIAGBYZAR~LT;Lithuania;iPuiB;yQ4iBCHPHFJTHTAFGJCCMdGDQWG2BCCDKB~LV;Latvia;_P2jB;iR_jBKFIThBLTKJCBE1BBVFAQKMSIQPQAEQSEaJ~EE;Estonia;mQ2kB;wRmlBCDNLGRHFPAZKRDCMFBNGBM0BI~DE;Germany;iG8f;6I0hBGLFDGHGJBHILHBFCpBPGPWLHJFBCNBBFEJANDRCBFJGFBVGDDPACOKObEJGAIDEEODWMAEGGSDIEEQAEDOKDIBMQDMEAHWDBHWEKG~BG;Bulgaria;4Pya;mO0bEH2BBKEWGcJLHFNGLRCTFAJRBNIPFNABOJGCEBCEGIGJIBI~GR;Greece;yN2Y;uQiWBFdBAEXEEIKFgBABD;sO6ZOAQGOHSCAKKDFNDBXCXDOLVBJKDDELMJHDUPAJREGJLBIRNAPILeRUAGIKCGGEAEOCIEKA~TR;Turkey;yVyY;gcoXJDHGVCpBFXHPAJEVFHEAJLJFKIILBRENLdBPKVCDHNDTMVALUNKKQLKWSeCIOmBBYMYGiBA_BVYESBYKUCUJEHBHWLNFGVDF;qQkaUGSBCHSFDDXBXPFMECGO~AL;Albania;yMuZ;kNwZADFDBFHJPOBIEUDKIKCDGCIHANCH~HR;Croatia;oK0c;sKidUJSDGCMNHFHEfCJADDFEDHmBjBSFBDxBUPOECJIAILCFHFGAIOAECOBAEICCI~CH;Switzerland;2Emd;gG2dBHSDAHJDNCDHJADEJHJAJEFIJBAIQMBEKBGEQAEE~LU;Luxembourg;6Dif;4DqfEDAHJACM~BE;Belgium;gD4f;8D4fDNDABLRKJBXSHADGyBI~NL;Netherlands;wD4gB;qEuhBEHFRDFLAEVXOTDNAKGSecI~PT;Portugal;lF4Y;zFmaOIGJaCGJJFAPBBBJHBILFLIFJNAFHFJEJBEQBMJCDGCOIIEU~ES;Spain;lCiZ;1EmXAGKOHGGMHMICCKCCAQKGFKZBFKNHAOHIcOqCFwBAIHkBHIEWJYEALRNZDBFLLHPILLHDNNDNNtBATPJCFIFK~IE;Ireland;7EmhB;7D2hBENPRjBLbCQWJUqBYEJDJ~NC;New Caledonia;mnDlN;0nDlNaVHDJGbUPUKA~SB;Solomon Is.;wjD-E;qlDxGGFNAHM;ilD-FDDNSDMGA;ykDlGVCDECIOD;4jD-EGJhBWEC;miDrEIFDBHEHIAE~NZ;New Zealand;gsD7Y;yuDhZRXPHBGHCKQFMVICIOGCQAMHSXaJOIAMJOFGROTCOIFEPQFMBMIKBJdPCFFCJ;iqDnbcWKOGGEKOKIPQIEHAJdfIJPAPFRhBZNRALGVCDGKQaU~AU;Australia;4zChP;q8CvZMBCXHFBPFGNNRCLQBOLQAKiBH;6uCjUlBPDJFHdBREbDLJFATLbCfQAMKCEECWBMNgBAKHUHIDQNYKHHSKFGHAKPcIaBMIOCNIOqBWKCEBcIKGKAWGaeCSOSIRKEHKGKKDCOQSKEAGIBAEUGOJMLYBDMKQIEBGIMMGKBSEAKPGMEMFMHQDGCMFMEIAECKJNRFACHNTCFgBRYRQFEFSFOGIUIcDaEQCEBGIcIGGJCLEBCHGJCTGNOGQPBHERCJGBGRBJGNwBbBDMNITIEIJEEEVoBjBEPAXKPBRHbDXHTPHTrBHJDNBTLHVARHVPbMCKJDRN7BQLMHaJITCGKDOJNRDMMCMIKBOPRLFHPPIAMVWEEZMNATKjBBvBN~LK;Sri Lanka;uyB4E;kzB2EDTHFRDHQDcIgBOJ~CN;China;uiCqU;ukCsLPGBSKIWGMAEHHHFL;myBuaBMOGRiByBMOkBoBFKKCUQAQOICENSJcHOPHXGH0BFYLMDKRKLgCDaEUDeLYAKFWKgBIeAYIcQJQMMgBFUKeIOOOGeCQBCGROPIPHTELDDIYkBYHcMAKSUKIAKJGQKYCcCeFQHcpBIRiBHYNIReASIgBGJRHHFVNTXERFGRDXJAAJLMHLdHCJRAHGNNVJPNbFPHTFKKDIQMLKnBTLLTBJJMLQDAJQDWOSHOACLbDJLRJJNUJITahBAPLDELMFHfLBvBnC3BhBVBLJHGLHbJTDHVJAFOGIbGHBVEHICMREJIPLjBBTHCVJABMPDXKGQLEDUVDCYUQAgBJEFMLAVCIIJONJPGXNRNPBHEZGJFNNBQLDtBGPIPEFKLETMPGHDvBaDWOBAKHKCQVYfIFQNIDGBULEHBDSGGDEUKOEUDIOaCGIgBK~TW;Taiwan;yrC6O;ksCoPVvBJQBQMSQQKF~IT;Italy;_G_b;wGqdMBECUEEFcFBJEHPCPFAPGJSJKPWPQAGFFDgBLSJCDDHLKPCJLQHBJJBJPHBESEENUHEFILEJINChBWNKFUZKJDJHJBCIJEFOIGFIAGKDKAKIEDKAEIOBKE;oJ6XOCFPCFDJ1BUEKWB;uFyZKGMNBZJAHFHGAYDM~DK;Denmark;0FgjB;mGsiBLDPEHKAUIMSCYKBJDFCFKBDHFCPN;4HijBGJLPVMBI~GB;United Kingdom;pBgiB;7D2hBbEEKDKSCUL;9BshBEMNMXEFGIIFGLJAUJKGUQQoBAVTqBCDPRRUBUZOBSfYDBLJFGJPJbAhBFJELJRCNFLEeUSEfEFIWGLKEO~IS;Iceland;1LwoB;hJypBDNWNZNrCRxCKUIrBKkBEAGpBEMOgBCeNeMaFgBK~AZ;Azerbaijan;wdoZ;gdmaGBOLIAQMUXKBGDPBHXFDAJFALKIKFGHBXNAORIGGJIEELIEEaFCCJK;6cmYLEJIDIEAGDIA~GE;Georgia;qbma;gZkbCEuBHcJCBMCUDGHMDFDKJBBJAPGDDbBTKTBCKDMLILC~PH;Philippines;ysCgH;wrC_HJQSBGFDR;0sCoGEGCMMADLQSBRTZLO;gvCoFCXFRHUHJGPFHXMFOGKLIFHJCNLDGIQYOGJQGEKOABQQJ;iqC6FZRKOaaKUEP;usCsLBHGNDPLHDPEPMBICaJBLGDBJPKHMDHNMRDJGCIGEFGBHJMDIAUIHCgBGSMAMFGG;osCkHBKMFMAAHVP;uuC0HGXPGGRJFAOFCDMMBAILQSB~MY;Malaysia;knCyB;y_BiEECQHCJMCGISNILBXERIFGRAFNBpBgBBKLMBSHKCO;2pCyCnBEHVHHJbPDRGJBLJLCNDNKBOOFQEEQgBIYcKJEGIAEWOOKQIAKJCHeLBHNAEJ~BN;Brunei;0nC4C;moCsDDVHADFJK~SI;Slovenia;qJ6c;0IidQBKGSAEEEBEFPFBHHBADNCDBNAECDI~FI;Finland;iRynB;8RmrBDNgBNRPWVNRSNHLeNHJ7BlBjBBjCLLMTGEUHSIMSM8BaBIbKFIBe5BYMGYLaCUFUKKOeIaH~SK;Slovakia;8Lue;kO2eNPVGLFbDBDPBRGBIEGQCOMOCKHMEKBOE~CZ;Czechia;0Jmf;sJ_fKFOBAFKDEGOBAHQAKJNDFHPBBDJEJBNGTHjBSFQqBQGB~ER;Eritrea;_X8J;4WgJBIMsBGGOCKMSpBmBbcdKFFDHAdgBRINADELDLKFP~JP;Japan;w2CyW;24CwYRTAVHPEJJNZHjBBbVNGAQjBDVJXAUPNfLJJIESLGHOUGKMUKOOoBGWDUkBOJoBcOYDYIMWEKb;s6CwbOIEVbFRTfOJVVADUKOWCMsBWV;4yC_UKMMDIKOFEFLLHGJDFLLG~PY;Paraguay;xlBxN;rkBzMGJAbUDIEOFEFEZIAGEIDALJnBRPPBpBIUeDITIXQPClBiBIWAMKSkBGSBSJ~YE;Yemen;2cyJ;wgB8LWtBNFDPzBRRNPAJHjBFLLdBFMCMNcECAUIIBIGKIFcCeBGHKEOWSI~SA;Saudi Arabia;_b8O;8VsSWDMOQCEGGETUsBOYFeN4BnB4BDEJOCIRKDEHOHAVMPGDGAMf8BJEEKNNnB7BT5BHRHNVJDFIdCbBHGFJCHHHJYJGLSFQNOHCNUAaLWTMLaFEduBJA~AQ;Antarctica;uW7xB;te3wBoBEeDaJILER-BLvCHvBAZIEIqBGSG;tpBlyB4CBaQUHLT1CCXG;luBxsBkBCGKCYKKSCMHUXIRJPtBFZAKItBFPGAI;9-B9sBMEsCHWCMJ7CATE;zsChuBEIyBHYELFRFbC;xvC9tBOG0BNlBE;pmDjxBMImBDiBLGJlBBZG;wwD90BApD-gHAAqDSMkBHeIcHeI6BE8BNmDJsCF6BG2CDwBFsDMEItCChCEPI1BEEKOODKfEPIdGwBBuBEeFkCMQIHI1BKzDGNIpBOFWcHiCEQHgBCqCQeCAIHIGGaEMF2BI2BCqCOeBcCcD2BE4BDyDAsBKaDuBKgBTUGYHyBH2BG2CHKIXOXCLILW8CFUFIHcAuCIUDaCSOQHWDaCQHqCHYQUHcCUDOHaCqBKuCISEMGGKDIXeAICIQQEIFQII2BaIIMGMGUAMGeGaMQCMDHHbJPEPBbJJFBHAHKFNDRBjBVDHSNgBJSXKFGHCROXBJXNZDVNdFtCLPHjEBGHeDWFMFVFhBCbFBPYFEHYHsBBkDRiDHoCNeP8CSsCMyBA6CHMIcG0BCiGUXOAG1DDFICQKE_BIwBMSIgEMkDUkBMGIVEIIOI_BOQIKKOEYAKHYAAIKIWBGHYByBGWAKHWGsDQQGMGQDUCaPYEIIUEaAIHQIkCCsBDWLWEkCAiDQQGWSUDIFSDUAcLWGGIoBKqBGwBOSBgBMSASECISG2BImBDQDCJcLYBeLUAiBM4BJoBAQVADBJjBLCHYADHTPQFYBWESQYMQQqCIQQOIkBIMIaGUBmBEWBOGKOQPSD6CCgBF6BGUB_BgBcHoBRmBBqBGeMYAOEQDYLWAmBJYBWCcMSCoBDkBCkBDoBIwCEGSMFEHOPSDwDEwBBOFDHMFsBJqCJWAOGyBPwBDKHWDQHWB8CBgCLOFBHjBfZBLHZDJHbNLNBRYVmBBIJhCFlBBRJDJRNaHKHqBN6BLuBFKJ6BDSH4BE~CYN;N. Cyprus;iVgW;uU_VEGQASGNJCB~CY;Cyprus;2U6V;uU_VOCCDICCBTHJCDI~MA;Morocco;vE6T;rBgWINIfGDDHZDJHJBBNXHFJlBHfPBhBLAFDRCPBFPFBJXbVFbLPrBBAKIGGKAGGOMOGCGMAKIOMGOUKISCaUQQDaKcMMkBSUiBOAMJUC~EG;Egypt;sSsQ;iX4NtHAAwEFQGODIIKaAwBNYMSCODGJEIgBFKEMhBNhBFDPQNeBBkBpCgBrBDBAN~LY;Libya;oL0Q;0P4NAnBVABH9EsCjBRJKfKHMPKJDHKAKLOIIAgBESHaKEAScUCOYFICQDaHKRuBLWJUOFQGIQKMCcDGHiBFGFHJEHFNGP~ET;Ethiopia;uYgF;8dgF3B7BZARNNBDFNAHIRJFHdEXQNAHIAKJELWHEDIJKLCGMKAKsBIGMYMKKkBYDGQMJMEEDOASHOLQTNRCJQAEDDFWbgCX~DJ;Djibouti;yawH;wa6HIAGEEFAHLFIDFLDEPABK~SOL;Somaliland;md8F;yekHAlBVdRA-BYVcKSIDMRyBIkBM~UG;Uganda;yUoB;mVR9BBTHDCAOEICQMUOMHCAYIGODQEOAMIKLKhBVjB~RW;Rwanda;6SlB;gTVILALFBLCFLLCGYGGEB~BA;Bosnia and Herz.;qLyb;0L2aRGXUNQEIGDEEKAwBFFJKHBHPH~MK;North Macedonia;wNga;gOuaKFCNHDJAHDNBHGBIGM~RS;Serbia;gN0b;4L2cQGMBMHCFMDCHKFIEEBDDEDFDCHKHHFDFCBBDPBEKTMJJACVMGCCIJIGKHAIG~ME;Montenegro;_L4a;yM0aFBBEHJCFRMEOKGWL~XK;Kosovo;iN0a;8MmaBGHIIGCGECULDJPBBF~TT;Trinidad and Tobago;hmB8G;xmB4GQCAPTAEG~SS;S. Sudan;gTwE;oTmCPOFIZFHCPYNGFMVUAGXQMGMcOCOPGBGCOAEDUAAEKECGIEQLMCUaBMDGMAAEKABPCNKHCPEAAPDFJAFLMBKJEHIDMVlBhBNAPDNE"

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"

/** Zig-zag varints over a URL-safe alphabet → integers. */
export const decodeInts = (s: string): number[] => {
  const out: number[] = []
  let v = 0
  let shift = 0
  for (let i = 0; i < s.length; i++) {
    const c = ALPHA.indexOf(s[i])
    if (c < 0) continue
    v |= (c & 31) << shift
    if (c & 32) {
      shift += 5
      continue
    }
    out.push(v & 1 ? ~(v >>> 1) : v >>> 1)
    v = 0
    shift = 0
  }
  return out
}

/** The WORLD string → countries with closed rings in degrees. */
export const decodeWorld = (src: string): Country[] =>
  src.split("~").map((rec) => {
    const [id, name, label, ...rest] = rec.split(";")
    const l = decodeInts(label)
    const rings = rest.map((r) => {
      const n = decodeInts(r)
      const ring: Ring = []
      let x = 0
      let y = 0
      for (let i = 0; i + 1 < n.length; i += 2) {
        x += n[i]
        y += n[i + 1]
        ring.push([x / 10, y / 10])
      }
      ring.push([ring[0][0], ring[0][1]])
      return ring
    })
    return { id, name, label: [l[0] / 10, l[1] / 10], rings }
  })

// ---- sphere maths: unit vectors, x toward (0°, 0°), z toward the north pole ----

export type Vec = [number, number, number]
const RAD = Math.PI / 180

export const toVec = ([lon, lat]: LonLat): Vec => {
  const l = lon * RAD
  const p = lat * RAD
  return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)]
}
export const toLonLat = (v: Vec): LonLat => [Math.atan2(v[1], v[0]) / RAD, Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD]
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a: Vec): Vec => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
const add = (a: Vec, b: Vec, s = 1): Vec => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]

/** Angle between two points, radians. */
export const arcAngle = (a: LonLat, b: LonLat): number => Math.acos(Math.max(-1, Math.min(1, dot(toVec(a), toVec(b)))))

/**
 * A bowed route from a to b, `samples + 1` unit vectors: a quadratic Bézier
 * drawn in longitude/latitude, the way the flow would be sketched on a flat
 * chart. That keeps long hauls (Indonesia → United States) arcing across the
 * ocean in Mercator instead of shooting over the pole, and still reads as a
 * gentle arc on the globe. It takes the short way round the antimeridian.
 * `bend` places the control point that share of the route's length off to the
 * left of travel, so a flow and its return never sit on top of each other.
 */
export const flowCurve = (a: LonLat, b: LonLat, bend = 0.4, samples = 64): Vec[] => {
  const bx = a[0] + ((((b[0] - a[0] + 180) % 360) + 360) % 360) - 180
  const dx = bx - a[0]
  const dy = b[1] - a[1]
  const cx = (a[0] + bx) / 2 - dy * bend
  const cy = Math.max(-85, Math.min(85, (a[1] + b[1]) / 2 + dx * bend))
  const out: Vec[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const u = 1 - t
    out.push(toVec([u * u * a[0] + 2 * u * t * cx + t * t * bx, u * u * a[1] + 2 * u * t * cy + t * t * b[1]]))
  }
  return out
}

/**
 * The ribbon around a curve as one GeoJSON ring: the left edge forward, then the
 * right edge back. That runs clockwise seen from outside the sphere, which is
 * what d3-geo reads as "the small side" — the other way round would paint the
 * whole world except the ribbon. Ends pinch by `taper` so they tuck into nodes.
 */
export const ribbonRing = (curve: Vec[], halfWidthDeg: number, taper = 0.3): Ring => {
  const n = curve.length
  const left: LonLat[] = []
  const right: LonLat[] = []
  for (let i = 0; i < n; i++) {
    const P = curve[i]
    const T = norm(add(curve[Math.min(n - 1, i + 1)], curve[Math.max(0, i - 1)], -1))
    const S = norm(cross(P, T))
    const t = i / (n - 1)
    const w = Math.tan(halfWidthDeg * RAD) * (1 - taper * (1 - Math.sin(Math.PI * t)))
    left.push(toLonLat(norm(add(P, S, w))))
    right.push(toLonLat(norm(add(P, S, -w))))
  }
  const ring = [...left, ...right.reverse()]
  ring.push([ring[0][0], ring[0][1]])
  return ring
}

/** A small circle of `radiusDeg` around c, clockwise like every other ring here. */
export const circleRing = (c: LonLat, radiusDeg: number, steps = 40): Ring => {
  const C = toVec(c)
  let E = cross([0, 0, 1], C)
  if (Math.hypot(E[0], E[1], E[2]) < 1e-9) E = [0, 1, 0]
  E = norm(E)
  const Nn = cross(C, E)
  const r = radiusDeg * RAD
  const ring: Ring = []
  for (let i = 0; i <= steps; i++) {
    const a = (-i / steps) * Math.PI * 2
    const d = add(add([0, 0, 0], E, Math.cos(a)), Nn, Math.sin(a))
    ring.push(toLonLat(norm(add(add([0, 0, 0], C, Math.cos(r)), d, Math.sin(r)))))
  }
  ring[steps] = [ring[0][0], ring[0][1]]
  return ring
}

/** Point a share t of the way along a sampled curve. */
export const pointAt = (curve: Vec[], t: number): Vec => {
  const f = Math.max(0, Math.min(1, t)) * (curve.length - 1)
  const i = Math.min(curve.length - 2, Math.floor(f))
  const u = f - i
  const a = curve[i]
  const b = curve[i + 1]
  return norm([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u])
}

/** Small, fast, seeded. */
export const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// ---- the model ------------------------------------------------------------------

export type ModelNode = {
  id: string
  name: string
  role: Role
  at: LonLat
  in: number
  out: number
  total: number
  radius: number
  ring: Ring
}
export type ModelFlow = {
  s: number
  t: number
  value: number
  /** share of the source's outflow, 0–1 */
  share: number
  curve: Vec[]
  ring: Ring
}
export type Particle = { flow: number; dur: number; phase: number }
export type Model = {
  nodes: ModelNode[]
  flows: ModelFlow[]
  /** flows sorted widest first, so thin ones paint on top */
  order: number[]
  particles: Particle[]
  totals: { [k in Role]: number }
  roleOf: { [k: string]: Role }
  max: number
}

/** Only ships out → producer, only takes in → consumer, both → hub. */
export const inferRole = (inflow: number, outflow: number): Role =>
  outflow > 0 && inflow <= 0 ? "producer" : inflow > 0 && outflow > 0 ? "hub" : "consumer"

export const buildModel = (
  flows: SupplyFlow[],
  nodes: SupplyNode[],
  countries: Country[],
  opts: { width?: number; bend?: number; seed?: number; density?: number } = {},
): Model => {
  const width = opts.width ?? 2
  const bend = opts.bend ?? 0.4
  const density = opts.density ?? 1
  const byId = new Map(countries.map((c) => [c.id, c]))
  const given = new Map(nodes.map((n) => [n.id, n]))
  const index = new Map([] as [string, number][])
  const out: ModelNode[] = []
  const nodeOf = (id: string): number => {
    const hit = index.get(id)
    if (hit !== undefined) return hit
    const g = given.get(id)
    const at = g?.coordinates ?? byId.get(id)?.label
    if (!at || !Number.isFinite(at[0]) || !Number.isFinite(at[1])) return -1
    index.set(id, out.length)
    out.push({ id, name: g?.name ?? byId.get(id)?.name ?? id, role: g?.role ?? "consumer", at, in: 0, out: 0, total: 0, radius: 0, ring: [] })
    return out.length - 1
  }
  // listed nodes come first, in their order, even if no flow touches them
  for (const n of nodes) nodeOf(n.id)

  const raw: { s: number; t: number; value: number }[] = []
  for (const f of flows) {
    const value = Number(f.value)
    if (!(value > 0) || f.source === f.target) continue
    const s = nodeOf(f.source)
    const t = nodeOf(f.target)
    if (s < 0 || t < 0) continue
    out[s].out += value
    out[t].in += value
    raw.push({ s, t, value })
  }
  const max = raw.reduce((m, f) => Math.max(m, f.value), 0)
  let maxTotal = 0
  for (const n of out) {
    n.total = Math.max(n.in, n.out)
    if (!given.get(n.id)?.role) n.role = inferRole(n.in, n.out)
    maxTotal = Math.max(maxTotal, n.total)
  }
  for (const n of out) {
    n.radius = 0.7 + 2.1 * Math.sqrt(maxTotal ? n.total / maxTotal : 0)
    n.ring = circleRing(n.at, n.radius)
  }

  const mflows: ModelFlow[] = raw.map((f) => {
    const curve = flowCurve(out[f.s].at, out[f.t].at, bend)
    const half = Math.max(0.12, (width / 2) * (max ? f.value / max : 0))
    return { ...f, share: out[f.s].out ? f.value / out[f.s].out : 0, curve, ring: ribbonRing(curve, half) }
  })

  const rnd = mulberry32(opts.seed ?? 21)
  const particles: Particle[] = []
  mflows.forEach((f, i) => {
    const count = Math.max(1, Math.min(8, Math.round(((max ? f.value / max : 0) * 5 + 1) * density)))
    for (let k = 0; k < count; k++) particles.push({ flow: i, dur: 3000 + rnd() * 3000, phase: (k + rnd() * 0.8) / count })
  })

  const totals: { [k in Role]: number } = { producer: 0, hub: 0, consumer: 0 }
  const roleOf: { [k: string]: Role } = {}
  for (const n of out) {
    totals[n.role] += n.role === "producer" ? n.out : n.role === "consumer" ? n.in : n.in
    roleOf[n.id] = n.role
  }
  const order = mflows.map((_, i) => i).sort((a, b) => mflows[b].value - mflows[a].value)
  return { nodes: out, flows: mflows, order, particles, totals, roleOf, max }
}

// ---- palettes ----------------------------------------------------------------------

export type GlobeTheme = {
  paper: string
  grain: string
  grainAlpha: number
  ocean: string
  graticule: string
  land: string
  landStroke: string
  producer: string
  hub: string
  consumer: string
  flow: string
  flowAlpha: number
  flowHot: string
  node: string
  nodeStroke: string
  particle: string
  particleStroke: string
  particleMark: string
  text: string
  muted: string
  chip: string
  chipHover: string
  accent: string
  accentText: string
  shade: string
  shine: string
}
export type ParticleShape = "bean" | "leaf" | "dot" | "drop" | "none"
export type PaletteName = "coffee" | "matcha" | "cocoa" | "atlas"
/** Partial<GlobeTheme>, spelled out: runs of <T> generics hang the 21st CLI tokenizer. */
export type GlobeThemePatch = { [K in keyof GlobeTheme]?: GlobeTheme[K] }
export type PaletteInput = PaletteName | GlobeThemePatch | { light: GlobeThemePatch; dark: GlobeThemePatch }

export const PALETTES: { [k in PaletteName]: { particle: ParticleShape; light: GlobeTheme; dark: GlobeTheme } } = {
  coffee: {
    particle: "bean",
    light: {
      paper: "#f0e6d6", grain: "#000000", grainAlpha: 0.07, ocean: "#ede4d4", graticule: "rgba(139,94,60,0.15)",
      land: "#f5ece0", landStroke: "rgba(196,149,106,0.55)", producer: "#8fae7e", hub: "#c4a878", consumer: "#ddc8a0",
      flow: "#8b5e3c", flowAlpha: 0.65, flowHot: "#5c3a1e", node: "#3c1e0e", nodeStroke: "#e8d5b7",
      particle: "#3c1e0e", particleStroke: "#5c3a1e", particleMark: "#c4956a", text: "#3c1e0e", muted: "#8b5e3c",
      chip: "#e8d5b7", chipHover: "#d4c4a8", accent: "#8b5e3c", accentText: "#f5ece0", shade: "#5c3a1e", shine: "#fffaf2",
    },
    dark: {
      paper: "#1b120c", grain: "#ffffff", grainAlpha: 0.05, ocean: "#24170f", graticule: "rgba(196,149,106,0.14)",
      land: "#3b2819", landStroke: "rgba(196,149,106,0.35)", producer: "#5f7d4f", hub: "#9a7843", consumer: "#6b4f35",
      flow: "#d4a373", flowAlpha: 0.6, flowHot: "#f0c999", node: "#f5ece0", nodeStroke: "#5c3a1e",
      particle: "#b07a4f", particleStroke: "#3c1e0e", particleMark: "#3c1e0e", text: "#f0e2cc", muted: "#c4956a",
      chip: "#2c1d13", chipHover: "#3a2719", accent: "#c4956a", accentText: "#1b120c", shade: "#000000", shine: "#ffe9c7",
    },
  },
  matcha: {
    particle: "leaf",
    light: {
      paper: "#ecefe2", grain: "#000000", grainAlpha: 0.06, ocean: "#e3e8d6", graticule: "rgba(95,127,63,0.16)",
      land: "#f6f7ee", landStroke: "rgba(143,168,110,0.55)", producer: "#7da35a", hub: "#c9b46f", consumer: "#d4dfbb",
      flow: "#5a7d3a", flowAlpha: 0.62, flowHot: "#3d5a24", node: "#2a3a1c", nodeStroke: "#e3ead2",
      particle: "#4f7a2c", particleStroke: "#3d5a24", particleMark: "#b9d39a", text: "#26341a", muted: "#5f7f3f",
      chip: "#dfe6cf", chipHover: "#cfd9ba", accent: "#5a7d3a", accentText: "#f6f7ee", shade: "#3d5a24", shine: "#ffffff",
    },
    dark: {
      paper: "#11160d", grain: "#ffffff", grainAlpha: 0.05, ocean: "#172012", graticule: "rgba(160,190,120,0.12)",
      land: "#26331d", landStroke: "rgba(143,168,110,0.35)", producer: "#5f8a3c", hub: "#8e7d45", consumer: "#3e5230",
      flow: "#a8cf7f", flowAlpha: 0.55, flowHot: "#d5f0b2", node: "#eef5e2", nodeStroke: "#3d5a24",
      particle: "#8fc062", particleStroke: "#26341a", particleMark: "#2a3a1c", text: "#e4ecd6", muted: "#9cbf78",
      chip: "#1d2716", chipHover: "#283521", accent: "#8fc062", accentText: "#11160d", shade: "#000000", shine: "#e9ffd0",
    },
  },
  cocoa: {
    particle: "drop",
    light: {
      paper: "#f4e6e1", grain: "#000000", grainAlpha: 0.07, ocean: "#efdfd9", graticule: "rgba(122,59,46,0.14)",
      land: "#fbf3ef", landStroke: "rgba(184,124,108,0.5)", producer: "#c08552", hub: "#d29b92", consumer: "#ead2c8",
      flow: "#7a3b2e", flowAlpha: 0.62, flowHot: "#4a1d15", node: "#3b1410", nodeStroke: "#f1d9cf",
      particle: "#4a1d15", particleStroke: "#2a0e0a", particleMark: "#c98b72", text: "#3b1410", muted: "#9a5544",
      chip: "#ecd5cc", chipHover: "#e2c3b7", accent: "#7a3b2e", accentText: "#fbf3ef", shade: "#4a1d15", shine: "#ffffff",
    },
    dark: {
      paper: "#1a0d0b", grain: "#ffffff", grainAlpha: 0.05, ocean: "#241310", graticule: "rgba(201,139,114,0.13)",
      land: "#3a1f1a", landStroke: "rgba(201,139,114,0.3)", producer: "#9a6a3f", hub: "#9c5f58", consumer: "#5e3a33",
      flow: "#e0a38a", flowAlpha: 0.58, flowHot: "#ffd2bf", node: "#fbe9e2", nodeStroke: "#4a1d15",
      particle: "#c98b72", particleStroke: "#2a0e0a", particleMark: "#3b1410", text: "#f3dcd3", muted: "#d08f78",
      chip: "#2a1612", chipHover: "#3a201a", accent: "#e0a38a", accentText: "#1a0d0b", shade: "#000000", shine: "#ffd9c9",
    },
  },
  atlas: {
    particle: "dot",
    light: {
      paper: "#e8edf3", grain: "#000000", grainAlpha: 0.05, ocean: "#dde5ef", graticule: "rgba(43,90,168,0.14)",
      land: "#f7f9fc", landStroke: "rgba(120,150,200,0.5)", producer: "#7fb0cf", hub: "#9aa6dc", consumer: "#cdd8ea",
      flow: "#2b5aa8", flowAlpha: 0.55, flowHot: "#10264d", node: "#10264d", nodeStroke: "#dde5ef",
      particle: "#10264d", particleStroke: "#10264d", particleMark: "#9fb8e0", text: "#10264d", muted: "#4a6a9e",
      chip: "#d7e0ec", chipHover: "#c6d3e5", accent: "#2b5aa8", accentText: "#f7f9fc", shade: "#10264d", shine: "#ffffff",
    },
    dark: {
      paper: "#0b1220", grain: "#ffffff", grainAlpha: 0.05, ocean: "#0f1a2e", graticule: "rgba(120,160,230,0.14)",
      land: "#1a2740", landStroke: "rgba(120,160,230,0.3)", producer: "#2f6f8f", hub: "#4f5fa0", consumer: "#24365a",
      flow: "#7fb0ff", flowAlpha: 0.55, flowHot: "#cfe1ff", node: "#e8f0ff", nodeStroke: "#1a2740",
      particle: "#9cc3ff", particleStroke: "#0b1220", particleMark: "#0b1220", text: "#dbe6f7", muted: "#8aa8d6",
      chip: "#131f35", chipHover: "#1c2b47", accent: "#7fb0ff", accentText: "#0b1220", shade: "#000000", shine: "#cfe1ff",
    },
  },
}

/** A preset name, a partial theme over coffee, or `{ light, dark }` partials. */
export const resolveTheme = (p: PaletteInput | undefined, dark: boolean): GlobeTheme => {
  const side = dark ? "dark" : "light"
  if (typeof p === "string") return (PALETTES[p] ?? PALETTES.coffee)[side]
  const base = PALETTES.coffee[side]
  if (!p) return base
  if ("light" in p && "dark" in p && typeof p.light === "object") return { ...base, ...(p as { light: GlobeThemePatch; dark: GlobeThemePatch })[side] }
  return { ...base, ...(p as GlobeThemePatch) }
}

export const particleOf = (p: PaletteInput | undefined, shape: ParticleShape | undefined): ParticleShape =>
  shape ?? (typeof p === "string" && PALETTES[p] ? PALETTES[p].particle : "bean")

// #endregion

// ---- the default story: the coffee trade ------------------------------------------------

const COFFEE_NODES: SupplyNode[] = [
  { id: "BR", name: "Brazil" }, { id: "VN", name: "Vietnam" }, { id: "CO", name: "Colombia" },
  { id: "ET", name: "Ethiopia" }, { id: "ID", name: "Indonesia" }, { id: "HN", name: "Honduras" },
  { id: "DE", name: "Germany" }, { id: "BE", name: "Belgium" }, { id: "IT", name: "Italy" },
  { id: "US", name: "United States" }, { id: "FR", name: "France" }, { id: "PL", name: "Poland" },
  { id: "SE", name: "Sweden" }, { id: "RU", name: "Russia" }, { id: "GB", name: "United Kingdom" },
  { id: "NL", name: "Netherlands" }, { id: "GR", name: "Greece" }, { id: "AT", name: "Austria" },
  { id: "CA", name: "Canada" }, { id: "JP", name: "Japan" },
]

const COFFEE_FLOWS: SupplyFlow[] = [
  // producers → processing hubs
  { source: "BR", target: "DE", value: 350 }, { source: "BR", target: "US", value: 450 },
  { source: "BR", target: "IT", value: 200 }, { source: "VN", target: "DE", value: 200 },
  { source: "VN", target: "BE", value: 150 }, { source: "CO", target: "US", value: 250 },
  { source: "CO", target: "DE", value: 80 }, { source: "ET", target: "DE", value: 60 },
  { source: "ET", target: "BE", value: 40 }, { source: "ID", target: "US", value: 80 },
  { source: "HN", target: "DE", value: 60 }, { source: "HN", target: "BE", value: 40 },
  // hubs → consumer markets
  { source: "DE", target: "FR", value: 150 }, { source: "DE", target: "PL", value: 100 },
  { source: "DE", target: "SE", value: 80 }, { source: "DE", target: "RU", value: 120 },
  { source: "BE", target: "GB", value: 100 }, { source: "BE", target: "NL", value: 80 },
  { source: "IT", target: "GR", value: 50 }, { source: "IT", target: "AT", value: 40 },
  { source: "US", target: "CA", value: 120 }, { source: "US", target: "JP", value: 80 },
]

let worldCache: { countries: Country[]; features: GeoJSON.Feature<GeoJSON.MultiPolygon>[] } | null = null
const world = () => {
  if (!worldCache) {
    const countries = decodeWorld(WORLD)
    worldCache = {
      countries,
      features: countries.map((c) => ({
        type: "Feature",
        properties: null,
        geometry: { type: "MultiPolygon", coordinates: c.rings.map((r) => [r]) },
      })),
    }
  }
  return worldCache
}

const ringFeature = (ring: Ring): GeoJSON.Polygon => ({ type: "Polygon", coordinates: [ring] })
const SPHERE = { type: "Sphere" } as const
const GRATICULE = geoGraticule10()
const ROLES: Role[] = ["producer", "hub", "consumer"]

type Projection = "globe" | "map"

export type SupplyFlowGlobeProps = {
  /** `{ source, target, value }[]`. Ids are ISO-3166 alpha-2 codes, or any id you place with `nodes[].coordinates`. Defaults to the coffee trade. */
  flows?: SupplyFlow[]
  /** Names, roles and positions. Roles are inferred from the flows when left out. */
  nodes?: SupplyNode[]
  title?: React.ReactNode
  subtitle?: React.ReactNode
  /** Appended to every value, verbatim — `"k tonnes"` reads "350k tonnes". */
  unit?: string
  formatValue?: (value: number) => string
  roleLabels?: { [k in Role]?: string }
  palette?: PaletteInput
  /** `"auto"` follows the host's theme. */
  mode?: "auto" | "light" | "dark"
  particle?: ParticleShape
  /** Particles per flow, relative. 0 hides them. */
  particleDensity?: number
  /** Particle speed, relative. */
  particleSpeed?: number
  projection?: Projection
  defaultProjection?: Projection
  onProjectionChange?: (projection: Projection) => void
  /** Degrees per second while idle; `false` or 0 to hold still. */
  autoRotate?: number | boolean
  /** `[rotationX, rotationY]` in degrees — the globe's resting pose. */
  rotation?: [number, number]
  /** Width of the biggest flow, degrees of arc. */
  flowWidth?: number
  /** How far flows bow off the straight route, 0–1. */
  curvature?: number
  /** `"modifier"` needs ⌘/Ctrl so the page still scrolls; `"always"` zooms on any wheel. */
  wheelZoom?: "modifier" | "always" | "off"
  showLegend?: boolean
  showToggle?: boolean
  showZoom?: boolean
  showTitle?: boolean
  /** A definite CSS length. Percentages need a sized parent. */
  height?: number | string
  onNodeClick?: (node: { id: string; name: string; role: Role; in: number; out: number }) => void
  onFlowClick?: (flow: { source: string; target: string; value: number }) => void
  className?: string
}

const DEFAULT_LABELS: { [k in Role]: string } = { producer: "Producers", hub: "Processing hubs", consumer: "Consumer markets" }

export default function SupplyFlowGlobe({
  flows,
  nodes,
  title = "Global Coffee Supply Chain",
  subtitle = "(Thousands of tonnes)",
  unit = "k tonnes",
  formatValue,
  roleLabels,
  palette = "coffee",
  mode = "auto",
  particle,
  particleDensity = 1,
  particleSpeed = 1,
  projection,
  defaultProjection = "globe",
  onProjectionChange,
  autoRotate = 3,
  rotation = [-15, -20],
  flowWidth = 3,
  curvature = 0.4,
  wheelZoom = "modifier",
  showLegend = true,
  showToggle = true,
  showZoom = true,
  showTitle = true,
  height = "100svh",
  onNodeClick,
  onFlowClick,
  className = "",
}: SupplyFlowGlobeProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const tipRef = React.useRef(null as HTMLDivElement | null)
  const liveRef = React.useRef(null as HTMLSpanElement | null)
  const hintRef = React.useRef(null as HTMLDivElement | null)

  const [innerProjection, setInnerProjection] = React.useState(defaultProjection as Projection)
  const view = projection ?? innerProjection
  const [dark, setDark] = React.useState(mode === "dark")
  const [isolate, setIsolate] = React.useState(null as Role | null)
  const [previewRole, setPreviewRole] = React.useState(null as Role | null)

  const usingDefault = !flows
  const model = React.useMemo(
    () =>
      buildModel(flows ?? COFFEE_FLOWS, nodes ?? (usingDefault ? COFFEE_NODES : []), world().countries, {
        width: flowWidth,
        bend: curvature,
        density: particleDensity,
      }),
    [flows, nodes, usingDefault, flowWidth, curvature, particleDensity],
  )
  const theme = React.useMemo(() => resolveTheme(palette, dark), [palette, dark])
  const shape = particleOf(palette, particle)
  const labels = { ...DEFAULT_LABELS, ...roleLabels }
  const nf = React.useMemo(() => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }), [])
  const fmt = React.useCallback((v: number) => (formatValue ? formatValue(v) : nf.format(v) + unit), [formatValue, nf, unit])

  const setView = React.useCallback(
    (next: Projection) => {
      if (projection === undefined) setInnerProjection(next)
      onProjectionChange?.(next)
    },
    [projection, onProjectionChange],
  )

  // Everything the engine reads lives here, so it never restarts on a prop change.
  const latest = {
    model, theme, shape, view, fmt, labels, isolate: previewRole ?? isolate, particleSpeed, autoRotate, rotation, wheelZoom,
    mode, setView, setDark, onNodeClick, onFlowClick,
  }
  const cfg = React.useRef(latest)
  cfg.current = latest
  const api = React.useRef(null as { zoom: (f: number) => void; home: () => void; kick: () => void; retheme: () => void } | null)

  React.useEffect(() => api.current?.kick(), [model, theme, shape, view, isolate, previewRole])
  React.useEffect(() => api.current?.retheme(), [mode])

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const tip = tipRef.current
    const live = liveRef.current
    const hint = hintRef.current
    if (!root || !canvas || !tip || !live || !hint) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const { features, countries } = world()

    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const darkMq = window.matchMedia("(prefers-color-scheme: dark)")
    let reduced = reduceMq.matches

    // ---- view state -------------------------------------------------------------
    let W = 0
    let H = 0
    let dpr = 1
    let shown: Projection = cfg.current.view
    const rest = () => cfg.current.rotation
    let lam = rest()[0]
    let phi = rest()[1]
    let lamGoal = lam
    let phiGoal = phi
    let rotAnim = false
    let k = 1
    let kGoal = 1
    let ty = 0
    let tyGoal = 0
    let spinning = true
    let velL = 0
    let velP = 0
    // projection swap: 0 → 1, swapping halfway while faded out
    let swap = 1
    let swapTo: Projection = shown
    // interaction
    type Hit = { kind: "node" | "flow" | "country"; i: number } | null
    let hover: Hit = null
    let focus: Hit = null
    let inside = false
    let raf = 0
    let last = 0
    let visible = true
    let model = cfg.current.model
    let flowA = new Float32Array(model.flows.length).fill(1)
    let nodeA = new Float32Array(model.nodes.length).fill(1)
    let countryHot = new Float32Array(features.length)
    const countryIdx = new Map(countries.map((c, i) => [c.id, i]))

    const ortho = geoOrthographic().clipAngle(90).precision(0.35)
    const merc = geoMercator().precision(0.35)
    const MERC = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))

    const reserve = () => (root.querySelector("[data-sfg-title]") as HTMLElement | null)?.offsetHeight ?? 0
    let titleH = 0
    let labelFont = "600 11px sans-serif"
    const globeR = () => Math.max(40, Math.min(W - 24, H - titleH - 56) / 2) * 0.9
    // the world always spans the width (sideways panning wraps, so no paper shows at
    // the edges); on tall screens it may run wider, so the map still fills the height
    const mapScale = () => Math.max(W / (2 * Math.PI), ((H - titleH) / (MERC(80) - MERC(-58))) * 0.6)
    const minK = () => (shown === "globe" ? 0.55 : 1)
    const maxK = 7

    const clampTy = (t: number, s: number) => {
      const cyv = (H - titleH) / 2
      const top = s * (MERC(82) - MERC(18))
      const bot = s * (MERC(18) - MERC(-60))
      const hi = top - cyv
      const lo = H - cyv - bot
      return lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, t))
    }

    let proj: GeoProjection = ortho
    let R = 100
    let swapScale = 1
    const setup = () => {
      const cy = (H - titleH) / 2 + 6
      if (shown === "globe") {
        R = globeR() * k * swapScale
        ortho.scale(R).translate([W / 2, cy]).rotate([lam, phi, 0])
        proj = ortho
      } else {
        const s = mapScale() * k * swapScale
        R = s
        merc.scale(s).translate([W / 2, cy + ty + s * MERC(18)]).rotate([lam, 0, 0]).clipExtent([[0, 0], [W, H]])
        proj = merc
      }
    }

    // ---- colour helpers -----------------------------------------------------------
    let probe: CanvasRenderingContext2D | null = null
    const parsed = new Map([] as [string, [number, number, number, number]][])
    const rgbOf = (color: string): [number, number, number, number] => {
      const hit = parsed.get(color)
      if (hit) return hit
      if (!probe) {
        const c = document.createElement("canvas")
        c.width = c.height = 1
        probe = c.getContext("2d", { willReadFrequently: true })
      }
      if (!probe) return [0, 0, 0, 0]
      probe.clearRect(0, 0, 1, 1)
      probe.fillStyle = "rgba(0,0,0,0)"
      probe.fillStyle = color
      probe.fillRect(0, 0, 1, 1)
      const d = probe.getImageData(0, 0, 1, 1).data
      const out: [number, number, number, number] = [d[0], d[1], d[2], d[3]]
      if (parsed.size > 64) parsed.clear()
      parsed.set(color, out)
      return out
    }
    const rgba = (color: string, a: number) => {
      const [r, g, b] = rgbOf(color)
      return "rgba(" + r + "," + g + "," + b + "," + a + ")"
    }

    // ---- theme: follow the host ----------------------------------------------------
    const hostDark = () => {
      const m = cfg.current.mode
      if (m !== "auto") return m === "dark"
      const el = document.documentElement
      if (el.classList.contains("dark") || el.dataset.theme === "dark") return true
      if (el.classList.contains("light") || el.dataset.theme === "light") return false
      const probeEl = document.createElement("span")
      probeEl.style.color = "var(--color-background, #ffffff)"
      probeEl.style.display = "none"
      root.appendChild(probeEl)
      const bgColor = getComputedStyle(probeEl).color
      probeEl.remove()
      parsed.delete(bgColor)
      const [r, g, b, a] = rgbOf(bgColor)
      if (a > 8) return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110
      return darkMq.matches
    }
    let grainKey = ""
    const retheme = () => {
      cfg.current.setDark(hostDark())
    }
    const paintGrain = () => {
      const t = cfg.current.theme
      const key = t.grain + t.grainAlpha + t.shade
      if (key === grainKey) return
      grainKey = key
      const size = 160
      const c = document.createElement("canvas")
      c.width = c.height = size
      const g = c.getContext("2d")
      if (!g) return
      const img = g.createImageData(size, size)
      const [r, gg, b] = rgbOf(t.grain)
      const rnd = mulberry32(7)
      for (let i = 0; i < size * size; i++) {
        if (rnd() > 0.4) continue
        img.data[i * 4] = r
        img.data[i * 4 + 1] = gg
        img.data[i * 4 + 2] = b
        img.data[i * 4 + 3] = Math.round(rnd() * t.grainAlpha * 255)
      }
      g.putImageData(img, 0, 0)
      root.style.backgroundImage =
        "radial-gradient(ellipse at 50% 45%, transparent 55%, " + rgba(t.shade, 0.1) + "), url(" + c.toDataURL() + ")"
    }

    // ---- sizing -----------------------------------------------------------------------
    const resize = () => {
      const r = root.getBoundingClientRect()
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = Math.max(1, Math.round(r.width))
      H = Math.max(1, Math.round(r.height))
      titleH = reserve()
      labelFont = "600 11px " + (getComputedStyle(root).fontFamily || "sans-serif")
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = W + "px"
      canvas.style.height = H + "px"
      ty = tyGoal = clampTy(tyGoal, mapScale() * kGoal)
      kick()
    }

    // ---- drawing ------------------------------------------------------------------------
    const roleFill = (t: GlobeTheme, role: Role) => (role === "producer" ? t.producer : role === "hub" ? t.hub : t.consumer)
    const center = (): LonLat => [-lam, -phi]

    const drawParticle = (x: number, y: number, ang: number, s: number, a: number, t: GlobeTheme, kind: ParticleShape) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(ang)
      ctx.scale(s, s)
      ctx.globalAlpha *= a
      ctx.shadowColor = rgba(t.shade, 0.35)
      ctx.shadowBlur = 2 * dpr
      ctx.shadowOffsetY = 0.8 * dpr
      ctx.fillStyle = t.particle
      ctx.strokeStyle = t.particleStroke
      ctx.lineWidth = 0.5
      ctx.beginPath()
      if (kind === "bean") {
        ctx.ellipse(0, 0, 4.6, 3.3, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowColor = "transparent"
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-3.6, 0.5)
        ctx.bezierCurveTo(-1.4, -1.5, 1.4, 1.5, 3.6, -0.5)
        ctx.strokeStyle = t.particleMark
        ctx.lineWidth = 0.9
        ctx.lineCap = "round"
        ctx.stroke()
      } else if (kind === "leaf") {
        ctx.moveTo(-5, 0)
        ctx.quadraticCurveTo(-0.5, -4.4, 5, 0)
        ctx.quadraticCurveTo(-0.5, 4.4, -5, 0)
        ctx.fill()
        ctx.shadowColor = "transparent"
        ctx.beginPath()
        ctx.moveTo(-4.4, 0)
        ctx.lineTo(4, 0)
        ctx.strokeStyle = t.particleMark
        ctx.lineWidth = 0.7
        ctx.stroke()
      } else if (kind === "drop") {
        ctx.moveTo(5, 0)
        ctx.bezierCurveTo(1.5, -1.4, -1, -3.2, -2.6, -2.4)
        ctx.bezierCurveTo(-4.4, -1.6, -4.4, 1.6, -2.6, 2.4)
        ctx.bezierCurveTo(-1, 3.2, 1.5, 1.4, 5, 0)
        ctx.fill()
        ctx.shadowColor = "transparent"
        ctx.beginPath()
        ctx.arc(-2, -0.9, 0.8, 0, Math.PI * 2)
        ctx.fillStyle = t.particleMark
        ctx.fill()
      } else {
        ctx.arc(0, 0, 2.3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    const related = (hit: Hit, fi: number) => {
      if (!hit) return true
      const f = model.flows[fi]
      if (hit.kind === "flow") return hit.i === fi
      if (hit.kind === "node") return f.s === hit.i || f.t === hit.i
      return false
    }
    const highlight = (): Hit => (hover && hover.kind !== "country" ? hover : focus)

    const draw = (now: number) => {
      const t = cfg.current.theme
      const isolate = cfg.current.isolate
      setup()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const path = geoPath(proj, ctx)
      const globe = shown === "globe"
      const fade = swap < 0.5 ? 1 - swap * 2 : swap * 2 - 1
      const alpha = reduced ? 1 : fade * fade * (3 - 2 * fade)
      const [cx, cy] = proj.translate()

      ctx.globalAlpha = alpha
      if (globe) {
        // a soft contact shadow — the globe sits on the paper, it doesn't float in it
        ctx.save()
        ctx.translate(cx, cy + R * 1.02)
        ctx.scale(1, 0.13)
        const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.95)
        sh.addColorStop(0, rgba(t.shade, 0.28))
        sh.addColorStop(1, rgba(t.shade, 0))
        ctx.fillStyle = sh
        ctx.fillRect(-R, -R, R * 2, R * 2)
        ctx.restore()
        ctx.beginPath()
        path(SPHERE)
        ctx.fillStyle = t.ocean
        ctx.fill()
      }

      ctx.beginPath()
      path(GRATICULE)
      ctx.strokeStyle = t.graticule
      ctx.lineWidth = 0.5
      ctx.stroke()

      // countries: a fill each, one shared stroke
      const hl = highlight()
      for (let i = 0; i < features.length; i++) {
        const role = model.roleOf[countries[i].id]
        ctx.beginPath()
        path(features[i])
        if (role && isolate && role !== isolate) {
          // isolating another role: this one keeps only a ghost of its tint
          ctx.fillStyle = t.land
          ctx.fill()
          ctx.globalAlpha = alpha * 0.35
        }
        ctx.fillStyle = role ? roleFill(t, role) : t.land
        ctx.fill()
        ctx.globalAlpha = alpha
        if (countryHot[i] > 0.01) {
          ctx.globalAlpha = alpha * countryHot[i] * 0.35
          ctx.fillStyle = t.shine
          ctx.fill()
          ctx.globalAlpha = alpha
        }
      }
      ctx.globalAlpha = alpha
      ctx.beginPath()
      for (let i = 0; i < features.length; i++) path(features[i])
      ctx.strokeStyle = t.landStroke
      ctx.lineWidth = 0.5
      ctx.stroke()

      // flows, widest first
      for (const fi of model.order) {
        const f = model.flows[fi]
        ctx.beginPath()
        path(ringFeature(f.ring))
        const hot = hl && related(hl, fi)
        ctx.globalAlpha = alpha * Math.min(1, t.flowAlpha * flowA[fi] + (hot ? 0.3 : 0))
        ctx.fillStyle = hot ? t.flowHot : t.flow
        ctx.fill()
      }

      // nodes, biggest first
      const nOrder = model.nodes.map((_, i) => i).sort((a, b) => model.nodes[b].radius - model.nodes[a].radius)
      ctx.lineWidth = 1.5
      for (const ni of nOrder) {
        ctx.beginPath()
        path(ringFeature(model.nodes[ni].ring))
        ctx.globalAlpha = alpha * (0.25 + 0.7 * nodeA[ni])
        ctx.fillStyle = t.node
        ctx.fill()
        ctx.globalAlpha = alpha * (0.3 + 0.7 * nodeA[ni])
        ctx.strokeStyle = t.nodeStroke
        ctx.stroke()
      }

      // particles
      const kind = cfg.current.shape
      if (kind !== "none" && model.particles.length) {
        ctx.globalAlpha = alpha
        const c = center()
        const speed = Math.max(0.05, cfg.current.particleSpeed)
        const size = Math.max(0.75, Math.min(1.6, Math.sqrt(R / 260)))
        for (const p of model.particles) {
          const f = model.flows[p.flow]
          const u = reduced ? p.phase : ((now * speed) / p.dur + p.phase) % 1
          const ll = toLonLat(pointAt(f.curve, u))
          if (globe && geoDistance(ll, c) > Math.PI / 2 - 0.03) continue
          const a = proj(ll)
          const b = proj(toLonLat(pointAt(f.curve, Math.min(1, u + 0.01))))
          const b0 = u + 0.01 > 1 ? proj(toLonLat(pointAt(f.curve, u - 0.01))) : null
          if (!a || !b) continue
          if (!globe && (a[0] < -10 || a[0] > W + 10 || a[1] < -10 || a[1] > H + 10)) continue
          if (!globe && Math.abs(b[0] - a[0]) > W / 3) continue
          const ang = b0 ? Math.atan2(a[1] - b0[1], a[0] - b0[0]) : Math.atan2(b[1] - a[1], b[0] - a[0])
          const ends = Math.min(1, u / 0.06, (1 - u) / 0.06)
          drawParticle(a[0], a[1], ang, size, ends * (0.35 + 0.65 * flowA[p.flow]), t, kind)
        }
      }

      // globe: shading, rim
      ctx.globalAlpha = alpha
      if (globe) {
        const shine = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.42, 0, cx - R * 0.38, cy - R * 0.42, R * 1.1)
        shine.addColorStop(0, rgba(t.shine, 0.22))
        shine.addColorStop(0.5, rgba(t.shine, 0))
        ctx.beginPath()
        path(SPHERE)
        ctx.fillStyle = shine
        ctx.fill()
        const rim = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R)
        rim.addColorStop(0, rgba(t.shade, 0))
        rim.addColorStop(1, rgba(t.shade, 0.16))
        ctx.fillStyle = rim
        ctx.fill()
        ctx.strokeStyle = rgba(t.muted, 0.45)
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // a name over the node being looked at — every node once zoomed in close
      const lab = hl?.kind === "node" ? hl.i : -1
      const close = k > 1.7
      if (lab >= 0 || close) {
        ctx.font = labelFont
        ctx.textAlign = "center"
        ctx.textBaseline = "bottom"
        ctx.lineJoin = "round"
        const c = center()
        model.nodes.forEach((n, i) => {
          if (i !== lab && !close) return
          if (globe && geoDistance(n.at, c) > Math.PI / 2 - 0.05) return
          const p = proj(n.at)
          if (!p) return
          const y = p[1] - (n.radius * RAD * R) - 4
          ctx.globalAlpha = alpha * (i === lab ? 1 : 0.8)
          ctx.strokeStyle = t.paper
          ctx.lineWidth = 3.5
          ctx.strokeText(n.name, p[0], y)
          ctx.fillStyle = t.text
          ctx.fillText(n.name, p[0], y)
        })
      }
      ctx.globalAlpha = 1
    }

    // ---- the loop -----------------------------------------------------------------------
    const ease = (dt: number, rate: number) => (reduced ? 1 : 1 - Math.exp(-dt * rate))
    const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180

    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      if (cfg.current.model !== model) {
        model = cfg.current.model
        flowA = new Float32Array(model.flows.length).fill(1)
        nodeA = new Float32Array(model.nodes.length).fill(1)
        hover = null
        focus = null
      }
      let moving = false

      // swap projections through a fade
      if (cfg.current.view !== swapTo) {
        swapTo = cfg.current.view
        swap = reduced ? 1 : swap >= 1 ? 0 : 1 - swap
        if (reduced) applyProjection(swapTo)
      }
      if (swap < 1) {
        const before = swap
        swap = Math.min(1, swap + dt / 1.1)
        if (before < 0.5 && swap >= 0.5) applyProjection(swapTo)
        swapScale = swap < 0.5 ? 1 - 0.08 * Math.sin(swap * Math.PI) : 0.9 + 0.1 * (1 - Math.pow(1 - (swap - 0.5) * 2, 3))
        moving = true
      } else swapScale = 1

      const rate = cfg.current.autoRotate === true ? 3 : Number(cfg.current.autoRotate) || 0
      if (spinning && rate && !reduced && !inside && !dragging && !rotAnim) {
        lam = lamGoal = lam + rate * dt
        moving = true
      }
      if (!dragging && !rotAnim && (Math.abs(velL) > 0.5 || Math.abs(velP) > 0.5)) {
        lam += velL * dt
        if (shown === "globe") phi = Math.max(-85, Math.min(85, phi + velP * dt))
        else ty = tyGoal = clampTy(ty + velP * dt, mapScale() * k)
        lamGoal = lam
        phiGoal = phi
        const d = Math.exp(-dt * 3.2)
        velL *= d
        velP *= d
        moving = true
      }
      if (rotAnim) {
        const e = ease(dt, 5)
        const dl = wrap(lamGoal - lam)
        lam += dl * e
        phi += (phiGoal - phi) * e
        if (Math.abs(dl) < 0.05 && Math.abs(phiGoal - phi) < 0.05) {
          lam = lamGoal
          phi = phiGoal
          rotAnim = false
        }
        moving = true
      }
      if (Math.abs(kGoal - k) > 0.0005 || Math.abs(tyGoal - ty) > 0.2) {
        const e = ease(dt, 7)
        k += (kGoal - k) * e
        ty += (tyGoal - ty) * e
        moving = true
      } else {
        k = kGoal
        ty = tyGoal
      }

      // hover and focus fade the rest back
      const hl = highlight()
      const iso = cfg.current.isolate
      const e = ease(dt, 9)
      for (let i = 0; i < flowA.length; i++) {
        const f = model.flows[i]
        const byRole = !iso || model.nodes[f.s].role === iso || model.nodes[f.t].role === iso
        const goal = (hl ? (related(hl, i) ? 1 : 0.22) : 1) * (byRole ? 1 : 0.18)
        if (Math.abs(goal - flowA[i]) > 0.002) moving = true
        flowA[i] += (goal - flowA[i]) * e
      }
      for (let i = 0; i < nodeA.length; i++) {
        let goal = 1
        if (hl?.kind === "node") goal = hl.i === i || model.flows.some((f) => (f.s === hl.i && f.t === i) || (f.t === hl.i && f.s === i)) ? 1 : 0.3
        else if (hl?.kind === "flow") goal = model.flows[hl.i].s === i || model.flows[hl.i].t === i ? 1 : 0.3
        if (iso && model.nodes[i].role !== iso) goal *= 0.35
        if (Math.abs(goal - nodeA[i]) > 0.002) moving = true
        nodeA[i] += (goal - nodeA[i]) * e
      }
      for (let i = 0; i < countryHot.length; i++) {
        const goal = hover?.kind === "country" && hover.i === i ? 1 : 0
        if (Math.abs(goal - countryHot[i]) > 0.002) moving = true
        countryHot[i] += (goal - countryHot[i]) * e
      }

      draw(now)
      if (hover && inside) placeTip()
      const particlesMove = cfg.current.shape !== "none" && model.particles.length > 0 && !reduced
      if (visible && (moving || particlesMove)) raf = requestAnimationFrame(frame)
      else last = 0
    }
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame)
    }

    const applyProjection = (p: Projection) => {
      shown = p
      velL = velP = 0
      rotAnim = false
      if (p === "map") {
        phi = phiGoal = 0
        k = kGoal = 1
        ty = tyGoal = 0
      } else {
        phi = phiGoal = rest()[1]
        k = kGoal = 1
      }
    }

    // ---- picking ------------------------------------------------------------------------
    let pickPath: Path2D | null = null
    const pick = (x: number, y: number): Hit => {
      setup()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const globe = shown === "globe"
      const c = center()
      const [cx, cy] = proj.translate()
      if (globe && Math.hypot(x - cx, y - cy) > R) return null
      const px = x * dpr
      const py = y * dpr
      const nOrder = model.nodes.map((_, i) => i).sort((a, b) => model.nodes[a].radius - model.nodes[b].radius)
      for (const i of nOrder) {
        const n = model.nodes[i]
        if (globe && geoDistance(n.at, c) > Math.PI / 2) continue
        const p = proj(n.at)
        // a node is at least a comfortable 9px target, however far out you zoom
        if (p && Math.hypot(p[0] - x, p[1] - y) <= Math.max(9, n.radius * RAD * R + 2)) return { kind: "node", i }
      }
      ctx.lineWidth = 6
      for (let o = model.order.length - 1; o >= 0; o--) {
        const i = model.order[o]
        pickPath = new Path2D()
        // d3 only calls moveTo/lineTo/closePath/arc, all of which Path2D has
        geoPath(proj, pickPath as unknown as GeoContext)(ringFeature(model.flows[i].ring))
        if (ctx.isPointInPath(pickPath, px, py) || ctx.isPointInStroke(pickPath, px, py)) return { kind: "flow", i }
      }
      const ll = proj.invert?.([x, y])
      if (!ll || !Number.isFinite(ll[0])) return null
      for (let i = features.length - 1; i >= 0; i--) if (geoContains(features[i], ll)) return { kind: "country", i }
      return null
    }

    const roleName = (r: Role) => cfg.current.labels[r].replace(/s$/, "")
    const describe = (hit: Hit): [string, string] | null => {
      if (!hit) return null
      const fmt = cfg.current.fmt
      if (hit.kind === "node") {
        const n = model.nodes[hit.i]
        const body =
          n.role === "producer"
            ? fmt(n.out) + " shipped"
            : n.role === "consumer"
              ? fmt(n.in) + " received"
              : fmt(n.in) + " in · " + fmt(n.out) + " out"
        return [n.name + " · " + roleName(n.role), body]
      }
      if (hit.kind === "flow") {
        const f = model.flows[hit.i]
        const s = model.nodes[f.s]
        return [s.name + " → " + model.nodes[f.t].name, fmt(f.value) + " · " + Math.round(f.share * 100) + "% of " + s.name + "'s outflow"]
      }
      const ctry = countries[hit.i]
      const role = model.roleOf[ctry.id]
      return [ctry.name, role ? roleName(role) : ""]
    }

    let tipX = 0
    let tipY = 0
    const setTip = (hit: Hit) => {
      const d = describe(hit)
      if (!d) {
        tip.style.opacity = "0"
        return
      }
      ;(tip.firstChild as HTMLElement).textContent = d[0]
      ;(tip.lastChild as HTMLElement).textContent = d[1]
      ;(tip.lastChild as HTMLElement).style.display = d[1] ? "" : "none"
      tip.style.opacity = "1"
      placeTip()
    }
    const placeTip = () => {
      const w = tip.offsetWidth
      const h = tip.offsetHeight
      let x = tipX + 14
      let y = tipY - h - 12
      if (x + w > W - 8) x = tipX - w - 14
      if (y < 8) y = tipY + 18
      tip.style.transform = "translate(" + Math.round(Math.max(8, x)) + "px," + Math.round(Math.min(H - h - 8, y)) + "px)"
    }

    const say = (msg: string) => {
      live.textContent = msg
    }

    // ---- focus: swing a node to the front -------------------------------------------------
    const lookAt = (at: LonLat) => {
      lamGoal = -at[0]
      if (shown === "globe") phiGoal = Math.max(-60, Math.min(60, -at[1]))
      else tyGoal = clampTy(mapScale() * kGoal * (MERC(at[1]) - MERC(18)), mapScale() * kGoal)
      lamGoal = lam + wrap(lamGoal - lam)
      rotAnim = true
      velL = velP = 0
      spinning = false
    }
    const turn = (dl: number, dp: number) => {
      lamGoal = (rotAnim ? lamGoal : lam) + dl
      if (shown === "globe") phiGoal = Math.max(-75, Math.min(75, (rotAnim ? phiGoal : phi) + dp))
      else tyGoal = clampTy(tyGoal - dp * 4, mapScale() * kGoal)
      rotAnim = true
      velL = velP = 0
      spinning = false
      kick()
    }
    const focusNode = (i: number, announce = true) => {
      focus = { kind: "node", i }
      const n = model.nodes[i]
      lookAt(n.at)
      if (announce) {
        const d = describe(focus)
        if (d) say(d[0] + ". " + d[1] + ".")
      }
      kick()
    }

    const zoomBy = (f: number) => {
      const before = kGoal
      kGoal = Math.max(minK(), Math.min(maxK, kGoal * f))
      if (shown === "map") tyGoal = clampTy(tyGoal * (kGoal / before), mapScale() * kGoal)
      spinning = false
      kick()
    }
    const home = () => {
      focus = null
      hover = null
      tip.style.opacity = "0"
      if (shown === "globe") {
        lamGoal = lam + wrap(rest()[0] - lam)
        phiGoal = rest()[1]
      } else {
        lamGoal = lam + wrap(rest()[0] - lam)
        tyGoal = 0
      }
      kGoal = 1
      rotAnim = true
      spinning = true
      velL = velP = 0
      say("View reset")
      kick()
    }
    api.current = { zoom: zoomBy, home, kick, retheme }

    // ---- pointer ------------------------------------------------------------------------
    const pointers = new Map([] as [number, { x: number; y: number }][])
    let dragging = false
    let downAt: { x: number; y: number; t: number } | null = null
    let moved = 0
    let pinch = 0
    let lastMove = 0

    const local = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return
      const p = local(e)
      pointers.set(e.pointerId, p)
      canvas.setPointerCapture(e.pointerId)
      spinning = false
      rotAnim = false
      velL = velP = 0
      if (pointers.size === 1) {
        downAt = { ...p, t: performance.now() }
        moved = 0
        dragging = true
        canvas.style.cursor = "grabbing"
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        pinch = Math.hypot(a.x - b.x, a.y - b.y)
      }
      kick()
    }
    const onMove = (e: PointerEvent) => {
      const p = local(e)
      tipX = p.x
      tipY = p.y
      inside = true
      const prev = pointers.get(e.pointerId)
      if (prev) {
        pointers.set(e.pointerId, p)
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (pinch > 0) {
            kGoal = k = Math.max(minK(), Math.min(maxK, k * (d / pinch)))
            if (shown === "map") ty = tyGoal = clampTy(ty, mapScale() * k)
          }
          pinch = d
          moved += 10
          kick()
          return
        }
        if (!dragging) return
        const dx = p.x - prev.x
        const dy = p.y - prev.y
        moved += Math.abs(dx) + Math.abs(dy)
        const now = performance.now()
        const dts = Math.max(0.008, (now - lastMove) / 1000)
        lastMove = now
        if (shown === "globe") {
          const deg = 180 / Math.PI / R
          lam += dx * deg
          phi = Math.max(-85, Math.min(85, phi - dy * deg))
          velL = velL * 0.4 + ((dx * deg) / dts) * 0.6
          velP = velP * 0.4 + ((-dy * deg) / dts) * 0.6
        } else {
          lam += (dx / R) * (180 / Math.PI)
          ty = clampTy(ty + dy, R)
          velL = velL * 0.4 + ((dx / R) * (180 / Math.PI) / dts) * 0.6
          velP = velP * 0.4 + (dy / dts) * 0.6
        }
        lamGoal = lam
        phiGoal = phi
        tyGoal = ty
        if (moved > 4) {
          hover = null
          tip.style.opacity = "0"
        }
        kick()
        return
      }
      const hit = pick(p.x, p.y)
      const same = hit?.kind === hover?.kind && hit?.i === hover?.i
      hover = hit
      canvas.style.cursor = hit && hit.kind !== "country" ? "pointer" : "grab"
      if (!same) setTip(hit)
      kick()
    }
    const onUp = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return
      pointers.delete(e.pointerId)
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
      if (pointers.size === 1) {
        pinch = 0
        return
      }
      if (pointers.size > 0) return
      dragging = false
      canvas.style.cursor = "grab"
      if (reduced || performance.now() - lastMove > 90) velL = velP = 0
      if (downAt && moved < 5 && e.type === "pointerup") {
        velL = velP = 0
        const p = local(e)
        const hit = pick(p.x, p.y)
        if (hit?.kind === "node") {
          focusNode(hit.i)
          const n = model.nodes[hit.i]
          cfg.current.onNodeClick?.({ id: n.id, name: n.name, role: n.role, in: n.in, out: n.out })
        } else if (hit?.kind === "flow") {
          focus = hit
          const f = model.flows[hit.i]
          const d = describe(hit)
          if (d) say(d[0] + ". " + d[1] + ".")
          cfg.current.onFlowClick?.({ source: model.nodes[f.s].id, target: model.nodes[f.t].id, value: f.value })
        } else focus = null
      }
      downAt = null
      kick()
    }
    const onLeave = () => {
      inside = false
      if (!dragging) {
        hover = null
        tip.style.opacity = "0"
      }
      kick()
    }
    const onDbl = (e: MouseEvent) => {
      const p = local(e)
      const ll = proj.invert?.([p.x, p.y])
      if (ll && Number.isFinite(ll[0])) lookAt(ll)
      zoomBy(1.6)
    }

    let hintTimer = 0
    const onWheel = (e: WheelEvent) => {
      const m = cfg.current.wheelZoom
      if (m === "off") return
      if (m === "modifier" && !e.ctrlKey && !e.metaKey) {
        hint.style.opacity = "1"
        window.clearTimeout(hintTimer)
        hintTimer = window.setTimeout(() => (hint.style.opacity = "0"), 1400)
        return
      }
      e.preventDefault()
      hint.style.opacity = "0"
      zoomBy(Math.exp(-Math.max(-60, Math.min(60, e.deltaY)) * 0.006))
    }

    const onKey = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 45 : 15
      let handled = true
      const n = model.nodes.length
      const cur = focus?.kind === "node" ? focus.i : -1
      switch (e.key) {
        case "ArrowLeft":
          turn(step, 0)
          break
        case "ArrowRight":
          turn(-step, 0)
          break
        case "ArrowUp":
          turn(0, -step)
          break
        case "ArrowDown":
          turn(0, step)
          break
        case "+":
        case "=":
          zoomBy(1.35)
          break
        case "-":
        case "_":
          zoomBy(1 / 1.35)
          break
        case "0":
        case "Home":
          home()
          break
        case "m":
        case "M":
          cfg.current.setView(shown === "globe" ? "map" : "globe")
          say(shown === "globe" ? "Flat map" : "Globe")
          break
        case "]":
        case "n":
          if (n) focusNode((cur + 1) % n)
          break
        case "[":
        case "p":
          if (n) focusNode((cur - 1 + n) % n)
          break
        case "Enter":
        case " ":
          if (cur >= 0) {
            const nd = model.nodes[cur]
            cfg.current.onNodeClick?.({ id: nd.id, name: nd.name, role: nd.role, in: nd.in, out: nd.out })
          } else handled = false
          break
        case "Escape":
          if (focus) {
            focus = null
            say("Cleared")
            kick()
          } else handled = false
          break
        default:
          handled = false
      }
      if (handled) e.preventDefault()
    }
    const onBlur = () => {
      inside = false
      kick()
    }

    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerup", onUp)
    canvas.addEventListener("pointercancel", onUp)
    canvas.addEventListener("pointerleave", onLeave)
    canvas.addEventListener("dblclick", onDbl)
    canvas.addEventListener("wheel", onWheel, { passive: false })
    canvas.addEventListener("keydown", onKey)
    canvas.addEventListener("blur", onBlur)

    const onReduce = () => {
      reduced = reduceMq.matches
      kick()
    }
    reduceMq.addEventListener("change", onReduce)
    darkMq.addEventListener("change", retheme)
    const mo = new MutationObserver(retheme)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })
    const ro = new ResizeObserver(resize)
    ro.observe(root)
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([en]) => {
            visible = en.isIntersecting
            if (visible) kick()
          })
    io?.observe(root)
    const onVis = () => {
      visible = !document.hidden
      if (visible) kick()
    }
    document.addEventListener("visibilitychange", onVis)

    retheme()
    paintGrain()
    resize()
    // the engine's own kick also repaints the grain when the theme moves
    const baseKick = api.current.kick
    api.current.kick = () => {
      paintGrain()
      baseKick()
    }

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(hintTimer)
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onUp)
      canvas.removeEventListener("pointerleave", onLeave)
      canvas.removeEventListener("dblclick", onDbl)
      canvas.removeEventListener("wheel", onWheel)
      canvas.removeEventListener("keydown", onKey)
      canvas.removeEventListener("blur", onBlur)
      reduceMq.removeEventListener("change", onReduce)
      darkMq.removeEventListener("change", retheme)
      document.removeEventListener("visibilitychange", onVis)
      mo.disconnect()
      ro.disconnect()
      io?.disconnect()
      api.current = null
    }
  }, [])

  const t = theme
  const vars = {
    "--sfg-text": t.text,
    "--sfg-muted": t.muted,
    "--sfg-chip": t.chip,
    "--sfg-chip-hover": t.chipHover,
    "--sfg-accent": t.accent,
    "--sfg-accent-text": t.accentText,
    "--sfg-line": t.landStroke,
    "--sfg-paper": t.paper,
  } as React.CSSProperties
  const swatch: { [k in Role]: string } = { producer: t.producer, hub: t.hub, consumer: t.consumer }
  const present = ROLES.filter((r) => model.nodes.some((n) => n.role === r))
  const btn =
    "grid size-9 cursor-pointer place-items-center rounded-lg border border-[var(--sfg-line)] bg-[var(--sfg-chip)] text-[var(--sfg-text)] shadow-sm transition-colors duration-200 hover:bg-[var(--sfg-chip-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sfg-accent)] motion-reduce:transition-none"

  return (
    <div
      ref={rootRef}
      className={"relative isolate w-full touch-none select-none overflow-hidden " + className}
      style={{ ...vars, height, minHeight: 320, backgroundColor: t.paper, color: t.text, backgroundSize: "auto, 160px 160px" }}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="img"
        aria-label={
          (typeof title === "string" ? title + ". " : "") +
          model.flows.length +
          " flows between " +
          model.nodes.length +
          " places. Drag or use the arrow keys to turn the globe, plus and minus to zoom, N and P to step through places, M to switch between globe and map."
        }
        className="absolute left-0 top-0 block cursor-grab outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--sfg-accent)]"
        style={{ maxWidth: "none" }}
      />

      {showToggle && (
        <div className="absolute left-4 top-4 flex items-center gap-2.5 rounded-full border border-[var(--sfg-line)] bg-[var(--sfg-chip)]/80 py-1.5 pl-3.5 pr-3.5 text-[13px] text-[var(--sfg-text)] shadow-sm backdrop-blur-sm sm:left-6 sm:top-6">
          <button type="button" onClick={() => setView("globe")} className={"cursor-pointer transition-opacity duration-200 motion-reduce:transition-none " + (view === "globe" ? "font-semibold opacity-100" : "opacity-60 hover:opacity-90")}>
            Globe
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={view === "map"}
            aria-label="Show as flat map"
            onClick={() => setView(view === "globe" ? "map" : "globe")}
            className="relative h-[22px] w-10 shrink-0 cursor-pointer rounded-full bg-[var(--sfg-accent)] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sfg-accent)] motion-reduce:transition-none"
          >
            <span
              className="absolute left-[3px] top-[3px] size-4 rounded-full bg-[var(--sfg-accent-text)] shadow transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{ transform: view === "map" ? "translateX(18px)" : "translateX(0)" }}
            />
          </button>
          <button type="button" onClick={() => setView("map")} className={"cursor-pointer transition-opacity duration-200 motion-reduce:transition-none " + (view === "map" ? "font-semibold opacity-100" : "opacity-60 hover:opacity-90")}>
            Map
          </button>
        </div>
      )}

      {showLegend && present.length > 0 && (
        <div className="absolute inset-x-4 top-[4.25rem] flex flex-wrap gap-1 text-[11px] text-[var(--sfg-text)] sm:inset-x-auto sm:right-6 sm:top-6 sm:w-64 sm:flex-col sm:rounded-2xl sm:border sm:border-[var(--sfg-line)] sm:bg-[var(--sfg-chip)]/80 sm:p-2 sm:text-[12px] sm:shadow-sm sm:backdrop-blur-sm">
          {present.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={isolate === r}
              onClick={() => setIsolate((cur) => (cur === r ? null : r))}
              onPointerEnter={() => setPreviewRole(r)}
              onPointerLeave={() => setPreviewRole(null)}
              onFocus={() => setPreviewRole(r)}
              onBlur={() => setPreviewRole(null)}
              className={
                "flex cursor-pointer items-center gap-2 rounded-full border border-[var(--sfg-line)] bg-[var(--sfg-chip)]/80 px-2.5 py-1 text-left backdrop-blur-sm transition-colors duration-200 hover:bg-[var(--sfg-chip-hover)] focus-visible:outline-2 focus-visible:outline-[var(--sfg-accent)] motion-reduce:transition-none sm:gap-2.5 sm:rounded-xl sm:border-0 sm:bg-transparent sm:px-2 sm:py-1.5 sm:backdrop-blur-none " +
                (isolate === r ? "bg-[var(--sfg-chip-hover)] sm:bg-[var(--sfg-chip-hover)]" : "")
              }
            >
              <span className="size-2.5 shrink-0 rounded-[3px] border border-[var(--sfg-line)] sm:size-3 sm:rounded-[4px]" style={{ backgroundColor: swatch[r] }} />
              <span className="min-w-0 flex-1 truncate">{labels[r]}</span>
              <span className="shrink-0 tabular-nums text-[var(--sfg-muted)] max-sm:hidden">{fmt(model.totals[r])}</span>
            </button>
          ))}
          <p className="px-2 pb-0.5 pt-1 text-[11px] leading-snug text-[var(--sfg-muted)] max-sm:hidden">
            Drag to spin · click a dot to trace it
          </p>
        </div>
      )}

      {showZoom && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 sm:bottom-6 sm:right-6">
          <button type="button" aria-label="Zoom in" onClick={() => api.current?.zoom(1.4)} className={btn}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ maxWidth: "none" }}>
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => api.current?.zoom(1 / 1.4)} className={btn}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ maxWidth: "none" }}>
              <path d="M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" aria-label="Reset view" onClick={() => api.current?.home()} className={btn}>
            <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" style={{ maxWidth: "none" }}>
              <path d="M2.5 7.5 8 3l5.5 4.5M4 6.5V13h3V9.5h2V13h3V6.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {showTitle && (title || subtitle) && (
        <div data-sfg-title className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center px-20 pb-4 text-center sm:pb-6">
          {title && (
            <h2 className="m-0 text-[18px] font-semibold leading-tight tracking-tight text-[var(--sfg-text)] sm:text-[20px]" style={{ fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', serif" }}>
              {title}
            </h2>
          )}
          {subtitle && <p className="m-0 mt-0.5 text-[11px] tracking-wide text-[var(--sfg-muted)]">{subtitle}</p>}
        </div>
      )}

      <div
        ref={hintRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--sfg-text)] px-3.5 py-1.5 text-[12px] text-[var(--sfg-paper)] opacity-0 shadow-lg transition-opacity duration-300 motion-reduce:transition-none"
      >
        Hold ⌘ or Ctrl and scroll to zoom
      </div>

      <div
        ref={tipRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 max-w-[16rem] rounded-xl border border-[var(--sfg-line)] bg-[var(--sfg-paper)]/95 px-3 py-2 text-[12px] leading-snug text-[var(--sfg-text)] opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-150 motion-reduce:transition-none"
      >
        <div className="font-semibold" />
        <div className="mt-0.5 tabular-nums text-[var(--sfg-muted)]" />
      </div>

      <span ref={liveRef} aria-live="polite" className="sr-only" />
    </div>
  )
}
