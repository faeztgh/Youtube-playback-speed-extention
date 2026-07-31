export function snapToYouTubeSpeed(value: number): number {
    // No clamping to YT presets — allow custom speeds; enforce a 0.1 minimum.
    return Math.max(0.1, value);
}
