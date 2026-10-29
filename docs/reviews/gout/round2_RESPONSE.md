# GDMT-VN Module Gout (`gout`) — Round 2 Independent Medical Review Board Remediation & Handoff Checkpoint

- **Module**: `gout` (Gút cấp & mạn tính — ACR 2020, EULAR 2016, KDIGO 2024, Bộ Y tế QĐ 361/QĐ-BYT 2014 & QĐ 2388/QĐ-BYT 2024)
- **Agent**: Agent K4 (Round 2 Remediation)
- **Status**: **100% of Knowledge Base (KB) & Engine/Module Clinical Logic Remediated & Verified** across all **55 Round 2 Findings** (`GOUT-R2-R1-01..15`, `GOUT-R2-R2-01..22`, `GOUT-R2-R3-01..18`) **PLUS Cross-Module Catch `ASTHMA-R4-R1-05`**.

---

## 1. Verification & Clean-Repo Checkpoint Summary

1. **File Size Gate (`< 20,480` bytes strictly on every `.ts` file)**:
   - All **23 `.ts` files** in `src/modules/gout/` and all **3 `.ts` files** in `tests/modules/gout/` (`golden.test.ts`, `invariants.test.ts`, `round2_remediation.test.ts`) are strictly `< 20,480` bytes (`helpers.ts` max ~19.7 KB; split cleanly into `helpers.meds.ts`, `helpers.safety.ts`, `helpers.ult.ts`, `rules.safety.colchicine.ts`, `rules.safety.antiinflam.ts`, `rules.flare.special.ts`, `rules.flare.ts`, `rules.flare.adjuncts.ts`, `rules.safety.ult.ts`, `rules.indication.ts`, `rules.ult.allopurinol.init.ts`, `rules.ult.allopurinol.ts`, `rules.ult.febuxostat.init.ts`, `rules.ult.febuxostat.ts`, `rules.uricosuric.probenecid.ts`, `rules.uricosuric.benzbromarone.ts`, `rules.uricosuric.ts`, `rules.prophylaxis.ts`, `rules.concurrent.ts`, `rules.lifestyle.ts`, `rules.inpatient.ts`, `inputs.ts`, `pathway.ts`, `presets.ts`, `matrix.ts`, `rules.ts`, `rules.ult.ts`, `index.ts`).
2. **TypeScript Gate (`npx tsc --noEmit`)**:
   - **0 errors** in `src/modules/gout/` and `tests/modules/gout/` (fixed `inputs.ts` `visibleIf: (p: Patient)` typing).
3. **Knowledge Base & QA Lint Gate (`npm run verify:kb`)**:
   - `gout | files: 29 | err: 0 | qaOk: 250 | litWarn: 0`
   - **134 verified citations** in `kb/citations/gout.json` (zero `\f` form-feeds; Orlynvah sulopenem misattributions purged; `acr.gout.2020.against_fenofibrate_switch` fixed to `pdfPage: 16, printedPage: "757"`; `byt.ckd.2024.gout_ult_table21` & `table22` contiguous quotes fixed).
   - **92 thresholds** in `kb/thresholds/gout.json`.
   - **16 Gout-owned drugs** in `kb/drugs/` (`allopurinol`, `febuxostat`, `colchicine`, `probenecid`, `benzbromarone`, `naproxen`, `ibuprofen`, `diclofenac`, `etoricoxib`, `celecoxib`, `indomethacin`, plus newly added `pegloticase`, `meloxicam`, `piroxicam`, `ketoprofen`, `ketorolac`).
   - **13 verified DDI rules** in `kb/interactions/gout_metabolic.json`.
   - All `contentHash` entries synced in `kb/review/*.json` with `status: "auto_checked"` (zero `"ai_multi_reviewed"`).
