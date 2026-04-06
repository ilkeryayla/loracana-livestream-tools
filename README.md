# Lorcana Livestream Tools

Real-time stream overlay and mobile controllers for Lorcana TCG.

## Setup

```bash
npm install
npm start
```

Then open the printed URLs in your browser or share them with players.

## Usage

| Page | URL | Purpose |
|------|-----|---------|
| Setup | `http://<your-ip>:3000/` | QR codes + OBS setup guide |
| Overlay | `http://localhost:3000/overlay.html` | OBS browser source (1920×160) |
| Controller | `http://<your-ip>:3000/controller.html` | Shared mobile controller (one phone, both players) |

Place the phone between both players in landscape mode — Player 2's side is rotated 180°.
Players must be on the **same Wi-Fi network** as the streaming PC.

## OBS Browser Source Settings

- URL: `http://localhost:3000/overlay.html`
- Width: `1920`, Height: `1080`
- Position: top-left corner of your canvas (it fills the full frame, transparent in the centre)
- Custom CSS: (leave empty)
- Check "Shutdown source when not visible"
- Check "Refresh browser when scene becomes active"
