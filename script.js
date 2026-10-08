// --- 1. OBTENER ELEMENTOS DEL HTML ---
const canvas = document.getElementById('robotCanvas');
const ctx = canvas.getContext('2d');

// Botones de la base
const btnBaseLeft = document.getElementById('btn-base-left');
const btnBaseCenter = document.getElementById('btn-base-center');
const btnBaseRight = document.getElementById('btn-base-right');

// Sliders de ángulos restantes
const sliderTheta1 = document.getElementById('theta1');
const sliderTheta2 = document.getElementById('theta2');
const sliderTheta3 = document.getElementById('theta3');

// Etiquetas de texto
const valTheta0 = document.getElementById('val-theta0');
const valTheta1 = document.getElementById('val-theta1');
const valTheta2 = document.getElementById('val-theta2');
const valTheta3 = document.getElementById('val-theta3');

// Telemetría y estado
const posXDisplay = document.getElementById('pos-x');
const posYDisplay = document.getElementById('pos-y');
const posPhiDisplay = document.getElementById('pos-phi');
const statusDot = document.getElementById('status-dot');
const statusLabel = document.getElementById('status-label');

// Botones de acción y poses
const btnReset = document.getElementById('btn-reset');
const btnExtended = document.getElementById('btn-extended');
const btnElbow = document.getElementById('btn-elbow');
const btnClearTrail = document.getElementById('btn-clear-trail');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const btnExport = document.getElementById('btn-export');
const toast = document.getElementById('toast');

// Controles de Waypoints (Teach Pendant)
const btnSaveWaypoint = document.getElementById('btn-save-waypoint');
const btnPlayPath = document.getElementById('btn-play-path');
const btnClearWaypoints = document.getElementById('btn-clear-waypoints');
const waypointCountDisplay = document.getElementById('waypoint-count');

// Campos de la matriz homogénea
const matPx = document.getElementById('mat-px');
const matPy = document.getElementById('mat-py');

// --- 2. VARIABLES DE ESTADO Y SUAVIZADO (LERP) ---
let currentTheta0 = 0; // 0 = Centro, -1 = Izquierda, 1 = Derecha
let trailPoints = [];  // Arreglo para la estela

// Ángulos actuales del brazo
let animatedDeg1 = parseFloat(sliderTheta1.value);
let animatedDeg2 = parseFloat(sliderTheta2.value);
let animatedDeg3 = parseFloat(sliderTheta3.value);

// Variables del Grabador de Trayectorias (Waypoints)
let waypointsList = [];
let isPlayingPath = false;
let currentWaypointIndex = 0;
let playbackProgress = 0;
let startPose = { t0: 0, t1: 0, t2: 0, t3: 0 };
let targetPose = { t0: 0, t1: 0, t2: 0, t3: 0 };

// Parámetros físicos
const L1 = 130;
const L2 = 110;
const L3 = 80;

const originX = canvas.width / 2;
const originY = canvas.height - 80;

