import { forwardRef, InputHTMLAttributes } from "react";

type InputSize = "sm" | "md";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    uiSize?: InputSize;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", uiSize = "sm", ...rest }, ref) => {
        const base =
            "bg-white border border-gray-200 rounded-md dark:border-neutral-800 dark:bg-neutral-900 focus:outline-none";
        const sizeCls =
            uiSize === "md"
                ? "px-3 py-2 focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                : "px-2 py-1";
        return (
            <input
                ref={ref}
                className={`${base} ${sizeCls} ${className}`}
                {...rest}
            />
        );
    }
);

Input.displayName = "Input";
