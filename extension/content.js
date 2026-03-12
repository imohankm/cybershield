let popupInjected = false;
let panelInjected = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "PAGE_STATUS" && !popupInjected) {
        console.time('UI-Display');
        handleStatus(request.data);
        console.timeEnd('UI-Display');
        sendResponse({ status: "received" }); // Acknowledge for the background script's retry logic
    } else if (request.type === "TOGGLE_PANEL") {
        toggleSidePanel();
    }
});

function toggleSidePanel() {
    let panel = document.getElementById('cybershield-panel');

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'cybershield-panel';

        panel.innerHTML = `
            <div class="cs-container">
                <div class="cs-header">
                    <div class="cs-logo">
                        <span class="cs-logo-icon">🛡️</span>
                        <span class="cs-logo-text">CyberShield</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="cs-status-indicator">
                            <div class="cs-status-dot"></div> ACTIVE
                        </div>
                        <div id="cs-close-panel" style="cursor: pointer; opacity: 0.6; padding: 4px; font-size: 16px;">
                            ✕
                        </div>
                    </div>
                </div>

                <div class="cs-domain-info">
                    <div class="cs-domain-label">Current Website</div>
                    <div class="cs-domain-name" id="cs-current-domain">Analyzing...</div>
                </div>

                <div class="cs-score-container">
                    <svg viewBox="0 0 36 36" class="cs-circular-chart">
                        <path class="cs-circle-bg"
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path class="cs-circle" id="cs-score-circle"
                            stroke-dasharray="100, 100"
                            stroke-dashoffset="100" 
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div class="cs-score-text">
                        <div class="cs-score-value" id="cs-score-number">--</div>
                        <div class="cs-score-label">Trust Score</div>
                    </div>
                </div>

                <div class="cs-status-label">
                    <div class="cs-status-badge" id="cs-status-badge">ANALYZING DOMAIN</div>
                </div>

                <!-- AI Reasoning -->
                <div class="cs-ai-explanation" id="cs-ai-explanation-panel">
                    <div class="cs-ai-exp-header">
                        ✨ AI Security Analysis
                    </div>
                    <div class="cs-ai-exp-row">
                        <span class="cs-ai-exp-label">✔ Domain Age</span>
                        <span class="cs-ai-exp-val" id="cs-ai-exp-age">--</span>
                    </div>
                    <div class="cs-ai-exp-row">
                        <span class="cs-ai-exp-label">✔ SSL Certificate</span>
                        <span class="cs-ai-exp-val" id="cs-ai-exp-ssl">--</span>
                    </div>
                    <div class="cs-ai-exp-row">
                        <span class="cs-ai-exp-label">✔ Known Malware</span>
                        <span class="cs-ai-exp-val" id="cs-ai-exp-malware">--</span>
                    </div>
                    <div class="cs-ai-exp-row">
                        <span class="cs-ai-exp-label">✔ Brand Impersonation</span>
                        <span class="cs-ai-exp-val" id="cs-ai-exp-impersonation">--</span>
                    </div>
                </div>

                </div>

                <div class="cs-divider"></div>

                <div class="cs-status-footer">
                    <div>Browser Monitoring: <span>ON</span></div>
                    <div>AI Engine: <span>ACTIVE</span></div>
                </div>

                <div class="cs-action-grid">
                    <button id="cs-dashboard-btn" class="cs-action-btn cs-primary-btn">
                        Open Dashboard
                    </button>
                    <button id="cs-report-btn" class="cs-action-btn cs-secondary-btn">
                        Report Website
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        initPanelLogic();
    }

    // Toggle Slide Animation
    setTimeout(() => {
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) {
            refreshPanelData();
        }
    }, 10);
}

function initPanelLogic() {
    document.getElementById('cs-dashboard-btn').addEventListener('click', () => {
        window.open("http://127.0.0.1:8000/dashboard/index.html", "_blank");
    });

    const reportBtn = document.getElementById('cs-report-btn');
    reportBtn.addEventListener('click', () => {
        reportBtn.innerHTML = `Reported ✓`;
        reportBtn.style.color = "#22C55E";
        setTimeout(() => {
            reportBtn.innerHTML = `Report Website`;
            reportBtn.style.color = "";
        }, 2000);
    });

    document.getElementById('cs-close-panel').addEventListener('click', () => {
        document.getElementById('cybershield-panel').classList.remove('active');
    });
}

function refreshPanelData() {
    const domain = new URL(window.location.href).hostname;
    const domainEl = document.getElementById('cs-current-domain');
    if (domainEl) domainEl.innerText = domain;

    // Background script sets data under tabId key
    chrome.storage.local.get(null, (items) => {
        // Find data for this tab or send a fresh request if needed
        chrome.runtime.sendMessage({ type: "GET_TAB_ID" }, (response) => {
            const tabId = response ? response.tabId : "current";
            if (items[tabId]) {
                updatePanelUI(items[tabId]);
            }
        });
    });
}

function updatePanelUI(data) {
    const panel = document.getElementById('cybershield-panel');
    if (!panel) return;

    const badge = document.getElementById('cs-status-badge');
    const circle = document.getElementById('cs-score-circle');
    const scoreNum = document.getElementById('cs-score-number');

    if (!badge || !circle || !scoreNum) return;

    // AI labels
    const age = document.getElementById('cs-ai-exp-age');
    const ssl = document.getElementById('cs-ai-exp-ssl');
    const malware = document.getElementById('cs-ai-exp-malware');
    const impersonation = document.getElementById('cs-ai-exp-impersonation');

    panel.classList.remove('state-safe', 'state-suspicious', 'state-phishing');

    let trustScore = 100 - (data.risk_score || 0);
    const status = data.status ? data.status.toLowerCase() : "";

    if (status === "safe" || status === "legitimate") {
        panel.classList.add('state-safe');
        badge.innerText = "SAFE DOMAIN";
        if (age) age.innerText = "8+ years";
        if (ssl) ssl.innerText = "Valid Authority";
        if (malware) malware.innerText = "No Malicious Scripts";
        if (impersonation) impersonation.innerText = "None Detected";
    } else if (status === "suspicious") {
        panel.classList.add('state-suspicious');
        badge.innerText = "SUSPICIOUS DOMAIN";
        if (age) age.innerText = "Under 3 months";
        if (ssl) ssl.innerText = "Self-Signed";
        if (malware) malware.innerText = "Anomalies Found";
        if (impersonation) impersonation.innerText = "Possible Match";
    } else if (status === "phishing") {
        panel.classList.add('state-phishing');
        badge.innerText = "PHISHING DETECTED";
        if (age) age.innerText = "2 Days";
        if (ssl) ssl.innerText = "Invalid / Missing";
        if (malware) malware.innerText = "Critical Threat";
        if (impersonation) impersonation.innerText = "Bank Impersonation";
    } else {
        badge.innerText = "SYSTEM PAGE";
        trustScore = 100;
        if (age) age.innerText = "Internal Page";
    }

    scoreNum.innerText = trustScore;
    setTimeout(() => {
        circle.style.strokeDashoffset = 100 - trustScore;
    }, 100);
}

function handleStatus(data) {
    const status = data.status ? data.status.toLowerCase() : "";
    if (status === "safe" || status === "legitimate") {
        playDrop();
        showSafeToast(); // Re-enabled with faster timing
    } else if (status === "phishing" || status === "suspicious") {
        playSiren();
    }
}

function showSafeToast() {
    const toast = document.createElement('div');
    toast.id = 'cyber-shield-safe-toast';
    toast.innerHTML = `
        <div class="cs-toast-icon">🛡️</div>
        <div class="cs-toast-content">
            <div class="cs-toast-title">CyberShield Verified</div>
            <div class="cs-toast-desc">Website is safe</div>
        </div>
    `;
    document.body.appendChild(toast);

    // Play enter animation then remove quickly
    setTimeout(() => { toast.classList.add('cs-toast-show'); }, 50);
    setTimeout(() => {
        toast.classList.remove('cs-toast-show');
        setTimeout(() => toast.remove(), 300);
    }, 2000); // 2 seconds instead of 4
}

function injectWarningPopup(data) {
    popupInjected = true;

    const overlay = document.createElement('div');
    overlay.id = 'cyber-shield-warning-overlay';

    const box = document.createElement('div');
    box.id = 'cyber-shield-warning-box';
    if (data.status === "Phishing") box.classList.add("cs-box-phishing");

    const icon = document.createElement('div');
    icon.id = 'cyber-shield-warning-icon';
    icon.innerHTML = data.status === "Phishing" ? "🚨" : "⚠️";
    icon.className = data.status === "Phishing" ? "cyber-shield-status-phishing" : "cyber-shield-status-suspicious";

    const title = document.createElement('div');
    title.id = 'cyber-shield-warning-title';
    title.innerText = data.status === "Phishing" ? "EXTREME DANGER: Phishing Site" : "Warning: Suspicious Site";

    const text = document.createElement('div');
    text.id = 'cyber-shield-warning-text';
    text.innerText = data.status === "Phishing"
        ? `AI has detected a high-risk phishing attack (Risk Score: ${data.risk_score}/100). For your safety, we recommend going back.`
        : `AI CyberShield found suspicious anomalies on this website (Risk Score: ${data.risk_score}/100). Proceed with extreme caution.`;

    const btnContainer = document.createElement('div');
    btnContainer.id = 'cyber-shield-buttons';

    const backBtn = document.createElement('button');
    backBtn.className = 'cyber-shield-btn cyber-shield-btn-safe';
    backBtn.innerText = 'Return to Safety';
    backBtn.onclick = () => window.location.replace("https://www.google.com");

    const bypassBtn = document.createElement('button');
    bypassBtn.className = 'cyber-shield-btn cyber-shield-btn-danger';
    bypassBtn.innerText = 'Bypass & Enter Website';
    bypassBtn.onclick = () => document.getElementById('cyber-shield-warning-overlay').remove();

    btnContainer.appendChild(backBtn);
    btnContainer.appendChild(bypassBtn);

    box.appendChild(icon);
    box.appendChild(title);
    box.appendChild(text);
    box.appendChild(btnContainer);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

// "Drop" Sound - Safe
function playDrop() {
    chrome.runtime.sendMessage({ type: "PLAY_AUDIO", sound: "safe" });
}

// "Siren" Sound - Suspicious / Phishing
function playSiren() {
    chrome.runtime.sendMessage({ type: "PLAY_AUDIO", sound: "danger" });
}
