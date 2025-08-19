import { XCircle } from "lucide-react";

export type PresetListProps = {
    presets: number[];
    onSelect: (value: number) => void;
    className?: string;
    onRemove?: (value: number) => void;
    currentRate?: number | null;
};

const isMatch = (a: number, b?: number | null) =>
    typeof b === "number" && Math.abs(a - b) < 1e-6;

export const PresetList = ({
    presets,
    onSelect,
    className,
    onRemove,
    currentRate = null,
}: PresetListProps) => {
    return (
        <div className={(className ?? "") + " flex flex-wrap gap-2"}>
            {presets.map((r) => {
                const matched = isMatch(r, currentRate);
                const base =
                    "px-3 py-2 flex justify-between items-center rounded-full border shadow-sm text-sm transition active:scale-[.98]";
                const theme = matched
                    ? "border-transparent bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 text-white"
                    : "border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800";
                return (
                    <div key={r} className="flex items-center gap-1">
                        <button
                            onClick={() => onSelect(r)}
                            className={`${base} ${theme}`}
                            aria-label={`Set speed ${r}x`}
                        >
                            {r}x
                            {onRemove && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove(r);
                                    }}
                                    className={`p-1 rounded-full ml-2 transition active:scale-[.98] text-xs ${
                                        matched
                                            ? "bg-white/20 text-white hover:bg-white/30"
                                            : "dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800"
                                    }`}
                                    aria-label={`Remove speed ${r}x`}
                                    title="Remove"
                                >
                                    <XCircle size={12} />
                                </button>
                            )}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

