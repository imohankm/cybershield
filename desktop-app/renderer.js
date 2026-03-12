document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const blockedCountEl = document.getElementById('blockedCount');
    const suspiciousCountEl = document.getElementById('suspiciousCount');
    const safeCountEl = document.getElementById('safeCount');
    
    const openDashboardBtn = document.getElementById('openDashboardBtn');
    const installExtBtn = document.getElementById('installExtBtn');
    const cardInstallExt = document.getElementById('cardInstallExt');
    const cardDashboard = document.getElementById('cardDashboard');

    // URLs
    const DASHBOARD_URL = 'http://127.0.0.1:8000/dashboard';
    const EXTENSION_INSTALL_URL = 'chrome://extensions'; // Fallback / Instructions page
    const API_URL = 'http://127.0.0.1:8000/api/logs';

    // Event Listeners for External Links
    openDashboardBtn.addEventListener('click', () => {
        window.api.openExternal(DASHBOARD_URL);
    });

    cardDashboard.addEventListener('click', () => {
        window.api.openExternal(DASHBOARD_URL);
    });

    // Opening Chrome extensions page or Web Store
    const openInstallInstructions = () => {
        // In a real app, this might open a local HTML file with instructions on how to load unpacked
        // Or link to the Chrome Web store if published
        alert("To install the extension:\n\n1. Open Chrome and go to chrome://extensions\n2. Enable 'Developer mode' (top right)\n3. Click 'Load unpacked'\n4. Select the 'extension' folder inside the CyberShield directory.\n\nWe will now open the Chrome Extensions page for you.");
        window.api.openExternal('https://chrome.google.com/webstore/category/extensions'); // or a custom guide page
    };

    installExtBtn.addEventListener('click', openInstallInstructions);
    cardInstallExt.addEventListener('click', openInstallInstructions);

    // Fetch live data from Local API
    async function fetchStats() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("API not running");
            
            const data = await response.json();
            
            if (data && data.logs) {
                let blocked = 0;
                let suspicious = 0;
                let safe = 0;

                data.logs.forEach(log => {
                    // Assuming status mapping: 'phishing' -> risk, 'suspicious' -> warning, 'legitimate' -> safe
                    const status = log.status.toLowerCase();
                    if (status.includes('phishing') || status.includes('unsafe')) {
                        blocked++;
                    } else if (status.includes('suspicious')) {
                        suspicious++;
                    } else {
                        safe++;
                    }
                });

                // Update UI with animation 
                animateValue(blockedCountEl, parseInt(blockedCountEl.innerText), blocked, 1000);
                animateValue(suspiciousCountEl, parseInt(suspiciousCountEl.innerText), suspicious, 1000);
                animateValue(safeCountEl, parseInt(safeCountEl.innerText), safe, 1000);
            }

        } catch (error) {
            console.log("Could not fetch remote stats, using mock/cached data.", error);
            // In a real scenario, you could read directly from SQLite via IPC if the web server is offline
        }
    }

    // Polling or initial fetch
    fetchStats();
    // Refresh stats every 10 seconds
    setInterval(fetchStats, 10000);

    // Number animation helper function
    function animateValue(obj, start, end, duration) {
        if (start === end) return;
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
});
