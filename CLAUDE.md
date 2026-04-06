# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install   # install dependencies (express, ws)
npm start     # start server on port 3000
```

No build step, no tests, no linter configured.

## Architecture

A single-process Node.js server (`server.js`) holds all game state in memory, persists it to `state.json`, and syncs it to every connected browser in real time via native WebSocket (`ws` package — not Socket.IO).

**State model** (persisted to `state.json`, survives restarts):
```js
{ player1: { name, lore, wins }, player2: { name, lore, wins } }
```
Lore is clamped 0–20; wins 0–2.

**WebSocket event contract:**
- Server → all clients: `{ type: 'state', data: <full state> }` — on every change and on new connection
- Client → server: `{ type: 'setName', player, value }`, `{ type: 'adjustLore', player, delta }`, `{ type: 'adjustWins', player, delta }`, `{ type: 'resetLore' }`, `{ type: 'fullReset' }`

**Pages** (all static HTML in `public/`, no framework):
| File | Purpose |
|------|---------|
| `overlay.html` | OBS browser source (1920×1080, transparent centre — 280px panels on each side) |
| `controller.html` | Mobile split-screen: Player 1 left (normal), Player 2 right (rotated 180°), landscape-only |
| `index.html` | Setup page — generates QR codes client-side using `window.location.host` and renders OBS instructions |

All three pages connect via `new WebSocket(\`ws://${location.host}\`)`. The overlay is read-only; the controller emits mutations; the setup page has no socket connection.

## Visual Design

Both `overlay.html` and `controller.html` share a consistent design language.

**Color tokens:**
```
--gold:        #d3ba84   (Illuminary Gold — buttons, accents)
--parchment:   #e3caa8   (Parchment — tertiary)
--parchment-l: #f0dfc8   (lighter parchment / text)
--purple:      #2A275C   (primary brand)
--purple-deep: #1a1840
--purple-mid:  #322f6e
--beige:       #e3caa8   (alias for parchment)
--beige-l:     #f0dfc8
--beige-d:     #d3ba84   (alias for gold)
```

**Typography:**
- Overlay body font: **Chakra Petch** (monospace-adjacent, for the techy panel feel)
- Labels, names, numbers: **Jost** (weights 300–800, geometric sans-serif)
- Player names: Jost weight 800, 24px (with JS autofit shrink down to 11px)
- Labels: weight 600, letter-spacing 4–5px, uppercase, gold color
- Lore numbers (controller): Jost weight 800, clamp(56px, 14vw, 100px)

**Overlay panels** (`overlay.html`):
- 280px wide panels on left and right edges of 1920×1080 canvas
- Gradient background: purple-mid → purple → purple-deep (top to bottom)
- Top accent bar: 3px gold gradient line with glow; shimmers on winner state
- Bottom accent bar: 2px parchment gradient line
- Beige lore ladder: 40px wide `<div>` absolutely positioned (right edge P1, left edge P2), spans full panel height
  - Gradient: gold top → parchment → lighter parchment → parchment (bottom)
  - 21 rungs (0–20), flex-direction: column-reverse so 20 is at top
  - Inactive rungs: muted purple text on beige
  - Past rungs: slightly more opaque purple text
  - Current rung: parchment-l background, dark purple text, pulsing glow
  - Near-win (lore ≥ 15): gold glow intensifies on current rung
  - Max/winner (lore = 20): purple-deep background, parchment-l text, faster pulse
- Content padded away from ladder: `padding-right/left: 44px`
- Winner state: `.winner-badge` shown ("✦ WINNER ✦"), top accent shimmer animation
- Player name autofit: JS shrinks font-size from 24px down if text overflows

**Lore icon background pattern** (`overlay.html`):
- File: `public/lore-icon.png` (actual Lorcana lore icon PNG)
- Rendered as SVG `<image>` elements with CSS filter chain:
  `invert(1) sepia(0.6) hue-rotate(10deg) saturate(0.8)` + `mix-blend-mode: screen`
- 18 icons per panel, seeded deterministic placement (LCG)
- Float upward with sinusoidal sway (±20–45px), 24–52s cycle
- Opacity: fade in 0→2%, hold at 2% through middle, fade out to 0 near top
- Seeds: panel1 = `0xDEADBEEF`, panel2 = `0xCAFEBABE`

**Controller** (`controller.html`):
- `position: fixed; inset: 0` layout, `viewport-fit=cover` for edge-to-edge on notched phones
- Safe-area padding on `.game-layout`: `env(safe-area-inset-left/right)`
- P2 half rotated 180° so both players can hold the phone from opposite ends
- Gold gradient buttons for primary actions (+ lore, + win); dark purple for secondary (− lore, − win)
- Lore number animates: scale up + brighten on increase, scale down + mute on decrease
- Progress bar below lore number (gold gradient, glows hot at lore ≥ 15)
- Winner flash overlay per half (shows "✦ WINNER ✦" at lore = 20)
- Connection dot: gold when connected, red when disconnected
- Center divider (56px) with "VS" label and "New Match" button (full reset)
