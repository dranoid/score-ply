import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "./components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Slider } from "./components/ui/slider"
import { Card } from "./components/ui/card"
import { Checkbox } from "./components/ui/checkbox"
import { MetadataExtractor } from "./utils/MetadataExtractor"
import { SectioningEngine } from "./utils/SectioningEngine"
import { TimeMath } from "./utils/TimeMath"
import { LoopEngine } from "./utils/LoopEngine"
import type { Track, AudioSection } from "./types"
import {
  Home,
  Search,
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  X,
  Upload,
  Settings,
  RotateCw,
  Shuffle,
  AlertCircle,
} from "lucide-react"

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isLoopEnabled, setIsLoopEnabled] = useState(false)
  const [activeTab, setActiveTab] = useState("loop")
  const [showControls, setShowControls] = useState(true)
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off")
  const [isShuffle, setIsShuffle] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const headerFileInputRef = useRef<HTMLInputElement>(null)
  const modalFileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [sectionMode, setSectionMode] = useState<"count" | "duration">("count")
  const [sectionCount, setSectionCount] = useState<number>(4)
  const [sectionDuration, setSectionDuration] = useState<number>(30)
  const [sections, setSections] = useState<AudioSection[]>([])
  const [loopStart, setLoopStart] = useState("00:00")
  const [loopEnd, setLoopEnd] = useState("00:30")
  const [loopStartError, setLoopStartError] = useState<string | null>(null)
  const [loopEndError, setLoopEndError] = useState<string | null>(null)
  const [loopRangeError, setLoopRangeError] = useState<string | null>(null)
  const [useHoursFormat, setUseHoursFormat] = useState(false)
  const [isSliderHover, setIsSliderHover] = useState(false)
  const [isSliderFocus, setIsSliderFocus] = useState(false)
  const [isMouseInteracting, setIsMouseInteracting] = useState(false)
  const [hoveredTime, setHoveredTime] = useState(0)
  const [draggingMarker, setDraggingMarker] = useState<"start" | "end" | null>(null)
  const [isStartHover, setIsStartHover] = useState(false)
  const [isEndHover, setIsEndHover] = useState(false)
  const sliderContainerRef = useRef<HTMLDivElement>(null)

  const sanitizeTimestampInput = (raw: string): string => {
    const s = raw.replace(/[^\d:]/g, "")
    const parts = s.split(":")
    // Allow up to two colons (hh:mm:ss); merge extras
    const safe = parts.slice(0, 3)
    if (safe.length === 1) return safe[0]
    if (safe.length === 2) {
      const [m, sec] = safe
      return `${m}${":"}${sec.slice(0, 2)}`
    }
    // hh:mm:ss
    const [h, m, sec] = safe
    return `${h.slice(0, 3)}:${m.slice(0, 2)}:${sec.slice(0, 2)}`
  }

  const parseTimestampText = (value: string, requireHours?: boolean): number | null => {
    const s = value.trim()
    if (!s) return null
    const parts = s.split(":")
    if (parts.length === 2 && !requireHours) {
      const [mmText, ssText] = parts
      if (!/^\d{1,}$/.test(mmText) || !/^\d{1,2}$/.test(ssText)) return null
      const mm = Number.parseInt(mmText, 10)
      const ss = Number.parseInt(ssText, 10)
      if (ss >= 60) return null
      return TimeMath.parseTimestamp(mm, ss)
    }
    if (parts.length === 3) {
      const [hhText, mmText, ssText] = parts
      if (!/^\d{1,}$/.test(hhText) || !/^\d{1,2}$/.test(mmText) || !/^\d{1,2}$/.test(ssText)) return null
      const hh = Number.parseInt(hhText, 10)
      const mm = Number.parseInt(mmText, 10)
      const ss = Number.parseInt(ssText, 10)
      if (mm >= 60 || ss >= 60) return null
      return hh * 3600 + mm * 60 + ss
    }
    return null
  }

  const validateLoopInputs = useCallback((startText: string, endText: string) => {
    const s = parseTimestampText(startText, useHoursFormat)
    const e = parseTimestampText(endText, useHoursFormat)
    const formatMsg = useHoursFormat
      ? "Use HH:MM:SS; minutes/seconds < 60"
      : "Use MM:SS (or HH:MM:SS); seconds < 60"

    const invalidStart = s == null
    const invalidEnd = e == null

    setLoopStartError(
      invalidStart ? formatMsg : duration > 0 && s! > duration ? "Start exceeds track duration" : null
    )
    setLoopEndError(
      invalidEnd ? formatMsg : duration > 0 && e! > duration ? "End time cannot exceed track duration" : null
    )

    if (!invalidStart && !invalidEnd && duration > 0) {
      const v = LoopEngine.validateLoopBounds(s!, e!, duration)
      setLoopRangeError(v.valid ? null : v.error || null)
    } else {
      setLoopRangeError(null)
    }
  }, [useHoursFormat, duration])

  const updateMarkersFromClientX = useCallback((clientX: number) => {
    if (!duration || !draggingMarker || !sliderContainerRef.current) return
    const rect = sliderContainerRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const t = duration * pct
    const sCur = parseTimestampText(loopStart, useHoursFormat) ?? 0
    const eCur = parseTimestampText(loopEnd, useHoursFormat) ?? Math.max(sCur, 0)
    const w = Math.max(0, eCur - sCur)
    const clamp = (x: number) => Math.max(0, Math.min(duration, x))
    const fmt = (x: number) => (useHoursFormat || duration >= 3600 ? TimeMath.formatTimeHMS(x) : TimeMath.formatTime(x))
    if (draggingMarker === "start") {
      const ns = clamp(t)
      let s1 = ns
      let e1 = eCur
      if (ns > eCur) {
        e1 = clamp(ns + w)
        if (e1 - s1 < w) {
          s1 = Math.max(0, e1 - w)
        }
      }
      const sText = fmt(s1)
      const eText = fmt(e1)
      setLoopStart(sText)
      setLoopEnd(eText)
      validateLoopInputs(sText, eText)
    } else {
      const ne = clamp(t)
      let e1 = ne
      let s1 = sCur
      if (ne < sCur) {
        s1 = Math.max(0, ne - w)
        if (e1 - s1 < w) {
          e1 = Math.min(duration, s1 + w)
        }
      }
      const sText = fmt(s1)
      const eText = fmt(e1)
      setLoopStart(sText)
      setLoopEnd(eText)
      validateLoopInputs(sText, eText)
    }
  }, [draggingMarker, duration, useHoursFormat, loopStart, loopEnd, validateLoopInputs])

  useEffect(() => {
    if (!draggingMarker) return
    const move = (e: PointerEvent) => updateMarkersFromClientX(e.clientX)
    const up = () => {
      setIsMouseInteracting(false)
      setDraggingMarker(null)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
  }, [draggingMarker, duration, useHoursFormat, loopStart, loopEnd, updateMarkersFromClientX])

  useEffect(() => {
    if (draggingMarker) {
      document.body.style.cursor = "ew-resize"
    } else {
      document.body.style.cursor = ""
    }
    return () => {
      document.body.style.cursor = ""
    }
  }, [draggingMarker])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (!isLoopEnabled) return
      const s = parseTimestampText(loopStart, useHoursFormat)
      const e = parseTimestampText(loopEnd, useHoursFormat)
      if (s == null || e == null) return
      const v = LoopEngine.validateLoopBounds(s, e, duration)
      if (!v.valid) return
      if (LoopEngine.shouldLoop(audio.currentTime, e)) {
        audio.currentTime = LoopEngine.getLoopStartTime(s)
      }
    }
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setUseHoursFormat(audio.duration >= 3600)
      validateLoopInputs(loopStart, loopEnd)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [isLoopEnabled, loopStart, loopEnd, duration, useHoursFormat, validateLoopInputs])

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        if (isLoopEnabled) {
          const s = parseTimestampText(loopStart, useHoursFormat)
          if (s != null && (duration === 0 || s < duration)) {
            audioRef.current.currentTime = LoopEngine.getLoopStartTime(s)
          }
        }
        void audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const addFilesToPlaylist = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newTracks: Track[] = []
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file)
      const metadata = await MetadataExtractor.extractMetadata(file)
      newTracks.push({ file, url, metadata })
    }
    setTracks((prev) => {
      const updated = [...prev, ...newTracks]
      if (audioRef.current && updated.length > 0) {
        const idx = updated.length - 1
        audioRef.current.src = updated[idx].url
        setCurrentIndex(idx)
        setIsPlaying(false)
      }
      return updated
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    void addFilesToPlaylist(e.target.files)
  }

  const handleHeaderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    void addFilesToPlaylist(e.target.files)
  }

  const handleProgressChange = (value: number[]) => {
    if (!audioRef.current) return
    const newTime = value[0]
    if (isLoopEnabled) {
      const s = parseTimestampText(loopStart, useHoursFormat)
      const e = parseTimestampText(loopEnd, useHoursFormat)
      if (s != null && e != null && duration > 0) {
        const v = LoopEngine.validateLoopBounds(s, e, duration)
        if (v.valid) {
          if (newTime < s || newTime > e) {
            const startTime = LoopEngine.getLoopStartTime(s)
            audioRef.current.currentTime = startTime
            setCurrentTime(startTime)
            return
          }
        }
      }
    }
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || Number.isNaN(seconds)) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const cycleRepeatMode = () => {
    if (repeatMode === "off") setRepeatMode("all")
    else if (repeatMode === "all") setRepeatMode("one")
    else setRepeatMode("off")
  }

  const handleLoopStartChange = (value: string) => {
    setLoopStart(sanitizeTimestampInput(value))
  }

  const handleLoopEndChange = (value: string) => {
    setLoopEnd(sanitizeTimestampInput(value))
  }

  const normalizeTimestampOnBlur = (value: string, requireHours?: boolean): string | null => {
    const parts = value.trim().split(":")
    if (parts.length === 2 && !requireHours) {
      const [mText, sText] = parts
      if (!/^\d{1,}$/.test(mText) || !/^\d{1,2}$/.test(sText)) return null
      const mm = mText
      const ss = Number.parseInt(sText, 10)
      if (!Number.isFinite(ss) || ss >= 60) return null
      const mmPadded = mm.length < 2 ? mm.padStart(2, "0") : mm
      const ssPadded = sText.padStart(2, "0")
      return `${mmPadded}:${ssPadded}`
    }
    if (parts.length === 3) {
      const [hText, mText, sText] = parts
      if (!/^\d{1,}$/.test(hText) || !/^\d{1,2}$/.test(mText) || !/^\d{1,2}$/.test(sText)) return null
      const mm = Number.parseInt(mText, 10)
      const ss = Number.parseInt(sText, 10)
      if (mm >= 60 || ss >= 60) return null
      const hPad = hText
      const mPad = mText.padStart(2, "0")
      const sPad = sText.padStart(2, "0")
      return `${hPad}:${mPad}:${sPad}`
    }
    return null
  }

  const preventColonDeleteKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    const input = e.currentTarget
    const value = input.value
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? start
    if (start !== end) return
    if (e.key === ":") {
      e.preventDefault()
      return
    }
    if (e.key === "Backspace") {
      if (start > 0 && value[start - 1] === ":") {
        e.preventDefault()
      }
    } else if (e.key === "Delete") {
      if (start < value.length && value[start] === ":") {
        e.preventDefault()
      }
    }
  }

  const handleLoopStartPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const masked = sanitizeTimestampInput(e.clipboardData.getData("text"))
    setLoopStart(masked)
    validateLoopInputs(masked, loopEnd)
  }

  const handleLoopEndPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const masked = sanitizeTimestampInput(e.clipboardData.getData("text"))
    setLoopEnd(masked)
    validateLoopInputs(loopStart, masked)
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-8">
            <Music className="w-6 h-6 text-accent" />
            <span className="text-xl font-bold">Scoreply</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-primary/10 text-accent hover:bg-sidebar-primary/20 transition-colors cursor-pointer">
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 transition-colors cursor-pointer">
            <Search className="w-5 h-5" />
            <span>Search</span>
          </button>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/50 mb-2">Now Playing</div>
          <div className="text-sm font-medium text-sidebar-foreground/80 truncate">
            {currentIndex >= 0 && tracks[currentIndex]?.metadata?.title
              ? tracks[currentIndex]?.metadata?.title
              : "No track loaded"}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="border-b border-border bg-card/30 backdrop-blur-sm px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{(() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening" })()}</h1>
              <p className="text-muted-foreground">Start listening to your music</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={headerFileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleHeaderUpload}
                className="hidden"
              />
              <Button onClick={() => setIsUploadModalOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <Button
                onClick={() => setShowControls(!showControls)}
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-lg hover:bg-accent/10 text-accent transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-8 py-8">
          {tracks.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card border-border p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">Upload Audio File</h2>
              <p className="text-muted-foreground mb-8">
                Upload an audio file to use the timestamp player features including looping and sectioning.
              </p>

              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-accent/30 rounded-xl p-12 cursor-pointer hover:bg-accent/5 hover:border-accent/50 transition-all duration-200">
                  <Upload className="w-12 h-12 text-accent mb-3" />
                  <span className="text-lg font-semibold text-accent mb-1">Upload Audio File</span>
                  <span className="text-sm text-muted-foreground">Click to browse or drag and drop</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </Card>
          </div>
          )}
          {tracks.length > 0 && (
            <div className="mt-8 max-w-3xl mx-auto space-y-3">
              {tracks.map((t, i) => (
                <div
                  key={`${t.url}-${i}`}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors cursor-pointer"
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.src = t.url
                      setCurrentIndex(i)
                      setIsPlaying(false)
                    }
                  }}
                >
                  <span className="w-6 text-right text-xs text-muted-foreground">{i + 1}</span>
                  {t.metadata?.coverArtUrl ? (
                    <img src={t.metadata.coverArtUrl} alt="cover" className="w-12 h-12 rounded-md object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                      <Music className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.metadata?.title || t.file.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{[t.metadata?.artist, t.metadata?.album, t.metadata?.genre].filter(Boolean).join(" • ")}</div>
                  </div>
                  <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={(ev) => {
                    ev.stopPropagation();
                    if (audioRef.current) {
                      audioRef.current.src = t.url;
                      setCurrentIndex(i);
                      void audioRef.current.play();
                      setIsPlaying(true);
                    }
                  }}>
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-card/50 backdrop-blur-sm px-8 py-6">
          <audio ref={audioRef} />

          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-muted-foreground inline-block w-[8ch] text-center font-mono select-none">{formatTime(currentTime)}</span>
            <div
              className="relative flex-1"
              ref={sliderContainerRef}
              onMouseEnter={(e) => {
                setIsSliderHover(true)
                const rect = e.currentTarget.getBoundingClientRect()
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                setHoveredTime((duration || 0) * pct)
              }}
              onMouseMove={(e) => {
                if (!duration) return
                const rect = e.currentTarget.getBoundingClientRect()
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                setHoveredTime(duration * pct)
              }}
              onMouseLeave={() => {
                setIsSliderHover(false)
                setIsMouseInteracting(false)
              }}
              onPointerMove={(e) => {
                if (!duration || !draggingMarker) return
                updateMarkersFromClientX(e.clientX)
              }}
              onPointerDown={() => setIsMouseInteracting(true)}
              onPointerUp={() => {
                setIsMouseInteracting(false)
                setDraggingMarker(null)
              }}
            >
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 0}
                step={0.1}
                onValueChange={handleProgressChange}
                disabled={duration === 0 || currentIndex === -1}
                onFocus={() => {
                  setIsSliderFocus(true)
                  setIsMouseInteracting(false)
                }}
                onBlur={() => setIsSliderFocus(false)}
                aria-label="Playback position"
                aria-valuetext={duration >= 3600 ? TimeMath.formatTimeHMS(currentTime) : TimeMath.formatTime(currentTime)}
                className="w-full"
              />
              {duration > 0 && (() => {
                const s = parseTimestampText(loopStart, useHoursFormat)
                const e = parseTimestampText(loopEnd, useHoursFormat)
                const sp = s != null ? Math.max(0, Math.min(100, (s / duration) * 100)) : 0
                const ep = e != null ? Math.max(0, Math.min(100, (e / duration) * 100)) : 0
                const fmt = duration >= 3600 ? TimeMath.formatTimeHMS : TimeMath.formatTime
                return (
                  <>
                    <div
                      className={`absolute top-0 w-3.5 h-3.5 rounded-full border border-border bg-accent shadow z-10 ${duration === 0 ? "pointer-events-none opacity-50" : "cursor-ew-resize"}`}
                      style={{ left: `${sp}%`, transform: "translate(-50%, -200%)" }}
                      onPointerDown={() => setDraggingMarker("start")}
                      onMouseEnter={() => setIsStartHover(true)}
                      onMouseLeave={() => setIsStartHover(false)}
                      aria-label="Loop start"
                    >
                      {(draggingMarker === "start" || isStartHover) && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-card border border-border text-xs text-foreground shadow pointer-events-none select-none z-20">
                          Start: {s != null ? fmt(s) : loopStart}
                        </div>
                      )}
                      {isLoopEnabled && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-8 bg-border" />
                      )}
                    </div>
                    <div
                      className={`absolute top-0 w-3.5 h-3.5 rounded-full border border-border bg-accent shadow z-10 ${duration === 0 ? "pointer-events-none opacity-50" : "cursor-ew-resize"}`}
                      style={{ left: `${ep}%`, transform: "translate(-50%, -200%)" }}
                      onPointerDown={() => setDraggingMarker("end")}
                      onMouseEnter={() => setIsEndHover(true)}
                      onMouseLeave={() => setIsEndHover(false)}
                      aria-label="Loop end"
                    >
                      {(draggingMarker === "end" || isEndHover) && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-card border border-border text-xs text-foreground shadow pointer-events-none select-none z-20">
                          End: {e != null ? fmt(e) : loopEnd}
                        </div>
                      )}
                      {isLoopEnabled && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-8 bg-border" />
                      )}
                    </div>
                  </>
                )
              })()}
              {(isSliderHover && !isStartHover && !isEndHover && !draggingMarker) || (isSliderFocus && !isMouseInteracting) ? (
                <div
                  className="absolute -top-6 px-2 py-1 rounded-md bg-card border border-border text-xs text-foreground shadow select-none"
                  style={{
                    left: `${Math.max(0, Math.min(100, ((isSliderHover ? hoveredTime : currentTime) / duration) * 100))}%`,
                    transform: "translateX(-50%)",
                    pointerEvents: "none",
                  }}
                >
                  {duration >= 3600
                    ? TimeMath.formatTimeHMS(isSliderHover ? hoveredTime : currentTime)
                    : TimeMath.formatTime(isSliderHover ? hoveredTime : currentTime)}
                </div>
              ) : null}
            </div>
            <span className="text-sm text-muted-foreground inline-block w-[8ch] text-center font-mono select-none">{formatTime(duration)}</span>
          </div>

          <div className="relative flex items-center justify-center gap-4 mb-6">
            <Button
              onClick={() => setIsShuffle(!isShuffle)}
              variant="ghost"
              size="icon"
              className={`text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors ${
                isShuffle ? "text-accent" : ""
              }`}
              disabled={currentIndex === -1 || duration === 0}
            >
              <Shuffle className="w-5 h-5" />
            </Button>

            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted/30" disabled={currentIndex === -1 || duration === 0}>
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button onClick={handlePlayPause} size="icon" className="w-14 h-14 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg" disabled={currentIndex === -1 || duration === 0}>
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </Button>

            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted/30" disabled={currentIndex === -1 || duration === 0}>
              <SkipForward className="w-5 h-5" />
            </Button>

            <Button
              onClick={cycleRepeatMode}
              variant="ghost"
              size="icon"
              className={`text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors relative ${
                repeatMode !== "off" ? "text-accent" : ""
              }`}
              disabled={currentIndex === -1 || duration === 0}
            >
              <RotateCw className="w-5 h-5" />
              {repeatMode === "one" && (
                <span className="absolute bottom-1 right-1 text-xs font-bold text-accent bg-accent/20 rounded-full w-4 h-4 flex items-center justify-center">
                  1
                </span>
              )}
            </Button>
            <div className="absolute right-0 flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider value={[volume]} min={0} max={100} step={1} onValueChange={handleVolumeChange} disabled={currentIndex === -1 || duration === 0} className="w-32" />
              <span className="text-xs text-muted-foreground min-w-fit">{volume}%</span>
            </div>
          </div>
        </div>
      </main>

      {showControls && (
        <aside className="w-80 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-accent" />
              Controls
            </h3>
            <Button onClick={() => setShowControls(false)} variant="ghost" size="icon" className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2 bg-muted/50">
              <TabsTrigger value="loop" className="text-sm">Loop</TabsTrigger>
              <TabsTrigger value="sectioning" className="text-sm">Sections</TabsTrigger>
            </TabsList>

            <TabsContent value="loop" className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
              <div>
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-accent" />
                  Loop Controls
                </h4>

                <div className="space-y-4">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      duration === 0 || !!loopStartError || !!loopEndError || !!loopRangeError
                        ? "cursor-not-allowed"
                        : "cursor-pointer hover:bg-muted/30"
                    }`}
                  >
                    <Checkbox
                      checked={isLoopEnabled}
                      onCheckedChange={(checked) => {
                        const enable = !!checked
                        if (!enable) {
                          setIsLoopEnabled(false)
                          return
                        }
                        const s = parseTimestampText(loopStart, useHoursFormat)
                        const e = parseTimestampText(loopEnd, useHoursFormat)
                        const formatMsg = useHoursFormat
                          ? "Use HH:MM:SS; minutes/seconds < 60"
                          : "Use MM:SS (or HH:MM:SS); seconds < 60"
                        setLoopStartError(s == null ? formatMsg : null)
                        setLoopEndError(e == null ? formatMsg : null)
                        if (s == null || e == null || duration <= 0) {
                          setIsLoopEnabled(false)
                          return
                        }
                        const v = LoopEngine.validateLoopBounds(s, e, duration)
                        setLoopRangeError(v.valid ? null : v.error || null)
                        if (!v.valid) {
                          setIsLoopEnabled(false)
                          return
                        }
                        setIsLoopEnabled(true)
                        if (audioRef.current) {
                          audioRef.current.currentTime = LoopEngine.getLoopStartTime(s)
                        }
                      }}
                      disabled={
                        duration === 0 || !!loopStartError || !!loopEndError || !!loopRangeError
                      }
                      className="border-border"
                    />
                    <span className="text-sm font-medium">Enable Loop</span>
                  </label>

                  <div className="space-y-4 pt-2 border-t border-border">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-2 block">Loop Start</label>
                        <input
                          type="text"
                          placeholder={useHoursFormat || duration >= 3600 ? "00:00:00" : "00:00"}
                          value={loopStart}
                          onChange={(e) => handleLoopStartChange(e.target.value)}
                          onKeyDown={preventColonDeleteKeyDown}
                          onPaste={handleLoopStartPaste}
                          onBlur={(e) => {
                            const n = normalizeTimestampOnBlur(e.target.value, useHoursFormat)
                            if (n) setLoopStart(n)
                            validateLoopInputs(n ?? e.target.value, loopEnd)
                            const s = parseTimestampText(n ?? e.target.value, useHoursFormat)
                            if (audioRef.current && s != null && (duration === 0 || s < duration)) {
                              const startTime = LoopEngine.getLoopStartTime(s)
                              audioRef.current.currentTime = startTime
                              setCurrentTime(startTime)
                            }
                          }}
                          className={`w-full px-3 py-2 bg-input border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
                            loopStartError ? "border-red-500/50 focus:ring-red-500/50" : "border-border focus:ring-accent/50"
                          }`}
                        />
                        {loopStartError ? (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {loopStartError}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">Start of loop segment</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-2 block">Loop End</label>
                        <input
                          type="text"
                          placeholder={useHoursFormat || duration >= 3600 ? "00:00:00" : "00:30"}
                          value={loopEnd}
                          onChange={(e) => handleLoopEndChange(e.target.value)}
                          onKeyDown={preventColonDeleteKeyDown}
                          onPaste={handleLoopEndPaste}
                          onBlur={(e) => {
                            const n = normalizeTimestampOnBlur(e.target.value, useHoursFormat)
                            if (n) setLoopEnd(n)
                            validateLoopInputs(loopStart, n ?? e.target.value)
                          }}
                          className={`w-full px-3 py-2 bg-input border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
                            loopEndError ? "border-red-500/50 focus:ring-red-500/50" : "border-border focus:ring-accent/50"
                          }`}
                        />
                        {loopEndError ? (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {loopEndError}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">End of loop segment</p>
                        )}
                      </div>

                      {loopRangeError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <p className="text-xs text-red-500">{loopRangeError}</p>
                        </div>
                      )}

                      <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground mb-3">Loop Range</p>
                        {duration > 0 ? (
                          (() => {
                            const s = parseTimestampText(loopStart, useHoursFormat)
                            const e = parseTimestampText(loopEnd, useHoursFormat)
                            const sp = s != null ? Math.max(0, Math.min(100, (s / duration) * 100)) : 0
                            const ep = e != null ? Math.max(0, Math.min(100, (e / duration) * 100)) : 0
                            const w = Math.max(0, ep - sp)
                            return (
                              <div className="h-1 bg-muted rounded-full relative overflow-hidden">
                                <div className="h-full bg-accent/30 absolute" style={{ left: `${0}%`, width: `${sp}%` }} />
                                <div className="h-full bg-accent absolute" style={{ left: `${sp}%`, width: `${w}%` }} />
                              </div>
                            )
                          })()
                        ) : (
                          <div className="h-1 bg-muted rounded-full" />
                        )}
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          {(() => {
                            const s = parseTimestampText(loopStart, useHoursFormat)
                            const e = parseTimestampText(loopEnd, useHoursFormat)
                            const fmt = duration >= 3600 ? TimeMath.formatTimeHMS : TimeMath.formatTime
                            const ls = s != null ? fmt(s) : loopStart
                            const le = e != null ? fmt(e) : loopEnd
                            return (
                              <>
                                <span className="select-none">{ls}</span>
                                <span className="select-none">{le}</span>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                      <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                        <Checkbox
                          checked={useHoursFormat}
                          onCheckedChange={(checked) => setUseHoursFormat(!!checked)}
                          disabled={duration === 0}
                          className="border-border"
                        />
                        <span className="text-sm font-medium">Use hours format</span>
                      </label>
                    </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sectioning" className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <Music className="w-4 h-4 text-accent" />
                    Create Sections
                  </h4>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border cursor-pointer hover:bg-muted/30 transition-colors">
                      <input
                        type="radio"
                        name="sectionMode"
                        value="count"
                        checked={sectionMode === "count"}
                        onChange={() => setSectionMode("count")}
                        className="w-4 h-4 accent-accent"
                      />
                      <div>
                        <span className="text-sm font-medium">By Count</span>
                        <p className="text-xs text-muted-foreground">Split track into equal sections</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border cursor-pointer hover:bg-muted/30 transition-colors">
                      <input
                        type="radio"
                        name="sectionMode"
                        value="duration"
                        checked={sectionMode === "duration"}
                        onChange={() => setSectionMode("duration")}
                        className="w-4 h-4 accent-accent"
                      />
                      <div>
                        <span className="text-sm font-medium">By Duration</span>
                        <p className="text-xs text-muted-foreground">Fixed length sections</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                  {sectionMode === "count" ? (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-2 block">Number of Sections</label>
                      <div className="flex items-center gap-3">
                        <Button onClick={() => setSectionCount(Math.max(1, sectionCount - 1))} variant="outline" size="sm" className="px-3">
                          −
                        </Button>
                        <input
                          type="number"
                          value={sectionCount}
                          onChange={(e) => setSectionCount(Math.max(1, Number.parseInt(e.target.value) || 1))}
                          className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                        <Button onClick={() => setSectionCount(sectionCount + 1)} variant="outline" size="sm" className="px-3">
                          +
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Will create {sectionCount} equal sections</p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-2 block">Section Duration (seconds)</label>
                      <div className="flex items-center gap-3">
                        <Button onClick={() => setSectionDuration(Math.max(1, sectionDuration - 5))} variant="outline" size="sm" className="px-3">
                          −
                        </Button>
                        <input
                          type="number"
                          value={sectionDuration}
                          onChange={(e) => setSectionDuration(Math.max(1, Number.parseInt(e.target.value) || 1))}
                          className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                        <Button onClick={() => setSectionDuration(sectionDuration + 5)} variant="outline" size="sm" className="px-3">
                          +
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Each section will be {sectionDuration}s long</p>
                    </div>
                  )}

                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4"
                    onClick={() => {
                      if (sectionMode === "count") {
                        setSections(SectioningEngine.createSectionsByCount(duration || 0, sectionCount))
                      } else {
                        setSections(SectioningEngine.createSectionsByDuration(duration || 0, sectionDuration))
                      }
                    }}
                  >
                    Generate Sections
                  </Button>
                </div>

                <div className="pt-4 border-t border-border">
                  <h5 className="text-xs font-semibold text-muted-foreground mb-3">Sections ({sections.length})</h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sections.map((section, index) => (
                      <div
                        key={`${section.startTime}-${section.endTime}-${index}`}
                        className="p-3 rounded-lg bg-muted/20 border border-border/50 hover:border-accent/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = section.startTime
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-medium">{section.label}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSections((prev) => prev.filter((_, i) => i !== index))
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          {duration >= 3600 ? (
                            <>
                              <span>{TimeMath.formatTimeHMS(section.startTime)}</span>
                              <span>→</span>
                              <span>{TimeMath.formatTimeHMS(section.endTime)}</span>
                            </>
                          ) : (
                            <>
                              <span>{TimeMath.formatTime(section.startTime)}</span>
                              <span>→</span>
                              <span>{TimeMath.formatTime(section.endTime)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      )}

      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setIsUploadModalOpen(false)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <Card className="bg-card border-border p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">Upload Audio File</h2>
              <p className="text-muted-foreground mb-8">
                Upload an audio file to use the timestamp player features including looping and sectioning.
              </p>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  void addFilesToPlaylist(e.dataTransfer.files)
                  setIsUploadModalOpen(false)
                }}
                className="flex items-center justify-center w-full"
              >
                <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-accent/30 rounded-xl p-12 cursor-pointer hover:bg-accent/5 hover:border-accent/50 transition-all duration-200">
                  <Upload className="w-12 h-12 text-accent mb-3" />
                  <span className="text-lg font-semibold text-accent mb-1">Drag and drop or browse</span>
                  <span className="text-sm text-muted-foreground">Click to browse or drag and drop</span>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={(e) => {
                      handleHeaderUpload(e)
                      setIsUploadModalOpen(false)
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
