export type ToggleSwitchProps = {
    checked: boolean;
    onChange: (next: boolean) => void;
    ariaLabel?: string;
};

export const ToggleSwitch = ({
    checked,
    onChange,
    ariaLabel,
}: ToggleSwitchProps) => {
    return (
        <label className="relative inline-flex items-center h-5 w-9 select-none">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                aria-label={ariaLabel}
            />
            <span className="absolute inset-0 rounded-full bg-gray-400/60 peer-checked:bg-white transition-colors"></span>
            <span className="absolute top-0.5 left-0.5 h-4 w-4 bg-[#0f0f0f] rounded-full shadow transition-transform peer-checked:translate-x-4"></span>
        </label>
    );
};
