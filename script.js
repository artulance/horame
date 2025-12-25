document.addEventListener('DOMContentLoaded', function() {
    const horasDiariasInput = document.getElementById('horas-diarias');
    const horaEntradaInput = document.getElementById('hora-entrada');
    const horaSalidaP = document.getElementById('hora-salida');
    const horaSalidaSaldoP = document.getElementById('hora-salida-saldo');
    const guardarBtn = document.getElementById('guardar');

    // Nuevos elementos para el contador de tiempo transcurrido
    const horaEntradaContador = document.getElementById('hora-entrada-contador');
    const horaSalidaContador = document.getElementById('hora-salida-contador');
    const tiempoTranscurridoP = document.getElementById('tiempo-transcurrido');
    const registrarDiaBtn = document.getElementById('registrar-dia');
    const saldoMensualP = document.getElementById('saldo-mensual');
    const infoLocalstorageP = document.getElementById('info-localstorage');

    // Nuevos elementos para el formulario de edición
    const editHoraEntrada = document.getElementById('edit-hora-entrada');
    const editHorasDiarias = document.getElementById('edit-horas-diarias');
    const editSaldoSemanal = document.getElementById('edit-saldo-semanal');
    const guardarEdicionBtn = document.getElementById('guardar-edicion');
    const borrarLocalstorageBtn = document.getElementById('borrar-localstorage');

    // Variables para saldo semanal
    const currentWeek = getCurrentWeek();
    let saldoSemanal = 0;

    // Función para formatear el saldo en horas y minutos
    function formatearSaldo(saldo) {
        const minutosTotal = Math.round(Math.abs(saldo) * 60);
        const horas = Math.floor(minutosTotal / 60);
        const minutos = minutosTotal % 60;
        const signo = saldo < 0 ? '-' : '';
        if (horas > 0) {
            return `${signo}${horas} horas ${minutos} minutos`;
        } else {
            return `${signo}${minutos} minutos`;
        }
    }

    // Función para actualizar el display del saldo
    function actualizarSaldoDisplay() {
        const estado = saldoSemanal > 0 ? 'positivo' : saldoSemanal < 0 ? 'negativo' : 'neutro';
        const saldoFormateado = formatearSaldo(saldoSemanal);
        saldoMensualP.textContent = `Saldo semanal: ${saldoFormateado} (${estado})`;
    }

    // Función para cargar valores en el formulario de edición
    function cargarFormularioEdicion() {
        const storedData = localStorage.getItem('horaEntrada');
        if (storedData) {
            const data = JSON.parse(storedData);
            editHoraEntrada.value = data.entrada;
            editHorasDiarias.value = data.horas;
        } else {
            editHoraEntrada.value = '';
            editHorasDiarias.value = '';
        }
        editSaldoSemanal.value = saldoSemanal.toFixed(2);
    }

    // Función para actualizar la información del localStorage
    function actualizarInfoLocalStorage() {
        const horaEntrada = localStorage.getItem('horaEntrada') || 'No guardado';
        const saldoSemanalData = localStorage.getItem('saldoSemanal') || 'No guardado';
        infoLocalstorageP.textContent = `Información en localStorage: Hora de entrada: ${horaEntrada}, Saldo semanal: ${saldoSemanalData}`;
    }

    // Función para obtener la fecha de hoy en formato YYYY-MM-DD
    function getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    // Función para obtener la semana actual en formato YYYY-WW
    function getCurrentWeek() {
        const today = new Date();
        const year = today.getFullYear();
        const start = new Date(year, 0, 1);
        const diff = today - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        const week = Math.floor(diff / oneWeek) + 1;
        return `${year}-W${String(week).padStart(2, '0')}`;
    }

    // Función para calcular la hora de salida
    function calcularSalida(entrada, horas) {
        const [hh, mm] = entrada.split(':').map(Number);
        const entradaDate = new Date();
        entradaDate.setHours(hh, mm, 0, 0);
        const minutos = horas * 60;
        const salidaDate = new Date(entradaDate.getTime() + minutos * 60000);
        const salidaHH = String(salidaDate.getHours()).padStart(2, '0');
        const salidaMM = String(salidaDate.getMinutes()).padStart(2, '0');
        return `${salidaHH}:${salidaMM}`;
    }

    // Función para calcular el tiempo transcurrido
    function calcularTiempoTranscurrido(entrada, salida) {
        const [hhE, mmE] = entrada.split(':').map(Number);
        const [hhS, mmS] = salida.split(':').map(Number);
        const entradaDate = new Date();
        entradaDate.setHours(hhE, mmE, 0, 0);
        const salidaDate = new Date();
        salidaDate.setHours(hhS, mmS, 0, 0);
        const diffMs = salidaDate - entradaDate;
        if (diffMs < 0) {
            return 'Hora de salida debe ser posterior a la de entrada.';
        }
        const diffMin = Math.floor(diffMs / 60000);
        const horas = Math.floor(diffMin / 60);
        const minutos = diffMin % 60;
        return `${horas} horas ${minutos} minutos`;
    }

    // Función para actualizar la hora de salida
    function actualizarSalida() {
        const entrada = horaEntradaInput.value;
        const horas = parseFloat(horasDiariasInput.value);
        if (entrada && !isNaN(horas)) {
            const salida = calcularSalida(entrada, horas);
            horaSalidaP.textContent = `Hora sugerida de salida: ${salida}`;
            actualizarSalidaSaldo();
        } else {
            horaSalidaP.textContent = 'Hora sugerida de salida: --:--';
            horaSalidaSaldoP.textContent = 'Hora sugerida de salida con saldo: --:--';
        }
    }

    // Función para actualizar la hora de salida con saldo
    function actualizarSalidaSaldo() {
        const entrada = horaEntradaInput.value;
        const horas = parseFloat(horasDiariasInput.value);
        if (entrada && !isNaN(horas)) {
            // Calcular salida base
            const [hh, mm] = entrada.split(':').map(Number);
            const entradaDate = new Date();
            entradaDate.setHours(hh, mm, 0, 0);
            const minutosBase = horas * 60;
            const salidaDate = new Date(entradaDate.getTime() + minutosBase * 60000);
            // Ajustar por saldo
            const ajusteMin = saldoSemanal * 60;  // positivo: restar minutos (salir antes)
            salidaDate.setTime(salidaDate.getTime() - ajusteMin * 60000);
            const salidaHH = String(salidaDate.getHours()).padStart(2, '0');
            const salidaMM = String(salidaDate.getMinutes()).padStart(2, '0');
            const salidaSaldo = `${salidaHH}:${salidaMM}`;
            horaSalidaSaldoP.textContent = `Hora sugerida de salida con saldo: ${salidaSaldo}`;
        } else {
            horaSalidaSaldoP.textContent = 'Hora sugerida de salida con saldo: --:--';
        }
    }

    // Función para actualizar el tiempo transcurrido
    function actualizarTiempoTranscurrido() {
        const entrada = horaEntradaContador.value;
        const salida = horaSalidaContador.value;
        if (entrada && salida) {
            const tiempo = calcularTiempoTranscurrido(entrada, salida);
            tiempoTranscurridoP.textContent = `Tiempo transcurrido: ${tiempo}`;
        } else {
            tiempoTranscurridoP.textContent = 'Tiempo transcurrido: -- horas -- minutos';
        }
    }

    // Cargar datos del localStorage si existen y son de hoy
    const storedData = localStorage.getItem('horaEntrada');
    if (storedData) {
        const data = JSON.parse(storedData);
        if (data.date === getTodayDate()) {
            horaEntradaInput.value = data.entrada;
            horasDiariasInput.value = data.horas;
            actualizarSalida();
        } else {
            localStorage.removeItem('horaEntrada');
        }
    }

    // Cargar saldo semanal
    const storedSaldo = localStorage.getItem('saldoSemanal');
    if (storedSaldo) {
        const data = JSON.parse(storedSaldo);
        if (data.semana === currentWeek) {
            saldoSemanal = data.saldo;
        } else {
            localStorage.removeItem('saldoSemanal');
        }
    }
    actualizarSaldoDisplay();
    actualizarInfoLocalStorage();
    // Actualizar hora con saldo después de cargar saldo
    if (horaEntradaInput.value) {
        actualizarSalidaSaldo();
    }

    // Event listeners
    horasDiariasInput.addEventListener('input', actualizarSalida);
    horaEntradaInput.addEventListener('input', function() {
        actualizarSalida();
        // Autorellenar hora de entrada en el contador
        horaEntradaContador.value = horaEntradaInput.value;
        actualizarTiempoTranscurrido();
    });

    // Event listeners para el contador de tiempo transcurrido
    horaEntradaContador.addEventListener('input', actualizarTiempoTranscurrido);
    horaSalidaContador.addEventListener('input', actualizarTiempoTranscurrido);

    // Event listener para registrar día
    registrarDiaBtn.addEventListener('click', function() {
        const entrada = horaEntradaContador.value;
        const salida = horaSalidaContador.value;
        if (!entrada || !salida) {
            alert('Ingresa hora de entrada y salida.');
            return;
        }
        const tiempo = calcularTiempoTranscurrido(entrada, salida);
        if (tiempo.includes('posterior')) {
            alert('Hora de salida debe ser posterior.');
            return;
        }
        // Calcular horas trabajadas
        const [hhE, mmE] = entrada.split(':').map(Number);
        const [hhS, mmS] = salida.split(':').map(Number);
        const entradaDate = new Date();
        entradaDate.setHours(hhE, mmE, 0, 0);
        const salidaDate = new Date();
        salidaDate.setHours(hhS, mmS, 0, 0);
        const diffMin = Math.floor((salidaDate - entradaDate) / 60000);
        const horasTrabajadas = diffMin / 60;
        const diff = Math.round((horasTrabajadas - 7.5) * 100) / 100;
        saldoSemanal += diff;
        const data = { semana: currentWeek, saldo: saldoSemanal };
        localStorage.setItem('saldoSemanal', JSON.stringify(data));
        actualizarSaldoDisplay();
        actualizarInfoLocalStorage();
        actualizarSalidaSaldo();
        alert(`Día registrado. Diferencia: ${diff.toFixed(1)} horas`);
    });

    guardarBtn.addEventListener('click', function() {
        const entrada = horaEntradaInput.value;
        const horas = parseFloat(horasDiariasInput.value);
        if (entrada && !isNaN(horas)) {
            const data = {
                date: getTodayDate(),
                entrada: entrada,
                horas: horas
            };
            localStorage.setItem('horaEntrada', JSON.stringify(data));
            actualizarInfoLocalStorage();
            cargarFormularioEdicion();
            alert('Hora de entrada guardada.');
        } else {
            alert('Por favor, ingresa una hora de entrada y horas diarias válidas.');
        }
    });

    // Event listeners para el formulario de edición
    guardarEdicionBtn.addEventListener('click', function() {
        const entrada = editHoraEntrada.value;
        const horas = parseFloat(editHorasDiarias.value);
        const saldo = Math.round(parseFloat(editSaldoSemanal.value) * 100) / 100;
        if (entrada && !isNaN(horas) && !isNaN(saldo)) {
            // Guardar hora de entrada
            const dataEntrada = {
                date: getTodayDate(),
                entrada: entrada,
                horas: horas
            };
            localStorage.setItem('horaEntrada', JSON.stringify(dataEntrada));
            // Actualizar saldo semanal
            saldoSemanal = saldo;
            const dataSaldo = { semana: currentWeek, saldo: saldoSemanal };
            localStorage.setItem('saldoSemanal', JSON.stringify(dataSaldo));
            // Actualizar displays
            actualizarSaldoDisplay();
            actualizarInfoLocalStorage();
            actualizarSalidaSaldo();
            // Actualizar inputs principales
            horaEntradaInput.value = entrada;
            horasDiariasInput.value = horas;
            actualizarSalida();
            alert('Cambios guardados.');
        } else {
            alert('Por favor, ingresa valores válidos.');
        }
    });

    borrarLocalstorageBtn.addEventListener('click', function() {
        if (confirm('¿Estás seguro de borrar toda la información en localStorage?')) {
            localStorage.clear();
            saldoSemanal = 0;
            actualizarSaldoDisplay();
            actualizarInfoLocalStorage();
            cargarFormularioEdicion();
            // Limpiar inputs
            horaEntradaInput.value = '';
            horasDiariasInput.value = '7.5';
            horaEntradaContador.value = '';
            horaSalidaContador.value = '';
            actualizarSalida();
            actualizarTiempoTranscurrido();
            alert('localStorage borrado.');
        }
    });

    // Cargar formulario de edición al inicio
    cargarFormularioEdicion();
});