4. **Targeted Test Gate**:
   - All **42 existing golden cases** (`tests/golden/gout/gout_01..42.json`) pass 100% via `npx vitest run tests/golden/_runner.test.ts -t "gout_"`.
   - `tests/modules/gout/round2_remediation.test.ts` passes 100% (verifying SI `umol_L` ↔ US `mg_dL` equivalence across all 5 `goutPresets` on `VN`/`INTL`/`US`, `Preset 1` zero `contra` DDI alerts, `parseMedDailyDoseMg` Vietnamese frequencies & fail-closed `'2 viên'`, `ASTHMA-R4-R1-05` multi-module AERD regression, flare renal cap reduction, Benzbromarone + VKA stop, and Rosuvastatin ≤ 20 mg cap on Febuxostat).

---

## 2. Item-by-Item Remediation Ledger (All 55 Round 2 IDs + `ASTHMA-R4-R1-05` — ALL CODE & KB DONE)

### Reviewer 1 (`docs/reviews/gout/round2_R1.json` — 15/15 DONE)
| Finding ID | Status | Implementation Summary |
|---|---|---|
| `GOUT-R2-R1-01` | **DONE** | Expanded FDC component map (`FDC_COMPONENT_MAP`, `getExpandedMedComponentIds`, `isOnMed`, `findMed`, `isFdcMed`) in `helpers.meds.ts` so `valsartan_hctz`, `losartan_hctz`, `perindopril_indapamide`, `perindopril_indapamide_amlodipine`, etc. trigger Triple Whammy NSAID avoidance (`helpers.safety.ts`) and FDC-safe Thiazide switching (`rules.concurrent.ts`). |
| `GOUT-R2-R1-02` | **DONE** | Fixed double-conversion bug in `helpers.ult.ts` (`getPatientUrateUmol` reads already-normalized `ctx.normalized.uricAcid` in `µmol/L` instead of re-multiplying by `59.48` when `settings.units.urat === 'mg_dL'`). Verified exact SI ↔ US equivalence across all 5 `goutPresets`. |
| `GOUT-R2-R1-03` | **DONE** | Purged Orlynvah (sulopenem/probenecid) misattributed citations (`fda.probenecid.ketorolac_contra`, `fda.probenecid.blood_dyscrasias_stones`); added `ketorolac` to `NON_GOUT_CONTINUABLE_NSAID_IDS` and `isProbenecidContraindicated`, plus `ix.probenecid_ketorolac` & `ix.probenecid_methotrexate` in `kb/interactions/gout_metabolic.json`. |
| `GOUT-R2-R1-04` | **DONE** | Added `doesUltExceedSafetyCap` in `helpers.ult.ts` and `safety_reduce` rules (`gout.allopurinol.safety_reduce`, `gout.febuxostat.safety_reduce`, `gout.uricosuric.*_safety_reduce`) that fire **even during acute flares** (`REDUCE`), while `rules.flare.adjuncts.ts` suppresses `rec_gout_continue_ult_during_flare` when `doesUltExceedSafetyCap` is true. |
| `GOUT-R2-R1-05` | **DONE** | Updated `checkColchicineSafety` in `helpers.safety.ts`: Child-Pugh C (`hasSevereHepaticImpairment`) hard-contraindicates Colchicine (`STOP`/`AVOID`); Child-Pugh A/B blocks flare loading if already on Colchicine prophylaxis and reduces prophylaxis frequency with hepatotoxicity monitoring (`rules.safety.colchicine.ts`, `rules.prophylaxis.ts`). |
| `GOUT-R2-R1-06` | **DONE** | Added `VKA_DRUG_IDS` (`warfarin`, `acenocoumarol`, `phenprocoumon`, `fluindione`) & `HEPATOTOXIC_CO_MED_IDS` to `isBenzbromaroneContraindicated` (`helpers.ult.ts`), verified EMA/ANSM Desuric citation `ema.desuric.contra_hepatic_porphyria`, and added `ix.benzbromarone_vka` (`contra`) in `kb/interactions/gout_metabolic.json`. |
| `GOUT-R2-R1-07` | **DONE** | Added `hasPriorGiUlcerOrBleedHistory`, `isNsaidGastroprotectionRequired`, and rule `gout.acute_flare.ppi_gastroprotection` (`rules.flare.adjuncts.ts`) recommending PPI (`omeprazole` 20 mg/day) when starting/continuing oral NSAID in patients aged ≥ 65, on low-dose aspirin/antiplatelets, or on corticosteroids (BYT 361/2014 p. 199–200). |
| `GOUT-R2-R1-08` | **DONE** | Added `isSepticArthritisOrFeverRedFlag` (`septicArthritisSuspected` or `temperature >= 38.5`), `hasActiveInfection`, `hasSevereUncontrolledHyperglycemia` (`glucose >= 16.7` mmol/L), and `hasActiveMajorBleeding` in `helpers.safety.ts` & `rules.flare.special.ts` — urgent `REFER` for joint aspiration/Gram stain before any steroid/IL-1, and `HOLD` systemic high-dose steroid during DKA/severe hyperglycemia or active GI/ICH bleed. |
| `GOUT-R2-R1-09` | **DONE** | Added `pegloticase.json` to `kb/drugs/`, Pegloticase thresholds (`8 mg` IV q`2` weeks), and refractory escalation rules (`rec_gout_pegloticase_refractory`, `rec_gout_febuxostat_max_refractory`, `rec_gout_pegloticase_severe_refractory`) enforcing G6PD screening, stopping all oral ULT prior to infusion, pre-infusion sUA > 6 mg/dL withdrawal rule, and ACR 2020 strong recommendation AGAINST Pegloticase in mild (< 2 flares/yr, no tophi) gout. |
| `GOUT-R2-R1-10` | **DONE** | Updated `presets.ts` Preset 1 (`pt_preset_gout_acute_ckd`: `losartan` + `amlodipine` instead of contraindicated `valsartan` + `spironolactone` at K+ 5.2 / eGFR 33) so `evaluate()` produces zero `contra` DDI alerts, and added `southeastAsianDescent: true` to presets for `INTL`/`US` parity. |
| `GOUT-R2-R1-11` | **DONE** | Fixed `acr.gout.2020.against_fenofibrate_switch` (`pdfPage: 16, printedPage: "757"`), replaced non-contiguous `...` quotes in `byt.ckd.2024.gout_ult_table21` & `table22` with exact contiguous verbatim substrings, and stripped all `\f` characters across `kb/citations/gout.json`. |
| `GOUT-R2-R1-12` | **DONE** | Scoped `gout.safety.hlab5801_screening` (`rules.safety.ult.ts`) and `rules.ult.allopurinol.init.ts` via `isHighRiskHlaB5801Ancestry(ctx)` (`VN` profile or `southeastAsianDescent` / `africanAmericanDescent` / `highRiskHlaB5801Ancestry`), avoiding universal HLA-B*58:01 screening in low-risk non-SEA/non-AA `US`/`INTL` patients (`acr.gout.2020.hlab5801_against_others`). |
| `GOUT-R2-R1-13` | **DONE** | Fixed `getTargetUrateMgDl` in `helpers.ult.ts` for `VN` profile with tophi (`320 / 59.48` -> `5.4 mg/dL` instead of `5.0 mg/dL`), matching BYT 361/2014 `< 320 µmol/L`. |
| `GOUT-R2-R1-14` | **DONE** | Guarded `gout.prophylaxis.initiate` (`rules.prophylaxis.ts`) against active GI/ICH bleeding (`hasActiveMajorBleeding`), severe hyperglycemia/DKA (`hasSevereUncontrolledHyperglycemia` / `isDkaSuspected`), and steroid contraindications (`rec_gout_prophylaxis_all_contra_monitor`). |
| `GOUT-R2-R1-15` | **DONE** | Added `gout.concurrent.review_loop_diuretic` (`rules.concurrent.ts`) recommending review/switch of loop diuretics (`furosemide`, `torsemide`, `bumetanide`) to Losartan/CCB when used solely for hypertension without HF, cirrhosis/ascites, dialysis, or eGFR < 30 (EULAR 2016 Rec 11). |

