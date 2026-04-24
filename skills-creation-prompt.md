# GridSense AI — Skills Creation Prompt
## Anthropic-Format Skills for the BESCOM Smart Meter Intelligence Project

---

## Overview

This prompt instructs the AI agent to create **skill files** for the GridSense AI project. Skills are self-contained, reusable instruction sets that teach the agent how to perform specific repeatable tasks in this codebase. They follow the Anthropic SKILL.md format used in the project's `skills/` folder.

Each skill file lives at: `skills/<skill-name>/SKILL.md`

---

## Skill Format Specification

Every skill must follow this exact structure:

```markdown
---
name: <skill-name>
description: <One to two sentences. When should this skill trigger? What does it do?>
---

<Brief paragraph: what the skill does and what input it expects.>

## Context & Constraints

<List of hard rules this skill must always respect — e.g., no real data, must produce explainable output, etc.>

## Step-by-Step Instructions

<Numbered steps the agent follows to complete the task.>

## Output Contract

<What the skill produces: specific file paths, function signatures, data shapes, or UI components.>

## Example

<A short concrete example input → output pair.>

## Validation Checklist

- [ ] Checklist item 1
- [ ] Checklist item 2
```

---

## Skills to Create

Create the following 5 skill files in the `skills/` directory of the project. After creating each, verify it matches the format above.

---

### Skill 1: `skills/demand-forecasting/SKILL.md`

**Trigger**: Use this skill when asked to generate, update, or debug short-term electricity demand forecasts for a zone or meter.

**The skill must teach the agent to**:
1. Read zone configuration from `src/constants/zones.ts`
2. Pull 7-day historical readings from the data layer (`useMeterData` hook or `dataService.ts`)
3. Calculate a rolling 7-day average as the baseline
4. Apply time-of-day multipliers (morning peak ×1.4, evening peak ×1.6, off-peak ×0.5, midday ×1.1)
5. Apply day-of-week multipliers (weekday ×1.0, Saturday ×0.9, Sunday ×0.8)
6. Add Gaussian noise (σ = 3% of base demand)
7. Calculate 80% confidence intervals as ±10% of predicted value
8. Classify each interval's `riskLevel` using thresholds from `src/constants/thresholds.ts`
9. Return a `DemandForecast[]` array conforming to `src/types/meter.ts`
10. Mark all outputs with `isSynthetic: true`

**Output contract**: A `DemandForecast[]` array, exported from `src/data/generators/generateForecasts.ts`

**Constraints**:
- Never use real meter data
- Forecast must be computable client-side with no external API calls
- All thresholds must be sourced from `src/constants/thresholds.ts`, not hardcoded

---

### Skill 2: `skills/anomaly-detection/SKILL.md`

**Trigger**: Use this skill when asked to implement, extend, or explain an anomaly detection rule or when debugging why a flag was or wasn't raised.

**The skill must teach the agent to**:
1. Define each anomaly detector as a **pure function**: `(readings: MeterReading[], config: ThresholdConfig) => AnomalyFlag | null`
2. Implement the following detectors, each in its own exported function in `src/utils/anomalyDetectors.ts`:

   | Function | Detection Logic |
   |---|---|
   | `detectSuddenDrop` | If current interval < (baseline × (1 - DROP_THRESHOLD)) |
   | `detectSuddenSpike` | If current interval > (baseline × (1 + SPIKE_THRESHOLD)) |
   | `detectConsistentUnderreport` | If rolling 30-day average < (peer median × 0.80) |
   | `detectNightUsageAnomaly` | If 1am–4am usage > (day average × 0.40) |
   | `detectPeerDeviation` | If Z-score vs zone peers > PEER_ZSCORE_THRESHOLD |
   | `detectTamperPattern` | If CONSISTENT_UNDERREPORT + SUDDEN_DROP both triggered in same 7-day window |

3. For every raised flag:
   - Populate `explanation` as a human-readable sentence (not an error code)
   - Populate `contributingFeatures` as a string array of factor names
   - Set `estimatedFalsePositiveRisk` based on: LOW if >2 detection methods agree, HIGH if only 1 low-confidence signal
   - Set `baselineDeviation` as a signed percentage

