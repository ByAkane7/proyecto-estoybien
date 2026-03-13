// --- VARIABLES GLOBALES ---
let timerInterval; // Cronómetro principal (bucle de 24 horas)
let emergencyInterval; // Controla el contador secundario de 60 segundos de emergencia
let totalSeconds = 86399; // Representa 24 horas en segundos (24 * 60 * 60 - 1)
let remainingSeconds = totalSeconds; // Tiempo que le queda al usuario para pulsar el botón
let thresholdSeconds = 14400; // 4 horas por defecto (cuando se pondrá verde)

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
    // CORRECCIÓN: Usamos visibility
    if (errorMsg) errorMsg.style.visibility = 'hidden'; 
    
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
 * Convierte los segundos restantes al formato de reloj, lo pinta en la pantalla 
 * y cambia su color cuando entra en la ventana permitida.
 */
function updateDisplay() {
    const h = Math.floor(remainingSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((remainingSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (remainingSeconds % 60).toString().padStart(2, '0');
    
    const displayElement = document.getElementById('timer-display');
    if (displayElement) {
        displayElement.textContent = `${h}:${m}:${s}`;

        // --- MAGIA DEL COLOR DEL RELOJ ---
        // Si el tiempo restante es menor o igual al umbral (ej: 4 horas)
        if (remainingSeconds <= thresholdSeconds) {
            displayElement.classList.add('ready'); // Se pone verde
        } else {
            displayElement.classList.remove('ready'); // Se queda negro
        }
    }
}
/**
 * Función que se ejecuta cuando el usuario pulsa "ESTOY BIEN".
 */

async function resetTimer() {
    const spamMsg = document.getElementById('spam-message');

    // 1. ANTI-SPAM: Comprobamos si es demasiado pronto
    if (remainingSeconds > thresholdSeconds) {
        if (spamMsg) {
            spamMsg.style.visibility = 'visible'; 
            setTimeout(() => { spamMsg.style.visibility = 'hidden'; }, 3000); 
        }
        return; 
    }

    // CORRECCIÓN: Limpiado para usar solo visibility
    if (spamMsg) spamMsg.style.visibility = 'hidden';

    // 2. ENVÍO REAL A LA BASE DE DATOS
    const tarjetaGuardada = localStorage.getItem('tarjetaActiva');
    const horasConfiguradas = (totalSeconds + 1) / 3600; 

    if (tarjetaGuardada) {
        try {
            await fetch(`https://backend-estoybien.onrender.com/api/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tarjeta: tarjetaGuardada, frecuencia: horasConfiguradas })
            });
            console.log("¡Registro guardado en la nube con éxito!");
        } catch (error) {
            console.error("Fallo al guardar en la nube:", error);
        }
    }

    // 3. Reseteamos el reloj en la pantalla
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
          // Llamamos a la función de geolocalización
            geo1();
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
 * Cambia la selección visual y ajusta el reloj real según las horas elegidas.
 * @param {number} hours - Las horas que el usuario ha seleccionado.
 */
/**
 * Cambia la selección visual y ajusta el reloj real.
 */
/**
 * Cambia la selección visual y ajusta el reloj real.
 */
function selectTime(hours) {
    document.querySelectorAll('.btn-option').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    
    // Calculamos el total de segundos
    totalSeconds = (hours * 3600) - 1; 
    
    // Calculamos la ventana de tiempo permitida
    let horasPermitidas = hours === 12 ? 2 : (hours === 24 ? 4 : 8);
    thresholdSeconds = horasPermitidas * 3600;
    
    // CORRECCIÓN: Actualizamos el reloj directamente saltándonos el anti-spam
    remainingSeconds = totalSeconds;
    updateDisplay();
    
    closeSettings();
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
    
    const errorMsg = document.getElementById('error-message');
    
    // Lo ocultamos por defecto (como un fantasma)
    if (errorMsg) errorMsg.style.visibility = 'hidden';

    // Comprobar que no estén vacíos
    if (!tarjeta || !password) {
        if (errorMsg) {
            errorMsg.textContent = "Por favor, rellena todos los campos.";
            errorMsg.style.visibility = 'visible'; // CORRECCIÓN
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
            localStorage.setItem('tarjetaActiva', tarjeta); 
            goToHome(); 
        } else {
            // ERROR Contraseña mal, usuario ya existe, etc
            if (errorMsg) {
                errorMsg.textContent = datos.mensaje;
                errorMsg.style.visibility = 'visible'; // CORRECCIÓN
            }
        }

    } catch (error) {
        console.error("Error conectando con el servidor:", error);
        if (errorMsg) {
            errorMsg.textContent = "No se pudo conectar con el servidor.";
            errorMsg.style.visibility = 'visible'; // CORRECCIÓN
        }
    }
}

// ==========================================
// GEOLOCALIZACIÓN, MAPAS Y EMERGENCIA
// ==========================================

let options1 = {
    enableHighAccuracy: false, // En false para que te funcione en el PC de la presentación
    timeout: 15000, 
    maximumAge: 0 
};

function geo1() {
    navigator.geolocation.getCurrentPosition(success1, error1, options1);
}

/**
 * Muestra la nueva pantalla, imprime los datos y carga Google Maps.
 */
function mostrarMapa(lat, lon, precision, origen) {
    // 1. Ocultar la alerta roja y mostrar la pantalla del mapa
    showScreen('screen-map');
    
    // 2. Escribir los datos en texto
    const mapInfo = document.getElementById("map-info");
    if (mapInfo) {
        mapInfo.innerHTML = `Origen: ${origen}<br>Lat: ${lat} | Lon: ${lon}<br>Precisión: ${precision}`;
    }
    
    // 3. Cargar el mapa de Google Maps (Enlace seguro y gratuito)
    const iframe = document.getElementById("google-map");
    if (iframe) {
        iframe.src = `https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`;
    }
}

// --- ÉXITO: SI EL NAVEGADOR ENCUENTRA EL GPS ---
async function success1(pos) {
    let crd = pos.coords;
    
    // Mostramos la pantalla del mapa
    mostrarMapa(crd.latitude, crd.longitude, crd.accuracy + " metros", "GPS Dispositivo");

    // Enviamos a tu base de datos (PostgreSQL)
    const tarjetaGuardada = localStorage.getItem('tarjetaActiva');
    if (tarjetaGuardada) {
        try {
            await fetch('https://backend-estoybien.onrender.com/api/emergencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tarjeta: tarjetaGuardada, latitud: crd.latitude, longitud: crd.longitude })
            });
            console.log("Coordenadas exactas guardadas en la BD.");
        } catch (error) {
            console.error("Fallo al guardar en la BD:", error);
        }
    }
}

// --- ERROR: SI EL GPS FALLA, BUSCAMOS POR LA IP DEL ORDENADOR ---
async function error1(err) {
    console.warn("GPS falló. Intentando ubicar por IP de red...");
    
    try {
        // Obtenemos la ubicación de la IP
        const respuesta = await fetch('https://ipapi.co/json/');
        const datosIP = await respuesta.json();

        if (datosIP.latitude && datosIP.longitude) {
            
            // Mostramos la pantalla del mapa
            mostrarMapa(datosIP.latitude, datosIP.longitude, "Aproximada (Ciudad)", "Red Internet");

            // Enviamos a tu base de datos (PostgreSQL)
            const tarjetaGuardada = localStorage.getItem('tarjetaActiva');
            if (tarjetaGuardada) {
                await fetch('https://backend-estoybien.onrender.com/api/emergencia', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tarjeta: tarjetaGuardada, latitud: datosIP.latitude, longitud: datosIP.longitude })
                });
                console.log("Coordenadas de red guardadas en la BD.");
            }
        } else {
            throw new Error("No hay coordenadas de red.");
        }
        
    } catch (errorFallback) {
        console.error("Fallo total de ubicación:", errorFallback);
        // Si no hay GPS ni Internet, mostramos el mapa pero con un error en el texto
        showScreen('screen-map');
        const mapInfo = document.getElementById("map-info");
        if (mapInfo) mapInfo.innerHTML = "<span style='color: var(--color-alert);'>Error crítico: Sin conexión para ubicar.</span>";
    }
}