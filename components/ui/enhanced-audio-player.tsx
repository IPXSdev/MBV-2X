"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface EnhancedAudioPlayerProps {
  src: string
  title: string
  artist: string
  duration?: number
  className?: string
  showWaveform?: boolean
  compact?: boolean
}

export function EnhancedAudioPlayer({
  src,
  title,
  artist,
  duration,
  className = "",
  showWaveform = true,
  compact = false,
}: EnhancedAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration || 0)
  const [volume, setVolume] = useState([75])
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number>()

  // Generate waveform data
  const generateWaveform = async (audioBuffer: ArrayBuffer) => {
    try {
      setIsAnalyzing(true)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const decodedData = await audioContext.decodeAudioData(audioBuffer.slice(0))

      const samples = 100 // Number of bars in waveform
      const blockSize = Math.floor(decodedData.length / samples)
      const waveform: number[] = []

      for (let i = 0; i < samples; i++) {
        const start = blockSize * i
        let sum = 0
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(decodedData.getChannelData(0)[start + j] || 0)
        }
        waveform.push(sum / blockSize)
      }

      // Normalize waveform data
      const max = Math.max(...waveform)
      const normalizedWaveform = waveform.map((val) => (val / max) * 100)

      setWaveformData(normalizedWaveform)
      setTotalDuration(decodedData.duration)
    } catch (error) {
      console.error("Error generating waveform:", error)
      // Fallback to random waveform for demo
      const fallbackWaveform = Array.from({ length: 100 }, () => Math.random() * 100)
      setWaveformData(fallbackWaveform)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Load audio and generate waveform
  useEffect(() => {
    if (src && showWaveform) {
      fetch(src)
        .then((response) => response.arrayBuffer())
        .then(generateWaveform)
        .catch(() => {
          // Fallback waveform
          const fallbackWaveform = Array.from({ length: 100 }, () => Math.random() * 100)
          setWaveformData(fallbackWaveform)
        })
    }
  }, [src, showWaveform])

  // Draw animated waveform
  const drawWaveform = () => {
    const canvas = canvasRef.current
    if (!canvas || !waveformData.length) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    const barWidth = width / waveformData.length
    const progress = totalDuration > 0 ? currentTime / totalDuration : 0

    waveformData.forEach((amplitude, index) => {
      const barHeight = (amplitude / 100) * height * 0.8
      const x = index * barWidth
      const y = (height - barHeight) / 2

      // Determine bar color based on progress
      const barProgress = index / waveformData.length
      const isActive = barProgress <= progress

      if (isActive) {
        // Active bars (played portion)
        const gradient = ctx.createLinearGradient(0, 0, 0, height)
        gradient.addColorStop(0, "#8b5cf6") // Purple
        gradient.addColorStop(1, "#3b82f6") // Blue
        ctx.fillStyle = gradient
      } else {
        // Inactive bars
        ctx.fillStyle = isPlaying ? "#4b5563" : "#374151" // Gray
      }

      // Add glow effect for active bars
      if (isActive && isPlaying) {
        ctx.shadowColor = "#8b5cf6"
        ctx.shadowBlur = 4
      } else {
        ctx.shadowBlur = 0
      }

      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight)
    })
  }

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        drawWaveform()
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()
    } else {
      drawWaveform()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, currentTime, waveformData])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setTotalDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)
    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("canplay", handleCanPlay)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("canplay", handleCanPlay)
    }
  }, [src])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = (value[0] / 100) * totalDuration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0]
    audio.volume = newVolume / 100
    setVolume([newVolume])
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume[0] / 100
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const skipTime = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = Math.max(0, Math.min(totalDuration, currentTime + seconds))
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  if (compact) {
    return (
      <div className={`bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700 ${className}`}>
        <audio ref={audioRef} src={src} preload="metadata" />

        <div className="flex items-center space-x-3">
          <Button
            onClick={togglePlayPause}
            disabled={isLoading}
            size="sm"
            className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 p-0 flex-shrink-0"
          >
            {isLoading ? (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3 ml-0.5" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{title}</div>
            <div className="text-gray-400 text-xs truncate">{artist}</div>
          </div>

          <div className="text-gray-400 text-xs flex-shrink-0">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </div>
        </div>

        {showWaveform && (
          <div className="mt-2">
            {isAnalyzing ? (
              <div className="h-8 bg-gray-700 rounded animate-pulse" />
            ) : (
              <canvas
                ref={canvasRef}
                width={300}
                height={32}
                className="w-full h-8 cursor-pointer rounded"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const percentage = (x / rect.width) * 100
                  handleProgressChange([percentage])
                }}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Track Info */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            {isAnalyzing ? (
              <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-lg truncate">{title}</h3>
          <p className="text-gray-400 truncate">{artist}</p>
        </div>

        <div className="text-gray-400 text-sm">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </div>
      </div>

      {/* Waveform */}
      {showWaveform && (
        <div className="mb-4">
          {isAnalyzing ? (
            <div className="h-16 bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
              <div className="text-gray-400 text-sm">Analyzing audio...</div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={600}
              height={64}
              className="w-full h-16 cursor-pointer rounded-lg bg-gray-800/50"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const percentage = (x / rect.width) * 100
                handleProgressChange([percentage])
              }}
            />
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <Slider
          value={[progressPercentage]}
          onValueChange={handleProgressChange}
          max={100}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => skipTime(-10)}
            variant="outline"
            size="sm"
            className="border-gray-600 bg-transparent hover:bg-gray-700"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            onClick={togglePlayPause}
            disabled={isLoading}
            size="sm"
            className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 p-0"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            onClick={() => skipTime(10)}
            variant="outline"
            size="sm"
            className="border-gray-600 bg-transparent hover:bg-gray-700"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleMute}
            variant="outline"
            size="sm"
            className="border-gray-600 bg-transparent hover:bg-gray-700"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <div className="w-20">
            <Slider
              value={isMuted ? [0] : volume}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <span className="text-gray-400 text-xs w-8 text-right">{isMuted ? "0%" : `${volume[0]}%`}</span>
        </div>
      </div>
    </div>
  )
}
