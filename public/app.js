// URL del backend
const API_BASE_URL = 'https://pinger-be.casacocchy.duckdns.org';
const SOCKET_URL = 'https://pinger-be.casacocchy.duckdns.org';

// Connessione Socket.io
const socket = io(SOCKET_URL);

// Elementi DOM
const elements = {
    connectionDot: document.getElementById('connection-status-dot'),
    connectionText: document.getElementById('connection-status-text'),
    powerStatus: document.getElementById('power-status'),
    heartbeatIndicator: document.getElementById('heartbeat-indicator'),
    lastHeartbeat: document.getElementById('last-heartbeat'),
    heartbeatCounter: document.getElementById('heartbeat-counter'),
    esp32Ip: document.getElementById('esp32-ip'),
    esp32Rssi: document.getElementById('esp32-rssi'),
    esp32Uptime: document.getElementById('esp32-uptime'),
    mqttStatus: document.getElementById('mqtt-status'),
    dbRecords: document.getElementById('db-records'),
    telegramStatus: document.getElementById('telegram-status'),
    chartCanvas: document.getElementById('uptimeChart')
};

let uptimeChart = null;

// Socket.io eventi
socket.on('connect', () => {
    updateConnectionStatus(true);
    fetchInitialData();
});

socket.on('disconnect', () => {
    updateConnectionStatus(false);
});

socket.on('heartbeat_received', (data) => {
    if (data.real) {
        flashHeartbeat();
        updateRealtimeData(data);
    }
});

// Funzioni UI
function updateConnectionStatus(isOnline) {
    if (!elements.connectionDot || !elements.connectionText) return;
    
    elements.connectionDot.className = `status-dot ${isOnline ? 'online' : ''}`;
    elements.connectionText.textContent = isOnline ? 'ONLINE' : 'OFFLINE';
}

function flashHeartbeat() {
    if (!elements.heartbeatIndicator) return;
    
    elements.heartbeatIndicator.classList.add('flash');
    setTimeout(() => {
        elements.heartbeatIndicator.classList.remove('flash');
    }, 400);
}

function updateRealtimeData(data) {
    if (elements.powerStatus) {
        elements.powerStatus.textContent = 'ONLINE';
        elements.powerStatus.className = 'status-online';
    }
    
    if (elements.heartbeatIndicator) {
        elements.heartbeatIndicator.style.backgroundColor = 'var(--accent-primary)';
    }
    
    if (elements.heartbeatCounter) elements.heartbeatCounter.textContent = `#${data.counter}`;
    if (elements.lastHeartbeat) elements.lastHeartbeat.textContent = new Date(data.timestamp).toLocaleTimeString('it-IT');
    if (elements.esp32Ip) elements.esp32Ip.textContent = data.ip;
    if (elements.esp32Rssi) elements.esp32Rssi.textContent = `${data.rssi} dBm`;
    if (elements.esp32Uptime) elements.esp32Uptime.textContent = `${Math.floor(data.uptime / 1000)}s`;
}

// Carica dati dal backend
async function fetchInitialData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/status`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        // Aggiorna interfaccia con dati reali
        if (data.mqtt && elements.mqttStatus) {
            elements.mqttStatus.textContent = data.mqtt.connected ? 'ONLINE' : 'OFFLINE';
            elements.mqttStatus.className = data.mqtt.connected ? 'status-online' : 'status-offline';
        }
        
        if (data.database && elements.dbRecords) {
            elements.dbRecords.textContent = `${data.database.totalHeartbeats} records`;
        }
        
        if (elements.telegramStatus) {
            elements.telegramStatus.textContent = 'ENABLED';
            elements.telegramStatus.className = 'status-online';
        }

        // Carica grafico
        loadChartData('week');

    } catch (error) {
        console.error('Backend non disponibile:', error);
        // Non fare nulla - lascia interfaccia vuota
    }
}

// Carica dati grafico
async function loadChartData(period) {
    // Aggiorna bottoni attivi
    document.querySelectorAll('.btn').forEach(btn => btn.classList.remove('active'));
    const activeButton = document.querySelector(`[onclick="loadChartData('${period}')"]`);
    if (activeButton) activeButton.classList.add('active');

    try {
        const response = await fetch(`${API_BASE_URL}/api/chart/uptime/${period}`);
        if (!response.ok) throw new Error('Chart API error');
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const labels = result.data.map(d => d.label);
            const data = result.data.map(d => parseFloat(d.uptime));
            createUptimeChart(labels, data);
        }
        
    } catch (error) {
        console.error('Grafico non disponibile:', error);
        // Non fare nulla - non mostrare grafico
    }
}

// Crea grafico
function createUptimeChart(labels, data) {
    if (!elements.chartCanvas) return;
    
    if (uptimeChart) {
        uptimeChart.destroy();
    }
    
    uptimeChart = new Chart(elements.chartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: 'rgba(52, 211, 153, 0.5)',
                borderColor: '#34D399',
                borderWidth: 1,
                borderRadius: 2,
                barPercentage: 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    ticks: { color: '#6B7280', font: { family: 'JetBrains Mono, monospace' } },
                    grid: { color: 'rgba(55, 65, 81, 0.4)' }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#6B7280',
                        font: { family: 'JetBrains Mono, monospace' },
                        callback: (value) => value + '%'
                    },
                    grid: { color: 'rgba(55, 65, 81, 0.4)' }
                }
            }
        }
    });
}

// Avvio
fetchInitialData();
setInterval(fetchInitialData, 30000);
