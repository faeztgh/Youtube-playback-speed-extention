import { X } from "lucide-react";

export type SpeedSliderProps = {
    label?: string;
    min: number;
    max: number;
    step?: number;
    value: number;
    onChange: (v: number) => void;
    className?: string;
    valueClassName?: string;
    onClear?: () => void;
};

export const SpeedSlider = ({
    label = "Speed",
    min,
    max,
    step = 0.05,
    value,
    onChange,
    className,
    valueClassName,
    onClear,
}: SpeedSliderProps) => {
    return (
        <div className={"flex items-center gap-2 " + (className ?? "")}>
            <span className="w-12 text-xs text-neutral-600 dark:text-neutral-400">
                {label}
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="flex-1 accent-neutral-900 dark:accent-white"
                aria-label="Playback speed"
            />
            <span
                className={
                    "w-12 text-right tabular-nums " + (valueClassName ?? "")
                }
            >
                {value.toFixed(2)}x
            </span>
            {onClear && (
                <button
                    onClick={onClear}
                    className="px-2 py-1 rounded-full border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 hover:text-neutral-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-800 transition active:scale-[.98]"
                    aria-label="Reset speed"
                    title="Reset"
                >
                    ×
                </button>
            )}
        </div>
    );
};
