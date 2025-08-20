import { formatBadgeText } from "../shared/badge";

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

// Fallback for Firefox: emulate storage.session with storage.local
const hasSessionStorage: boolean = !!(chrome.storage as any).session;
const ephemeralPrefix = "tab:"; // our keys already use this prefix

function setEphemeral<T>(key: string, value: T, cb?: () => void) {
    const area: chrome.storage.StorageArea = (
        hasSessionStorage
            ? (chrome.storage as any).session
            : chrome.storage.local
    ) as chrome.storage.StorageArea;
    area.set({ [key]: value }, () => cb && cb());
}

function getEphemeral<T>(key: string, cb: (value: T | undefined) => void) {
    const area: chrome.storage.StorageArea = (
        hasSessionStorage
            ? (chrome.storage as any).session
            : chrome.storage.local
    ) as chrome.storage.StorageArea;
    area.get(key, (items) =>
        cb(items[key as keyof typeof items] as T | undefined)
    );
}

function clearLocalEphemeralKeysIfNeeded() {
    if (hasSessionStorage) return; // nothing to clear when session storage exists
    try {
        chrome.storage.local.get(null, (items) => {
            const keys = Object.keys(items).filter((k) =>
                k.startsWith(ephemeralPrefix)
            );
            if (keys.length) chrome.storage.local.remove(keys);
        });
    } catch {
        // ignore
    }
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
    clearLocalEphemeralKeysIfNeeded();
    chrome.tabs.query({}, (tabs) => {
        for (const t of tabs) {
            if (typeof t.id === "number") {
                void updateActionForTab(t.id, t.url ?? null);
            }
        }
    });
});

chrome.runtime.onStartup?.addListener(() => {
    clearLocalEphemeralKeysIfNeeded();
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    } else if (message?.type === "GET_TAB_ID") {
        const tabId = sender?.tab?.id ?? null;
        sendResponse({ tabId });
    } else if (message?.type === "SAVE_TAB_VIDEO_RATE") {
        const tabId = sender?.tab?.id;
        if (typeof tabId === "number") {
            const key = `tab:${tabId}:video:${message.videoId}:rate`;
            setEphemeral(key, message.rate, () => {
                sendResponse({ ok: true });
            });
            return true;
        }
        sendResponse({ ok: false });
    } else if (message?.type === "FETCH_TAB_VIDEO_RATE") {
        const tabId = sender?.tab?.id;
        if (typeof tabId === "number") {
            const key = `tab:${tabId}:video:${message.videoId}:rate`;
            getEphemeral<number>(key, (value) => {
                sendResponse({ rate: value });
            });
            return true;
        }
        sendResponse({ rate: undefined });
    }
});

