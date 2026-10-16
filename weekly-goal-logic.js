// ============================================
// Weekly goal — pure logic
//
// Everything in this file is a pure function: no DOM, no localStorage and
// no reading of the system clock. "Today" never arrives here either, because
// none of these functions depends on it.
//
// The rule for reading a written goal is the one in the spec, not the one a
// number input would apply. The field is plain text on purpose, and this
// file is the only place that decides what counts as a valid goal.
//
// Code and tests in English (constitution 6).
// ============================================

'use strict';

// --------------------------------------------
// Constants
// --------------------------------------------

/** Goal used until the person confirms one of their own (RF-2.3). */
const DEFAULT_GOAL_MINUTES = 30;

/** Lowest and highest accepted values (RF-2.5). */
const MIN_GOAL_MINUTES = 1;
const MAX_GOAL_MINUTES = 10080;

/**
 * Progress states. The logic names them and the interface translates them,
 * so the interface can never invent a state of its own.
 */
const GOAL_STATE = {
    IN_PROGRESS: 'in-progress',
    MET: 'met',
};

/**
 * Where the goal lives. It has its own key, apart from the sessions one,
 * so adding this feature never touches the study data (RF-7.1).
 *
 * The key is declared here, and not in the interface, because there has to
 * be a single copy of this text: a typo in one of two places would save the
 * goal under a key the app no longer reads.
 */
const GOAL_STORAGE_KEY = 'diarioEstudio_objetivo_semanal';

/** Written forms that mean an integer written in digits (RF-2.4). */
const DIGITS_ONLY = /^[0-9]+$/;

// --------------------------------------------
// Shared rules and the week (RF-1, RF-4.1, RF-6.1)
// --------------------------------------------
// The heat map already owns the date maths and the session rule, and they are
// already tested. This module does not repeat them: it reaches them through
// `heatMapRules`, so the week and the valid-session answer are the same
// everywhere in the app (D2, RF-5.1, RF-6.1).
//
// The browser branch reads them from `window` on purpose. In a classic script
// the declarations of heatmap-logic.js become properties of the global
// object, but under Node there is no `window` at all, so the same file has to
// require them instead.
//
// The name differs from the one in session-list-logic.js on purpose. Two
// classic scripts cannot declare the same `const` at top level: the second
// one would throw a SyntaxError and the whole block would stay unpainted.
const heatMapRules = typeof window !== 'undefined'
    ? {
        parseIso: window.parseIso,
        formatIso: window.formatIso,
        mondayOf: window.mondayOf,
        isValidSession: window.isValidSession,
    }
    : require('./heatmap-logic.js');

/**
 * Monday of the week that contains the given date.
 *
 * The week runs from Monday to Sunday, in local time. All the date maths is
 * the heat map's already tested one: it parses "YYYY-MM-DD" into a local
 * date and moves whole days with setDate, never with milliseconds, so a
 * daylight saving change cannot shift a day.
 *
 * @param {string} todayIso the day to look up, "YYYY-MM-DD".
 * @returns {string|null} the Monday, or null if the date cannot be read.
 */
function weekStartIso(todayIso) {
    const date = heatMapRules.parseIso(todayIso);
    if (date === null) return null;

    return heatMapRules.formatIso(heatMapRules.mondayOf(date));
}

/**
 * Minutes registered in the current week, from its Monday up to today.
 *
 * Dates are compared as "YYYY-MM-DD" text: with the leading zeros that order
 * is the chronological one, and it is what the heat map already does.
 *
 * Whether a session may be counted is decided by the shared session rules,
 * so a session of zero minutes, of 1441 minutes, with no date or dated in the
 * future is left out here exactly as it is left out of the heat map
 * (RF-5.1, RF-6.1).
 *
 * The sessions array is only read: nothing is filtered out of it and nothing
 * is written anywhere (RF-6.2, RF-10.4).
 *
 * @param {Array} sessions stored sessions, valid or not.
 * @param {string} todayIso the day to stop counting at, "YYYY-MM-DD".
 * @returns {number} total minutes, 0 when there is nothing to count.
 */
