document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const blockedUrl = urlParams.get('url');
    const status = urlParams.get('status');

    if (blockedUrl) {
        document.getElementById('blocked-url').textContent = blockedUrl;
    }

    if (status) {
        const statusText = document.getElementById('status-text');
        statusText.textContent = status.toUpperCase() + " DETECTED";
        
        if (status.toLowerCase().includes('suspicious')) {
            statusText.style.background = '#f59e0b'; // Amber
            document.querySelector('.shield-icon').style.filter = 'drop-shadow(0 0 15px #f59e0b)';
        }
    }

    document.getElementById('go-back').addEventListener('click', () => {
        window.history.back();
        // Fallback if no history
        setTimeout(() => {
            window.close();
        }, 500);
    });

    document.getElementById('proceed').addEventListener('click', () => {
        if (blockedUrl) {
            // Inform background script that we are allowing this URL once
            chrome.runtime.sendMessage({ 
                type: "ALLOW_URL_ONCE", 
                url: blockedUrl 
            }, () => {
                window.location.href = blockedUrl;
            });
        }
    });
});
