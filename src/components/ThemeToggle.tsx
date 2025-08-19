import type { ThemeMode } from "../shared/storage";

export type ThemeToggleProps = {
    value: ThemeMode;
    onChange: (mode: ThemeMode) => void;
    className?: string;
};

const Icon = ({ mode }: { mode: ThemeMode }) => {
    if (mode === "light") {
        return (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12 4V2M12 22v-2M4 12H2M22 12h-2M5.64 5.64 4.22 4.22M19.78 19.78l-1.42-1.42M18.36 5.64l1.42-1.42M4.22 19.78l1.42-1.42"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
                <circle
                    cx="12"
                    cy="12"
                    r="4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                />
            </svg>
        );
    }
    if (mode === "dark") {
        return (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="currentColor"
                />
            </svg>
        );
    }
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path d="M3 15h18" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
};

export const ThemeToggle = ({
    value,
    onChange,
    className,
}: ThemeToggleProps) => {
    const modes: ThemeMode[] = ["system", "light", "dark"];
    return (
        <div
            className={
                (className ?? "") +
                " flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 p-0.5"
            }
            role="group"
            aria-label="Theme"
        >
            {modes.map((mode) => {
                const active = value === mode;
                return (
                    <button
                        key={mode}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(mode)}
                        className={
                            "w-8 h-8 grid place-items-center rounded-md text-white/85 transition " +
                            (active
                                ? "bg-white !text-[#0f0f0f] shadow ring-1 ring-white/50"
                                : "hover:bg-white/10 active:bg-white/20")
                        }
                        title={mode[0].toUpperCase() + mode.slice(1)}
                        aria-label={mode}
                    >
                        <Icon mode={mode} />
                    </button>
                );
            })}
        </div>
    );
};
