# Voice Poker Trainer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a blindfold poker training web app where the game is narrated by voice and the player responds by voice or keyboard, tracking all state mentally.

**Architecture:** Vite + TypeScript, four layers: Game Engine (pure logic), AI System (personality-driven opponents), Voice Layer (browser Speech APIs), UI Shell (minimal DOM). No external API calls.

**Tech Stack:** Vite, TypeScript, Vitest, Web Speech API (SpeechSynthesis + SpeechRecognition)

**Spec:** `docs/superpowers/specs/2026-03-12-voice-poker-trainer-design.md`

---

## Chunk 1: Foundation

### Task 1: Project Scaffolding + Shared Types

**Depends on:** nothing
**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/types.ts`
- Create: `styles/main.css`

- [ ] **Step 1: Initialize project**

```bash
cd /Users/yureiryu/Developer/voice-poker
npm init -y
npm install -D typescript vite vitest
```

- [ ] **Step 2: Create config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

`package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Voice Poker Trainer</title>
  <link rel="stylesheet" href="/styles/main.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 4: Create src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 5: Create src/types.ts**

```ts
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export const RANK_NAMES: Record<Rank, string> = {
  '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six',
  '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten',
  'J': 'jack', 'Q': 'queen', 'K': 'king', 'A': 'ace',
};

export const SUIT_NAMES: Record<Suit, string> = {
  hearts: 'hearts', diamonds: 'diamonds', clubs: 'clubs', spades: 'spades',
};

export interface Player {
  id: number;
  name: string;
  chips: number;
  holeCards: Card[];
  folded: boolean;
  allIn: boolean;
  isHuman: boolean;
  rebuysLeft: number;
  eliminated: boolean;
}

export interface AIPersonality {
  tightness: number;       // 0-1
  aggression: number;      // 0-1
  bluffFrequency: number;  // 0-1
  positionalAwareness: number; // 0-1
}

export interface AIPlayer extends Player {
  personality: AIPersonality;
}

export type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'allIn';

export interface BettingAction {
  type: ActionType;
  amount?: number;
}

export type GamePhase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type GameFormat = 'cash' | 'tournament';

export interface BlindLevel {
  hands: number;
  smallBlind: number;
  bigBlind: number;
}

export interface GameConfig {
  format: GameFormat;
  numOpponents: number;
  startingStack: number;
  smallBlind: number;
  bigBlind: number;
  blindSchedule?: BlindLevel[];
  speechRate?: number;
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: number[];
}

export type HandRankName =
  | 'high-card' | 'pair' | 'two-pair' | 'three-of-a-kind'
  | 'straight' | 'flush' | 'full-house' | 'four-of-a-kind'
  | 'straight-flush';

export const HAND_RANK_VALUES: Record<HandRankName, number> = {
  'high-card': 0, 'pair': 1, 'two-pair': 2, 'three-of-a-kind': 3,
  'straight': 4, 'flush': 5, 'full-house': 6, 'four-of-a-kind': 7,
  'straight-flush': 8,
};

export interface HandResult {
  rank: HandRankName;
  rankValue: number;
  values: number[];
  cards: Card[];
}

export interface HandAction {
  playerId: number;
  playerName: string;
  phase: GamePhase;
  action: BettingAction;
}

export interface HandHistory {
  handNumber: number;
  players: { id: number; name: string; holeCards: Card[] }[];
  communityCards: Card[];
  actions: HandAction[];
  winners: { playerId: number; playerName: string; amount: number; hand?: HandResult }[];
  pot: number;
}

export type QueryType =
  | { type: 'boardState' }
  | { type: 'potSize' }
  | { type: 'myStack' }
  | { type: 'playerStack'; playerId: number }
  | { type: 'playerLastAction'; playerId: number }
  | { type: 'positions' };

export type PlayerCommand =
  | { type: 'action'; action: BettingAction }
  | { type: 'query'; query: QueryType }
  | { type: 'review' }
  | { type: 'peek' }
  | { type: 'resume' };

export interface RoundBets {
  bets: Map<number, number>;
  currentBet: number;
  minRaise: number;
  lastRaiseSize: number;
  actedPlayerIds: Set<number>;
}
```

- [ ] **Step 6: Create styles/main.css**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

#app {
  width: 100%;
  max-width: 600px;
  padding: 20px;
  text-align: center;
}

.start-screen h1 { font-size: 2rem; margin-bottom: 1.5rem; color: #fff; }

.config-group {
  margin-bottom: 1rem;
  text-align: left;
}

.config-group label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
  color: #aaa;
}

.config-group select,
.config-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #16213e;
  color: #fff;
  font-size: 1rem;
}

.btn-start {
  margin-top: 1.5rem;
  padding: 14px 40px;
  font-size: 1.2rem;
  border: none;
  border-radius: 8px;
  background: #e94560;
  color: #fff;
  cursor: pointer;
}

.btn-start:hover { background: #c73e54; }

.game-screen { position: relative; min-height: 100vh; }

.mic-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.btn-mic {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #e94560;
  background: transparent;
  color: #e94560;
  font-size: 2.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-mic.listening {
  background: #e94560;
  color: #fff;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(233,69,96,0.4); }
  50% { box-shadow: 0 0 0 20px rgba(233,69,96,0); }
}

.status-text {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #888;
  min-height: 1.5em;
}

.text-input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background: #0f0f23;
  display: flex;
  gap: 8px;
}

.text-input-area input {
  flex: 1;
  padding: 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #16213e;
  color: #fff;
  font-size: 1rem;
}

.text-input-area button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #e94560;
  color: #fff;
  cursor: pointer;
}

.btn-peek {
  position: fixed;
  top: 10px;
  right: 10px;
  padding: 8px 16px;
  border: 1px solid #555;
  border-radius: 6px;
  background: transparent;
  color: #888;
  cursor: pointer;
  font-size: 0.8rem;
}

.peek-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-family: monospace;
  font-size: 1.1rem;
  line-height: 2;
  z-index: 100;
}

.peek-overlay .close {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
  background: none;
  border: none;
}

