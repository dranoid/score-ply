import { Slider } from "./ui/slider"
import { Volume2, VolumeX } from "lucide-react"

interface VolumeControlProps {
  volume: number
  onVolumeChange: (value: number[]) => void
  disabled?: boolean
}

export function VolumeControl({ volume, onVolumeChange, disabled = false }: VolumeControlProps) {
  const isMuted = volume === 0

  return (
    <div className="flex items-center gap-2">
      {isMuted ? (
        <VolumeX className="w-4 h-4 text-muted-foreground hidden sm:block" />
      ) : (
        <Volume2 className="w-4 h-4 text-muted-foreground hidden sm:block" />
      )}
      <Slider
        value={[volume]}
        min={0}
        max={100}
        step={1}
        onValueChange={onVolumeChange}
        disabled={disabled}
        className="w-20 sm:w-28"
      />
      <span className="text-xs text-muted-foreground w-[4ch] text-right tabular-nums">
        {volume}%
      </span>
    </div>
  )
}
