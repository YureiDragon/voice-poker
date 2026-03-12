# Voice Poker Trainer — Design Spec

## Overview

A blindfold poker training web app. The game is narrated entirely by voice. The player responds by voice (with keyboard fallback). No visual board — the player must track all game state mentally, like blindfold chess but for Texas Hold'em.

## Goals

- Train poker memory: track hole cards, board cards, pot, stack sizes, opponent actions mentally
- Train decision-making under cognitive load
- Offline, no API calls — all speech handled by browser APIs
- Mobile-friendly (iOS/Brave compatible via tap-to-speak model)

## Platform

- **Web app** built with Vite + TypeScript
- No framework (vanilla TS, DOM manipulation)
- Browser `SpeechSynthesis` API for narration (no network)
- Browser `SpeechRecognition` API for player input (no network)
- Produces a static build that can be served from any file server

## Architecture

Four layers:

### 1. Game Engine

Pure logic, no UI concerns.

- **Deck**: Standard 52 cards, Fisher-Yates shuffle
- **Dealing**: Hole cards, then flop/turn/river as betting rounds complete
- **Betting Rounds**: Pre-flop, flop, turn, river. Tracks current bet, minimum raise, who's acted. Handles blinds, dealer button rotation.
- **Hand Evaluation**: Ranks hands (high card → royal flush). Compares at showdown. Handles split pots.
- **Pot Management**: Main pot and side pots (all-in scenarios). Correct payouts.
- **Tournament Mode**: Blind levels increase on a timer or hand count. Players eliminated on bust. Game ends when the human wins or is eliminated.
- **Cash Game Mode**: Fixed blinds. Each player (human and AI) gets 2 rebuys (3 total lives). Bust 3 times = eliminated. Last player standing wins.

### 2. AI Player System

- **Personality Traits** (hidden, randomly assigned per opponent):
  - Tightness (0-1): How selective with starting hands
  - Aggression (0-1): Tendency to raise vs call
  - Bluff Frequency (0-1): How often they bet/raise with weak hands
  - Positional Awareness (0-1): How much position influences decisions
- **Names**: Generic — "Player 1", "Player 2", etc. No personality hints.
- **Decision Making**: Evaluate hand strength relative to board, apply personality weights, add randomness, choose action + sizing.
- **Consistency**: Personalities persist across an entire session. New session = new personalities.

### 3. Voice Layer

**Narrator (Text-to-Speech)**:
- `SpeechSynthesis` API wrapper
- Announces all game events in structured cadence
- Sequential announcement queue (no overlapping speech)
- Adjustable speech rate

Narration flow per hand:
1. Pre-hand: position, blinds, stack size
2. Hole cards: "Your hand: jack-seven of hearts"
3. Actions: "Player 3 raises to 300. Player 5 folds."
4. Board: "The flop: ace of spades, ten of diamonds, four of hearts"
5. Pot updates: "The pot is 750"
6. Results: "Player 3 shows king-queen of diamonds. You win with a pair of jacks."

**Listener (Speech Recognition)**:
- `SpeechRecognition` API wrapper
- Tap-to-speak model (button or spacebar activates mic). More reliable on iOS than always-listening.
- Command types:
  - **Actions**: fold, check, call, raise to [amount], raise [N]x, raise pot, raise half pot, min raise, all in
  - **Queries**: board state, pot size, my stack, player [N] stack, player [N] last action, positions
  - **Game flow**: review (post-hand recap), peek (toggle visual overlay), resume (hide peek)
- Fuzzy matching with confirmation: if parser isn't confident, narrator asks "Did you say raise to 500?"

**Keyboard Fallback**: Text input always available. Same commands, typed.

### 4. UI Shell

**Start Screen**:
- Game format: Cash Game / Tournament
- Table size: 1-9 opponents
- Starting stack size
- Blind levels (cash) / blind schedule (tournament)
- Speech rate adjustment
- Start Game button

**In-Game Screen**:
- Intentionally minimal / dark
- Subtle mic icon or pulse animation when listening
- Large tap-to-speak button (mobile-friendly)
- Small text input at bottom for keyboard fallback
- Peek button in corner

**Peek Overlay** (hidden by default):
- Plain text layout, no graphics
- Shows: hole cards, board cards, pot size, your stack, all players' stacks and positions
- Dismiss: tap again, escape key, or say "resume"

**Post-Hand**:
- Brief pause, narrator auto-starts next hand
- Player can say "review" during pause for hand recap

## File Structure

```
voice-poker/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts              # Entry point, wires everything together
│   ├── engine/
│   │   ├── deck.ts           # Card types, deck creation, shuffle
│   │   ├── dealer.ts         # Dealing, board management, round progression
│   │   ├── betting.ts        # Betting round logic, action validation
│   │   ├── hand-evaluator.ts # Hand ranking and comparison
│   │   ├── pot.ts            # Pot and side pot calculation
│   │   └── game.ts           # Top-level game orchestrator
│   ├── ai/
│   │   ├── personality.ts    # Trait generation and types
│   │   └── decision.ts       # AI decision-making based on traits + hand strength
│   ├── voice/
│   │   ├── narrator.ts       # SpeechSynthesis wrapper, announcement queue
│   │   ├── listener.ts       # SpeechRecognition wrapper, command parsing
│   │   └── commands.ts       # Command definitions, fuzzy matching
│   ├── ui/
│   │   ├── start-screen.ts   # Game setup UI
│   │   ├── game-screen.ts    # In-game minimal UI
│   │   └── peek-overlay.ts   # Optional board state display
│   └── types.ts              # Shared type definitions
└── styles/
    └── main.css              # Minimal styling
```

## Key Constraints

- Zero external API calls — all processing is local
- No visual board by default — the training is mental
- Must work on iOS Safari/Brave (WebKit-based speech APIs)
- Tap-to-speak, not always-listening
- AI personality is observed through gameplay, never revealed by name
