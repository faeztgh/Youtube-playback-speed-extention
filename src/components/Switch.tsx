import { cn } from "../shared/cn";

export type SwitchProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
    "aria-label"?: string;
};

export const Switch = ({
    checked,
    onChange,
    disabled,
    className,
    "aria-label": ariaLabel,
}: SwitchProps) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                className,
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
                checked ? "bg-red-600" : "bg-neutral-300 dark:bg-neutral-700",
            )}
        >
            <span
                className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                    checked ? "translate-x-4" : "translate-x-0.5",
                )}
            />
        </button>
    );
};
