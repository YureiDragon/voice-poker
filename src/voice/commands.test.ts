import { parseCommand } from './commands';

describe('parseCommand', () => {
  it('parses fold', () => {
    const cmd = parseCommand('fold', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'fold' } });
  });

  it('parses check', () => {
    const cmd = parseCommand('check', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'check' } });
  });

  it('parses call', () => {
    const cmd = parseCommand('call', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'call' } });
  });

  it('parses raise to amount', () => {
    const cmd = parseCommand('raise to 500', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'raise', amount: 500 } });
  });

  it('parses raise amount (without "to")', () => {
    const cmd = parseCommand('raise 500', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'raise', amount: 500 } });
  });

  it('parses raise 3x with pot context', () => {
    const cmd = parseCommand('raise 3x', 5, 100);
    expect(cmd).toEqual({ type: 'action', action: { type: 'raise', amount: 300 } });
  });

  it('parses raise pot', () => {
    const cmd = parseCommand('raise pot', 5, 200);
    expect(cmd).toEqual({ type: 'action', action: { type: 'raise', amount: 200 } });
  });

  it('parses raise half pot', () => {
    const cmd = parseCommand('raise half pot', 5, 200);
    expect(cmd).toEqual({ type: 'action', action: { type: 'raise', amount: 100 } });
  });

  it('parses min raise', () => {
    const cmd = parseCommand('min raise', 5, 200, 50);
    expect(cmd).toEqual({ type: 'action', action: { type: 'raise', amount: 50 } });
  });

  it('parses all in', () => {
    const cmd = parseCommand('all in', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'allIn' } });
  });

  it('parses board state query', () => {
    const cmd = parseCommand('board state', 5);
    expect(cmd).toEqual({ type: 'query', query: { type: 'boardState' } });
  });

  it('parses pot size query', () => {
    const cmd = parseCommand('pot size', 5);
    expect(cmd).toEqual({ type: 'query', query: { type: 'potSize' } });
  });

  it('parses my stack query', () => {
    const cmd = parseCommand('my stack', 5);
    expect(cmd).toEqual({ type: 'query', query: { type: 'myStack' } });
  });

  it('parses player N stack query', () => {
    const cmd = parseCommand('player 3 stack', 5);
    expect(cmd).toEqual({ type: 'query', query: { type: 'playerStack', playerId: 3 } });
  });

  it('parses review', () => {
    const cmd = parseCommand('review', 5);
    expect(cmd).toEqual({ type: 'review' });
  });

  it('parses peek', () => {
    const cmd = parseCommand('peek', 5);
    expect(cmd).toEqual({ type: 'peek' });
  });

  it('returns null for unrecognized input', () => {
    const cmd = parseCommand('banana split', 5);
    expect(cmd).toBeNull();
  });

  it('is case insensitive', () => {
    const cmd = parseCommand('FOLD', 5);
    expect(cmd).toEqual({ type: 'action', action: { type: 'fold' } });
  });
});
