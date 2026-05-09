# Luxe — Agentic Travel Platform

## What is Luxe?

Luxe is a two-sided agentic travel platform designed for luxury private travel agencies. It combines an AI-powered trip planning workspace (client-facing) with a full customer CRM (operator-facing). Agents run in parallel to handle flight search, hotel curation, itinerary building, and dining reservations — surfacing decisions for human approval, never booking autonomously.

The product was designed to match the aesthetic of [Odylic](https://odylic.co): warm cream/ivory surfaces, Playfair Display editorial serif typography, forest green primary accents, and a refined luxury-concierge tone throughout.

---

## Visual Identity & Design System

### Aesthetic Direction
Luxury editorial. Warm, editorial, tactile. The opposite of dark brutalist SaaS.
- **Reference:** odylic.co — warm cream backgrounds, elegant serif headings, generous white space, understated color
- **Tone:** private concierge, not tech dashboard

### Color Palette (CSS Variables)
```css
--cream:        #f7f2ea   /* primary background */
--ivory:        #fdfaf5   /* sidebar/panel backgrounds */
--warm-white:   #fffef9   /* card surfaces */
--parchment:    #ede6d8   /* decorative accents */
--bark:         #c4a882   /* monetary values, secondary accents */
--forest:       #2d4038   /* primary brand color, CTAs, active states */
--forest-mid:   #3d5248   /* hover state for forest */
--forest-dim:   rgba(45,64,56,0.10)   /* subtle forest tints */
--forest-border:rgba(45,64,56,0.18)   /* borders on selected/active */
--ink:          #1e1a14   /* primary text */
--charcoal:     #3a342a   /* secondary text */
--stone:        #8a8076   /* muted text */
--stone-lt:     #b5aea4   /* labels, timestamps */
--rust:         #9e5b3a   /* research/warning accent */
--sage:         #7a9e88   /* success/confirmed accent */
--border:       rgba(45,64,56,0.12)
--border-lt:    rgba(45,64,56,0.07)
```

### Typography
- **Display / Headings:** `Playfair Display` — italic, weight 400. Used for trip names, client names, KPI values, destination titles, avatar initials.
- **Body / UI:** `Jost` — weight 300/400/500. Used for all labels, metadata, descriptions, inputs.
- **Never use:** Inter, Roboto, Arial, Space Grotesk, or any system font.

### Component Rules
- Cards: `border-radius: 8px`, `border: 1px solid var(--border)`, `background: var(--warm-white)`, subtle `box-shadow` on hover only
- Section labels: `9px`, `font-weight: 500`, `letter-spacing: 0.22em`, `text-transform: uppercase`, `color: var(--stone-lt)`
- Buttons: `border-radius: 5px`, `font-size: 11px`, `letter-spacing: 0.08em`, `text-transform: uppercase`
  - Primary: `background: var(--forest)`, `color: var(--ivory)`
  - Secondary: transparent with `border: 1px solid var(--border)`, `color: var(--stone)`
- Badges: `border-radius: 20px`, `font-size: 9px`, `letter-spacing: 0.07em`, `text-transform: uppercase`
- Scrollbars: `width: 3px`, `background: rgba(45,64,56,0.12)`
- Animations: `fadeUp` (opacity + translateY 8px), duration 0.45s ease, staggered with small delays
- Running agent shimmer: gradient scan line on top border, `2.2s linear infinite`

---

## Application Architecture

### Two Views (tab-switched)
1. **Trip Planning** — traveler/trip-level workspace
2. **Client CRM** — operator-level client management

### Layout Pattern (both views)
```
[Nav 56px]
[Sidebar 230-290px] | [Main content, scrollable] | [Right panel 310-330px]
```

---

## Module 1: Trip Planning

### Purpose
A per-trip workspace where the travel agent (or traveler) can see what agents have done, approve pending decisions, and track the itinerary build in real time.

### Sidebar
- Active trips list with status dots (active = sage, pending = bark, done = stone-lt)
- Completed trips
- Traveler preference profile (display-only, static list)

### Main Content
- **Trip hero:** Playfair italic heading + metadata line (dates, travelers, budget, % committed)
- **Section divider:** 36px bark-colored horizontal rule
- **Agent Pipeline:** 4-column grid of agent cards (Flight, Hotel, Itinerary, Dining)
  - States: `done` (slightly muted), `running` (sage border + shimmer), `wait` (40% opacity)
  - Each card: emoji icon, agent name label, short description of current action
- **Approval banner:** bark-tinted alert for any decision requiring human sign-off. Always shows what the agent recommends and why, with Approve + Alternatives buttons.
- **Committed Decisions grid:** 2-column cards for confirmed and pending bookings
  - Card types: `conf` (sage tint), `pend` (bark tint), `research` (rust tint)
- **Draft Itinerary timeline:** Day-by-day, left-column date (Playfair large number), right column events

### Right Panel
- **Agent Log:** chat-style message feed showing agent actions in chronological order. Two avatar types: orchestrator (✦, forest tint) and system/sub-agent (⚙, sage tint)
- **Agent input:** text field to instruct agents in natural language
- **Budget tracker:** horizontal bar rows per category (Flights, Hotels, Dining, Remaining)
- **Alerts:** warning and info strips for time-sensitive items

---

## Module 2: Client CRM

### Purpose
Operator-side view for managing the client portfolio — trip history, preferences, AI-generated intelligence, and activity timeline per client.

### Sidebar
- Search box + "New" button
- Filter pills: All / VIP / Active / Prospect / Dormant
- Client list rows: avatar initial (color-coded), name, subtext, LTV (italic Playfair), tag chip

### Main Content (Client Profile)
- **Profile header:** large avatar, Playfair italic name, tag chips, contact metadata, action buttons
- **KPI strip:** 4 cards — Lifetime Value, Trips, Avg Trip Value, NPS Score (all with Playfair italic numbers)
- **Inner tabs:** Trip History / Preferences / Notes & Calls / Documents
- **Trip history table:** destination (italic), dates, travelers, value (italic bark), agent pills, status badge

### Right Panel
- **AI Client Intelligence:** 3 insight cards with colored label types
  - `Next Trip Signal` — behavioral prediction + outreach timing recommendation
  - `Spend Pattern` — LTV trend, upgrade behavior, ceiling analysis
  - `Risk Flag` — churn signals, referral gaps, relationship risks
- **Recent Activity:** icon + text feed of all touchpoints (agent actions, calls, bookings, reviews, emails)
- **Quick Note:** inline textarea + save button

---

## Agent Model

Luxe uses a **human-in-the-loop** approval model. Agents propose, humans confirm.

### Agent Types
| Agent | Responsibility |
|---|---|
| Flight Agent | Multi-route search, preference matching (seat, class, time), price optimization |
| Hotel Agent | Property ranking against boutique/chain preference, local validation |
| Itinerary Agent | Day-by-day planning, crowd calendar awareness, routing logic |
| Dining Agent | Reservation holds, waitlist management, fallback alternatives |

### Agent States
- `done` — task complete, result stored
- `running` / `live` — actively executing, shimmer animation shown
- `waiting` — blocked on upstream agent completing first

### Approval Flow
1. Agent completes research and identifies best option
2. Approval banner appears in Trip Planning view with recommendation + rationale
3. Human reviews and clicks "Approve & Book" or "Alternatives"
4. On approval, agent executes booking and logs to activity feed
5. Status updates to `confirmed` in Committed Decisions grid

### Agent Log Format
Each message in the log:
```
[avatar: ✦ orchestrator | ⚙ sub-agent] [message with <em> highlights] [timestamp HH:MM]
```

---

## Tech Stack (TBD / to be defined as project grows)

- **Frontend framework:** to be decided (React strongly implied by component structure)
- **Styling:** CSS custom properties, no utility-first framework — maintain the hand-crafted aesthetic
- **Fonts:** Google Fonts — Playfair Display + Jost
- **Backend / agents:** to be defined
- **Auth:** to be defined

---

## Naming & Branding

- **App name:** Luxe
- **Previous working title:** Voya (discard)
- **Wordmark style:** `Luxe` in Playfair Display italic + small superscript `AI` in Jost, colored `var(--bark)`
- **Tagline direction:** private travel, elevated by agents

---

## Key UX Principles

1. **Agents propose, humans approve.** Nothing books without explicit user confirmation.
2. **Preferences are first-class.** All agents filter against the traveler profile automatically — no re-entry.
3. **The operator sees everything.** The CRM surfaces agent actions, not just trip outcomes. Every agent decision is visible in the activity feed.
4. **AI intelligence is proactive.** The CRM tells the operator when to reach out next and why, before the client thinks to ask.
5. **Warm, not cold.** Every design decision should reinforce the concierge metaphor, not the SaaS dashboard metaphor.

---

## File Structure (initial, to be populated)

```
luxe/
├── CLAUDE.md              ← this file
├── README.md
├── package.json
├── src/
│   ├── app/               ← Next.js app dir (if applicable)
│   ├── components/
│   │   ├── trip/          ← Trip Planning module components
│   │   │   ├── AgentPipeline.tsx
│   │   │   ├── ApprovalBanner.tsx
│   │   │   ├── ItineraryTimeline.tsx
│   │   │   ├── AgentLog.tsx
│   │   │   └── BudgetTracker.tsx
│   │   ├── crm/           ← CRM module components
│   │   │   ├── ClientList.tsx
│   │   │   ├── ClientProfile.tsx
│   │   │   ├── KPIStrip.tsx
│   │   │   ├── AIIntelligence.tsx
│   │   │   └── ActivityFeed.tsx
│   │   └── shared/        ← Shared UI primitives
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Nav.tsx
│   ├── styles/
│   │   └── tokens.css     ← CSS custom properties (design tokens)
│   └── lib/
│       └── agents/        ← Agent orchestration logic
├── public/
└── design/
    └── prototype.html     ← Static HTML prototype (reference)
```

---

## Reference Prototype

The initial full-fidelity HTML prototype lives in `design/prototype.html`. It covers both views (Trip Planning + Client CRM) with all interactions, animations, and the full Odylic-inspired design system. Use it as the visual source of truth when building components.

Built with: plain HTML/CSS/JS, no framework — purely for design reference.
