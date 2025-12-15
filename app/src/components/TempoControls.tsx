import { Slider } from "./ui/slider"
import { Button } from "./ui/button"
import { TempoEngine } from "../utils/TempoEngine"
import { BPMDetector } from "../utils/BPMDetector"
import { Gauge, RotateCcw, Loader2 } from "lucide-react"

interface TempoControlsProps {
  tempoRate: number
  onTempoChange: (rate: number) => void
  detectedBPM: number | null
  isDetecting: boolean
  disabled?: boolean
}

export function TempoControls({
  tempoRate,
  onTempoChange,
  detectedBPM,
  isDetecting,
  disabled = false,
}: TempoControlsProps) {
  const currentPercent = TempoEngine.rateToPercent(tempoRate)
  const adjustedBPM = TempoEngine.adjustBPM(detectedBPM, tempoRate)
  const presets = [50, 75, 100, 125, 150, 200]

  const handleSliderChange = (value: number[]) => {
    const percent = value[0]
    onTempoChange(TempoEngine.percentToRate(percent))
  }

  const handlePresetClick = (percent: number) => {
    onTempoChange(TempoEngine.percentToRate(percent))
  }

  const handleReset = () => {
    onTempoChange(TempoEngine.DEFAULT_TEMPO)
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-accent" />
          Tempo Controls
        </h4>

        {/* BPM Display */}
        <div className="p-4 bg-muted/20 rounded-lg border border-border/50 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">BPM</span>
            {isDetecting && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Detecting...</span>
              </div>
            )}
          </div>
          <div className="text-2xl font-bold tabular-nums">
            {isDetecting ? (
              <span className="text-muted-foreground">--</span>
            ) : (
              <span>
                {BPMDetector.formatBPMWithAdjustment(detectedBPM, adjustedBPM)}
              </span>
            )}
          </div>
          {detectedBPM !== null && !isDetecting && tempoRate !== 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              Original: {detectedBPM} BPM
            </p>
          )}
        </div>

        {/* Tempo Slider */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Speed
              </label>
              <span className="text-sm font-bold tabular-nums text-accent">
                {currentPercent}%
              </span>
            </div>
            <Slider
              value={[currentPercent]}
              min={TempoEngine.MIN_PERCENT}
              max={TempoEngine.MAX_PERCENT}
              step={1}
              onValueChange={handleSliderChange}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{TempoEngine.MIN_PERCENT}%</span>
              <span>100%</span>
              <span>{TempoEngine.MAX_PERCENT}%</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="pt-4 border-t border-border">
            <label className="text-xs font-semibold text-muted-foreground mb-3 block">
              Quick Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((percent) => (
                <Button
                  key={percent}
                  variant={currentPercent === percent ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetClick(percent)}
                  disabled={disabled}
                  className={`text-xs ${
                    currentPercent === percent
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }`}
                >
                  {percent}%
                </Button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={disabled || tempoRate === TempoEngine.DEFAULT_TEMPO}
            className="w-full mt-4"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to 100%
          </Button>
        </div>
      </div>

      {/* Info Section */}
      <div className="text-xs text-muted-foreground p-3 bg-muted/10 rounded-lg border border-border/30">
        <p>
          <strong>Pitch Preserved:</strong> Audio pitch stays the same at any tempo.
        </p>
        {detectedBPM === null && !isDetecting && !disabled && (
          <p className="mt-2 text-amber-500/80">
            BPM detection may not work for all audio types (e.g., ambient, classical).
          </p>
        )}
      </div>
    </div>
  )
}
