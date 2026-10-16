// ============================================
// Weekly goal — tests
//
// Run with: node --test
//
// Everything here is pure: the goal text arrives as a parameter and no clock,
// no DOM and no localStorage are involved. "Today" is never read, because
// none of these functions depends on it.
//
// The accepted and rejected written forms are normative (spec RF-2.4 to
// RF-2.6). They are pinned one by one so a change in the rule shows up
// here instead of on screen.
//
// Code and tests in English (constitution 6).
// ============================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const logic = require('./weekly-goal-logic.js');

const {
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
} = logic;

// Helpers ---------------------------------------------------------------

/** Build a stored session, with the field names the user really has. */
function session(date, minutes) {
    return { fecha: date, tema: 'Test', minutos: minutes };
}

const TODAY = '2026-10-02';  // a Friday, whose week starts on 2026-09-28

// Accepted forms (RF-2.4) ------------------------------------------------

test('a plain number of minutes is accepted', () => {
    assert.deepEqual(parseGoalInput('30'), { ok: true, minutes: 30 });
});

test('spaces around the number are accepted', () => {
    assert.deepEqual(parseGoalInput(' 30 '), { ok: true, minutes: 30 });
    assert.deepEqual(parseGoalInput('\t30\n'), { ok: true, minutes: 30 });
});

test('a leading zero is accepted and means the same number', () => {
    assert.deepEqual(parseGoalInput('030'), { ok: true, minutes: 30 });
    assert.deepEqual(parseGoalInput('007'), { ok: true, minutes: 7 });
});

test('the lowest and the highest allowed values are accepted', () => {
    assert.deepEqual(parseGoalInput('1'), { ok: true, minutes: MIN_GOAL_MINUTES });
    assert.deepEqual(parseGoalInput('10080'), { ok: true, minutes: MAX_GOAL_MINUTES });
});

// Rejected forms (RF-2.4 to RF-2.6) ---------------------------------------

test('an empty value is rejected', () => {
    assert.deepEqual(parseGoalInput(''), { ok: false });
    assert.deepEqual(parseGoalInput('   '), { ok: false });
});

test('zero is rejected, since the lowest allowed value is one', () => {
    assert.deepEqual(parseGoalInput('0'), { ok: false });
    assert.deepEqual(parseGoalInput('00'), { ok: false });
});

test('exponential notation is rejected', () => {
    // The browser could read "1e3" as 1000 while an integer read gives 1.
    // The screen cannot know which one the person meant.
    assert.deepEqual(parseGoalInput('1e3'), { ok: false });
    assert.deepEqual(parseGoalInput('1E3'), { ok: false });
});

test('a plus sign is rejected', () => {
    assert.deepEqual(parseGoalInput('+30'), { ok: false });
});

test('a minus sign is rejected', () => {
    assert.deepEqual(parseGoalInput('-30'), { ok: false });
});

test('a decimal point is rejected, even with no fraction', () => {
    assert.deepEqual(parseGoalInput('30.0'), { ok: false });
    assert.deepEqual(parseGoalInput('30.5'), { ok: false });
});

test('a decimal comma is rejected', () => {
    assert.deepEqual(parseGoalInput('30,5'), { ok: false });
});

test('a unit written by hand is rejected', () => {
    assert.deepEqual(parseGoalInput('30 min'), { ok: false });
    assert.deepEqual(parseGoalInput('30min'), { ok: false });
    assert.deepEqual(parseGoalInput('minutos'), { ok: false });
});

test('words are rejected', () => {
    assert.deepEqual(parseGoalInput('abc'), { ok: false });
    assert.deepEqual(parseGoalInput('NaN'), { ok: false });
});

test('values over the maximum are rejected', () => {
    assert.deepEqual(parseGoalInput('10081'), { ok: false });
    assert.deepEqual(parseGoalInput('999999'), { ok: false });
    // Long enough to lose precision as a number, still over the maximum.
    assert.deepEqual(parseGoalInput('99999999999999999999'), { ok: false });
});

