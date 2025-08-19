import { useEffect, useMemo, useState } from "react";
import {
    DEFAULT_SETTINGS,
    ExtensionSettings,
    getSettings,
    setSettings,
} from "../shared/storage";
import { PresetList } from "../components/PresetList";
import { SpeedSlider } from "../components/SpeedSlider";
import { ProfilesTab } from "../popup/tabs/ProfilesTab";
import { AutomationTab } from "../popup/tabs/AutomationTab";
import { Heart } from "lucide-react";

export const App = () => {
    const [s, setLocal] = useState<ExtensionSettings | null>(null);
    const [customRateInput, setCustomRateInput] = useState("");
    const [active, setActive] = useState<
        "general" | "presets" | "profiles" | "automation"
    >("general");

    useEffect(() => {
        void getSettings().then((val) => setLocal(val));
    }, []);

    const update = (patch: Partial<ExtensionSettings>) => {
        if (!s) return;
        const next = { ...s, ...patch } as ExtensionSettings;
        setLocal(next);
        void setSettings(patch);
    };

    const sortedRates = useMemo(
        () => (s ? [...s.customRates].sort((a, b) => a - b) : []),
        [s?.customRates]
    );

    if (!s) return null;

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <header className="sticky top-0 z-10 bg-[#0f0f0f] text-white shadow-sm">
                <div className="max-w-7xl w-full mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <div className="text-sm opacity-80">
                            YouTube Playback Controller
                        </div>
                        <h1 className="m-0 text-2xl font-semibold tracking-wide">
                            Settings
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href="https://hamibash.com/faez"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm border border-white/15 transition active:scale-[.98]"
                        >
                            <Heart className="w-4 h-4" />
                            <span>Support</span>
                        </a>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-12 gap-6">
                <nav className="col-span-12 md:col-span-3">
                    <div className="sticky top-20 space-y-1">
                        {[
                            ["general", "General"],
                            ["presets", "Presets"],
                            ["profiles", "Profiles"],
                            ["automation", "Automation"],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActive(key as any)}
                                className={
                                    "w-full text-left px-3 py-2 rounded-md transition " +
                                    (active === key
                                        ? "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow"
                                        : "hover:bg-white/60 dark:hover:bg-neutral-900/60")
                                }
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </nav>

                <section className="col-span-12 md:col-span-9 space-y-6">
                    {active === "general" && (
                        <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                            <h3 className="m-0 text-lg font-semibold mb-3">
                                General
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <label className="flex items-center gap-2">
                                    <span className="w-40 text-neutral-600 dark:text-neutral-400">
                                        Default playback rate
                                    </span>
                                    <input
                                        type="number"
                                        step={0.05}
                                        className="flex-1 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                        value={s.defaultPlaybackRate}
                                        onChange={(e) =>
                                            update({
                                                defaultPlaybackRate: Number(
                                                    e.target.value
                                                ),
                                            })
                                        }
                                    />
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={s.rememberLastPerChannel}
                                        onChange={(e) =>
                                            update({
                                                rememberLastPerChannel:
                                                    e.target.checked,
                                            })
                                        }
                                    />
                                    <span>
                                        Remember last used speed per channel
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}

                    {active === "presets" && (
                        <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                            <h3 className="m-0 text-lg font-semibold mb-3">
                                Presets
                            </h3>
                            <div className="space-y-3">
                                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                                    <SpeedSlider
                                        label="Default"
                                        min={0.1}
                                        max={4}
                                        value={s.defaultPlaybackRate}
                                        onChange={(v) =>
                                            update({ defaultPlaybackRate: v })
                                        }
                                    />
                                </div>
                                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step={0.05}
                                            placeholder="Custom speed (e.g. 1.25)"
                                            value={customRateInput}
                                            onChange={(e) =>
                                                setCustomRateInput(
                                                    e.target.value
                                                )
                                            }
                                            onKeyDown={(e) =>
                                                e.key === "Enter" && addRate()
                                            }
                                            className="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                        />
                                        <button
                                            className="px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                                            onClick={addRate}
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="mt-3">
                                        <PresetList
                                            presets={sortedRates}
                                            onSelect={(r) =>
                                                update({
                                                    defaultPlaybackRate: r,
                                                })
                                            }
                                            onRemove={(r) =>
                                                update({
                                                    customRates:
                                                        s.customRates.filter(
                                                            (x) => x !== r
                                                        ),
                                                })
                                            }
                                            className=""
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {active === "profiles" && (
                        <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                            <h3 className="m-0 text-lg font-semibold mb-3">
                                Profiles
                            </h3>
                            <ProfilesTab />
                        </div>
                    )}

                    {active === "automation" && (
                        <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                            <h3 className="m-0 text-lg font-semibold mb-3">
                                Automation
                            </h3>
                            <AutomationTab />
                        </div>
                    )}
                </section>
            </main>
        </div>
    );

    function addRate() {
        const parsed = Number(customRateInput);
        if (!Number.isFinite(parsed) || parsed <= 0) return;
        const rounded = Math.round(parsed * 100) / 100;
        const next = Array.from(new Set([...s!.customRates, rounded])).sort(
            (a, b) => a - b
        );
        update({ customRates: next });
        setCustomRateInput("");
    }
};
