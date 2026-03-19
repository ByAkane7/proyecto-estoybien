// Constantes de configuración
const API_BASE_URL = 'https://backend-estoybien.onrender.com';
const GEOLOCATION_OPTIONS = {
    enableHighAccuracy: false,
    timeout: 15000, 
    maximumAge: 0 
};

// Variables de estado global
let timerInterval; 
let emergencyInterval; 
let totalSeconds = 86399; 
let remainingSeconds = totalSeconds; 
let thresholdSeconds = 86340;

/**
 * Gestiona la navegación entre vistas principales.
 * @param {string} screenId - ID del contenedor a mostrar.
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

/**
 * Prepara la vista del formulario de autenticación.
 * @param {string} actionTitle - Título de la acción ('Iniciar Sesión' | 'Registrar').
 */
function showLoginForm(actionTitle) {
    document.getElementById('form-title').textContent = actionTitle;
    document.getElementById('input-tarjeta').value = '';
    document.getElementById('input-password').value = '';
    
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) errorMsg.style.visibility = 'hidden'; 
    
    showScreen('screen-login-form');
}

/**
 * Redirige a la vista principal e inicializa los temporizadores.
 */
function goToHome() {
    showScreen('screen-home');
    startTimer();
}

/**
 * Inicia el ciclo del temporizador principal de 24 horas.
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

/**
 * Actualiza la representación visual del temporizador en el DOM.
 */
