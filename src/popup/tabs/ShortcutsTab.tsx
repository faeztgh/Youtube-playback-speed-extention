import { useEffect, useState } from "react";
import {
    getSettings,
    setSettings,
    ExtensionSettings,
} from "../../shared/storage";

export const ShortcutsTab = () => {
    const [settings, setLocal] = useState<ExtensionSettings | null>(null);

    useEffect(() => {
        void getSettings().then(setLocal);
    }, []);

    if (!settings) return null;

    const update = (patch: Partial<ExtensionSettings>) => {
        const next = { ...settings, ...patch } as ExtensionSettings;
        setLocal(next);
        void setSettings(patch);
    };

    return (
        <div className="mt-3 space-y-4">
            <div>
                <h4 className="text-sm font-semibold mb-2">
                    Keyboard Shortcuts
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <label className="flex items-center gap-2">
                        <span className="w-28 text-neutral-600 dark:text-neutral-400">
                            Increase
                        </span>
                        <input
                            className="flex-1 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                            value={settings.shortcuts.increase}
                            onChange={(e) =>
                                update({
                                    shortcuts: {
                                        ...settings.shortcuts,
                                        increase: e.target.value,
                                    },
                                })
                            }
                        />
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="w-28 text-neutral-600 dark:text-neutral-400">
                            Decrease
                        </span>
                        <input
                            className="flex-1 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                            value={settings.shortcuts.decrease}
                            onChange={(e) =>
                                update({
                                    shortcuts: {
                                        ...settings.shortcuts,
                                        decrease: e.target.value,
                                    },
                                })
                            }
                        />
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="w-28 text-neutral-600 dark:text-neutral-400">
                            Reset
                        </span>
                        <input
                            className="flex-1 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                            value={settings.shortcuts.reset}
                            onChange={(e) =>
                                update({
                                    shortcuts: {
                                        ...settings.shortcuts,
                                        reset: e.target.value,
                                    },
                                })
                            }
                        />
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="w-28 text-neutral-600 dark:text-neutral-400">
                            Cycle
                        </span>
                        <input
                            className="flex-1 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                            value={settings.shortcuts.cycle}
                            onChange={(e) =>
                                update({
                                    shortcuts: {
                                        ...settings.shortcuts,
                                        cycle: e.target.value,
                                    },
                                })
                            }
                        />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <label className="flex items-center gap-2">
                    <span className="w-32 text-neutral-600 dark:text-neutral-400">
                        Step size
                    </span>
                    <input
                        type="number"
                        step={0.05}
                        className="flex-1 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                        value={settings.stepSize}
                        onChange={(e) =>
                            update({ stepSize: Number(e.target.value) })
                        }
                    />
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={settings.snapToPreset}
                        onChange={(e) =>
                            update({ snapToPreset: e.target.checked })
                        }
                    />
                    <span>Snap to nearest preset</span>
                </label>
            </div>
        </div>
    );
};
