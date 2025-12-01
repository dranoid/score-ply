"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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

const parseTimeString = (timeStr: string): number | null => {
  const trimmed = timeStr.trim()

  // Handle pure seconds (e.g., "90")
  if (/^\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10)
  }

  // Handle MM:SS format (e.g., "01:30", "1:30")
  if (/^\d+:\d+$/.test(trimmed)) {
    const [minutes, seconds] = trimmed.split(":").map(Number)
    if (isNaN(minutes) || isNaN(seconds)) return null
    return minutes * 60 + seconds
  }

  return null
}

const formatTimeFromSeconds = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

const validateAndFormatTime = (timeStr: string, maxDuration: number): { formatted: string; error?: string } => {
  const seconds = parseTimeString(timeStr)

  if (seconds === null) {
    return { formatted: timeStr, error: "Invalid format. Use MM:SS or seconds" }
  }

  if (seconds < 0) {
    return { formatted: "00:00", error: "Time cannot be negative" }
  }

  if (seconds > maxDuration) {
    return {
      formatted: formatTimeFromSeconds(maxDuration),
      error: `Cannot exceed duration (${formatTimeFromSeconds(maxDuration)})`,
    }
  }

  return { formatted: formatTimeFromSeconds(seconds) }
}

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(300) // Default 5 minutes for demo
  const [volume, setVolume] = useState(100)
  const [isLoopEnabled, setIsLoopEnabled] = useState(false)
  const [activeTab, setActiveTab] = useState("loop")
  const [showControls, setShowControls] = useState(true)
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off")
  const [isShuffle, setIsShuffle] = useState(false)
  const [loopStart, setLoopStart] = useState("00:00")
  const [loopEnd, setLoopEnd] = useState("00:30")
  const [loopStartError, setLoopStartError] = useState<string | undefined>()
  const [loopEndError, setLoopEndError] = useState<string | undefined>()
  const [loopRangeError, setLoopRangeError] = useState<string | undefined>()
  const [sectionMode, setSectionMode] = useState<"count" | "duration">("count")
  const [sectionCount, setSectionCount] = useState(4)
  const [sectionDuration, setSectionDuration] = useState(30)
  const [sections] = useState<Array<{ id: string; startTime: string; endTime: string; label: string }>>([
    { id: "1", startTime: "00:00", endTime: "00:30", label: "Section 1" },
    { id: "2", startTime: "00:30", endTime: "01:00", label: "Section 2" },
    { id: "3", startTime: "01:00", endTime: "01:30", label: "Section 3" },
    { id: "4", startTime: "01:30", endTime: "02:00", label: "Section 4" },
  ])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleLoopStartChange = (value: string) => {
    const { formatted, error } = validateAndFormatTime(value, duration)
    setLoopStart(formatted)
    setLoopStartError(error)

    // Validate range
    const endSeconds = parseTimeString(loopEnd) ?? 0
    const startSeconds = parseTimeString(formatted) ?? 0
    if (startSeconds >= endSeconds) {
      setLoopRangeError("Start time must be less than end time")
    } else {
      setLoopRangeError(undefined)
    }
  }

  const handleLoopEndChange = (value: string) => {
    const { formatted, error } = validateAndFormatTime(value, duration)
    setLoopEnd(formatted)
    setLoopEndError(error)

    // Validate range
    const startSeconds = parseTimeString(loopStart) ?? 0
    const endSeconds = parseTimeString(formatted) ?? 0
    if (startSeconds >= endSeconds) {
      setLoopRangeError("Start time must be less than end time")
    } else {
      setLoopRangeError(undefined)
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [])

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && audioRef.current) {
      const url = URL.createObjectURL(file)
      audioRef.current.src = url
      setIsPlaying(false)
    }
  }

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const cycleRepeatMode = () => {
    if (repeatMode === "off") setRepeatMode("all")
    else if (repeatMode === "all") setRepeatMode("one")
    else setRepeatMode("off")
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-8">
            <Music className="w-6 h-6 text-accent" />
            <span className="text-xl font-bold">PlayTrack</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-primary/10 text-accent hover:bg-sidebar-primary/20 transition-colors">
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 transition-colors">
            <Search className="w-5 h-5" />
            <span>Search</span>
          </button>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/50 mb-2">Now Playing</div>
          <div className="text-sm font-medium text-sidebar-foreground/80">No track loaded</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/30 backdrop-blur-sm px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Good evening</h1>
              <p className="text-muted-foreground">Start listening to your music</p>
            </div>
            <Button
              onClick={() => setShowControls(!showControls)}
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-lg hover:bg-accent/10 text-accent transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto px-8 py-8">
          <div className="max-w-2xl">
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
        </div>

        {/* Player Controls */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm px-8 py-6">
          <audio ref={audioRef} />

          {/* Progress Bar */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-muted-foreground min-w-fit">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 0}
              step={0.1}
              onValueChange={handleProgressChange}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground min-w-fit">{formatTime(duration)}</span>
          </div>

          {/* Player Buttons */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Shuffle Button */}
            <Button
              onClick={() => setIsShuffle(!isShuffle)}
              variant="ghost"
              size="icon"
              className={`text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors ${
                isShuffle ? "text-accent" : ""
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/30"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              onClick={handlePlayPause}
              size="icon"
              className="w-14 h-14 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/30"
            >
              <SkipForward className="w-5 h-5" />
            </Button>

            {/* Repeat Button */}
            <Button
              onClick={cycleRepeatMode}
              variant="ghost"
              size="icon"
              className={`text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors relative ${
                repeatMode !== "off" ? "text-accent" : ""
              }`}
            >
              <RotateCw className="w-5 h-5" />
              {repeatMode === "one" && (
                <span className="absolute bottom-1 right-1 text-xs font-bold text-accent bg-accent/20 rounded-full w-4 h-4 flex items-center justify-center">
                  1
                </span>
              )}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-4">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="flex-1 max-w-xs"
            />
            <span className="text-xs text-muted-foreground min-w-fit">{volume}%</span>
          </div>
        </div>
      </main>

      {/* Right Control Panel */}
      {showControls && (
        <aside className="w-80 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
          {/* Header */}
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-accent" />
              Controls
            </h3>
            <Button onClick={() => setShowControls(false)} variant="ghost" size="icon" className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2 bg-muted/50">
              <TabsTrigger value="loop" className="text-sm">
                Loop
              </TabsTrigger>
              <TabsTrigger value="sectioning" className="text-sm">
                Sections
              </TabsTrigger>
            </TabsList>

            {/* Loop Controls Tab */}
            <TabsContent value="loop" className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
              <div>
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-accent" />
                  Loop Controls
                </h4>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                    <Checkbox
                      checked={isLoopEnabled}
                      onCheckedChange={(checked) => setIsLoopEnabled(checked as boolean)}
                      className="border-border"
                    />
                    <span className="text-sm font-medium">Enable Loop</span>
                  </label>

                  {isLoopEnabled && (
                    <div className="space-y-4 pt-4 border-t border-border">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-2 block">Loop Start</label>
                        <input
                          type="text"
                          placeholder="00:00"
                          value={loopStart}
                          onChange={(e) => handleLoopStartChange(e.target.value)}
                          className={`w-full px-3 py-2 bg-input border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
                            loopStartError
                              ? "border-red-500/50 focus:ring-red-500/50"
                              : "border-border focus:ring-accent/50"
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
                          placeholder="00:30"
                          value={loopEnd}
                          onChange={(e) => handleLoopEndChange(e.target.value)}
                          className={`w-full px-3 py-2 bg-input border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
                            loopEndError
                              ? "border-red-500/50 focus:ring-red-500/50"
                              : "border-border focus:ring-accent/50"
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

                      {/* Range validation error display */}
                      {loopRangeError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <p className="text-xs text-red-500">{loopRangeError}</p>
                        </div>
                      )}

                      {/* Loop visualization */}
                      <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground mb-3">Loop Range</p>
                        <div className="h-1 bg-muted rounded-full relative overflow-hidden">
                          <div className="h-full bg-accent/30 absolute left-0 w-1/3" />
                          <div className="h-full bg-accent absolute left-1/3 w-1/3" />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>{loopStart}</span>
                          <span>{loopEnd}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Sectioning Controls Tab */}
            <TabsContent value="sectioning" className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Section Mode Selection */}
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

                {/* Section Configuration */}
                <div className="pt-4 border-t border-border space-y-4">
                  {sectionMode === "count" ? (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                        Number of Sections
                      </label>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => setSectionCount(Math.max(1, sectionCount - 1))}
                          variant="outline"
                          size="sm"
                          className="px-3"
                        >
                          −
                        </Button>
                        <input
                          type="number"
                          value={sectionCount}
                          onChange={(e) => setSectionCount(Math.max(1, Number.parseInt(e.target.value) || 1))}
                          className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                        <Button
                          onClick={() => setSectionCount(sectionCount + 1)}
                          variant="outline"
                          size="sm"
                          className="px-3"
                        >
                          +
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Will create {sectionCount} equal sections</p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                        Section Duration (seconds)
                      </label>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => setSectionDuration(Math.max(1, sectionDuration - 5))}
                          variant="outline"
                          size="sm"
                          className="px-3"
                        >
                          −
                        </Button>
                        <input
                          type="number"
                          value={sectionDuration}
                          onChange={(e) => setSectionDuration(Math.max(1, Number.parseInt(e.target.value) || 1))}
                          className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                        <Button
                          onClick={() => setSectionDuration(sectionDuration + 5)}
                          variant="outline"
                          size="sm"
                          className="px-3"
                        >
                          +
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Each section will be {sectionDuration}s long</p>
                    </div>
                  )}

                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4">
                    Generate Sections
                  </Button>
                </div>

                {/* Sections List */}
                <div className="pt-4 border-t border-border">
                  <h5 className="text-xs font-semibold text-muted-foreground mb-3">Sections ({sections.length})</h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        className="p-3 rounded-lg bg-muted/20 border border-border/50 hover:border-accent/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-medium">{section.label}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{section.startTime}</span>
                          <span>→</span>
                          <span>{section.endTime}</span>
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
    </div>
  )
}
