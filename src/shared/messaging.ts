export type Message =
    | { type: "SET_PLAYBACK_RATE"; rate: number }
    | { type: "GET_PLAYBACK_RATE" }
    | { type: "CURRENT_PLAYBACK_RATE"; rate: number }
    | { type: "REAPPLY_AUTOMATION" }
    | { type: "PING" }
    | { type: "GET_TAB_ID" }
    | { type: "SAVE_TAB_VIDEO_RATE"; videoId: string; rate: number }
    | { type: "FETCH_TAB_VIDEO_RATE"; videoId: string }
    | { type: "PAUSE_AUTOMATION"; ms?: number };

// Simple namespace polyfill for cross-browser compatibility
if (
    typeof (globalThis as any).browser === "undefined" &&
    typeof chrome !== "undefined"
) {
    (globalThis as any).browser = chrome as any;
}

export function sendMessage<T extends Message>(message: T): Promise<any> {
    // Prefer promise-based API if available
    const b: any = (globalThis as any).browser ?? chrome;
    if (b?.runtime?.sendMessage.length === 1) {
        // Promise-based
        return b.runtime.sendMessage(message);
    }
    return new Promise((resolve) => {
        b.runtime.sendMessage(message, (response: any) => resolve(response));
    });
}

export function onMessage(
    handler: (
        message: Message,
        sender: chrome.runtime.MessageSender,
        sendResponse?: (response?: any) => void
    ) => boolean | void
) {
    const b: any = (globalThis as any).browser ?? chrome;
    b.runtime.onMessage.addListener(
        (message: Message, sender: any, sendResponse: any) =>
            handler(message, sender, sendResponse) as any
    );
}

