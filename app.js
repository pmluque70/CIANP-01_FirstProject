// ============================================
// Diario de Estudio - Lógica principal
// ============================================

// Clave para guardar en localStorage
const STORAGE_KEY = 'diarioEstudio_sesiones';

// Elementos del DOM
const formulario = document.getElementById('formularioSesion');
const inputFecha = document.getElementById('fecha');
const inputTema = document.getElementById('tema');
const inputMinutos = document.getElementById('minutos');
const rachaNumero = document.getElementById('rachaNumero');
const mejorRachaNumero = document.getElementById('mejorRachaNumero');
const minutosSemana = document.getElementById('minutosSemana');
const diasMesNumero = document.getElementById('diasMesNumero');
const listaSesiones = document.getElementById('listaSesiones');
const listaVacia = document.getElementById('listaVacia');

// --------------------------------------------
// Funciones de fecha (siempre fecha local)
// --------------------------------------------

// Devuelve la fecha de hoy como string YYYY-MM-DD (local, no UTC)
function hoyComoString() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

// Convierte un string YYYY-MM-DD a un Date local (medianoche)
function stringAFecha(str) {
    const [anio, mes, dia] = str.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
}

// Suma o resta días a una fecha
function sumarDias(fecha, dias) {
    const nueva = new Date(fecha);
    nueva.setDate(nueva.getDate() + dias);
    return nueva;
}

// --------------------------------------------
// Cargar y guardar datos
// --------------------------------------------

function cargarSesiones() {
    const datos = localStorage.getItem(STORAGE_KEY);
    return datos ? JSON.parse(datos) : [];
}

function guardarSesiones(sesiones) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesiones));
}

// --------------------------------------------
// Calcular la racha actual
// --------------------------------------------

function calcularRacha(sesiones) {
    if (sesiones.length === 0) return 0;

    // Obtener conjunto de fechas únicas con sesión
    const fechasConSesion = new Set(sesiones.map(s => s.fecha));

    // Empezar desde hoy. Si hoy no hay sesión, empezar desde ayer
    // (la racha sigue viva hasta que termine el día)
    let fechaActual = stringAFecha(hoyComoString());
    if (!fechasConSesion.has(hoyComoString())) {
        fechaActual = sumarDias(fechaActual, -1);
    }

    // Contar días consecutivos hacia atrás
    let racha = 0;
    while (fechasConSesion.has(fechaComoString(fechaActual))) {
        racha++;
        fechaActual = sumarDias(fechaActual, -1);
    }

    return racha;
}

// --------------------------------------------
// Calcular la mejor racha histórica
// --------------------------------------------

function calcularMejorRacha(sesiones) {
    if (sesiones.length === 0) return 0;

    // Obtener fechas únicas con sesión, sin futuras
    const hoy = hoyComoString();
    const fechasUnicas = [...new Set(sesiones.map(s => s.fecha))]
        .filter(f => f <= hoy)
        .sort();

    let mejor = 0;
    let rachaActual = 1;

    for (let i = 1; i < fechasUnicas.length; i++) {
        const fechaAnterior = stringAFecha(fechasUnicas[i - 1]);
        const fechaEsperada = fechaComoString(sumarDias(fechaAnterior, 1));

        if (fechasUnicas[i] === fechaEsperada) {
            rachaActual++;
        } else {
            mejor = Math.max(mejor, rachaActual);
            rachaActual = 1;
        }
    }

    return Math.max(mejor, rachaActual);
}

// --------------------------------------------
// Calcular total de minutos estudiados esta semana
// --------------------------------------------

function calcularMinutosSemana(sesiones) {
    // Dia de la semana: 0 = domingo, 1 = lunes, ..., 6 = sabado
    const diaSemana = new Date().getDay();

    // Dias desde el lunes (lunes = 0, martes = 1, ..., domingo = 6)
    const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1;

    // Fecha del lunes de esta semana
    const hoy = new Date();
    const lunes = sumarDias(hoy, -diasDesdeLunes);
    const lunesStr = fechaComoString(lunes);

    // Sumar minutos de sesiones desde el lunes hasta hoy
    const hoyStr = hoyComoString();
    return sesiones
        .filter(s => s.fecha >= lunesStr && s.fecha <= hoyStr)
        .reduce((total, s) => total + s.minutos, 0);
}

