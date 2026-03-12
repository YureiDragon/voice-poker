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
    expect(players[0].chips).toBe(995);
    expect(players[1].chips).toBe(990);
  });
});
