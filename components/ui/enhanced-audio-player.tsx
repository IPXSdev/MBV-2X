"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Download,
  Heart,
  Share2,
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration || 0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration)
      setIsLoading(false)
      if (showWaveform) {
        generateWaveform()
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0
        audio.play()
      } else {
        setIsPlaying(false)
        setCurrentTime(0)
      }
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [src, showWaveform, isRepeat])

  const generateWaveform = async () => {
    if (!audioRef.current || !showWaveform) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const response = await fetch(src)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      const rawData = audioBuffer.getChannelData(0)
      const samples = 100
      const blockSize = Math.floor(rawData.length / samples)
      const filteredData = []

      for (let i = 0; i < samples; i++) {
        const blockStart = blockSize * i
        let sum = 0
        for (let j = 0; j < blockSize; j++) {
          sum = sum + Math.abs(rawData[blockStart + j])
        }
        filteredData.push(sum / blockSize)
      }

      const multiplier = Math.pow(Math.max(...filteredData), -1)
      const normalizedData = filteredData.map((n) => n * multiplier)

      setWaveformData(normalizedData)
      setAudioContext(audioContext)
    } catch (error) {
      console.error("Error generating waveform:", error)
    }
  }

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = (value[0] / 100) * audioDuration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0] / 100
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const skipForward = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.min(audio.currentTime + 10, audioDuration)
  }

  const skipBackward = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(audio.currentTime - 10, 0)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0

  if (mode === "compact") {
    return (
      <Card className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={albumArt || "/images/default-album-art.png"}
                alt={`${title} album art`}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium truncate">{title}</h4>
              <p className="text-gray-400 text-sm truncate">{artist}</p>
            </div>

            <Button
              onClick={togglePlayPause}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 w-10 h-10 rounded-full p-0"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>
          </div>

          <audio ref={audioRef} src={src} preload="metadata" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm shadow-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Album Art */}
            <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-lg mx-auto lg:mx-0">
              <Image
                src={albumArt || "/images/default-album-art.png"}
                alt={`${title} album art`}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Track Info & Controls */}
            <div className="flex-1 w-full min-w-0 space-y-4">
              {/* Track Info */}
              <div className="text-center lg:text-left">
                <h3 className="text-xl font-bold text-white mb-1 truncate">{title}</h3>
                <p className="text-gray-300 font-medium truncate">{artist}</p>
              </div>

              {/* Waveform */}
              {showWaveform && waveformData.length > 0 && (
                <div className="relative h-16 bg-gray-800/50 rounded-lg overflow-hidden w-full">
                  <div className="flex items-end justify-center h-full px-2 space-x-1">
                    {waveformData.map((amplitude, index) => {
                      const height = Math.max(amplitude * 100, 2)
                      const isActive = (index / waveformData.length) * 100 <= progress
                      return (
                        <div
                          key={index}
                          className={`flex-1 max-w-[4px] rounded-full transition-all duration-150 ${
                            isActive ? "bg-gradient-to-t from-purple-500 to-blue-400 shadow-sm" : "bg-gray-600/50"
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-2 w-full">
                <Slider value={[progress]} onValueChange={handleSeek} max={100} step={0.1} className="w-full" />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(audioDuration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 w-full">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setIsShuffle(!isShuffle)}
                    size="sm"
                    variant="ghost"
                    className={`text-white hover:bg-gray-700/50 ${isShuffle ? "text-blue-400" : "text-gray-400"}`}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>

                  <Button onClick={skipBackward} size="sm" variant="ghost" className="text-white hover:bg-gray-700/50">
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={togglePlayPause}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 w-12 h-12 rounded-full shadow-lg"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>

                  <Button onClick={skipForward} size="sm" variant="ghost" className="text-white hover:bg-gray-700/50">
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => setIsRepeat(!isRepeat)}
                    size="sm"
                    variant="ghost"
                    className={`text-white hover:bg-gray-700/50 ${isRepeat ? "text-blue-400" : "text-gray-400"}`}
                  >
                    <Repeat className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setIsLiked(!isLiked)}
                    size="sm"
                    variant="ghost"
                    className={`text-white hover:bg-gray-700/50 ${isLiked ? "text-red-400" : "text-gray-400"}`}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                  </Button>

                  <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700/50">
                    <Share2 className="h-4 w-4" />
                  </Button>

                  <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700/50">
                    <Download className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button onClick={toggleMute} size="sm" variant="ghost" className="text-white hover:bg-gray-700/50">
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <audio ref={audioRef} src={src} preload="metadata" />
        </CardContent>
      </Card>
    </div>
  )
}
