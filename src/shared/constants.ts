export const YT_ALLOWED_SPEEDS: number[] = [
    0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
];

export function snapToYouTubeSpeed(value: number): number {
    // Allow any speed value instead of clamping to predefined speeds
    // This enables users to use custom speeds they've configured
    return Math.max(0.1, value);
}