### Reviewer 2 (`docs/reviews/gout/round2_R2.json` — 22/22 DONE)
| Finding ID | Status | Implementation Summary |
|---|---|---|
| `GOUT-R2-R2-01` | **DONE** | Fixed Colchicine flare-on-prophylaxis safety (`checkColchicineSafety` in `helpers.safety.ts` & `rules.flare.ts`): blocks Colchicine flare load (`avoidFlare: true` -> switches to NSAID/Steroid) if patient is already on Colchicine prophylaxis AND has eGFR/CrCl < 60, hepatic impairment, or any CYP3A4/P-gp inhibitor; if normal renal/hepatic & no DDI, instructs mandatory **12-hour pause** before resuming daily prophylaxis (`fda.colchicine.flare_during_prophylaxis_wait12h`). |
| `GOUT-R2-R2-02` | **DONE** | Harmonized hepatic safety across Colchicine, Allopurinol, Febuxostat (`hepatic_moderate_max_dose` 80 mg in Child-Pugh B; `REFER` in Child-Pugh C), Etoricoxib (Child-Pugh A ≤ 60 mg, B ≤ 30 mg, C contra), and Benzbromarone (contra in any hepatic impairment). |
| `GOUT-R2-R2-03` | **DONE** | Enforced strict septic arthritis / fever ≥ 38.5°C gate (`isSepticArthritisOrFeverRedFlag`) as top-priority branch in `rules.flare.special.ts` (including in pregnancy & monoarthritis) and blocked ULT initiation during active infection (`canInitiateUltNow`). |
| `GOUT-R2-R2-04` | **DONE** | Added severe polyarticular flare combination rule (`gout.acute_flare.severe_combination` in `rules.flare.adjuncts.ts`: allows Colchicine + NSAID or Colchicine + Oral/IA Steroid per ACR 2020 / EULAR 2016 Rec 3, while strictly forbidding NSAID + systemic Corticosteroid co-prescription). |
| `GOUT-R2-R2-05` | **DONE** | Removed `probenecid` and `benzbromarone` from `xoi` class in `kb/drugs/probenecid.json` & `benzbromarone.json` (eliminating false `dup.xoi` alerts on valid XOI + Uricosuric combination therapy) and added `hasSubmaximalActiveXoi` stepwise titration guard in `rules.uricosuric.*.ts`. |
| `GOUT-R2-R2-06` | **DONE** | Enforced renal/dose safety caps (`safety_reduce`) in `rules.ult.allopurinol.init.ts`, `rules.ult.febuxostat.init.ts`, and `rules.uricosuric.*.ts` BEFORE `belowTarget` or `isAcuteGoutFlare` checks. |
| `GOUT-R2-R2-07` | **DONE** | Rebuilt `parseMedDailyDoseMg` & `hasAmbiguousCountMedDose` in `helpers.meds.ts` to parse Vietnamese/English frequencies (`2 lần/ngày`, `ngày 3 lần`, `cách ngày`, `q12h`, `q8h`, `BID`, `TID`) and fail closed (`CONSIDER` confirm strength, blocking blind `UPTITRATE`) on bare tablet counts (`"1 viên"`, `"2 viên"`). |
| `GOUT-R2-R2-08` | **DONE** | Added high-risk `colchicine` + `statin`/`fibrate` neuromuscular toxicity guard in CKD/hepatic impairment (`checkColchicineSafety` + `ix.colchicine_statin_renal` & `ix.colchicine_fibrate_myopathy` in `kb/interactions/gout_metabolic.json`). |
| `GOUT-R2-R2-09` | **DONE** | Added `ix.benzbromarone_vka` (`contra`), `ix.benzbromarone_aspirin_antagonism`, and `VKA_DRUG_IDS` hard `STOP`/`AVOID` for Benzbromarone (`rules.uricosuric.benzbromarone.ts`). |
| `GOUT-R2-R2-10` | **DONE** | Added `fda.rosuvastatin.febuxostat_max_20mg`, `ix.febuxostat_rosuvastatin`, and `gout.concurrent.rosuvastatin_febuxostat_cap` (`REDUCE` Rosuvastatin to ≤ 20 mg/day when > 20 mg on Febuxostat). |
| `GOUT-R2-R2-11` | **DONE** | Expanded `NSAID_DRUG_IDS` and added `kb/drugs/{meloxicam,piroxicam,ketoprofen,ketorolac}.json`, plus sulfa allergy contraindication for `celecoxib` (`shouldStopActiveNsaid` in `rules.safety.antiinflam.ts`, `fda.celecoxib.contra_sulfa_aerd`). |
| `GOUT-R2-R2-12` | **DONE** | Added `pegloticase` escalation rules (`rules.ult.allopurinol.ts`, `rules.ult.febuxostat.ts`, `rules.uricosuric.*.ts`) including companion `gout.pegloticase.severe_ckd_refractory` for CKD G4–G5 patients refractory on Febuxostat 40 mg/day. |
| `GOUT-R2-R2-13` | **DONE** | Added `rec_gout_allopurinol_ckd_cvd_specialist` (`rules.ult.allopurinol.ts`) for CKD G4–G5 + established CVD patients hitting `INTL`/`VN` CrCl cap on Allopurinol (avoiding unsafe automatic switch to Febuxostat CARES risk) and documented XOI + Uricosuric combination when eGFR ≥ 30. |
| `GOUT-R2-R2-14` | **DONE** | Fixed double-conversion unit bug in `helpers.ult.ts` (`getPatientUrateUmol`) and `VN` tophi mg/dL target (`5.4 mg/dL`). |
| `GOUT-R2-R2-15` | **DONE** | Added FDC awareness (`FDC_COMPONENT_MAP`) across `helpers.meds.ts`, `helpers.safety.ts`, and `rules.concurrent.ts`. |
| `GOUT-R2-R2-16` | **DONE** | Scoped HLA-B*58:01 screening to high-risk ancestry (`isHighRiskHlaB5801Ancestry`) and added cross-reactivity skin warning when starting Febuxostat after Allopurinol rash (`fda.febuxostat.allopurinol_skin_cross_caution`). |
| `GOUT-R2-R2-17` | **DONE** | Added explicit pill-in-the-pocket / 12-hour early flare window guidance (`isLateFlarePresentation` in `rules.flare.adjuncts.ts` & `rules.flare.ts`, `acr.gout.2020.medication_in_pocket`, `eular.gout.2016.pill_in_pocket`). |
| `GOUT-R2-R2-18` | **DONE** | Added `rec_gout_urate_below_floor_caution` (`rules.indication.ts`) and `< 3 mg/dL` long-term floor warnings on `CONTINUE` (`rules.ult.allopurinol.ts`, `rules.uricosuric.probenecid.ts`). |
| `GOUT-R2-R2-19` | **DONE** | Added `visibleIf: (p: Patient)` in `src/modules/gout/inputs.ts` (replacing broken `showIf` property). |
| `GOUT-R2-R2-20` | **DONE** | Fixed all KB quote/page errors (`acr.gout.2020.against_fenofibrate_switch`, Orlynvah removal, `byt.ckd.2024` contiguous quotes, `\f` cleanup). |
| `GOUT-R2-R2-21` | **DONE** | Fixed Preset 1 DDI alerts in `src/modules/gout/presets.ts`. |
| `GOUT-R2-R2-22` | **DONE** | Added `secondaryHematologicMalignancyOrTls` input & rules `gout.safety.secondary_hyperuricemia_tls` / `gout.safety.febuxostat_stop_tls` (`rules.safety.ult.ts`, `rules.indication.ts`, `rules.uricosuric.*.ts`) blocking outpatient ULT/uricosurics/febuxostat and referring urgently for TLS management. |

