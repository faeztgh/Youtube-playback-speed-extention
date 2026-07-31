export type Message =
    | { type: "SET_PLAYBACK_RATE"; rate: number }
    | { type: "GET_PLAYBACK_RATE" }
    | { type: "CURRENT_PLAYBACK_RATE"; rate: number }
    | { type: "REAPPLY_AUTOMATION" }
    | { type: "SAVE_TAB_VIDEO_RATE"; videoId: string; rate: number }
    | { type: "FETCH_TAB_VIDEO_RATE"; videoId: string }
    | { type: "PAUSE_AUTOMATION"; ms?: number }
    | { type: "FETCH_DISLIKES"; videoId: string };

export type DislikeData = {
    dislikes: number;
    likes?: number;
    rating?: number;
    viewCount?: number;
};

if (
    typeof (globalThis as any).browser === "undefined" &&
    typeof chrome !== "undefined"
) {
    (globalThis as any).browser = chrome as any;
}

export const browserNs: any = (globalThis as any).browser ?? chrome;

export function sendMessage<T extends Message>(message: T): Promise<any> {
    if (browserNs?.runtime?.sendMessage.length === 1) {
        return browserNs.runtime.sendMessage(message);
    }
    return new Promise((resolve) => {
        browserNs.runtime.sendMessage(message, (response: any) =>
            resolve(response),
        );
    });
}

export function onMessage(
    handler: (
        message: Message,
        sender: chrome.runtime.MessageSender,
        sendResponse?: (response?: any) => void,
    ) => boolean | void,
) {
    browserNs.runtime.onMessage.addListener(
        (message: Message, sender: any, sendResponse: any) =>
            handler(message, sender, sendResponse) as any,
    );
}
