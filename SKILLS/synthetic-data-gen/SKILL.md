---
name: synthetic-data-gen
description: Use this skill any time new synthetic meter data, zone data, or test fixtures need to be generated, or when the existing seed data needs to be extended or modified.
---

This skill outlines how to safely and consistently generate synthetic BESCOM smart meter data for use across the application, including injecting anomalies and calculating baselines.

## Context & Constraints

- Never use real meter data. Always use synthetic generators.
- All output data must be tagged with `isSynthetic: true`.
- Anomalies must be injected via specific functions, not hardcoded inline.

## Step-by-Step Instructions

1. Always start by checking if `src/data/generators/index.ts` exports `seedGridSenseData()`
2. Generate zone data from `src/constants/zones.ts` (never invent zone IDs inline)
3. For each zone, generate exactly 4 meters with IDs in format `{ZONE_ID}-M{01–04}` (e.g., `BLR-N01-M01`)
4. For each meter, generate 7 days × 96 intervals of `MeterReading` objects:
   - Base demand drawn from zone's base capacity range
   - Apply time-of-day and weekday multipliers
   - Add noise (Gaussian, σ = 5% of value)
5. Inject anomalies by calling functions from `src/data/generators/injectAnomalies.ts` — **never inline anomaly injection logic**
6. Calculate baselines: for each meter, compute 7-day rolling average per interval slot (96 slots)
7. Tag every generated object with `isSynthetic: true`
8. At the end of `seedGridSenseData()`, `console.log()` the synthetic data banner

## Output Contract

Synthetic mock data correctly configured and exported from `src/data/generators/index.ts`.

## Example

Input: Call to `seedGridSenseData()`.
Output: Initialized store with mocked zones, 4 meters per zone, and 7-day readings tagged `isSynthetic: true`.

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
- [ ] All readings have `isSynthetic: true`
- [ ] No negative consumption values
- [ ] All timestamps are in ISO 8601 format at exactly 15-minute intervals
- [ ] Total readings per meter = 672 (7 days × 96 intervals)
- [ ] At least 6 anomaly flags are injected across all meters