test('a number that is not text is rejected', () => {
    for (const value of [30, 0, -30, null, undefined, {}, [], true]) {
        assert.deepEqual(parseGoalInput(value), { ok: false }, `for ${String(value)}`);
    }
});

// Reading a stored goal (RF-2.3, RF-7.7) -------------------------------

test('no stored goal means the default, with no notice', () => {
    const expected = { minutes: DEFAULT_GOAL_MINUTES, isDefault: true, unreadable: false };

    assert.deepEqual(resolveGoal(null), expected);
    assert.deepEqual(resolveGoal(''), expected);
    assert.deepEqual(resolveGoal('   '), expected);
});

test('a stored goal that is not text falls back with a notice', () => {
    // Something is stored there but it cannot be read as a goal. Saying
    // "30 min by default" in silence would hide that the goal was lost
    // (MEMORY.md: never state what the data does not prove).
    const expected = { minutes: DEFAULT_GOAL_MINUTES, isDefault: true, unreadable: true };

    for (const value of [undefined, 30, 0, -30, true, false, {}, ['30'], () => 30]) {
        assert.deepEqual(resolveGoal(value), expected, `for ${String(value)}`);
    }
});

test('only null means nothing stored', () => {
    // localStorage returns null when the key does not exist. That is the one
    // case that means "empty"; anything else that is not text is a stored
    // goal that cannot be read, and it is warned about.
    const result = resolveGoal(null);
    assert.equal(result.minutes, DEFAULT_GOAL_MINUTES);
    assert.equal(result.isDefault, true);
    assert.equal(result.unreadable, false);
});

test('a stored goal that cannot be read falls back with a notice', () => {
    const expected = { minutes: DEFAULT_GOAL_MINUTES, isDefault: true, unreadable: true };

    assert.deepEqual(resolveGoal('abc'), expected);
    assert.deepEqual(resolveGoal('30.0'), expected);
    assert.deepEqual(resolveGoal('30,5'), expected);
    assert.deepEqual(resolveGoal('1e3'), expected);
    assert.deepEqual(resolveGoal('0'), expected);
    assert.deepEqual(resolveGoal('10081'), expected);
});

test('a valid stored goal is used as it is, with no notice', () => {
    assert.deepEqual(resolveGoal('30'), { minutes: 30, isDefault: false, unreadable: false });
    assert.deepEqual(resolveGoal(' 450 '), { minutes: 450, isDefault: false, unreadable: false });
    assert.deepEqual(resolveGoal('10080'), { minutes: MAX_GOAL_MINUTES, isDefault: false, unreadable: false });
});

test('a stored goal of thirty is told apart from the default', () => {
    // Both show 30 minutes, and only `isDefault` can say whether the person
    // chose it. RF-2.10 depends on this difference.
    const chosen = resolveGoal('30');
    const fallback = resolveGoal(null);

    assert.equal(chosen.minutes, fallback.minutes);
    assert.equal(chosen.isDefault, false);
    assert.equal(fallback.isDefault, true);
});

// Reading a stored goal never writes (RF-7.6, RF-7.8) -------------------

test('reading a goal twice gives the same answer', () => {
    for (const stored of [null, '', '30', 'abc']) {
        assert.deepEqual(resolveGoal(stored), resolveGoal(stored));
    }
});

test('resolveGoal never returns an unusable goal', () => {
    for (const stored of [null, '', '   ', 'abc', '0', '10081', '30']) {
        const goal = resolveGoal(stored);
        assert.ok(Number.isInteger(goal.minutes));
        assert.ok(goal.minutes >= MIN_GOAL_MINUTES);
        assert.ok(goal.minutes <= MAX_GOAL_MINUTES);
        assert.equal(typeof goal.isDefault, 'boolean');
        assert.equal(typeof goal.unreadable, 'boolean');
    }
});

// Week start (RF-1.2, RF-4.1) -------------------------------------------

test('the week starts on the Monday of the week containing today', () => {
    assert.equal(weekStartIso('2026-10-02'), '2026-09-28');   // a Friday
});

test('a Monday is its own week start', () => {
    assert.equal(weekStartIso('2026-09-28'), '2026-09-28');
});

