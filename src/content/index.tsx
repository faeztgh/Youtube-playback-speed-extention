// Do NOT import Tailwind here: Vite inlines it into an injected <style> and its
// Preflight reset leaks into YouTube, breaking the logo and player controls.
import { onMessage, sendMessage } from "../shared/messaging";
import { applyRate } from "../shared/rate";
import {
    type ExtensionSettings,
    getSettings,
    onSettingsChanged,
} from "../shared/storage";
import {
    getPlaybackRate,
    getVideoIdFromUrl,
    onVideoReady,
    setPlaybackRate,
} from "../shared/youtube";
import { refreshDislikeCounts, setDislikeCountsEnabled } from "./dislikes";

function getYouTubeTitle(): string {
    const og = document.querySelector(
        'meta[property="og:title"]',
    ) as HTMLMetaElement | null;
    if (og?.content) return og.content;
    const metaTitle = document.querySelector(
        'meta[name="title"]',
    ) as HTMLMetaElement | null;
    if (metaTitle?.content) return metaTitle.content;
    const ytFormatted = document.querySelector(
        "#title h1 yt-formatted-string",
    ) as HTMLElement | null;
    if (ytFormatted) {
        const v = (
            ytFormatted.getAttribute("title") ||
            ytFormatted.textContent ||
            ""
        ).trim();
        if (v) return v;
    }
    return document.title || "";
}

function getYouTubeChannel(): string {
    const el =
        document.querySelector("ytd-channel-name") ||
        document.querySelector("#channel-name");
    if (el) return (el as HTMLElement).innerText.trim();
    const anchor = Array.from(document.querySelectorAll("a")).find(
        (a) =>
            a.getAttribute("href")?.startsWith("/@") ||
            a.getAttribute("href")?.startsWith("/channel/"),
    );
    return (anchor?.textContent || "").trim();
}

function matchesRule(rule: ExtensionSettings["rules"][number]): boolean {
    const p = rule.pattern.toLowerCase();
    if (!p) return false;
    if (rule.type === "title")
        return getYouTubeTitle().toLowerCase().includes(p);
    if (rule.type === "channel")
        return getYouTubeChannel().toLowerCase().includes(p);
    return location.href.toLowerCase().includes(p);
}

function findMatchedRule(settings: ExtensionSettings) {
    for (const rule of settings.rules) {
        try {
            if (matchesRule(rule)) return rule;
        } catch {}
    }
    return null;
}

function nearlyEqual(a: number, b: number, eps = 1e-3) {
    return Math.abs(a - b) < eps;
}

let cancelAutomation: (() => void) | null = null;
let automationPauseUntil = 0;
let userOverrideRate: number | null = null;

function isAutomationPaused() {
    return Date.now() < automationPauseUntil;
}

function hasUserOverride(): boolean {
    return typeof userOverrideRate === "number";
}

function enforceAutomation(settings: ExtensionSettings) {
    if (cancelAutomation) {
        try {
            cancelAutomation();
        } finally {
            cancelAutomation = null;
        }
    }

    // User override wins over rules; re-assert briefly in case the player resets.
    if (hasUserOverride()) {
        const r = Math.max(0.1, userOverrideRate as number);
        void applyRate(r);
        const start = Date.now();
        const keepMs = 15000;
        const interval = setInterval(() => {
            const current = getPlaybackRate();
            if (current !== null && !nearlyEqual(current, r)) void applyRate(r);
            if (Date.now() - start > keepMs) clearInterval(interval);
        }, 500);
        cancelAutomation = () => clearInterval(interval);
        return;
    }

    const rule = findMatchedRule(settings);
    const desired = rule
        ? Math.max(0.1, Number(rule.speed) || 1)
        : Math.max(0.1, Number(settings.defaultPlaybackRate) || 1);
    if (!rule && nearlyEqual(desired, 1)) return;

    const apply = () => {
        if (!isAutomationPaused()) void applyRate(desired);
    };
    const delays = [0, 100, 250, 500, 1000];
    for (const d of delays) setTimeout(apply, d);

    const start = Date.now();
    const enforceMs = 30000;
    const interval = setInterval(() => {
        if (!isAutomationPaused()) {
            const current = getPlaybackRate();
            if (current !== null && !nearlyEqual(current, desired)) {
                void applyRate(desired);
            }
        }
        if (Date.now() - start > enforceMs) clearInterval(interval);
    }, 500);

    let detach = () => {};
    const video = document.querySelector(
        "video.html5-main-video",
    ) as HTMLVideoElement | null;
    const v =
        (video && !Number.isNaN(video.playbackRate) ? video : null) ||
        (document.querySelector("video") as HTMLVideoElement | null);
    if (v) {
        const onRateChange = () => {
            const current = getPlaybackRate();
            if (current !== null) {
                const vid = getVideoIdFromUrl(location.href);
                if (vid) {
                    void sendMessage({
                        type: "SAVE_TAB_VIDEO_RATE",
                        videoId: vid,
                        rate: current,
                    });
                }
                void sendMessage({
                    type: "CURRENT_PLAYBACK_RATE",
                    rate: current,
                });
            }
            if (
                !isAutomationPaused() &&
                current !== null &&
                !nearlyEqual(current, desired)
            ) {
                void applyRate(desired);
            }
        };
        v.addEventListener("ratechange", onRateChange, true);
        detach = () => v.removeEventListener("ratechange", onRateChange, true);
    }

    cancelAutomation = () => {
        clearInterval(interval);
        detach();
    };
}

