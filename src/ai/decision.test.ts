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
    expect(folds).toBeGreaterThan(30);
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
