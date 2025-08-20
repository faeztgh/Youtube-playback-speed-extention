import { useEffect, useState } from "react";
import {
    ExtensionSettings,
    PresetProfile,
    getSettings,
    setSettings,
} from "../../shared/storage";
import { CheckCircle2, Plus, Trash2, Play } from "lucide-react";
import { Input } from "../../components/Input";
import { ActionButton } from "../../components/ActionButton";

export const ProfilesTab = () => {
    const [settings, setLocal] = useState<ExtensionSettings | null>(null);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        void getSettings().then(setLocal);
    }, []);

    if (!settings) return null;

    const update = (patch: Partial<ExtensionSettings>) => {
        const next = { ...settings, ...patch } as ExtensionSettings;
        setLocal(next);
        void setSettings(patch);
    };

    const addProfile = () => {
        const name = newName.trim();
        if (!name) return;
        if (settings.profiles.find((p) => p.name === name)) return;
        const profile: PresetProfile = {
            name,
            customRates: settings.customRates,
            defaultPlaybackRate: settings.defaultPlaybackRate,
        };
        update({
            profiles: [...settings.profiles, profile],
            activeProfileName: name,
        });
        setNewName("");
    };

    const applyProfile = (p: PresetProfile) => {
        update({
            customRates: p.customRates,
            defaultPlaybackRate: p.defaultPlaybackRate,
            activeProfileName: p.name,
        });
    };

    const removeProfile = (name: string) => {
        const next = settings.profiles.filter((p) => p.name !== name);
        const patch: Partial<ExtensionSettings> = { profiles: next };
        if (settings.activeProfileName === name) patch.activeProfileName = null;
        update(patch);
    };

    return (
        <div className="mt-3 space-y-4">
            <div>
                <h4 className="text-sm font-semibold mb-2">Active profile</h4>
                <div className="flex gap-2 items-center text-sm">
                    <select
                        className="px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                        value={settings.activeProfileName ?? ""}
                        onChange={(e) => {
                            const p = settings.profiles.find(
                                (x) => x.name === e.target.value
                            );
                            if (p) applyProfile(p);
                        }}
                    >
                        <option value="">None</option>
                        {settings.profiles.map((p) => (
                            <option key={p.name} value={p.name}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <ActionButton
                        onClick={() => {
                            const p = settings.profiles.find(
                                (x) => x.name === settings.activeProfileName
                            );
                            if (p) applyProfile(p);
                        }}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Apply</span>
                    </ActionButton>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-semibold mb-2">
                    Create new profile
                </h4>
                <div className="flex gap-2">
                    <Input
                        className="flex-1"
                        placeholder="Profile name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addProfile()}
                        uiSize="md"
                    />
                    <ActionButton onClick={addProfile}>
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                    </ActionButton>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-semibold mb-2">Profiles</h4>
                <div className="space-y-2">
                    {settings.profiles.length === 0 && (
                        <div className="text-sm text-neutral-500">
                            No profiles yet.
                        </div>
                    )}
                    {settings.profiles.map((p) => (
                        <div
                            key={p.name}
                            className="flex items-center justify-between rounded-md border border-gray-200 dark:border-neutral-800 p-2"
                        >
                            <div>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-neutral-500">
                                    Default: {p.defaultPlaybackRate} • Presets:{" "}
                                    {p.customRates.join(", ")}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <ActionButton onClick={() => applyProfile(p)}>
                                    <Play className="w-4 h-4" />
                                    <span>Use</span>
                                </ActionButton>
                                <ActionButton
                                    variant="danger"
                                    onClick={() => removeProfile(p.name)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Remove</span>
                                </ActionButton>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
