# GridSense AI — Web App Build Prompt
## React + TypeScript · Vite · Tailwind CSS

---

## 🎯 Project Goal

Build **GridSense AI**, a fully functional decision-support web application for BESCOM's Smart Meter Intelligence & Loss Detection system. This is a **read-only analytics and alerting dashboard** — it does not write to any backend systems. All data is synthetic/masked as required by the project specification.

Refer to:
- `gemini.md` — for coding conventions, data schemas, and agent behavior rules
- `brand-guidelines.md` — for all design, color, typography, and component decisions

---

## 🏗️ Project Initialization

```bash
npm create vite@latest gridsense-ai -- --template react-ts
cd gridsense-ai
npm install tailwindcss postcss autoprefixer lucide-react recharts zustand date-fns
npx tailwindcss init -p
```

Configure `tailwind.config.js` to extend the GridSense color tokens from `brand-guidelines.md`. Register all CSS variables in `src/index.css`.

---

## 📁 File Structure to Generate

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── PageWrapper.tsx
│   ├── dashboard/
│   │   ├── KPICard.tsx
│   │   ├── ZoneRiskGrid.tsx
│   │   └── SystemStatusBar.tsx
│   ├── forecasting/
│   │   ├── DemandForecastChart.tsx
│   │   ├── ZoneRiskMap.tsx
│   │   └── ForecastTable.tsx
│   ├── anomalies/
│   │   ├── AnomalyFlagCard.tsx
│   │   ├── AnomalyTimeline.tsx
│   │   ├── DismissModal.tsx
│   │   └── AnomalyFilters.tsx
│   └── shared/
│       ├── StatusBadge.tsx
│       ├── RiskIndicator.tsx
│       ├── SkeletonLoader.tsx
│       └── EmptyState.tsx
├── pages/
│   ├── DashboardPage.tsx
│   ├── ForecastingPage.tsx
│   ├── AnomalyPage.tsx
│   ├── ZoneDetailPage.tsx
│   └── SettingsPage.tsx
├── hooks/
│   ├── useMeterData.ts
│   ├── useForecasts.ts
│   ├── useAnomalies.ts
│   └── useZoneRisk.ts
├── services/
│   └── dataService.ts
├── data/
│   └── generators/
│       ├── generateMeterReadings.ts
│       ├── generateForecasts.ts
│       ├── injectAnomalies.ts
│       └── index.ts
├── types/
│   └── meter.ts
├── constants/
│   ├── zones.ts
│   ├── thresholds.ts
│   └── config.ts
├── store/
│   └── useAppStore.ts
└── utils/
    ├── statistics.ts
    ├── formatters.ts
    └── riskClassifier.ts
