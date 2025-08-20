import { SpeedSlider } from "../../components/SpeedSlider";
import { PresetList } from "../../components/PresetList";
import { Panel } from "../../components/Panel";
import { Plus, Save, PlusCircle } from "lucide-react";
import { Input } from "../../components/Input";
import { ActionButton } from "../../components/ActionButton";

export type GeneralTabProps = {
    rates: number[];
    sliderRate: number;
    setSliderRate: (v: number) => void;
    defaultRate: number;
    apply: (v: number) => Promise<void>;
    onSave: () => Promise<void>;
    removeRate: (r: number) => void;
    customRateInput: string;
    setCustomRateInput: (s: string) => void;
    addCustomRate: () => void;
    addRate: () => void;
};

export const GeneralTab = (props: GeneralTabProps) => {
    const sliderMin = props.rates.length ? Math.min(0.1, ...props.rates) : 0.1;
    const sliderMax = props.rates.length ? Math.max(4, ...props.rates) : 4;

    return (
        <div className="mt-3">
            <Panel className="hover:shadow-md">
                <SpeedSlider
                    min={sliderMin}
                    max={sliderMax}
                    value={props.sliderRate}
                    onChange={async (v) => {
                        props.setSliderRate(v);
                        await props.apply(v);
                    }}
                    onClear={async () => {
                        props.setSliderRate(props.defaultRate);
                        await props.apply(props.defaultRate);
                    }}
                />
            </Panel>

            <div className="mt-4">
                <PresetList
                    presets={props.rates}
                    onSelect={async (r) => {
                        props.setSliderRate(r);
                        await props.apply(r);
                    }}
                    onRemove={props.removeRate}
                    currentRate={props.sliderRate}
                />
                <div className="flex gap-2 mt-3">
                    <Input
                        type="number"
                        uiSize="md"
                        step="0.05"
                        placeholder="Custom speed (e.g. 1.25)"
                        value={props.customRateInput}
                        onChange={(e) =>
                            props.setCustomRateInput(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") props.addCustomRate();
                        }}
                        className="flex-1 placeholder:text-neutral-400"
                        inputMode="decimal"
                        aria-label="Custom speed"
                    />
                    <ActionButton onClick={props.addCustomRate}>
                        <Plus className="w-4 h-4" />
                        <span className="ml-1">Add</span>
                    </ActionButton>
                    <ActionButton onClick={props.addRate}>
                        <PlusCircle className="w-4 h-4" />
                        <span className="ml-1">+0.25</span>
                    </ActionButton>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
                <div className="ml-auto">
                    <ActionButton onClick={props.onSave}>
                        <Save className="w-4 h-4" />
                        <span className="ml-1">Save</span>
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};
