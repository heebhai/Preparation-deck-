const SCREEN_TIME_STORAGE_KEY = 'syllabus_tracker_screen_time_v1';

export type ScreenTimeByDate = Record<string, number>;

export function loadScreenTimeMap(): ScreenTimeByDate {
  try {
    const raw = window.localStorage.getItem(SCREEN_TIME_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: ScreenTimeByDate = {};
    for (const [dateKey, mins] of Object.entries(parsed as Record<string, unknown>)) {
      if (
        /^\d{4}-\d{2}-\d{2}$/.test(dateKey) &&
        typeof mins === 'number' &&
        Number.isFinite(mins) &&
        mins >= 0
      ) {
        result[dateKey] = Math.min(24 * 60, Math.round(mins));
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function saveScreenTimeMap(map: ScreenTimeByDate): void {
  try {
    window.localStorage.setItem(SCREEN_TIME_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota / privacy errors
  }
}
