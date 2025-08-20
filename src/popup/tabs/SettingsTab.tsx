import { useEffect, useRef, useState } from "react";
import {
    ExtensionSettings,
    DEFAULT_SETTINGS,
    getSettings,
    setSettings,
} from "../../shared/storage";
import { Download, Upload, RotateCcw } from "lucide-react";
import { ActionButton } from "../../components/ActionButton";

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

            <div className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={settings.overlay.visible || settings.showOverlay}
                    onChange={async (e) => {
                        const patch = {
                            overlay: {
                                ...settings.overlay,
                                visible: e.target.checked,
                            },
                            showOverlay: e.target.checked,
                        } as ExtensionSettings;
                        await setSettings(patch);
                        setLocal({ ...settings, ...patch });
                    }}
                />
                <span>Show in-player controller overlay</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={settings.overlay.autoHide}
                    onChange={async (e) => {
                        const patch = {
                            overlay: {
                                ...settings.overlay,
                                autoHide: e.target.checked,
                            },
                        } as ExtensionSettings;
                        await setSettings(patch);
                        setLocal({ ...settings, ...patch });
                    }}
                />
                <span>Auto-hide overlay until hovered</span>
            </div>

            <div className="flex items-center gap-2">
                <ActionButton onClick={exportJson}>
                    <Download className="w-4 h-4" />
                    <span>Export settings</span>
                </ActionButton>
                <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) =>
                        e.target.files && importJson(e.target.files[0])
                    }
                />
                <ActionButton onClick={() => fileRef.current?.click()}>
                    <Upload className="w-4 h-4" />
                    <span>Import settings</span>
                </ActionButton>
                <ActionButton
                    variant="danger"
                    className="ml-auto"
                    onClick={resetDefaults}
                >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset to defaults</span>
                </ActionButton>
            </div>
        </div>
    );
};
