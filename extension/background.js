const API_URL = "http://127.0.0.1:8000/api/analyze-url";
let lastCheckedUrl = "";
let allowedUrls = new Set();

// Intercept navigation before it happens
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Only handle main frame navigation
    if (details.frameId !== 0) return;

    const url = details.url;

    // Skip internal and local pages
    const isInternal = url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('file://');
    const isLocalHost = url.includes('127.0.0.1') || url.includes('localhost');
    if (isInternal || isLocalHost) return;

    // Skip if we just checked this URL or it's explicitly allowed
    if (url === lastCheckedUrl || allowedUrls.has(url)) return;
    lastCheckedUrl = url;

    console.time(`Analysis-${url}`);
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: url })
        });

        if (response.ok) {
            const data = await response.json();
            console.timeEnd(`Analysis-${url}`);
            
            // Store results for the tab
            chrome.storage.local.set({ [details.tabId]: data });

            // If phishing or highly suspicious, redirect to warning page
            if (data.status === "phishing" || data.status === "suspicious" || data.risk_score > 70) {
                const warningUrl = chrome.runtime.getURL(`warning.html?url=${encodeURIComponent(url)}&status=${encodeURIComponent(data.status)}`);
                chrome.tabs.update(details.tabId, { url: warningUrl });
            } else {
                // For safe sites, wait for content script to be ready
                notifyContentScript(details.tabId, data);
            }
        }
    } catch (error) {
        console.error("AI CyberShield Backend Error:", error);
    }
});

// Helper to ensure content script receives the message even if it loads late
async function notifyContentScript(tabId, data) {
    let attempts = 0;
    const maxAttempts = 10;
    
    const trySend = () => {
        chrome.tabs.sendMessage(tabId, { type: "PAGE_STATUS", data: data }).then(() => {
            console.log("Status delivered to content script");
        }).catch(err => {
            if (attempts < maxAttempts) {
                attempts++;
                setTimeout(trySend, 200); // Retry every 200ms
            }
        });
    };
    
    trySend();
}

// Handle messages from warning page or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_TAB_ID") {
        sendResponse({ tabId: sender.tab.id });
        return true;
    }

    if (request.type === "ALLOW_URL_ONCE") {
        allowedUrls.add(request.url);
        sendResponse({ status: "ok" });
        return true;
    }

    if (request.type === "PLAY_AUDIO") {
        setupOffscreenDocument('audio.html').then(() => {
            chrome.runtime.sendMessage({
                type: 'PLAY_OFFSCREEN_AUDIO',
                sound: request.sound
            });
        });
    }
});

let creating;
async function setupOffscreenDocument(path) {
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) return;

    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: ['AUDIO_PLAYBACK'],
            justification: 'To play warning siren sounds'
        });
        await creating;
        creating = null;
    }
}

chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.local.remove([tabId.toString()]);
});

// Sidebar toggle
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PANEL" }).catch(err => {
        console.log("Content script not ready", err);
    });
});
