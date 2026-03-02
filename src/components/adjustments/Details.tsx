import Slider from '../ui/Slider';
import { Adjustments, DetailsAdjustment } from '../../utils/adjustments';
import { AppSettings } from '../ui/AppProperties';

interface DetailsPanelProps {
  adjustments: Adjustments;
  setAdjustments(adjustments: Partial<Adjustments>): any;
  appSettings: AppSettings | null;
  isForMask?: boolean;
  onDragStateChange?: (isDragging: boolean) => void;
}

export default function DetailsPanel({
  adjustments,
  setAdjustments,
  appSettings,
  isForMask = false,
  onDragStateChange,
}: DetailsPanelProps) {
  const handleAdjustmentChange = (key: string, value: number) => {
    setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, [key]: Math.trunc(value) }));
  };

  const adjustmentVisibility = appSettings?.adjustmentVisibility || {};

  return (
    <div>
      {adjustmentVisibility.sharpening !== false && (
        <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
          <p className="text-md font-semibold mb-2 text-primary">Sharpening</p>
          <Slider
            label="Sharpness"
            max={100}
            min={-100}
            onChange={(value) => handleAdjustmentChange(DetailsAdjustment.Sharpness, value)}
            step={1}
            value={adjustments.sharpness}
            onDragStateChange={onDragStateChange}
          />
        </div>
      )}

      {adjustmentVisibility.presence !== false && (
        <div className="p-2 bg-bg-tertiary rounded-md">
          <p className="text-md font-semibold mb-2 text-primary">Presence</p>
          <Slider
            label="Clarity"
            max={100}
            min={-100}
            onChange={(value) => handleAdjustmentChange(DetailsAdjustment.Clarity, value)}
            step={1}
            value={adjustments.clarity}
            onDragStateChange={onDragStateChange}
          />
          <Slider
            label="Dehaze"
            max={100}
            min={-100}
            onChange={(value) => handleAdjustmentChange(DetailsAdjustment.Dehaze, value)}
            step={1}
            value={adjustments.dehaze}
            onDragStateChange={onDragStateChange}
          />
          <Slider
            label="Structure"
            max={100}
            min={-100}
            onChange={(value) => handleAdjustmentChange(DetailsAdjustment.Structure, value)}
            step={1}
            value={adjustments.structure}
            onDragStateChange={onDragStateChange}
          />
          {!isForMask && (
            <Slider
              label="Centré"
              max={100}
              min={-100}
              onChange={(value) => handleAdjustmentChange(DetailsAdjustment.Centré, value)}
              step={1}
              value={adjustments.centré}
              onDragStateChange={onDragStateChange}
            />
          )}
        </div>
      )}

      {/* Hide noise reduction to stop people from thinking it exists
      {adjustmentVisibility.noiseReduction !== false && (
        <div className="p-2 bg-bg-tertiary rounded-md">
          <p className="text-md font-semibold mb-2 text-primary">Noise Reduction</p>
          <Slider
            label="Luminance"
            max={100}
            min={0}
            onChange={(value) => handleAdjustmentChange(DetailsAdjustment.LumaNoiseReduction, value)}
            step={1}
            value={adjustments.lumaNoiseReduction}
          />
          <Slider
            label="Color"
            max={100}
            min={0}
            onChange={(value) => handleAdjustmentChange(DetailsAdjustment.ColorNoiseReduction, value)}
            step={1}
            value={adjustments.colorNoiseReduction}
          />
        </div>
      )}
      */}

      {adjustmentVisibility.chromaticAberration !== false && (
        <div className="mt-4 p-2 bg-bg-tertiary rounded-md">
          <p className="text-md font-semibold mb-2 text-primary">Chromatic Aberration</p>
          <Slider
            label="Red/Cyan"
            max={100}
            min={-100}
            onChange={(value) =>
              handleAdjustmentChange(DetailsAdjustment.ChromaticAberrationRedCyan, value)
            }
            step={1}
            value={adjustments.chromaticAberrationRedCyan}
            onDragStateChange={onDragStateChange}
          />
          <Slider
            label="Blue/Yellow"
            max={100}
            min={-100}
            onChange={(value) =>
              handleAdjustmentChange(DetailsAdjustment.ChromaticAberrationBlueYellow, value)
            }
            step={1}
            value={adjustments.chromaticAberrationBlueYellow}
            onDragStateChange={onDragStateChange}
          />
        </div>
      )}
    </div>
  );
}
