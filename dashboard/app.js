const API_URL = "http://127.0.0.1:8000/api/logs";

let globalLogs = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchLogs();
    initMap();
    initChart();

    // Profile Dropdown Toggle
    const profileBtn = document.getElementById('user-profile-btn');
    const dropdown = document.getElementById('profile-dropdown');

    // Add Search Functionality
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#logs-body tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });

    const notifBtn = document.querySelector('.notification-btn');
    notifBtn.addEventListener('click', () => {
        alert("You have 3 new security events from AI CyberShield!");
        document.querySelector('.notification-btn .badge').style.display = 'none';
    });

    profileBtn.addEventListener('click', (e) => {
        dropdown.classList.toggle('show');
        e.stopPropagation();
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('show');
    });

    document.getElementById('modal-close-btn').addEventListener('click', () => {
        document.getElementById('details-modal').classList.remove('show');
    });

    document.getElementById('refresh-btn').addEventListener('click', () => {
        const btn = document.getElementById('refresh-btn');
        btn.querySelector('i').classList.add('rotate');
        setTimeout(() => btn.querySelector('i').classList.remove('rotate'), 1000);
        fetchLogs();
    });
});

async function fetchLogs() {
    const tbody = document.getElementById('logs-body');

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        const logs = data.logs;
        globalLogs = logs;

        updateSummaryStats(logs);
        updateTimeline(logs);
        renderTable(logs, tbody);

    } catch (error) {
        console.error("Dashboard error:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--danger); padding: 40px;">
                    <i class="ri-error-warning-line" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                    Could not connect to the AI CyberShield Backend.<br>
                    Make sure the FastAPI server is running.
                </td>
            </tr>
        `;
        document.getElementById('timeline-body').innerHTML = `
            <div style="text-align: center; color: var(--danger); padding: 20px;">
                Backend Offline
            </div>
        `;
    }
}

function updateSummaryStats(logs) {
    let safe = 0, suspicious = 0, phishing = 0;

    logs.forEach(log => {
        if (log.status === "Safe") safe++;
        else if (log.status === "Suspicious") suspicious++;
        else if (log.status === "Phishing") phishing++;
    });

    const total = logs.length;
    animateValue("count-safe", 0, safe, 1000);
    animateValue("count-suspicious", 0, suspicious, 1000);
    animateValue("count-phishing", 0, phishing, 1000);
    animateValue("count-total", 0, total, 1000);

    // Update AI Threat Meter
    let riskPercentage = 0;
    if (total > 0) {
        riskPercentage = Math.round(((suspicious * 50) + (phishing * 100)) / total);
    }

    document.getElementById('threat-meter-bar').style.width = `${riskPercentage}%`;
    document.getElementById('meter-percent').innerText = `${riskPercentage}%`;

    const meterStatus = document.getElementById('meter-status');
    const heroTitle = document.getElementById('hero-protection-level');
    const heroThreat = document.getElementById('hero-threat-level');
    const heroIcon = document.getElementById('hero-status-icon');

    if (riskPercentage < 20) {
        meterStatus.innerText = "Status: Safe Network";
        meterStatus.style.background = "var(--safe-glow)";
        meterStatus.style.color = "var(--safe)";

        heroTitle.innerText = "SYSTEM SECURE";
        heroThreat.innerText = "LOW";
        heroThreat.style.color = "var(--safe)";
        heroIcon.innerHTML = '<i class="ri-shield-check-fill"></i>';
        heroIcon.className = "hero-icon";
    } else if (riskPercentage < 60) {
        meterStatus.innerText = "Status: Moderate Risk";
        meterStatus.style.background = "var(--suspicious-glow)";
        meterStatus.style.color = "var(--suspicious)";

        heroTitle.innerText = "SYSTEM CAUTION";
        heroThreat.innerText = "MODERATE";
        heroThreat.style.color = "var(--suspicious)";
        heroIcon.innerHTML = '<i class="ri-error-warning-fill"></i>';
        heroIcon.className = "hero-icon";
    } else {
        meterStatus.innerText = "Status: Critical Risk";
        meterStatus.style.background = "var(--danger-glow)";
        meterStatus.style.color = "var(--danger)";

        heroTitle.innerText = "SYSTEM AT RISK";
        heroThreat.innerText = "HIGH";
        heroThreat.style.color = "var(--danger)";
        heroIcon.innerHTML = '<i class="ri-skull-2-fill"></i>';
        heroIcon.className = "hero-icon danger";
    }

    const now = new Date();
    document.getElementById('hero-last-scan').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateTimeline(logs) {
    const timelineBody = document.getElementById('timeline-body');
    timelineBody.innerHTML = "";

    if (logs.length === 0) {
        timelineBody.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">No timeline events.</div>`;
        return;
    }

    // Take top 8 most recent logs
    const recentLogs = logs.slice(0, 8);

    recentLogs.forEach(log => {
        const date = new Date(log.visited_at);
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let iconClass = "safe";
        let iconHtml = '<i class="ri-check-line"></i>';
        let actionText = "Safe site visited";

        if (log.status === "Suspicious") {
            iconClass = "suspicious";
            iconHtml = '<i class="ri-error-warning-line"></i>';
            actionText = "Suspicious domain detected";
        } else if (log.status === "Phishing") {
            iconClass = "danger";
            iconHtml = '<i class="ri-skull-2-line"></i>';
            actionText = "Phishing attempt blocked";
        }

        const domain = parseDomain(log.url);

        timelineBody.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-icon ${iconClass}">
                    ${iconHtml}
                </div>
                <div class="timeline-content">
                    <div class="timeline-time">${time}</div>
                    <div class="timeline-text">
                        <strong>${actionText}</strong><br>
                        <span style="font-size: 11px; color: var(--text-muted)">${domain}</span>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderTable(logs, tbody) {
    tbody.innerHTML = "";

    if (logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px;">
                    No browsing activity recorded yet.<br>
                    Start browsing with the AI CyberShield extension enabled.
                </td>
            </tr>
        `;
        return;
    }

    logs.forEach(log => {
        const date = new Date(log.visited_at);
        const formattedDate = new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(date);

        const domain = parseDomain(log.url);

        let statusBadgeClass = "badge-safe";
        if (log.status === "Suspicious") statusBadgeClass = "badge-suspicious";
        if (log.status === "Phishing") statusBadgeClass = "badge-danger";

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="url-cell">
                    <div class="domain-icon">
                        <img src="https://www.google.com/s2/favicons?domain=${domain}" alt="favicon" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xMiAyMmM1LjUyMyAwIDEwLTQuNDc3IDEwLTEwUzE3LjUyMyAy 12IDIgNi40NzcgMiAyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTB6Ii8+PHBhdGggZD0iTTIgMTJoMjBtLTktOXYxOG0tMi0xOGMwIDMuMzE0LTMuMTM0IDYtNyA2czctMi42ODYgNy02em00IDBjMCAzLjMxNCAzLjEzNCA2IDcgNnMtNy0yLjY4Ni03LTZ6Ii8+PC9zdmc+'">
                    </div>
                    <div>
                        <div style="font-weight: 500">${domain}</div>
                        <div style="font-size: 11px; color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${log.url}">${log.url}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge ${statusBadgeClass}">${log.status}</span>
            </td>
            <td>
                <span class="score-cell">${log.risk_score} / 100</span>
            </td>
            <td style="color: var(--text-muted); font-size: 13px;">
                ${formattedDate}
            </td>
        `;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn';
        deleteBtn.title = 'Delete Log';
        deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
        deleteBtn.onclick = () => deleteLog(log.id);

        const viewBtn = document.createElement('button');
        viewBtn.className = 'action-btn';
        viewBtn.title = 'View AI Analysis';
        viewBtn.innerHTML = '<i class="ri-eye-line"></i>';
        viewBtn.onclick = () => showModal(log, domain, formattedDate, statusBadgeClass);

        const actionsTd = document.createElement('td');
        actionsTd.appendChild(viewBtn);
        actionsTd.appendChild(deleteBtn);
        tr.appendChild(actionsTd);

        tbody.appendChild(tr);
    });

    // Re-apply search filter if the user has typed something
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput && searchInput.value) {
        searchInput.dispatchEvent(new Event('input'));
    }
}

function showModal(log, domain, time, badgeClass) {
    document.getElementById('modal-id').innerText = log.identity_id || "CS-GEN-99";
    document.getElementById('modal-domain').innerText = domain;
    document.getElementById('modal-url').innerText = log.url;
    document.getElementById('modal-time').innerText = time;

    const badge = document.getElementById('modal-status-badge');
    badge.className = `status-badge ${badgeClass}`;
    badge.innerText = log.status;

    const actionBtn = document.getElementById('modal-action-btn');
    const finalScore = document.getElementById('modal-score');
    finalScore.innerText = `${log.risk_score} / 100`;

    // Mock AI Analysis Details per Request
    const aiAge = document.getElementById('modal-ai-age');
    const aiSsl = document.getElementById('modal-ai-ssl');
    const aiKeyword = document.getElementById('modal-ai-keyword');
    const aiSim = document.getElementById('modal-ai-sim');

    if (log.status === "Phishing") {
        actionBtn.innerText = "Block Domain Permanently";
        actionBtn.style.color = "var(--danger)";
        actionBtn.style.border = "1px solid var(--danger)";
        finalScore.style.color = "var(--danger)";

        aiAge.innerText = "2 days (Suspicious)";
        aiAge.style.color = "var(--danger)";
        aiSsl.innerText = "Invalid / Self-Signed";
        aiSsl.style.color = "var(--danger)";
        aiKeyword.innerText = "High Risk";
        aiKeyword.style.color = "var(--danger)";
        aiSim.innerText = "94% (Matches Banking Site)";
        aiSim.style.color = "var(--danger)";
    } else if (log.status === "Suspicious") {
        actionBtn.innerText = "Quarantine Site";
        actionBtn.style.color = "var(--suspicious)";
        actionBtn.style.border = "1px solid var(--suspicious)";
        finalScore.style.color = "var(--suspicious)";

        aiAge.innerText = "1 month (Unverifiable)";
        aiAge.style.color = "var(--suspicious)";
        aiSsl.innerText = "Valid but untrusted CA";
        aiSsl.style.color = "var(--suspicious)";
        aiKeyword.innerText = "Moderate";
        aiKeyword.style.color = "var(--suspicious)";
        aiSim.innerText = "45% (Looks similar to Login)";
        aiSim.style.color = "var(--suspicious)";
    } else {
        actionBtn.innerText = "Launch Safe Container";
        actionBtn.style.color = "var(--text-primary)";
        actionBtn.style.border = "1px solid var(--border-color)";
        finalScore.style.color = "var(--safe)";

        aiAge.innerText = "5+ years";
        aiAge.style.color = "var(--text-primary)";
        aiSsl.innerText = "Valid / Trusted";
        aiSsl.style.color = "var(--safe)";
        aiKeyword.innerText = "Low";
        aiKeyword.style.color = "var(--safe)";
        aiSim.innerText = "0% (Unique Layout)";
        aiSim.style.color = "var(--text-primary)";
    }

    document.getElementById('details-modal').classList.add('show');
}

async function deleteLog(id) {
    if (!confirm("Are you sure you want to delete this log?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchLogs();
        }
    } catch (err) {
        console.error("Failed to delete", err);
    }
}

function parseDomain(urlStr) {
    try {
        const url = new URL(urlStr);
        return url.hostname;
    } catch {
        return urlStr.substring(0, 30);
    }
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Global Threat Map (Leaflet)
function initMap() {
    const map = L.map('threatMap', {
        zoomControl: false,
        attributionControl: false
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Mock Threat Data
    const threats = [
        { name: "India", lat: 20.5937, lng: 78.9629, count: 12, color: "var(--suspicious)" },
        { name: "USA", lat: 37.0902, lng: -95.7129, count: 8, color: "var(--safe)" },
        { name: "China", lat: 35.8617, lng: 104.1954, count: 25, color: "var(--danger)" },
        { name: "Russia", lat: 61.5240, lng: 105.3188, count: 43, color: "var(--danger)" },
        { name: "Brazil", lat: -14.2350, lng: -51.9253, count: 5, color: "var(--suspicious)" }
    ];

    threats.forEach(t => {
        const circle = L.circleMarker([t.lat, t.lng], {
            radius: Math.max(8, t.count * 0.5),
            fillColor: t.color,
            color: t.color,
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.4
        }).addTo(map);

        circle.bindPopup(`<strong style="color:var(--bg-dark)">${t.name}</strong><br><span style="color:var(--bg-dark)">${t.count} Threats Detected</span>`);
    });
}

// Activity Graph (Chart.js)
function initChart() {
    const ctx = document.getElementById('activityChart').getContext('2d');

    // Gradient for Safe
    let safeGradient = ctx.createLinearGradient(0, 0, 0, 400);
    safeGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    safeGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    // Gradient for Threat
    let threatGradient = ctx.createLinearGradient(0, 0, 0, 400);
    threatGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    threatGradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            datasets: [
                {
                    label: 'Safe Sites',
                    data: [12, 19, 35, 42, 28, 15, 8],
                    borderColor: '#10B981',
                    backgroundColor: safeGradient,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#10B981',
                },
                {
                    label: 'Threats Blocked',
                    data: [2, 0, 5, 12, 4, 8, 1],
                    borderColor: '#EF4444',
                    backgroundColor: threatGradient,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#EF4444',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#EF4444',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)', borderDash: [5, 5] },
                    ticks: { color: '#94A3B8' },
                    beginAtZero: true
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94A3B8' }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#E5E7EB',
                        font: { family: "'Outfit', sans-serif", size: 13 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#AAB8C2',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12
                }
            }
        }
    });
}
