import type { Player, BettingAction } from '../types';

export function getValidActions(
  player: Player,
  currentBet: number,
  minRaise: number,
  pot: number,
  playerCurrentBet: number = 0,
): BettingAction[] {
  const actions: BettingAction[] = [];
  const toCall = currentBet - playerCurrentBet;

  if (toCall <= 0) {
    actions.push({ type: 'check' });
    if (player.chips > 0) {
      const raiseMin = currentBet + Math.max(minRaise, currentBet);
      if (player.chips > raiseMin - playerCurrentBet) {
        actions.push({ type: 'raise', amount: raiseMin });
      }
      actions.push({ type: 'allIn', amount: player.chips + playerCurrentBet });
    }
  } else {
    actions.push({ type: 'fold' });
    if (player.chips >= toCall) {
      actions.push({ type: 'call', amount: currentBet });
      const raiseMin = currentBet + minRaise;
      if (player.chips > toCall && player.chips + playerCurrentBet >= raiseMin) {
        actions.push({ type: 'raise', amount: raiseMin });
      }
      actions.push({ type: 'allIn', amount: player.chips + playerCurrentBet });
    } else {
      actions.push({ type: 'allIn', amount: player.chips + playerCurrentBet });
    }
  }

  return actions;
}

export function validateAction(
  action: BettingAction,
  player: Player,
  currentBet: number,
  minRaise: number,
  playerCurrentBet: number,
): boolean {
  const toCall = currentBet - playerCurrentBet;

  switch (action.type) {
    case 'fold':
      return true;
    case 'check':
      return toCall <= 0;
    case 'call':
      return toCall > 0 && player.chips >= toCall;
    case 'raise': {
      const raiseMin = currentBet + minRaise;
      return (action.amount ?? 0) >= raiseMin && player.chips >= (action.amount ?? 0) - playerCurrentBet;
    }
    case 'allIn':
      return player.chips > 0;
    default:
      return false;
  }
}

export function resolveAction(
  action: BettingAction,
  player: Player,
  currentBet: number,
  playerCurrentBet: number,
): { chipsTaken: number; newBet: number; isAllIn: boolean } {
  switch (action.type) {
    case 'fold':
      return { chipsTaken: 0, newBet: currentBet, isAllIn: false };
    case 'check':
      return { chipsTaken: 0, newBet: currentBet, isAllIn: false };
    case 'call': {
      const toCall = Math.min(currentBet - playerCurrentBet, player.chips);
      return { chipsTaken: toCall, newBet: currentBet, isAllIn: toCall >= player.chips };
    }
    case 'raise': {
      const amount = action.amount!;
      const chipsTaken = amount - playerCurrentBet;
      return { chipsTaken, newBet: amount, isAllIn: chipsTaken >= player.chips };
    }
    case 'allIn': {
      const total = player.chips + playerCurrentBet;
      return { chipsTaken: player.chips, newBet: Math.max(currentBet, total), isAllIn: true };
    }
  }
}
