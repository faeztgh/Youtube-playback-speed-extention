import { Check, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "./ActionButton";

export type SaveButtonProps = {
    onSave: () => void | Promise<void>;
    label?: string;
    savedLabel?: string;
    className?: string;
    disabled?: boolean;
    /** How long to show the "saved" state, in ms. */
    duration?: number;
};

export function SaveButton({
    onSave,
    label = "Save",
    savedLabel = "Saved",
    className = "",
    disabled = false,
    duration = 2000,
}: SaveButtonProps) {
    const [saved, setSaved] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    const handleClick = async () => {
        await onSave();
        setSaved(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setSaved(false), duration);
    };

    return (
        <ActionButton
            variant={saved ? "success" : "default"}
            className={className}
            disabled={disabled}
            onClick={handleClick}
        >
            {saved ? (
                <Check className="w-4 h-4" />
            ) : (
                <Save className="w-4 h-4" />
            )}
            <span className="ml-1">{saved ? savedLabel : label}</span>
        </ActionButton>
    );
}