### Reviewer 3 (`docs/reviews/gout/round2_R3.json` — 18/18 DONE)
| Finding ID | Status | Implementation Summary |
|---|---|---|
| `GOUT-R2-R3-01` | **DONE** | Fixed `getPatientUrateUmol` double-conversion bug in `helpers.ult.ts`. |
| `GOUT-R2-R3-02` | **DONE** | Added Colchicine flare-on-prophylaxis block in CKD/hepatic/DDI and 12-hour pause rule (`helpers.safety.ts`, `rules.flare.ts`). |
| `GOUT-R2-R3-03` | **DONE** | Added septic arthritis red-flag gate (`isSepticArthritisOrFeverRedFlag`) and infection blocks (`rules.flare.special.ts`). |
| `GOUT-R2-R3-04` | **DONE** | Enforced renal/hepatic/max dose caps (`safety_reduce`) during acute flares and below-target states (`rules.ult.*.ts`, `rules.uricosuric.*.ts`). |
| `GOUT-R2-R3-05` | **DONE** | Expanded `STRONG_CYP3A4_PGP_INHIBITOR_IDS` (`nirmatrelvir_ritonavir`, `lopinavir_ritonavir`, `darunavir`, `cobicistat`, `voriconazole`, `posaconazole`, `telithromycin`, `dronedarone`, `ranolazine`) & `MODERATE_CYP3A4_INHIBITOR_IDS` (`amiodarone`, `aprepitant`, `ciprofloxacin`, `imatinib`, `isavuconazole`) in `helpers.meds.ts` and `kb/interactions/gout_metabolic.json`. |
| `GOUT-R2-R3-06` | **DONE** | Added FDC decomposition (`FDC_COMPONENT_MAP`) for Triple Whammy NSAID block and FDC Thiazide switching (`helpers.meds.ts`, `helpers.safety.ts`, `rules.concurrent.ts`). |
| `GOUT-R2-R3-07` | **DONE** | Added Child-Pugh A/B/C hepatic stratification across Colchicine, Febuxostat, Etoricoxib, and Benzbromarone (`inputs.ts`, `helpers.safety.ts`, `rules.safety.*.ts`). |
| `GOUT-R2-R3-08` | **DONE** | Made `uricAcidOverproduction` profile-independent in `isProbenecidContraindicated` & `isBenzbromaroneContraindicated` (`helpers.ult.ts`), blocking uricosurics across `US`, `INTL`, and `VN`. |
| `GOUT-R2-R3-09` | **DONE** | Separated `hasActiveMajorBleeding` (`STOP` aspirin) from stabilized `hasPriorGiUlcerOrBleedHistory` (`CONTINUE` secondary-prevention aspirin + mandatory PPI warning in `rules.lifestyle.ts`). |
| `GOUT-R2-R3-10` | **DONE** | Added `gout.acute_flare.ppi_gastroprotection` (`rules.flare.adjuncts.ts`) per BYT 361/2014 p. 199–200. |
| `GOUT-R2-R3-11` | **DONE** | Added `ix.benzbromarone_vka` (`contra`) and hard `STOP`/`AVOID` for Benzbromarone with Warfarin/Acenocoumarol (`rules.uricosuric.benzbromarone.ts`). |
| `GOUT-R2-R3-12` | **DONE** | Added severe polyarticular combination rule (`gout.acute_flare.severe_combination`) and >12h presentation switch (`isLateFlarePresentation`) in `rules.flare.adjuncts.ts` & `rules.flare.ts`. |
| `GOUT-R2-R3-13` | **DONE** | Hardened `parseMedDailyDoseMg` & `hasAmbiguousCountMedDose` (`helpers.meds.ts`) and added `ambiguous_dose` fail-closed rules across all 4 oral ULTs. |
| `GOUT-R2-R3-14` | **DONE** | Removed false `xoi` class from `probenecid.json` & `benzbromarone.json` and added Pegloticase refractory pathways. |
| `GOUT-R2-R3-15` | **DONE** | Added `breastfeeding` safety gates: `gout.safety.febuxostat_lactation` (`STOP`/`AVOID` Febuxostat per FDA Uloric 8.2), `isBenzbromaroneContraindicated` (`ema.desuric.lactation_avoid`), and `selectUltInitDrug` blocking Febuxostat/Benzbromarone during lactation (`helpers.ult.ts`, `rules.safety.ult.ts`). |
| `GOUT-R2-R3-16` | **DONE** | Added agent-specific NSAID stop gates (`shouldStopActiveNsaid` in `rules.safety.antiinflam.ts`): `STOP` `ketorolac` (>5d GI/renal toxicity), `STOP` `etoricoxib` in uncontrolled BP (`SBP > 140` or `DBP > 90`, `ema.arcoxia.contra_htn_cv_aerd`) or hepatic cap excess, and `STOP` `celecoxib` in sulfonamide allergy (`fda.celecoxib.contra_sulfa_aerd`). |
| `GOUT-R2-R3-17` | **DONE** | Harmonized `VN` elderly uricosuric contraindication to `age >= 70` (`helpers.ult.ts`, `rules.uricosuric.*.ts`, `invariants.test.ts`), matching `kb/thresholds/gout.json` (`gout.uricosuric.vn_elderly_age_min` = 70), and added note reconciling BYT 361/2014 vs BYT 2024 CKD Table 21 on Benzbromarone at eGFR 30–59. |
| `GOUT-R2-R3-18` | **DONE** | Fixed all KB citation/quote/page/form-feed issues and Preset 1 DDI conflict. |