```

---

## 📊 Page 1 — Dashboard (`/`)

### Purpose
Command-center overview of the entire BESCOM distribution network. First thing operators see when they open the app.

### Layout
- **Top bar**: GridSense AI logo, current date/time (live), system health indicator.
- **KPI row** (4 cards across the top):
  1. **Total Zones Monitored** — numeric count
  2. **High-Risk Zones** — count with red badge, delta from yesterday
  3. **Open Anomaly Flags** — count with amber badge, delta from last week
  4. **Forecast Accuracy (Last 24h)** — percentage in cyan
- **Zone Risk Grid** — a responsive grid of all zones, each shown as a card with:
  - Zone ID and name
  - Current load (kWh)
  - Risk level badge (LOW / MODERATE / HIGH / CRITICAL) color-coded
  - Sparkline of last 6 hours consumption
  - "View Detail →" link
- **Recent Anomaly Flags** — last 5 flags in a vertical list (compact version of AnomalyFlagCard)
- **System Status Bar** (bottom): last data sync timestamp, number of active meters, data freshness indicator

### Data Requirements
Generate synthetic data for 12 zones. Each zone has:
- A zone ID (`BLR-N01` to `BLR-N12`)
- A name (e.g., Rajajinagar, Indiranagar, Whitefield, etc. — real Bangalore localities)
- Current simulated load
- Randomly assigned risk level (weighted: 60% LOW, 25% MODERATE, 12% HIGH, 3% CRITICAL)

---

## 📈 Page 2 — Demand Forecasting (`/forecasting`)

### Purpose
Short-term electricity demand forecast at zone level. Helps operators anticipate load spikes before they happen.

### Layout
- **Zone selector** — dropdown to select one of the 12 zones
- **Time horizon selector** — toggle between "Next 6 Hours", "Next 24 Hours", "Day-Ahead (48h)"
- **Main Chart** — `DemandForecastChart` — a line chart using Recharts showing:
  - **Predicted line** (cyan, `--color-forecast-line`)
  - **Actual line** (violet, `--color-actual-line`) — available for past intervals only
  - **Baseline line** (gray dashed, 7-day rolling average, `--color-baseline-line`)
  - **Confidence band** — semi-transparent fill (10% opacity) around the predicted line
  - **Anomaly markers** — diamond markers at flagged timestamps
  - X-axis: 15-minute interval timestamps
  - Y-axis: kWh
  - Custom tooltip showing all three values + deviation %
- **Forecast Summary Table** below the chart:
  - Columns: Time, Predicted (kWh), Actual (kWh), Deviation (%), Baseline (kWh), Risk
  - Color-coded Deviation column
- **Zone Risk Map panel** (right sidebar on ≥1280px, below chart on mobile):
  - 12 zone blocks laid out geographically (approximate Bangalore N/S/E/W layout)
  - Choropleth-style coloring by risk level
  - Clicking a zone updates the main chart

### Forecasting Algorithm (Frontend Simulation)
Implement a `generateForecasts.ts` utility that simulates demand:
```typescript
// [SYNTHETIC DATA]
// Method: Seasonal decomposition simulation
// Base demand per zone × time-of-day multiplier × day-of-week multiplier × noise
// Time-of-day multipliers: morning peak (7–9am ×1.4), evening peak (6–9pm ×1.6),
//                          off-peak (11pm–5am ×0.5), midday ×1.1
// Inject one "demand spike" event per zone per week for high-risk zone testing
```
Expose `predictedKWh`, `confidenceLow`, `confidenceHigh`, `baselineKWh`, and `riskLevel` per interval.

---

## 🚨 Page 3 — Anomaly & Theft Detection (`/anomalies`)

### Purpose
Full list of detected anomaly flags with filtering, detail view, and dismissal workflow.

### Layout
- **Filter bar** at top:
  - Anomaly Type (multi-select checkboxes)
  - Severity (slider: 0–100)
  - Status (Open / Under Review / Dismissed / Confirmed) — tabs
  - Zone (dropdown)
  - Date range picker
  - "Reset Filters" ghost button
- **Anomaly Flag Cards** — vertical list. Each `AnomalyFlagCard` shows:
  - Left accent border color (amber = suspected, red = confirmed)
  - Header: `[ANOMALY_TYPE]` badge + Meter ID (JetBrains Mono) + Zone
  - Timestamp detected
  - **Explanation** paragraph — e.g., "Consumption dropped 78% below peer average over 6 consecutive 15-minute intervals."
  - **Severity score bar** (0–100 progress bar, color-coded)
  - **Contributing features** — tags: e.g., "Peer Deviation", "Consecutive Drop", "Nighttime Pattern"
  - **Deviation from baseline** — e.g., "−78% vs 7-day average"
  - **False Positive Risk** badge (LOW / MEDIUM / HIGH)
  - Action row: `[Review]` button (primary) · `[Dismiss ↓]` ghost button · `[View Meter]` ghost link
- **Dismissal Modal** — triggered by "Dismiss" button:
  - Reason code select (options: "Seasonal Event", "Known Maintenance", "Data Gap", "Peer Group Error", "Other")
  - Optional notes textarea
  - "Confirm Dismiss" danger button · "Cancel" ghost button
  - On confirm: flag status changes to DISMISSED, card greyed out and collapsed

### Anomaly Injection (`injectAnomalies.ts`)

Generate at least the following synthetic anomaly types across meters:
```typescript
// [SYNTHETIC DATA]
// 1. SUDDEN_DROP: 3 meters show 70–90% drop for 4–8 intervals
// 2. SUDDEN_SPIKE: 2 meters show 200–300% above baseline for 2–4 intervals
// 3. CONSISTENT_UNDERREPORT: 1 meter shows 15–25% below peer consistently for 30+ days
// 4. NIGHT_USAGE_ANOMALY: 2 meters show unusual usage between 1am–4am
// 5. PEER_DEVIATION: 4 meters deviate >2 standard deviations from zone average
// 6. TAMPER_SUSPECTED: 1 meter shows CONSISTENT_UNDERREPORT + SUDDEN_DROP pattern combined
```
Each injected anomaly must produce a fully populated `AnomalyFlag` object including a human-readable `explanation` and `contributingFeatures`.

---

## 🗺️ Page 4 — Zone Detail (`/zones/:zoneId`)

### Purpose
Deep dive into a single zone's performance, meter list, and anomaly history.

### Layout
- **Zone header**: Zone name, current risk badge, last updated timestamp
- **Zone KPIs** (3 cards): Current Load, Forecast Load (next hour), Active Anomalies
- **Demand chart** (same as Forecasting page chart, pre-filtered to this zone)
- **Meter List table**:
  - Columns: Meter ID, Current kWh, 24h Average, Status (Normal / Flagged / Suspected), Last Reading
  - Meter ID in JetBrains Mono
  - Status column uses `StatusBadge`
  - Clicking a meter row expands an inline sub-row showing the last 10 readings as a mini sparkline + last anomaly flag if any
- **Zone Anomaly History** — filterable timeline of past flags for this zone

---

## ⚙️ Page 5 — Settings (`/settings`)

### Purpose
Expose all configurable thresholds so operators can tune detection sensitivity without code changes.

### Layout
- **Anomaly Detection Thresholds** section:
  - Sudden Drop threshold (% below peer): number input, default 60%
  - Sudden Spike threshold (% above baseline): number input, default 150%
  - Peer deviation Z-score threshold: number input, default 2.0
  - Consecutive anomalous intervals before flag: number input, default 4
- **Demand Forecast Settings**:
  - Forecast horizon: 6h / 24h / 48h toggle
  - Risk threshold for HIGH zone: number input (kWh)
  - Risk threshold for CRITICAL zone: number input (kWh)
- **Display Settings**:
  - Baseline type: 7-day average / 30-day average / Peer median
  - Auto-refresh interval: 1min / 5min / 15min / Off
- All settings saved to localStorage (for demo persistence)
- "Reset to Defaults" danger button at bottom
- "Save Changes" primary button — shows toast confirmation

---

## 🧩 Shared Components Detail

### `StatusBadge.tsx`
```tsx
// Props: status: ZoneRiskLevel | AnomalyStatus | FalsePositiveRisk, size?: 'sm' | 'md'
// Renders a pill badge with correct background/text/border from brand-guidelines.md
// Always includes an icon (Lucide) alongside the text label
```

### `KPICard.tsx`
```tsx
// Props: title, value, unit?, delta?, deltaDirection?, icon, accentColor?
// Large Space Mono number display
// Optional delta row: "+3 from yesterday" with up/down arrow icon
// Subtle cyan glow border on hover
```

### `SkeletonLoader.tsx`
```tsx
// Renders animated shimmer placeholders
// Props: rows?, height?, width?
// Used while synthetic data is "loading" (simulated 800ms delay on mount)
```

### `EmptyState.tsx`
```tsx
// Props: icon, title, description, actionLabel?, onAction?
// Used for: no anomalies, no data for zone, no results after filter
// Centered layout, muted colors, optional action button
```

---

## 🔁 State Management (`useAppStore.ts`)

Use Zustand. Store shape:
```typescript
interface AppStore {
  selectedZone: string | null;
  setSelectedZone: (zoneId: string | null) => void;

