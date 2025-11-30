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
} from "lucide-react"

export default function MusicPlayer() {
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
  const audioRef = useRef<HTMLAudioElement>(null)

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
            <TabsContent value="loop" className="flex-1 px-6 py-6 space-y-6">
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
                    <div className="space-y-4 pt-2 border-t border-border">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-2 block">Loop Start</label>
                        <input
                          type="text"
                          placeholder="00:00"
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-2 block">Loop End</label>
                        <input
                          type="text"
                          placeholder="00:30"
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Sectioning Controls Tab */}
            <TabsContent value="sectioning" className="flex-1 px-6 py-6 space-y-6">
              <div>
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Music className="w-4 h-4 text-accent" />
                  Sections
                </h4>

                <div className="space-y-3 text-center py-8 text-muted-foreground">
                  <p className="text-sm">No sections created yet</p>
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4">
                    Add Section
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      )}
    </div>
  )
}