test('a Sunday still belongs to the week that began six days before', () => {
    assert.equal(weekStartIso('2026-10-04'), '2026-09-28');
});

test('the week start works across a month and a year change', () => {
    assert.equal(weekStartIso('2026-01-01'), '2025-12-29');
    assert.equal(weekStartIso('2027-01-01'), '2026-12-28');
});

test('the week start survives a daylight saving change', () => {
    // Europe/Madrid springs forward on 2026-03-29 and back on 2026-10-25.
    assert.equal(weekStartIso('2026-03-29'), '2026-03-23');
    assert.equal(weekStartIso('2026-10-25'), '2026-10-19');
});

test('an unusable date has no week start', () => {
    assert.equal(weekStartIso('nope'), null);
    assert.equal(weekStartIso('2026-13-01'), null);
    assert.equal(weekStartIso(null), null);
});

// Weekly minutes (RF-1.1 to RF-1.7, RF-6.1, RF-6.2) --------------------

test('the Monday of the week counts', () => {
    const sessions = [session('2026-09-28', 45)];
    assert.equal(sumWeekMinutes(sessions, TODAY), 45);
});

test('the days before the week do not count', () => {
    const sessions = [
        session('2026-09-27', 45),   // Sunday of the previous week
        session('2026-09-21', 30),   // well before
    ];
    assert.equal(sumWeekMinutes(sessions, TODAY), 0);
});

test('days after today do not count, even inside the same week', () => {
    const sessions = [
        session('2026-10-03', 60),   // Saturday of this week
        session('2026-10-04', 60),   // Sunday of this week
        session('2026-12-01', 60),   // far ahead
    ];
    assert.equal(sumWeekMinutes(sessions, TODAY), 0);
});

test('on a Sunday the whole week counts', () => {
    const sunday = '2026-10-04';
    const sessions = [
        session('2026-09-28', 10),
        session('2026-09-29', 10),
        session('2026-09-30', 10),
        session('2026-10-01', 10),
        session('2026-10-02', 10),
        session('2026-10-03', 10),
        session('2026-10-04', 10),
    ];
    assert.equal(sumWeekMinutes(sessions, sunday), 70);
});

test('a week with no valid session totals zero', () => {
    assert.equal(sumWeekMinutes([], TODAY), 0);
    assert.equal(sumWeekMinutes([session('2026-09-27', 45)], TODAY), 0);
});

test('a session of exactly one day is still valid', () => {
    assert.equal(sumWeekMinutes([session('2026-10-01', 1440)], TODAY), 1440);
});

test('a session longer than one day is excluded', () => {
    assert.equal(sumWeekMinutes([session('2026-10-01', 1441)], TODAY), 0);
});

test('impossible minutes are excluded without breaking the sum', () => {
    const sessions = [
        session('2026-10-01', 0),
        session('2026-10-01', -45),
        session('2026-10-01', 1441),
        session('2026-10-01', 30),
    ];
    assert.equal(sumWeekMinutes(sessions, TODAY), 30);
});

test('a malformed entry between valid ones does not stop the others', () => {
    const sessions = [null, session('2026-10-01', 45), undefined, 7, 'x', []];
    assert.equal(sumWeekMinutes(sessions, TODAY), 45);
});

test('several sessions on the same day add up', () => {
    const sessions = [
        session('2026-10-01', 20),
        session('2026-10-01', 40),
        session('2026-10-02', 15),
    ];
    assert.equal(sumWeekMinutes(sessions, TODAY), 75);
});

test('sessions stored twice are counted twice', () => {
    const duplicated = [session('2026-10-01', 45), session('2026-10-01', 45)];
    assert.equal(sumWeekMinutes(duplicated, TODAY), 90);
});

test('a value that is not a list of sessions totals zero', () => {
    assert.equal(sumWeekMinutes(null, TODAY), 0);
    assert.equal(sumWeekMinutes(undefined, TODAY), 0);
    assert.equal(sumWeekMinutes('texto', TODAY), 0);
});

test('an unusable date totals zero instead of throwing', () => {
    assert.equal(sumWeekMinutes([session('2026-10-01', 45)], 'nope'), 0);
});

