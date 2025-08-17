import { X, XCircle } from "lucide-react";

export type PresetListProps = {
    presets: number[];
    onSelect: (value: number) => void;
    className?: string;
    onRemove?: (value: number) => void;
};

export const PresetList = ({
    presets,
    onSelect,
    className,
    onRemove,
}: PresetListProps) => {
    return (
        <div className={(className ?? "") + " flex flex-wrap gap-2"}>
            {presets.map((r) => (
                <div key={r} className="flex items-center gap-1">
                    <button
                        onClick={() => onSelect(r)}
                        className="px-3 py-2 flex justify-between items-center rounded-full border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm text-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition active:scale-[.98]"
                        aria-label={`Set speed ${r}x`}
                    >
                        {r}x
                        {onRemove && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(r);
                                }}
                                className="p-1 rounded-full dark:border-neutral-800 ml-2 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition active:scale-[.98] text-xs"
                                aria-label={`Remove speed ${r}x`}
                                title="Remove"
                            >
                                <XCircle size={12} />
                            </button>
                        )}
                    </button>
                </div>
            ))}
        </div>
    );
};
