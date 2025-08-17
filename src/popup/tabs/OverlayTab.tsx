import { useEffect, useState } from "react";
import {
    getSettings,
    setSettings,
    ExtensionSettings,
} from "../../shared/storage";

export const OverlayTab = () => {
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

    const pos = settings.overlay.position;

    return (
        <div className="mt-3 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={settings.overlay.visible}
                        onChange={(e) =>
                            update({
                                overlay: {
                                    ...settings.overlay,
                                    visible: e.target.checked,
                                },
                            })
                        }
                    />
                    <span>Show overlay on page</span>
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={settings.overlay.autoHide}
                        onChange={(e) =>
                            update({
                                overlay: {
                                    ...settings.overlay,
                                    autoHide: e.target.checked,
                                },
                            })
                        }
                    />
                    <span>Auto-hide on inactivity</span>
                </label>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <label className="flex items-center gap-2">
                    <span className="w-36 text-neutral-600 dark:text-neutral-400">
                        Right (px)
                    </span>
                    <input
                        type="number"
                        className="flex-1 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                        value={pos.rightPx}
                        onChange={(e) =>
                            update({
                                overlay: {
                                    ...settings.overlay,
                                    position: {
                                        ...pos,
                                        rightPx: Number(e.target.value),
                                    },
                                },
                            })
                        }
                    />
                </label>
                <label className="flex items-center gap-2">
                    <span className="w-36 text-neutral-600 dark:text-neutral-400">
                        Bottom (px)
                    </span>
                    <input
                        type="number"
                        className="flex-1 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                        value={pos.bottomPx}
                        onChange={(e) =>
                            update({
                                overlay: {
                                    ...settings.overlay,
                                    position: {
                                        ...pos,
                                        bottomPx: Number(e.target.value),
                                    },
                                },
                            })
                        }
                    />
                </label>
            </div>

            <div className="text-sm">
                <label className="flex items-center gap-2">
                    <span className="w-36 text-neutral-600 dark:text-neutral-400">
                        Opacity
                    </span>
                    <input
                        type="range"
                        min={0.5}
                        max={1}
                        step={0.05}
                        value={settings.overlay.opacity}
                        onChange={(e) =>
                            update({
                                overlay: {
                                    ...settings.overlay,
                                    opacity: Number(e.target.value),
                                },
                            })
                        }
                        className="flex-1"
                    />
                    <span className="w-12 text-right tabular-nums">
                        {settings.overlay.opacity.toFixed(2)}
                    </span>
                </label>
            </div>
        </div>
    );
};