test('the weekly total does not change the stored sessions', () => {
    const sessions = [null, session('2026-10-01', 45)];
    const before = JSON.stringify(sessions);

    sumWeekMinutes(sessions, TODAY);

    assert.equal(JSON.stringify(sessions), before);
});

test('the same data and the same date always give the same total', () => {
    const sessions = [session('2026-10-01', 45), session('2026-09-30', 30)];
    assert.equal(sumWeekMinutes(sessions, TODAY), sumWeekMinutes(sessions, TODAY));
});

// Progress (RF-3.2, RF-3.3, RF-3.5, RF-3.8) ---------------------------

test('fewer minutes than the goal means in progress', () => {
    assert.deepEqual(computeGoalProgress(45, 300), {
        state: GOAL_STATE.IN_PROGRESS,
        remainingMinutes: 255,
        ratio: 45 / 300,
    });
});

test('one minute short of the goal is still in progress', () => {
    const result = computeGoalProgress(29, 30);
    assert.equal(result.state, GOAL_STATE.IN_PROGRESS);
    assert.equal(result.remainingMinutes, 1);
});

test('exactly the goal is already met', () => {
    // Reaching the goal counts: the goal is not a target to overshoot.
    const result = computeGoalProgress(30, 30);
    assert.equal(result.state, GOAL_STATE.MET);
    assert.equal(result.remainingMinutes, 0);
    assert.equal(result.ratio, 1);
});

test('more minutes than the goal is met too', () => {
    const result = computeGoalProgress(12000, 10080);
    assert.equal(result.state, GOAL_STATE.MET);
    assert.equal(result.remainingMinutes, 0);
    assert.equal(result.ratio, 1);
});

test('nothing registered yet is in progress, with the whole goal left', () => {
    const result = computeGoalProgress(0, 30);
    assert.equal(result.state, GOAL_STATE.IN_PROGRESS);
    assert.equal(result.remainingMinutes, 30);
    assert.equal(result.ratio, 0);
});

test('remaining minutes are never negative', () => {
    for (const logged of [0, 15, 29, 30, 31, 1000, 12000]) {
        assert.ok(computeGoalProgress(logged, 30).remainingMinutes >= 0);
    }
});

test('the proportion stays between zero and one', () => {
    for (const goal of [1, 30, 300, MAX_GOAL_MINUTES]) {
        for (const logged of [0, 1, goal - 1, goal, goal * 2, goal * 100]) {
            const result = computeGoalProgress(logged, goal);
            assert.ok(result.ratio >= 0 && result.ratio <= 1,
                `ratio ${result.ratio} out of range for ${logged}/${goal}`);
        }
    }
});

// The view the interface paints (RF-3.1, RF-3.6, RF-3.7, RF-10.3, RF-10.5)

test('the view carries exactly the agreed keys', () => {
    const view = buildWeeklyGoalView([session('2026-10-01', 45)], 'ok', '300', TODAY);

    assert.deepEqual(Object.keys(view).sort(), [
        'goalMinutes',
        'goalUnreadable',
        'isDefaultGoal',
        'loggedMinutes',
        'ratio',
        'remainingMinutes',
        'showSessionsNotice',
        'state',
        'storeStatus',
        'todayIso',
        'weekStartIso',
    ]);
});

test('the view reports the week and the minutes of that week', () => {
    const sessions = [session('2026-09-28', 30), session('2026-10-01', 45)];
    const view = buildWeeklyGoalView(sessions, 'ok', '300', TODAY);

    assert.equal(view.todayIso, TODAY);
    assert.equal(view.weekStartIso, '2026-09-28');
    assert.equal(view.loggedMinutes, 75);
    assert.equal(view.goalMinutes, 300);
    assert.equal(view.remainingMinutes, 225);
    assert.equal(view.state, GOAL_STATE.IN_PROGRESS);
    assert.equal(view.ratio, 75 / 300);
});

