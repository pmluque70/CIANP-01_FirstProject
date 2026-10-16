// ============================================
// Weekly goal — interface
//
// Every calculation lives in weekly-goal-logic.js and is pure. This file only
// reads the stored data, paints the result of the view model and handles
// events. It never compares minutes on its own: the `state` in the model is
// what decides which line is on screen (plan D7).
//
// The block paints itself as soon as this file loads, without waiting for
// app.js: if the rest of the application stops on an unreadable store, the
// goal still shows 0 registered minutes and its notice (RF-10.7).
//
// Code in English (constitution 6); every visible text is in Spanish.
// ============================================

'use strict';

(() => {
    const SESSION_STORE_KEY = 'diarioEstudio_sesiones';

    // The same text app.js and heatmap-ui.js already keep for this key.
    const DEFAULT_LABEL = 'Objetivo semanal';
    const DEFAULT_LABEL_MARKED = `Objetivo semanal (${DEFAULT_GOAL_MINUTES} min por defecto)`;

    const UNREADABLE_GOAL_NOTICE =
        `No se ha podido leer el objetivo guardado. Se usan ${DEFAULT_GOAL_MINUTES} min por defecto.`;
    const UNREADABLE_SESSIONS_NOTICE = 'No se han podido leer las sesiones guardadas.';

    const MET_LABEL = 'Meta cumplida';

    // The number written in prose instead of next to a figure (RF-9.3).
    const INVALID_GOAL_MESSAGE =
        `Introduce un número de minutos entre ${MIN_GOAL_MINUTES} y ${MAX_GOAL_MINUTES}.`;
    const SAVE_ERROR_MESSAGE = 'No se ha podido guardar el objetivo.';

    const el = {
        root: document.getElementById('objetivoSemanal'),
        label: document.getElementById('objetivoEtiqueta'),
        line: document.getElementById('objetivoLinea'),
        bar: document.getElementById('objetivoBarra'),
        fill: document.getElementById('objetivoBarraValor'),
        notice: document.getElementById('objetivoAviso'),
        message: document.getElementById('objetivoMensaje'),
        edit: document.getElementById('objetivoEditar'),
        form: document.getElementById('objetivoForm'),
        input: document.getElementById('objetivoCampo'),
        cancel: document.getElementById('objetivoCancelar'),
    };

    // The save button has no id of its own in the markup, and the HTML is not
    // touched any more, so it is found by what it is: the submit button.
    el.save = el.form ? el.form.querySelector('button[type="submit"]') : null;

    if (!el.root || !el.label || !el.line || !el.bar || !el.fill || !el.notice
        || !el.message || !el.edit || !el.form || !el.input || !el.cancel || !el.save) return;

    // A value that is not text. Both readers already report that as
    // unreadable, which is what a storage that cannot be read at all is:
    // there is something there and the page must not claim otherwise.
    const NOT_READABLE = Symbol('not-readable');

    // The week the block is currently showing, so a clock reading that lands
    // on the same week does not repaint (RF-4.7).
    let weekOnScreen = null;

    // -----------------------------------------
    // Reading
    // -----------------------------------------

    /**
     * Today's date, built with local parts and zero padding.
     *
     * Never toISOString(): that is UTC and can move the day.
     */
    function readTodayIso() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${now.getFullYear()}-${month}-${day}`;
    }

    /** Read a key without letting a storage failure reach the page. */
    function readStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return NOT_READABLE;
        }
    }

    /** The model the block paints. Pure logic, "today" passed in. */
    function buildView(todayIso) {
        const store = readSessionStore(readStorage(SESSION_STORE_KEY));

        return buildWeeklyGoalView(
            store.sessions,
            store.status,
            readStorage(GOAL_STORAGE_KEY),
            todayIso,
        );
    }

    // -----------------------------------------
    // Painting
    // -----------------------------------------

    /**
     * The lines of registered minutes, in order.
     *
     * This is the only place that decides which line is on screen, and it
     * decides it from the `state` of the model, never by comparing numbers
     * here (D7). Once the goal is met neither the comparison with the goal
     * nor the minutes to register are returned, so the screen cannot show an
     * excess, a zero left over or a negative figure (RF-3.3).
     */
    function lineTexts(view) {
        if (view.state === GOAL_STATE.MET) {
            return [`Llevas ${view.loggedMinutes} min registrados`, MET_LABEL];
        }

        return [
            `Llevas ${view.loggedMinutes} min registrados de ${view.goalMinutes} min`,
            `Te faltan ${view.remainingMinutes} min por registrar`,
        ];
    }

    /** Clear the line and write the given texts, one span each. */
    function writeLines(texts) {
        el.line.textContent = '';

        for (const text of texts) {
            const span = document.createElement('span');
            span.textContent = text;
            el.line.appendChild(span);
        }
    }

    /**
     * The unreadable notices that apply, if any.
     *
     * The block has a single notice slot for the two notices RF-9.1 has, so
     * when both apply they are written one after the other: hiding one would
     * hide a problem the data proves.
     */
    function noticeTexts(view) {
        const texts = [];

        if (view.goalUnreadable) texts.push(UNREADABLE_GOAL_NOTICE);
        if (view.showSessionsNotice) texts.push(UNREADABLE_SESSIONS_NOTICE);

        return texts;
    }

    /**
     * Paint the whole block.
     *
     * Always every part of it, never pieces: that is what keeps a refresh
     * from leaving part of an earlier painting on screen (RF-10.8).
     */
    function paint(view) {
        const texts = lineTexts(view);
        const notices = noticeTexts(view);

        // The state drives the bar and the label through CSS, so the met
        // state is never told apart by colour alone (RNF-2).
        el.root.dataset.state = view.state;

        el.label.textContent = view.isDefaultGoal ? DEFAULT_LABEL_MARKED : DEFAULT_LABEL;

        writeLines(texts);

        const percent = Math.round(view.ratio * 100);
        el.fill.style.width = `${percent}%`;
        el.bar.setAttribute('aria-valuenow', String(percent));

        // Written here, never as an empty aria-label in the markup, and made
        // of the very same literals that are on screen (RNF-3, RF-9.1).
        el.bar.setAttribute('aria-label', texts.join('. '));

        if (notices.length === 0) {
            el.notice.textContent = '';
            el.notice.hidden = true;
        } else {
            el.notice.textContent = notices.join(' ');
            el.notice.hidden = false;
        }
    }

    // -----------------------------------------
    // Editing the goal
    // -----------------------------------------

    /**
     * The message below the form.
     *
     * It is NOT cleared by paint(), and that is a decision on purpose. The
     * message answers "why didn't my goal save?", and it is still unanswered
     * for as long as the form stays open. A repaint can arrive at any moment
     * from the application adding a session, and wiping the message then
     * would leave the field full of a value that was refused with no word
     * about it. So it lives as long as the form does: opening the form,
     * saving it or cancelling it all clear it, and nothing else does.
     */
    function showMessage(text) {
        el.message.textContent = text;
        el.message.hidden = false;
    }

    function clearMessage() {
        el.message.textContent = '';
        el.message.hidden = true;
    }

    /** Open the form with the goal in force and the focus on the field. */
    function openEditor() {
        el.input.value = String(resolveGoal(readStorage(GOAL_STORAGE_KEY)).minutes);
        clearMessage();

        el.form.hidden = false;
        el.edit.hidden = true;
        el.input.focus();
        el.input.select();
    }

    /** Leave the form without saving, leaving no message behind (RF-9.6). */
    function closeEditor() {
        clearMessage();

        el.form.hidden = true;
        el.edit.hidden = false;
        el.edit.focus();
    }

    /**
     * Save what the person wrote.
     *
     * parseGoalInput is the only door: a value it refuses is not stored, and
     * the goal in force does not move. A value below the registered minutes is
     * accepted in this same gesture, with no second confirmation (RF-2.9).
     */
    function handleSubmit(event) {
        event.preventDefault();

        const parsed = parseGoalInput(el.input.value);

        if (!parsed.ok) {
            showMessage(INVALID_GOAL_MESSAGE);
            return;
        }

        try {
            localStorage.setItem(GOAL_STORAGE_KEY, String(parsed.minutes));
        } catch (error) {
            // The goal could not be stored, so the one in force stays. The
            // form stays open too: closing it would read as if it had worked.
            showMessage(SAVE_ERROR_MESSAGE);
            return;
        }

        el.form.hidden = true;
        el.edit.hidden = false;
        clearMessage();
        el.edit.focus();

        render();
    }

    function handleCancel() {
        closeEditor();
    }

    // -----------------------------------------
    // Painting entry points
    // -----------------------------------------

    /**
     * Read the storage and repaint. The application calls this when a session
     * is added, edited or deleted, so the progress follows without a reload
     * (RF-3.9).
     */
    function render() {
        const todayIso = readTodayIso();

        weekOnScreen = weekStartIso(todayIso);
        paint(buildView(todayIso));
    }

    /**
     * Repaint only when the day now belongs to another week.
     *
     * There is no timer: if none of the two moments in RF-4.6 happens, the
     * block keeps showing the previous week (RF-4.8).
     */
    function refreshIfWeekChanged() {
        const todayIso = readTodayIso();
        const weekStart = weekStartIso(todayIso);

        if (weekStart === weekOnScreen) return;

        weekOnScreen = weekStart;
        paint(buildView(todayIso));
    }

    /** The block paints itself on load, with no help from app.js. */
    render();

    // Enter inside the field submits the form, and the form's own submit
    // button does too. No other key is bound to saving (RF-8.6).
    el.edit.addEventListener('click', openEditor);
    el.form.addEventListener('submit', handleSubmit);
    el.cancel.addEventListener('click', handleCancel);

    window.addEventListener('focus', refreshIfWeekChanged);

    window.weeklyGoal = { render };
})();