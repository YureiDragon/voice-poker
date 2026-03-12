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

  onNarrate: NarrateCallback = async () => {};
  onWaitForPlayer: WaitForPlayerCallback = async () => ({ type: 'fold' });
  onQuery: QueryCallback = async () => {};
  onGameOver: GameOverCallback = () => {};

  constructor(config: GameConfig) {
    this.config = config;
  }

  init(): void {
    this.players = [{
      id: 0, name: 'You', chips: this.config.startingStack,
      holeCards: [], folded: false, allIn: false,
      isHuman: true, rebuysLeft: 2, eliminated: false,
    }];

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

    const human = this.players[0];
    if (!human.eliminated) {
      const posName = this.getPositionName(0, activePlayers);
      await this.onNarrate(`You are ${posName}. Your stack: ${human.chips}.`);
      await this.onNarrate(`Your hand: ${formatCards(human.holeCards)}.`);
    }

    const preFlopContinue = await this.bettingRound(activePlayers);
    if (!preFlopContinue) { await this.finishHand(activePlayers); return; }

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

    await this.showdown(activePlayers);
  }

  private async bettingRound(players: Player[]): Promise<boolean> {
    const active = players.filter(p => !p.folded && !p.eliminated && !p.allIn);
    if (active.length <= 1) return active.length === 1 || players.filter(p => !p.folded && !p.eliminated).length > 1;

    let startIdx: number;
    if (this.currentPhase === 'preflop') {
      const bbPos = players.length === 2 ? 1 : 2;
      startIdx = (this.dealerIndex + bbPos + 1) % players.length;
    } else {
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

      const announcement = formatAction(player.name, action);
      await this.onNarrate(announcement);

      this.handActions.push({
        playerId: player.id,
        playerName: player.name,
        phase: this.currentPhase,
        action,
      });

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

    const results = new Map<number, HandResult>();
    for (const p of remaining) {
      const result = evaluateHand(p.holeCards, this.communityCards);
      results.set(p.id, result);
    }

    for (const p of remaining) {
      if (!p.isHuman) {
        const result = results.get(p.id)!;
        await this.onNarrate(`${p.name} shows ${formatCards(p.holeCards)}. ${result.rank.replace(/-/g, ' ')}.`);
      }
    }

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
    if (relative < third) return 0;
    if (relative < third * 2) return 1;
    return 2;
  }

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
