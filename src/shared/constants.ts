export const YT_ALLOWED_SPEEDS: number[] = [
    0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
];

export function snapToYouTubeSpeed(value: number): number {
    const allowed = YT_ALLOWED_SPEEDS;
    const clamped = Math.min(
        allowed[allowed.length - 1],
        Math.max(allowed[0], value)
    );
    return allowed.reduce(
        (prev, curr) =>
            Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev,
        allowed[0]
    );
}
