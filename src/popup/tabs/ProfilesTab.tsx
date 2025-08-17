import { useEffect, useState } from "react";
import {
    ExtensionSettings,
    PresetProfile,
    getSettings,
    setSettings,
} from "../../shared/storage";

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
                    <button
                        className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                        onClick={() => {
                            const p = settings.profiles.find(
                                (x) => x.name === settings.activeProfileName
                            );
                            if (p) applyProfile(p);
                        }}
                    >
                        Apply
                    </button>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-semibold mb-2">
                    Create new profile
                </h4>
                <div className="flex gap-2">
                    <input
                        className="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                        placeholder="Profile name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addProfile()}
                    />
                    <button
                        className="px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                        onClick={addProfile}
                    >
                        Add
                    </button>
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
                                <button
                                    className="px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 text-sm"
                                    onClick={() => applyProfile(p)}
                                >
                                    Use
                                </button>
                                <button
                                    className="px-2 py-1 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 text-sm"
                                    onClick={() => removeProfile(p.name)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
