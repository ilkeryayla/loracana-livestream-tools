# Lorcana Livestream Tools

Real-time stream overlay and mobile controller for Lorcana TCG game nights, built for **Lore Seekers Almere**. Tracks lore (0–20) and wins (0–2) per player and syncs everything live to OBS.

## How it works

A lightweight Node.js server holds the game state and broadcasts it to all connected browsers over WebSocket. The overlay displays on stream via OBS; the controller is opened on a shared phone placed between the two players. Any change on the controller instantly updates the overlay.

State persists to `state.json` so a server restart doesn't wipe the score mid-game.

## Setup

**Requirements:** Node.js 18+, all devices on the same Wi-Fi network.

```bash
npm install
npm start
```

The server prints your local IP and URLs on startup:

```
╔══════════════════════════════════════════════╗
║       LORCANA LIVESTREAM TOOLS               ║
╠══════════════════════════════════════════════╣
║  OBS Overlay (browser source):               ║
║  http://localhost:3000/overlay.html          ║
║                                              ║
║  Controller (shared, 1 phone):               ║
║  http://192.168.x.x:3000/controller.html     ║
║                                              ║
║  Setup page: http://192.168.x.x:3000/        ║
╚══════════════════════════════════════════════╝
```

## Pages

| Page | URL | Purpose |
|------|-----|---------|
| Setup | `http://<your-ip>:3000/` | QR codes + OBS setup instructions |
| Overlay | `http://localhost:3000/overlay.html` | OBS browser source (1920×1080) |
| Controller | `http://<your-ip>:3000/controller.html` | Shared mobile controller |

### Setup page
Open this on the streaming PC. It generates QR codes for the controller URL so players can scan and connect without typing anything.

### Overlay
Add as a browser source in OBS. It renders two 300px panels on the left and right edges of the 1920×1080 canvas — the centre is fully transparent so your game footage shows through.

Each panel shows:
- Player name (tap to edit on the controller)
- Win pips (best of 3)
- Lore count with a full-height ladder (0–20), current rung highlighted and animated
- Winner badge when lore reaches 20

### Controller
Open on a single shared phone in landscape mode. The screen is split in two — Player 1 on the left, Player 2 on the right, with Player 2's side rotated 180° so both players can hold the phone from opposite ends.

Controls per player:
- **+ / − LORE** — adjust lore count
- **+ Win / − Win** — adjust win count
- **Reset Lore** — resets both players' lore to 0
- **New Match** (centre) — resets lore and wins for both players, keeps names

## OBS Browser Source Settings

| Setting | Value |
|---------|-------|
| URL | `http://localhost:3000/overlay.html` |
| Width | `1920` |
| Height | `1080` |
| Custom CSS | *(leave empty)* |
| Shutdown source when not visible | ✓ |
| Refresh browser when scene becomes active | ✓ |

Position the source at the top-left corner of your canvas. The transparent centre lets your game capture show through underneath.

## Development

```bash
# branches
main   # stable — only merge here when tested
dev    # working branch — make changes here

# save your work
git add -A
git commit -m "what you changed"
git push

# roll back a single file to last stable version
git checkout main -- public/overlay.html

# merge dev into main when stable
git checkout main
git merge dev
git push
git checkout dev
```

## Tech stack

- **Server:** Node.js + Express (static files) + `ws` (WebSocket)
- **Client:** Vanilla HTML/CSS/JS, no framework or build step
- **Fonts:** Jost + Chakra Petch (Google Fonts)
