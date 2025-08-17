import { snapToYouTubeSpeed } from "./constants";

type ReverseController = {
    rafId: number | null;
    lastTimestampMs: number | null;
    speedAbs: number; // positive magnitude, e.g., 1 = 1x reverse
};

function getActiveVideoElement(): HTMLVideoElement | null {
    const video = document.querySelector(
        "video.html5-main-video"
    ) as HTMLVideoElement | null;
    if (video && !Number.isNaN(video.playbackRate)) return video;
    return document.querySelector("video") as HTMLVideoElement | null;
}

function getReverseController(
    video: HTMLVideoElement
): ReverseController | null {
    return (video as any).__reverseController ?? null;
}

function setReverseController(
    video: HTMLVideoElement,
    controller: ReverseController | null
) {
    (video as any).__reverseController = controller;
}

function stopReversePlayback(video: HTMLVideoElement) {
    const controller = getReverseController(video);
    if (controller?.rafId) cancelAnimationFrame(controller.rafId);
    setReverseController(video, null);
}

function startReversePlayback(video: HTMLVideoElement, speedAbs: number) {
    stopReversePlayback(video);
    const controller: ReverseController = {
        rafId: null,
        lastTimestampMs: null,
        speedAbs,
    };
    setReverseController(video, controller);

    try {
        video.pause();
    } catch {}

    const step = (ts: number) => {
        if (!document.contains(video)) {
            stopReversePlayback(video);
            return;
        }
        const current = getReverseController(video);
        if (!current) return;
        const last = current.lastTimestampMs ?? ts;
        const deltaSec = Math.min(0.25, Math.max(0, (ts - last) / 1000));
        current.lastTimestampMs = ts;

        const backwards = deltaSec * current.speedAbs;
        const newTime = Math.max(0, video.currentTime - backwards);
        video.currentTime = newTime;

        current.rafId = requestAnimationFrame(step);
    };
    controller.rafId = requestAnimationFrame(step);
}

export function setPlaybackRate(rate: number): boolean {
    const video = getActiveVideoElement();
    if (!video) return false;

    if (rate < 0) {
        const abs = Math.abs(rate);
        video.playbackRate = 0;
        startReversePlayback(video, abs);
        video.dispatchEvent(new Event("ratechange"));
        return true;
    }

    stopReversePlayback(video);
    const ytRate = snapToYouTubeSpeed(rate);
    video.playbackRate = ytRate;
    video.dispatchEvent(new Event("ratechange"));
    return true;
}

export function getPlaybackRate(): number | null {
    const video = getActiveVideoElement();
    if (!video) return null;
    const controller = getReverseController(video);
    if (controller) return -controller.speedAbs;
    return video.playbackRate;
}

export function onVideoReady(callback: () => void) {
    if (getActiveVideoElement()) {
        callback();
        return;
    }
    const observer = new MutationObserver(() => {
        if (getActiveVideoElement()) {
            observer.disconnect();
            callback();
        }
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
}
