import { useEffect, useRef, useState } from "react";
import { getSettings, setSettings, DEFAULT_SETTINGS } from "../shared/storage";
import { ThemeToggle } from "../components/ThemeToggle";
import type { ThemeMode } from "../shared/storage";
import { Tabs, TabKey } from "../components/Tabs";
import { ProfilesTab } from "./tabs/ProfilesTab";
import { AutomationTab } from "./tabs/AutomationTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { GeneralTab } from "./tabs/GeneralTab";
import { Heart, Sliders, Wand2, UserCircle, Settings } from "lucide-react";
import { onMessage, sendMessage } from "../shared/messaging";
import { applyRate } from "../shared/rate";
import { formatBadgeText } from "../shared/badge";

function roundToTwo(n: number): number {
    return Math.round(n * 100) / 100;
}

// Namespace shim
const browserNs: any = (globalThis as any).browser ?? chrome;

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

            const [tab] = await browserNs.tabs.query({
                active: true,
                currentWindow: true,
            });
            setActiveTabId(tab?.id ?? null);
            if (tab?.id) {
                try {
                    await browserNs.tabs.sendMessage(tab.id, {
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
        onMessage((message, sender) => {
            if (message.type === "CURRENT_PLAYBACK_RATE") {
                const senderTabId = sender.tab?.id ?? null;
                if (senderTabId && senderTabId === activeTabIdRef.current) {
                    setSliderRate(message.rate);
                    setDefaultRate(message.rate);
                    // also update badge immediately from popup (fallback)
                    void (async () => {
                        try {
                            await browserNs.action.setBadgeBackgroundColor({
                                tabId: senderTabId,
                                color: "#111827",
                            });
                            if (browserNs.action?.setBadgeTextColor) {
                                await browserNs.action.setBadgeTextColor({
                                    tabId: senderTabId,
                                    color: "#FFFFFF",
                                });
                            }
                            await browserNs.action.setBadgeText({
                                tabId: senderTabId,
                                text: formatBadgeText(message.rate),
                            });
                        } catch {}
                    })();
                }
            }
        });
    }, []);

    async function applyFromPopup(rate: number) {
        await sendMessage({ type: "PAUSE_AUTOMATION", ms: 10000 });
        await applyRate(rate);
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
        {
            key: "general",
            label: "General",
            icon: <Sliders className="w-4 h-4" />,
        },
        {
            key: "profiles",
            label: "Profiles",
            icon: <UserCircle className="w-4 h-4" />,
        },
        {
            key: "automation",
            label: "Automation",
            icon: <Wand2 className="w-4 h-4" />,
        },
        {
            key: "settings",
            label: "Settings",
            icon: <Settings className="w-4 h-4" />,
        },
    ];

    return (
        <div className="min-w-[700px] p-0 font-sans text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-950">
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
                    <GeneralTab
                        rates={rates}
                        sliderRate={sliderRate}
                        setSliderRate={setSliderRate}
                        defaultRate={defaultRate}
                        apply={applyFromPopup}
                        onSave={saveSettings}
                        removeRate={removeRate}
                        customRateInput={customRateInput}
                        setCustomRateInput={setCustomRateInput}
                        addCustomRate={addCustomRate}
                        addRate={addRate}
                    />
                )}

                {activeTab === "profiles" && <ProfilesTab />}
                {activeTab === "automation" && <AutomationTab />}
                {activeTab === "settings" && <SettingsTab />}
            </div>
        </div>
    );
};

