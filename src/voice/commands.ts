import type { Card, PlayerCommand } from '../types';
import { RANK_NAMES, SUIT_NAMES } from '../types';

export function parseCommand(
  text: string,
  numPlayers: number,
  pot?: number,
  minRaiseAmount?: number,
): PlayerCommand | null {
  const input = text.toLowerCase().trim();

  if (/^fold$/.test(input)) return { type: 'action', action: { type: 'fold' } };
  if (/^check$/.test(input)) return { type: 'action', action: { type: 'check' } };
  if (/^call$/.test(input)) return { type: 'action', action: { type: 'call' } };
  if (/^all\s*in$/.test(input)) return { type: 'action', action: { type: 'allIn' } };

  if (/^min\s*raise$/.test(input) && minRaiseAmount != null) {
    return { type: 'action', action: { type: 'raise', amount: minRaiseAmount } };
  }
  if (/^raise\s+half\s+pot$/.test(input) && pot != null) {
    return { type: 'action', action: { type: 'raise', amount: Math.floor(pot / 2) } };
  }
  if (/^raise\s+pot$/.test(input) && pot != null) {
    return { type: 'action', action: { type: 'raise', amount: pot } };
  }
  const xMatch = input.match(/^raise\s+(\d+(?:\.\d+)?)\s*x$/);
  if (xMatch && pot != null) {
    return { type: 'action', action: { type: 'raise', amount: Math.floor(parseFloat(xMatch[1]) * pot) } };
  }
  const raiseToMatch = input.match(/^raise\s+(?:to\s+)?(\d+)$/);
  if (raiseToMatch) {
    return { type: 'action', action: { type: 'raise', amount: parseInt(raiseToMatch[1]) } };
  }

  if (/^board(\s+state)?$/.test(input)) return { type: 'query', query: { type: 'boardState' } };
  if (/^pot(\s+size)?$/.test(input)) return { type: 'query', query: { type: 'potSize' } };
  if (/^my\s+stack$/.test(input)) return { type: 'query', query: { type: 'myStack' } };
  if (/^positions?$/.test(input)) return { type: 'query', query: { type: 'positions' } };

  const stackMatch = input.match(/^player\s+(\d+)\s+stack$/);
  if (stackMatch) {
    const id = parseInt(stackMatch[1]);
    if (id >= 1 && id <= numPlayers) {
      return { type: 'query', query: { type: 'playerStack', playerId: id } };
    }
  }

  const lastActionMatch = input.match(/^player\s+(\d+)\s+last\s+action$/);
  if (lastActionMatch) {
    const id = parseInt(lastActionMatch[1]);
    if (id >= 1 && id <= numPlayers) {
      return { type: 'query', query: { type: 'playerLastAction', playerId: id } };
    }
  }

  if (/^review$/.test(input)) return { type: 'review' };
  if (/^peek$/.test(input)) return { type: 'peek' };
  if (/^resume$/.test(input)) return { type: 'resume' };

  return null;
}

export function formatCard(card: Card): string {
  return `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`;
}

export function formatCards(cards: Card[]): string {
  if (cards.length === 0) return 'no cards';
  return cards.map(formatCard).join(', ');
}

export function formatAction(playerName: string, action: { type: string; amount?: number }): string {
  switch (action.type) {
    case 'fold': return `${playerName} folds`;
    case 'check': return `${playerName} checks`;
    case 'call': return `${playerName} calls`;
    case 'raise': return `${playerName} raises to ${action.amount}`;
    case 'allIn': return `${playerName} is all in`;
    default: return `${playerName} acts`;
  }
}
