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

export function sendMessage<T extends Message>(message: T): Promise<any> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => resolve(response));
    });
}

export function onMessage(
    handler: (
        message: Message,
        sender: chrome.runtime.MessageSender,
        sendResponse?: (response?: any) => void
    ) => boolean | void
) {
    chrome.runtime.onMessage.addListener(
        (message: Message, sender, sendResponse) =>
            handler(message, sender, sendResponse) as any
    );
}

