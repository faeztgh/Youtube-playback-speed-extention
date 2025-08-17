import { useEffect, useRef, useState } from "react";
import { getSettings, setSettings, DEFAULT_SETTINGS } from "../shared/storage";
import { ThemeToggle, ThemeMode } from "../components/ThemeToggle";
import { SpeedSlider } from "../components/SpeedSlider";
import { PresetList } from "../components/PresetList";
import { Tabs, TabKey } from "../components/Tabs";
import { ProfilesTab } from "./tabs/ProfilesTab";
import { AutomationTab } from "./tabs/AutomationTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { Plus, Save, Heart } from "lucide-react";
import { onMessage } from "../shared/messaging";

function roundToTwo(n: number): number {
    return Math.round(n * 100) / 100;
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

export const App = () => {
    const [rates, setRates] = useState<number[]>(DEFAULT_SETTINGS.customRates);
    const [defaultRate, setDefaultRate] = useState<number>(
        DEFAULT_SETTINGS.defaultPlaybackRate
    );
    const [theme, setTheme] = useState<ThemeMode>(
        (DEFAULT_SETTINGS.theme as ThemeMode) ?? "system"
    );
    const [sliderRate, setSliderRate] = useState<number>(
        DEFAULT_SETTINGS.defaultPlaybackRate
    );
    const [customRateInput, setCustomRateInput] = useState<string>("");
    const [activeTab, setActiveTab] = useState<TabKey>("general");
    const [activeTabId, setActiveTabId] = useState<number | null>(null);
    const activeTabIdRef = useRef<number | null>(null);

    useEffect(() => {
        activeTabIdRef.current = activeTabId;
    }, [activeTabId]);

    useEffect(() => {
        void (async () => {
            const s = await getSettings();
            setRates(s.customRates);
            setDefaultRate(s.defaultPlaybackRate);
            setTheme((s.theme as ThemeMode) ?? "system");
            setSliderRate(s.defaultPlaybackRate || 1);

            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            setActiveTabId(tab?.id ?? null);
            if (tab?.id) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: "GET_PLAYBACK_RATE",
                    });
                } catch {}
            }
        })();
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        const shouldDark =
            theme === "dark" ||
            (theme === "system" &&
                window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);
        root.classList.toggle("dark", shouldDark);
    }, [theme]);

    useEffect(() => {
        // Listen for rate broadcasts from the content script and sync our slider
        onMessage(async (message, sender) => {
            if (message.type === "CURRENT_PLAYBACK_RATE") {
                const senderTabId = sender.tab?.id ?? null;
                if (senderTabId && senderTabId === activeTabIdRef.current) {
                    setSliderRate(message.rate);
                    setDefaultRate(message.rate);
                    // also update badge immediately from popup (fallback)
                    try {
                        await chrome.action.setBadgeBackgroundColor({
                            tabId: senderTabId,
                            color: "#111827",
                        });
                        if ((chrome.action as any).setBadgeTextColor) {
                            await (chrome.action as any).setBadgeTextColor({
                                tabId: senderTabId,
                                color: "#FFFFFF",
                            });
                        }
                        await chrome.action.setBadgeText({
                            tabId: senderTabId,
                            text: formatBadgeText(message.rate),
                        });
                    } catch {}
                }
            }
        });
    }, []);

    const sliderMin = rates.length ? Math.min(0.1, ...rates) : 0.1;
    const sliderMax = rates.length ? Math.max(4, ...rates) : 4;

    async function applyRate(rate: number) {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (tab?.id) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: "SET_PLAYBACK_RATE",
                    rate: rate,
                });
                // also set badge immediately
                await chrome.action.setBadgeBackgroundColor({
                    tabId: tab.id,
                    color: "#111827",
                });
                if ((chrome.action as any).setBadgeTextColor) {
                    await (chrome.action as any).setBadgeTextColor({
                        tabId: tab.id,
                        color: "#FFFFFF",
                    });
                }
                await chrome.action.setBadgeText({
                    tabId: tab.id,
                    text: formatBadgeText(rate),
                });
            } catch {
                // Fallback: directly set video playbackRate via scripting if content script is unavailable
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: (r: number) => {
                            const v = document.querySelector(
                                "video"
                            ) as HTMLVideoElement | null;
                            if (v) {
                                v.playbackRate = r;
                                v.dispatchEvent(new Event("ratechange"));
                            }
                        },
                        args: [rate],
                    });
                    await chrome.action.setBadgeBackgroundColor({
                        tabId: tab.id,
                        color: "#111827",
                    });
                    if ((chrome.action as any).setBadgeTextColor) {
                        await (chrome.action as any).setBadgeTextColor({
                            tabId: tab.id,
                            color: "#FFFFFF",
                        });
                    }
                    await chrome.action.setBadgeText({
                        tabId: tab.id,
                        text: formatBadgeText(rate),
                    });
                } catch {}
            }
        }
        // Persist immediately
        void setSettings({ defaultPlaybackRate: rate });
    }

    async function saveSettings() {
        await setSettings({
            customRates: rates,
            defaultPlaybackRate: defaultRate,
            theme,
        });
    }

    const addRate = () =>
        setRates((rs) =>
            Array.from(
                new Set([...rs, roundToTwo((rs[rs.length - 1] ?? 1) + 0.25)])
            ).sort((a, b) => a - b)
        );

    const addCustomRate = () => {
        const parsed = Number(customRateInput);
        if (!Number.isFinite(parsed) || parsed <= 0) return;
        const rounded = roundToTwo(parsed);
        setRates((rs) =>
            Array.from(new Set([...rs, rounded])).sort((a, b) => a - b)
        );
        setCustomRateInput("");
    };

    const removeRate = (r: number) => {
        setRates((rs) => rs.filter((x) => x !== r).sort((a, b) => a - b));
    };

    const tabs = [
        { key: "general", label: "General" },
        { key: "profiles", label: "Profiles" },
        { key: "automation", label: "Automation" },
        { key: "settings", label: "Settings" },
    ];

    return (
        <div className="min-w-[360px] p-0 font-sans text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-950">
            <div className="px-4 py-3 mb-0 bg-[#0f0f0f] text-white flex items-center justify-between">
                <div className="flex flex-col leading-tight">
                    <span className="text-sm opacity-80">
                        Playback Controller
                    </span>
                    <h3 className="m-0 text-lg font-semibold tracking-wide">
                        Media Controls
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="https://hamibash.com/faez"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm border border-white/15 transition active:scale-[.98]"
                    >
                        <Heart className="w-4 h-4" />
                        <span>Support</span>
                    </a>
                    <ThemeToggle value={theme} onChange={setTheme} />
                </div>
            </div>

            <div className="p-4 pt-3">
                <Tabs
                    tabs={tabs as any}
                    value={activeTab}
                    onChange={setActiveTab}
                />

                {activeTab === "general" && (
                    <div className="mt-3">
                        <div className="p-4 transition bg-white border border-gray-200 shadow-sm dark:border-neutral-800 rounded-2xl dark:bg-neutral-900 hover:shadow-md">
                            <SpeedSlider
                                min={sliderMin}
                                max={sliderMax}
                                value={sliderRate}
                                onChange={async (v) => {
                                    setSliderRate(v);
                                    await applyRate(v);
                                }}
                                onClear={async () => {
                                    setSliderRate(defaultRate);
                                    await applyRate(defaultRate);
                                }}
                            />
                        </div>

                        <div className="mt-4">
                            <PresetList
                                presets={rates}
                                onSelect={async (r) => {
                                    setSliderRate(r);
                                    await applyRate(r);
                                }}
                                onRemove={removeRate}
                            />
                            <div className="flex gap-2 mt-3">
                                <input
                                    type="number"
                                    step="0.05"
                                    placeholder="Custom speed (e.g. 1.25)"
                                    value={customRateInput}
                                    onChange={(e) =>
                                        setCustomRateInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") addCustomRate();
                                    }}
                                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-md dark:border-neutral-800 dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                                    inputMode="decimal"
                                    aria-label="Custom speed"
                                />
                                <button
                                    onClick={addCustomRate}
                                    className="px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 transition active:scale-[.98] inline-flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add</span>
                                </button>
                                <button
                                    onClick={addRate}
                                    className="px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 transition active:scale-[.98] inline-flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>+0.25</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                            <div className="ml-auto">
                                <button
                                    onClick={saveSettings}
                                    className="px-4 py-2 rounded-md border border-gray-200 dark:border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white transition active:scale-[.98] inline-flex items-center gap-1"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "profiles" && <ProfilesTab />}
                {activeTab === "automation" && <AutomationTab />}
                {activeTab === "settings" && <SettingsTab />}
            </div>
        </div>
    );
};

