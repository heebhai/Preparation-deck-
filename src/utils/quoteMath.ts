import type { QuoteItem } from '../types/quote';

const QUOTES_STORAGE_KEY = 'hee_study_quotes_v1';

export const MAX_QUOTES = 30;

export const INITIAL_QUOTES: ReadonlyArray<Omit<QuoteItem, 'id' | 'createdAt'>> = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: "It always seems impossible until it's done.", author: 'Nelson Mandela' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { text: 'Your future is created by what you do today, not tomorrow.', author: 'Robert Kiyosaki' },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: 'Unknown' },
  { text: 'Dream big. Start small. Act now.', author: 'Robin Sharma' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Every hour of focused study is an investment in your future self.', author: 'Unknown' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'Strive for progress, not perfection.', author: 'Unknown' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { text: "Believe you can and you're halfway there.", author: 'Theodore Roosevelt' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: "Don't stop when you're tired. Stop when you're done.", author: 'Unknown' },
  { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
  { text: 'Small progress each day adds up to big results.', author: 'Satya Nani' },
  { text: "You don't have to be extreme, just consistent.", author: 'Unknown' },
  { text: 'Knowledge is power. Information is liberating.', author: 'Kofi Annan' },
  { text: 'Study hard, for the well is deep, and our minds grow sharper with practice.', author: 'Richard Baxter' },
  { text: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
  { text: 'Education is the passport to the future, for tomorrow belongs to those who prepare for it today.', author: 'Malcolm X' },
  { text: 'Continuous learning is the minimum requirement for success in any field.', author: 'Brian Tracy' },
  { text: 'There are no shortcuts to any place worth going.', author: 'Beverly Sills' },
  { text: 'Success usually comes to those who are too busy to be looking for it.', author: 'Henry David Thoreau' },
  { text: "Opportunities don't happen. You create them.", author: 'Chris Grosser' },
  { text: "Everything you've ever wanted is on the other side of fear.", author: 'George Addair' },
  { text: "Hard work beats talent when talent doesn't work hard.", author: 'Tim Notke' },
  { text: 'The best way to predict the future is to create it.', author: 'Peter Drucker' },
  { text: 'Stay steady, finish one chapter at a time, and trust your preparation.', author: 'Study Mentor' },
];

export function createSeededQuotes(baseTimestamp: number = Date.now()): QuoteItem[] {
  return INITIAL_QUOTES.map((q, idx) => ({
    id: `quote-seed-${idx + 1}`,
    text: q.text,
    author: q.author,
    scheduledDateKey: null,
    createdAt: baseTimestamp + idx,
  }));
}

export function sanitizeQuotes(raw: unknown): QuoteItem[] {
  if (!Array.isArray(raw)) {
    return createSeededQuotes();
  }

  const sanitized: QuoteItem[] = [];
  for (let i = 0; i < raw.length && sanitized.length < MAX_QUOTES; i += 1) {
    const entry = raw[i];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const text = typeof record.text === 'string' ? record.text.trim() : '';
    if (!text) continue;

    const id =
      typeof record.id === 'string' && record.id.trim().length > 0
        ? record.id.trim()
        : `quote-${Date.now()}-${i}`;
    const author =
      typeof record.author === 'string' && record.author.trim().length > 0
        ? record.author.trim()
        : 'Unknown';
    const scheduledDateKey =
      typeof record.scheduledDateKey === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(record.scheduledDateKey)
        ? record.scheduledDateKey
        : null;
    const createdAt =
      typeof record.createdAt === 'number' && Number.isFinite(record.createdAt)
        ? record.createdAt
        : Date.now() + i;

    sanitized.push({
      id,
      text,
      author,
      scheduledDateKey,
      createdAt,
    });
  }

  return sanitized.length > 0 ? sanitized : createSeededQuotes();
}

export function loadQuotes(): QuoteItem[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return createSeededQuotes();
    }
    const raw = window.localStorage.getItem(QUOTES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeQuotes(parsed);
      }
    }
  } catch {
    // Fallback to seeded quotes
  }

  const seeded = createSeededQuotes();
  saveQuotes(seeded);
  return seeded;
}

export function saveQuotes(quotes: ReadonlyArray<QuoteItem>): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(quotes));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

export function getDailyQuote(
  quotes: ReadonlyArray<QuoteItem>,
  todayKey: string,
): QuoteItem {
  if (!quotes || quotes.length === 0) {
    return {
      id: 'fallback',
      text: 'Consistency turns small daily sessions into mastery.',
      author: 'Study Mentor',
      scheduledDateKey: null,
      createdAt: Date.now(),
    };
  }

  // 1. Prioritize any quote explicitly scheduled for todayKey
  const scheduled = quotes.find((q) => q.scheduledDateKey === todayKey);
  if (scheduled) {
    return scheduled;
  }

  // 2. Deterministic date-based index so the daily quote stays stable throughout todayKey
  let hash = 0;
  for (let i = 0; i < todayKey.length; i += 1) {
    hash = (hash << 5) - hash + todayKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % quotes.length;
  return quotes[index];
}

export function shuffleQuotes(quotes: ReadonlyArray<QuoteItem>): QuoteItem[] {
  const arr = [...quotes];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function randomizeDailyQuote(
  quotes: ReadonlyArray<QuoteItem>,
  excludeId?: string,
): QuoteItem {
  if (quotes.length === 0) {
    throw new Error('No quotes available');
  }
  if (quotes.length === 1) {
    return quotes[0];
  }
  const pool = excludeId ? quotes.filter((q) => q.id !== excludeId) : quotes;
  const source = pool.length > 0 ? pool : quotes;
  const idx = Math.floor(Math.random() * source.length);
  return source[idx];
}

export function assignQuoteSchedule(
  quotes: ReadonlyArray<QuoteItem>,
  quoteId: string,
  dateKey: string | null,
): QuoteItem[] {
  return quotes.map((q) => {
    if (q.id === quoteId) {
      return { ...q, scheduledDateKey: dateKey };
    }
    // Clear previous quote scheduled on the same dateKey so only one quote owns that date
    if (dateKey !== null && q.scheduledDateKey === dateKey) {
      return { ...q, scheduledDateKey: null };
    }
    return q;
  });
}

export function addQuote(
  quotes: ReadonlyArray<QuoteItem>,
  text: string,
  author?: string,
): { quotes: QuoteItem[]; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { quotes: [...quotes], error: 'Quote text cannot be empty' };
  }
  if (quotes.length >= MAX_QUOTES) {
    return {
      quotes: [...quotes],
      error: `Maximum limit of ${MAX_QUOTES} quotes reached. Delete one to add a new quote.`,
    };
  }

  const newItem: QuoteItem = {
    id: `quote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: trimmed,
    author: author?.trim() || 'Unknown',
    scheduledDateKey: null,
    createdAt: Date.now(),
  };

  return { quotes: [newItem, ...quotes] };
}

export function editQuote(
  quotes: ReadonlyArray<QuoteItem>,
  id: string,
  text: string,
  author?: string,
): QuoteItem[] {
  return quotes.map((q) =>
    q.id === id
      ? {
          ...q,
          text: text.trim() || q.text,
          author: author !== undefined ? author.trim() || 'Unknown' : q.author,
        }
      : q,
  );
}

export function deleteQuote(
  quotes: ReadonlyArray<QuoteItem>,
  id: string,
): QuoteItem[] {
  return quotes.filter((q) => q.id !== id);
}