4. After running all detectors, deduplicate flags (one flag per meter per anomaly type per 24-hour window)
5. Sort output by `severityScore` descending

**Output contract**: `AnomalyFlag[]` — each flag fully conforms to `AnomalyFlag` interface in `src/types/meter.ts`

**Validation checklist the skill must enforce**:
- No flag has an empty `explanation`
- No flag has `contributingFeatures: []`
- All severityScores are between 0 and 100
- Tamper flags always have `severityScore >= 75`

---

### Skill 3: `skills/synthetic-data-gen/SKILL.md`

**Trigger**: Use this skill any time new synthetic meter data, zone data, or test fixtures need to be generated, or when the existing seed data needs to be extended or modified.

**The skill must teach the agent to**:
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

**Zone reference** (must use these exact IDs and names):
```typescript
// src/constants/zones.ts
export const ZONES = [
  { id: 'BLR-N01', name: 'Rajajinagar',    baseKWh: [80, 120]  },
  { id: 'BLR-N02', name: 'Malleshwaram',   baseKWh: [60, 95]   },
  { id: 'BLR-E01', name: 'Indiranagar',    baseKWh: [100, 160] },
  { id: 'BLR-E02', name: 'Whitefield',     baseKWh: [140, 220] },
  { id: 'BLR-E03', name: 'Marathahalli',   baseKWh: [90, 140]  },
  { id: 'BLR-S01', name: 'Jayanagar',      baseKWh: [75, 115]  },
  { id: 'BLR-S02', name: 'BTM Layout',     baseKWh: [85, 130]  },
  { id: 'BLR-S03', name: 'Electronic City',baseKWh: [200, 350] },
  { id: 'BLR-W01', name: 'Vijayanagar',    baseKWh: [70, 110]  },
  { id: 'BLR-W02', name: 'Nagarbhavi',     baseKWh: [55, 85]   },
  { id: 'BLR-C01', name: 'Shivajinagar',   baseKWh: [120, 180] },
  { id: 'BLR-C02', name: 'Ulsoor',         baseKWh: [95, 145]  },
];
```

**Validation checklist**:
- All readings have `isSynthetic: true`
- No negative consumption values
- All timestamps are in ISO 8601 format at exactly 15-minute intervals
- Total readings per meter = 672 (7 days × 96 intervals)
- At least 6 anomaly flags are injected across all meters

---

### Skill 4: `skills/zone-risk-classification/SKILL.md`

**Trigger**: Use this skill when asked to classify a zone's risk level, update risk thresholds, or build/modify the zone risk map component.

**The skill must teach the agent to**:
1. Import thresholds from `src/constants/thresholds.ts` — never hardcode
2. Implement `classifyZoneRisk(zone: ZoneSummary, thresholds: ThresholdConfig): ZoneRiskLevel` in `src/utils/riskClassifier.ts`
3. Classification logic:
   ```
   CRITICAL  → currentLoad > thresholds.criticalKWh
             OR activeAnomalyCount >= 3
             OR any TAMPER_SUSPECTED flag open

   HIGH      → currentLoad > thresholds.highKWh
             OR (forecastLoad > thresholds.highKWh AND peakHoursRemaining < 2)
             OR activeAnomalyCount >= 2

   MODERATE  → currentLoad > thresholds.moderateKWh
             OR activeAnomalyCount >= 1
             OR forecastDeviation > 20%

   LOW       → all other cases
   ```
4. When building or modifying `ZoneRiskMap.tsx`:
   - Use choropleth coloring via CSS variables (`--color-risk-*`)
   - Each zone block must show: zone name, risk badge, current load in kWh
   - CRITICAL zones must have the pulse animation (see `brand-guidelines.md`)
   - Clicking a zone dispatches `setSelectedZone` to Zustand store
5. Document which threshold values drive each zone's classification in a tooltip on the zone card