.peek-overlay h3 { color: #e94560; margin-bottom: 1rem; }
.peek-overlay .cards { color: #4ecca3; }
.peek-overlay .chips { color: #f0c040; }

.hidden { display: none; }
```

- [ ] **Step 7: Create placeholder src/main.ts**

```ts
console.log('Voice Poker Trainer');
```

- [ ] **Step 8: Verify build works**

Run: `cd /Users/yureiryu/Developer/voice-poker && npx vite build`
Expected: Build succeeds

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html src/ styles/
git commit -m "feat: project scaffolding with types and styles"
```

---

### Task 2: Deck Module

**Depends on:** Task 1
**Files:**
- Create: `src/engine/deck.ts`
- Create: `src/engine/deck.test.ts`

- [ ] **Step 1: Write failing tests**

`src/engine/deck.test.ts`:
```ts
import { createDeck, shuffleDeck, dealCards } from './deck';

describe('createDeck', () => {
  it('creates 52 unique cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    const keys = deck.map(c => `${c.rank}-${c.suit}`);
    expect(new Set(keys).size).toBe(52);
  });
});

describe('shuffleDeck', () => {
  it('returns all 52 cards in different order', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck([...deck]);
    expect(shuffled).toHaveLength(52);
    const original = deck.map(c => `${c.rank}-${c.suit}`).join(',');
    const result = shuffled.map(c => `${c.rank}-${c.suit}`).join(',');
    // Extremely unlikely to be same order
    expect(result).not.toBe(original);
  });
});

describe('dealCards', () => {
  it('deals requested number of cards from top', () => {
    const deck = createDeck();
    const { dealt, remaining } = dealCards(deck, 2);
    expect(dealt).toHaveLength(2);
    expect(remaining).toHaveLength(50);
    expect(dealt[0]).toEqual(deck[0]);
    expect(dealt[1]).toEqual(deck[1]);
  });

  it('does not mutate original deck', () => {
    const deck = createDeck();
    const len = deck.length;
    dealCards(deck, 5);
    expect(deck).toHaveLength(len);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/deck.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement deck module**

`src/engine/deck.ts`:
```ts
import { Card, SUITS, RANKS } from '../types';

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } {
  return {
    dealt: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/deck.test.ts`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/deck.ts src/engine/deck.test.ts
git commit -m "feat: deck module with create, shuffle, deal"
```

---

### Task 3: Hand Evaluator

**Depends on:** Task 1
**Files:**
- Create: `src/engine/hand-evaluator.ts`
- Create: `src/engine/hand-evaluator.test.ts`

- [ ] **Step 1: Write failing tests**

`src/engine/hand-evaluator.test.ts`:
```ts
import { evaluateHand, compareHands } from './hand-evaluator';
import type { Card } from '../types';

const c = (rank: string, suit: string): Card => ({ rank, suit } as Card);

describe('evaluateHand', () => {
  const board3 = (b: Card[]) => b; // helper for clarity

  it('detects straight flush', () => {
    const result = evaluateHand(
      [c('A', 'hearts'), c('K', 'hearts')],
      [c('Q', 'hearts'), c('J', 'hearts'), c('10', 'hearts'), c('2', 'clubs'), c('3', 'diamonds')]
    );
    expect(result.rank).toBe('straight-flush');
    expect(result.values[0]).toBe(14);
  });

  it('detects four of a kind', () => {
    const result = evaluateHand(
      [c('K', 'hearts'), c('K', 'diamonds')],
      [c('K', 'clubs'), c('K', 'spades'), c('5', 'hearts'), c('2', 'clubs'), c('9', 'diamonds')]
    );
    expect(result.rank).toBe('four-of-a-kind');
  });

  it('detects full house', () => {
    const result = evaluateHand(
      [c('J', 'hearts'), c('J', 'diamonds')],
      [c('J', 'clubs'), c('8', 'spades'), c('8', 'hearts'), c('2', 'clubs'), c('4', 'diamonds')]
    );
    expect(result.rank).toBe('full-house');
  });

  it('detects flush', () => {
    const result = evaluateHand(
      [c('A', 'hearts'), c('9', 'hearts')],
      [c('6', 'hearts'), c('3', 'hearts'), c('2', 'hearts'), c('K', 'clubs'), c('Q', 'diamonds')]
    );
    expect(result.rank).toBe('flush');
  });

  it('detects straight', () => {
    const result = evaluateHand(
      [c('9', 'hearts'), c('8', 'clubs')],
      [c('7', 'diamonds'), c('6', 'spades'), c('5', 'hearts'), c('K', 'clubs'), c('2', 'diamonds')]
    );
    expect(result.rank).toBe('straight');
    expect(result.values[0]).toBe(9);
  });

  it('detects wheel straight A-2-3-4-5', () => {
    const result = evaluateHand(
      [c('A', 'hearts'), c('2', 'clubs')],
      [c('3', 'diamonds'), c('4', 'spades'), c('5', 'hearts'), c('K', 'clubs'), c('J', 'diamonds')]
    );
    expect(result.rank).toBe('straight');
    expect(result.values[0]).toBe(5);
  });

  it('detects three of a kind', () => {
    const result = evaluateHand(
      [c('7', 'hearts'), c('7', 'clubs')],
      [c('7', 'diamonds'), c('K', 'spades'), c('2', 'hearts'), c('9', 'clubs'), c('4', 'diamonds')]
    );
    expect(result.rank).toBe('three-of-a-kind');
  });

  it('detects two pair', () => {
    const result = evaluateHand(
      [c('A', 'hearts'), c('A', 'clubs')],
      [c('K', 'diamonds'), c('K', 'spades'), c('2', 'hearts'), c('5', 'clubs'), c('9', 'diamonds')]
    );
    expect(result.rank).toBe('two-pair');
  });

  it('detects pair', () => {
    const result = evaluateHand(
      [c('Q', 'hearts'), c('Q', 'clubs')],
      [c('7', 'diamonds'), c('4', 'spades'), c('2', 'hearts'), c('9', 'clubs'), c('K', 'diamonds')]
    );
    expect(result.rank).toBe('pair');
  });

  it('detects high card', () => {
    const result = evaluateHand(
      [c('A', 'hearts'), c('9', 'clubs')],
      [c('7', 'diamonds'), c('4', 'spades'), c('2', 'hearts'), c('J', 'clubs'), c('K', 'diamonds')]
    );
    expect(result.rank).toBe('high-card');
    expect(result.values[0]).toBe(14);
  });
});

describe('compareHands', () => {
  it('higher rank wins', () => {
    const flush = evaluateHand(
      [c('A', 'hearts'), c('9', 'hearts')],
      [c('6', 'hearts'), c('3', 'hearts'), c('2', 'hearts'), c('K', 'clubs'), c('Q', 'diamonds')]
    );
    const pair = evaluateHand(
      [c('Q', 'hearts'), c('Q', 'clubs')],
      [c('7', 'diamonds'), c('4', 'spades'), c('2', 'hearts'), c('9', 'clubs'), c('K', 'diamonds')]
    );
    expect(compareHands(flush, pair)).toBeGreaterThan(0);
  });

  it('same rank uses kickers', () => {
    const pairK = evaluateHand(
      [c('K', 'hearts'), c('K', 'clubs')],
      [c('7', 'diamonds'), c('4', 'spades'), c('2', 'hearts'), c('9', 'clubs'), c('3', 'diamonds')]
    );
    const pairQ = evaluateHand(
      [c('Q', 'hearts'), c('Q', 'clubs')],
      [c('7', 'diamonds'), c('4', 'spades'), c('2', 'hearts'), c('9', 'clubs'), c('3', 'diamonds')]
    );
    expect(compareHands(pairK, pairQ)).toBeGreaterThan(0);
  });

  it('returns 0 for identical hands', () => {
    const board = [c('7', 'diamonds'), c('4', 'spades'), c('2', 'hearts'), c('9', 'clubs'), c('3', 'diamonds')];
    const h1 = evaluateHand([c('A', 'hearts'), c('K', 'clubs')], board);
    const h2 = evaluateHand([c('A', 'diamonds'), c('K', 'spades')], board);
    expect(compareHands(h1, h2)).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/hand-evaluator.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement hand evaluator**

`src/engine/hand-evaluator.ts`:
```ts
import type { Card, HandRankName, HandResult } from '../types';
import { RANK_VALUES } from '../types';

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards];
  const combos = combinations(allCards, 5);
  let best: HandResult | null = null;
  for (const combo of combos) {
    const result = evaluate5(combo);
    if (!best || compareHands(result, best) > 0) {
      best = result;
    }
  }
  return best!;
}

export function compareHands(a: HandResult, b: HandResult): number {
  if (a.rankValue !== b.rankValue) return a.rankValue - b.rankValue;
  for (let i = 0; i < Math.min(a.values.length, b.values.length); i++) {
    if (a.values[i] !== b.values[i]) return a.values[i] - b.values[i];
  }
  return 0;
}

function evaluate5(cards: Card[]): HandResult {
  const values = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);

  // Check straight
  let isStraight = false;
  let straightHigh = 0;
  // Normal straight
  if (values[0] - values[4] === 4 && new Set(values).size === 5) {
    isStraight = true;
    straightHigh = values[0];
  }
  // Wheel: A-2-3-4-5
  if (!isStraight && values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    isStraight = true;
    straightHigh = 5;
  }

  // Count groups
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  const makeResult = (rank: HandRankName, rankValue: number, vals: number[]): HandResult => ({
    rank, rankValue, values: vals, cards: [...cards],
  });

  if (isFlush && isStraight) return makeResult('straight-flush', 8, [straightHigh]);
  if (groups[0][1] === 4) return makeResult('four-of-a-kind', 7, [groups[0][0], groups[1][0]]);
  if (groups[0][1] === 3 && groups[1][1] === 2) return makeResult('full-house', 6, [groups[0][0], groups[1][0]]);
  if (isFlush) return makeResult('flush', 5, values);
  if (isStraight) return makeResult('straight', 4, [straightHigh]);
  if (groups[0][1] === 3) return makeResult('three-of-a-kind', 3, [groups[0][0], ...groups.slice(1).map(g => g[0])]);
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const kicker = groups[2][0];
    return makeResult('two-pair', 2, [groups[0][0], groups[1][0], kicker]);
  }
  if (groups[0][1] === 2) return makeResult('pair', 1, [groups[0][0], ...groups.slice(1).map(g => g[0])]);
  return makeResult('high-card', 0, values);
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    result.push([first, ...combo]);
  }
  result.push(...combinations(rest, k));
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/hand-evaluator.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/hand-evaluator.ts src/engine/hand-evaluator.test.ts
git commit -m "feat: hand evaluator with all rank detection and comparison"
```

---

## Chunk 2: Core Engine

### Task 4: Pot Management

**Depends on:** Task 1
**Files:**
- Create: `src/engine/pot.ts`
- Create: `src/engine/pot.test.ts`

- [ ] **Step 1: Write failing tests**

`src/engine/pot.test.ts`:
```ts
import { PotManager } from './pot';

