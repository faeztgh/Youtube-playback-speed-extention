export type TabKey = string;

export type Tab = {
    key: TabKey;
    label: string;
    icon?: any;
};

export type TabsProps = {
    tabs: Tab[];
    value: TabKey;
    onChange: (key: TabKey) => void;
    className?: string;
};

export const Tabs = ({ tabs, value, onChange, className }: TabsProps) => {
    return (
        <div
            className={
                (className ?? "") +
                " flex gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800"
            }
        >
            {tabs.map((t) => {
                const active = t.key === value;
                return (
                    <button
                        key={t.key}
                        onClick={() => onChange(t.key)}
                        className={
                            "px-3 py-1.5 rounded-md text-sm transition " +
                            (active
                                ? "bg-white dark:bg-neutral-800 shadow border border-neutral-200 dark:border-neutral-700"
                                : "hover:bg-white/60 dark:hover:bg-neutral-800/60")
                        }
                        aria-selected={active}
                        role="tab"
                    >
                        <span className="flex items-center gap-2">
                            {t.icon}
                            <span>{t.label}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
