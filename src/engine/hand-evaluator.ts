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

  let isStraight = false;
  let straightHigh = 0;
  if (values[0] - values[4] === 4 && new Set(values).size === 5) {
    isStraight = true;
    straightHigh = values[0];
  }
  if (!isStraight && values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    isStraight = true;
    straightHigh = 5;
  }

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