function sumWeekMinutes(sessions, todayIso) {
    const weekStart = weekStartIso(todayIso);
    if (weekStart === null) return 0;
    if (!Array.isArray(sessions)) return 0;

    let total = 0;

    for (const session of sessions) {
        // One shared rule for the whole app, never a second copy of it. It
        // already leaves out future dates, and it answers false without
        // reading any field on a null element or one with no date.
        if (!heatMapRules.isValidSession(session, todayIso)) continue;

        if (session.fecha < weekStart) continue;   // an earlier week
        if (session.fecha > todayIso) continue;    // a day ahead of today

        total += session.minutos;
    }

    return total;
}

// --------------------------------------------
// Reading what the person wrote (RF-2.4 to RF-2.6)
// --------------------------------------------

/**
 * Read the text of the goal field and decide whether it is a valid goal.
 *
 * Returns `{ ok: true, minutes }` for a valid goal and `{ ok: false }` for
 * anything else, so the caller can refuse the change and keep the goal it
 * already had (RF-2.6).
 *
 * Only digits are accepted, before and after trimming. That is what keeps
 * `parseInt` out of here: it would read "1e3" as 1 and "30.0" as 30, while
 * the browser can read the same text as 1000. The screen would then show a
 * goal the person did not choose.
 *
 * @param {string} rawValue the text of the field.
 * @returns {{ok: boolean, minutes?: number}}
 */
function parseGoalInput(rawValue) {
    // Not text: nothing to read as a goal.
    if (typeof rawValue !== 'string') return { ok: false };

    const text = rawValue.trim();

    // Rejects "", but also "1e3", "+30", "-30", "30.0", "30,5" and "30 min".
    if (!DIGITS_ONLY.test(text)) return { ok: false };

    // Leading zeros are fine: "030" is the integer 30.
    const minutes = Number(text);

    if (minutes < MIN_GOAL_MINUTES) return { ok: false };
    if (minutes > MAX_GOAL_MINUTES) return { ok: false };

    return { ok: true, minutes };
}

// --------------------------------------------
// Reading what was stored (RF-2.3, RF-7.7)
// --------------------------------------------

/**
 * Work out which goal is in force from what was stored.
 *
 * Returns `{ minutes, isDefault, unreadable }`:
 *   - nothing stored (null, or blank text) -> the default, no notice
 *   - stored but not readable               -> the default, with a notice
 *   - stored and valid                      -> its own value, no notice
 *
 * A value that is not text counts as "stored but not readable": saying the
 * default in silence would hide that a stored goal was lost.
 *
 * `isDefault` is what tells the interface to mark the label (RF-2.10), so a
 * goal the person confirmed at 30 minutes is never shown as a default.
 *
 * It never writes anything (RF-7.6, RF-7.8): reading leaves the store as it
 * was, and the default is never persisted on its own.
 *
 * @param {string|null} storedValue what the goal key returned.
 * @returns {{minutes: number, isDefault: boolean, unreadable: boolean}}
 */
function resolveGoal(storedValue) {
    // localStorage returns null when the key does not exist: nothing stored.
    // It is the only value that means "empty".
    if (storedValue === null) {
        return { minutes: DEFAULT_GOAL_MINUTES, isDefault: true, unreadable: false };
    }

    // A value that is not text cannot be read as a goal, so it is reported as
    // unreadable and never as "nothing stored": something is there, and
    // showing the default in silence would hide that the goal was lost.
    if (typeof storedValue !== 'string') {
        return { minutes: DEFAULT_GOAL_MINUTES, isDefault: true, unreadable: true };
    }

    if (storedValue.trim() === '') {
        return { minutes: DEFAULT_GOAL_MINUTES, isDefault: true, unreadable: false };
    }

    // There is something stored, so it is read with the very same rule the
    // field uses. A value that does not pass is a stored goal that cannot be
    // read: the default is used, but the person is told about it (RF-7.7).
    const parsed = parseGoalInput(storedValue);

    if (!parsed.ok) {
        return { minutes: DEFAULT_GOAL_MINUTES, isDefault: true, unreadable: true };
    }

    return { minutes: parsed.minutes, isDefault: false, unreadable: false };
}