describe('PotManager', () => {
  it('calculates simple pot with no side pots', () => {
    const pm = new PotManager();
    pm.addBet(0, 100);
    pm.addBet(1, 100);
    pm.addBet(2, 100);
    const pots = pm.calculatePots([0, 1, 2]);
    expect(pots).toHaveLength(1);
    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligiblePlayerIds).toEqual([0, 1, 2]);
  });

  it('creates side pot when player is all-in for less', () => {
    const pm = new PotManager();
    pm.addBet(0, 50);  // all-in for 50
    pm.addBet(1, 100);
    pm.addBet(2, 100);
    const pots = pm.calculatePots([0, 1, 2], new Set([0]));
    expect(pots).toHaveLength(2);
    expect(pots[0].amount).toBe(150); // main pot: 50 * 3
    expect(pots[0].eligiblePlayerIds).toEqual([0, 1, 2]);
    expect(pots[1].amount).toBe(100); // side pot: 50 * 2
    expect(pots[1].eligiblePlayerIds).toEqual([1, 2]);
  });

  it('creates multiple side pots', () => {
    const pm = new PotManager();
    pm.addBet(0, 30);  // all-in 30
    pm.addBet(1, 60);  // all-in 60
    pm.addBet(2, 100);
    pm.addBet(3, 100);
    const pots = pm.calculatePots([0, 1, 2, 3], new Set([0, 1]));
    expect(pots).toHaveLength(3);
    expect(pots[0].amount).toBe(120); // 30 * 4
    expect(pots[1].amount).toBe(90);  // 30 * 3 (remaining from 1,2,3)
    expect(pots[2].amount).toBe(80);  // 40 * 2 (remaining from 2,3)
  });

  it('handles folded players contributing to pot', () => {
    const pm = new PotManager();
    pm.addBet(0, 100);
    pm.addBet(1, 50); // folded after betting 50
    pm.addBet(2, 100);
    const pots = pm.calculatePots([0, 2]); // player 1 folded
    expect(pots[0].amount).toBe(250);
    expect(pots[0].eligiblePlayerIds).toEqual([0, 2]);
  });

  it('resets for new round', () => {
    const pm = new PotManager();
    pm.addBet(0, 100);
    pm.reset();
    pm.addBet(0, 50);
    const pots = pm.calculatePots([0]);
    expect(pots[0].amount).toBe(50);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/pot.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement pot manager**

`src/engine/pot.ts`:
```ts
import type { SidePot } from '../types';

export class PotManager {
  private bets: Map<number, number> = new Map();
  private carryOver = 0;

  addBet(playerId: number, amount: number): void {
    this.bets.set(playerId, (this.bets.get(playerId) || 0) + amount);
  }

  getPlayerBet(playerId: number): number {
    return this.bets.get(playerId) || 0;
  }

  getTotalPot(): number {
    let total = this.carryOver;
    for (const amount of this.bets.values()) total += amount;
    return total;
  }

  calculatePots(activePlayerIds: number[], allInPlayerIds: Set<number> = new Set()): SidePot[] {
    const entries = [...this.bets.entries()];
    if (entries.length === 0) {
      if (this.carryOver > 0) return [{ amount: this.carryOver, eligiblePlayerIds: activePlayerIds }];
      return [];
    }

    // Get unique bet levels from all-in players, sorted ascending
    const allInLevels = entries
      .filter(([id]) => allInPlayerIds.has(id))
      .map(([, amount]) => amount)
      .sort((a, b) => a - b);
    const uniqueLevels = [...new Set(allInLevels)];

    if (uniqueLevels.length === 0) {
      // No side pots needed
      const total = entries.reduce((sum, [, a]) => sum + a, 0) + this.carryOver;
      return [{ amount: total, eligiblePlayerIds: [...activePlayerIds] }];
    }

    const pots: SidePot[] = [];
    let prevLevel = 0;

    for (const level of uniqueLevels) {
      const contribution = level - prevLevel;
      if (contribution <= 0) continue;
      const eligible = entries.filter(([, a]) => a >= level).map(([id]) => id);
      const potAmount = entries.reduce((sum, [, a]) => {
        const contrib = Math.min(a, level) - Math.min(a, prevLevel);
        return sum + Math.max(0, contrib);
      }, 0);
      const eligibleActive = eligible.filter(id => activePlayerIds.includes(id));
      if (potAmount > 0) {
        pots.push({ amount: potAmount + (pots.length === 0 ? this.carryOver : 0), eligiblePlayerIds: eligibleActive });
      }
      prevLevel = level;
    }

    // Remaining bets above highest all-in level
    const maxLevel = uniqueLevels[uniqueLevels.length - 1];
    const remaining = entries.reduce((sum, [, a]) => sum + Math.max(0, a - maxLevel), 0);
    if (remaining > 0) {
      const eligible = entries.filter(([, a]) => a > maxLevel).map(([id]) => id);
      const eligibleActive = eligible.filter(id => activePlayerIds.includes(id));
      pots.push({ amount: remaining, eligiblePlayerIds: eligibleActive });
    }

    return pots;
  }

  addCarryOver(amount: number): void {
    this.carryOver += amount;
  }

  reset(): void {
    this.bets.clear();
    this.carryOver = 0;
  }

  resetRound(): void {
    // Keep bets for pot calculation but allow new round bets
    this.carryOver = this.getTotalPot();
    this.bets.clear();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/pot.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/pot.ts src/engine/pot.test.ts
git commit -m "feat: pot manager with side pot calculation"
```

---

### Task 5: Betting Logic

**Depends on:** Task 1
**Files:**
- Create: `src/engine/betting.ts`
- Create: `src/engine/betting.test.ts`

- [ ] **Step 1: Write failing tests**

`src/engine/betting.test.ts`:
```ts
import { getValidActions, validateAction } from './betting';
import type { Player, BettingAction } from '../types';

const makePlayer = (chips: number, partial?: Partial<Player>): Player => ({
  id: 0, name: 'Test', chips, holeCards: [], folded: false,
  allIn: false, isHuman: true, rebuysLeft: 2, eliminated: false,
  ...partial,
});

describe('getValidActions', () => {
  it('allows check when no bet', () => {
    const actions = getValidActions(makePlayer(1000), 0, 0, 100);
    const types = actions.map(a => a.type);
    expect(types).toContain('check');
    expect(types).toContain('raise');
    expect(types).not.toContain('call');
  });

  it('allows call/fold/raise when facing a bet', () => {
    const actions = getValidActions(makePlayer(1000), 100, 100, 200);
    const types = actions.map(a => a.type);
    expect(types).toContain('call');
    expect(types).toContain('fold');
    expect(types).toContain('raise');
    expect(types).not.toContain('check');
  });

  it('allows only allIn and fold when chips less than call', () => {
    const actions = getValidActions(makePlayer(50), 100, 100, 200);
    const types = actions.map(a => a.type);
    expect(types).toContain('allIn');
    expect(types).toContain('fold');
    expect(types).not.toContain('call');
    expect(types).not.toContain('raise');
  });

  it('allows call and allIn but no raise when chips equal call but less than min raise', () => {
    const actions = getValidActions(makePlayer(100), 100, 100, 200);
    const types = actions.map(a => a.type);
    expect(types).toContain('call');
    expect(types).toContain('allIn');
    expect(types).toContain('fold');
  });
});

describe('validateAction', () => {
  it('rejects raise below minimum', () => {
    const result = validateAction(
      { type: 'raise', amount: 50 },
      makePlayer(1000), 100, 100, 0
    );
    expect(result).toBe(false);
  });

  it('accepts valid raise', () => {
    const result = validateAction(
      { type: 'raise', amount: 300 },
      makePlayer(1000), 100, 100, 0
    );
    expect(result).toBe(true);
  });

  it('rejects check when there is a bet', () => {
    const result = validateAction(
      { type: 'check' },
      makePlayer(1000), 100, 100, 0
    );
    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/betting.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement betting logic**

`src/engine/betting.ts`:
```ts
import type { Player, BettingAction } from '../types';

export function getValidActions(
  player: Player,
  currentBet: number,
  minRaise: number,
  pot: number,
  playerCurrentBet: number = 0,
): BettingAction[] {
  const actions: BettingAction[] = [];
  const toCall = currentBet - playerCurrentBet;

  if (toCall <= 0) {
    // No bet to face
    actions.push({ type: 'check' });
    if (player.chips > 0) {
      const raiseMin = currentBet + Math.max(minRaise, currentBet);
      if (player.chips > raiseMin - playerCurrentBet) {
        actions.push({ type: 'raise', amount: raiseMin });
      }
      actions.push({ type: 'allIn', amount: player.chips + playerCurrentBet });
    }
  } else {
    // Facing a bet
    actions.push({ type: 'fold' });
    if (player.chips >= toCall) {
      actions.push({ type: 'call', amount: currentBet });
      const raiseMin = currentBet + minRaise;
      if (player.chips > toCall && player.chips + playerCurrentBet >= raiseMin) {
        actions.push({ type: 'raise', amount: raiseMin });
      }
      actions.push({ type: 'allIn', amount: player.chips + playerCurrentBet });
    } else {
      // Can only go all-in for less
      actions.push({ type: 'allIn', amount: player.chips + playerCurrentBet });
    }
  }

  return actions;
}

export function validateAction(
  action: BettingAction,
  player: Player,
  currentBet: number,
  minRaise: number,
  playerCurrentBet: number,
): boolean {
  const toCall = currentBet - playerCurrentBet;

  switch (action.type) {
    case 'fold':
      return true;
    case 'check':
      return toCall <= 0;
    case 'call':
      return toCall > 0 && player.chips >= toCall;
    case 'raise': {
      const raiseMin = currentBet + minRaise;
      return (action.amount ?? 0) >= raiseMin && player.chips >= (action.amount ?? 0) - playerCurrentBet;
    }
    case 'allIn':
      return player.chips > 0;
    default:
      return false;
  }
}

export function resolveAction(
  action: BettingAction,
  player: Player,
  currentBet: number,
  playerCurrentBet: number,
): { chipsTaken: number; newBet: number; isAllIn: boolean } {
  switch (action.type) {
    case 'fold':
      return { chipsTaken: 0, newBet: currentBet, isAllIn: false };
    case 'check':
      return { chipsTaken: 0, newBet: currentBet, isAllIn: false };
    case 'call': {
      const toCall = Math.min(currentBet - playerCurrentBet, player.chips);
      return { chipsTaken: toCall, newBet: currentBet, isAllIn: toCall >= player.chips };
    }
    case 'raise': {
      const amount = action.amount!;
      const chipsTaken = amount - playerCurrentBet;
      return { chipsTaken, newBet: amount, isAllIn: chipsTaken >= player.chips };
    }
    case 'allIn': {
      const total = player.chips + playerCurrentBet;
      return { chipsTaken: player.chips, newBet: Math.max(currentBet, total), isAllIn: true };
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/betting.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/betting.ts src/engine/betting.test.ts
git commit -m "feat: betting logic with action validation and resolution"
```

---

### Task 6: Dealer + Round Management

**Depends on:** Tasks 2, 4, 5
**Files:**
- Create: `src/engine/dealer.ts`
- Create: `src/engine/dealer.test.ts`

- [ ] **Step 1: Write failing tests**

`src/engine/dealer.test.ts`:
```ts
import { Dealer } from './dealer';
import type { Player } from '../types';

const makePlayers = (count: number, chips = 1000): Player[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i, name: i === 0 ? 'You' : `Player ${i}`, chips,
    holeCards: [], folded: false, allIn: false,
    isHuman: i === 0, rebuysLeft: 2, eliminated: false,
  }));

describe('Dealer', () => {
  it('deals 2 hole cards to each player', () => {
    const dealer = new Dealer();
    const players = makePlayers(4);
    dealer.startHand(players, 0, 5, 10);
    for (const p of players) {
      expect(p.holeCards).toHaveLength(2);
    }
  });

  it('posts blinds correctly', () => {
    const dealer = new Dealer();
    const players = makePlayers(4, 1000);
    const state = dealer.startHand(players, 0, 5, 10);
    // SB is player 1 (left of dealer 0), BB is player 2
    expect(players[1].chips).toBe(995);
    expect(players[2].chips).toBe(990);
    expect(state.currentBet).toBe(10);
  });

  it('deals 3 flop cards', () => {
    const dealer = new Dealer();
    const players = makePlayers(3);
    dealer.startHand(players, 0, 5, 10);
    const flop = dealer.dealFlop();
    expect(flop).toHaveLength(3);
  });

  it('deals 1 turn card', () => {
    const dealer = new Dealer();
    const players = makePlayers(3);
    dealer.startHand(players, 0, 5, 10);
    dealer.dealFlop();
    const turn = dealer.dealTurn();
    expect(turn).toHaveLength(1);
  });

  it('deals 1 river card', () => {
    const dealer = new Dealer();
    const players = makePlayers(3);
    dealer.startHand(players, 0, 5, 10);
    dealer.dealFlop();
    dealer.dealTurn();
    const river = dealer.dealRiver();
    expect(river).toHaveLength(1);
  });

  it('rotates dealer button to next non-eliminated player', () => {
    const dealer = new Dealer();
    const players = makePlayers(4);
    players[1].eliminated = true;
    const next = dealer.nextDealer(players, 0);
    expect(next).toBe(2);
  });

  it('handles heads-up blind posting', () => {
    const dealer = new Dealer();
    const players = makePlayers(2, 1000);
    const state = dealer.startHand(players, 0, 5, 10);
    // In heads-up, dealer posts SB, other posts BB
    expect(players[0].chips).toBe(995); // dealer = SB
    expect(players[1].chips).toBe(990); // BB
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/dealer.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement dealer**

`src/engine/dealer.ts`:
```ts
import type { Card, Player, GamePhase } from '../types';
import { createDeck, shuffleDeck, dealCards } from './deck';
import { PotManager } from './pot';

export interface RoundState {
  communityCards: Card[];
  currentBet: number;
  minRaise: number;
  phase: GamePhase;
  potManager: PotManager;
  playerBets: Map<number, number>;
}

export class Dealer {
  private deck: Card[] = [];
  private communityCards: Card[] = [];
  private potManager = new PotManager();
  private playerBets = new Map<number, number>();

  startHand(players: Player[], dealerIndex: number, smallBlind: number, bigBlind: number): RoundState {
    // Reset
    this.deck = shuffleDeck(createDeck());
    this.communityCards = [];
    this.potManager.reset();
    this.playerBets.clear();

    for (const p of players) {
      p.holeCards = [];
      p.folded = false;
      p.allIn = false;
    }

    const active = players.filter(p => !p.eliminated);

    // Deal hole cards
    for (const p of active) {
      const { dealt, remaining } = dealCards(this.deck, 2);
      p.holeCards = dealt;
      this.deck = remaining;
    }

    // Post blinds
    if (active.length === 2) {
      // Heads-up: dealer is SB
      const sb = active.findIndex(p => p.id === players[dealerIndex].id);
      const bb = sb === 0 ? 1 : 0;
      this.postBlind(active[sb], smallBlind);
      this.postBlind(active[bb], bigBlind);
    } else {
      const sbIdx = this.nextActiveIndex(players, dealerIndex);
      const bbIdx = this.nextActiveIndex(players, sbIdx);
      this.postBlind(players[sbIdx], smallBlind);
      this.postBlind(players[bbIdx], bigBlind);
    }

    return {
      communityCards: this.communityCards,
      currentBet: bigBlind,
      minRaise: bigBlind,
      phase: 'preflop',
      potManager: this.potManager,
      playerBets: this.playerBets,
    };
  }

  private postBlind(player: Player, amount: number): void {
    const actual = Math.min(amount, player.chips);
    player.chips -= actual;
    if (player.chips === 0) player.allIn = true;
    this.potManager.addBet(player.id, actual);
    this.playerBets.set(player.id, actual);
  }

  private nextActiveIndex(players: Player[], fromIndex: number): number {
    let idx = (fromIndex + 1) % players.length;
    while (players[idx].eliminated) {
      idx = (idx + 1) % players.length;
    }
    return idx;
  }

  dealFlop(): Card[] {
    // Burn one
    this.deck = this.deck.slice(1);
    const { dealt, remaining } = dealCards(this.deck, 3);
    this.deck = remaining;
    this.communityCards.push(...dealt);
    return dealt;
  }

  dealTurn(): Card[] {
    this.deck = this.deck.slice(1);
    const { dealt, remaining } = dealCards(this.deck, 1);
    this.deck = remaining;
    this.communityCards.push(...dealt);
    return dealt;
  }

  dealRiver(): Card[] {
    this.deck = this.deck.slice(1);
    const { dealt, remaining } = dealCards(this.deck, 1);
    this.deck = remaining;
    this.communityCards.push(...dealt);
    return dealt;
  }

  getCommunityCards(): Card[] {
    return [...this.communityCards];
  }

  getPotManager(): PotManager {
    return this.potManager;
  }

  nextDealer(players: Player[], current: number): number {
    return this.nextActiveIndex(players, current);
  }

  startNewBettingRound(): void {
    this.potManager.resetRound();
    this.playerBets.clear();
  }

  getPlayerBets(): Map<number, number> {
    return this.playerBets;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/dealer.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/dealer.ts src/engine/dealer.test.ts
git commit -m "feat: dealer with hole card dealing, blinds, community cards"
```

---

## Chunk 3: AI & Voice

### Task 7: AI System

**Depends on:** Tasks 1, 3
**Files:**
- Create: `src/ai/personality.ts`
- Create: `src/ai/decision.ts`
- Create: `src/ai/decision.test.ts`

- [ ] **Step 1: Write failing tests**

`src/ai/decision.test.ts`:
```ts
import { generatePersonality, makeDecision, getPreFlopStrength } from './decision';
import type { Card, BettingAction, AIPersonality } from '../types';

const c = (rank: string, suit: string): Card => ({ rank, suit } as Card);

describe('generatePersonality', () => {
  it('generates traits between 0 and 1', () => {
    for (let i = 0; i < 20; i++) {
      const p = generatePersonality();
      expect(p.tightness).toBeGreaterThanOrEqual(0);
      expect(p.tightness).toBeLessThanOrEqual(1);
      expect(p.aggression).toBeGreaterThanOrEqual(0);
      expect(p.aggression).toBeLessThanOrEqual(1);
      expect(p.bluffFrequency).toBeGreaterThanOrEqual(0);
      expect(p.bluffFrequency).toBeLessThanOrEqual(1);
      expect(p.positionalAwareness).toBeGreaterThanOrEqual(0);
      expect(p.positionalAwareness).toBeLessThanOrEqual(1);
    }
  });
});

describe('getPreFlopStrength', () => {
  it('rates pocket aces as premium', () => {
    expect(getPreFlopStrength(c('A', 'hearts'), c('A', 'spades'))).toBeGreaterThan(0.9);
  });

  it('rates 7-2 offsuit as weak', () => {
    expect(getPreFlopStrength(c('7', 'hearts'), c('2', 'spades'))).toBeLessThan(0.3);
  });

  it('rates suited connectors higher than offsuit', () => {
    const suited = getPreFlopStrength(c('8', 'hearts'), c('9', 'hearts'));
    const offsuit = getPreFlopStrength(c('8', 'hearts'), c('9', 'spades'));
    expect(suited).toBeGreaterThan(offsuit);
  });
});

describe('makeDecision', () => {
  const tightPassive: AIPersonality = { tightness: 0.9, aggression: 0.1, bluffFrequency: 0.05, positionalAwareness: 0.5 };
  const looseAggressive: AIPersonality = { tightness: 0.1, aggression: 0.9, bluffFrequency: 0.4, positionalAwareness: 0.5 };

  it('tight player folds weak hands preflop', () => {
    const results: BettingAction[] = [];
    for (let i = 0; i < 50; i++) {
      results.push(makeDecision({
        personality: tightPassive,
        holeCards: [c('7', 'hearts'), c('2', 'spades')],
        communityCards: [],
        pot: 15,
        currentBet: 10,
        playerChips: 1000,
        playerCurrentBet: 0,
        position: 0,
        minRaise: 10,
      }));
    }
    const folds = results.filter(a => a.type === 'fold').length;
    expect(folds).toBeGreaterThan(30); // Should fold most of the time
  });

  it('loose aggressive player raises with strong hands', () => {
    const results: BettingAction[] = [];
    for (let i = 0; i < 50; i++) {
      results.push(makeDecision({
        personality: looseAggressive,
        holeCards: [c('A', 'hearts'), c('A', 'spades')],
        communityCards: [],
        pot: 15,
        currentBet: 10,
        playerChips: 1000,
        playerCurrentBet: 0,
        position: 2,
        minRaise: 10,
      }));
    }
    const raises = results.filter(a => a.type === 'raise' || a.type === 'allIn').length;
    expect(raises).toBeGreaterThan(30);
  });

  it('returns a valid action type', () => {
    const action = makeDecision({
      personality: tightPassive,
      holeCards: [c('A', 'hearts'), c('K', 'hearts')],
      communityCards: [],
      pot: 15,
      currentBet: 10,
      playerChips: 1000,
      playerCurrentBet: 0,
      position: 1,
      minRaise: 10,
    });
    expect(['fold', 'check', 'call', 'raise', 'allIn']).toContain(action.type);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/ai/decision.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement AI personality**

`src/ai/personality.ts`:
```ts
import type { AIPersonality } from '../types';

export function generatePersonality(): AIPersonality {
  return {
    tightness: Math.random(),
    aggression: Math.random(),
    bluffFrequency: Math.random() * 0.5, // Cap bluff frequency at 0.5
    positionalAwareness: Math.random(),
  };
}
```

- [ ] **Step 4: Implement AI decision engine**

`src/ai/decision.ts`:
```ts
import type { Card, BettingAction, AIPersonality } from '../types';
import { RANK_VALUES } from '../types';
import { evaluateHand } from '../engine/hand-evaluator';
import { generatePersonality } from './personality';

export { generatePersonality };

interface DecisionContext {
  personality: AIPersonality;
  holeCards: Card[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  playerChips: number;
  playerCurrentBet: number;
  position: number; // 0=early, 1=middle, 2=late
  minRaise: number;
}

export function getPreFlopStrength(card1: Card, card2: Card): number {
  const v1 = RANK_VALUES[card1.rank];
  const v2 = RANK_VALUES[card2.rank];
  const high = Math.max(v1, v2);
  const low = Math.min(v1, v2);
  const suited = card1.suit === card2.suit;
  const paired = v1 === v2;
  const gap = high - low;
  const connected = gap === 1;

  let strength = 0;

  if (paired) {
    strength = 0.5 + (high / 14) * 0.5; // AA=1.0, 22=0.57
  } else {
    strength = ((high + low) / 28) * 0.6; // Base from card values
    if (suited) strength += 0.08;
    if (connected) strength += 0.05;
    if (gap <= 2) strength += 0.03;
    if (high === 14) strength += 0.1; // Ace bonus
    if (gap >= 5) strength -= 0.1; // Big gap penalty
  }

  return Math.max(0, Math.min(1, strength));
}

function getPostFlopStrength(holeCards: Card[], communityCards: Card[]): number {
  const result = evaluateHand(holeCards, communityCards);
  // Normalize rank value to 0-1 range with some spread
  const base = result.rankValue / 8;
  // Add kicker value
  const kickerBonus = (result.values[0] || 0) / 14 * 0.1;
  return Math.min(1, base + kickerBonus + 0.1);
}

export function makeDecision(ctx: DecisionContext): BettingAction {
  const { personality, holeCards, communityCards, pot, currentBet, playerChips, playerCurrentBet, position, minRaise } = ctx;
  const toCall = currentBet - playerCurrentBet;

  // Get hand strength
  const strength = communityCards.length === 0
    ? getPreFlopStrength(holeCards[0], holeCards[1])
    : getPostFlopStrength(holeCards, communityCards);

  // Adjust for position
  let adjustedStrength = strength;
  if (personality.positionalAwareness > 0.5) {
    adjustedStrength += (position - 1) * 0.08 * personality.positionalAwareness;
  }

  // Tightness threshold — tight players need stronger hands
  const playThreshold = 0.25 + personality.tightness * 0.35;

  // Bluff chance
  const isBluffing = Math.random() < personality.bluffFrequency * 0.3;

  if (toCall <= 0) {
    // No bet to face — can check or bet
    if (adjustedStrength > playThreshold || isBluffing) {
      if ((adjustedStrength > 0.7 || isBluffing) && personality.aggression > Math.random()) {
        const sizing = Math.floor(pot * (0.5 + personality.aggression * 0.5));
        const raiseAmount = Math.max(currentBet + minRaise, sizing);
        if (raiseAmount <= playerChips + playerCurrentBet) {
          return { type: 'raise', amount: raiseAmount };
        }
        return { type: 'allIn', amount: playerChips + playerCurrentBet };
      }
      return { type: 'check' };
    }
    return { type: 'check' };
  }

  // Facing a bet
  const potOdds = toCall / (pot + toCall);

  if (adjustedStrength < playThreshold && !isBluffing) {
    return { type: 'fold' };
  }

  // Decide between call and raise
  if (adjustedStrength > 0.75 && personality.aggression > Math.random()) {
    const sizing = Math.floor(pot * (0.6 + personality.aggression * 0.6));
    const raiseAmount = Math.max(currentBet + minRaise, sizing);
    if (raiseAmount <= playerChips + playerCurrentBet) {
      return { type: 'raise', amount: raiseAmount };
    }
    if (adjustedStrength > 0.85) {
      return { type: 'allIn', amount: playerChips + playerCurrentBet };
    }
  }

  if (isBluffing && personality.aggression > 0.6 && Math.random() > 0.5) {
    const raiseAmount = currentBet + minRaise;
    if (raiseAmount <= playerChips + playerCurrentBet) {
      return { type: 'raise', amount: raiseAmount };
    }
  }

  if (toCall <= playerChips) {
    return { type: 'call', amount: currentBet };
  }

  // Can't afford to call normally — all-in or fold
  if (adjustedStrength > 0.5) {
    return { type: 'allIn', amount: playerChips + playerCurrentBet };
  }
  return { type: 'fold' };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/ai/decision.test.ts`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/ai/personality.ts src/ai/decision.ts src/ai/decision.test.ts
git commit -m "feat: AI system with personality traits and decision engine"
```

---

### Task 8: Voice Layer

**Depends on:** Task 1
**Files:**
- Create: `src/voice/narrator.ts`
- Create: `src/voice/commands.ts`
- Create: `src/voice/listener.ts`
- Create: `src/voice/commands.test.ts`

- [ ] **Step 1: Write failing tests for command parsing**

`src/voice/commands.test.ts`:
```ts
import { parseCommand } from './commands';

describe('parseCommand', () => {
  it('parses fold', () => {
    const cmd = parseCommand('fold', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'fold' } });
  });

  it('parses check', () => {
    const cmd = parseCommand('check', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'check' } });
  });

  it('parses call', () => {
    const cmd = parseCommand('call', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'call' } });
  });

  it('parses raise to amount', () => {
    const cmd = parseCommand('raise to 500', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'raise', amount: 500 } });
  });

  it('parses raise amount (without "to")', () => {
    const cmd = parseCommand('raise 500', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'raise', amount: 500 } });
  });

  it('parses raise 3x with pot context', () => {
    const cmd = parseCommand('raise 3x', 5, 100);
    expect(cmd).toEqual({ type: 'action', action: { type: 'raise', amount: 300 } });
  });

  it('parses raise pot', () => {
    const cmd = parseCommand('raise pot', 5, 200);
    expect(cmd).toEqual({ type: 'action', action: { type: 'raise', amount: 200 } });
  });

  it('parses raise half pot', () => {
    const cmd = parseCommand('raise half pot', 5, 200);
    expect(cmd).toEqual({ type: 'action', action: { type: 'raise', amount: 100 } });
  });

  it('parses min raise', () => {
    const cmd = parseCommand('min raise', 5, 200, 50);
    expect(cmd).toEqual({ type: 'action', action: { type: 'raise', amount: 50 } });
  });

  it('parses all in', () => {
    const cmd = parseCommand('all in', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'allIn' } });
  });

  it('parses board state query', () => {
    const cmd = parseCommand('board state', 5);
    expect(cmd).toEqual({ type: 'query', query: { type: 'boardState' } });
  });

  it('parses pot size query', () => {
    const cmd = parseCommand('pot size', 5);
    expect(cmd).toEqual({ type: 'query', query: { type: 'potSize' } });
  });

  it('parses my stack query', () => {
    const cmd = parseCommand('my stack', 5);
    expect(cmd).toEqual({ type: 'query', query: { type: 'myStack' } });
  });

  it('parses player N stack query', () => {
    const cmd = parseCommand('player 3 stack', 5);
    expect(cmd).toEqual({ type: 'query', query: { type: 'playerStack', playerId: 3 } });
  });

  it('parses review', () => {
    const cmd = parseCommand('review', 5);
    expect(cmd).toEqual({ type: 'review' });
  });

  it('parses peek', () => {
    const cmd = parseCommand('peek', 5);
    expect(cmd).toEqual({ type: 'peek' });
  });

  it('returns null for unrecognized input', () => {
    const cmd = parseCommand('banana split', 5);
    expect(cmd).toBeNull();
  });

  it('is case insensitive', () => {
    const cmd = parseCommand('FOLD', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'fold' } });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/voice/commands.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement command parser**

`src/voice/commands.ts`:
```ts
import type { Card, PlayerCommand } from '../types';
import { RANK_NAMES, SUIT_NAMES } from '../types';

export function parseCommand(
  text: string,
  numPlayers: number,
  pot?: number,
  minRaiseAmount?: number,
): PlayerCommand | null {
  const input = text.toLowerCase().trim();

  // Actions
  if (/^fold$/.test(input)) return { type: 'action', action: { type: 'fold' } };
  if (/^check$/.test(input)) return { type: 'action', action: { type: 'check' } };
  if (/^call$/.test(input)) return { type: 'action', action: { type: 'call' } };
  if (/^all\s*in$/.test(input)) return { type: 'action', action: { type: 'allIn' } };

  // Raise variants
  if (/^min\s*raise$/.test(input) && minRaiseAmount != null) {
    return { type: 'action', action: { type: 'raise', amount: minRaiseAmount } };
  }
  if (/^raise\s+half\s+pot$/.test(input) && pot != null) {
    return { type: 'action', action: { type: 'raise', amount: Math.floor(pot / 2) } };
  }
  if (/^raise\s+pot$/.test(input) && pot != null) {
    return { type: 'action', action: { type: 'raise', amount: pot } };
  }
  const xMatch = input.match(/^raise\s+(\d+(?:\.\d+)?)\s*x$/);
  if (xMatch && pot != null) {
    return { type: 'action', action: { type: 'raise', amount: Math.floor(parseFloat(xMatch[1]) * pot) } };
  }
  const raiseToMatch = input.match(/^raise\s+(?:to\s+)?(\d+)$/);
  if (raiseToMatch) {
    return { type: 'action', action: { type: 'raise', amount: parseInt(raiseToMatch[1]) } };
  }

  // Queries
  if (/^board(\s+state)?$/.test(input)) return { type: 'query', query: { type: 'boardState' } };
  if (/^pot(\s+size)?$/.test(input)) return { type: 'query', query: { type: 'potSize' } };
  if (/^my\s+stack$/.test(input)) return { type: 'query', query: { type: 'myStack' } };
  if (/^positions?$/.test(input)) return { type: 'query', query: { type: 'positions' } };

  const stackMatch = input.match(/^player\s+(\d+)\s+stack$/);
  if (stackMatch) {
    const id = parseInt(stackMatch[1]);
    if (id >= 1 && id <= numPlayers) {
      return { type: 'query', query: { type: 'playerStack', playerId: id } };
    }
  }

  const lastActionMatch = input.match(/^player\s+(\d+)\s+last\s+action$/);
  if (lastActionMatch) {
    const id = parseInt(lastActionMatch[1]);
    if (id >= 1 && id <= numPlayers) {
      return { type: 'query', query: { type: 'playerLastAction', playerId: id } };
    }
  }

  // Game flow
  if (/^review$/.test(input)) return { type: 'review' };
  if (/^peek$/.test(input)) return { type: 'peek' };
  if (/^resume$/.test(input)) return { type: 'resume' };

  return null;
}

export function formatCard(card: Card): string {
  return `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`;
}

export function formatCards(cards: Card[]): string {
  if (cards.length === 0) return 'no cards';
  return cards.map(formatCard).join(', ');
}

export function formatAction(playerName: string, action: { type: string; amount?: number }): string {
  switch (action.type) {
    case 'fold': return `${playerName} folds`;
    case 'check': return `${playerName} checks`;
    case 'call': return `${playerName} calls`;
    case 'raise': return `${playerName} raises to ${action.amount}`;
    case 'allIn': return `${playerName} is all in`;
    default: return `${playerName} acts`;
  }
}
```

- [ ] **Step 4: Implement narrator**

`src/voice/narrator.ts`:
```ts
export class Narrator {
  private synth: SpeechSynthesis | null;
  private rate: number;
  private queue: string[] = [];
  private speaking = false;

  constructor(rate = 1.0) {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.rate = rate;
  }

  setRate(rate: number): void {
    this.rate = rate;
  }

  async speak(text: string): Promise<void> {
    if (!this.synth) {
      console.log(`[Narrator]: ${text}`);
      return;
    }
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.rate;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      this.synth!.speak(utterance);
    });
  }

  async speakQueued(text: string): Promise<void> {
    this.queue.push(text);
    if (!this.speaking) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.speaking = true;
    while (this.queue.length > 0) {
      const text = this.queue.shift()!;
      await this.speak(text);
    }
    this.speaking = false;
  }

  stop(): void {
    this.queue = [];
    this.synth?.cancel();
    this.speaking = false;
  }
}
```

- [ ] **Step 5: Implement listener**

`src/voice/listener.ts`:
```ts
type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : any;

export class Listener {
  private recognition: any | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  start(): Promise<string> {
    if (!this.recognition) {
      return Promise.reject(new Error('Speech recognition not supported'));
    }
    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        resolve(text.trim());
      };
      this.recognition.onerror = (event: any) => {
        reject(new Error(event.error));
      };
      this.recognition.onend = () => {
        // If no result was captured, resolve empty
      };
      this.recognition.start();
    });
  }

  stop(): void {
    this.recognition?.stop();
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/voice/commands.test.ts`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/voice/narrator.ts src/voice/listener.ts src/voice/commands.ts src/voice/commands.test.ts
git commit -m "feat: voice layer with narrator, listener, and command parser"
```

---

## Chunk 4: Game Orchestrator, UI & Integration

### Task 9: Game Orchestrator

**Depends on:** Tasks 2, 3, 4, 5, 6, 7
**Files:**
- Create: `src/engine/game.ts`

This is the central game loop that coordinates all components. It's primarily async event-driven — emitting narration events and waiting for player input.

- [ ] **Step 1: Implement game orchestrator**

`src/engine/game.ts`:
```ts
import type {
  Card, Player, AIPlayer, BettingAction, GameConfig, GamePhase,
  GameState, HandHistory, HandAction, QueryType, HandResult, SidePot,
} from '../types';
import { Dealer } from './dealer';
import { evaluateHand, compareHands } from './hand-evaluator';
import { getValidActions, resolveAction } from './betting';
import { makeDecision, generatePersonality } from '../ai/decision';
import { formatCard, formatCards, formatAction } from '../voice/commands';

export type NarrateCallback = (text: string) => Promise<void>;
export type WaitForPlayerCallback = () => Promise<BettingAction>;
export type QueryCallback = (response: string) => Promise<void>;
export type GameOverCallback = (winner: Player) => void;

export class Game {
  private players: (Player | AIPlayer)[] = [];
  private dealer = new Dealer();
  private config: GameConfig;
  private dealerIndex = 0;
  private handNumber = 0;
  private communityCards: Card[] = [];
  private handActions: HandAction[] = [];
  private currentPhase: GamePhase = 'preflop';
  private currentBet = 0;
  private minRaise = 0;
  private playerBets = new Map<number, number>();
  private pastHands: HandHistory[] = [];
  private running = false;
  private waitingForPlayer = false;

  // Callbacks
  onNarrate: NarrateCallback = async () => {};
  onWaitForPlayer: WaitForPlayerCallback = async () => ({ type: 'fold' });
  onQuery: QueryCallback = async () => {};
  onGameOver: GameOverCallback = () => {};

  constructor(config: GameConfig) {
    this.config = config;
  }

  init(): void {
    // Create human player
    this.players = [{
      id: 0, name: 'You', chips: this.config.startingStack,
      holeCards: [], folded: false, allIn: false,
      isHuman: true, rebuysLeft: 2, eliminated: false,
    }];

    // Create AI players
    for (let i = 1; i <= this.config.numOpponents; i++) {
      const aiPlayer: AIPlayer = {
        id: i, name: `Player ${i}`, chips: this.config.startingStack,
        holeCards: [], folded: false, allIn: false,
        isHuman: false, rebuysLeft: 2, eliminated: false,
        personality: generatePersonality(),
      };
      this.players.push(aiPlayer);
    }

    this.dealerIndex = Math.floor(Math.random() * this.players.length);
  }

  async start(): Promise<void> {
    this.running = true;
    this.init();
    await this.onNarrate(`Welcome to Voice Poker. ${this.players.length} players at the table. Starting stack: ${this.config.startingStack}. ${this.config.format === 'cash' ? 'Cash game' : 'Tournament'} mode.`);

    while (this.running && this.getActivePlayers().length > 1) {
      await this.playHand();
      this.handleEliminations();
      if (this.getActivePlayers().length <= 1) break;
      this.dealerIndex = this.dealer.nextDealer(this.players, this.dealerIndex);
      await this.delay(1500);
    }

    const winner = this.getActivePlayers()[0];
    if (winner) {
      await this.onNarrate(`Game over! ${winner.name} wins!`);
      this.onGameOver(winner);
    }
    this.running = false;
  }

  stop(): void {
    this.running = false;
  }

  private async playHand(): Promise<void> {
    this.handNumber++;
    this.handActions = [];
    this.communityCards = [];

    const activePlayers = this.getActivePlayers();
    const sb = this.config.smallBlind;
    const bb = this.config.bigBlind;

    await this.onNarrate(`Hand ${this.handNumber}. Blinds ${sb}/${bb}.`);

    const roundState = this.dealer.startHand(activePlayers, this.dealerIndex, sb, bb);
    this.currentBet = roundState.currentBet;
    this.minRaise = roundState.minRaise;
    this.playerBets = roundState.playerBets;
    this.currentPhase = 'preflop';
    this.communityCards = [];

    // Announce human's position and cards
    const human = this.players[0];
    if (!human.eliminated) {
      const posName = this.getPositionName(0, activePlayers);
      await this.onNarrate(`You are ${posName}. Your stack: ${human.chips}.`);
      await this.onNarrate(`Your hand: ${formatCards(human.holeCards)}.`);
    }

    // Preflop betting
    const preFlopContinue = await this.bettingRound(activePlayers);
    if (!preFlopContinue) { await this.finishHand(activePlayers); return; }

    // Flop
    this.dealer.startNewBettingRound();
    this.playerBets.clear();
    this.currentBet = 0;
    this.minRaise = bb;
    const flop = this.dealer.dealFlop();
    this.communityCards = this.dealer.getCommunityCards();
    this.currentPhase = 'flop';
    await this.onNarrate(`The flop: ${formatCards(flop)}.`);

    const flopContinue = await this.bettingRound(activePlayers);
    if (!flopContinue) { await this.finishHand(activePlayers); return; }

    // Turn
    this.dealer.startNewBettingRound();
    this.playerBets.clear();
    this.currentBet = 0;
    this.minRaise = bb;
    const turn = this.dealer.dealTurn();
    this.communityCards = this.dealer.getCommunityCards();
    this.currentPhase = 'turn';
    await this.onNarrate(`The turn: ${formatCard(turn[0])}.`);

    const turnContinue = await this.bettingRound(activePlayers);
    if (!turnContinue) { await this.finishHand(activePlayers); return; }

    // River
    this.dealer.startNewBettingRound();
    this.playerBets.clear();
    this.currentBet = 0;
    this.minRaise = bb;
    const river = this.dealer.dealRiver();
    this.communityCards = this.dealer.getCommunityCards();
    this.currentPhase = 'river';
    await this.onNarrate(`The river: ${formatCard(river[0])}.`);

    const riverContinue = await this.bettingRound(activePlayers);
    if (!riverContinue) { await this.finishHand(activePlayers); return; }

    // Showdown
    await this.showdown(activePlayers);
  }

  private async bettingRound(players: Player[]): Promise<boolean> {
    const active = players.filter(p => !p.folded && !p.eliminated && !p.allIn);
    if (active.length <= 1) return active.length === 1 || players.filter(p => !p.folded && !p.eliminated).length > 1;

    // Determine first to act
    let startIdx: number;
    if (this.currentPhase === 'preflop') {
      // After big blind
      const bbPos = this.currentPhase === 'preflop' && players.length === 2 ? 1 : 2;
      startIdx = (this.dealerIndex + bbPos + 1) % players.length;
    } else {
      // First active player after dealer
      startIdx = (this.dealerIndex + 1) % players.length;
    }

    const acted = new Set<number>();
    let idx = startIdx;
    let lastRaiser = -1;

    for (let safety = 0; safety < players.length * 4; safety++) {
      const player = players[idx % players.length];
      idx++;

      if (player.folded || player.eliminated || player.allIn) continue;
      if (acted.has(player.id) && (lastRaiser === -1 || lastRaiser === player.id)) break;

      let action: BettingAction;
      if (player.isHuman) {
        const pot = this.dealer.getPotManager().getTotalPot();
        await this.onNarrate(`The pot is ${pot}. Your action.`);
        this.waitingForPlayer = true;
        action = await this.onWaitForPlayer();
        this.waitingForPlayer = false;
      } else {
        await this.delay(800 + Math.random() * 1200);
        const aiPlayer = player as AIPlayer;
        const totalPlayers = players.filter(p => !p.eliminated).length;
        const position = this.getPositionValue(player.id, players);
        action = makeDecision({
          personality: aiPlayer.personality,
          holeCards: aiPlayer.holeCards,
          communityCards: this.communityCards,
          pot: this.dealer.getPotManager().getTotalPot(),
          currentBet: this.currentBet,
          playerChips: player.chips,
          playerCurrentBet: this.playerBets.get(player.id) || 0,
          position,
          minRaise: this.minRaise,
        });
      }

      // Apply action
      const playerCurrentBet = this.playerBets.get(player.id) || 0;
      const resolved = resolveAction(action, player, this.currentBet, playerCurrentBet);

      if (action.type === 'fold') {
        player.folded = true;
      } else {
        player.chips -= resolved.chipsTaken;
        this.dealer.getPotManager().addBet(player.id, resolved.chipsTaken);
        this.playerBets.set(player.id, playerCurrentBet + resolved.chipsTaken);
        if (resolved.isAllIn) player.allIn = true;
        if (resolved.newBet > this.currentBet) {
          this.minRaise = resolved.newBet - this.currentBet;
          this.currentBet = resolved.newBet;
          lastRaiser = player.id;
          acted.clear();
        }
      }

      acted.add(player.id);

      // Announce action
      const announcement = formatAction(player.name, action);
      await this.onNarrate(announcement);

      this.handActions.push({
        playerId: player.id,
        playerName: player.name,
        phase: this.currentPhase,
        action,
      });

      // Check if round is over
      const remaining = players.filter(p => !p.folded && !p.eliminated);
      if (remaining.length <= 1) return false;

      const canAct = remaining.filter(p => !p.allIn);
      if (canAct.length <= 1 && canAct.every(p => acted.has(p.id))) return true;
    }

    return true;
  }

  private async showdown(players: Player[]): Promise<void> {
    const remaining = players.filter(p => !p.folded && !p.eliminated);
    this.currentPhase = 'showdown';

    // Evaluate hands
    const results = new Map<number, HandResult>();
    for (const p of remaining) {
      const result = evaluateHand(p.holeCards, this.communityCards);
      results.set(p.id, result);
    }

    // Announce hands
    for (const p of remaining) {
      if (!p.isHuman) {
        const result = results.get(p.id)!;
        await this.onNarrate(`${p.name} shows ${formatCards(p.holeCards)}. ${result.rank.replace(/-/g, ' ')}.`);
      }
    }

    // Distribute pots
    const pots = this.dealer.getPotManager().calculatePots(
      remaining.map(p => p.id),
      new Set(remaining.filter(p => p.allIn).map(p => p.id))
    );

    const winnings = new Map<number, number>();
    for (const pot of pots) {
      const eligible = pot.eligiblePlayerIds.filter(id => results.has(id));
      if (eligible.length === 0) continue;

      let bestIds = [eligible[0]];
      for (let i = 1; i < eligible.length; i++) {
        const cmp = compareHands(results.get(eligible[i])!, results.get(bestIds[0])!);
        if (cmp > 0) bestIds = [eligible[i]];
        else if (cmp === 0) bestIds.push(eligible[i]);
      }

      const share = Math.floor(pot.amount / bestIds.length);
      for (const id of bestIds) {
        winnings.set(id, (winnings.get(id) || 0) + share);
      }
    }

    // Apply winnings and announce
    const winners: HandHistory['winners'] = [];
    for (const [id, amount] of winnings) {
      const player = this.players.find(p => p.id === id)!;
      player.chips += amount;
      const result = results.get(id);
      winners.push({ playerId: id, playerName: player.name, amount, hand: result });
      await this.onNarrate(`${player.name} wins ${amount} with ${result?.rank.replace(/-/g, ' ')}.`);
    }

    this.saveHandHistory(players, winners);
  }

  private async finishHand(players: Player[]): Promise<void> {
    const remaining = players.filter(p => !p.folded && !p.eliminated);
    if (remaining.length === 1) {
      const winner = remaining[0];
      const pot = this.dealer.getPotManager().getTotalPot();
      winner.chips += pot;
      await this.onNarrate(`${winner.name} wins ${pot}.`);
      this.saveHandHistory(players, [{ playerId: winner.id, playerName: winner.name, amount: pot }]);
    }
  }

  private saveHandHistory(players: Player[], winners: HandHistory['winners']): void {
    this.pastHands.push({
      handNumber: this.handNumber,
      players: players.filter(p => !p.eliminated).map(p => ({
        id: p.id, name: p.name, holeCards: [...p.holeCards],
      })),
      communityCards: [...this.communityCards],
      actions: [...this.handActions],
      winners,
      pot: this.dealer.getPotManager().getTotalPot(),
    });
  }

  private handleEliminations(): void {
    for (const player of this.players) {
      if (player.eliminated) continue;
      if (player.chips <= 0) {
        if (player.rebuysLeft > 0) {
          player.rebuysLeft--;
          player.chips = this.config.startingStack;
        } else {
          player.eliminated = true;
        }
      }
    }
  }

  private getActivePlayers(): Player[] {
    return this.players.filter(p => !p.eliminated);
  }

  private getPositionName(playerIdx: number, activePlayers: Player[]): string {
    const count = activePlayers.length;
    const playerPos = activePlayers.findIndex(p => p.id === playerIdx);
    const dealerPos = activePlayers.findIndex(p => p.id === this.players[this.dealerIndex]?.id);
    const relativePos = (playerPos - dealerPos + count) % count;

    if (count === 2) return relativePos === 0 ? 'the dealer (small blind)' : 'the big blind';
    if (relativePos === 0) return 'the dealer';
    if (relativePos === 1) return 'the small blind';
    if (relativePos === 2) return 'the big blind';
    if (relativePos === count - 1) return 'on the button';
    return 'in middle position';
  }

  private getPositionValue(playerId: number, players: Player[]): number {
    const active = players.filter(p => !p.eliminated);
    const pos = active.findIndex(p => p.id === playerId);
    const dealerPos = active.findIndex(p => p.id === this.players[this.dealerIndex]?.id);
    const relative = (pos - dealerPos + active.length) % active.length;
    const third = active.length / 3;
    if (relative < third) return 0; // early
    if (relative < third * 2) return 1; // middle
    return 2; // late
  }

  // Public query handler
  handleQuery(query: QueryType): string {
    switch (query.type) {
      case 'boardState':
        return this.communityCards.length > 0
          ? `The board shows: ${formatCards(this.communityCards)}.`
          : 'No community cards yet.';
      case 'potSize':
        return `The pot is ${this.dealer.getPotManager().getTotalPot()}.`;
      case 'myStack':
        return `Your stack is ${this.players[0].chips}.`;
      case 'playerStack': {
        const p = this.players.find(pl => pl.id === query.playerId);
        return p ? `${p.name}'s stack is ${p.chips}.` : 'Player not found.';
      }
      case 'playerLastAction': {
        const last = [...this.handActions].reverse().find(a => a.playerId === query.playerId);
        return last ? `${last.playerName}'s last action: ${formatAction(last.playerName, last.action)}.` : 'No action recorded.';
      }
      case 'positions': {
        const active = this.getActivePlayers();
        const positions = active.map(p => `${p.name}: ${this.getPositionName(p.id, active)}`).join('. ');
        return positions;
      }
    }
  }

  getHandReview(): string {
    const last = this.pastHands[this.pastHands.length - 1];
    if (!last) return 'No hands played yet.';

    const lines: string[] = [`Hand ${last.handNumber} review.`];
    const byPhase = new Map<string, HandAction[]>();
    for (const a of last.actions) {
      if (!byPhase.has(a.phase)) byPhase.set(a.phase, []);
      byPhase.get(a.phase)!.push(a);
    }
    for (const [phase, actions] of byPhase) {
      lines.push(`${phase}: ${actions.map(a => formatAction(a.playerName, a.action)).join('. ')}.`);
    }
    if (last.communityCards.length > 0) {
      lines.push(`Board: ${formatCards(last.communityCards)}.`);
    }
    for (const w of last.winners) {
      lines.push(`${w.playerName} won ${w.amount}${w.hand ? ` with ${w.hand.rank.replace(/-/g, ' ')}` : ''}.`);
    }
    return lines.join(' ');
  }

  getState(): GameState {
    return {
      players: this.players.map(p => ({ ...p, holeCards: [...p.holeCards] })),
      communityCards: [...this.communityCards],
      pot: this.dealer.getPotManager().getTotalPot(),
      sidePots: [],
      phase: this.currentPhase,
      dealerIndex: this.dealerIndex,
      currentPlayerIndex: 0,
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      config: this.config,
      handNumber: this.handNumber,
      handHistory: this.pastHands[this.pastHands.length - 1] || null,
      pastHands: this.pastHands,
      gameOver: !this.running,
      winner: null,
    };
  }

  isWaitingForPlayer(): boolean {
    return this.waitingForPlayer;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/game.ts
git commit -m "feat: game orchestrator with full hand loop and showdown"
```

---

### Task 10: UI Start Screen

**Depends on:** Task 1
**Files:**
- Create: `src/ui/start-screen.ts`

- [ ] **Step 1: Implement start screen**

`src/ui/start-screen.ts`:
```ts
import type { GameConfig, GameFormat } from '../types';

export function renderStartScreen(
  container: HTMLElement,
  onStart: (config: GameConfig) => void,
): void {
  container.innerHTML = `
    <div class="start-screen">
      <h1>Voice Poker Trainer</h1>
      <div class="config-group">
        <label>Game Format</label>
        <select id="format">
          <option value="cash">Cash Game</option>
          <option value="tournament">Tournament</option>
        </select>
      </div>
      <div class="config-group">
        <label>Opponents (1-9)</label>
        <input type="range" id="opponents" min="1" max="9" value="5" />
        <span id="opponents-display">5</span>
      </div>
      <div class="config-group">
        <label>Starting Stack</label>
        <select id="stack">
          <option value="1000">1,000</option>
          <option value="5000" selected>5,000</option>
          <option value="10000">10,000</option>
        </select>
      </div>
      <div class="config-group">
        <label>Blinds</label>
        <select id="blinds">
          <option value="5/10">5 / 10</option>
          <option value="10/20">10 / 20</option>
          <option value="25/50" selected>25 / 50</option>
          <option value="50/100">50 / 100</option>
        </select>
      </div>
      <div class="config-group">
        <label>Speech Rate</label>
        <input type="range" id="speech-rate" min="0.5" max="2" step="0.1" value="1" />
        <span id="rate-display">1.0x</span>
      </div>
      <button class="btn-start" id="btn-start">Start Game</button>
    </div>
  `;

  const opponentsSlider = container.querySelector('#opponents') as HTMLInputElement;
  const opponentsDisplay = container.querySelector('#opponents-display')!;
  opponentsSlider.addEventListener('input', () => {
    opponentsDisplay.textContent = opponentsSlider.value;
  });

  const rateSlider = container.querySelector('#speech-rate') as HTMLInputElement;
  const rateDisplay = container.querySelector('#rate-display')!;
  rateSlider.addEventListener('input', () => {
    rateDisplay.textContent = `${parseFloat(rateSlider.value).toFixed(1)}x`;
  });

  container.querySelector('#btn-start')!.addEventListener('click', () => {
    const format = (container.querySelector('#format') as HTMLSelectElement).value as GameFormat;
    const numOpponents = parseInt(opponentsSlider.value);
    const startingStack = parseInt((container.querySelector('#stack') as HTMLSelectElement).value);
    const blindStr = (container.querySelector('#blinds') as HTMLSelectElement).value;
    const [sb, bb] = blindStr.split('/').map(Number);
    const speechRate = parseFloat(rateSlider.value);

    onStart({
      format,
      numOpponents,
      startingStack,
      smallBlind: sb,
      bigBlind: bb,
      speechRate,
    });
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/start-screen.ts
git commit -m "feat: start screen with game configuration"
```

---

### Task 11: Game Screen + Peek Overlay

**Depends on:** Task 1
**Files:**
- Create: `src/ui/game-screen.ts`
- Create: `src/ui/peek-overlay.ts`

- [ ] **Step 1: Implement game screen**

`src/ui/game-screen.ts`:
```ts
export interface GameScreenCallbacks {
  onMicPress: () => void;
  onMicRelease: () => void;
  onTextSubmit: (text: string) => void;
  onPeekToggle: () => void;
}

export function renderGameScreen(
  container: HTMLElement,
  callbacks: GameScreenCallbacks,
): {
  setStatus: (text: string) => void;
  setListening: (active: boolean) => void;
  destroy: () => void;
} {
  container.innerHTML = `
    <div class="game-screen">
      <button class="btn-peek" id="btn-peek">Peek</button>
      <div class="mic-area">
        <button class="btn-mic" id="btn-mic">&#x1F399;</button>
        <div class="status-text" id="status"></div>
      </div>
      <div class="text-input-area">
        <input type="text" id="text-input" placeholder="Type command (fold, call, raise 100...)" />
        <button id="btn-send">Send</button>
      </div>
      <div id="peek-container" class="hidden"></div>
    </div>
  `;

  const micBtn = container.querySelector('#btn-mic') as HTMLButtonElement;
  const statusEl = container.querySelector('#status')!;
  const textInput = container.querySelector('#text-input') as HTMLInputElement;
  const sendBtn = container.querySelector('#btn-send')!;
  const peekBtn = container.querySelector('#btn-peek')!;

  micBtn.addEventListener('mousedown', callbacks.onMicPress);
  micBtn.addEventListener('mouseup', callbacks.onMicRelease);
  micBtn.addEventListener('touchstart', (e) => { e.preventDefault(); callbacks.onMicPress(); });
  micBtn.addEventListener('touchend', (e) => { e.preventDefault(); callbacks.onMicRelease(); });

  const submitText = () => {
    const val = textInput.value.trim();
    if (val) {
      callbacks.onTextSubmit(val);
      textInput.value = '';
    }
  };

  sendBtn.addEventListener('click', submitText);
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitText();
  });

  // Spacebar to talk
  const keyHandler = (e: KeyboardEvent) => {
    if (e.target === textInput) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (e.type === 'keydown') callbacks.onMicPress();
      else callbacks.onMicRelease();
    }
  };
  document.addEventListener('keydown', keyHandler);
  document.addEventListener('keyup', keyHandler);

  peekBtn.addEventListener('click', callbacks.onPeekToggle);

  return {
    setStatus(text: string) { statusEl.textContent = text; },
    setListening(active: boolean) {
      micBtn.classList.toggle('listening', active);
      statusEl.textContent = active ? 'Listening...' : '';
    },
    destroy() {
      document.removeEventListener('keydown', keyHandler);
      document.removeEventListener('keyup', keyHandler);
    },
  };
}
```

- [ ] **Step 2: Implement peek overlay**

`src/ui/peek-overlay.ts`:
```ts
import type { GameState } from '../types';
import { formatCard } from '../voice/commands';

export function renderPeekOverlay(
  container: HTMLElement,
  state: GameState,
  onClose: () => void,
): void {
  const human = state.players.find(p => p.isHuman);
  const boardCards = state.communityCards.length > 0
    ? state.communityCards.map(formatCard).join(', ')
    : 'None';
  const holeCards = human && human.holeCards.length > 0
    ? human.holeCards.map(formatCard).join(', ')
    : 'None';

  const playerRows = state.players
    .filter(p => !p.eliminated)
    .map(p => {
      const marker = p.id === state.players[state.dealerIndex]?.id ? ' (D)' : '';
      const status = p.folded ? ' [folded]' : p.allIn ? ' [all-in]' : '';
      return `<div><span class="chips">${p.name}${marker}: ${p.chips}${status}</span></div>`;
    })
    .join('');

  container.innerHTML = `
    <div class="peek-overlay">
      <button class="close" id="peek-close">&times;</button>
      <h3>Board State</h3>
      <div>Board: <span class="cards">${boardCards}</span></div>
      <div>Your Hand: <span class="cards">${holeCards}</span></div>
      <div>Pot: <span class="chips">${state.pot}</span></div>
      <div style="margin-top: 1rem;">
        <h3>Players</h3>
        ${playerRows}
      </div>
    </div>
  `;

  container.classList.remove('hidden');
  container.querySelector('#peek-close')!.addEventListener('click', () => {
    container.classList.add('hidden');
    container.innerHTML = '';
    onClose();
  });
}

export function hidePeekOverlay(container: HTMLElement): void {
  container.classList.add('hidden');
  container.innerHTML = '';
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/game-screen.ts src/ui/peek-overlay.ts
git commit -m "feat: game screen with mic button, text input, and peek overlay"
```

---

### Task 12: Main Entry Point — Wire Everything Together

**Depends on:** All previous tasks
**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Implement main.ts**

`src/main.ts`:
```ts
import type { BettingAction, GameConfig } from './types';
import { Game } from './engine/game';
import { Narrator } from './voice/narrator';
import { Listener } from './voice/listener';
import { parseCommand } from './voice/commands';
import { renderStartScreen } from './ui/start-screen';
import { renderGameScreen } from './ui/game-screen';
import { renderPeekOverlay, hidePeekOverlay } from './ui/peek-overlay';

const app = document.getElementById('app')!;

let game: Game | null = null;
let narrator: Narrator | null = null;
let listener: Listener | null = null;
let playerActionResolve: ((action: BettingAction) => void) | null = null;
let peekVisible = false;

function startApp(): void {
  renderStartScreen(app, onStartGame);
}

async function onStartGame(config: GameConfig): Promise<void> {
  narrator = new Narrator(config.speechRate ?? 1.0);
  listener = new Listener();
  game = new Game(config);

  const screen = renderGameScreen(app, {
    onMicPress: handleMicPress,
    onMicRelease: handleMicRelease,
    onTextSubmit: handleTextInput,
    onPeekToggle: handlePeekToggle,
  });

  game.onNarrate = async (text: string) => {
    screen.setStatus(text);
    await narrator!.speak(text);
  };

  game.onWaitForPlayer = () => {
    screen.setStatus('Your action...');
    return new Promise<BettingAction>((resolve) => {
      playerActionResolve = resolve;
    });
  };

  game.onGameOver = (winner) => {
    setTimeout(() => {
      if (confirm(`${winner.name} wins! Play again?`)) {
        startApp();
      }
    }, 2000);
  };

  await game.start();
}

async function handleMicPress(): Promise<void> {
  if (!listener?.isSupported()) return;
  const screen = document.querySelector('.btn-mic') as HTMLElement | null;
  screen?.classList.add('listening');

  try {
    const text = await listener!.start();
    screen?.classList.remove('listening');
    processInput(text);
  } catch {
    screen?.classList.remove('listening');
  }
}

function handleMicRelease(): void {
  listener?.stop();
}

function handleTextInput(text: string): void {
  processInput(text);
}

function processInput(text: string): void {
  if (!game) return;

  const pot = game.getState().pot;
  const minRaise = game.getState().minRaise;
  const numPlayers = game.getState().players.length;
  const command = parseCommand(text, numPlayers, pot, minRaise);

  if (!command) {
    narrator?.speak("I didn't understand that. Try again.");
    return;
  }

  switch (command.type) {
    case 'action':
      if (playerActionResolve) {
        playerActionResolve(command.action);
        playerActionResolve = null;
      } else {
        narrator?.speak("It's not your turn.");
      }
      break;
    case 'query':
      const response = game.handleQuery(command.query);
      narrator?.speak(response);
      break;
    case 'review':
      const review = game.getHandReview();
      narrator?.speak(review);
      break;
    case 'peek':
      handlePeekToggle();
      break;
    case 'resume':
      const peekContainer = document.getElementById('peek-container');
      if (peekContainer) {
        hidePeekOverlay(peekContainer);
        peekVisible = false;
      }
      break;
  }
}

function handlePeekToggle(): void {
  const peekContainer = document.getElementById('peek-container');
  if (!peekContainer || !game) return;

  if (peekVisible) {
    hidePeekOverlay(peekContainer);
    peekVisible = false;
  } else {
    renderPeekOverlay(peekContainer, game.getState(), () => { peekVisible = false; });
    peekVisible = true;
  }
}

startApp();
```

- [ ] **Step 2: Verify app builds**

Run: `cd /Users/yureiryu/Developer/voice-poker && npx vite build`
Expected: Build succeeds

- [ ] **Step 3: Verify all tests pass**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/main.ts
git commit -m "feat: main entry point wiring game, voice, and UI together"
```

---

## Dependency Graph (for parallel execution)

```
Task 1 (Scaffolding + Types) ─── SEQUENTIAL, FIRST
  │
  ├── Task 2 (Deck) ──────────────────┐
  ├── Task 3 (Hand Evaluator) ────────┤
  ├── Task 4 (Pot) ───────────────────┤── can run in PARALLEL
  ├── Task 5 (Betting) ──────────────┤
  ├── Task 7 (AI System) [needs 3] ──┤
  ├── Task 8 (Voice Layer) ───────────┤
  ├── Task 10 (Start Screen) ─────────┤
  └── Task 11 (Game Screen + Peek) ───┘
           │
  Task 6 (Dealer) ── needs 2, 4, 5
  Task 9 (Game Orchestrator) ── needs 2, 3, 4, 5, 6, 7
  Task 12 (Main Integration) ── needs ALL
```
