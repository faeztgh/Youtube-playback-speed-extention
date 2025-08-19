import { SpeedSlider } from "../../components/SpeedSlider";
import { PresetList } from "../../components/PresetList";
import { Button } from "../../components/Button";
import { Panel } from "../../components/Panel";

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
                    <input
                        type="number"
                        step="0.05"
                        placeholder="Custom speed (e.g. 1.25)"
                        value={props.customRateInput}
                        onChange={(e) =>
                            props.setCustomRateInput(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") props.addCustomRate();
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-md dark:border-neutral-800 dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                        inputMode="decimal"
                        aria-label="Custom speed"
                    />
                    <Button onClick={props.addCustomRate}>Add</Button>
                    <Button onClick={props.addRate}>+0.25</Button>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
                <div className="ml-auto">
                    <Button onClick={props.onSave}>Save</Button>
                </div>
            </div>
        </div>
    );
};
