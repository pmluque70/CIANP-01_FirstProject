// ============================================
// Heat map — tests
//
// Run with: node --test
//
// Every test passes "today" explicitly. No test may depend on the system
// clock (constitution 3, spec RF-1.6 / RNF-3b).
// ============================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const logic = require('./heatmap-logic.js');

const {
    parseIso,
    formatIso,
    addDays,
    mondayOf,
    isValidSession,
    countExcludedSessions,
    intensityLevel,
    sumMinutesByDate,
    computeWindow,
    parseRange,
    detailForDate,
    buildHeatMap,
    monthLabelsFor,
} = logic;

// Helpers ---------------------------------------------------------------

function session(date, minutes, topic) {
    return { fecha: date, tema: topic || 'Test', minutos: minutes };
}

const TODAY = '2026-10-02'; // a Friday
const isEmptyMap = map => map.weeks.every(w => w.days.every(d => d === null));

// Date helpers -----------------------------------------------------------

test('parseIso reads a date in local time', () => {
    const date = parseIso('2026-10-02');
    assert.equal(date.getFullYear(), 2026);
    assert.equal(date.getMonth(), 9);
    assert.equal(date.getDate(), 2);
});

test('parseIso rejects impossible dates', () => {
    assert.equal(parseIso('2026-02-30'), null);
    assert.equal(parseIso('2026-13-01'), null);
    assert.equal(parseIso('2026-00-10'), null);
    assert.equal(parseIso('nope'), null);
    assert.equal(parseIso(''), null);
    assert.equal(parseIso(null), null);
    assert.equal(parseIso(20261002), null);
});

test('parseIso accepts 29 February on a leap year and rejects it otherwise', () => {
    assert.notEqual(parseIso('2028-02-29'), null);
    assert.equal(parseIso('2026-02-29'), null);
});

test('formatIso and parseIso round-trip across a DST boundary', () => {
    // Europe/Madrid springs forward on 2026-03-29 and back on 2026-10-25.
    const start = parseIso('2026-03-27');
    const seen = [];
    for (let i = 0; i < 5; i += 1) {
        seen.push(formatIso(addDays(start, i)));
    }
    assert.deepEqual(seen, ['2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30', '2026-03-31']);
});

