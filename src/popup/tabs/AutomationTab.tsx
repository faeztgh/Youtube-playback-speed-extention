import { useEffect, useState } from "react";
import {
    AutomationRule,
    ExtensionSettings,
    getSettings,
    setSettings,
} from "../../shared/storage";
import { sendMessage } from "../../shared/messaging";

const newRule = (): AutomationRule => ({
    id: crypto.randomUUID(),
    type: "channel",
    pattern: "",
    speed: 1,
});

export const AutomationTab = () => {
    const [settings, setLocal] = useState<ExtensionSettings | null>(null);
    const [draft, setDraft] = useState<AutomationRule>(newRule());
    const [drafts, setDrafts] = useState<Record<string, AutomationRule>>({});

    // Multi-add state
    const [multiType, setMultiType] =
        useState<AutomationRule["type"]>("channel");
    const [multiPatterns, setMultiPatterns] = useState("");
    const [multiSpeed, setMultiSpeed] = useState<number>(1);
    const [bulkCSV, setBulkCSV] = useState("");

    useEffect(() => {
        void getSettings().then(setLocal);
    }, []);

    const update = async (patch: Partial<ExtensionSettings>) => {
        if (!settings) return;
        const next = { ...settings, ...patch } as ExtensionSettings;
        setLocal(next);
        await setSettings(patch);
        try {
            await sendMessage({ type: "REAPPLY_AUTOMATION" });
        } catch {}
    };

    if (!settings) return null;

    const add = () => {
        if (!draft.pattern.trim()) return;
        void update({
            rules: [
                ...settings.rules,
                { ...draft, speed: Number(draft.speed) },
            ],
        });
        setDraft(newRule());
    };

    const remove = (id: string) =>
        void update({ rules: settings.rules.filter((r) => r.id !== id) });

    const edit = (id: string, patch: Partial<AutomationRule>) => {
        const rules = settings.rules.map((r) =>
            r.id === id ? { ...r, ...patch } : r
        );
        void update({ rules });
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
        void update({ rules: [...settings.rules, ...rules] });
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
        void update({ rules: [...settings.rules, ...out] });
        setBulkCSV("");
    };

    const startEdit = (rule: AutomationRule) => {
        setDrafts((prev) => ({ ...prev, [rule.id]: { ...rule } }));
    };

    const updateDraft = (id: string, patch: Partial<AutomationRule>) => {
        setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    };

    const saveDraft = (id: string) => {
        const d = drafts[id];
        const base = settings.rules.find((r) => r.id === id);
        if (!d || !base) return;
        const pattern = d.pattern.trim();
        const speed = Number(d.speed);
        if (!pattern || !Number.isFinite(speed)) return;
        edit(id, { type: d.type, pattern, speed });
        setDrafts((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const cancelDraft = (id: string) => {
        setDrafts((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
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
                    className="w-full min-h[200px] px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm"
                    placeholder={`Examples\nchannel,veritasium,1.5\ntitle,tutorial,1.75\nurl,youtu.be,1.25`}
                    value={bulkCSV}
                    rows={5}
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
                    {settings.rules.map((r) => {
                        const d = drafts[r.id] ?? r;
                        const hasChanges =
                            d.type !== r.type ||
                            d.pattern !== r.pattern ||
                            d.speed !== r.speed;
                        const canSave =
                            d.pattern.trim().length > 0 &&
                            Number.isFinite(Number(d.speed)) &&
                            hasChanges;
                        const isEditing = Boolean(drafts[r.id]);
                        return (
                            <div
                                key={r.id}
                                className="grid grid-cols-12 items-center gap-2 rounded-md border border-gray-200 dark:border-neutral-800 p-2 text-sm"
                            >
                                <select
                                    className="col-span-2 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                    value={d.type}
                                    onChange={(e) =>
                                        updateDraft(r.id, {
                                            type: e.target
                                                .value as AutomationRule["type"],
                                        })
                                    }
                                >
                                    <option value="channel">
                                        Channel contains
                                    </option>
                                    <option value="title">
                                        Title contains
                                    </option>
                                    <option value="url">URL contains</option>
                                </select>
                                <input
                                    className="col-span-4 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                    value={d.pattern}
                                    onChange={(e) =>
                                        updateDraft(r.id, {
                                            pattern: e.target.value,
                                        })
                                    }
                                />
                                <input
                                    type="number"
                                    step={0.05}
                                    className="col-span-2 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                    value={d.speed}
                                    onChange={(e) =>
                                        updateDraft(r.id, {
                                            speed: Number(e.target.value),
                                        })
                                    }
                                />
                                {!isEditing && (
                                    <button
                                        className="col-span-1 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() => startEdit(r)}
                                    >
                                        Edit
                                    </button>
                                )}
                                {isEditing && (
                                    <button
                                        className="col-span-1 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => saveDraft(r.id)}
                                        disabled={!canSave}
                                    >
                                        Save
                                    </button>
                                )}
                                {isEditing && (
                                    <button
                                        className="col-span-1 px-2 py-1 rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() => cancelDraft(r.id)}
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    className="w-fit px-2 py-1 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300"
                                    onClick={() => remove(r.id)}
                                >
                                    Remove
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
