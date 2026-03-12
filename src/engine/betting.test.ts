import { getValidActions, validateAction } from './betting';
import type { Player, BettingAction } from '../types';

const makePlayer = (chips: number, partial?: Partial<Player>): Player => ({
  id: 0, name: 'Test', chips, holeCards: [], folded: false,
  allIn: false, isHuman: true, rebuysLeft: 2, eliminated: false,
  ...partial,
});

describe('getValidActions', () => {
  it('allows check when no bet', () => {
    const actions = getValidActions(makePlayer(1000), 0, 0, 100);
    const types = actions.map(a => a.type);
    expect(types).toContain('check');
    expect(types).toContain('raise');
    expect(types).not.toContain('call');
  });

  it('allows call/fold/raise when facing a bet', () => {
    const actions = getValidActions(makePlayer(1000), 100, 100, 200);
    const types = actions.map(a => a.type);
    expect(types).toContain('call');
    expect(types).toContain('fold');
    expect(types).toContain('raise');
    expect(types).not.toContain('check');
  });

  it('allows only allIn and fold when chips less than call', () => {
    const actions = getValidActions(makePlayer(50), 100, 100, 200);
    const types = actions.map(a => a.type);
    expect(types).toContain('allIn');
    expect(types).toContain('fold');
    expect(types).not.toContain('call');
    expect(types).not.toContain('raise');
  });

  it('allows call and allIn but no raise when chips equal call but less than min raise', () => {
    const actions = getValidActions(makePlayer(100), 100, 100, 200);
    const types = actions.map(a => a.type);
    expect(types).toContain('call');
    expect(types).toContain('allIn');
    expect(types).toContain('fold');
  });
});

describe('validateAction', () => {
  it('rejects raise below minimum', () => {
    const result = validateAction(
      { type: 'raise', amount: 50 },
      makePlayer(1000), 100, 100, 0
    );
    expect(result).toBe(false);
  });

  it('accepts valid raise', () => {
    const result = validateAction(
      { type: 'raise', amount: 300 },
      makePlayer(1000), 100, 100, 0
    );
    expect(result).toBe(true);
  });

  it('rejects check when there is a bet', () => {
    const result = validateAction(
      { type: 'check' },
      makePlayer(1000), 100, 100, 0
    );
    expect(result).toBe(false);
  });
});
