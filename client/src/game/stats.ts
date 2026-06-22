// ---------------------------------------------------------------------------
// Typing performance metrics. Pure & unit-tested.
// ---------------------------------------------------------------------------

/** Accuracy as a 0-100 percentage. With no attempts, accuracy is a clean 100. */
export function calcAccuracy(correctWords: number, mistakes: number): number {
  const total = correctWords + mistakes;
  if (total === 0) return 100;
  return Math.round((correctWords / total) * 1000) / 10;
}

/**
 * Words-per-minute using the standard "5 chars = 1 word" convention.
 * `charsTyped` is the number of correctly typed characters.
 */
export function calcWpm(charsTyped: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || charsTyped <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return Math.round(charsTyped / 5 / minutes);
}

/** New streak value after a correct word. */
export function bumpStreak(streak: number): number {
  return streak + 1;
}

/**
 * Streak after a mistake. In strict mode any mistake resets the streak,
 * otherwise it is forgiving and halves it (rounded down).
 */
export function breakStreak(streak: number, strict: boolean): number {
  return strict ? 0 : Math.floor(streak / 2);
}

/** How fast a word must be cleared (ms) to count as a HEADSHOT. */
export function headshotThresholdMs(wordLength: number): number {
  return Math.max(350, wordLength * 110);
}

export function isHeadshot(wordLength: number, clearedMs: number): boolean {
  return clearedMs > 0 && clearedMs <= headshotThresholdMs(wordLength);
}
