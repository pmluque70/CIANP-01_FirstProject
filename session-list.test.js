// ============================================
// Session store — tests
//
// Run with: node --test
//
// The store reader is pure: it receives the raw stored text and returns data.
// It never touches localStorage or the DOM, so every case can be checked
// here with a plain string (spec RF-10.1 to RF-10.4).
//
// Code and tests in English (constitution 6).
// ============================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const logic = require('./session-list-logic.js');

const { readSessionStore, STORE_STATUS } = logic;

// Helpers ---------------------------------------------------------------

/** Parse a stored text back to plain data, for the "same content" checks. */
const parse = text => JSON.parse(text);

// Empty store (RF-10.2) ---------------------------------------------------

test('a missing key reads as empty', () => {
    const result = readSessionStore(null);
    assert.equal(result.status, STORE_STATUS.EMPTY);
    assert.deepEqual(result.sessions, []);
});

test('an empty string reads as empty', () => {
    const result = readSessionStore('');
    assert.equal(result.status, STORE_STATUS.EMPTY);
    assert.deepEqual(result.sessions, []);
});

test('a blank string reads as empty', () => {
    const result = readSessionStore('   \n\t  ');
    assert.equal(result.status, STORE_STATUS.EMPTY);
    assert.deepEqual(result.sessions, []);
});

test('an empty list reads as empty, not as unreadable', () => {
    const result = readSessionStore('[]');
    assert.equal(result.status, STORE_STATUS.EMPTY);
    assert.deepEqual(result.sessions, []);
});

test('a value that is not text reads as unreadable, not as empty', () => {
    // Something was stored but it cannot be read as text. Reporting "empty"
    // here would claim the user has no sessions, and the data does not prove
    // that (MEMORY.md: never state what the data does not show).
    for (const value of [undefined, 42, true, {}, ['a']]) {
        const result = readSessionStore(value);
        assert.equal(result.status, STORE_STATUS.UNREADABLE, `for ${String(value)}`);
        assert.deepEqual(result.sessions, []);
    }
});

test('only null means nothing stored', () => {
    // localStorage returns null when there is no key at all. That is the one
    // case that means "empty"; anything else that is not text is a store
    // that cannot be read.
    const result = readSessionStore(null);
    assert.equal(result.status, STORE_STATUS.EMPTY);
    assert.deepEqual(result.sessions, []);
});

// Unreadable store (RF-10.3) ----------------------------------------------

test('text that cannot be parsed reads as unreadable', () => {
    for (const text of ['{not json', '[1,2', 'undefined', 'NaN']) {
        const result = readSessionStore(text);
        assert.equal(result.status, STORE_STATUS.UNREADABLE, `for ${text}`);
        assert.deepEqual(result.sessions, [], `for ${text}`);
    }
});

test('stored JSON that is not a list reads as unreadable', () => {
    const cases = [
        '{}',            // object
        '{"fecha":"2026-10-05","minutos":30}',
        '42',            // number
        '-3.5',
        '"un texto"',    // string
        'true',
        'null',
    ];

    for (const text of cases) {
        const result = readSessionStore(text);
        assert.equal(result.status, STORE_STATUS.UNREADABLE, `for ${text}`);
        assert.deepEqual(result.sessions, [], `for ${text}`);
    }
});

test('reading an unreadable store never throws', () => {
    assert.doesNotThrow(() => readSessionStore('{not json'));
    assert.doesNotThrow(() => readSessionStore('[[[[['));
});

// A readable list (RF-10.4) ----------------------------------------------

test('a list of sessions reads as ok with the same content', () => {
    const text = '[{"fecha":"2026-10-05","tema":"JS","minutos":45},'
        + '{"fecha":"2026-10-06","tema":"CSS","minutos":30}]';

    const result = readSessionStore(text);
    assert.equal(result.status, STORE_STATUS.OK);
    assert.equal(result.sessions.length, 2);
    assert.deepEqual(result.sessions, parse(text));
});

test('malformed entries are preserved, never dropped nor filtered', () => {
    // A store can hold anything. Deciding what is usable belongs to the
    // shared session rules, not to the reader (RF-10.4).
    const text = '[null, 3, "texto", [], {"tema":"sin fecha"},'
        + '{"fecha":"2026-10-05","tema":"JS","minutos":45}]';

    const result = readSessionStore(text);
    assert.equal(result.status, STORE_STATUS.OK);
    assert.equal(result.sessions.length, 6);
    assert.deepEqual(result.sessions, parse(text));
    assert.equal(result.sessions[5].minutos, 45);
});

test('the reader does not modify the data it returns', () => {
    const text = '[{"fecha":"2026-10-05","tema":"JS","minutos":45}]';

    const first = readSessionStore(text);
    const second = readSessionStore(text);

    assert.deepEqual(first.sessions, second.sessions);
    assert.deepEqual(Object.keys(first).sort(), ['sessions', 'status']);
});

// Contract ---------------------------------------------------------------

test('the result always has a status and a list', () => {
    for (const text of [null, '', '[]', '{}', '{not json', '[1,2]']) {
        const result = readSessionStore(text);
        assert.ok(Object.prototype.hasOwnProperty.call(result, 'status'));
        assert.ok(Array.isArray(result.sessions));
    }
});

test('STORE_STATUS names the three store states', () => {
    assert.deepEqual(STORE_STATUS, {
        EMPTY: 'empty',
        UNREADABLE: 'unreadable',
        OK: 'ok',
    });
});