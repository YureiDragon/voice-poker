import type { BettingAction, GameConfig } from './types';
import { Game } from './engine/game';
import { Narrator } from './voice/narrator';
import { Listener } from './voice/listener';
import { parseCommand } from './voice/commands';
import { renderStartScreen } from './ui/start-screen';
import { renderGameScreen } from './ui/game-screen';
import { renderPeekOverlay, hidePeekOverlay } from './ui/peek-overlay';

const app = document.getElementById('app')!;

let game: Game | null = null;
let narrator: Narrator | null = null;
let listener: Listener | null = null;
let screen: ReturnType<typeof renderGameScreen> | null = null;
let playerActionResolve: ((action: BettingAction) => void) | null = null;
let peekVisible = false;

function startApp(): void {
  renderStartScreen(app, onStartGame);
}

async function onStartGame(config: GameConfig): Promise<void> {
  narrator = new Narrator(config.speechRate ?? 1.0);
  listener = new Listener();
  game = new Game(config);

  screen = renderGameScreen(app, {
    onMicTap: handleMicTap,
    onTextSubmit: handleTextInput,
    onPeekToggle: handlePeekToggle,
  });

  game.onNarrate = async (text: string) => {
    screen!.setStatus(text);
    await narrator!.speak(text);
  };

  game.onWaitForPlayer = () => {
    screen!.setStatus('Your action...');
    return new Promise<BettingAction>((resolve) => {
      playerActionResolve = resolve;
    });
  };

  game.onGameOver = (winner) => {
    setTimeout(() => {
      if (confirm(`${winner.name} wins! Play again?`)) {
        startApp();
      }
    }, 2000);
  };

  await game.start();
}

async function handleMicTap(): Promise<void> {
  if (!listener) return;

  // If already listening, stop
  if (listener.isListening()) {
    listener.stop();
    screen?.setListening(false);
    return;
  }

  // Check support and give clear feedback
  if (!listener.isSupported()) {
    screen?.setStatus('Voice not available — use text input below');
    narrator?.speak('Voice input is not available. Please use the text input.');
    return;
  }

  screen?.setListening(true);

  try {
    const text = await listener.start();
    screen?.setListening(false);
    screen?.setStatus(`Heard: "${text}"`);
    processInput(text);
  } catch (e: any) {
    screen?.setListening(false);
    if (e.message === 'no-speech') {
      screen?.setStatus("Didn't catch that — tap mic and try again");
    } else if (e.message === 'not-allowed') {
      screen?.setStatus('Microphone access denied — check browser permissions');
    } else {
      screen?.setStatus('Voice error — use text input below');
    }
  }
}

function handleTextInput(text: string): void {
  processInput(text);
}

function processInput(text: string): void {
  if (!game) return;

  const pot = game.getState().pot;
  const minRaise = game.getState().minRaise;
  const numPlayers = game.getState().players.length;
  const command = parseCommand(text, numPlayers, pot, minRaise);

  if (!command) {
    narrator?.speak("I didn't understand that. Try again.");
    return;
  }

  switch (command.type) {
    case 'action':
      if (playerActionResolve) {
        playerActionResolve(command.action);
        playerActionResolve = null;
      } else {
        narrator?.speak("It's not your turn.");
      }
      break;
    case 'query': {
      const response = game.handleQuery(command.query);
      narrator?.speak(response);
      break;
    }
    case 'review': {
      const review = game.getHandReview();
      narrator?.speak(review);
      break;
    }
    case 'peek':
      handlePeekToggle();
      break;
    case 'resume': {
      const peekContainer = document.getElementById('peek-container');
      if (peekContainer) {
        hidePeekOverlay(peekContainer);
        peekVisible = false;
      }
      break;
    }
  }
}

function handlePeekToggle(): void {
  const peekContainer = document.getElementById('peek-container');
  if (!peekContainer || !game) return;

  if (peekVisible) {
    hidePeekOverlay(peekContainer);
    peekVisible = false;
  } else {
    renderPeekOverlay(peekContainer, game.getState(), () => { peekVisible = false; });
    peekVisible = true;
  }
}

startApp();
