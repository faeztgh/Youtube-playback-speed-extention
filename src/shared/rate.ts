import { setPlaybackRate } from "./youtube";
import { formatBadgeText } from "./badge";

const browserNs: any = (globalThis as any).browser ?? chrome;

export async function applyRate(rate: number): Promise<void> {
    try {
        // Try the tab-messaging path (works from popup/background)
        if (browserNs?.tabs?.query) {
            const [tab] = await browserNs.tabs.query({
                active: true,
                currentWindow: true,
            });
            if (tab?.id) {
                try {
                    await browserNs.tabs.sendMessage(tab.id, {
                        type: "SET_PLAYBACK_RATE",
                        rate,
                    });
                    await browserNs.action.setBadgeBackgroundColor({
                        tabId: tab.id,
                        color: "#111827",
                    });
                    if (browserNs.action?.setBadgeTextColor) {
                        await browserNs.action.setBadgeTextColor({
                            tabId: tab.id,
                            color: "#FFFFFF",
                        });
                    }
                    await browserNs.action.setBadgeText({
                        tabId: tab.id,
                        text: formatBadgeText(rate),
                    });
                    return;
                } catch {
                    // Fallback: inject script to set rate directly if content script isn't ready
                    try {
                        if (browserNs.scripting?.executeScript) {
                            await browserNs.scripting.executeScript({
                                target: { tabId: tab.id },
                                func: (r: number) => {
                                    const v = document.querySelector(
                                        "video"
                                    ) as HTMLVideoElement | null;
                                    if (v) {
                                        v.playbackRate = r;
                                        v.dispatchEvent(
                                            new Event("ratechange")
                                        );
                                    }
                                },
                                args: [rate],
                            });
                        }
                        await browserNs.action.setBadgeBackgroundColor({
                            tabId: tab.id,
                            color: "#111827",
                        });
                        if (browserNs.action?.setBadgeTextColor) {
                            await browserNs.action.setBadgeTextColor({
                                tabId: tab.id,
                                color: "#FFFFFF",
                            });
                        }
                        await browserNs.action.setBadgeText({
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
