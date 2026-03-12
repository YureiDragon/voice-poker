import { evaluateHand, compareHands } from './hand-evaluator';
import type { Card } from '../types';

const c = (rank: string, suit: string): Card => ({ rank, suit } as Card);

describe('evaluateHand', () => {
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