// --- 3. BUCLE DE ANIMACIÓN Y RENDERIZADO CONTINUO ---
function animate() {
    if (isPlayingPath) {
        playbackProgress += 0.02;
        if (playbackProgress >= 1.0) {
            playbackProgress = 0;
            currentWaypointIndex++;
            if (currentWaypointIndex >= waypointsList.length - 1) {
                isPlayingPath = false;
                showToast("¡Trayectoria completada con éxito!");
            } else {
                startPose = waypointsList[currentWaypointIndex];
                targetPose = waypointsList[currentWaypointIndex + 1];
                currentTheta0 = targetPose.t0;
            }
        }

        const p = playbackProgress;
        const smoothP = p * p * (3 - 2 * p);
        
        animatedDeg1 = startPose.t1 + (targetPose.t1 - startPose.t1) * smoothP;
        animatedDeg2 = startPose.t2 + (targetPose.t2 - startPose.t2) * smoothP;
        animatedDeg3 = startPose.t3 + (targetPose.t3 - startPose.t3) * smoothP;

        sliderTheta1.value = animatedDeg1;
        sliderTheta2.value = animatedDeg2;
        sliderTheta3.value = animatedDeg3;
    } else {
        const targetDeg1 = parseFloat(sliderTheta1.value);
        const targetDeg2 = parseFloat(sliderTheta2.value);
        const targetDeg3 = parseFloat(sliderTheta3.value);

        const smoothingFactor = 0.15;
        animatedDeg1 += (targetDeg1 - animatedDeg1) * smoothingFactor;
        animatedDeg2 += (targetDeg2 - animatedDeg2) * smoothingFactor;
        animatedDeg3 += (targetDeg3 - animatedDeg3) * smoothingFactor;
    }

    valTheta0.textContent = currentTheta0 === -1 ? '-180° (Izq)' : (currentTheta0 === 1 ? '+180° (Der)' : '0° (Centro)');
    valTheta1.textContent = Math.round(animatedDeg1);
    valTheta2.textContent = Math.round(animatedDeg2);
    valTheta3.textContent = Math.round(animatedDeg3);

    if (animatedDeg2 >= 85 || animatedDeg3 >= 85) {
        statusDot.style.backgroundColor = 'var(--danger-red)';
        statusLabel.textContent = 'ALERTA: LÍMITE ARTICULAR';
    } else {
        statusDot.style.backgroundColor = 'var(--success-green)';
        statusLabel.textContent = isPlayingPath ? 'MODO AUTOMÁTICO (TEACH)' : 'SISTEMA SEGURO';
    }

    const th1 = animatedDeg1 * (Math.PI / 180);
    const th2 = animatedDeg2 * (Math.PI / 180);
    const th3 = animatedDeg3 * (Math.PI / 180);

    const phi1 = th1;
    const phi2 = th1 + th2;
    const phi3 = th1 + th2 + th3;

    const x0 = 0;
    const y0 = 0;

    const x1 = x0 + L1 * Math.cos(phi1);
    const y1 = y0 - L1 * Math.sin(phi1); 

    const x2 = x1 + L2 * Math.cos(phi2);
    const y2 = y1 - L2 * Math.sin(phi2);

    const x3 = x2 + L3 * Math.cos(phi3);
    const y3 = y2 - L3 * Math.sin(phi3);

    const effectiveX = (currentTheta0 === -1) ? -x3 : x3;
    const absoluteCanvasX = originX + effectiveX;
    const absoluteCanvasY = originY + y3;

    if (trailPoints.length === 0 || Math.hypot(trailPoints[trailPoints.length - 1].x - absoluteCanvasX, trailPoints[trailPoints.length - 1].y - absoluteCanvasY) > 2) {
        trailPoints.push({ x: absoluteCanvasX, y: absoluteCanvasY });
        if (trailPoints.length > 120) trailPoints.shift();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawWorkspaceLimit();
    drawTrail();

    ctx.save();
    ctx.translate(originX, originY);

    if (currentTheta0 === -1) {
        ctx.scale(-1, 1);
    }

    drawLink(x2, y2, x3, y3, '#00e5ff', 8);
    drawLink(x1, y1, x2, y2, '#111827', 14);
    drawLink(x1, y1, x2, y2, '#64748b', 8);
    drawLink(x0, y0, x1, y1, '#111827', 18);
    drawLink(x0, y0, x1, y1, '#ff5722', 10);

    drawBase(x0, y0);
    drawJoint(x0, y0, 8, '#ffffff');
    drawJoint(x1, y1, 10, '#ff5722');
    drawJoint(x2, y2, 8, '#00e5ff');
    drawEndEffector(x3, y3, phi3);

    ctx.restore();

    const relX = effectiveX.toFixed(2);
    const relY = (-y3).toFixed(2);
    const totalDegPhi = (animatedDeg1 + animatedDeg2 + animatedDeg3).toFixed(1);

    posXDisplay.textContent = relX;
    posYDisplay.textContent = relY;
    posPhiDisplay.textContent = totalDegPhi + '°';

    matPx.textContent = relX;
    matPy.textContent = relY;

    requestAnimationFrame(animate);
}

// --- 4. FUNCIONES GRÁFICAS Y DE CINEMÁTICA INVERSA ---

function drawGrid() {
    ctx.strokeStyle = document.body.classList.contains('light-theme') ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const step = 40;

    for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    ctx.strokeStyle = document.body.classList.contains('light-theme') ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(canvas.width, originY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, canvas.height); ctx.stroke();
}

function drawWorkspaceLimit() {
    const maxRadius = L1 + L2 + L3;
    ctx.beginPath();
    ctx.arc(originX, originY, maxRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawTrail() {
    if (trailPoints.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(trailPoints[0].x, trailPoints[0].y);
    for (let i = 1; i < trailPoints.length; i++) {
        ctx.lineTo(trailPoints[i].x, trailPoints[i].y);
    }
    ctx.strokeStyle = 'rgba(255, 87, 34, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawLink(x1, y1, x2, y2, color, width) {
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.stroke();
}

function drawBase(x, y) {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x - 30, y, 60, 16);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x - 40, y + 16, 80, 8);
}

function drawJoint(x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#050508'; ctx.stroke();
}

function drawEndEffector(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-angle);
    ctx.fillStyle = '#ff5722';
    ctx.fillRect(-4, -12, 8, 12);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.strokeRect(-4, -12, 8, 12);
    ctx.restore();
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Algoritmo de Cinemática Inversa (IK) analítica por clics
canvas.addEventListener('click', (event) => {
    if (isPlayingPath) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    // Convertir a coordenadas relativas al origen del robot
    let relX = clickX - originX;
    let relY = originY - clickY;

    // Detectar si el clic es a la izquierda o derecha de la base
    if (relX < 0) {
        currentTheta0 = -1;
        relX = Math.abs(relX);
    } else {
        currentTheta0 = 0;
    }

    // Longitudes combinadas para IK de 2 eslabones principales (A = L1, B = L2 + L3)
    const A = L1;
    const B = L2 + L3;
    const rSq = relX * relX + relY * relY;
    const r = Math.sqrt(rSq);

    if (r > (A + B) || r < Math.abs(A - B)) {
        showToast("⚠️ Objetivo fuera del espacio de alcance");
        return;
    }

    // Ley de cosenos para Theta 2
    const cosTh2 = (rSq - A * A - B * B) / (2 * A * B);
    const clampedCos = Math.max(-1, Math.min(1, cosTh2));
    const th2Rad = Math.acos(clampedCos); // Configuración de codo arriba

    // Theta 1
    const th1Rad = Math.atan2(relY, relX) - Math.atan2(B * Math.sin(th2Rad), A + B * Math.cos(th2Rad));

    const deg1 = th1Rad * (180 / Math.PI);
    const deg2 = th2Rad * (180 / Math.PI);
    const deg3 = 0; // Tercer eslabón alineado

    // Asignar a los sliders para que la inercia (LERP) mueva el brazo de forma fluida hacia el punto
    if (deg1 >= 0 && deg1 <= 180 && deg2 >= 0 && deg2 <= 160) {
        sliderTheta1.value = deg1;
        sliderTheta2.value = deg2;
        sliderTheta3.value = deg3;
        showToast("🎯 Objetivo IK alcanzado");
    } else {
        showToast("⚠️ Configuración articular fuera de límites");
    }
});

// --- 5. EVENT LISTENERS Y CONTROLES ---

btnBaseLeft.addEventListener('click', () => { if(!isPlayingPath) currentTheta0 = -1; });
btnBaseCenter.addEventListener('click', () => { if(!isPlayingPath) currentTheta0 = 0; });
btnBaseRight.addEventListener('click', () => { if(!isPlayingPath) currentTheta0 = 1; });

btnClearTrail.addEventListener('click', () => {
    trailPoints = [];
});

btnThemeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
});

