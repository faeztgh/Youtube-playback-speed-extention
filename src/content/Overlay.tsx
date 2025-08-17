import { SpeedSlider } from "../components/SpeedSlider";
import { PresetList } from "../components/PresetList";

export type OverlayProps = {
    currentRate: number;
    onChange: (rate: number) => void;
    presets: number[];
    rightPx: number;
    bottomPx: number;
    opacity: number; // 0..1
    visible: boolean;
    autoHide: boolean;
};

export const Overlay = ({
    currentRate,
    onChange,
    presets,
    rightPx,
    bottomPx,
    opacity,
    visible,
    autoHide,
}: OverlayProps) => {
    if (!visible) return null;
    return (
        <div
            className={
                "fixed z-[2147483647] font-sans transition-opacity " +
                (autoHide ? "opacity-0 hover:opacity-100" : "")
            }
            style={{ right: rightPx, bottom: bottomPx }}
        >
            <div
                className="text-white border border-neutral-700 rounded-xl p-2.5 shadow-2xl backdrop-blur-sm"
                style={{ background: "rgba(0,0,0,0.90)", opacity }}
            >
                <SpeedSlider
                    label="Speed"
                    min={0.1}
                    max={4}
                    value={currentRate}
                    onChange={onChange}
                    className=""
                    valueClassName="!w-auto min-w-[48px]"
                />
                <PresetList
                    presets={presets}
                    onSelect={onChange}
                    className="mt-2"
                />
            </div>
        </div>
    );
};