// --------------------------------------------
// Progress and the view the interface paints (RF-3, RF-4.3, RF-10.3)
// --------------------------------------------

/**
 * How far the week has gone towards a goal.
 *
 * Reaching the goal counts as meeting it: the goal is not a target to
 * overshoot. Once it is met, nothing about the surplus comes back, so the
 * screen can never show an excess, a zero left over or a negative figure
 * (RF-3.3). The proportion is capped at 1 for the same reason (RF-3.4).
 *
 * It only ever talks about registered minutes. It never reads the data, so
 * nothing about what was studied is decided here (RF-3.5).
 *
 * @param {number} loggedMinutes minutes registered this week.
 * @param {number} goalMinutes the goal in force, always 1 or more.
 * @returns {{state: string, remainingMinutes: number, ratio: number}}
 */
function computeGoalProgress(loggedMinutes, goalMinutes) {
    // A goal that is not a usable number falls back to the default instead of
    // comparing against NaN, which would report a goal as met with no proof.
    const goal = Number.isFinite(goalMinutes)
        ? Math.max(MIN_GOAL_MINUTES, goalMinutes)
        : DEFAULT_GOAL_MINUTES;

    // Same reason: minutes that are not a usable number are no minutes.
    const logged = Number.isFinite(loggedMinutes)
        ? Math.max(0, loggedMinutes)
        : 0;

    if (logged < goal) {
        return {
            state: GOAL_STATE.IN_PROGRESS,
            remainingMinutes: goal - logged,
            ratio: Math.max(0, Math.min(1, logged / goal)),
        };
    }

    return { state: GOAL_STATE.MET, remainingMinutes: 0, ratio: 1 };
}

/**
 * Everything the goal block needs to paint itself, and nothing else.
 *
 * The interface only chooses which line to show from `state`, and never
 * compares numbers on its own (D7). That is why the surplus is absent here:
 * once the goal is met, there is no excess to leak through a template.
 *
 * When the sessions store cannot be read, `showSessionsNotice` asks for the
 * notice and `loggedMinutes` is zero. Nothing is claimed about the study
 * that week (RF-10.9).
 *
 * `storeStatus` is the value `readSessionStore` returns. It is read here, not
 * calculated: this file never goes to the storage itself.
 *
 * @param {Array} sessions stored sessions, valid or not.
 * @param {string} storeStatus "empty", "unreadable" or "ok".
 * @param {string|null} storedGoal what the goal key returned.
 * @param {string} todayIso the day to stop counting at, "YYYY-MM-DD".
 * @returns {object} the view, with the keys the interface consumes.
 */
function buildWeeklyGoalView(sessions, storeStatus, storedGoal, todayIso) {
    // Must match STORE_STATUS.UNREADABLE in session-list-logic.js. It is
    // written out here so this file stays independent of the list logic; the
    // caller passes the value that constant holds.
    const UNREADABLE_STORE = 'unreadable';

    const weekStart = weekStartIso(todayIso);
    const logged = sumWeekMinutes(sessions, todayIso);
    const goal = resolveGoal(storedGoal);
    const progress = computeGoalProgress(logged, goal.minutes);

    return {
        todayIso: todayIso,
        weekStartIso: weekStart,
        goalMinutes: goal.minutes,
        isDefaultGoal: goal.isDefault,
        goalUnreadable: goal.unreadable,
        loggedMinutes: logged,
        remainingMinutes: progress.remainingMinutes,
        ratio: progress.ratio,
        state: progress.state,
        storeStatus: storeStatus,
        showSessionsNotice: storeStatus === UNREADABLE_STORE,
    };
}

// Export only when running under Node, so `node --test` can require this
// file. In the browser the guard is false and the functions stay global.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseGoalInput,
        resolveGoal,
        weekStartIso,
        sumWeekMinutes,
        computeGoalProgress,
        buildWeeklyGoalView,
        DEFAULT_GOAL_MINUTES,
        MIN_GOAL_MINUTES,
        MAX_GOAL_MINUTES,
        GOAL_STATE,
        GOAL_STORAGE_KEY,
    };
}