function updateDisplay() {
    const h = Math.floor(remainingSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((remainingSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (remainingSeconds % 60).toString().padStart(2, '0');
    
    const displayElement = document.getElementById('timer-display');
    if (!displayElement) return;

    displayElement.textContent = `${h}:${m}:${s}`;

    if (remainingSeconds <= thresholdSeconds) {
        displayElement.classList.add('ready');
    } else {
        displayElement.classList.remove('ready');
    }
}

/**
 * Procesa el registro de control (check-in) del usuario hacia la base de datos.
 */
async function resetTimer() {
    const spamMsg = document.getElementById('spam-message');

    if (remainingSeconds > thresholdSeconds) {
        if (spamMsg) {
            spamMsg.style.visibility = 'visible'; 
            setTimeout(() => { spamMsg.style.visibility = 'hidden'; }, 3000); 
        }
        return; 
    }

    if (spamMsg) spamMsg.style.visibility = 'hidden';

    const tarjetaGuardada = localStorage.getItem('tarjetaActiva');
    const horasConfiguradas = (totalSeconds + 1) / 3600; 

    if (tarjetaGuardada) {
        try {
            await fetch(`${API_BASE_URL}/api/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tarjeta: tarjetaGuardada, frecuencia: horasConfiguradas })
            });
            console.log("Registro de actividad completado.");
        } catch (error) {
            console.error("Fallo de conexión al registrar actividad:", error);
        }
    }

    remainingSeconds = totalSeconds;
    updateDisplay(); 
}

/**
 * Activa el protocolo de emergencia de 60 segundos.
 */
function triggerAlert() {
    clearInterval(timerInterval); 
    showScreen('screen-alert');
    
    let emergencySeconds = 20;
    const alertSecondsElement = document.getElementById('alert-seconds');
    alertSecondsElement.textContent = emergencySeconds;
    
    clearInterval(emergencyInterval); 
    
    emergencyInterval = setInterval(() => {
        emergencySeconds--;
        alertSecondsElement.textContent = emergencySeconds;
        
        if (emergencySeconds <= 0) {
            clearInterval(emergencyInterval);
            obtenerGeolocalizacion();
        }
    }, 1000); 
}

/**
 * Cancela el protocolo de emergencia y restaura el estado.
 */
function cancelAlert() {
    clearInterval(emergencyInterval); 
    remainingSeconds = totalSeconds;
    goToHome(); 
}

/**
 * Fuerza el disparo inmediato de la alerta (utilidad de desarrollo/pruebas).
 */
function forceAlert() {
    remainingSeconds = 0;
    triggerAlert();
}

/**
 * Abre el modal de configuración de frecuencia.
 */
function openSettings() {
    document.getElementById('modal-settings').classList.add('open');
}

/**
 * Cierra el modal de configuración de frecuencia.
 */
function closeSettings() {
    document.getElementById('modal-settings').classList.remove('open');
}

/**
 * Aplica la nueva frecuencia de horas seleccionada y reinicia los contadores.
 * @param {HTMLElement} element - Referencia al nodo DOM que disparó el evento.
 * @param {number} hours - Frecuencia en horas.
 */
function selectTime(element, hours) {
    document.querySelectorAll('.btn-option').forEach(btn => btn.classList.remove('selected'));
    element.classList.add('selected');
    
    totalSeconds = (hours * 3600) - 1; 
    thresholdSeconds = (hours * 3600) - 60;
    
    remainingSeconds = totalSeconds;
    updateDisplay();
    closeSettings();
}

/**
 * Gestiona la autenticación o el registro de usuario contra la API.
 */
async function procesarFormulario() {
    const tarjeta = document.getElementById('input-tarjeta').value;
    const password = document.getElementById('input-password').value;
    const tipoAccion = document.getElementById('form-title').textContent;
    const errorMsg = document.getElementById('error-message');
    
    if (errorMsg) errorMsg.style.visibility = 'hidden';

    if (!tarjeta || !password) {
        if (errorMsg) {
            errorMsg.textContent = "Por favor, rellena todos los campos.";
            errorMsg.style.visibility = 'visible'; 
        }
        return;
    }

    const endpoint = tipoAccion === 'Registrar' ? '/api/registrar' : '/api/login';

    try {
        const respuesta = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tarjeta, password })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            localStorage.setItem('tarjetaActiva', tarjeta); 
            goToHome(); 
        } else {
            if (errorMsg) {
                errorMsg.textContent = datos.mensaje;
                errorMsg.style.visibility = 'visible'; 
            }
        }
    } catch (error) {
        console.error("Error en petición de formulario:", error);
        if (errorMsg) {
            errorMsg.textContent = "Error de conexión con el servidor.";
            errorMsg.style.visibility = 'visible'; 
        }
    }
}

/**
 * Inicia la captura de coordenadas del dispositivo.
 */
function obtenerGeolocalizacion() {
    navigator.geolocation.getCurrentPosition(onGeolocalizacionSuccess, onGeolocalizacionError, GEOLOCATION_OPTIONS);
}

/**
 * Renderiza la vista de mapa en el DOM.
 * @param {number} lat - Latitud.
 * @param {number} lon - Longitud.
 * @param {string} precision - Cadena de precisión descriptiva.
 * @param {string} origen - Método utilizado para obtener las coordenadas.
 */
function mostrarMapa(lat, lon, precision, origen) {
    showScreen('screen-map');
    
    const mapInfo = document.getElementById("map-info");
    if (mapInfo) {
        mapInfo.innerHTML = `Origen: ${origen}<br>Lat: ${lat} | Lon: ${lon}<br>Precisión: ${precision}`;
    }
    
    const iframe = document.getElementById("google-map");
    if (iframe) {
        iframe.src = `https://maps.google.com/maps?q=${lat},${lon}&hl=es&z=15&output=embed`;
    }
}

/**
 * Callback ejecutado al obtener las coordenadas GPS correctamente.
 * @param {GeolocationPosition} pos - Objeto de posición del navegador.
 */
async function onGeolocalizacionSuccess(pos) {
    const { latitude, longitude, accuracy } = pos.coords;
    
    mostrarMapa(latitude, longitude, `${accuracy} metros`, "GPS Dispositivo");

    const tarjetaGuardada = localStorage.getItem('tarjetaActiva');
    if (tarjetaGuardada) {
        try {
            await fetch(`${API_BASE_URL}/api/emergencia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tarjeta: tarjetaGuardada, latitud: latitude, longitud: longitude })
            });
        } catch (error) {
            console.error("Error transmitiendo emergencia:", error);
        }
    }
}

/**
 * Fallback ejecutado cuando falla la geolocalización nativa (intento vía IP).
 * @param {GeolocationPositionError} err - Error retornado por la API del navegador.
 */
async function onGeolocalizacionError(err) {
    console.warn(`Fallo de GPS (${err.code}): ${err.message}. Empleando fallback IP.`);
    
    try {
        const respuesta = await fetch('https://ipapi.co/json/');
        const datosIP = await respuesta.json();

        if (datosIP.latitude && datosIP.longitude) {
            mostrarMapa(datosIP.latitude, datosIP.longitude, "Aproximada (IP)", "Red de datos");

            const tarjetaGuardada = localStorage.getItem('tarjetaActiva');
            if (tarjetaGuardada) {
                await fetch(`${API_BASE_URL}/api/emergencia`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tarjeta: tarjetaGuardada, latitud: datosIP.latitude, longitud: datosIP.longitude })
                });
            }
        } else {
            throw new Error("API IP no retornó coordenadas válidas.");
        }
    } catch (errorFallback) {
        console.error("Fallo general de localización:", errorFallback);
        showScreen('screen-map');
        const mapInfo = document.getElementById("map-info");
        if (mapInfo) mapInfo.innerHTML = "<span style='color: var(--color-alert);'>Fallo crítico de red. Coordenadas no disponibles.</span>";
    }
}

/**
 * Intercala la visibilidad de los contenedores en la vista de administración.
 * @param {string} tab - Identificador de pestaña ('checkin' | 'emer').
 */
function switchAdminTab(tab) {
    const btnCheckin = document.getElementById('btn-tab-checkin');
    const btnEmer = document.getElementById('btn-tab-emer');
    const contCheckin = document.getElementById('admin-registros');
    const contEmer = document.getElementById('admin-emergencias');

    if (tab === 'checkin') {
        btnCheckin.classList.add('active');
        btnEmer.classList.remove('active');
        contCheckin.style.display = 'block';
        contEmer.style.display = 'none';
    } else {
        btnEmer.classList.add('active');
        btnCheckin.classList.remove('active');
        contEmer.style.display = 'block';
        contCheckin.style.display = 'none';
    }
}

/**
 * Inicializa y renderiza los datos dinámicos de la vista de administración.
 */
async function showAdmin() {
    showScreen('screen-admin');
    switchAdminTab('checkin');
    
    const contRegistros = document.getElementById('admin-registros');
    const contEmergencias = document.getElementById('admin-emergencias');

    contRegistros.innerHTML = "Conectando...";
    contEmergencias.innerHTML = "Conectando...";

    try {
        const respuesta = await fetch(`${API_BASE_URL}/api/admin/datos`);
        const datos = await respuesta.json();

        // Renderizado de lista de emergencias
        if (datos.emergencias && datos.emergencias.length > 0) {
            let htmlEmer = "";
            datos.emergencias.forEach(e => {
                const fecha = new Date(e.fecha_emergencia).toLocaleString();
                const mapUrl = `https://maps.google.com/maps?q=${e.latitud},${e.longitud}&z=15&output=embed`;

                htmlEmer += `
                <div style="background: #fff5f5; margin-bottom: 1rem; border-radius: 15px; border: 2px solid var(--color-alert); box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column;">
                    <div style="padding: 1rem;">
                        <strong>Tarjeta:</strong> ${e.tarjeta_sanitaria}<br>
                        <strong>Coordenadas:</strong> ${e.latitud}, ${e.longitud}<br>
                        <span style="color: #888; font-size: 0.9em;">${fecha}</span>
                    </div>
                    <div style="width: 100%; height: 200px;">
                        <iframe src="${mapUrl}" width="100%" height="100%" frameborder="0" style="border:0;" allowfullscreen></iframe>
                    </div>
                </div>`;
            });
            contEmergencias.innerHTML = htmlEmer;
        } else {
            contEmergencias.innerHTML = "<p style='color: #888;'>No existen registros de alertas.</p>";
        }

        // Renderizado de lista de check-ins
        if (datos.registros && datos.registros.length > 0) {
            let htmlReg = "";
            datos.registros.forEach(r => {
                const fecha = new Date(r.fecha_registro).toLocaleString();
                htmlReg += `
                <div style="background: #f9f9f9; padding: 10px; margin-bottom: 10px; border-radius: 10px; border: 1px solid var(--color-primary);">
                    <strong>Tarjeta:</strong> ${r.tarjeta_sanitaria}<br>
                    <strong>Frecuencia:</strong> ${r.frecuencia_horas}h<br>
                    <span style="color: #888; font-size: 0.9em;">${fecha}</span>
                </div>`;
            });
            contRegistros.innerHTML = htmlReg;
        } else {
            contRegistros.innerHTML = "<p style='color: #888;'>No existen registros de actividad.</p>";
        }

    } catch (error) {
        console.error("Error obteniendo telemetría:", error);
        contRegistros.innerHTML = "<p style='color: var(--color-alert);'>Fallo de sincronización con servidor.</p>";
        contEmergencias.innerHTML = "";
    }
}