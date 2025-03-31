// background.js
const CHESS_URL = "https://www.chess.com";
const REDIRECT_URL = "https://mail.google.com/mail/u/0/";
const TIME_LIMIT = 30 * 60 * 1000; // 30 minutes in milliseconds

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ startTime: null, usedTime: 0, lastDate: null });
    updateBadge();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url || !tab.url.startsWith(CHESS_URL)) return;

    chrome.storage.local.get(["startTime", "usedTime", "lastDate"], (data) => {
        const now = new Date();
        const today = now.toDateString();

        if (data.lastDate !== today) {
            // Reset time for a new day
            chrome.storage.local.set({ startTime: now.getTime(), usedTime: 0, lastDate: today });
        } else {
            const elapsed = data.startTime ? now.getTime() - data.startTime : 0;
            const totalUsed = data.usedTime + elapsed;
            if (totalUsed >= TIME_LIMIT) {
                chrome.storage.local.set({ startTime: null, usedTime: TIME_LIMIT });
                chrome.tabs.update(tabId, { url: REDIRECT_URL });
            } else {
                chrome.storage.local.set({ startTime: now.getTime() });
            }
        }
        updateBadge();
    });
});

// Function to update badge text
function updateBadge() {
    chrome.storage.local.get(["startTime", "usedTime", "lastDate"], (data) => {
        const now = new Date();
        const today = now.toDateString();
        let timeLeft = TIME_LIMIT / 60000; // Convert milliseconds to minutes

        if (data.lastDate === today) {
            const elapsed = data.startTime ? now.getTime() - data.startTime : 0;
            const totalUsed = data.usedTime + elapsed;
            timeLeft = Math.max(0, (TIME_LIMIT - totalUsed) / 60000); // Convert to minutes
        }

        if (chrome.action && chrome.action.setBadgeText) {
            chrome.action.setBadgeText({ text: `${Math.ceil(timeLeft)}` });
            chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
        }
    });
}

// Update badge every minute
setInterval(updateBadge, 60000);