btnExport.addEventListener('click', () => {
    const textToCopy = `Matriz T0_3 Homogénea:\nPx: ${matPx.textContent} px\nPy: ${matPy.textContent} px\nÁngulos: Base=${currentTheta0}, T1=${Math.round(animatedDeg1)}°, T2=${Math.round(animatedDeg2)}°, T3=${Math.round(animatedDeg3)}°`;
    navigator.clipboard.writeText(textToCopy);
    showToast("¡Datos copiados al portapapeles!");
});

btnSaveWaypoint.addEventListener('click', () => {
    if (isPlayingPath) return;
    waypointsList.push({
        t0: currentTheta0,
        t1: parseFloat(sliderTheta1.value),
        t2: parseFloat(sliderTheta2.value),
        t3: parseFloat(sliderTheta3.value)
    });
    waypointCountDisplay.textContent = `${waypointsList.length} guardados`;
    showToast(`Pose #${waypointsList.length} guardada con éxito`);
});

btnPlayPath.addEventListener('click', () => {
    if (waypointsList.length < 2) {
        showToast("¡Necesitas guardar al menos 2 poses para reproducir!");
        return;
    }
    if (isPlayingPath) return;

    currentWaypointIndex = 0;
    playbackProgress = 0;
    startPose = waypointsList[0];
    targetPose = waypointsList[1];
    currentTheta0 = startPose.t0;
    
    sliderTheta1.value = startPose.t1;
    sliderTheta2.value = startPose.t2;
    sliderTheta3.value = startPose.t3;

    isPlayingPath = true;
    showToast("▶ Reproduciendo trayectoria autónoma...");
});

btnClearWaypoints.addEventListener('click', () => {
    if (isPlayingPath) return;
    waypointsList = [];
    waypointCountDisplay.textContent = "0 guardados";
    showToast("Poses borradas");
});

btnReset.addEventListener('click', () => {
    if (isPlayingPath) return;
    currentTheta0 = 0;
    sliderTheta1.value = 90;
    sliderTheta2.value = 45;
    sliderTheta3.value = 45;
    trailPoints = [];
});

btnExtended.addEventListener('click', () => {
    if (isPlayingPath) return;
    currentTheta0 = 0;
    sliderTheta1.value = 0;
    sliderTheta2.value = 90;
    sliderTheta3.value = 90;
    trailPoints = [];
});

btnElbow.addEventListener('click', () => {
    if (isPlayingPath) return;
    currentTheta0 = 1;
    sliderTheta1.value = 45;
    sliderTheta2.value = 60;
    sliderTheta3.value = 60;
    trailPoints = [];
});

// --- 6. INICIALIZACIÓN ---
window.addEventListener('DOMContentLoaded', () => {
    currentTheta0 = 0;
    sliderTheta1.value = 90;
    sliderTheta2.value = 45;
    sliderTheta3.value = 45;
    requestAnimationFrame(animate);
});