test('raising the goal halfway through the week moves the bar back', () => {
    // Every minute already registered this week still counts, including the
    // ones from before the change (RF-3.6).
    const sessions = [session('2026-09-28', 30), session('2026-10-01', 45)];

    const before = buildWeeklyGoalView(sessions, 'ok', '300', TODAY);
    const after = buildWeeklyGoalView(sessions, 'ok', '1000', TODAY);

    assert.equal(before.loggedMinutes, after.loggedMinutes);
    assert.ok(after.ratio < before.ratio, 'the bar must go back');
    assert.equal(after.state, GOAL_STATE.IN_PROGRESS);
    assert.equal(after.remainingMinutes, 1000 - 75);
});

test('lowering the goal below the registered minutes meets it at once', () => {
    const sessions = [session('2026-10-01', 45)];
    const view = buildWeeklyGoalView(sessions, 'ok', '30', TODAY);

    assert.equal(view.state, GOAL_STATE.MET);
    assert.equal(view.remainingMinutes, 0);
    assert.equal(view.ratio, 1);
    // The minutes are still reported, so nothing registered is ever dropped.
    assert.equal(view.loggedMinutes, 45);
});

test('a goal met with a surplus shows no excess anywhere', () => {
    const view = buildWeeklyGoalView([session('2026-10-01', 120)], 'ok', '30', TODAY);

    assert.equal(view.state, GOAL_STATE.MET);
    assert.equal(view.ratio, 1);
    assert.equal(view.remainingMinutes, 0);
    // The surplus exists in the data and is deliberately not carried over.
    assert.ok(view.loggedMinutes > view.goalMinutes);
});

test('the default goal is marked as not chosen', () => {
    const view = buildWeeklyGoalView([], 'empty', null, TODAY);

    assert.equal(view.goalMinutes, DEFAULT_GOAL_MINUTES);
    assert.equal(view.isDefaultGoal, true);
    assert.equal(view.goalUnreadable, false);
});

test('a chosen goal of the same number is not marked as default', () => {
    const view = buildWeeklyGoalView([], 'empty', '30', TODAY);

    assert.equal(view.goalMinutes, DEFAULT_GOAL_MINUTES);
    assert.equal(view.isDefaultGoal, false);
});

test('an unreadable store asks for the notice', () => {
    const view = buildWeeklyGoalView([], 'unreadable', null, TODAY);

    assert.equal(view.storeStatus, 'unreadable');
    assert.equal(view.showSessionsNotice, true);
    assert.equal(view.loggedMinutes, 0);
});

test('an empty or readable store asks for no notice', () => {
    assert.equal(buildWeeklyGoalView([], 'empty', null, TODAY).showSessionsNotice, false);
    assert.equal(buildWeeklyGoalView([], 'ok', null, TODAY).showSessionsNotice, false);
});

test('an unreadable goal is flagged apart from an unreadable store', () => {
    const view = buildWeeklyGoalView([], 'ok', 'texto', TODAY);

    assert.equal(view.goalUnreadable, true);
    assert.equal(view.isDefaultGoal, true);
    assert.equal(view.goalMinutes, DEFAULT_GOAL_MINUTES);
    // The store itself was readable, so no store notice is asked for.
    assert.equal(view.showSessionsNotice, false);
});

test('a new week starts at zero minutes with the same goal', () => {
    const sessions = [session('2026-10-01', 45)];
    const sameWeek = buildWeeklyGoalView(sessions, 'ok', '300', TODAY);

    const nextWeek = buildWeeklyGoalView(sessions, 'ok', '300', '2026-10-05');

    assert.equal(nextWeek.weekStartIso, '2026-10-05');
    assert.equal(nextWeek.loggedMinutes, 0);
    assert.equal(nextWeek.goalMinutes, sameWeek.goalMinutes);
    assert.equal(nextWeek.state, GOAL_STATE.IN_PROGRESS);
});

test('a new week keeps the sessions already saved for it', () => {
    const sessions = [session('2026-10-01', 45), session('2026-10-05', 30)];
    const view = buildWeeklyGoalView(sessions, 'ok', '30', '2026-10-06');

    assert.equal(view.loggedMinutes, 30);
    assert.equal(view.state, GOAL_STATE.MET);
});

