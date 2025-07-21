"use client"

import { useState } from "react"
import { Play } from "lucide-react"

interface YouTubeEmbedProps {
  videoId: string
  title: string
  className?: string
}

export function YouTubeEmbed({ videoId, title, className = "" }: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  if (isPlaying) {
    return (
      <div className={`relative aspect-video ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        />
      </div>
    )
  }

  return (
    <div className={`relative aspect-video cursor-pointer group ${className}`} onClick={() => setIsPlaying(true)}>
      <img
        src={thumbnailUrl || "/placeholder.svg"}
        alt={title}
        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300 rounded-lg" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/90 hover:bg-white group-hover:scale-110 transition-all duration-300 rounded-full p-4 shadow-2xl">
          <Play className="h-8 w-8 text-black ml-1" fill="currentColor" />
        </div>
      </div>
    </div>
  )
}
