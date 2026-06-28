import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type SpeechAnswerState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'matched'
  | 'no-match'
  | 'permission-denied'
  | 'unsupported';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const SMALL_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

function spokenNumberToDigits(value: string): string | null {
  const tokens = value.replace(/-/g, ' ').split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const allDigitWords = tokens.every((token) => token in SMALL_NUMBERS && SMALL_NUMBERS[token] < 10);
  if (allDigitWords && tokens.length > 1) return tokens.map((token) => SMALL_NUMBERS[token]).join('');

  let total = 0;
  let current = 0;
  let seenNumber = false;

  for (const token of tokens) {
    if (token === 'and') continue;
    if (token in SMALL_NUMBERS) {
      current += SMALL_NUMBERS[token];
      seenNumber = true;
    } else if (token in TENS) {
      current += TENS[token];
      seenNumber = true;
    } else if (token === 'hundred') {
      current = Math.max(1, current) * 100;
      seenNumber = true;
    } else if (token === 'thousand') {
      total += Math.max(1, current) * 1000;
      current = 0;
      seenNumber = true;
    } else {
      return null;
    }
  }

  return seenNumber ? String(total + current) : null;
}

export function normalizeSpeechAnswer(value: string): string {
  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:"]/g, '')
    .replace(/\s+/g, ' ');
  return spokenNumberToDigits(cleaned) ?? cleaned;
}

function speechCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

interface UseSpeechAnswerOptions {
  enabled: boolean;
  onTranscript: (normalized: string, raw: string) => boolean;
}

export function useSpeechAnswer({ enabled, onTranscript }: UseSpeechAnswerOptions) {
  const [state, setState] = useState<SpeechAnswerState>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const latestTranscriptRef = useRef('');
  const submittedRef = useRef(false);
  const clearFeedbackRef = useRef<number | null>(null);
  const supported = useMemo(() => !!speechCtor(), []);

  const clearFeedback = useCallback(() => {
    if (clearFeedbackRef.current !== null) window.clearTimeout(clearFeedbackRef.current);
    clearFeedbackRef.current = window.setTimeout(() => {
      setState((prev) => (prev === 'matched' || prev === 'no-match' ? 'idle' : prev));
    }, 850);
  }, []);

  const submit = useCallback(
    (raw: string) => {
      const normalized = normalizeSpeechAnswer(raw);
      if (!normalized) {
        setState('no-match');
        clearFeedback();
        return;
      }
      setState('processing');
      const matched = onTranscript(normalized, raw);
      setState(matched ? 'matched' : 'no-match');
      clearFeedback();
    },
    [clearFeedback, onTranscript],
  );

  const stopListening = useCallback(async () => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(async () => {
    if (!enabled) return;
    const Ctor = speechCtor();
    if (!Ctor) {
      setState('unsupported');
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Ctor();
    recognitionRef.current = recognition;
    latestTranscriptRef.current = '';
    submittedRef.current = false;
    setTranscript('');

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setState('listening');
    recognition.onerror = (event) => {
      submittedRef.current = true;
      setState(event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'permission-denied' : 'no-match');
      clearFeedback();
    };
    recognition.onresult = (event) => {
      let latest = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        latest = result[0]?.transcript ?? latest;
        if (result.isFinal && latest.trim()) {
          latestTranscriptRef.current = latest;
          setTranscript(latest);
          submittedRef.current = true;
          recognition.stop();
          submit(latest);
          return;
        }
      }
      if (latest.trim()) {
        latestTranscriptRef.current = latest;
        setTranscript(latest);
      }
    };
    recognition.onend = () => {
      if (submittedRef.current) return;
      const latest = latestTranscriptRef.current.trim();
      submittedRef.current = true;
      if (latest) submit(latest);
      else setState('idle');
    };

    try {
      recognition.start();
    } catch {
      setState('no-match');
      clearFeedback();
    }
  }, [clearFeedback, enabled, submit]);

  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    latestTranscriptRef.current = '';
    submittedRef.current = false;
    setTranscript('');
    setState(supported ? 'idle' : 'unsupported');
  }, [supported]);

  useEffect(() => {
    if (!enabled) reset();
    return () => {
      recognitionRef.current?.abort();
      if (clearFeedbackRef.current !== null) window.clearTimeout(clearFeedbackRef.current);
    };
  }, [enabled, reset]);

  return {
    supported,
    state: supported ? state : 'unsupported',
    transcript,
    startListening,
    stopListening,
    reset,
  };
}

