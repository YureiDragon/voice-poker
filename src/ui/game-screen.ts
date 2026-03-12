export interface GameScreenCallbacks {
  onMicPress: () => void;
  onMicRelease: () => void;
  onTextSubmit: (text: string) => void;
  onPeekToggle: () => void;
}

export function renderGameScreen(
  container: HTMLElement,
  callbacks: GameScreenCallbacks,
): {
  setStatus: (text: string) => void;
  setListening: (active: boolean) => void;
  destroy: () => void;
} {
  container.innerHTML = `
    <div class="game-screen">
      <button class="btn-peek" id="btn-peek">Peek</button>
      <div class="mic-area">
        <button class="btn-mic" id="btn-mic">&#x1F399;</button>
        <div class="status-text" id="status"></div>
      </div>
      <div class="text-input-area">
        <input type="text" id="text-input" placeholder="Type command (fold, call, raise 100...)" />
        <button id="btn-send">Send</button>
      </div>
      <div id="peek-container" class="hidden"></div>
    </div>
  `;

  const micBtn = container.querySelector('#btn-mic') as HTMLButtonElement;
  const statusEl = container.querySelector('#status')!;
  const textInput = container.querySelector('#text-input') as HTMLInputElement;
  const sendBtn = container.querySelector('#btn-send')!;
  const peekBtn = container.querySelector('#btn-peek')!;

  micBtn.addEventListener('mousedown', callbacks.onMicPress);
  micBtn.addEventListener('mouseup', callbacks.onMicRelease);
  micBtn.addEventListener('touchstart', (e) => { e.preventDefault(); callbacks.onMicPress(); });
  micBtn.addEventListener('touchend', (e) => { e.preventDefault(); callbacks.onMicRelease(); });

  const submitText = () => {
    const val = textInput.value.trim();
    if (val) {
      callbacks.onTextSubmit(val);
      textInput.value = '';
    }
  };

  sendBtn.addEventListener('click', submitText);
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitText();
  });

  const keyHandler = (e: KeyboardEvent) => {
    if (e.target === textInput) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (e.type === 'keydown') callbacks.onMicPress();
      else callbacks.onMicRelease();
    }
  };
  document.addEventListener('keydown', keyHandler);
  document.addEventListener('keyup', keyHandler);

  peekBtn.addEventListener('click', callbacks.onPeekToggle);

  return {
    setStatus(text: string) { statusEl.textContent = text; },
    setListening(active: boolean) {
      micBtn.classList.toggle('listening', active);
      statusEl.textContent = active ? 'Listening...' : '';
    },
    destroy() {
      document.removeEventListener('keydown', keyHandler);
      document.removeEventListener('keyup', keyHandler);
    },
  };
}