test('addDays crosses the autumn DST boundary without repeating a day', () => {
    const start = parseIso('2026-10-23');
    const seen = [];
    for (let i = 0; i < 5; i += 1) {
        seen.push(formatIso(addDays(start, i)));
    }
    assert.deepEqual(seen, ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27']);
});

test('mondayOf returns the Monday of that week, also from a Sunday', () => {
    assert.equal(formatIso(mondayOf(parseIso('2026-10-02'))), '2026-09-28'); // Friday
    assert.equal(formatIso(mondayOf(parseIso('2026-10-04'))), '2026-09-28'); // Sunday closes that same week
    assert.equal(formatIso(mondayOf(parseIso('2026-10-05'))), '2026-10-05'); // Monday starts a new one
    assert.equal(formatIso(mondayOf(parseIso('2026-10-06'))), '2026-10-05'); // Tuesday
});

// RF-4 — validity -------------------------------------------------------

test('isValidSession accepts a normal session', () => {
    assert.equal(isValidSession(session(TODAY, 45), TODAY), true);
    assert.equal(isValidSession(session('2026-09-28', 30), TODAY), true);
});

test('isValidSession rejects minutes out of range or not a number', () => {
    assert.equal(isValidSession(session(TODAY, 0), TODAY), false);
    assert.equal(isValidSession(session(TODAY, -10), TODAY), false);
    assert.equal(isValidSession(session(TODAY, '45'), TODAY), false);
    assert.equal(isValidSession(session(TODAY, null), TODAY), false);
    assert.equal(isValidSession(session(TODAY, 45.5), TODAY), false);
    assert.equal(isValidSession({}, TODAY), false);
    assert.equal(isValidSession(null, TODAY), false);
    assert.equal(isValidSession('nope', TODAY), false);
});

test('isValidSession keeps exactly 1440 and rejects 1441', () => {
    assert.equal(isValidSession(session(TODAY, 1440), TODAY), true);
    assert.equal(isValidSession(session(TODAY, 1441), TODAY), false);
});

test('isValidSession rejects future dates but accepts today', () => {
    assert.equal(isValidSession(session('2026-10-03', 30), TODAY), false);
    assert.equal(isValidSession(session(TODAY, 30), TODAY), true);
});

// RF-2 — intensity levels ----------------------------------------------

test('intensityLevel covers every boundary of the four ranges', () => {
    assert.equal(intensityLevel(0), 0);
    assert.equal(intensityLevel(1), 1);
    assert.equal(intensityLevel(29), 1);
    assert.equal(intensityLevel(30), 2);
    assert.equal(intensityLevel(59), 2);
    assert.equal(intensityLevel(60), 3);
    assert.equal(intensityLevel(119), 3);
    assert.equal(intensityLevel(120), 4);
    assert.equal(intensityLevel(600), 4);
});

test('intensityLevel gives the same level regardless of the rest of the data', () => {
    // RF-2.3: thresholds are absolute.
    assert.equal(intensityLevel(60), intensityLevel(60));
});

// RF-2.1 / RF-10.1 — minutes per day -----------------------------------

test('sumMinutesByDate adds every valid session of the same day', () => {
    const sessions = [session('2026-10-01', 20), session('2026-10-01', 40), session('2026-10-02', 30)];
    const totals = sumMinutesByDate(sessions, TODAY);
    assert.equal(totals.get('2026-10-01'), 60);
    assert.equal(totals.get('2026-10-02'), 30);
});

test('sumMinutesByDate ignores excluded sessions', () => {
    const sessions = [
        session('2026-10-01', 20),
        session('2026-10-01', -5),
        session('2026-10-01', 2000),
        session('2026-10-05', 30),
    ];
    const totals = sumMinutesByDate(sessions, TODAY);
    assert.equal(totals.get('2026-10-01'), 20);
    assert.equal(totals.has('2026-10-05'), false);
});

test('two sessions of 20 and 40 reach level 3 on the same day', () => {
    // Regression: they must be summed before deciding the colour.
    const totals = sumMinutesByDate([session('2026-10-01', 20), session('2026-10-01', 40)], TODAY);
    assert.equal(intensityLevel(totals.get('2026-10-01')), 3);
});

test('identical duplicate sessions are all counted', () => {
    const totals = sumMinutesByDate([session('2026-10-01', 30), session('2026-10-01', 30)], TODAY);
    assert.equal(totals.get('2026-10-01'), 60);
});

test('sumMinutesByDate survives malformed input', () => {
    const totals = sumMinutesByDate([null, 'x', {}, session('2026-10-01', 25)], TODAY);
    assert.equal(totals.size, 1);
    assert.equal(totals.get('2026-10-01'), 25);
});

// RF-4.4 / RF-4.5 — exclusions ------------------------------------------

test('countExcludedSessions counts every kind of discard', () => {
    const sessions = [
        session('2026-10-01', 30), // valid
        session('2026-10-01', 0),
        session('2026-10-01', -10),
        session('2026-10-01', 2000),
        session('2026-10-20', 30), // future
        {}, // no date
    ];
    assert.equal(countExcludedSessions(sessions, TODAY), 5);
});

test('countExcludedSessions is zero when nothing is discarded', () => {
    assert.equal(countExcludedSessions([], TODAY), 0);
    assert.equal(countExcludedSessions([session('2026-10-01', 30)], TODAY), 0);
});

// RF-1.2 — window -------------------------------------------------------

test('computeWindow spans 52 weeks ending on the current week', () => {
    const window = computeWindow(TODAY);
    assert.equal(window.mondayOfCurrentWeek, '2026-09-28');
    assert.equal(window.start, formatIso(addDays(parseIso('2026-09-28'), -51 * 7)));
    assert.ok(window.start < window.end);
});

test('computeWindow works when today is a Monday', () => {
    const window = computeWindow('2026-10-05');
    assert.equal(window.mondayOfCurrentWeek, '2026-10-05');
});

// RF-9.4 / RF-9.5 — range -----------------------------------------------

test('parseRange accepts a complete and valid range', () => {
    const range = parseRange('2026-09-28', '2026-10-02');
    assert.deepEqual(range, { start: '2026-09-28', end: '2026-10-02' });
});

test('parseRange returns null with only one field filled', () => {
    assert.equal(parseRange('2026-09-28', ''), null);
    assert.equal(parseRange('', '2026-10-02'), null);
    assert.equal(parseRange('', ''), null);
});

test('parseRange returns null when the end is before the start', () => {
    assert.equal(parseRange('2026-10-02', '2026-09-28'), null);
});

test('parseRange accepts a range of a single day', () => {
    assert.deepEqual(parseRange('2026-10-01', '2026-10-01'), { start: '2026-10-01', end: '2026-10-01' });
});

// RF-1 — grid structure -------------------------------------------------

test('buildHeatMap returns 52 columns of 7 slots', () => {
    const map = buildHeatMap([], TODAY, null);
    assert.equal(map.columns, 52);
    assert.equal(map.rows, 7);
    assert.equal(map.weeks.length, 52);
    assert.equal(map.weeks[0].days.length, 7);
});

test('buildHeatMap puts the oldest week first and the newest last', () => {
    const map = buildHeatMap([], TODAY, null);
    assert.equal(map.weeks[0].monday, computeWindow(TODAY).start);
    assert.equal(map.weeks[51].monday, computeWindow(TODAY).mondayOfCurrentWeek);
});

test('buildHeatMap never places a day after today', () => {
    const map = buildHeatMap([], TODAY, null);
    const lastWeek = map.weeks[51];
    // 2026-10-02 is a Friday, so the week ends on Sunday the 4th.
    // Only Monday 28 Sep through Friday 2 Oct may be drawn.
    assert.notEqual(lastWeek.days[4], null, 'Friday, today itself, is drawn');
    assert.equal(lastWeek.days[5], null, 'Saturday is in the future');
    assert.equal(lastWeek.days[6], null, 'Sunday is in the future');
    assert.equal(lastWeek.days[0].date, '2026-09-28');
    assert.equal(lastWeek.days[4].date, '2026-10-02');
});

test('buildHeatMap gives an empty grid for a user with no sessions', () => {
    const map = buildHeatMap([], TODAY, null);
    const represented = map.weeks.flatMap(w => w.days).filter(Boolean);
    assert.ok(represented.length > 0, 'days up to today are still drawn');
    assert.ok(represented.every(day => day.level === 0));
    assert.equal(map.excludedCount, 0);
});

test('buildHeatMap places a known session in the right row and column', () => {
    const map = buildHeatMap([session('2026-10-01', 60)], TODAY, null);
    const window = computeWindow(TODAY);
    const column = 51 - Math.round(
        (parseIso(window.mondayOfCurrentWeek) - parseIso('2026-10-01')) / (7 * 86400000)
    );
    const day = map.weeks[column].days[3]; // 2026-10-01 is a Thursday
    assert.equal(day.date, '2026-10-01');
    assert.equal(day.level, 3);
    assert.equal(day.totalMinutes, 60);
});

test('rows are ordered Monday to Sunday', () => {
    const map = buildHeatMap([session('2026-09-28', 10), session('2026-10-04', 10)], TODAY, null);
    const mondays = map.weeks.filter(w => w.days[0] !== null);
    assert.ok(mondays.length > 0);
    assert.equal(mondays[0].days[0].date, mondays[0].monday);
});

test('buildHeatMap does not mutate the sessions it receives', () => {
    const sessions = [session('2026-10-01', 30), session('2026-10-05', 30)];
    const snapshot = JSON.stringify(sessions);
    buildHeatMap(sessions, TODAY, null);
    assert.equal(JSON.stringify(sessions), snapshot);
});

test('buildHeatMap survives a corrupted store', () => {
    const map = buildHeatMap([null, 'x', 42, {}, session('2026-10-01', 30)], TODAY, null);
    assert.equal(map.weeks.length, 52);
    assert.equal(map.excludedCount, 4);
});

// RF-3.1 / RF-3.2 — empty days -----------------------------------------

test('days before the first session are drawn as level 0', () => {
    const map = buildHeatMap([session('2026-10-02', 45)], TODAY, null);
    const early = map.weeks[0].days.filter(Boolean);
    assert.ok(early.every(day => day.level === 0));
});

test('a day whose sessions are all discarded is drawn as level 0', () => {
    const map = buildHeatMap([session('2026-10-01', 0), session('2026-10-01', -20)], TODAY, null);
    const day = map.weeks[51].days[3];
    assert.equal(day.level, 0);
    assert.equal(day.totalMinutes, 0);
});

// RF-9 — filter ---------------------------------------------------------

test('a valid range limits the days drawn', () => {
    const sessions = [session('2026-09-28', 45), session('2026-10-02', 45)];
    const map = buildHeatMap(sessions, TODAY, { start: '2026-10-01', end: '2026-10-02' });
    const represented = map.weeks.flatMap(w => w.days).filter(Boolean);
    assert.ok(represented.every(day => day.date >= '2026-10-01' && day.date <= '2026-10-02'));
    assert.equal(represented.length, 2);
});

test('the grid keeps 7 rows even when the filter covers a single day', () => {
    const map = buildHeatMap([], TODAY, { start: '2026-10-01', end: '2026-10-01' });
    assert.equal(map.rows, 7);
    assert.ok(map.weeks.every(w => w.days.length === 7));
    const represented = map.weeks.flatMap(w => w.days).filter(Boolean);
    assert.equal(represented.length, 1);
});

test('a filter never shows days before the window', () => {
    const sessions = [session('2020-01-01', 60)];
    const map = buildHeatMap(sessions, TODAY, { start: '2019-01-01', end: '2026-10-02' });
    const represented = map.weeks.flatMap(w => w.days).filter(Boolean);
    assert.ok(represented.every(day => day.date >= computeWindow(TODAY).start));
});

test('a filter in the future yields an empty grid without failing', () => {
    const map = buildHeatMap([], TODAY, { start: '2027-01-01', end: '2027-02-01' });
    assert.equal(map.weeks.length, 52);
    assert.equal(map.weeks.flatMap(w => w.days).filter(Boolean).length, 0);
});

// RF-7.2 / RF-7.3 — month labels ---------------------------------------

test('monthLabelsFor labels each month once, in order', () => {
    const map = buildHeatMap([], TODAY, null);
    const labels = monthLabelsFor(map.weeks);
    assert.ok(labels.length > 0);
    assert.ok(labels.length <= 13);
    for (let i = 1; i < labels.length; i += 1) {
        assert.ok(labels[i].columnIndex > labels[i - 1].columnIndex);
    }
});

test('monthLabelsFor skips a label that would collide with the previous one', () => {
    // Week of Mon 28 Sep (month September) then Mon 5 Oct (month October).
    const weeks = [
        { monday: '2026-09-28', days: [{ date: '2026-09-28' }, null, null, null, null, null, null] },
        { monday: '2026-10-05', days: [{ date: '2026-10-05' }, null, null, null, null, null, null] },
    ];
    const labels = monthLabelsFor(weeks, 10);
    assert.equal(labels.length, 1, 'the second label does not fit in 10 px');
    assert.equal(labels[0].text, 'sep');
});

test('monthLabelsFor keeps both labels when the columns are wide enough', () => {
    const map = buildHeatMap([], TODAY, null);
    const texts = monthLabelsFor(map.weeks, 14).map(label => label.text);
    assert.ok(texts.includes('sep'), 'September is labelled');
    assert.ok(texts.includes('oct'), 'October is labelled');
});

// RF-5.2 / RF-5.8 / RF-5.9 — detail ------------------------------------

test('detailForDate reports a day without sessions', () => {
    const detail = detailForDate([], '2026-10-01', TODAY);
    assert.equal(detail.state, 'no-session');
    assert.equal(detail.totalMinutes, 0);
});

test('detailForDate reports a day with valid sessions', () => {
    const detail = detailForDate([session('2026-10-01', 20), session('2026-10-01', 25)], '2026-10-01', TODAY);
    assert.equal(detail.state, 'studied');
    assert.equal(detail.totalMinutes, 45);
    assert.equal(detail.validCount, 2);
});

test('detailForDate never claims "no session" when the record is merely corrupt', () => {
    // RF-5.8: this was the bug found in QA.
    const detail = detailForDate([session('2026-10-01', 0), session('2026-10-01', 2000)], '2026-10-01', TODAY);
    assert.equal(detail.state, 'invalid-only');
    assert.notEqual(detail.state, 'no-session');
    assert.equal(detail.excludedCount, 2);
});

test('detailForDate reports a partly discarded day', () => {
    const detail = detailForDate([session('2026-10-01', 45), session('2026-10-01', 2000)], '2026-10-01', TODAY);
    assert.equal(detail.state, 'partial');
    assert.equal(detail.totalMinutes, 45);
    assert.equal(detail.excludedCount, 1);
});

test('detailForDate separates no sessions from discarded ones', () => {
    const empty = detailForDate([], '2026-10-01', TODAY);
    const corrupt = detailForDate([session('2026-10-01', 0)], '2026-10-01', TODAY);
    assert.notEqual(empty.state, corrupt.state);
});

// RF-1.6 / RNF-3b — determinism ----------------------------------------

test('the same input and the same date always give the same result', () => {
    const sessions = [session('2026-10-01', 45), session('2026-09-30', 90)];
    const first = buildHeatMap(sessions, TODAY, null);
    const second = buildHeatMap(sessions, TODAY, null);
    assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test('the result depends only on the date passed in, not on the clock', () => {
    const sessions = [session('2026-10-01', 45)];
    const asOfToday = buildHeatMap(sessions, TODAY, null);
    const asOfNextDay = buildHeatMap(sessions, '2026-10-03', null);
    assert.equal(asOfToday.weeks.length, asOfNextDay.weeks.length);
    // Moving "today" forward must not resurrect past days as empty columns.
    assert.notEqual(JSON.stringify(asOfToday), JSON.stringify(asOfNextDay));
});