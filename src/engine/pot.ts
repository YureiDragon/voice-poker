import type { SidePot } from '../types';

export class PotManager {
  private bets: Map<number, number> = new Map();
  private carryOver = 0;

  addBet(playerId: number, amount: number): void {
    this.bets.set(playerId, (this.bets.get(playerId) || 0) + amount);
  }

  getPlayerBet(playerId: number): number {
    return this.bets.get(playerId) || 0;
  }

  getTotalPot(): number {
    let total = this.carryOver;
    for (const amount of this.bets.values()) total += amount;
    return total;
  }

  calculatePots(activePlayerIds: number[], allInPlayerIds: Set<number> = new Set()): SidePot[] {
    const entries = [...this.bets.entries()];
    if (entries.length === 0) {
      if (this.carryOver > 0) return [{ amount: this.carryOver, eligiblePlayerIds: activePlayerIds }];
      return [];
    }

    const allInLevels = entries
      .filter(([id]) => allInPlayerIds.has(id))
      .map(([, amount]) => amount)
      .sort((a, b) => a - b);
    const uniqueLevels = [...new Set(allInLevels)];

    if (uniqueLevels.length === 0) {
      const total = entries.reduce((sum, [, a]) => sum + a, 0) + this.carryOver;
      return [{ amount: total, eligiblePlayerIds: [...activePlayerIds] }];
    }

    const pots: SidePot[] = [];
    let prevLevel = 0;

    for (const level of uniqueLevels) {
      const contribution = level - prevLevel;
      if (contribution <= 0) continue;
      const eligible = entries.filter(([, a]) => a >= level).map(([id]) => id);
      const potAmount = entries.reduce((sum, [, a]) => {
        const contrib = Math.min(a, level) - Math.min(a, prevLevel);
        return sum + Math.max(0, contrib);
      }, 0);
      const eligibleActive = eligible.filter(id => activePlayerIds.includes(id));
      if (potAmount > 0) {
        pots.push({ amount: potAmount + (pots.length === 0 ? this.carryOver : 0), eligiblePlayerIds: eligibleActive });
      }
      prevLevel = level;
    }

    const maxLevel = uniqueLevels[uniqueLevels.length - 1];
    const remaining = entries.reduce((sum, [, a]) => sum + Math.max(0, a - maxLevel), 0);
    if (remaining > 0) {
      const eligible = entries.filter(([, a]) => a > maxLevel).map(([id]) => id);
      const eligibleActive = eligible.filter(id => activePlayerIds.includes(id));
      pots.push({ amount: remaining, eligiblePlayerIds: eligibleActive });
    }

    return pots;
  }

  addCarryOver(amount: number): void {
    this.carryOver += amount;
  }

  reset(): void {
    this.bets.clear();
    this.carryOver = 0;
  }

  resetRound(): void {
    this.carryOver = this.getTotalPot();
    this.bets.clear();
  }
}
