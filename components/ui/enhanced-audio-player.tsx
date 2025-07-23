"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react"
import Image from "next/image"

interface EnhancedAudioPlayerProps {
  src: string
  title?: string
  artist?: string
  duration?: number
  showWaveform?: boolean
  mode?: "full" | "compact"
  className?: string
}

export function EnhancedAudioPlayer({
  src,
  title = "Unknown Track",
  artist = "Unknown Artist",
  duration,
  showWaveform = true,
  mode = "full",
  className = "",
}: EnhancedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration || 0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null)

  // Initialize audio context and analyser for waveform
  useEffect(() => {
    if (showWaveform && audioRef.current) {
      const initAudioContext = async () => {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const source = ctx.createMediaElementSource(audioRef.current!)
          const analyserNode = ctx.createAnalyser()

          analyserNode.fftSize = 256
          const bufferLength = analyserNode.frequencyBinCount
          const dataArr = new Uint8Array(bufferLength)

          source.connect(analyserNode)
          analyserNode.connect(ctx.destination)

          setAudioContext(ctx)
          setAnalyser(analyserNode)
          setDataArray(dataArr)
        } catch (error) {
          console.error("Error initializing audio context:", error)
        }
      }

      initAudioContext()
    }

    return () => {
      if (audioContext) {
        audioContext.close()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [showWaveform])

  // Draw waveform visualization
  const drawWaveform = () => {
    if (!canvasRef.current || !analyser || !dataArray) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    analyser.getByteFrequencyData(dataArray)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const barWidth = (canvas.width / dataArray.length) * 2.5
    let barHeight
    let x = 0

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#8b5cf6") // Purple
    gradient.addColorStop(0.5, "#3b82f6") // Blue
    gradient.addColorStop(1, "#06b6d4") // Cyan

    for (let i = 0; i < dataArray.length; i++) {
      barHeight = (dataArray[i] / 255) * canvas.height * 0.8

      ctx.fillStyle = gradient
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

      x += barWidth + 1
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawWaveform)
    }
  }

  useEffect(() => {
    if (isPlaying && showWaveform) {
      drawWaveform()
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, showWaveform, analyser, dataArray])

  const togglePlayPause = async () => {
    if (!audioRef.current) return

    try {
      if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume()
      }

      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error playing audio:", error)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration)
      setIsLoading(false)
    }
  }

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioDuration)
    }
  }

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0)
    }
  }

  if (mode === "compact") {
    return (
      <div className={`flex items-center space-x-4 p-4 bg-gray-800 rounded-lg ${className}`}>
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image
            src="/images/default-album-art.png"
            alt="Album Art"
            width={48}
            height={48}
            className="rounded-lg object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{title}</p>
          <p className="text-gray-400 text-sm truncate">{artist}</p>
        </div>

        <Button
          onClick={togglePlayPause}
          size="sm"
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    )
  }

  return (
    <Card className={`bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-2xl ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-6">
          {/* Album Art */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg blur-xl"></div>
            <Image
              src="/images/default-album-art.png"
              alt="Album Art"
              width={96}
              height={96}
              className="relative rounded-lg object-cover shadow-lg transform hover:scale-105 transition-transform duration-300"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              </div>
            )}
          </div>

          {/* Track Info & Controls */}
          <div className="flex-1 space-y-4">
            {/* Track Info */}
            <div>
              <h3 className="text-white font-semibold text-lg truncate">{title}</h3>
              <p className="text-gray-400 truncate">{artist}</p>
            </div>

            {/* Waveform Visualization */}
            {showWaveform && (
              <div className="relative">
                <canvas ref={canvasRef} width={400} height={60} className="w-full h-15 bg-gray-900/50 rounded-md" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent pointer-events-none"></div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={audioDuration}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={skipBackward}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:text-blue-400 hover:bg-gray-700"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  onClick={togglePlayPause}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg"
                  disabled={isLoading}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <Button
                  onClick={skipForward}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:text-blue-400 hover:bg-gray-700"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={toggleMute}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:text-blue-400 hover:bg-gray-700"
                >
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          crossOrigin="anonymous"
        />
      </CardContent>
    </Card>
  )
}
