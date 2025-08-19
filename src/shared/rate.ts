import { setPlaybackRate } from "./youtube";
import { formatBadgeText } from "./badge";

export async function applyRate(rate: number): Promise<void> {
    try {
        // Try the tab-messaging path (works from popup/background)
        if (chrome?.tabs?.query) {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            if (tab?.id) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: "SET_PLAYBACK_RATE",
                        rate,
                    });
                    await chrome.action.setBadgeBackgroundColor({
                        tabId: tab.id,
                        color: "#111827",
                    });
                    if ((chrome.action as any).setBadgeTextColor) {
                        await (chrome.action as any).setBadgeTextColor({
                            tabId: tab.id,
                            color: "#FFFFFF",
                        });
                    }
                    await chrome.action.setBadgeText({
                        tabId: tab.id,
                        text: formatBadgeText(rate),
                    });
                    return;
                } catch {
                    // Fallback: inject script to set rate directly if content script isn't ready
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            func: (r: number) => {
                                const v = document.querySelector(
                                    "video"
                                ) as HTMLVideoElement | null;
                                if (v) {
                                    v.playbackRate = r;
                                    v.dispatchEvent(new Event("ratechange"));
                                }
                            },
                            args: [rate],
                        });
                        await chrome.action.setBadgeBackgroundColor({
                            tabId: tab.id,
                            color: "#111827",
                        });
                        if ((chrome.action as any).setBadgeTextColor) {
                            await (chrome.action as any).setBadgeTextColor({
                                tabId: tab.id,
                                color: "#FFFFFF",
                            });
                        }
                        await chrome.action.setBadgeText({
                            tabId: tab.id,
                            text: formatBadgeText(rate),
                        });
                        return;
                    } catch {
                        // fall through to local set
                    }
                }
            }
        }
    } catch {
        // ignore and fall through
    }
    // Local content-script path
    setPlaybackRate(rate);
}