test('the view does not change the sessions it receives', () => {
    const sessions = [null, session('2026-10-01', 45)];
    const before = JSON.stringify(sessions);

    buildWeeklyGoalView(sessions, 'ok', '300', TODAY);

    assert.equal(JSON.stringify(sessions), before);
});

test('the same data and the same date always give the same view', () => {
    const sessions = [session('2026-10-01', 45)];

    assert.deepEqual(
        buildWeeklyGoalView(sessions, 'ok', '300', TODAY),
        buildWeeklyGoalView(sessions, 'ok', '300', TODAY),
    );
});

// Date regressions that must never come back (plan 7.3) ----------------
// These do not add behaviour: they pin the date answers that are easy to get
// wrong, so a future change cannot quietly move a week or a day.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

test('the week starts on a Monday for a long run of dates', () => {
    // Every day of two whole years, including both clock changes.
    let day = new Date(2025, 0, 1);
    for (let i = 0; i < 731; i += 1) {
        const iso = formatDate(day);
        const weekStart = weekStartIso(iso);

        assert.equal(DAYS[weekDay(weekStart)], 'Mon', `${iso} week starts on a ${DAYS[weekDay(weekStart)]}`);
        assert.ok(weekStart <= iso, `${iso} week starts after itself`);
        assert.ok(weekStart >= shiftDays(iso, -6), `${iso} week starts more than six days back`);

        day.setDate(day.getDate() + 1);
    }
});

test('the week never jumps forward across a clock change', () => {
    // The 23 hour Sunday of March 2026 and the 25 hour Sunday of October both
    // belong to the week that began six days before, and the Monday right
    // after each one starts a new week on that very Monday.
    assert.equal(weekStartIso('2026-03-29'), '2026-03-23');
    assert.equal(weekStartIso('2026-03-30'), '2026-03-30');
    assert.equal(weekStartIso('2026-03-31'), '2026-03-30');

    assert.equal(weekStartIso('2026-10-25'), '2026-10-19');
    assert.equal(weekStartIso('2026-10-26'), '2026-10-26');
    assert.equal(weekStartIso('2026-10-27'), '2026-10-26');
});

test('every day of the week crossing the clock change counts', () => {
    // Seven sessions of ten minutes: the 23 hour Sunday and the 25 hour one
    // are counted exactly like any other day.
    const march = [];
    for (let day = 23; day <= 29; day += 1) {
        march.push(session(`2026-03-${day}`, 10));
    }
    assert.equal(sumWeekMinutes(march, '2026-03-29'), 70);

    const october = [];
    for (let day = 19; day <= 25; day += 1) {
        october.push(session(`2026-10-${day}`, 10));
    }
    assert.equal(sumWeekMinutes(october, '2026-10-25'), 70);
});

test('the day before the week that crosses the clock change does not count', () => {
    assert.equal(sumWeekMinutes([session('2026-03-22', 45)], '2026-03-29'), 0);
    assert.equal(sumWeekMinutes([session('2026-10-18', 45)], '2026-10-25'), 0);
});

test('the leap day exists and is counted in its week', () => {
    assert.equal(weekStartIso('2024-02-29'), '2024-02-26');

    const week = [
        session('2024-02-26', 10),
        session('2024-02-27', 10),
        session('2024-02-28', 10),
        session('2024-02-29', 10),
    ];
    assert.equal(sumWeekMinutes(week, '2024-02-29'), 40);
});

test('a leap day in a year without one does not roll into March', () => {
    // 2023 has no 29 February. Reading it must fail, not become 1 March,
    // because a silent rollover would move a session to another week.
    assert.equal(weekStartIso('2023-02-29'), null);
    assert.equal(sumWeekMinutes([session('2023-02-29', 45)], '2023-02-29'), 0);
    assert.equal(weekStartIso('2025-02-29'), null);
    assert.equal(weekStartIso('2024-02-29'), '2024-02-26');
});

