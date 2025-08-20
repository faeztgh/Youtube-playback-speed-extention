export type ThemeMode = "light" | "dark" | "system";

export type PresetProfile = {
    name: string;
    customRates: number[];
    defaultPlaybackRate: number;
};

export type ShortcutSettings = {
    increase: string; // keyboard key, e.g. "+"
    decrease: string; // "-"
    reset: string; // "0"
    cycle: string; // "c"
};

export type OverlaySettings = {
    position: { rightPx: number; bottomPx: number };
    opacity: number; // 0..1
    autoHide: boolean;
    visible: boolean;
};

export type AutomationRule = {
    id: string;
    type: "channel" | "title" | "url";
    pattern: string;
    speed: number;
};

export type ExtensionSettings = {
    defaultPlaybackRate: number;
    showOverlay: boolean;
    customRates: number[];
    theme?: ThemeMode;
    // New
    stepSize: number;
    snapToPreset: boolean;
    rememberLastPerChannel: boolean;
    profiles: PresetProfile[];
    activeProfileName: string | null;
    shortcuts: ShortcutSettings;
    overlay: OverlaySettings;
    rules: AutomationRule[];
};

const DEFAULT_SETTINGS: ExtensionSettings = {
    defaultPlaybackRate: 1.0,
    showOverlay: false,
    customRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
    theme: "system",
    stepSize: 0.25,
    snapToPreset: false,
    rememberLastPerChannel: false,
    profiles: [],
    activeProfileName: null,
    shortcuts: {
        increase: "+",
        decrease: "-",
        reset: "0",
        cycle: "c",
    },
    overlay: {
        position: { rightPx: 12, bottomPx: 88 },
        opacity: 0.95,
        autoHide: false,
        visible: false,
    },
    rules: [],
};

const browserNs: any = (globalThis as any).browser ?? chrome;

export async function getSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
        browserNs.storage.sync.get(DEFAULT_SETTINGS, (items: any) => {
            resolve(items as ExtensionSettings);
        });
    });
}

export async function setSettings(
    update: Partial<ExtensionSettings>
): Promise<void> {
    return new Promise((resolve) => {
        browserNs.storage.sync.set(update, () => resolve());
    });
}

export function onSettingsChanged(
    cb: (settings: ExtensionSettings) => void
): () => void {
    const listener = (
        changes: { [key: string]: chrome.storage.StorageChange },
        area: string
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

