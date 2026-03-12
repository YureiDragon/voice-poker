import type { GameState } from '../types';
import { formatCard } from '../voice/commands';

export function renderPeekOverlay(
  container: HTMLElement,
  state: GameState,
  onClose: () => void,
): void {
  const human = state.players.find(p => p.isHuman);
  const boardCards = state.communityCards.length > 0
    ? state.communityCards.map(formatCard).join(', ')
    : 'None';
  const holeCards = human && human.holeCards.length > 0
    ? human.holeCards.map(formatCard).join(', ')
    : 'None';

  const playerRows = state.players
    .filter(p => !p.eliminated)
    .map(p => {
      const marker = p.id === state.players[state.dealerIndex]?.id ? ' (D)' : '';
      const status = p.folded ? ' [folded]' : p.allIn ? ' [all-in]' : '';
      return `<div><span class="chips">${p.name}${marker}: ${p.chips}${status}</span></div>`;
    })
    .join('');

  container.innerHTML = `
    <div class="peek-overlay">
      <button class="close" id="peek-close">&times;</button>
      <h3>Board State</h3>
      <div>Board: <span class="cards">${boardCards}</span></div>
      <div>Your Hand: <span class="cards">${holeCards}</span></div>
      <div>Pot: <span class="chips">${state.pot}</span></div>
      <div style="margin-top: 1rem;">
        <h3>Players</h3>
        ${playerRows}
      </div>
    </div>
  `;

  container.classList.remove('hidden');
  container.querySelector('#peek-close')!.addEventListener('click', () => {
    container.classList.add('hidden');
    container.innerHTML = '';
    onClose();
  });
}

export function hidePeekOverlay(container: HTMLElement): void {
  container.classList.add('hidden');
  container.innerHTML = '';
}
