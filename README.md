# Voice Poker Trainer

A blindfold poker training app for Texas Hold'em. The game is narrated entirely by voice — no visual board. You must track cards, pot, stacks, and opponent actions in your head, like blindfold chess but for poker.

## How It Works

- The narrator announces your hole cards, community cards, opponent actions, and pot size
- You respond by voice (tap-to-speak) or keyboard
- AI opponents have hidden personality traits (tightness, aggression, bluff frequency) — you learn their style by observing their play, not from their names
- Optional "peek" mode shows a text-based board state if you need a training wheel

## Features

- **Cash game and tournament modes** with configurable table size (1-9 opponents)
- **Voice input** via Web Speech API (tap mic button or hold spacebar)
- **Keyboard fallback** for typing commands
- **Smart queries** — ask about specific state ("player 3 stack", "board state", "pot size")
- **Post-hand review** — say "review" to hear a recap of the last hand
- **Peek overlay** — optional visual board state display
- **Fully offline** — no API calls, all speech processing runs in the browser
- **Mobile friendly** — works on iOS Safari/Brave

## Commands

| Command | Action |
|---|---|
| `fold` / `check` / `call` | Basic actions |
| `raise 500` / `raise to 500` | Raise to a specific amount |
| `raise 3x` / `raise pot` / `raise half pot` | Relative raises |
| `min raise` / `all in` | Min raise or shove |
| `board state` | Hear the community cards |
| `pot size` / `my stack` | Hear pot or your stack |
| `player 3 stack` | Hear a specific player's stack |
| `review` | Recap the last hand |
| `peek` / `resume` | Toggle visual board overlay |

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build

```bash
npm run build
```

## Tech Stack

- TypeScript + Vite
- Web Speech API (SpeechSynthesis + SpeechRecognition)
- Zero external runtime dependencies
