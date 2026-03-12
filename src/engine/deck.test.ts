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
