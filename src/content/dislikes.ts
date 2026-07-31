import { type DislikeData, sendMessage } from "../shared/messaging";
import { getVideoIdFromUrl } from "../shared/youtube";

const BAR_ID = "ypc-counts-bar";
const INJECTED_IDS = [BAR_ID];

type Vote = { likes?: number; dislikes: number };

let enabled = false;
let observer: MutationObserver | null = null;
let interval: ReturnType<typeof setInterval> | null = null;
let scheduled = false;
let cache: { videoId: string; vote: Vote } | null = null;
const inflight = new Set<string>();

function formatFull(n: number): string {
    try {
        return new Intl.NumberFormat().format(n);
    } catch {
        return String(n);
    }
}

function isVisible(el: HTMLElement): boolean {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
}

function findButton(kind: "like" | "dislike"): HTMLElement | null {
    const candidates =
        kind === "dislike"
            ? [
                  "ytd-reel-video-renderer[is-active] dislike-button-view-model button",
                  "ytd-reel-video-renderer[is-active] #dislike-button button",
                  "dislike-button-view-model button",
                  "segmented-like-dislike-button-view-model button:nth-of-type(2)",
                  "#segmented-dislike-button button",
                  "#top-level-buttons-computed dislike-button-view-model button",
                  "ytd-toggle-button-renderer#dislike-button button",
                  "#menu ytd-toggle-button-renderer:nth-of-type(2) button",
              ]
            : [
                  "ytd-reel-video-renderer[is-active] like-button-view-model button",
                  "ytd-reel-video-renderer[is-active] #like-button button",
                  "like-button-view-model button",
                  "segmented-like-dislike-button-view-model button:nth-of-type(1)",
                  "#segmented-like-button button",
                  "#top-level-buttons-computed like-button-view-model button",
                  "ytd-toggle-button-renderer#like-button button",
                  "#menu ytd-toggle-button-renderer:nth-of-type(1) button",
              ];
    for (const sel of candidates) {
        const els = Array.from(document.querySelectorAll<HTMLElement>(sel));
        const vis = els.find(isVisible);
        if (vis) return vis;
    }
    return findButtonByAria(kind);
}

function findButtonByAria(kind: "like" | "dislike"): HTMLElement | null {
    const scopeSel =
        kind === "dislike"
            ? "dislike-button-view-model, toggle-button-view-model"
            : "like-button-view-model, toggle-button-view-model";
    const scopes = Array.from(document.querySelectorAll<HTMLElement>(scopeSel));
    for (const scope of scopes) {
        const btn = scope.querySelector<HTMLElement>("button");
        if (!btn || !isVisible(btn)) continue;
        const label = (
            btn.getAttribute("aria-label") ||
            btn.getAttribute("title") ||
            scope.getAttribute("aria-label") ||
            ""
        ).toLowerCase();
        const isDislike = label.includes("dislike");
        if (kind === "dislike" && isDislike) return btn;
        if (kind === "like" && label.includes("like") && !isDislike) return btn;
    }
    const allButtons = Array.from(
        document.querySelectorAll<HTMLElement>("button"),
    );
    for (const btn of allButtons) {
        if (!isVisible(btn)) continue;
        const label = (
            btn.getAttribute("aria-label") ||
            btn.getAttribute("title") ||
            ""
        ).toLowerCase();
        if (!label) continue;
        const isDislike = label.includes("dislike");
        if (kind === "dislike" && isDislike) return btn;
        if (kind === "like" && label.includes("like") && !isDislike) return btn;
    }
    return null;
}

function removeInjected() {
    for (const id of INJECTED_IDS) {
        document.querySelectorAll(`#${id}`).forEach((el) => {
            el.remove();
        });
    }
}

const BAR_CSS =
    "display:inline-flex!important;align-items:center;gap:14px;" +
    "flex:0 0 auto;margin-inline-start:12px;padding:6px 12px;" +
    "border-radius:18px;background:var(--yt-spec-badge-chip-background,rgba(0,0,0,.05));" +
    "color:var(--yt-spec-text-primary,inherit);" +
    "font-size:1.4rem;font-weight:500;line-height:2rem;white-space:nowrap;";

function findOwnerRow(): HTMLElement | null {
    const selectors = [
        "ytd-watch-metadata #owner",
        "ytd-watch-metadata #subscribe-button",
        "ytd-watch-metadata ytd-subscribe-button-renderer",
    ];
    for (const sel of selectors) {
        const el = document.querySelector<HTMLElement>(sel);
        if (el && isVisible(el)) return el;
    }
    return null;
}

function renderCounts(vote: Vote): HTMLElement | null {
    const owner = findOwnerRow();
    if (!owner) return null;

    let bar = document.getElementById(BAR_ID);
    if (!bar?.isConnected) {
        bar = document.createElement("div");
        bar.id = BAR_ID;
    }
    bar.style.cssText = BAR_CSS;
    const likeText =
        typeof vote.likes === "number" ? formatFull(vote.likes) : "—";
    const wanted = `👍 ${likeText} 👎 ${formatFull(vote.dislikes)}`;
    if (bar.textContent !== wanted) bar.textContent = wanted;

    if (owner.lastElementChild !== bar) {
        owner.appendChild(bar);
    }
    return bar;
}

function applyVote(vote: Vote) {
    renderCounts(vote);
}

async function update() {
    if (!enabled) return;
    const videoId = getVideoIdFromUrl(location.href);
    if (!videoId) {
        removeInjected();
        cache = null;
        return;
    }

    if (cache && cache.videoId === videoId) {
        applyVote(cache.vote);
        return;
    }

    if (inflight.has(videoId)) return;
    if (!findButton("dislike") && !findButton("like")) return;

    inflight.add(videoId);
    try {
        const data = (await sendMessage({
            type: "FETCH_DISLIKES",
            videoId,
        })) as DislikeData | null;
        if (!enabled || getVideoIdFromUrl(location.href) !== videoId) return;
        if (!data || typeof data.dislikes !== "number") return;
        cache = {
            videoId,
            vote: {
                likes: typeof data.likes === "number" ? data.likes : undefined,
                dislikes: data.dislikes,
            },
        };
        applyVote(cache.vote);
    } finally {
        inflight.delete(videoId);
    }
}

function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
        scheduled = false;
        void update();
    });
}

function startObserving() {
    if (observer) return;
    observer = new MutationObserver(() => schedule());
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
    if (interval === null) interval = setInterval(schedule, 1000);
    schedule();
}

function stopObserving() {
    observer?.disconnect();
    observer = null;
    if (interval !== null) {
        clearInterval(interval);
        interval = null;
    }
}

export function setDislikeCountsEnabled(value: boolean) {
    if (value === enabled) return;
    enabled = value;
    if (enabled) {
        startObserving();
    } else {
        stopObserving();
        removeInjected();
        cache = null;
    }
}

export function refreshDislikeCounts() {
    if (!enabled) return;
    removeInjected();
    cache = null;
    schedule();
}
