"use client"

import { useState, useEffect } from "react"
import { Play, Pause, Volume2, SkipBack, SkipForward } from "lucide-react"

interface WaveformPlayerProps {
  trackTitle?: string
  artist?: string
  duration?: number
}

export function WaveformPlayer({
  trackTitle = "Your Next Hit",
  artist = "Submitted Artist",
  duration = 180,
}: WaveformPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])

  // Generate random waveform data
  useEffect(() => {
    const generateWaveform = () => {
      const data = Array.from({ length: 100 }, () => Math.random() * 100 + 10)
      setWaveformData(data)
    }
    generateWaveform()
  }, [])

  // Simulate playback progress
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, duration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = (currentTime / duration) * 100

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6 space-y-4">
      {/* Track Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">{trackTitle}</h3>
          <p className="text-gray-400 text-sm">{artist}</p>
        </div>
        <div className="text-gray-400 text-sm">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="relative h-20 bg-gray-800 rounded-lg overflow-hidden">
        <div className="flex items-end justify-center h-full px-2 space-x-1">
          {waveformData.map((height, index) => {
            const isActive = (index / waveformData.length) * 100 <= progress
            return (
              <div
                key={index}
                className={`w-1 transition-all duration-300 ${
                  isActive ? "bg-gradient-to-t from-purple-500 to-blue-400" : "bg-gray-600"
                }`}
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>

        {/* Progress overlay */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white transition-colors">
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full flex items-center justify-center text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
            )}
          </button>

          <button className="text-gray-400 hover:text-white transition-colors">
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4 text-gray-400" />
          <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* Submission CTA */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-lg p-4 text-center">
        <p className="text-purple-200 text-sm font-medium">🎵 This could be your track playing for industry legends</p>
        <p className="text-gray-400 text-xs mt-1">Join now and submit your music to Grammy-winning producers</p>
      </div>
    </div>
  )
}