async function init() {
    let settings = await getSettings();
    setDislikeCountsEnabled(settings.showDislikeCount);
    onSettingsChanged((s) => setDislikeCountsEnabled(s.showDislikeCount));
    onVideoReady(async () => {
        const vid = getVideoIdFromUrl(location.href);
        if (vid) {
            const resp = await sendMessage({
                type: "FETCH_TAB_VIDEO_RATE",
                videoId: vid,
            });
            const restored = typeof resp?.rate === "number" ? resp.rate : null;
            if (restored !== null && restored !== undefined) {
                userOverrideRate = restored;
                setPlaybackRate(restored);
            } else if (
                settings.defaultPlaybackRate &&
                settings.defaultPlaybackRate !== 1
            ) {
                setPlaybackRate(settings.defaultPlaybackRate);
            }
        } else if (
            settings.defaultPlaybackRate &&
            settings.defaultPlaybackRate !== 1
        ) {
            setPlaybackRate(settings.defaultPlaybackRate);
        }

        enforceAutomation(settings);

        let lastRulesKey = JSON.stringify(settings.rules);
        onSettingsChanged((s) => {
            const prev = settings;
            settings = s;
            const newRulesKey = JSON.stringify(s.rules);
            const rulesChanged = newRulesKey !== lastRulesKey;
            const defaultChanged =
                prev.defaultPlaybackRate !== s.defaultPlaybackRate;
            if (rulesChanged || defaultChanged) {
                lastRulesKey = newRulesKey;
                if (!hasUserOverride()) enforceAutomation(s);
            }
        });

        const reapply = () => {
            // New navigation: clear override so rules re-evaluate for the new video.
            userOverrideRate = null;
            refreshDislikeCounts();
            setTimeout(() => {
                onVideoReady(() => enforceAutomation(settings));
            }, 100);
        };
        window.addEventListener("yt-navigate-finish", reapply, true);
        window.addEventListener("popstate", reapply, true);
        const titleEl = document.querySelector("title");
        if (titleEl) {
            const titleObserver = new MutationObserver(reapply);
            titleObserver.observe(titleEl, { childList: true });
        }
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            const ogObserver = new MutationObserver(reapply);
            ogObserver.observe(ogTitle, {
                attributes: true,
                attributeFilter: ["content"],
            });
        }

        const current = getPlaybackRate();
        if (current !== null) {
            void sendMessage({ type: "CURRENT_PLAYBACK_RATE", rate: current });
        }
    });

    onMessage((message, _sender, sendResponse) => {
        if (message.type === "SET_PLAYBACK_RATE") {
            userOverrideRate = Math.max(0.1, Number(message.rate) || 1);
            if (cancelAutomation) cancelAutomation();
            setPlaybackRate(userOverrideRate);
            const vid = getVideoIdFromUrl(location.href);
            if (vid)
                void sendMessage({
                    type: "SAVE_TAB_VIDEO_RATE",
                    videoId: vid,
                    rate: userOverrideRate,
                });
        } else if (message.type === "GET_PLAYBACK_RATE") {
            const r = getPlaybackRate();
            if (r !== null) {
                void sendMessage({ type: "CURRENT_PLAYBACK_RATE", rate: r });
            }
        } else if (message.type === "REAPPLY_AUTOMATION") {
            void getSettings().then((s) => enforceAutomation(s));
            if (sendResponse) sendResponse({ ok: true });
            return true;
        } else if (message.type === "PAUSE_AUTOMATION") {
            const ms = Math.max(0, Number(message.ms ?? 5000));
            automationPauseUntil = Date.now() + ms;
            if (sendResponse) sendResponse({ ok: true });
            return true;
        }
    });
}

void init();
