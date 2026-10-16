// ============================================
// Heat map — pure logic
//
// Everything in this file is a pure function: no DOM, no localStorage,
// and no reading of the system clock. The current day always arrives as
// the `todayIso` parameter ("YYYY-MM-DD"), so the same data with the same
// date always produces the same result.
//
// Code and tests in English (constitution 6); the UI is in Spanish.
// ============================================

'use strict';

// --------------------------------------------
// Date helpers (local time only)
// --------------------------------------------
// Never use toISOString() or new Date("YYYY-MM-DD"): both read the date
// in UTC and shift the day for users behind or ahead of Greenwich.

/**
 * Parse "YYYY-MM-DD" into a local Date at midnight.
 * Returns null when the string is not a real date.
 */
function parseIso(iso) {
    if (typeof iso !== 'string') return null;

    const parts = iso.split('-');
    if (parts.length !== 3) return null;

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    const date = new Date(year, month - 1, day);

    // Rejects overflow such as 2026-02-30, which Date would roll over.
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    return date;
}

/**
 * Format a local Date as "YYYY-MM-DD".
 */
function formatIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Add (or subtract) whole days, in local time.
 * Adding 86400000 milliseconds is wrong: DST days are 23 or 25 hours long.
 */
function addDays(date, days) {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Day of the week, 0 = Sunday ... 6 = Saturday (matches Date#getDay).
 */
function dayOfWeek(date) {
    return date.getDay();
}

/**
 * Monday of the week that contains the given date.
 */
function mondayOf(date) {
    const weekday = dayOfWeek(date);
    const offset = weekday === 0 ? -6 : 1 - weekday;
    return addDays(date, offset);
}

// --------------------------------------------
// Constants
// --------------------------------------------

const WEEKS_IN_WINDOW = 52;
const ROWS = 7;
const MAX_MINUTES_PER_SESSION = 1440;

// Absolute thresholds (RF-2.3). They never depend on the user's own data.
const INTENSITY_THRESHOLDS = [30, 60, 120];

// Short Spanish month names, used by the month labels (RF-7.1).
const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// A month label needs roughly this much room; below it the label is dropped
// instead of overlapping the previous one (RF-7.3).
const MIN_MONTH_LABEL_WIDTH = 30;

/** Day states used by the grid and by the detail panel. */
const DAY_STATE = {
    EMPTY: 'no-session',
    ONLY_INVALID: 'invalid-only',
    PARTIAL: 'partial',
    STUDIED: 'studied',
};

// --------------------------------------------
// Session validation (RF-4)
// --------------------------------------------

/**
 * Classify a stored session.
 * Everything except 'valid' counts as "excluded" for the map.
 */
function classifySession(session, todayIso) {
    if (session === null || typeof session !== 'object' || Array.isArray(session)) return 'malformed';

    const date = parseIso(session.fecha);
    if (date === null) return 'malformed';

    const minutes = session.minutos;
    if (typeof minutes !== 'number' || !Number.isInteger(minutes)) return 'malformed';
    if (minutes <= 0 || minutes > MAX_MINUTES_PER_SESSION) return 'bad-minutes';

    if (formatIso(date) > todayIso) return 'future';

    return 'valid';
}

/**
 * True when the session may contribute to the map.
 */
function isValidSession(session, todayIso) {
    return classifySession(session, todayIso) === 'valid';
}

/**
 * How many sessions are excluded, for any reason.
 */
function countExcludedSessions(sessions, todayIso) {
    if (!Array.isArray(sessions)) return 0;

    let excluded = 0;
    for (const session of sessions) {
        if (classifySession(session, todayIso) !== 'valid') excluded += 1;
    }
    return excluded;
}

// --------------------------------------------
// Intensity (RF-2)
// --------------------------------------------

/**
 * Map a day's total minutes onto 0-4. 0 means "no study".
 */
function intensityLevel(totalMinutes) {
    if (typeof totalMinutes !== 'number' || !Number.isFinite(totalMinutes) || totalMinutes <= 0) {
        return 0;
    }

    let level = 1;
    for (const threshold of INTENSITY_THRESHOLDS) {
        if (totalMinutes >= threshold) level += 1;
    }
    return level;
}

// --------------------------------------------
// Minutes per day (RF-2.1, RF-10.1)
// --------------------------------------------

/**
 * Total of valid minutes per date, and how many sessions each day holds.
 */
function sumMinutesByDate(sessions, todayIso) {
    const totals = new Map();
    if (!Array.isArray(sessions)) return totals;

    for (const session of sessions) {
        if (classifySession(session, todayIso) !== 'valid') continue;
        const date = session.fecha;
        totals.set(date, (totals.get(date) || 0) + session.minutos);
    }
    return totals;
}

/**
 * Per date: how many valid and how many excluded sessions it holds.
 * Dates whose sessions are all malformed cannot be keyed, so they only
 * appear in the overall excluded count.
 */
function countSessionsByDate(sessions, todayIso) {
    const counts = new Map();

    if (!Array.isArray(sessions)) return counts;

    const touch = date => {
        if (!counts.has(date)) counts.set(date, { valid: 0, excluded: 0 });
        return counts.get(date);
    };

    for (const session of sessions) {
        const verdict = classifySession(session, todayIso);

        if (verdict === 'malformed') continue;

        const entry = touch(session.fecha);
        if (verdict === 'valid') entry.valid += 1;
        else entry.excluded += 1;
    }
    return counts;
}

// --------------------------------------------
// Window and range (RF-1.2, RF-9)
// --------------------------------------------

/**
 * The 52-week window that ends on the week containing `todayIso`.
 */
function computeWindow(todayIso) {
    const today = parseIso(todayIso);
    const currentMonday = mondayOf(today);
    const start = addDays(currentMonday, -(WEEKS_IN_WINDOW - 1) * 7);

    return {
        start: formatIso(start),
        mondayOfCurrentWeek: formatIso(currentMonday),
        end: todayIso,
    };
}

/**
 * Validate a user-supplied range. Returns null when it should not be applied:
 * only one field filled, or the end before the start (RF-9.4, RF-9.5).
 */
function parseRange(fromIso, toIso) {
    if (typeof fromIso !== 'string' || fromIso === '') return null;
    if (typeof toIso !== 'string' || toIso === '') return null;

    const from = parseIso(fromIso);
    const to = parseIso(toIso);
    if (from === null || to === null) return null;
    if (formatIso(to) < formatIso(from)) return null;

    return { start: formatIso(from), end: formatIso(to) };
}

// --------------------------------------------
// Month labels (RF-7)
// --------------------------------------------

/**
 * One label per month, in order. A label whose column would sit too close to
 * the previous one is dropped rather than overlapping it (RF-7.2, RF-7.3).
 */
function monthLabelsFor(weeks, columnWidth) {
    const width = typeof columnWidth === 'number' && columnWidth > 0 ? columnWidth : 14;
    const labels = [];

    let lastMonth = null;
    let lastColumn = null;

    if (!Array.isArray(weeks)) return labels;

    for (let index = 0; index < weeks.length; index += 1) {
        const days = weeks[index].days;
        const first = days.find(day => day !== null && day !== undefined);
        if (!first) continue;

        const month = first.date.slice(5, 7);
        if (month === lastMonth) continue;

        if (lastColumn !== null && (index - lastColumn) * width < MIN_MONTH_LABEL_WIDTH) continue;

        labels.push({ columnIndex: index, text: MONTH_NAMES[Number(month) - 1] });
        lastMonth = month;
        lastColumn = index;
    }
    return labels;
}

// --------------------------------------------
// Detail of a single day (RF-5.2, RF-5.8, RF-5.9)
// --------------------------------------------

/**
 * What to tell the user about one day. The UI only translates `state`, so it
 * can never claim "no study" for a day whose record is merely corrupt.
 */
function detailForDate(sessions, dateIso, todayIso) {
    const validMinutes = sumMinutesByDate(sessions, todayIso).get(dateIso) || 0;
    const counts = countSessionsByDate(sessions, todayIso).get(dateIso) || { valid: 0, excluded: 0 };

    let state = DAY_STATE.EMPTY;
    if (counts.valid > 0 && counts.excluded > 0) state = DAY_STATE.PARTIAL;
    else if (counts.valid > 0) state = DAY_STATE.STUDIED;
    else if (counts.excluded > 0) state = DAY_STATE.ONLY_INVALID;

    return {
        date: dateIso,
        totalMinutes: validMinutes,
        validCount: counts.valid,
        excludedCount: counts.excluded,
        state,
    };
}

// --------------------------------------------
// The grid (RF-1, RF-3, RF-9)
// --------------------------------------------

/**
 * Build the whole grid: 52 columns x 7 rows, ready to paint.
 * `range` is an optional { start, end } already validated by parseRange.
 */
function buildHeatMap(sessions, todayIso, range) {
    const window = computeWindow(todayIso);
    const validMinutes = sumMinutesByDate(sessions, todayIso);
    const counts = countSessionsByDate(sessions, todayIso);

    let start = window.start;
    let end = window.end;
    let emptyRange = false;

    if (range && typeof range.start === 'string' && typeof range.end === 'string') {
        start = range.start > window.start ? range.start : window.start;
        end = range.end < window.end ? range.end : window.end;
        // A range entirely outside the window leaves an empty grid, not an error.
        if (start > end) emptyRange = true;
    }

    const weeks = [];

    for (let index = 0; index < WEEKS_IN_WINDOW; index += 1) {
        const monday = formatIso(addDays(parseIso(window.start), index * 7));
        const days = [];

        for (let row = 0; row < ROWS; row += 1) {
            const date = formatIso(addDays(parseIso(monday), row));

            // Not represented: outside the window or filter, or in the future.
            if (emptyRange || date < start || date > end || date > window.end) {
                days.push(null);
                continue;
            }

            const minutes = validMinutes.get(date) || 0;
            const count = counts.get(date) || { valid: 0, excluded: 0 };

            let state = DAY_STATE.EMPTY;
            if (count.valid > 0 && count.excluded > 0) state = DAY_STATE.PARTIAL;
            else if (count.valid > 0) state = DAY_STATE.STUDIED;
            else if (count.excluded > 0) state = DAY_STATE.ONLY_INVALID;

            days.push({ date, row, totalMinutes: minutes, level: intensityLevel(minutes), state });
        }

        weeks.push({ monday, days });
    }

    return {
        columns: WEEKS_IN_WINDOW,
        rows: ROWS,
        start: window.start,
        end: window.end,
        weeks,
        monthLabels: monthLabelsFor(weeks),
        excludedCount: countExcludedSessions(sessions, todayIso),
    };
}

// Export only when running under Node, so `node --test` can require this
// file. In the browser the guard is false and the functions stay global.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseIso,
        formatIso,
        addDays,
        dayOfWeek,
        mondayOf,
        isValidSession,
        classifySession,
        countExcludedSessions,
        intensityLevel,
        sumMinutesByDate,
        countSessionsByDate,
        computeWindow,
        parseRange,
        monthLabelsFor,
        detailForDate,
        buildHeatMap,
        INTENSITY_THRESHOLDS,
        DAY_STATE,
    };
}