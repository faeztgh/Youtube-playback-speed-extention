import { applyActionBadge } from "../shared/badge";

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

// Firefox lacks storage.session; fall back to storage.local.
const hasSessionStorage: boolean = !!(chrome.storage as any).session;
const ephemeralPrefix = "tab:";

function getEphemeralArea(): chrome.storage.StorageArea {
    return (
        hasSessionStorage
            ? (chrome.storage as any).session
            : chrome.storage.local
    ) as chrome.storage.StorageArea;
}

function setEphemeral<T>(key: string, value: T, cb?: () => void) {
    getEphemeralArea().set({ [key]: value }, () => cb?.());
}

function getEphemeral<T>(key: string, cb: (value: T | undefined) => void) {
    getEphemeralArea().get(key, (items) =>
        cb(items[key as keyof typeof items] as T | undefined),
    );
}

function clearLocalEphemeralKeysIfNeeded() {
    if (hasSessionStorage) return;
    try {
        chrome.storage.local.get(null, (items) => {
            const keys = Object.keys(items).filter((k) =>
                k.startsWith(ephemeralPrefix),
            );
            if (keys.length) chrome.storage.local.remove(keys);
        });
    } catch {}
}

async function requestRateFromTab(tabId: number) {
    try {
        await chrome.tabs.sendMessage(tabId, { type: "GET_PLAYBACK_RATE" });
    } catch {}
}

async function updateActionForTab(tabId: number, url?: string | null) {
    const supported = isSupportedUrl(url);
    try {
        // Keep the action enabled everywhere so the popup opens on any page.
        await chrome.action.enable(tabId);
        if (supported) {
            await requestRateFromTab(tabId);
        } else {
            await chrome.action.setBadgeText({ tabId, text: "" });
        }
    } catch {}
}

function refreshAllTabsOnLifecycle() {
    clearLocalEphemeralKeysIfNeeded();
    chrome.tabs.query({}, (tabs) => {
        for (const t of tabs) {
            if (typeof t.id === "number") {
                void updateActionForTab(t.id, t.url ?? null);
            }
        }
    });
}

chrome.runtime.onInstalled.addListener(refreshAllTabsOnLifecycle);

chrome.runtime.onStartup?.addListener(refreshAllTabsOnLifecycle);

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
            (changeInfo.url as string | undefined) ?? tab.url ?? null,
        );
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "CURRENT_PLAYBACK_RATE") {
        const tabId = sender?.tab?.id;
        if (typeof tabId === "number") {
            void applyActionBadge(
                chrome.action,
                tabId,
                message.rate as number,
            ).catch(() => {});
        }
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
    } else if (message?.type === "FETCH_DISLIKES") {
        fetchDislikes(message.videoId as string).then(
            (data) => sendResponse(data),
            () => sendResponse(null),
        );
        return true;
    }
});

type DislikeCacheEntry = { data: unknown; fetchedAt: number };
const dislikeCache = new Map<string, DislikeCacheEntry>();
const DISLIKE_TTL_MS = 5 * 60 * 1000;
const DISLIKE_CACHE_MAX = 200; // bound memory on long-lived (Firefox) sessions

async function fetchDislikes(videoId: string): Promise<unknown | null> {
    if (!videoId) return null;
    const cached = dislikeCache.get(videoId);
    if (cached && Date.now() - cached.fetchedAt < DISLIKE_TTL_MS) {
        return cached.data;
    }
    try {
        const res = await fetch(
            `https://returnyoutubedislikeapi.com/votes?videoId=${encodeURIComponent(
                videoId,
            )}`,
        );
        if (!res.ok) return null;
        const json = (await res.json()) as { dislikes?: unknown };
        if (!json || typeof json.dislikes !== "number") return null;
        // Re-insert last so the over-cap eviction drops the oldest entry.
        dislikeCache.delete(videoId);
        dislikeCache.set(videoId, { data: json, fetchedAt: Date.now() });
        if (dislikeCache.size > DISLIKE_CACHE_MAX) {
            const oldest = dislikeCache.keys().next().value;
            if (oldest !== undefined) dislikeCache.delete(oldest);
        }
        return json;
    } catch {
        return null;
    }
}
