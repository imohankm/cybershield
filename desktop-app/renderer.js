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

    installExtBtn.addEventListener('click', () => {
        alert("To install the extension:\n\n1. Open Chrome and go to chrome://extensions\n2. Enable 'Developer mode' (top right)\n3. Click 'Load unpacked'\n4. Select the 'extension' folder inside the CyberShield directory.\n\nWe will now open the Extensions help page.");
        window.api.openExternal('chrome://extensions'); 
    });

    // --- AI Assistant Logic ---
    getTipBtn.addEventListener('click', () => {
        const randomTip = SECURITY_TIPS[Math.floor(Math.random() * SECURITY_TIPS.length)];
        assistantMsg.style.opacity = 0;
        setTimeout(() => {
            assistantMsg.innerText = randomTip;
            assistantMsg.style.opacity = 1;
        }, 300);
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
                logs.slice(-5).reverse().forEach(log => {
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
                    recentActivityList.appendChild(div);
                });
            }
        } catch (error) {
            console.log("Dashboard update skipped: Backend server not reachable.");
        }
    }

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