// --------------------------------------------
// Calcular dias estudiados este mes
// --------------------------------------------

function calcularDiasMes(sesiones) {
    const ahora = new Date();
    const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

    // Filtrar sesiones del mes actual (sin futuras) y contar dias unicos
    const hoyStr = hoyComoString();
    const diasUnicos = new Set(
        sesiones
            .filter(s => s.fecha.startsWith(mesActual) && s.fecha <= hoyStr)
            .map(s => s.fecha)
    );

    return diasUnicos.size;
}

// Convierte un Date a string YYYY-MM-DD (local)
function fechaComoString(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

// --------------------------------------------
// Formatear fecha para mostrar (ej: "30 sep 2026")
// --------------------------------------------

function formatearFecha(str) {
    const fecha = stringAFecha(str);
    const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

// --------------------------------------------
// Renderizar la interfaz
// --------------------------------------------

// Muestra un valor y, si ha cambiado, reinicia la animacion del numero.
// Asi el rebote se ve justo al guardar una sesion, no solo al cargar.
function mostrarValor(elemento, valor) {
    const texto = String(valor);
    if (elemento.textContent === texto) return;

    elemento.textContent = texto;
    elemento.classList.remove('pulso');
    // Forzar reflow: sin esto el navegador no reinicia la animacion
    void elemento.offsetWidth;
    elemento.classList.add('pulso');
}

function renderizar() {
    const sesiones = cargarSesiones();

    // Ordenar de más reciente a más antigua
    sesiones.sort((a, b) => b.fecha.localeCompare(a.fecha));

    // Actualizar rachas y estadisticas
    mostrarValor(rachaNumero, calcularRacha(sesiones));
    mostrarValor(mejorRachaNumero, calcularMejorRacha(sesiones));
    mostrarValor(minutosSemana, calcularMinutosSemana(sesiones));
    mostrarValor(diasMesNumero, calcularDiasMes(sesiones));

    // Actualizar lista
    listaSesiones.innerHTML = '';
    listaVacia.style.display = sesiones.length === 0 ? 'block' : 'none';

    sesiones.forEach(sesion => {
        const item = document.createElement('li');

        const info = document.createElement('div');
        info.className = 'sesion-info';
        const fechaSpan = document.createElement('span');
        fechaSpan.className = 'sesion-fecha';
        fechaSpan.textContent = formatearFecha(sesion.fecha);
        const detalleDiv = document.createElement('div');
        detalleDiv.className = 'sesion-detalle';
        detalleDiv.textContent = sesion.tema;

        info.appendChild(fechaSpan);
        info.appendChild(detalleDiv);

        const minutosSpan = document.createElement('span');
        minutosSpan.className = 'sesion-minutos';
        minutosSpan.textContent = `${sesion.minutos} min`;

        item.appendChild(info);
        item.appendChild(minutosSpan);
        listaSesiones.appendChild(item);
    });
}

// --------------------------------------------
// Eventos
// --------------------------------------------

// Poner fecha de hoy por defecto
inputFecha.value = hoyComoString();

formulario.addEventListener('submit', function (e) {
    e.preventDefault();

    const nuevaSesion = {
        fecha: inputFecha.value,
        tema: inputTema.value.trim(),
        minutos: parseInt(inputMinutos.value, 10)
    };

    const sesiones = cargarSesiones();
    sesiones.push(nuevaSesion);
    guardarSesiones(sesiones);

    // Limpiar solo tema y minutos (mantener la fecha para facilitar múltiples registros)
    inputTema.value = '';
    inputMinutos.value = '';
    inputTema.focus();

    renderizar();
});

// Iniciar
renderizar();
