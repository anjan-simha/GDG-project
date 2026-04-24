---
name: demand-forecasting
description: Use this skill when asked to generate, update, or debug short-term electricity demand forecasts for a zone or meter.
---

This skill teaches the agent how to generate short-term electricity demand forecasts based on historical data, applying time-of-day and day-of-week multipliers, and injecting synthetic noise.

## Context & Constraints

- Never use real meter data.
- Forecast must be computable client-side with no external API calls.
- All thresholds must be sourced from `src/constants/thresholds.ts`, not hardcoded.
- All outputs must be marked with `isSynthetic: true`.

## Step-by-Step Instructions

1. Read zone configuration from `src/constants/zones.ts`.
2. Pull 7-day historical readings from the data layer (`useMeterData` hook or `dataService.ts`).
3. Calculate a rolling 7-day average as the baseline.
4. Apply time-of-day multipliers (morning peak ×1.4, evening peak ×1.6, off-peak ×0.5, midday ×1.1).
5. Apply day-of-week multipliers (weekday ×1.0, Saturday ×0.9, Sunday ×0.8).
6. Add Gaussian noise (σ = 3% of base demand).
7. Calculate 80% confidence intervals as ±10% of predicted value.
8. Classify each interval's `riskLevel` using thresholds from `src/constants/thresholds.ts`.
9. Return a `DemandForecast[]` array conforming to `src/types/meter.ts`.
10. Mark all outputs with `isSynthetic: true`.

## Output Contract

A `DemandForecast[]` array, exported from `src/data/generators/generateForecasts.ts`.

## Example

Input: Request to generate forecast for zone `BLR-N01`.
Output: Array of `DemandForecast` objects with `isSynthetic: true`, predicted KWh, and calculated risk levels based on thresholds.

## Validation Checklist

- [ ] The `description` field is 1–2 sentences and clearly states the trigger condition.
- [ ] Step-by-step instructions are numbered and in logical execution order.
- [ ] All referenced file paths match the actual project structure from `gemini.md`.
- [ ] All type references match `src/types/meter.ts`.
- [ ] The Output Contract section specifies exact return types or file paths.
- [ ] The Validation Checklist has at least 4 items.
- [ ] The skill contains no hardcoded thresholds (all come from `src/constants/thresholds.ts`).
- [ ] No skill references real BESCOM backend systems or APIs.
- [ ] Every skill mentions the `isSynthetic: true` requirement where data is produced.
