import { describe, expect, it } from 'vitest';
import { CONNECTION_FACT_DELAY_MS, nextScaryFactIndex, SCARY_FACTS } from './ConnectingScreen';

describe('cold-start scary facts', () => {
  it('reveals a fact after three seconds', () => {
    expect(CONNECTION_FACT_DELAY_MS).toBe(3_000);
  });

  it('rotates to a different fact', () => {
    expect(nextScaryFactIndex(2, 0, SCARY_FACTS.length)).toBe(3);
    expect(nextScaryFactIndex(2, 0.999, SCARY_FACTS.length)).not.toBe(2);
  });

  it('keeps selected facts inside the available list', () => {
    const next = nextScaryFactIndex(SCARY_FACTS.length - 1, 0.45, SCARY_FACTS.length);
    expect(next).toBeGreaterThanOrEqual(0);
    expect(next).toBeLessThan(SCARY_FACTS.length);
  });
});
