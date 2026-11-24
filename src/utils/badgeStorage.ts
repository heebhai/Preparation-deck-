import type { BadgeId } from './badgesMath';

const BADGES_STORAGE_KEY = 'syllabus_tracker_badges_v1';

export function loadSavedBadges(): Partial<Record<BadgeId, number>> {
  try {
    const raw = window.localStorage.getItem(BADGES_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: Partial<Record<BadgeId, number>> = {};
    const validIds: BadgeId[] = [
      'early-bird',
      'night-owl',
      'chapter-crusher',
      'on-fire',
      'deep-focus',
    ];
    for (const id of validIds) {
      const val = (parsed as Record<string, unknown>)[id];
      if (typeof val === 'number' && Number.isFinite(val)) {
        result[id] = val;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function saveBadges(badgesMap: Partial<Record<BadgeId, number>>): void {
  try {
    window.localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(badgesMap));
  } catch {
    // Ignore storage quota / privacy errors
  }
}
