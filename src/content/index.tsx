import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../styles/tailwind.css";
import {
    getPlaybackRate,
    onVideoReady,
    setPlaybackRate,
} from "../shared/youtube";
import { onMessage, sendMessage } from "../shared/messaging";
import {
    DEFAULT_SETTINGS,
    getSettings,
    onSettingsChanged,
    ExtensionSettings,
    setSettings,
} from "../shared/storage";
import { Overlay } from "./Overlay";

function getYouTubeTitle(): string {
    const og = document.querySelector(
        'meta[property="og:title"]'
    ) as HTMLMetaElement | null;
    if (og?.content) return og.content;
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
            a.getAttribute("href")?.startsWith("/channel/")
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

function mountOverlay() {
    const container = document.createElement("div");
    document.documentElement.appendChild(container);
    const root = createRoot(container);
    const App = () => {
        const [rate, setRate] = useState<number>(
            getPlaybackRate() ?? DEFAULT_SETTINGS.defaultPlaybackRate
        );
        const [presets, setPresets] = useState<number[]>(
            DEFAULT_SETTINGS.customRates
        );
        const [visible, setVisible] = useState<boolean>(
            DEFAULT_SETTINGS.showOverlay
        );
        const [rightPx, setRight] = useState<number>(
            DEFAULT_SETTINGS.overlay.position.rightPx
        );
        const [bottomPx, setBottom] = useState<number>(
            DEFAULT_SETTINGS.overlay.position.bottomPx
        );
        const [opacity, setOpacity] = useState<number>(
            DEFAULT_SETTINGS.overlay.opacity
        );
        const [autoHide, setAutoHide] = useState<boolean>(
            DEFAULT_SETTINGS.overlay.autoHide
        );

        useEffect(() => {
            void getSettings().then((s) => {
                setPresets(s.customRates);
                setVisible(s.overlay.visible || s.showOverlay);
                setRight(s.overlay.position.rightPx);
                setBottom(s.overlay.position.bottomPx);
                setOpacity(s.overlay.opacity);
                setAutoHide(s.overlay.autoHide);
            });
            const off = onSettingsChanged((s) => {
                setPresets(s.customRates);
                setVisible(s.overlay.visible || s.showOverlay);
                setRight(s.overlay.position.rightPx);
                setBottom(s.overlay.position.bottomPx);
                setOpacity(s.overlay.opacity);
                setAutoHide(s.overlay.autoHide);
            });
            return off;
        }, []);

        useEffect(() => {
            const findVideo = (): HTMLVideoElement | null => {
                const specific = document.querySelector(
                    "video.html5-main-video"
                ) as HTMLVideoElement | null;
                if (specific && !Number.isNaN(specific.playbackRate))
                    return specific;
                return document.querySelector(
                    "video"
                ) as HTMLVideoElement | null;
            };

            let currentVideo: HTMLVideoElement | null = null;
            const onRateChange = () => {
                const current = getPlaybackRate();
                if (current !== null) {
                    setRate(current);
                    void sendMessage({
                        type: "CURRENT_PLAYBACK_RATE",
                        rate: current,
                    });
                    void setSettings({ defaultPlaybackRate: current });
                }
            };

            const attach = () => {
                const v = findVideo();
                if (!v || v === currentVideo) return;
                if (currentVideo) {
                    currentVideo.removeEventListener(
                        "ratechange",
                        onRateChange,
                        true
                    );
                }
                currentVideo = v;
                currentVideo.addEventListener("ratechange", onRateChange, true);
                // send once to initialize UI/badge
                onRateChange();
            };

            attach();
            const mo = new MutationObserver(() => attach());
            mo.observe(document.documentElement, {
                childList: true,
                subtree: true,
            });

            return () => {
                if (currentVideo) {
                    currentVideo.removeEventListener(
                        "ratechange",
                        onRateChange,
                        true
                    );
                }
                mo.disconnect();
            };
        }, []);
        return (
            <Overlay
                currentRate={rate}
                presets={presets}
                onChange={(r: number) => setPlaybackRate(r)}
                rightPx={rightPx}
                bottomPx={bottomPx}
                opacity={opacity}
                visible={visible}
                autoHide={autoHide}
            />
        );
    };
    root.render(<App />);
}

async function applyAutomationIfAny(s: ExtensionSettings) {
    for (const rule of s.rules) {
        try {
            if (matchesRule(rule)) {
                setPlaybackRate(rule.speed);
                break;
            }
        } catch {}
    }
}

function bindShortcuts(s: ExtensionSettings) {
    const handler = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (target) {
            const tag = target.tagName.toLowerCase();
            const isEditable = (target as HTMLElement).isContentEditable;
            if (tag === "input" || tag === "textarea" || isEditable) return;
        }

        const current = getPlaybackRate() ?? 1;
        const step = s.stepSize;
        const presets = s.customRates.slice().sort((a, b) => a - b);

        const snap = (val: number) => {
            if (!s.snapToPreset || presets.length === 0) return val;
            return presets.reduce(
                (prev, curr) =>
                    Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev,
                presets[0]
            );
        };

        if (e.key === s.shortcuts.increase) {
            const next = snap(current + step);
            setPlaybackRate(next);
        } else if (e.key === s.shortcuts.decrease) {
            const next = snap(Math.max(0.1, current - step));
            setPlaybackRate(next);
        } else if (e.key === s.shortcuts.reset) {
            setPlaybackRate(s.defaultPlaybackRate);
        } else if (e.key === s.shortcuts.cycle) {
            if (presets.length > 0) {
                const idx = presets.findIndex(
                    (p) => Math.abs(p - current) < 1e-6
                );
                const next =
                    idx >= 0 ? presets[(idx + 1) % presets.length] : presets[0];
                setPlaybackRate(next);
            }
        } else {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
}

async function init() {
    let settings = await getSettings();
    onVideoReady(() => {
        // Always mount overlay once; visibility controlled by settings
        mountOverlay();

        if (
            settings.defaultPlaybackRate &&
            settings.defaultPlaybackRate !== 1
        ) {
            setPlaybackRate(settings.defaultPlaybackRate);
        }

        void applyAutomationIfAny(settings);

        // Bind shortcuts and update when settings change
        let unbind = bindShortcuts(settings);
        let lastRulesKey = JSON.stringify(settings.rules);
        onSettingsChanged((s) => {
            settings = s;
            // Re-apply automation only if rules changed
            const newRulesKey = JSON.stringify(s.rules);
            if (newRulesKey !== lastRulesKey) {
                lastRulesKey = newRulesKey;
                void applyAutomationIfAny(s);
            }
            // Rebind shortcuts to use latest settings
            unbind();
            unbind = bindShortcuts(s);
        });

        // Send initial rate to popup if it's listening
        const current = getPlaybackRate();
        if (current !== null) {
            void sendMessage({ type: "CURRENT_PLAYBACK_RATE", rate: current });
        }
    });

    onMessage((message) => {
        if (message.type === "SET_PLAYBACK_RATE") {
            setPlaybackRate(message.rate);
        } else if (message.type === "GET_PLAYBACK_RATE") {
            const r = getPlaybackRate();
            if (r !== null) {
                void sendMessage({ type: "CURRENT_PLAYBACK_RATE", rate: r });
            }
        }
    });
}

void init();
