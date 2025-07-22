"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface WaveformPlayerProps {
  trackTitle: string
  artist: string
  duration: number
}

export function WaveformPlayer({ trackTitle, artist, duration }: WaveformPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState([75])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
            }
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }
  }

  const handleProgressChange = (value: number[]) => {
    setCurrentTime(value[0])
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Generate waveform bars
  const waveformBars = Array.from({ length: 50 }, (_, i) => {
    const height = Math.random() * 40 + 10
    const isActive = (i / 50) * duration <= currentTime
    return (
      <div
        key={i}
        className={`w-1 rounded-full transition-colors duration-150 ${isActive ? "bg-blue-500" : "bg-gray-600"}`}
        style={{ height: `${height}px` }}
      />
    )
  })

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
      <div className="flex items-center space-x-4 mb-4">
        <Button
          onClick={togglePlayPause}
          size="sm"
          className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 p-0"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </Button>
        <div className="flex-1">
          <h4 className="text-white font-semibold text-sm">{trackTitle}</h4>
          <p className="text-gray-400 text-xs">{artist}</p>
        </div>
        <div className="text-gray-400 text-xs">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="flex items-center justify-center space-x-1 mb-4 h-12">{waveformBars}</div>

      {/* Progress Slider */}
      <div className="mb-4">
        <Slider value={[currentTime]} onValueChange={handleProgressChange} max={duration} step={1} className="w-full" />
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-2">
        <Volume2 className="h-4 w-4 text-gray-400" />
        <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="w-20" />
        <span className="text-gray-400 text-xs w-8">{volume[0]}%</span>
      </div>
    </div>
  )
}