test('the week crossing the end of the year is one single week', () => {
    assert.equal(weekStartIso('2027-01-01'), '2026-12-28');
    assert.equal(weekStartIso('2026-12-31'), '2026-12-28');

    const week = [
        session('2026-12-28', 10),
        session('2026-12-29', 10),
        session('2026-12-30', 10),
        session('2026-12-31', 10),
        session('2027-01-01', 10),
    ];

    // Read from the last day of the year: the January sessions are still ahead.
    assert.equal(sumWeekMinutes(week, '2026-12-31'), 40);
    // Read from the first day of the next year: the whole week counts once.
    assert.equal(sumWeekMinutes(week, '2027-01-01'), 50);
});

test('the Monday of the new year starts a new week on its own', () => {
    assert.equal(weekStartIso('2027-01-04'), '2027-01-04');

    const week = [
        session('2026-12-28', 45),
        session('2027-01-01', 45),
    ];
    assert.equal(sumWeekMinutes(week, '2027-01-04'), 0);
    assert.equal(sumWeekMinutes([session('2027-01-04', 30)], '2027-01-04'), 30);
});

// Determinism (RF-1.3, RNF-5) ------------------------------------------
// The system clock must not take part in any of this. The same data and the
// same date have to give the same answer, whenever the suite is run.

test('repeating the calls never changes the answer', () => {
    const sessions = [
        null,
        session('2026-09-28', 30),
        session('2026-10-01', 45),
        session('2026-10-04', 60),      // after today, so it never counts
        session('2026-09-20', 90),      // previous week
    ];

    const first = buildWeeklyGoalView(sessions, 'ok', '300', '2026-10-02');

    for (let i = 0; i < 50; i += 1) {
        assert.deepEqual(buildWeeklyGoalView(sessions, 'ok', '300', '2026-10-02'), first);
        assert.equal(weekStartIso('2026-10-02'), '2026-09-28');
        assert.equal(sumWeekMinutes(sessions, '2026-10-02'), 75);
    }
});

test('the date passed in is the only thing that decides the week', () => {
    const sessions = [session('2026-10-01', 45)];

    // Same sessions, one day apart: the week start moves with the date.
    assert.equal(weekStartIso('2026-10-05'), '2026-10-05');
    assert.equal(weekStartIso('2026-10-06'), '2026-10-05');

    // A date far in the future drops every stored session without touching it.
    const farAway = buildWeeklyGoalView(sessions, 'ok', '300', '2030-07-15');
    assert.equal(farAway.loggedMinutes, 0);
    assert.equal(farAway.weekStartIso, '2030-07-15');
    assert.equal(sessions[0].minutos, 45);
});

test('no reading of the stored goal changes it', () => {
    // resolveGoal is pure: it cannot persist the default just by being read.
    for (let i = 0; i < 20; i += 1) {
        assert.deepEqual(resolveGoal(null), {
            minutes: DEFAULT_GOAL_MINUTES,
            isDefault: true,
            unreadable: false,
        });
    }
});

// Helpers for the date regressions ------------------------------------

/** Build a local date from an ISO text. Never parses the text as UTC. */
function localDate(iso) {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/** Local date back to "YYYY-MM-DD", with leading zeros. */
function formatDate(date) {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** Day of the week of an ISO date, 0 Sunday to 6 Saturday. */
function weekDay(iso) {
    return localDate(iso).getDay();
}

/** Move an ISO date by whole days in local time, never by milliseconds. */
function shiftDays(iso, days) {
    const date = localDate(iso);
    date.setDate(date.getDate() + days);
    return formatDate(date);
}

// Constants ---------------------------------------------------------------

test('the goal limits match the decided values', () => {
    assert.equal(DEFAULT_GOAL_MINUTES, 30);
    assert.equal(MIN_GOAL_MINUTES, 1);
    assert.equal(MAX_GOAL_MINUTES, 10080);
});

test('the goal states are named for the interface to translate', () => {
    assert.deepEqual(GOAL_STATE, {
        IN_PROGRESS: 'in-progress',
        MET: 'met',
    });
});

test('the goal is stored under its own key, never the sessions one', () => {
    assert.equal(GOAL_STORAGE_KEY, 'diarioEstudio_objetivo_semanal');
    assert.notEqual(GOAL_STORAGE_KEY, 'diarioEstudio_sesiones');
});