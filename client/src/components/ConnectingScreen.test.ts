import { describe, expect, it } from 'vitest';
import { CONNECTION_TIPS, connectingCopy } from './ConnectingScreen';

describe('connectingCopy', () => {
  it('keeps the initial connection message concise', () => {
    expect(connectingCopy(false, 0)).toEqual({
      status: 'CONNECTING…',
      title: null,
      detail: null,
      tip: null,
    });
  });

  it('shows an engaging cold-start briefing after the delay', () => {
    const copy = connectingCopy(true, 1);

    expect(copy.status).toBe('STILL CONNECTING…');
    expect(copy.title).toBe('WAKING THE SAFEHOUSE');
    expect(copy.detail).toContain('first connection after downtime');
    expect(copy.tip).toBe(CONNECTION_TIPS[1]);
  });
});
