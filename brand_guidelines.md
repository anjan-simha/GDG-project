# GridSense AI — Brand Guidelines

## BESCOM Smart Meter Intelligence Platform

---

## 01. Brand Identity

### Name

**GridSense AI**
Tagline: _"See the Grid. Before It Breaks."_

### Brand Personality

GridSense AI operates at the intersection of infrastructure trust and cutting-edge intelligence. The brand is:

- **Authoritative** — trusted by grid operators making critical decisions
- **Precise** — every number and alert carries weight
- **Clear** — complex data made immediately understandable
- **Vigilant** — always watching, always ready to surface what matters

The brand is NOT playful, casual, or consumer-facing. It serves engineers, grid operators, and BESCOM inspectors. Every visual and copy decision should feel like it belongs in a control room.

---

## 02. Logo & Mark

### Wordmark

- **GridSense** — set in `Space Mono` Bold (monospaced, technical precision)
- **AI** — set in `Space Mono` Regular, offset slightly smaller, in Electric Cyan (#00E5FF)
- A thin horizontal circuit-line accent underlining "Grid" in Electric Cyan

### Icon Mark

A simplified hexagonal grid node — a filled hexagon with a pulse radiating outward. Represents a smart meter node pulsing data into the network.

### Usage Rules

- Minimum size: 120px wide for digital
- Never rotate the logo
- Never place on backgrounds with less than 4.5:1 contrast ratio
- Approved on: Deep Navy, Off-White, Dark Slate

---

## 03. Color System

All colors are defined as CSS variables and must be referenced by variable name in code — never by hex directly.

```css
:root {
  /* Primary Palette */
  --color-grid-navy: #0a1628; /* Primary background — deep control room navy */
  --color-grid-slate: #111d35; /* Secondary surface — panels, cards */
  --color-grid-panel: #1a2744; /* Elevated card surfaces */

  /* Accent — Energy & Action */
  --color-cyan-electric: #00e5ff; /* Primary CTA, highlights, chart lines */
  --color-cyan-dim: #0097a7; /* Secondary accents, hover states */

  /* Semantic — Status Colors */
  --color-risk-low: #10b981; /* Zone OK / No alert — Emerald Green */
  --color-risk-moderate: #f59e0b; /* Caution / watch zone — Amber */
  --color-risk-high: #ef4444; /* High load / anomaly — Alert Red */
  --color-risk-critical: #dc2626; /* Critical — deep red, urgent action needed */

  /* Data Visualization */
  --color-forecast-line: #00e5ff; /* Predicted demand line */
  --color-actual-line: #a78bfa; /* Actual consumption line — violet */
  --color-baseline-line: #6b7280; /* 7-day rolling average — neutral gray */
  --color-anomaly-marker: #f59e0b; /* Flagged point marker */
  --color-theft-marker: #ef4444; /* Confirmed theft/tamper marker */

  /* Text */
  --color-text-primary: #e2e8f0; /* Body text on dark */
  --color-text-secondary: #94a3b8; /* Labels, captions */
  --color-text-muted: #475569; /* Disabled, placeholder */
  --color-text-inverse: #0a1628; /* Text on light/cyan backgrounds */

  /* Borders & Dividers */
  --color-border-subtle: #1e3a5f; /* Subtle card borders */
  --color-border-active: #00e5ff; /* Focused / selected state borders */
}
```

### Color Rules

- **Never use pure black or pure white** — use `--color-grid-navy` and `--color-text-primary` instead.
- **Cyan is for action** — primary buttons, active states, selected chart lines only.
- **Risk colors are sacred** — never repurpose `--color-risk-high` (red) for anything other than alerts and high-risk indicators.
- **Use the baseline gray** for historical/average data to visually separate it from predictions.

---

## 04. Typography

```css
/* Import in index.css */
@import url("https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap");
```

| Role                    | Font           | Weight | Size                      |
| ----------------------- | -------------- | ------ | ------------------------- |
| Logo / Wordmark         | Space Mono     | 700    | —                         |
| Page Headings (H1)      | Space Mono     | 700    | 2rem / 32px               |
| Section Headings (H2)   | DM Sans        | 600    | 1.5rem / 24px             |
| Card Titles (H3)        | DM Sans        | 500    | 1.125rem / 18px           |
| Body / Labels           | DM Sans        | 400    | 0.875rem / 14px           |
| Data Values / KPIs      | Space Mono     | 700    | varies (24–48px)          |
| Code / IDs / Timestamps | JetBrains Mono | 400    | 0.75rem / 12px            |
| Alert Descriptions      | DM Sans        | 400    | 0.875rem / 14px           |
| Status Badges           | DM Sans        | 500    | 0.75rem / 12px, uppercase |

### Typography Rules

- **KPI numbers and meter readings always use Space Mono** — the monospaced typeface prevents number-column jumping.
- **Never use Inter, Roboto, or Arial.**
- **Heading hierarchy is strict** — one H1 per page, H2 for major sections, H3 for cards only.
- **Line height**: 1.6 for body, 1.2 for headings, 1.0 for data values.

---

## 05. Spacing & Layout

Based on a **4px base unit**. All spacing values are multiples of 4.

```
4px   → xs  — icon padding, tight gaps
8px   → sm  — inline element gaps
12px  → md  — between label and value
16px  → lg  — card internal padding
24px  → xl  — section gaps
32px  → 2xl — page section separators
48px  → 3xl — major layout divisions
64px  → 4xl — hero / top-level gaps
```

### Layout System

- **Sidebar width**: 240px (collapsed: 64px)
- **Main content max-width**: 1440px
- **Card border-radius**: 8px (panels), 4px (badges/tags)
- **Grid layout**: 12-column, 24px gutter
- Dashboard uses a **3-column card grid** on ≥1280px, 2-column on ≥768px, 1-column on mobile.

---

## 06. Component Design Language

### Cards / Panels

- Background: `--color-grid-panel` (`#1A2744`)
- Border: 1px solid `--color-border-subtle`
- Border-radius: 8px
- Box shadow: `0 4px 24px rgba(0, 229, 255, 0.04)` — subtle cyan glow
- On hover (interactive cards): border transitions to `--color-border-active`

### Status Badges

```
LOW risk      → bg: rgba(16,185,129,0.15)  text: #10B981  border: #10B981
MODERATE risk → bg: rgba(245,158,11,0.15)  text: #F59E0B  border: #F59E0B
HIGH risk     → bg: rgba(239,68,68,0.15)   text: #EF4444  border: #EF4444
CRITICAL      → bg: rgba(220,38,38,0.20)   text: #DC2626  border: #DC2626 + pulse animation
```

### Buttons

- **Primary**: bg `--color-cyan-electric`, text `--color-text-inverse`, border-radius 4px
- **Secondary**: transparent bg, border `--color-border-active`, text `--color-cyan-electric`
- **Danger**: bg `--color-risk-high`, text white — only for confirm-delete or escalate actions
- **Ghost**: no border, text `--color-text-secondary`, hover text `--color-text-primary`

### Alert Cards (Anomaly Flags)

- Left border: 3px solid semantic color (amber for suspected, red for confirmed)
- Dismissal button always visible with a neutral ghost style
- Always shows: severity score, explanation, false-positive risk badge

### Charts

- Background: transparent (sits on panel background)
- Grid lines: `--color-border-subtle`, dashed
- Axis labels: `--color-text-muted`, JetBrains Mono 11px
- Tooltip: bg `--color-grid-slate`, border `--color-border-active`, rounded 4px
- Always include a **baseline reference line** in gray

---

## 07. Iconography

Use **Lucide React** icon set exclusively.

| Context               | Icon                            |
| --------------------- | ------------------------------- |
| Dashboard / Overview  | `LayoutDashboard`               |
| Demand Forecast       | `TrendingUp`                    |
| Anomaly / Alert       | `AlertTriangle`                 |
| Theft Suspected       | `ShieldAlert`                   |
| Zone / Map            | `Map`                           |
| Meter / Device        | `Gauge`                         |
| Inspection Needed     | `ClipboardCheck`                |
| Dismissed             | `XCircle`                       |
| Confirmed             | `CheckCircle2`                  |
| Loading               | `Loader2` (with spin animation) |
| Settings / Thresholds | `SlidersHorizontal`             |

Icon sizes: 16px inline, 20px cards, 24px nav.

---

## 08. Motion & Animation

- **Entrance**: Cards fade + slide up 8px over 300ms, `ease-out`. Stagger children by 50ms.
- **Alert pulse** (CRITICAL only): `@keyframes pulse` — box-shadow cycles between 0 and `0 0 0 6px rgba(220,38,38,0.2)` every 2s.
- **Chart lines**: Draw in from left over 800ms using `stroke-dashoffset` animation.
- **Badge transitions**: 150ms `ease-in-out` for color/border changes.
- **Loading skeleton**: Shimmer animation from left-to-right, `--color-grid-panel` to `--color-grid-slate`.
- **No bounce, elastic, or spring animations** — this is a control room, not a consumer app.

---

## 09. Data Visualization Conventions

- **Demand Forecast chart** always shows 3 lines: Predicted (cyan), Actual (violet), Baseline (gray).
- **Anomaly markers** are diamond-shaped (◆) plotted on the timeline at the flagged timestamp.
- **Zone risk map** uses choropleth coloring from `--color-risk-low` → `--color-risk-critical`.
- **Confidence intervals** rendered as semi-transparent fill (10% opacity) around the forecast line.
- **Y-axis** always labeled with units (kWh / interval).
- **X-axis** uses timestamps in `HH:mm DD MMM` format (JetBrains Mono).

---

## 10. Tone of Voice (Copy Guidelines)

| Situation         | Tone                | Example                                                                    |
| ----------------- | ------------------- | -------------------------------------------------------------------------- |
| Alert headlines   | Direct, factual     | "Tamper Suspected — Meter BLR-0421"                                        |
| Alert explanation | Clear, non-alarmist | "Consumption dropped 78% below peer average over 6 consecutive intervals." |
| Dashboard labels  | Concise nouns       | "Zone Load Risk", "Forecast Accuracy", "Open Flags"                        |
| Empty states      | Calm, informative   | "No anomalies detected in the last 24 hours."                              |
| Tooltips          | Minimal, precise    | "Predicted: 42.3 kWh · Actual: 39.1 kWh · Δ 7.6%"                          |
| Error states      | Transparent         | "Data unavailable for Zone KR-07. Last synced 3h ago."                     |
| Button labels     | Verb-first          | "Review Flag", "Dismiss", "View Zone", "Export Report"                     |

**Never use**: "AI thinks", "the model believes", "smart detection". Use: "Flagged by rule", "Statistical deviation detected", "Peer comparison threshold exceeded."

---

## 11. Accessibility

- All interactive elements must have ARIA labels.
- Color is never the sole indicator of status — always pair with an icon and text.
- Minimum touch target: 44×44px.
- Focus states: 2px solid `--color-cyan-electric` outline, 2px offset.
- Contrast ratio: All text meets WCAG AA (4.5:1 minimum).
