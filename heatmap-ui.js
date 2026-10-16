// ============================================
// Heat map — interface
//
// All the calculations live in heatmap-logic.js and are pure. This file
// only reads the stored sessions, paints the result and handles events.
//
// Code in English (constitution 6); every visible text is in Spanish.
// ============================================

'use strict';

(() => {
    const CELL_SIZE = 13;
    const GAP = 3;

    const storeKey = 'diarioEstudio_sesiones';

    const el = {
        root: document.getElementById('mapaCalor'),
        scroll: document.getElementById('mapaScroll'),
        months: document.getElementById('mapaMeses'),
        grid: document.getElementById('mapaRejilla'),
        panel: document.getElementById('mapaPanel'),
        notice: document.getElementById('mapaAviso'),
        from: document.getElementById('filtroDesde'),
        to: document.getElementById('filtroHasta'),
        clear: document.getElementById('filtroLimpiar'),
    };

    if (!el.root || !el.grid) return;

    const state = document.createElement('div');
    state.className = 'mapa-detalle';
    state.hidden = true;
    document.body.appendChild(state);

    let sessions = [];
    let map = null;
    let cellsByDate = new Map();
    let selectedDate = null;
    let focusCell = null;

    // -----------------------------------------
    // Helpers
    // -----------------------------------------

    /** Today's date. The only place in the app allowed to read the clock. */
    function readTodayIso() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${now.getFullYear()}-${month}-${day}`;
    }

    function readSessions() {
        try {
            const raw = localStorage.getItem(storeKey);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            // A corrupted store must never break the page (spec, edge cases).
            return [];
        }
    }

    /** "2026-10-02" -> "2 oct 2026" */
    function formatDate(iso) {
        const date = parseIso(iso);
        if (!date) return iso;
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    /**
     * The wording comes from the state that the logic returns, never from a
     * condition written here. That is what stops the panel from claiming
     * "no estudiaste" on a day whose record is merely corrupt (RF-5.8).
     */
    function detailText(detail) {
        const when = formatDate(detail.date);

        if (detail.state === 'no-session') {
            return `${when}: no estudiaste ese día.`;
        }
        if (detail.state === 'invalid-only') {
            return `${when}: registro descartado por datos no válidos.`;
        }

        const minutes = `${detail.totalMinutes} min`;

        if (detail.state === 'partial') {
            return `${when}: ${minutes}. Se descartó algún registro de ese día.`;
        }
        return `${when}: ${minutes}.`;
    }

    function ariaFor(detail) {
        const when = formatDate(detail.date);
        if (detail.state === 'no-session') return `${when}, sin estudio`;
        if (detail.state === 'invalid-only') return `${when}, registro descartado por datos no válidos`;
        if (detail.state === 'partial') return `${when}, ${detail.totalMinutes} minutos, con registros descartados`;
        return `${when}, ${detail.totalMinutes} minutos`;
    }

    // -----------------------------------------
    // Painting
    // -----------------------------------------

    function currentRange() {
        return parseRange(el.from.value, el.to.value);
    }

    function paintGrid() {
        const range = currentRange();
        const ambosRellenos = el.from.value !== '' && el.to.value !== '';

        // Only a complete but inverted range is an error. A half-filled filter
        // is simply not applied, and the full year stays on screen (RF-9.5).
        // An invalid range is refused without touching what is on screen (RF-9.4).
        if (range === null && ambosRellenos) {
            el.panel.textContent = 'El rango de fechas no es válido: la fecha final va antes de la inicial.';
            return;
        }

        el.grid.textContent = '';
        cellsByDate = new Map();
        focusCell = null;

        map = buildHeatMap(sessions, readTodayIso(), range);

        const fragment = document.createDocumentFragment();

        map.weeks.forEach((week, columnIndex) => {
            week.days.forEach(day => {
                if (day === null) return;

                const detail = detailForDate(sessions, day.date, map.end);
                const cell = document.createElement('div');
                cell.className = 'mapa-celda';
                cell.dataset.level = String(day.level);
                cell.dataset.date = day.date;
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('aria-label', ariaFor(detail));
                cell.tabIndex = -1;

                fragment.appendChild(cell);
                cellsByDate.set(day.date, cell);
            });
        });

        el.grid.appendChild(fragment);
        paintMonths();
        paintNotice();
        updateScrollHints();
    }

    function paintMonths() {
        el.months.textContent = '';
        el.months.style.width = `${map.columns * (CELL_SIZE + GAP)}px`;

        const labels = monthLabelsFor(map.weeks, CELL_SIZE + GAP);

        labels.forEach(label => {
            const span = document.createElement('span');
            span.className = 'mapa-mes';
            span.textContent = label.text;
            span.style.left = `${label.columnIndex * (CELL_SIZE + GAP)}px`;
            el.months.appendChild(span);
        });
    }

    function paintNotice() {
        // RF-4.4 / RF-4.5: only when something was actually discarded.
        if (map.excludedCount > 0) {
            const plural = map.excludedCount === 1 ? 'sesión' : 'sesiones';
            el.notice.hidden = false;
            el.notice.textContent =
                `Se han ignorado ${map.excludedCount} ${plural} por datos no válidos o por fechas futuras. ` +
                'Siguen visibles en la lista de sesiones, donde puedes corregirlas.';
        } else {
            el.notice.hidden = true;
            el.notice.textContent = '';
        }
    }

    function selectDay(date) {
        selectedDate = date;
        const detail = detailForDate(sessions, date, map.end);

        el.panel.textContent = detailText(detail);

        cellsByDate.forEach(cell => cell.removeAttribute('aria-selected'));
        const cell = cellsByDate.get(date);
        if (cell) {
            cell.setAttribute('aria-selected', 'true');
            focusCell = cell;
        }
    }

    function showTooltip(event) {
        const cell = event.target.closest('.mapa-celda');
        if (!cell) return;

        const detail = detailForDate(sessions, cell.dataset.date, map.end);
        state.textContent = detailText(detail);
        state.hidden = false;

        const box = cell.getBoundingClientRect();
        state.style.left = `${box.left + window.scrollX}px`;
        state.style.top = `${box.top + window.scrollY - 34}px`;
    }

    function hideTooltip() {
        state.hidden = true;
    }

    // -----------------------------------------
    // Scroll inside the window (RF-8)
    // -----------------------------------------

    function updateScrollHints() {
        const max = el.scroll.scrollWidth - el.scroll.clientWidth;

        el.scroll.classList.toggle('con-hay-izquierda', el.scroll.scrollLeft > 2);
        el.scroll.classList.toggle('con-hay-derecha', el.scroll.scrollLeft < max - 2);
    }

    /** Show the most recent columns first (RF-8.2). */
    function scrollToMostRecent() {
        el.scroll.scrollLeft = el.scroll.scrollWidth;
        updateScrollHints();
    }

    // -----------------------------------------
    // Keyboard: one tab stop, arrows inside (RNF-2b)
    // -----------------------------------------

    function moveFocus(dx, dy) {
        const cells = [...cellsByDate.values()];
        if (cells.length === 0) return;

        if (!focusCell || !document.contains(focusCell)) {
            focusCell = cells[cells.length - 1];
        } else {
            const index = cells.indexOf(focusCell);
            const next = index + dx + dy * 7;
            if (next >= 0 && next < cells.length) focusCell = cells[next];
        }

        cells.forEach(cell => cell.setAttribute('tabindex', -1));
        focusCell.setAttribute('tabindex', 0);
        focusCell.focus();
    }

    // -----------------------------------------
    // Events
    // -----------------------------------------

    el.grid.addEventListener('click', event => {
        const cell = event.target.closest('.mapa-celda');
        if (!cell) return;
        selectDay(cell.dataset.date);
    });

    el.grid.addEventListener('mouseover', showTooltip);
    el.grid.addEventListener('mouseout', hideTooltip);
    el.grid.addEventListener('focusin', showTooltip);
    el.grid.addEventListener('focusout', hideTooltip);

    el.grid.addEventListener('keydown', event => {
        const moves = {
            ArrowRight: [1, 0],
            ArrowLeft: [-1, 0],
            ArrowDown: [0, 1],
            ArrowUp: [0, -1],
        };

        if (moves[event.key]) {
            event.preventDefault();
            moveFocus(moves[event.key][0], moves[event.key][1]);
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            const cell = event.target.closest('.mapa-celda');
            if (cell) {
                event.preventDefault();
                selectDay(cell.dataset.date);
            }
        }
    });

    el.scroll.addEventListener('scroll', updateScrollHints);

    el.from.addEventListener('change', () => paintGrid());
    el.to.addEventListener('change', () => paintGrid());

    el.clear.addEventListener('click', () => {
        el.from.value = '';
        el.to.value = '';
        el.panel.textContent = 'Toca un día para ver su detalle.';
        selectedDate = null;
        paintGrid();
        scrollToMostRecent();
    });

    // -----------------------------------------
    // Public entry point
    // -----------------------------------------

    function render() {
        if (!el.grid.isConnected) return;

        sessions = readSessions();
        paintGrid();

        if (selectedDate !== null) selectDay(selectedDate);
    }

    function init() {
        sessions = readSessions();
        paintGrid();
        scrollToMostRecent();
    }

    init();

    window.heatMap = { render, init };
})();