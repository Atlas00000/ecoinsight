## UI Theme – Cloudy, Glassy, Milky (ESG-focused)

### Theme concept
- Cloudy–Glassy–Milky: soft, translucent glass layers floating over cloudy gradients; organic shapes and wavy separators avoid “boxed” layouts.

### Color system (non-generic, ESG-aligned)
- Primary (Nature): Leaf Green #2EA44F, Moss #1F7A3A, Fern #5EC26A
- Secondary (Water/Air): Ocean #0E7490, Teal Mist #22D3EE, Sky #38BDF8
- Accents (Ethics/Alerts): Amber (Warn) #F59E0B, Coral (Action) #F97316, Mulberry (Highlight) #C026D3
- Neutrals (Milky base): Milk #F9FAFB, Mist #EEF2F7, Slate #334155, Charcoal #0B1220
- Gradients: Leaf→Fern (success), Ocean→Sky (info), Amber→Coral (attention). Subtle cloudy noise beneath glass.

### Surfaces & shape language
- Glass panels: backdrop-filter blur(12–16px), 4–6% white overlay, hairline borders rgba(255,255,255,0.25), inner highlight.
- Organic layout: curved section dividers, blob masks, pill cards, 16–24px radii; soft elevation (y=12–24, ~10–14% shadow).
- Cloud layers: gentle animated parallax (1–3%).

### Typography
- Humanist sans (Inter/SF/Space Grotesk). Titles 28–40/1.15, body 14–16/1.6, mono subset for KPI numerals.
- Calm weight progression (600→400), generous letter-spacing on labels.

### Motion & interaction (polished, minimal)
- Durations: micro 180–220ms, standard 240–300ms; spring enter (stiffness ~220, damping ~26).
- Micro-interactions:
  - KPI count-up on mount; pulse dot for “live” (only when source=live).
  - Mini-charts: hover lift; line thickens with soft glow.
  - ESG score ring: sweep + tick easing; color bands by score.
  - Health ribbon: slide-in; service chips reflect `/health` status.
- Feedback:
  - 429: non-blocking toast with retry countdown.
  - 503 (live): inline card state with cloud overlay and reason.

### Sections (non-boxy compositions)
- Hero KPI strip: floating pill chips (health, uptime, climate total, ESG total) on wavy cloudy gradient; mild parallax.
- Your Climate Snapshot: large curved card with location chip; two glass sub-cards (Weather, AQ). Live/cache badge, timestamp, source.
- Time-series overview: horizontal “glass strip” mini-charts; reveal avg/min/max bands from `/timeseries` on scroll.
- ESG highlights: mosaic of organic tiles (logo/initials, score ring, year); staggered entrance.
- Recent climate activity: timeline ribbon with pinned dots; expand on hover for detail.
- API health ribbon: sticky micro-chips for Mongo/Timescale/Redis; color-coded states from `/health`.
- Auth CTA: soft glass modal; friendly success/error micro-animations.

### Accessibility & performance
- WCAG AA contrast; colorblind-safe pairings.
- Reduced-motion: disable parallax/shimmer; keep strong focus rings.
- Mobile: reduce blur/layers; lazy-load charts; use transform-based animations.

### Dark/eco-night mode
- Background: Charcoal #0B1220 with Ocean/Sky nebula gradients; glass darkens (rgba(0,0,0,0.35)).
- Text/icons shift to cool neutrals; greens remain saturated for state cues.

### Backend “hug” mappings (data-driven UI)
- KPIs: `/health` (status/responseTime), totals from `/climate` and `/sustainability/esg` lists (pagination.total).
- Snapshot: `/climate/weather/live`, `/climate/air-quality/live` (visualize live vs cache; render 503/429 states elegantly).
- Time-series: `/timeseries` avg/min/max; user-controlled bucket (1h/6h/24h).
- ESG: `/sustainability/esg` and `/sustainability/metrics` for tiles and aggregates.
- Status badges: use `source`, `timestamp`, and `upstreamStatus` when present.

### Animation/easing guidelines
- Easing: cubic-bezier(0.22, 1, 0.36, 1) for ease-out.
- At most two concurrent motions per section; prioritize data changes over decor.

