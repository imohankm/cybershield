chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "PLAY_OFFSCREEN_AUDIO") {
        if (request.sound === "danger") {
            playSiren();
        } else if (request.sound === "safe") {
            playDrop();
        }
        sendResponse(true);
    }
});

function playDrop() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';

        // Classic "drop" sound: Rapidly drop pitch from very high (1500Hz) to low (300Hz)
        oscillator.frequency.setValueAtTime(1500, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.15);

        // Loud pop at start, then fade out quickly
        gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
        console.error("Audio blocked:", e);
    }
}

function playSiren() {
    // Replaced siren with drop sound per user request
    playDrop();
}
