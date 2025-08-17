import { useEffect, useRef, useState } from "react";
import {
    ExtensionSettings,
    DEFAULT_SETTINGS,
    getSettings,
    setSettings,
} from "../../shared/storage";

export const SettingsTab = () => {
    const [settings, setLocal] = useState<ExtensionSettings | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        void getSettings().then(setLocal);
    }, []);

    if (!settings) return null;

    const exportJson = async () => {
        const data = JSON.stringify(settings, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "media-controller-settings.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const importJson = async (file: File) => {
        const text = await file.text();
        const parsed = JSON.parse(text);
        await setSettings(parsed);
        setLocal(parsed);
    };

    const resetDefaults = async () => {
        await setSettings(DEFAULT_SETTINGS);
        setLocal(DEFAULT_SETTINGS);
    };

    return (
        <div className="mt-3 space-y-4">
            <div className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={settings.rememberLastPerChannel}
                    onChange={async (e) => {
                        const patch = {
                            rememberLastPerChannel: e.target.checked,
                        };
                        await setSettings(patch);
                        setLocal({ ...settings, ...patch });
                    }}
                />
                <span>Remember last used speed per channel</span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    className="px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                    onClick={exportJson}
                >
                    Export settings
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) =>
                        e.target.files && importJson(e.target.files[0])
                    }
                />
                <button
                    className="px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                    onClick={() => fileRef.current?.click()}
                >
                    Import settings
                </button>
                <button
                    className="ml-auto px-3 py-2 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300"
                    onClick={resetDefaults}
                >
                    Reset to defaults
                </button>
            </div>
        </div>
    );
};
