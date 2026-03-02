// --- VARIABLES GLOBALES ---
let timerInterval; // Cronómetro principal (bucle de 24 horas)
let emergencyInterval; // Controla el contador secundario de 60 segundos de emergencia
let totalSeconds = 86399; // Representa 24 horas en segundos (24 * 60 * 60 - 1)
let remainingSeconds = totalSeconds; // Tiempo que le queda al usuario para pulsar el botón

// --- NAVEGACIÓN ENTRE PANTALLAS ---

/**
 * Oculta todas las pantallas de la app y muestra únicamente la que se le pasa por parámetro.
 * @param {string} screenId - El ID del contenedor HTML que queremos mostrar.
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

/**
 * Prepara la pantalla de formulario cambiando su título (Login o Registro) y la muestra.
 * Limpia los campos y los mensajes de error de intentos anteriores.
 * @param {string} actionTitle - El texto que aparecerá como título ("Iniciar Sesión" o "Registrar").
 */
function showLoginForm(actionTitle) {
    document.getElementById('form-title').textContent = actionTitle;
    
    // Limpiamos los campos y los errores al entrar a esta pantalla
    document.getElementById('input-tarjeta').value = '';
    document.getElementById('input-password').value = '';
    
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) errorMsg.style.display = 'none';
    
    showScreen('screen-login-form');
}

/**
 * Simula el acceso correcto a la app, llevando al usuario a la pantalla principal e iniciando el reloj.
 */
function goToHome() {
    showScreen('screen-home');
    startTimer();
}

// --- LÓGICA DEL CRONÓMETRO PRINCIPAL ---

/**
 * Inicia o reinicia la cuenta atrás de 24 horas.
 * Si el contador llega a cero, dispara la alerta de emergencia.
 */
function startTimer() {
    clearInterval(timerInterval); // Limpiamos por seguridad para que no haya dos relojes a la vez
    updateDisplay();
    
    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateDisplay();

        if (remainingSeconds <= 0) {
            triggerAlert();
        }
    }, 1000); // 1000 ms = 1 segundo
}

/**
 * Convierte los segundos restantes al formato de reloj (HH:MM:SS) y lo pinta en la pantalla.
 */
function updateDisplay() {
    const h = Math.floor(remainingSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((remainingSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (remainingSeconds % 60).toString().padStart(2, '0');
    
    const displayElement = document.getElementById('timer-display');
    if (displayElement) {
        displayElement.textContent = `${h}:${m}:${s}`;
    }
}

/**
 * Función que se ejecuta cuando el usuario pulsa "ESTOY BIEN".
 * Vuelve a poner el contador al máximo (24 horas).
 */
function resetTimer() {
    remainingSeconds = totalSeconds;
    updateDisplay(); 
}

// --- PROTOCOLO DE EMERGENCIA ---

/**
 * Detiene el reloj principal y arranca la cuenta atrás crítica de 60 segundos.
 */
function triggerAlert() {
    clearInterval(timerInterval); // Detiene el reloj principal
    showScreen('screen-alert');
    
    // Contador de 60 segundos
    let emergencySeconds = 60;
    document.getElementById('alert-seconds').textContent = emergencySeconds;
    
    // Nos aseguramos de limpiar cualquier intervalo anterior
    clearInterval(emergencyInterval); 
    
    emergencyInterval = setInterval(() => {
        emergencySeconds--;
        document.getElementById('alert-seconds').textContent = emergencySeconds;
        
        if (emergencySeconds <= 0) {
            clearInterval(emergencyInterval);
            // Simulación de llamada real
            alert("¡TIEMPO AGOTADO! Llamando a los servicios de emergencia...");
        }
    }, 1000); 
}

/**
 * Cancela la emergencia si el usuario pulsa el botón "CANCELAR / ESTOY BIEN".
 * Restaura el temporizador principal y vuelve a la pantalla de inicio.
 */
function cancelAlert() {
    // Si el usuario le da a "Cancelar", detenemos la cuenta atrás de emergencia
    clearInterval(emergencyInterval); 
    
    // Volvemos a la normalidad
    remainingSeconds = totalSeconds;
    goToHome(); // La función goToHome ya se encarga de llamar a startTimer()
}

/**
 * Función exclusiva para demostraciones (atajo). 
 * Fuerza que el tiempo baje a 0 al instante para ver la pantalla roja sin esperar.
 */
function forceAlert() {
    remainingSeconds = 0;
    triggerAlert();
}

// --- GESTIÓN DE AJUSTES ---

/**
 * Abre la ventana superpuesta (modal) de ajustes.
 */
function openSettings() {
    document.getElementById('modal-settings').classList.add('open');
}

/**
 * Cierra la ventana superpuesta (modal) de ajustes.
 */
function closeSettings() {
    document.getElementById('modal-settings').classList.remove('open');
}

/**
 * Cambia la selección visual de los botones de frecuencia de aviso.
 * @param {number} hours - Las horas que el usuario ha seleccionado.
 */
function selectTime(hours) {
    // Quitamos la clase 'selected' de todos los botones
    document.querySelectorAll('.btn-option').forEach(btn => btn.classList.remove('selected'));
    // Le ponemos la clase 'selected' solo al botón que se ha pulsado
    event.target.classList.add('selected');
    
    alert(`Frecuencia cambiada a ${hours} horas`);
}

// --- COMUNICACIÓN CON EL BACKEND (MYSQL + NODE.JS) ---

/**
 * Recoge los datos, decide si es Login o Registro, y habla con el servidor MySQL.
 * Muestra los errores directamente en la interfaz (sin alertas flotantes).
 */
async function procesarFormulario() {
    const tarjeta = document.getElementById('input-tarjeta').value;
    const password = document.getElementById('input-password').value;
    const tipoAccion = document.getElementById('form-title').textContent;
    
    // Capturamos el elemento donde mostraremos los errores
    const errorMsg = document.getElementById('error-message');
    
    // Lo ocultamos por defecto cada vez que pulsamos el botón
    if (errorMsg) errorMsg.style.display = 'none';

    // Comprobar que no estén vacíos
    if (!tarjeta || !password) {
        if (errorMsg) {
            errorMsg.textContent = "Por favor, rellena todos los campos.";
            errorMsg.style.display = 'block';
        }
        return;
    }

    const endpoint = tipoAccion === 'Registrar' ? '/api/registrar' : '/api/login';

    try {
        const respuesta = await fetch(`https://backend-estoybien.onrender.com${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tarjeta: tarjeta, password: password })
        });

        const datos = await respuesta.json();

        // Reaccionar a lo que dice el servidor
        if (respuesta.ok) {
            // LOGIN O REGISTRO CORRECTO
            goToHome(); 
        } else {
            // ERROR Contraseña mal, usuario ya existe, etc
            if (errorMsg) {
                errorMsg.textContent = datos.mensaje;
                errorMsg.style.display = 'block';
            }
        }

    } catch (error) {
        console.error("Error conectando con el servidor:", error);
        if (errorMsg) {
            errorMsg.textContent = "No se pudo conectar con el servidor.";
            errorMsg.style.display = 'block';
        }
    }
}