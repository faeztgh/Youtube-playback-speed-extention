export type Message =
    | { type: "SET_PLAYBACK_RATE"; rate: number }
    | { type: "GET_PLAYBACK_RATE" }
    | { type: "CURRENT_PLAYBACK_RATE"; rate: number }
    | { type: "PING" };

export function sendMessage<T extends Message>(message: T): Promise<any> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => resolve(response));
    });
}

export function onMessage(
    handler: (message: Message, sender: chrome.runtime.MessageSender) => void
) {
    chrome.runtime.onMessage.addListener((message: Message, sender) =>
        handler(message, sender)
    );
}

