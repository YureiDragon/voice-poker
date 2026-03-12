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
let playerActionResolve: ((action: BettingAction) => void) | null = null;
let peekVisible = false;

function startApp(): void {
  renderStartScreen(app, onStartGame);
}

async function onStartGame(config: GameConfig): Promise<void> {
  narrator = new Narrator(config.speechRate ?? 1.0);
  listener = new Listener();
  game = new Game(config);

  const screen = renderGameScreen(app, {
    onMicPress: handleMicPress,
    onMicRelease: handleMicRelease,
    onTextSubmit: handleTextInput,
    onPeekToggle: handlePeekToggle,
  });

  game.onNarrate = async (text: string) => {
    screen.setStatus(text);
    await narrator!.speak(text);
  };

  game.onWaitForPlayer = () => {
    screen.setStatus('Your action...');
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

async function handleMicPress(): Promise<void> {
  if (!listener?.isSupported()) return;
  const screen = document.querySelector('.btn-mic') as HTMLElement | null;
  screen?.classList.add('listening');

  try {
    const text = await listener!.start();
    screen?.classList.remove('listening');
    processInput(text);
  } catch {
    screen?.classList.remove('listening');
  }
}

function handleMicRelease(): void {
  listener?.stop();
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