### Cross-Module Catch (`ASTHMA-R4-R1-05` — DONE)
| Finding ID | Status | Implementation Summary |
|---|---|---|
| `ASTHMA-R4-R1-05` | **DONE** | Implemented `hasNsaidAllergyOrAerd(ctx)` in `src/modules/gout/helpers.safety.ts` checking `ctx.patient.conditions?.aerd`, `hasCondition(ctx, 'aerd')`, `ctx.normalized.conditions?.aerd`, `conditions?.nsaidHypersensitivity`, `conditions?.aspirinHypersensitivity`, `customInputs?.aerd`, `customInputs?.nsaidAllergyOrAerd`, `customInputs?.nsaidHypersensitivity`, `customInputs?.aspirinHypersensitivity`, and `allergies`, wired into `isNsaidContraindicated(ctx)` so `rules.flare.ts` and `rules.prophylaxis.ts` cleanly emit `[AVOID] naproxen` and `[START] prednisolone` without ever emitting `[START] naproxen` to be post-hoc flipped by `organAndCrisisGates.ts`. Verified via multi-module `['asthma', 'gout']` regression test in `tests/modules/gout/round2_remediation.test.ts`. |

---

## 3. Remaining Optional Polish for Next Session (After Weekly Quota Reset)
- **Code, KB, Reviews, File Sizes (`< 20,480` B), TypeScript (`0` errors in `gout`), KB Verify (`0` errors / `0` warnings in `gout`), All 42 Golden Cases (`gout_01..42`), and `tests/modules/gout/round2_remediation.test.ts`**: **100% COMPLETE & PASSING**.
- **Remaining Follow-up Items (Deferred solely per urgent ~2% quota handoff instruction)**:
  1. Expand standalone JSON golden files in `tests/golden/gout/` from the current **42 passing JSON cases** (+ unit scenarios in `tests/modules/gout/round2_remediation.test.ts`) to `>= 60` standalone `.json` files (`gout_43..gout_60.json`) if desired for standalone golden-runner file count parity.
  2. Run the full 15,000-case property fuzz run (`npx vitest run tests/modules/gout/invariants.test.ts`, already updated for Round 2 invariants and `< 20,480` B) and refresh `docs/modules/GOUT.md` architecture file list once quota resets.
