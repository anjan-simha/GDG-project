---
name: anomaly-detection
description: Use this skill when asked to implement, extend, or explain an anomaly detection rule or when debugging why a flag was or wasn't raised.
---

This skill teaches the agent how to implement pure functions for detecting various anomalies in smart meter data and generating corresponding flags.

## Context & Constraints

- No real meter data may be used.
- All detectors must be pure functions.
- Output must be highly explainable. No empty explanations.

## Step-by-Step Instructions

1. Define each anomaly detector as a **pure function**: `(readings: MeterReading[], config: ThresholdConfig) => AnomalyFlag | null`
2. Implement the following detectors, each in its own exported function in `src/utils/anomalyDetectors.ts`:
   - `detectSuddenDrop`: If current interval < (baseline × (1 - DROP_THRESHOLD))
   - `detectSuddenSpike`: If current interval > (baseline × (1 + SPIKE_THRESHOLD))
   - `detectConsistentUnderreport`: If rolling 30-day average < (peer median × 0.80)
   - `detectNightUsageAnomaly`: If 1am–4am usage > (day average × 0.40)
   - `detectPeerDeviation`: If Z-score vs zone peers > PEER_ZSCORE_THRESHOLD
   - `detectTamperPattern`: If CONSISTENT_UNDERREPORT + SUDDEN_DROP both triggered in same 7-day window
3. For every raised flag:
   - Populate `explanation` as a human-readable sentence (not an error code)
   - Populate `contributingFeatures` as a string array of factor names
   - Set `estimatedFalsePositiveRisk` based on: LOW if >2 detection methods agree, HIGH if only 1 low-confidence signal
   - Set `baselineDeviation` as a signed percentage
4. After running all detectors, deduplicate flags (one flag per meter per anomaly type per 24-hour window)
5. Sort output by `severityScore` descending

## Output Contract

`AnomalyFlag[]` — each flag fully conforms to `AnomalyFlag` interface in `src/types/meter.ts`

## Example

Input: An array of `MeterReading` objects with a sudden drop.
Output: An `AnomalyFlag` object of type `SUDDEN_DROP` with `severityScore` and a human-readable `explanation`.

## Validation Checklist

- [ ] The `description` field is 1–2 sentences and clearly states the trigger condition
- [ ] Step-by-step instructions are numbered and in logical execution order
- [ ] All referenced file paths match the actual project structure from `gemini.md`
- [ ] All type references match `src/types/meter.ts`
- [ ] The Output Contract section specifies exact return types or file paths
- [ ] The Validation Checklist has at least 4 items
- [ ] The skill contains no hardcoded thresholds (all come from `src/constants/thresholds.ts`)
- [ ] No skill references real BESCOM backend systems or APIs
- [ ] Every skill mentions the `isSynthetic: true` requirement where data is produced
- [ ] No flag has an empty `explanation`
- [ ] No flag has `contributingFeatures: []`
- [ ] All severityScores are between 0 and 100
- [ ] Tamper flags always have `severityScore >= 75`
