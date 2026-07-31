import { applyActionBadge } from "./badge";
import { browserNs } from "./messaging";
import { setPlaybackRate } from "./youtube";

export async function applyRate(rate: number): Promise<void> {
    try {
        if (browserNs?.tabs?.query) {
            const [tab] = await browserNs.tabs.query({
                active: true,
                currentWindow: true,
            });
            if (tab?.id) {
                await browserNs.tabs.sendMessage(tab.id, {
                    type: "SET_PLAYBACK_RATE",
                    rate,
                });
                await applyActionBadge(browserNs.action, tab.id, rate);
                return;
            }
        }
    } catch {}
    setPlaybackRate(rate);
}
