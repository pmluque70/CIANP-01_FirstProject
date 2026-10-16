// ============================================
// Session store — pure logic
//
// Everything in this file is a pure function: no DOM, no localStorage and
// no reading of the system clock. The stored text always arrives as the
// `rawText` parameter, so every case can be checked with `node --test` and
// the result never depends on when it runs.
//
// Code and tests in English (constitution 6).
// ============================================

'use strict';

// --------------------------------------------
// Shared rules
// --------------------------------------------
// The heat map already owns the session rules: how a date is parsed and
// whether a stored session can be used. This module does not repeat them,
// it reaches them through `sharedRules`, so every module answers "what
// counts as a valid session" in exactly one way (spec RF-10.1).
//
// The browser branch reads them from `window` on purpose. In a classic
// script the declarations of heatmap-logic.js become properties of the
// global object, but under Node there is no `window` at all, so the same
// file has to require them instead.
//
// The reader below only interprets the container, so it does not call them
// yet: judging which entries are usable is the job of the weekly minute
// totals. The link is here so this module keeps a single, shared answer
// available instead of growing its own copy of the rules.
const sharedRules = typeof window !== 'undefined'
    ? {
        parseIso: window.parseIso,
        isValidSession: window.isValidSession,
    }
    : require('./heatmap-logic.js');

// --------------------------------------------
// Constants
// --------------------------------------------

/** What the store looks like when it is read (RF-10.2, RF-10.3). */
const STORE_STATUS = {
    EMPTY: 'empty',
    UNREADABLE: 'unreadable',
    OK: 'ok',
};

// --------------------------------------------
// Reading the store (RF-10.1 to RF-10.4)
// --------------------------------------------

/**
 * Read the raw text of the sessions store and describe what it holds.
 *
 * Returns `{ status, sessions }`:
 *   - EMPTY      nothing stored (null), blank text or an empty list
 *   - UNREADABLE a value that is not text, text that cannot be parsed,
 *                or text that parses into something other than a list
 *   - OK         a list, returned as it is stored
 *
 * It never throws and never writes: a broken store must not be able to
 * break the page, and it must not be "repaired" behind the user's back
 * (RF-10.6).
 *
 * Only `null` means "the user has nothing stored". Everything else that
 * cannot be read is UNREADABLE, because claiming an empty store when there
 * is something unreadable there would be stating what the data does not
 * prove.
 *
 * @param {string|null} rawText exactly what localStorage returned.
 * @returns {{status: string, sessions: Array}}
 */
function readSessionStore(rawText) {
    // localStorage returns null when the key does not exist: nothing stored.
    if (rawText === null) {
        return { status: STORE_STATUS.EMPTY, sessions: [] };
    }

    // A value that is not text cannot be read as a store. It is reported as
    // unreadable, never as empty: something is stored there, and claiming the
    // user has no sessions would be stating what the data does not prove.
    // This check also has to come before the trim below, which would throw
    // on anything that is not a string.
    if (typeof rawText !== 'string') {
        return { status: STORE_STATUS.UNREADABLE, sessions: [] };
    }

    if (rawText.trim() === '') {
        return { status: STORE_STATUS.EMPTY, sessions: [] };
    }

    // JSON.parse throws on broken text, and that is exactly the case this
    // reader exists for: it is caught here instead of reaching the page.
    let parsed;
    try {
        parsed = JSON.parse(rawText);
    } catch (error) {
        return { status: STORE_STATUS.UNREADABLE, sessions: [] };
    }

    // Parsed fine, but there is no list to read.
    if (!Array.isArray(parsed)) {
        return { status: STORE_STATUS.UNREADABLE, sessions: [] };
    }

    if (parsed.length === 0) {
        return { status: STORE_STATUS.EMPTY, sessions: [] };
    }

    // The list is handed over untouched. Malformed entries are kept: which
    // of them may be used is decided by the shared session rules, and
    // nothing here deletes or rewrites anything the user stored (RF-10.4).
    return { status: STORE_STATUS.OK, sessions: parsed };
}

// Export only when running under Node, so `node --test` can require this
// file. In the browser the guard is false and the functions stay global.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        readSessionStore,
        sharedRules,
        STORE_STATUS,
    };
}