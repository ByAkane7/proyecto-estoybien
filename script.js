let timerInterval; // Cronómetro principal de 24 horas
let emergencyInterval; // Controla el contador secundario de 60 segundos de emergencia
let totalSeconds = 86399; 
let remainingSeconds = totalSeconds;


// NAVEGACIÓN ENTRE PANTALLAS

/**
 * Oculta todas las pantallas de la app y muestra únicamente 
 * el ID del contenedor HTML que queremos mostrar.
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

/**
 * Prepara la pantalla de formulario cambiando su título (Login o Registro) y la muestra.
 * El texto que aparecerá como título ("Iniciar Sesión" o "Registrar").
 */
function showLoginForm(actionTitle) {
    document.getElementById('form-title').textContent = actionTitle;
    showScreen('screen-login-form');
}


/**
 * Simula el acceso correcto a la app.
 */
function goToHome() {
    showScreen('screen-home');
    startTimer();
}


// LÓGICA DEL CRONÓMETRO PRINCIPAL

/**
 * Inicia o reinicia la cuenta atrás de 24 horas.
 * Si el contador llega a cero, dispara la alerta de emergencia.
 */
function startTimer() {
    clearInterval(timerInterval);
    updateDisplay();
    
    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateDisplay();

        if (remainingSeconds <= 0) {
            triggerAlert();
        }
    }, 1000);
}

function updateDisplay() {
    const h = Math.floor(remainingSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((remainingSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (remainingSeconds % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').textContent = `${h}:${m}:${s}`;
}


/**
 * Función que se ejecuta cuando el usuario pulsa "ESTOY BIEN".
 * Vuelve a poner el contador al máximo (24 horas).
 */
function resetTimer() {
    remainingSeconds = totalSeconds;
    updateDisplay(); 
}


// EMERGENCIA

/**
 * Detiene el reloj principal y arranca la cuenta atrás crítica de 60 segundos.
 */
function triggerAlert() {
    clearInterval(timerInterval); // Detiene el reloj principal
    showScreen('screen-alert');
    
    // --- NUEVA LÓGICA: Contador de 60 segundos ---
    let emergencySeconds = 60;
    document.getElementById('alert-seconds').textContent = emergencySeconds;
    
    // Nos aseguramos de limpiar cualquier intervalo anterior
    clearInterval(emergencyInterval); 
    
    emergencyInterval = setInterval(() => {
        emergencySeconds--;
        document.getElementById('alert-seconds').textContent = emergencySeconds;
        
        if (emergencySeconds <= 0) {
            clearInterval(emergencyInterval);
            // Simulación llamada a emergencias
            alert("¡TIEMPO AGOTADO! Llamando a los servicios de emergencia...");
        }
    }, 1000); 
}

// Cancela la emergencia si el usuario pulsa el botón "CANCELAR / ESTOY BIEN".
function cancelAlert() {
    // Si el usuario le da a "Cancelar", detenemos la cuenta atrás de emergencia
    clearInterval(emergencyInterval); 
    
    // Volvemos a la normalidad
    remainingSeconds = totalSeconds;
    goToHome();
    startTimer();
}
// Simulación emergencia
function forceAlert() {
    remainingSeconds = 0;
    triggerAlert();
}

// GESTIÓN DE AJUSTES
function openSettings() {
    document.getElementById('modal-settings').classList.add('open');
}

function closeSettings() {
    document.getElementById('modal-settings').classList.remove('open');
}

function selectTime(hours) {
    document.querySelectorAll('.btn-option').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    
    alert(`Frecuencia cambiada a ${hours} horas`);
}