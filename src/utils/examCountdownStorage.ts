import type { BoardExamSettings } from '../types/examCountdown';
import {
  createDefaultBoardExamSettings,
  validateExamDateKey,
} from './examCountdownMath';
import { getLocalDateKey } from './studyLogMath';

const BOARD_EXAM_STORAGE_KEY = 'syllabus_tracker_board_exam_date_v1';

export function loadBoardExamSettings(
  todayKey: string = getLocalDateKey(),
): BoardExamSettings {
  try {
    const raw = window.localStorage.getItem(BOARD_EXAM_STORAGE_KEY);
    if (!raw) {
      return createDefaultBoardExamSettings(todayKey);
    }
    const parsed = JSON.parse(raw) as Partial<BoardExamSettings> | null;
    if (!parsed || typeof parsed.examDateKey !== 'string') {
      return createDefaultBoardExamSettings(todayKey);
    }
    const validated = validateExamDateKey(parsed.examDateKey);
    if (!validated.valid) {
      return createDefaultBoardExamSettings(todayKey);
    }
    return {
      examDateKey: validated.dateKey,
      isCustom: Boolean(parsed.isCustom),
    };
  } catch {
    return createDefaultBoardExamSettings(todayKey);
  }
}

export function saveBoardExamSettings(settings: BoardExamSettings): void {
  try {
    window.localStorage.setItem(BOARD_EXAM_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore localStorage quota or private mode failures
  }
}