  forecastHorizon: '6h' | '24h' | '48h';
  setForecastHorizon: (h: '6h' | '24h' | '48h') => void;

  anomalyFilters: AnomalyFilters;
  setAnomalyFilters: (filters: Partial<AnomalyFilters>) => void;

  thresholds: ThresholdConfig;
  updateThreshold: (key: keyof ThresholdConfig, value: number) => void;

  anomalyFlags: AnomalyFlag[];
  dismissFlag: (flagId: string, reason: string, notes?: string) => void;
  confirmFlag: (flagId: string) => void;
}
```

---

## 🎨 Design Implementation Rules

Follow `brand-guidelines.md` strictly. Key reminders:
- App background: `--color-grid-navy` (`#0A1628`)
- Card surfaces: `--color-grid-panel` (`#1A2744`)
- Primary accent: `--color-cyan-electric` (`#00E5FF`)
- All headings: Space Mono
- All body/label text: DM Sans
- All data values / IDs / timestamps: JetBrains Mono
- Import fonts from Google Fonts in `index.css`
- CRITICAL status badges must have the pulse animation
- All charts must include the gray baseline reference line
- Entrance animations: fade + 8px slide-up, stagger cards by 50ms

---

## 🧪 Synthetic Data Generation

In `src/data/generators/index.ts`, export a `seedGridSenseData()` function that:
1. Generates 12 zones with metadata
2. For each zone, generates 4 meters
3. For each meter, generates 7 days × 96 intervals (15-min) of consumption readings
4. Applies time-of-day and day-of-week multipliers
5. Injects the 6 anomaly scenarios listed in Page 3
6. Calculates rolling 7-day averages as baselines
7. Generates demand forecasts for the next 48h
8. Returns `{ zones, meters, readings, forecasts, anomalyFlags }`

Mark every object with `isSynthetic: true`. Console.log a banner on app start:
```
[GRIDSENSE AI] ⚡ Running on SYNTHETIC data only. No real BESCOM data in use.
```

---

## 🚦 Routing

Use React Router v6:
```
/ → DashboardPage
/forecasting → ForecastingPage
/anomalies → AnomalyPage
/zones/:zoneId → ZoneDetailPage
/settings → SettingsPage
```

Sidebar navigation links to all five routes. Active route highlighted with cyan left border and `--color-cyan-electric` text.

---

## ✅ Definition of Done

The app is complete when:
- [ ] All 5 pages render without errors
- [ ] Synthetic data loads on app start with realistic BESCOM-style values
- [ ] Demand forecast chart shows all 3 lines (predicted / actual / baseline) with correct colors
- [ ] At least 6 distinct anomaly types are present in the anomaly list
- [ ] Dismissal modal works end-to-end (dismiss → reason → flag changes to DISMISSED)
- [ ] All risk badges use correct semantic colors from brand-guidelines.md
- [ ] Zone detail page loads when clicking any zone
- [ ] Settings page reads/writes to localStorage correctly
- [ ] No TypeScript errors (`npx tsc --noEmit` passes cleanly)
- [ ] All anomaly flags have a non-empty `explanation` string
- [ ] Baseline reference line is present on every chart
- [ ] SYNTHETIC data banner logs on startup
- [ ] Responsive layout works at 768px, 1024px, and 1440px widths
