"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  Share2,
  Download,
} from "lucide-react"
import Image from "next/image"

interface EnhancedAudioPlayerProps {
  src: string
  title: string
  artist: string
  duration?: number
  showWaveform?: boolean
  mode?: "full" | "compact"
  albumArt?: string
}

export function EnhancedAudioPlayer({
  src,
  title,
  artist,
  duration,
  showWaveform = true,
  mode = "full",
  albumArt,
}: EnhancedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration || 0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [waveformData, setWaveformData] = useState<number[]>([])

  // Use the holographic album cover as default
  const defaultAlbumArt = "/images/default-holographic-album-cover.png"

  // Initialize audio context and analyser
  const initializeAudioContext = useCallback(async () => {
    if (!audioRef.current || audioContextRef.current) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaElementSource(audioRef.current)

      analyser.fftSize = 256
      source.connect(analyser)
      analyser.connect(audioContext.destination)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      sourceRef.current = source

      // Generate initial waveform data
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      setWaveformData(Array.from({ length: 64 }, () => Math.random() * 100))
    } catch (error) {
      console.error("Error initializing audio context:", error)
    }
  }, [])

  // Animate waveform
  const animateWaveform = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const animate = () => {
      analyser.getByteFrequencyData(dataArray)

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw waveform bars
      const barWidth = canvas.width / 64
      let x = 0

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#8b5cf6") // Purple
      gradient.addColorStop(0.5, "#3b82f6") // Blue
      gradient.addColorStop(1, "#06b6d4") // Cyan

      for (let i = 0; i < 64; i++) {
        const barHeight = isPlaying
          ? (dataArray[i] / 255) * canvas.height * 0.8 + 10
          : Math.sin(Date.now() * 0.001 + i * 0.1) * 20 + 30

        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight)

        x += barWidth
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animate()
  }, [isPlaying])

  // Handle play/pause with event prevention
  const togglePlayPause = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await initializeAudioContext()
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error)
    }
  }

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setTotalDuration(audioRef.current.duration)
      setIsLoading(false)
    }
  }

  // Handle seek
  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  // Toggle mute
  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Start waveform animation when playing
  useEffect(() => {
    if (isPlaying && showWaveform) {
      animateWaveform()
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, showWaveform, animateWaveform])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  if (mode === "compact") {
    return (
      <div className="w-full max-w-full overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-4 border border-gray-600">
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        <div className="flex items-center space-x-4">
          {/* Album Art */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 p-0.5">
              <div className="w-full h-full rounded-lg bg-gray-800 flex items-center justify-center relative overflow-hidden">
                <Image
                  src={albumArt || defaultAlbumArt}
                  alt="Album Cover"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    // Fallback to default if image fails to load
                    const target = e.target as HTMLImageElement
                    target.src = defaultAlbumArt
                  }}
                />
              </div>
            </div>
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">{title}</h4>
            <p className="text-gray-400 text-sm truncate">{artist}</p>
          </div>

          {/* Play Button */}
          <Button
            type="button"
            onClick={togglePlayPause}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full w-10 h-10 p-0"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-xl p-6 border border-gray-600 shadow-2xl">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
        {/* Album Art */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 p-1 shadow-lg">
            <div className="w-full h-full rounded-lg bg-gray-800 flex items-center justify-center relative overflow-hidden">
              <Image
                src={albumArt || defaultAlbumArt}
                alt="Album Cover"
                width={96}
                height={96}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  // Fallback to default if image fails to load
                  const target = e.target as HTMLImageElement
                  target.src = defaultAlbumArt
                }}
              />
            </div>
          </div>
        </div>

        {/* Track Info and Controls */}
        <div className="flex-1 w-full min-w-0">
          {/* Track Info */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white truncate">{title}</h3>
            <p className="text-gray-400 truncate">{artist}</p>
          </div>

          {/* Waveform */}
          {showWaveform && (
            <div className="mb-4 h-16 bg-gray-900/50 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={64}
                className="w-full h-full"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={totalDuration}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                onClick={togglePlayPause}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full w-12 h-12 p-0 shadow-lg"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  type="button"
                  onClick={toggleMute}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
