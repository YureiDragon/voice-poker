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

export interface GameState {
  players: Player[];
  communityCards: Card[];
  pot: number;
  sidePots: SidePot[];
  phase: GamePhase;
  dealerIndex: number;
  currentPlayerIndex: number;
  currentBet: number;
  minRaise: number;
  config: GameConfig;
  handNumber: number;
  handHistory: HandHistory | null;
  pastHands: HandHistory[];
  gameOver: boolean;
  winner: Player | null;
}

export interface RoundBets {
  bets: Map<number, number>;
  currentBet: number;
  minRaise: number;
  lastRaiseSize: number;
  actedPlayerIds: Set<number>;
}
