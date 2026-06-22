// ---------------------------------------------------------------------------
// Typing / matching logic. Pure & unit-tested.
// Words live in a queue that is independent of the zombies.
// ---------------------------------------------------------------------------

export interface MatchOptions {
  /** Punctuation + capitalization matter (Nightmare / strict mode). */
  strict?: boolean;
  /** Ignore punctuation entirely. */
  casual?: boolean;
  /** Force case-sensitive comparison. */
  caseSensitive?: boolean;
}

const PUNCT = /[.,/#!$%^&*;:{}=\-_`~()'"?]/g;

/**
 * Normalize a piece of text for comparison according to the given options.
 * - strict: keep everything, only trim outer whitespace.
 * - casual: drop punctuation and collapse whitespace.
 * - default: lowercase + collapse whitespace.
 */
export function normalize(text: string, opts: MatchOptions = {}): string {
  let out = text.replace(/\s+/g, ' ').trim();
  const caseSensitive = opts.caseSensitive || opts.strict;
  if (!caseSensitive) out = out.toLowerCase();
  if (opts.casual && !opts.strict) {
    out = out.replace(PUNCT, '').replace(/\s+/g, ' ').trim();
  }
  return out;
}

/** True when the fully typed input equals the target. */
export function matchesTarget(input: string, target: string, opts: MatchOptions = {}): boolean {
  return normalize(input, opts) === normalize(target, opts) && input.trim().length > 0;
}

/** True when the typed input is a (non-empty) prefix of the target — used for live highlighting. */
export function isPrefix(input: string, target: string, opts: MatchOptions = {}): boolean {
  if (input.trim().length === 0) return false;
  const ni = normalize(input, opts);
  const nt = normalize(target, opts);
  return nt.startsWith(ni);
}

/** Index of the queue word that the input exactly matches, or -1. */
export function findQueueMatch(input: string, queue: string[], opts: MatchOptions = {}): number {
  return queue.findIndex((w) => matchesTarget(input, w, opts));
}

/** Index of the queue word that the input is currently a prefix of, or -1. */
export function findQueuePrefix(input: string, queue: string[], opts: MatchOptions = {}): number {
  return queue.findIndex((w) => isPrefix(input, w, opts));
}
