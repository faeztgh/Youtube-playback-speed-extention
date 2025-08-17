function isSupportedUrl(url?: string | null): boolean {
    if (!url) return false;
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        return host === "youtu.be" || host.endsWith("youtube.com");
    } catch {
        return false;
    }
}

function formatBadgeText(rate: number): string {
    const sign = rate < 0 ? "-" : "";
    const abs = Math.abs(rate);
    const to2 = Math.round(abs * 100) / 100;
    let str = String(to2);
    if (str.includes(".")) {
        str = str.replace(/\.0+$/, "").replace(/(\.[0-9])0$/, "$1");
    }
    let withX = `${sign}${str}x`;
    if (withX.length <= 4) return withX;
    const to1 = Math.round(abs * 10) / 10;
    let str1 = String(to1).replace(/\.0$/, "");
    withX = `${sign}${str1}x`;
    if (withX.length <= 4) return withX;
    return `${sign}${Math.round(abs)}`;
}

async function requestRateFromTab(tabId: number) {
    try {
        await chrome.tabs.sendMessage(tabId, { type: "GET_PLAYBACK_RATE" });
    } catch {
        // ignore (content script may not be injected yet)
    }
}

async function updateActionForTab(tabId: number, url?: string | null) {
    const supported = isSupportedUrl(url);
    try {
        // Always enable the action so the popup can be opened anywhere
        await chrome.action.enable(tabId);
        if (supported) {
            await requestRateFromTab(tabId);
        } else {
            // Clear badge on unsupported pages
            await chrome.action.setBadgeText({ tabId, text: "" });
        }
    } catch {
        // ignore
    }
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({}, (tabs) => {
        for (const t of tabs) {
            if (typeof t.id === "number") {
                void updateActionForTab(t.id, t.url ?? null);
            }
        }
    });
});

chrome.runtime.onStartup?.addListener(() => {
    chrome.tabs.query({}, (tabs) => {
        for (const t of tabs) {
            if (typeof t.id === "number") {
                void updateActionForTab(t.id, t.url ?? null);
            }
        }
    });
});

chrome.tabs.onCreated.addListener((tab) => {
    if (typeof tab.id === "number") {
        void updateActionForTab(tab.id, tab.url ?? null);
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        void updateActionForTab(activeInfo.tabId, tab?.url ?? null);
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === "complete") {
        void updateActionForTab(
            tabId,
            (changeInfo.url as string | undefined) ?? tab.url ?? null
        );
    }
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message?.type === "CURRENT_PLAYBACK_RATE") {
        const tabId = sender?.tab?.id;
        if (typeof tabId === "number") {
            const text = formatBadgeText(message.rate as number);
            try {
                void chrome.action.setBadgeBackgroundColor({
                    tabId,
                    color: "#111827",
                });
                // Set text color to white for contrast (Chrome 116+). Ignore if unsupported.
                if ((chrome.action as any).setBadgeTextColor) {
                    void (chrome.action as any).setBadgeTextColor({
                        tabId,
                        color: "#FFFFFF",
                    });
                }
                void chrome.action.setBadgeText({ tabId, text });
            } catch {
                // ignore
            }
        }
    }
});

