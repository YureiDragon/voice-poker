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
  position: number;
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
    strength = 0.5 + (high / 14) * 0.5;
  } else {
    strength = ((high + low) / 28) * 0.6;
    if (suited) strength += 0.08;
    if (connected) strength += 0.05;
    if (gap <= 2) strength += 0.03;
    if (high === 14) strength += 0.1;
    if (gap >= 5) strength -= 0.1;
  }

  return Math.max(0, Math.min(1, strength));
}

function getPostFlopStrength(holeCards: Card[], communityCards: Card[]): number {
  const result = evaluateHand(holeCards, communityCards);
  const base = result.rankValue / 8;
  const kickerBonus = (result.values[0] || 0) / 14 * 0.1;
  return Math.min(1, base + kickerBonus + 0.1);
}

export function makeDecision(ctx: DecisionContext): BettingAction {
  const { personality, holeCards, communityCards, pot, currentBet, playerChips, playerCurrentBet, position, minRaise } = ctx;
  const toCall = currentBet - playerCurrentBet;

  const strength = communityCards.length === 0
    ? getPreFlopStrength(holeCards[0], holeCards[1])
    : getPostFlopStrength(holeCards, communityCards);

  let adjustedStrength = strength;
  if (personality.positionalAwareness > 0.5) {
    adjustedStrength += (position - 1) * 0.08 * personality.positionalAwareness;
  }

  const playThreshold = 0.25 + personality.tightness * 0.35;
  const isBluffing = Math.random() < personality.bluffFrequency * 0.3;

  if (toCall <= 0) {
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

  if (adjustedStrength < playThreshold && !isBluffing) {
    return { type: 'fold' };
  }

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

  if (adjustedStrength > 0.5) {
    return { type: 'allIn', amount: playerChips + playerCurrentBet };
  }
  return { type: 'fold' };
}
