---
name: explainability-layer
description: Use this skill whenever an anomaly flag, forecast risk, or zone classification needs a human-readable explanation attached, or when reviewing that all system outputs meet the auditability requirement.
---

This skill ensures that all insights surfaced by the GridSense AI are human-readable, auditable, and clearly explain the reasoning behind alerts or models.

## Context & Constraints

- No black-box results. All outputs must be explainable.
- Never display a severity score without its corresponding explanation.

## Step-by-Step Instructions

1. For every `AnomalyFlag`, generate `explanation` using this template:
   "{MeterID} in {ZoneName}: {anomalyType in plain English} detected. Consumption was {deviation}% {above/below} the {baseline type} over {N} consecutive intervals from {startTime} to {endTime}."
2. For every `DemandForecast` with `riskLevel >= HIGH`, generate a `riskReason` string:
   "Zone {ZoneName} forecast to exceed {threshold} kWh between {startTime}–{endTime}. Historical peak on this day/hour: {historicalPeak} kWh."
3. Add a `<ExplainabilityTooltip>` component that renders on hover for:
   - Every `StatusBadge` in anomaly cards
   - Every risk level shown in zone cards
   - The severity score bar in `AnomalyFlagCard`
4. Enforce: never display a severity score without also displaying its `explanation`.
5. Provide an `auditLog` utility: every time a flag is dismissed or confirmed, append to an in-memory audit array:
   `{ timestamp, flagId, action: 'DISMISSED'|'CONFIRMED'|'REVIEWED', reason?, notes? }`
6. Display the audit log in `ZoneDetailPage` under "Anomaly History" as a chronological timeline.

## Output Contract

Explainability components and audit utilities implemented and integrated across the UI.

## Example

Input: Anomaly flag for SUDDEN_DROP.
Output: Explanation string "Meter BLR-N01-M01 in Rajajinagar: Sudden drop detected. Consumption was 78% below the 7-day average over 6 consecutive intervals..."

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
- [ ] No `AnomalyFlag` in the system has `explanation: ''` or `explanation: undefined`
- [ ] No severity score is displayed without an accompanying explanation
- [ ] Every dismissal adds an entry to the audit log
- [ ] `ExplainabilityTooltip` is applied to all risk badges in anomaly cards
