import { describe, expect, it } from 'vitest';
import { normalizeSpeechAnswer } from './speech';

describe('normalizeSpeechAnswer', () => {
  it('normalizes punctuation and casing', () => {
    expect(normalizeSpeechAnswer('  The Moon! ')).toBe('the moon');
  });

  it('converts simple spoken numbers for math answers', () => {
    expect(normalizeSpeechAnswer('twenty four')).toBe('24');
    expect(normalizeSpeechAnswer('one hundred and five')).toBe('105');
  });

  it('keeps digit-by-digit speech useful', () => {
    expect(normalizeSpeechAnswer('one two three')).toBe('123');
  });
});

