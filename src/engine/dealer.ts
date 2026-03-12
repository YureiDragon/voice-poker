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

    for (const p of active) {
      const { dealt, remaining } = dealCards(this.deck, 2);
      p.holeCards = dealt;
      this.deck = remaining;
    }

    if (active.length === 2) {
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
