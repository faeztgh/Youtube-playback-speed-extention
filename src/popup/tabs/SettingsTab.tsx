import { Download, RotateCcw, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "../../components/ActionButton";
import { Switch } from "../../components/Switch";
import {
    DEFAULT_SETTINGS,
    type ExtensionSettings,
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
            <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Switch
                    aria-label="Remember last used speed per channel"
                    checked={settings.rememberLastPerChannel}
                    onChange={async (checked) => {
                        const patch = {
                            rememberLastPerChannel: checked,
                        };
                        await setSettings(patch);
                        setLocal({ ...settings, ...patch });
                    }}
                />
                <span>Remember last used speed per channel</span>
            </label>

            <div className="text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                        aria-label="Show dislike counts on videos"
                        checked={settings.showDislikeCount}
                        onChange={async (checked) => {
                            const patch = {
                                showDislikeCount: checked,
                            };
                            await setSettings(patch);
                            setLocal({ ...settings, ...patch });
                        }}
                    />
                    <span>Show dislike counts on videos</span>
                </label>
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
