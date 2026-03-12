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
    pm.addBet(0, 50);
    pm.addBet(1, 100);
    pm.addBet(2, 100);
    const pots = pm.calculatePots([0, 1, 2], new Set([0]));
    expect(pots).toHaveLength(2);
    expect(pots[0].amount).toBe(150);
    expect(pots[0].eligiblePlayerIds).toEqual([0, 1, 2]);
    expect(pots[1].amount).toBe(100);
    expect(pots[1].eligiblePlayerIds).toEqual([1, 2]);
  });

  it('creates multiple side pots', () => {
    const pm = new PotManager();
    pm.addBet(0, 30);
    pm.addBet(1, 60);
    pm.addBet(2, 100);
    pm.addBet(3, 100);
    const pots = pm.calculatePots([0, 1, 2, 3], new Set([0, 1]));
    expect(pots).toHaveLength(3);
    expect(pots[0].amount).toBe(120);
    expect(pots[1].amount).toBe(90);
    expect(pots[2].amount).toBe(80);
  });

  it('handles folded players contributing to pot', () => {
    const pm = new PotManager();
    pm.addBet(0, 100);
    pm.addBet(1, 50);
    pm.addBet(2, 100);
    const pots = pm.calculatePots([0, 2]);
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
