const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3000;
const STATE_FILE = 'state.json';

function defaultState() {
  return {
    player1: { name: 'Player 1', lore: 0, wins: 0 },
    player2: { name: 'Player 2', lore: 0, wins: 0 },
    timer: { durationMs: 600000, endsAt: null, remainingMs: 600000, running: false }
  };
}

let state;
try {
  state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
} catch {
  state = defaultState();
}

// Normalise timer state (handles missing key on upgrade, and stale running state after restart)
if (!state.timer) state.timer = defaultState().timer;
if (state.timer.running && state.timer.endsAt < Date.now()) {
  state.timer.running = false;
  state.timer.remainingMs = 0;
  state.timer.endsAt = null;
}

function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}

function broadcast(data) {
  const msg = JSON.stringify({ ...data, serverNow: Date.now() });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
}

app.use(express.static('public'));

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'state', data: state, serverNow: Date.now() }));

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'setName': {
        const { player, value } = msg;
        if (!['player1', 'player2'].includes(player)) return;
        const trimmed = String(value).trim().slice(0, 24);
        if (trimmed) state[player].name = trimmed;
        break;
      }
      case 'adjustLore': {
        const { player, delta } = msg;
        if (!['player1', 'player2'].includes(player)) return;
        state[player].lore = Math.max(0, Math.min(20, state[player].lore + delta));
        break;
      }
      case 'adjustWins': {
        const { player, delta } = msg;
        if (!['player1', 'player2'].includes(player)) return;
        state[player].wins = Math.max(0, Math.min(2, state[player].wins + delta));
        break;
      }
      case 'resetLore':
        state.player1.lore = 0;
        state.player2.lore = 0;
        break;
      case 'fullReset':
        state = {
          player1: { name: state.player1.name, lore: 0, wins: 0 },
          player2: { name: state.player2.name, lore: 0, wins: 0 },
          timer: { durationMs: state.timer.durationMs, endsAt: null, remainingMs: state.timer.durationMs, running: false }
        };
        break;
      case 'timerSetDuration': {
        const ms = parseInt(msg.ms, 10);
        if (!Number.isFinite(ms) || ms <= 0 || ms > 5999000) return;
        if (state.timer.running) return;
        state.timer.durationMs = ms;
        state.timer.remainingMs = ms;
        state.timer.endsAt = null;
        break;
      }
      case 'timerStart':
        if (state.timer.running || state.timer.remainingMs <= 0) return;
        state.timer.endsAt = Date.now() + state.timer.remainingMs;
        state.timer.running = true;
        break;
      case 'timerPause':
        if (!state.timer.running) return;
        state.timer.remainingMs = Math.max(0, state.timer.endsAt - Date.now());
        state.timer.endsAt = null;
        state.timer.running = false;
        break;
      case 'timerReset':
        state.timer.running = false;
        state.timer.endsAt = null;
        state.timer.remainingMs = state.timer.durationMs;
        break;
      default:
        return;
    }

    saveState();
    broadcast({ type: 'state', data: state });
  });
});

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║       LORCANA LIVESTREAM TOOLS               ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  OBS Overlay (browser source):               ║`);
  console.log(`║  http://localhost:${PORT}/overlay.html           ║`);
  console.log('║                                              ║');
  console.log(`║  Controller (shared, 1 phone):               ║`);
  console.log(`║  http://${ip}:${PORT}/controller.html       ║`);
  console.log('║                                              ║');
  console.log(`║  Setup page: http://${ip}:${PORT}/             ║`);
  console.log('╚══════════════════════════════════════════════╝\n');
});
