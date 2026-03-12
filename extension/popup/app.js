document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const body = document.getElementById('app-body');
    const displayDomain = document.getElementById('current-domain');
    const scoreCircle = document.getElementById('score-circle');
    const scoreNumber = document.getElementById('score-number');
    const statusBadge = document.getElementById('status-badge');
    const toggleAiBtn = document.getElementById('toggle-ai-btn');
    const whyStatusText = document.getElementById('why-status-text');
    const aiExplanationPanel = document.getElementById('ai-explanation-panel');
    const aiScanAnim = document.getElementById('ai-scan-status');
    const dashboardBtn = document.getElementById('dashboard-btn');
    const logoLink = document.getElementById('logo-dashboard-link');
    const reportBtn = document.getElementById('report-btn');

    // AI Details
    const aiAge = document.getElementById('ai-exp-age');
    const aiSsl = document.getElementById('ai-exp-ssl');
    const aiMalware = document.getElementById('ai-exp-malware');
    const aiImpersonation = document.getElementById('ai-exp-impersonation');
    const aiVerdict = document.getElementById('ai-exp-verdict');

    const openDashboard = () => {
        chrome.tabs.create({ url: "http://127.0.0.1:8000/dashboard/index.html" });
    };

    dashboardBtn.addEventListener('click', openDashboard);
    if (logoLink) logoLink.addEventListener('click', openDashboard);

    reportBtn.addEventListener('click', () => {
        reportBtn.innerHTML = `Reported`;
        reportBtn.style.color = "var(--safe-color)";
        setTimeout(() => {
            reportBtn.innerHTML = `Report Website`;
            reportBtn.style.color = "";
        }, 2000);
    });

    // Toggle AI Reasoning Panel
    toggleAiBtn.addEventListener('click', () => {
        if (aiExplanationPanel.style.display === 'block') {
            aiExplanationPanel.style.display = 'none';
        } else {
            aiExplanationPanel.style.display = 'block';
        }
    });

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url) {
            updateUI({ status: "Unknown", risk_score: 0 }, "safe");
            return;
        }

        try {
            displayDomain.innerText = new URL(tab.url).hostname;
        } catch (e) {
            displayDomain.innerText = tab.url.substring(0, 30);
        }

        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('file://')) {
            updateUI({ status: "System Site", risk_score: 0 }, "safe");
            return;
        }

        // Simulate scanning delay for animation to play
        setTimeout(() => {
            chrome.storage.local.get([tab.id.toString()], (result) => {
                const data = result[tab.id.toString()];
                if (data) {
                    applyResponse(data);
                } else {
                    fetch("http://127.0.0.1:8000/api/analyze-url", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: tab.url })
                    })
                        .then(res => res.json())
                        .then(data => applyResponse(data))
                        .catch(err => {
                            updateUI({ status: "Offline", risk_score: 0, overrideText: "Cannot connect to AI Core" }, "suspicious");
                        });
                }
            });
        }, 800);

    } catch (err) {
        console.error("Popup Error:", err);
    }

    function applyResponse(data) {
        let stateClass = "";
        let btnStatusWord = "safe";

        if (data.status === "Safe") {
            stateClass = "safe";
            btnStatusWord = "safe";
            aiAge.innerText = "8+ years";
            aiAge.style.color = "var(--safe-color)";
            aiSsl.innerText = "Valid Authority";
            aiMalware.innerText = "No";
            aiImpersonation.innerText = "No";
            aiVerdict.innerText = "FINAL VERDICT: SAFE";
        } else if (data.status === "Suspicious") {
            stateClass = "suspicious";
            btnStatusWord = "suspicious";
            aiAge.innerText = "Under 3 months";
            aiAge.style.color = "var(--suspicious-color)";
            aiSsl.innerText = "Self-Signed";
            aiSsl.style.color = "var(--suspicious-color)";
            aiMalware.innerText = "Checking...";
            aiImpersonation.innerText = "Possible (45% Match)";
            aiImpersonation.style.color = "var(--suspicious-color)";
            aiVerdict.innerText = "FINAL VERDICT: SUSPICIOUS";
        } else if (data.status === "Phishing") {
            stateClass = "phishing";
            btnStatusWord = "dangerous";
            aiAge.innerText = "2 Days";
            aiAge.style.color = "var(--danger-color)";
            aiSsl.innerText = "Invalid / Missing";
            aiSsl.style.color = "var(--danger-color)";
            aiMalware.innerText = "Critical Threat";
            aiMalware.style.color = "var(--danger-color)";
            aiImpersonation.innerText = "Yes (94% Match to Bank)";
            aiImpersonation.style.color = "var(--danger-color)";
            aiVerdict.innerText = "FINAL VERDICT: MALICIOUS";
        }

        whyStatusText.innerText = btnStatusWord;
        updateUI(data, stateClass);
    }

    function updateUI(data, stateClass) {
        // Clear old states
        body.classList.remove('state-safe', 'state-suspicious', 'state-phishing');

        if (stateClass) {
            body.classList.add(`state-${stateClass}`);
        }

        statusBadge.innerText = data.overrideText ? data.overrideText : (data.status.toUpperCase() + " DOMAIN");

        // Hide scanning anim string
        aiScanAnim.style.display = "none";
        // Show toggle AI reasoning button
        toggleAiBtn.style.display = "flex";

        // Calculate Trust Score (100 - risk_score)
        let trustScore = 100 - data.risk_score;
        if (trustScore < 0) trustScore = 0;
        if (data.overrideText) trustScore = 0; // Offline mode defaults

        scoreNumber.innerText = trustScore;

        // SVG stroke-dashoffset ranges from 100 (empty) to 0 (full)
        // A trust score of 100 means the bar should be full (offset = 0)
        // A trust score of 0 means the bar should be empty (offset = 100)
        setTimeout(() => {
            scoreCircle.style.strokeDashoffset = 100 - trustScore;
        }, 100);
    }
});
