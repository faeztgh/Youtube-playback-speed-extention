import { useEffect, useMemo, useState } from "react";
import {
    AutomationRule,
    ExtensionSettings,
    getSettings,
    setSettings,
} from "../../shared/storage";

const newRule = (): AutomationRule => ({
    id: crypto.randomUUID(),
    type: "channel",
    pattern: "",
    speed: 1,
});

export const AutomationTab = () => {
    const [settings, setLocal] = useState<ExtensionSettings | null>(null);
    const [draft, setDraft] = useState<AutomationRule>(newRule());

    // Multi-add state
    const [multiType, setMultiType] =
        useState<AutomationRule["type"]>("channel");
    const [multiPatterns, setMultiPatterns] = useState("");
    const [multiSpeed, setMultiSpeed] = useState<number>(1);
    const [bulkCSV, setBulkCSV] = useState("");

    useEffect(() => {
        void getSettings().then(setLocal);
    }, []);

    const update = (patch: Partial<ExtensionSettings>) => {
        if (!settings) return;
        const next = { ...settings, ...patch } as ExtensionSettings;
        setLocal(next);
        void setSettings(patch);
    };

    if (!settings) return null;

    const add = () => {
        if (!draft.pattern.trim()) return;
        update({
            rules: [
                ...settings.rules,
                { ...draft, speed: Number(draft.speed) },
            ],
        });
        setDraft(newRule());
    };

    const remove = (id: string) =>
        update({ rules: settings.rules.filter((r) => r.id !== id) });

    const edit = (id: string, patch: Partial<AutomationRule>) => {
        const rules = settings.rules.map((r) =>
            r.id === id ? { ...r, ...patch } : r
        );
        update({ rules });
    };

    const addMultiple = () => {
        const patterns = multiPatterns
            .split(/[\,\n]/)
            .map((s) => s.trim())
            .filter(Boolean);
        if (patterns.length === 0) return;
        const rules: AutomationRule[] = patterns.map((p) => ({
            id: crypto.randomUUID(),
            type: multiType,
            pattern: p,
            speed: Number(multiSpeed),
        }));
        update({ rules: [...settings.rules, ...rules] });
        setMultiPatterns("");
    };

    const importCSV = () => {
        // Accept lines like: type,pattern,speed
        const lines = bulkCSV
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
        if (lines.length === 0) return;
        const out: AutomationRule[] = [];
        for (const line of lines) {
            const parts = line.split(/[\t,]/).map((p) => p.trim());
            if (parts.length < 3) continue;
            const [typeRaw, pattern, speedRaw] = parts;
            const type =
                (typeRaw.toLowerCase() as AutomationRule["type"]) || "title";
            if (!["title", "channel", "url"].includes(type)) continue;
            const speed = Number(speedRaw);
            if (!pattern || !Number.isFinite(speed)) continue;
            out.push({ id: crypto.randomUUID(), type, pattern, speed });
        }
        if (out.length === 0) return;
        update({ rules: [...settings.rules, ...out] });
        setBulkCSV("");
    };

    return (
        <div className="mt-3 space-y-5">
            <div>
                <h4 className="text-sm font-semibold mb-2">Add rule</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <select
                        className="px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                        value={draft.type}
                        onChange={(e) =>
                            setDraft({
                                ...draft,
                                type: e.target.value as AutomationRule["type"],
                            })
                        }
                    >
                        <option value="channel">Channel contains</option>
                        <option value="title">Title contains</option>
                        <option value="url">URL contains</option>
                    </select>
                    <input
                        className="px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                        placeholder="Pattern"
                        value={draft.pattern}
                        onChange={(e) =>
                            setDraft({ ...draft, pattern: e.target.value })
                        }
                    />
                    <div className="flex gap-2">
                        <input
                            type="number"
                            step={0.05}
                            className="flex-1 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                            placeholder="Speed"
                            value={draft.speed}
                            onChange={(e) =>
                                setDraft({
                                    ...draft,
                                    speed: Number(e.target.value),
                                })
                            }
                        />
                        <button
                            className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                            onClick={add}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-semibold mb-2">
                    Add multiple patterns (same speed)
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <select
                        className="px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                        value={multiType}
                        onChange={(e) =>
                            setMultiType(
                                e.target.value as AutomationRule["type"]
                            )
                        }
                    >
                        <option value="channel">Channel contains</option>
                        <option value="title">Title contains</option>
                        <option value="url">URL contains</option>
                    </select>
                    <input
                        className="px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                        placeholder="Comma or newline separated patterns"
                        value={multiPatterns}
                        onChange={(e) => setMultiPatterns(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <input
                            type="number"
                            step={0.05}
                            className="flex-1 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                            placeholder="Speed"
                            value={multiSpeed}
                            onChange={(e) =>
                                setMultiSpeed(Number(e.target.value))
                            }
                        />
                        <button
                            className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                            onClick={addMultiple}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-semibold mb-2">
                    Bulk import (CSV or tab: type,pattern,speed)
                </h4>
                <textarea
                    className="w-full min-h-[120px] px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm"
                    placeholder={`Examples\nchannel,veritasium,1.5\ntitle,tutorial,1.75\nurl,youtu.be,1.25`}
                    value={bulkCSV}
                    onChange={(e) => setBulkCSV(e.target.value)}
                />
                <div className="mt-2">
                    <button
                        className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                        onClick={importCSV}
                    >
                        Import
                    </button>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-semibold mb-2">Rules</h4>
                <div className="space-y-2">
                    {settings.rules.length === 0 && (
                        <div className="text-sm text-neutral-500">
                            No rules yet.
                        </div>
                    )}
                    {settings.rules.map((r) => (
                        <div
                            key={r.id}
                            className="grid grid-cols-12 items-center gap-2 rounded-md border border-gray-200 dark:border-neutral-800 p-2 text-sm"
                        >
                            <select
                                className="col-span-3 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                value={r.type}
                                onChange={(e) =>
                                    edit(r.id, {
                                        type: e.target
                                            .value as AutomationRule["type"],
                                    })
                                }
                            >
                                <option value="channel">
                                    Channel contains
                                </option>
                                <option value="title">Title contains</option>
                                <option value="url">URL contains</option>
                            </select>
                            <input
                                className="col-span-5 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                value={r.pattern}
                                onChange={(e) =>
                                    edit(r.id, { pattern: e.target.value })
                                }
                            />
                            <input
                                type="number"
                                step={0.05}
                                className="col-span-2 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                value={r.speed}
                                onChange={(e) =>
                                    edit(r.id, {
                                        speed: Number(e.target.value),
                                    })
                                }
                            />
                            <button
                                className="col-span-2 px-2 py-1 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300"
                                onClick={() => remove(r.id)}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
