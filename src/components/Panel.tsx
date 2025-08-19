import { PropsWithChildren } from "react";

export function Panel({
    children,
    className = "",
}: PropsWithChildren<{ className?: string }>) {
    return (
        <div
            className={`p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm ${className}`}
        >
            {children}
        </div>
    );
}
