import { useEffect, useState } from "react";
import {
    AutomationRule,
    ExtensionSettings,
    getSettings,
    setSettings,
} from "../../shared/storage";
import { sendMessage } from "../../shared/messaging";
import { Plus, Upload, Pencil, Save, X, Trash2 } from "lucide-react";
import { ActionButton } from "../../components/ActionButton";

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
                <h4 className="mb-2 text-sm font-semibold">Add rule</h4>
                <div className="flex flex-wrap gap-2 text-sm">
                    <select
                        className="px-2 py-1 bg-white border border-gray-200 rounded-md dark:border-neutral-800 dark:bg-neutral-900 flex-[1_1_160px] min-w-[160px]"
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
                        className="px-2 py-1 bg-white border border-gray-200 rounded-md dark:border-neutral-800 dark:bg-neutral-900 flex-[2_1_260px] min-w-[200px] flex-grow"
                        placeholder="Pattern"
                        value={draft.pattern}
                        onChange={(e) =>
                            setDraft({ ...draft, pattern: e.target.value })
                        }
                    />
                    <div className="flex items-center gap-2 flex-[1_1_160px] min-w-[140px]">
                        <input
                            type="number"
                            step={0.05}
                            className="px-2 py-1 bg-white max-w-[50px] border border-gray-200 rounded-md w-fit dark:border-neutral-800 dark:bg-neutral-900"
                            placeholder="Speed"
                            value={draft.speed}
                            onChange={(e) =>
                                setDraft({
                                    ...draft,
                                    speed: Number(e.target.value),
                                })
                            }
                        />
                        <ActionButton onClick={add}>
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                        </ActionButton>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="mb-2 text-sm font-semibold">
                    Add multiple patterns (same speed)
                </h4>
                <div className="flex flex-wrap gap-2 text-sm">
                    <select
                        className="px-2 py-1 bg-white border border-gray-200 rounded-md dark:border-neutral-800 dark:bg-neutral-900 flex-[1_1_160px] min-w-[160px]"
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
                        className="px-2 py-1 bg-white border border-gray-200 rounded-md dark:border-neutral-800 dark:bg-neutral-900 flex-[2_1_260px] min-w-[200px] flex-grow"
                        placeholder="Comma or newline separated patterns"
                        value={multiPatterns}
                        onChange={(e) => setMultiPatterns(e.target.value)}
                    />
                    <div className="flex items-center gap-2 flex-[1_1_160px] min-w-[140px]">
                        <input
                            type="number"
                            step={0.05}
                            className="px-2 py-1 max-w-[50px] bg-white border border-gray-200 rounded-md w-fit dark:border-neutral-800 dark:bg-neutral-900"
                            placeholder="Speed"
                            value={multiSpeed}
                            onChange={(e) =>
                                setMultiSpeed(Number(e.target.value))
                            }
                        />
                        <ActionButton onClick={addMultiple}>
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                        </ActionButton>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="mb-2 text-sm font-semibold">
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
                    <ActionButton onClick={importCSV}>
                        <Upload className="w-4 h-4" />
                        <span>Import</span>
                    </ActionButton>
                </div>
            </div>

            <div>
                <h4 className="mb-2 text-sm font-semibold">Rules</h4>
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
                                className="flex flex-wrap items-center gap-2 p-2 text-sm border border-gray-200 rounded-md dark:border-neutral-800"
                            >
                                <select
                                    className="px-2 py-1 bg-white border border-gray-200 rounded-md dark:border-neutral-800 dark:bg-neutral-900 flex-[1_1_160px] min-w-[160px]"
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
                                    className="px-2 py-1 bg-white border border-gray-200 rounded-md dark:border-neutral-800 dark:bg-neutral-900 flex-[2_1_260px] min-w-[200px] flex-grow"
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
                                    className="w-24 px-2 py-1 max-w-[50px] bg-white border border-gray-200 rounded-md dark:border-neutral-800 dark:bg-neutral-900"
                                    value={d.speed}
                                    onChange={(e) =>
                                        updateDraft(r.id, {
                                            speed: Number(e.target.value),
                                        })
                                    }
                                />
                                {!isEditing && (
                                    <ActionButton onClick={() => startEdit(r)}>
                                        <Pencil className="w-4 h-4" />
                                        <span>Edit</span>
                                    </ActionButton>
                                )}
                                {isEditing && (
                                    <ActionButton
                                        variant="success"
                                        onClick={() => saveDraft(r.id)}
                                        disabled={!canSave}
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>Save</span>
                                    </ActionButton>
                                )}
                                {isEditing && (
                                    <ActionButton
                                        onClick={() => cancelDraft(r.id)}
                                    >
                                        <X className="w-4 h-4" />
                                        <span>Cancel</span>
                                    </ActionButton>
                                )}
                                <ActionButton
                                    variant="danger"
                                    onClick={() => remove(r.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Remove</span>
                                </ActionButton>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
