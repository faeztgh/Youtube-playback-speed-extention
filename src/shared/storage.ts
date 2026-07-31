import { browserNs } from "./messaging";

export type ThemeMode = "light" | "dark" | "system";

export type PresetProfile = {
    name: string;
    customRates: number[];
    defaultPlaybackRate: number;
};

export type ShortcutSettings = {
    increase: string;
    decrease: string;
    reset: string;
    cycle: string;
};

export type AutomationRule = {
    id: string;
    type: "channel" | "title" | "url";
    pattern: string;
    speed: number;
};

export type ExtensionSettings = {
    defaultPlaybackRate: number;
    customRates: number[];
    theme?: ThemeMode;
    stepSize: number;
    snapToPreset: boolean;
    rememberLastPerChannel: boolean;
    showDislikeCount: boolean;
    profiles: PresetProfile[];
    activeProfileName: string | null;
    shortcuts: ShortcutSettings;
    rules: AutomationRule[];
};

const DEFAULT_SETTINGS: ExtensionSettings = {
    defaultPlaybackRate: 1.0,
    customRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
    theme: "system",
    stepSize: 0.25,
    snapToPreset: false,
    rememberLastPerChannel: false,
    showDislikeCount: false,
    profiles: [],
    activeProfileName: null,
    shortcuts: {
        increase: "+",
        decrease: "-",
        reset: "0",
        cycle: "c",
    },
    rules: [],
};

export async function getSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
        browserNs.storage.sync.get(DEFAULT_SETTINGS, (items: any) => {
            resolve(items as ExtensionSettings);
        });
    });
}

export async function setSettings(
    update: Partial<ExtensionSettings>,
): Promise<void> {
    return new Promise((resolve) => {
        browserNs.storage.sync.set(update, () => resolve());
    });
}

export function onSettingsChanged(
    cb: (settings: ExtensionSettings) => void,
): () => void {
    const listener = (
        _changes: { [key: string]: chrome.storage.StorageChange },
        area: string,
    ) => {
        if (area !== "sync") return;
        browserNs.storage.sync.get(DEFAULT_SETTINGS, (items: any) => {
            cb(items as ExtensionSettings);
        });
    };
    browserNs.storage.onChanged.addListener(listener);
    return () => browserNs.storage.onChanged.removeListener(listener);
}

export { DEFAULT_SETTINGS };
