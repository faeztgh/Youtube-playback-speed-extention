import { ButtonHTMLAttributes, PropsWithChildren } from "react";

export type ActionVariant = "default" | "danger" | "success";

type ActionButtonProps = PropsWithChildren<
    ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: ActionVariant;
    }
>;

const classesByVariant: Record<ActionVariant, string> = {
    default:
        "border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800",
    danger: "border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300",
    success:
        "border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
};

export function ActionButton({
    variant = "default",
    className = "",
    children,
    ...rest
}: ActionButtonProps) {
    const base =
        "px-3 py-1.5 rounded-md transition active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5";
    const variantCls = classesByVariant[variant];
    return (
        <button className={`${base} ${variantCls} ${className}`} {...rest}>
            {children}
        </button>
    );
}
