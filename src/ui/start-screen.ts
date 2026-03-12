import type { GameConfig, GameFormat } from '../types';

export function renderStartScreen(
  container: HTMLElement,
  onStart: (config: GameConfig) => void,
): void {
  container.innerHTML = `
    <div class="start-screen">
      <h1>Voice Poker Trainer</h1>
      <div class="config-group">
        <label>Game Format</label>
        <select id="format">
          <option value="cash">Cash Game</option>
          <option value="tournament">Tournament</option>
        </select>
      </div>
      <div class="config-group">
        <label>Opponents (1-9)</label>
        <input type="range" id="opponents" min="1" max="9" value="5" />
        <span id="opponents-display">5</span>
      </div>
      <div class="config-group">
        <label>Starting Stack</label>
        <select id="stack">
          <option value="1000">1,000</option>
          <option value="5000" selected>5,000</option>
          <option value="10000">10,000</option>
        </select>
      </div>
      <div class="config-group">
        <label>Blinds</label>
        <select id="blinds">
          <option value="5/10">5 / 10</option>
          <option value="10/20">10 / 20</option>
          <option value="25/50" selected>25 / 50</option>
          <option value="50/100">50 / 100</option>
        </select>
      </div>
      <div class="config-group">
        <label>Speech Rate</label>
        <input type="range" id="speech-rate" min="0.5" max="2" step="0.1" value="1" />
        <span id="rate-display">1.0x</span>
      </div>
      <button class="btn-start" id="btn-start">Start Game</button>
    </div>
  `;

  const opponentsSlider = container.querySelector('#opponents') as HTMLInputElement;
  const opponentsDisplay = container.querySelector('#opponents-display')!;
  opponentsSlider.addEventListener('input', () => {
    opponentsDisplay.textContent = opponentsSlider.value;
  });

  const rateSlider = container.querySelector('#speech-rate') as HTMLInputElement;
  const rateDisplay = container.querySelector('#rate-display')!;
  rateSlider.addEventListener('input', () => {
    rateDisplay.textContent = `${parseFloat(rateSlider.value).toFixed(1)}x`;
  });

  container.querySelector('#btn-start')!.addEventListener('click', () => {
    const format = (container.querySelector('#format') as HTMLSelectElement).value as GameFormat;
    const numOpponents = parseInt(opponentsSlider.value);
    const startingStack = parseInt((container.querySelector('#stack') as HTMLSelectElement).value);
    const blindStr = (container.querySelector('#blinds') as HTMLSelectElement).value;
    const [sb, bb] = blindStr.split('/').map(Number);
    const speechRate = parseFloat(rateSlider.value);

    onStart({
      format,
      numOpponents,
      startingStack,
      smallBlind: sb,
      bigBlind: bb,
      speechRate,
    });
  });
}
