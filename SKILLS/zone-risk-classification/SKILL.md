---
name: zone-risk-classification
description: Use this skill when asked to classify a zone's risk level, update risk thresholds, or build/modify the zone risk map component.
---

This skill details how to map aggregated zone statistics to a specific risk classification level and represent those risks visually.

## Context & Constraints

- Never hardcode thresholds. Import them from `src/constants/thresholds.ts`.
- The classification relies on `ZoneSummary` data which must always be synthetic.

## Step-by-Step Instructions

1. Import thresholds from `src/constants/thresholds.ts` — never hardcode
2. Implement `classifyZoneRisk(zone: ZoneSummary, thresholds: ThresholdConfig): ZoneRiskLevel` in `src/utils/riskClassifier.ts`
3. Classification logic:
   - CRITICAL: currentLoad > thresholds.criticalKWh OR activeAnomalyCount >= 3 OR any TAMPER_SUSPECTED flag open
   - HIGH: currentLoad > thresholds.highKWh OR (forecastLoad > thresholds.highKWh AND peakHoursRemaining < 2) OR activeAnomalyCount >= 2
   - MODERATE: currentLoad > thresholds.moderateKWh OR activeAnomalyCount >= 1 OR forecastDeviation > 20%
   - LOW: all other cases
4. When building or modifying `ZoneRiskMap.tsx`:
   - Use choropleth coloring via CSS variables (`--color-risk-*`)
   - Each zone block must show: zone name, risk badge, current load in kWh
   - CRITICAL zones must have the pulse animation (see `brand-guidelines.md`)
   - Clicking a zone dispatches `setSelectedZone` to Zustand store
5. Document which threshold values drive each zone's classification in a tooltip on the zone card

## Output Contract

Risk classification logic in `src/utils/riskClassifier.ts` and `ZoneRiskMap.tsx` component implementation.

## Example

Input: Zone with 2 active anomalies.
Output: Risk classification of `HIGH` based on anomaly count.

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
