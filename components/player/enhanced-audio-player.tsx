"use client"

import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import WaveSurfer from "wavesurfer.js"

interface EnhancedAudioPlayerProps {
  src: string
  title?: string
  artist?: string
  duration?: number
  compact?: boolean
  showWaveform?: boolean
}

export function EnhancedAudioPlayer({
  src,
  title = "Untitled Track",
  artist = "Unknown Artist",
  duration: initialDuration,
  compact = false,
  showWaveform = true,
}: EnhancedAudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(initialDuration || 0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Number.POSITIVE_INFINITY) return "00:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  useEffect(() => {
    if (!waveformRef.current || !showWaveform) return

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#4F4A5A",
      progressColor: "#A855F7",
      cursorColor: "transparent",
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: compact ? 40 : 60,
      normalize: true,
      url: src,
    })

    const ws = wavesurferRef.current

    ws.on("ready", (newDuration) => {
      setDuration(newDuration)
    })

    ws.on("audioprocess", (time) => {
      setCurrentTime(time)
    })

    ws.on("play", () => setIsPlaying(true))
    ws.on("pause", () => setIsPlaying(false))
    ws.on("finish", () => {
      setIsPlaying(false)
      ws.seekTo(0)
    })

    return () => {
      ws.destroy()
    }
  }, [src, showWaveform, compact])

  const togglePlayPause = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause()
    }
  }, [])

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume)
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (wavesurferRef.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      wavesurferRef.current.setMuted(newMuted)
      if (!newMuted && volume === 0) {
        setVolume(0.5)
        wavesurferRef.current.setVolume(0.5)
      }
    }
  }

  if (compact) {
    return (
      <div className="w-full p-3 bg-gray-800/60 rounded-lg border border-gray-700 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayPause}
          className="bg-purple-500/20 hover:bg-purple-500/40 rounded-full flex-shrink-0"
        >
          {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />}
        </Button>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="font-semibold text-white truncate">{title}</p>
              <p className="text-xs text-gray-400 truncate">{artist}</p>
            </div>
            <div className="text-xs font-mono text-gray-400 pl-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          {showWaveform && <div ref={waveformRef} className="w-full h-10 mt-1" />}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md p-4 bg-neutral-800/50 backdrop-blur-sm rounded-lg text-white border border-neutral-700">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
          <Play className="h-8 w-8 text-white" />
        </div>
        <div className="truncate">
          <h3 className="text-lg font-bold truncate">{title}</h3>
          <p className="text-sm text-gray-400 truncate">{artist}</p>
        </div>
      </div>

      {showWaveform && <div ref={waveformRef} className="w-full h-16" />}

      <div className="flex items-center justify-between mt-2 text-xs font-mono text-gray-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex items-center justify-center gap-4 my-3">
        <Button variant="ghost" size="icon" className="w-14 h-14" onClick={togglePlayPause}>
          {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
        </Button>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Button variant="ghost" size="icon" onClick={toggleMute}>
          {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="w-full"
        />
      </div>
    </div>
  )
}