**Thresholds file skeleton to create** (`src/constants/thresholds.ts`):
```typescript
export interface ThresholdConfig {
  criticalKWh: number;      // default: 300
  highKWh: number;          // default: 200
  moderateKWh: number;      // default: 120
  dropThreshold: number;    // default: 0.60 (60% below baseline)
  spikeThreshold: number;   // default: 1.50 (150% above baseline)
  peerZScoreThreshold: number; // default: 2.0
  consecutiveIntervalsForFlag: number; // default: 4
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = { ... };
```

---

### Skill 5: `skills/explainability-layer/SKILL.md`

**Trigger**: Use this skill whenever an anomaly flag, forecast risk, or zone classification needs a human-readable explanation attached, or when reviewing that all system outputs meet the auditability requirement from the project spec.

**The skill must teach the agent to**:
1. For every `AnomalyFlag`, generate `explanation` using this template:
   ```
   "{MeterID} in {ZoneName}: {anomalyType in plain English} detected.
    Consumption was {deviation}% {above/below} the {baseline type} over
    {N} consecutive intervals from {startTime} to {endTime}."
   ```
2. For every `DemandForecast` with `riskLevel >= HIGH`, generate a `riskReason` string:
   ```
   "Zone {ZoneName} forecast to exceed {threshold} kWh between {startTime}–{endTime}.
    Historical peak on this day/hour: {historicalPeak} kWh."
   ```
3. Add a `<ExplainabilityTooltip>` component that renders on hover for:
   - Every `StatusBadge` in anomaly cards
   - Every risk level shown in zone cards
   - The severity score bar in `AnomalyFlagCard`
4. Enforce: **never display a severity score without also displaying its `explanation`.**
5. Provide an `auditLog` utility: every time a flag is dismissed or confirmed, append to an in-memory audit array:
   ```typescript
   interface AuditEntry {
     timestamp: string;
     flagId: string;
     action: 'DISMISSED' | 'CONFIRMED' | 'REVIEWED';
     reason?: string;
     notes?: string;
   }
   ```
6. Display the audit log in `ZoneDetailPage` under "Anomaly History" as a chronological timeline.

**Validation checklist**:
- No `AnomalyFlag` in the system has `explanation: ''` or `explanation: undefined`
- No severity score is displayed without an accompanying explanation
- Every dismissal adds an entry to the audit log
- `ExplainabilityTooltip` is applied to all risk badges in anomaly cards

---

## How to Create Each Skill File

In Antigravity / your project, run the following for each skill:

1. Create the directory: `skills/<skill-name>/`
2. Create `skills/<skill-name>/SKILL.md` with the frontmatter block and full content from this document
3. Verify the skill file:
   - Has valid YAML frontmatter (`name` and `description` fields)
   - Has all required sections (Context & Constraints, Step-by-Step Instructions, Output Contract, Example, Validation Checklist)
   - References only types from `src/types/meter.ts` and constants from `src/constants/`
   - Does not reference any real BESCOM API, database, or external service

4. Register the skill in `gemini.md` under the "Skills System" section.

---

## Skill Naming Convention

| Skill File Location | Covers |
|---|---|
| `skills/demand-forecasting/SKILL.md` | Forecast generation, time-series modeling |
| `skills/anomaly-detection/SKILL.md` | Detection rules, flag generation |
| `skills/synthetic-data-gen/SKILL.md` | All synthetic data generation |
| `skills/zone-risk-classification/SKILL.md` | Risk classification, zone map |
| `skills/explainability-layer/SKILL.md` | Explanations, audit log, tooltips |

---

## Validation: Are My Skills Well-Written?

After creating each skill, verify it passes this checklist:

- [ ] The `description` field is 1–2 sentences and clearly states the trigger condition
- [ ] Step-by-step instructions are numbered and in logical execution order
- [ ] All referenced file paths match the actual project structure from `gemini.md`
- [ ] All type references match `src/types/meter.ts`
- [ ] The Output Contract section specifies exact return types or file paths
- [ ] The Validation Checklist has at least 4 items
- [ ] The skill contains no hardcoded thresholds (all come from `src/constants/thresholds.ts`)
- [ ] No skill references real BESCOM backend systems or APIs
- [ ] Every skill mentions the `isSynthetic: true` requirement where data is produced
