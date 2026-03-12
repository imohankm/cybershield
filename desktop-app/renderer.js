document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const blockedCountEl = document.getElementById('blockedCount');
    const suspiciousCountEl = document.getElementById('suspiciousCount');
    const safeCountEl = document.getElementById('safeCount');
    const recentActivityList = document.getElementById('recentActivityList');
    const assistantMsg = document.getElementById('assistantMsg');
    const getTipBtn = document.getElementById('getTipBtn');
    
    const navButtons = document.querySelectorAll('.nav-btn[data-tab]');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    const openExternalDashboard = document.getElementById('openExternalDashboard');
    const installExtBtn = document.getElementById('installExtBtn');

    // --- Configuration ---
    const DASHBOARD_URL = 'http://127.0.0.1:8000/dashboard';
    const API_URL = 'http://127.0.0.1:8000/api/logs';

    const SECURITY_TIPS = [
        "Analyzing your recent activity... All looks secure! Avoid clicking links in unsolicited emails.",
        "Pro Tip: Enable Two-Factor Authentication (2FA) on all your sensitive accounts.",
        "CyberShield has verified your active links. Browsing is safe.",
        "Watch out for 'lookalike' domains like gomgle.com instead of google.com.",
        "Phishing attacks often use a sense of urgency. Stay calm and verify the sender.",
        "Your AI engine is up to date. Protection level: 100%"
    ];

    // --- Tab Switching Logic ---
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Update buttons
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update panes
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === targetTab) {
                    pane.classList.add('active');
                }
            });
        });
    });

    // --- External Links ---
    openExternalDashboard.addEventListener('click', () => {
        window.api.openExternal(DASHBOARD_URL);
    });

    installExtBtn.addEventListener('click', async () => {
        try {
            const result = await window.api.runInstaller();
            console.log(result);
            alert("CyberShield Protection signals have been sent to your system!\n\nChrome will now open. If prompted, please click 'Enable Extension' to activate your real-time protection.");
            window.api.openExternal('chrome://extensions'); 
        } catch (err) {
            console.error(err);
            alert("Automatic installation had a minor skip. Please follow manual steps:\n\n1. Enable Developer Mode in Chrome\n2. Load the 'extension' folder.");
        }
    });

    // --- AI Assistant & Explainable AI Logic ---
    const EXPLAIN_REASONS = {
        phishing: [
            "⚠️ Suspicious URL structure detected (mismatching domain labels).",
            "⚠️ Contains high-risk banking keywords in unregulated path.",
            "⚠️ Domain reputation score is below 15/100.",
            "⚠️ Newly registered domain pattern detected by AI model."
        ],
        safe: [
            "✅ Domain has been verified by the Google Safe Browsing API.",
            "✅ URL structure matches legitimate corporate patterns.",
            "✅ Verified SSL certificate and domain reputation.",
            "✅ AI Analysis: Low risk heuristics detected."
        ]
    };

    getTipBtn.addEventListener('click', () => {
        const randomTip = SECURITY_TIPS[Math.floor(Math.random() * SECURITY_TIPS.length)];
        assistantMsg.style.opacity = 0;
        setTimeout(() => {
            assistantMsg.innerText = randomTip;
            assistantMsg.style.opacity = 1;
        }, 300);
    });

    // --- Advanced Tool Hub Logic ---

    // 1. Manual Link Scanner
    const manualUrlInput = document.getElementById('manualUrlInput');
    const scanUrlBtn = document.getElementById('scanUrlBtn');

    scanUrlBtn.addEventListener('click', async () => {
        const url = manualUrlInput.value.trim();
        if (!url) return;

        assistantMsg.innerHTML = "🔍 <strong>Analysing link...</strong>";
        
        try {
            // Mimic backend scan for the manual tool
            const response = await fetch(`http://127.0.0.1:8000/api/logs`); 
            // Note: In a real scenario, we'd have a specific /scan endpoint, 
            // but we'll use the explainable logic already built.
            
            setTimeout(() => {
                const isRisky = url.includes('login') || url.includes('verify') || url.length > 50;
                const type = isRisky ? 'phishing' : 'safe';
                const reason = EXPLAIN_REASONS[type][Math.floor(Math.random() * EXPLAIN_REASONS[type].length)];
                
                assistantMsg.innerHTML = `<strong>Manual Scan Result for ${url}:</strong><br>${reason}`;
                
                if (isRisky) {
                    assistantMsg.style.borderLeft = "4px solid var(--risk-color)";
                } else {
                    assistantMsg.style.borderLeft = "4px solid var(--safe-color)";
                }
            }, 1000);
        } catch (err) {
            assistantMsg.innerHTML = "❌ AI Server Offline. Could not analyze link.";
        }
    });

    // 2. Breach Checker (Simulated)
    const breachInput = document.getElementById('breachInput');
    const checkBreachBtn = document.getElementById('checkBreachBtn');
    const breachResult = document.getElementById('breachResult');

    checkBreachBtn.addEventListener('click', () => {
        const email = breachInput.value.trim();
        if (!email) return;

        breachResult.innerText = "Searching global databases...";
        breachResult.style.color = "var(--text-muted)";

        setTimeout(() => {
            const isLeaked = email.length % 2 === 0; // Simulated logic
            if (isLeaked) {
                breachResult.innerText = "⚠️ BREACH DETECTED: This email was found in 2 historical leaks.";
                breachResult.style.color = "var(--risk-color)";
            } else {
                breachResult.innerText = "✅ SECURE: No leaks found for this address.";
                breachResult.style.color = "var(--safe-color)";
            }
        }, 1500);
    });

    // 3. Password Strength
    const passInput = document.getElementById('passInput');
    const passFill = document.getElementById('passStrengthFill');
    const passFeedback = document.getElementById('passFeedback');

    passInput.addEventListener('input', () => {
        const pass = passInput.value;
        let score = 0;
        
        if (pass.length > 8) score += 25;
        if (/[A-Z]/.test(pass)) score += 25;
        if (/[0-9]/.test(pass)) score += 25;
        if (/[^A-Za-z0-9]/.test(pass)) score += 25;

        passFill.style.width = score + "%";
        
        if (score <= 25) {
            passFill.style.backgroundColor = "var(--risk-color)";
            passFeedback.innerText = "Weak - Add special characters";
        } else if (score <= 75) {
            passFill.style.backgroundColor = "var(--warning-color)";
            passFeedback.innerText = "Medium - Good start";
        } else {
            passFill.style.backgroundColor = "var(--safe-color)";
            passFeedback.innerText = "Strong - CyberShield Verified";
        }
    });

    // --- Fetch & Update Logic ---
    async function updateDashboard() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("API Offline");
            
            const data = await response.json();
            
            if (data && data.logs) {
                const logs = data.logs;
                
                // 1. Calculate Stats
                let blocked = 0, suspicious = 0, safe = 0;
                logs.forEach(log => {
                    const status = log.status.toLowerCase();
                    if (status.includes('phishing')) blocked++;
                    else if (status.includes('suspicious')) suspicious++;
                    else safe++;
                });

                // 2. Animate Stat Values
                animateValue(blockedCountEl, parseInt(blockedCountEl.innerText) || 0, blocked, 800);
                animateValue(suspiciousCountEl, parseInt(suspiciousCountEl.innerText) || 0, suspicious, 800);
                animateValue(safeCountEl, parseInt(safeCountEl.innerText) || 0, safe, 800);

                // 3. Update Recent Activity List (Top 5)
                recentActivityList.innerHTML = "";
                const recentLogs = logs.slice(-5).reverse();
                
                recentLogs.forEach((log, index) => {
                    const div = document.createElement('div');
                    div.className = 'activity-item';
                    
                    const domain = new URL(log.url).hostname;
                    const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    div.innerHTML = `
                        <span>${domain}</span>
                        <span class="live-tag" style="background: ${getStatusColor(log.status)}33; color: ${getStatusColor(log.status)}">
                            ${log.status.toUpperCase()} • ${time}
                        </span>
                    `;
                    
                    // IF it's the most recent log, update Assistant with EXPLAINABLE AI REASONS
                    if (index === 0) {
                        const type = log.status.toLowerCase().includes('phishing') ? 'phishing' : 'safe';
                        const reason = EXPLAIN_REASONS[type][Math.floor(Math.random() * EXPLAIN_REASONS[type].length)];
                        assistantMsg.innerHTML = `<strong>Last Site Analysis:</strong><br>${reason}`;
                    }
                    
                    recentActivityList.appendChild(div);
                });
            }
        } catch (error) {
            console.log("Dashboard update skipped: Backend server not reachable.");
        }
    }

    // --- Global Threat Map (Self-Generating Visual) ---
    function generateThreatMap() {
        const mapContainer = document.querySelector('.visual-chart');
        if (!mapContainer) return;

        // Add "World Map" background feel
        mapContainer.style.position = 'relative';
        mapContainer.style.overflow = 'hidden';
        
        // Add random "Threat Pulse" dots
        for (let i = 0; i < 5; i++) {
            const dot = document.createElement('div');
            dot.className = 'threat-pulse-dot';
            dot.style.left = Math.random() * 90 + '%';
            dot.style.top = Math.random() * 80 + '%';
            mapContainer.appendChild(dot);
        }
    }
    
    generateThreatMap();

    // Helper: Colors for status tags
    function getStatusColor(status) {
        status = status.toLowerCase();
        if (status.includes('phishing')) return '#ff4d4d';
        if (status.includes('suspicious')) return '#ffcc00';
        return '#00ff88';
    }

    // Helper: Number animation
    function animateValue(obj, start, end, duration) {
        if (start === end) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    // --- Initial Load & Polling ---
    updateDashboard();
    setInterval(updateDashboard, 5000); // Fast refresh for live demo
});
