"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface VideoBackgroundProps {
  src: string
  fallbackImage?: string
  className?: string
  children?: React.ReactNode
}

export function VideoBackground({ src, fallbackImage, className = "", children }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoad = () => setIsLoaded(true)
    const handleError = () => setHasError(true)

    video.addEventListener("loadeddata", handleLoad)
    video.addEventListener("error", handleError)

    return () => {
      video.removeEventListener("loadeddata", handleLoad)
      video.removeEventListener("error", handleError)
    }
  }, [])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!hasError ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isLoaded ? "opacity-60" : "opacity-0"
          }`}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : null}

      {/* Fallback background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 transition-opacity duration-1000 ${
          isLoaded && !hasError ? "opacity-0" : "opacity-100"
        }`}
        style={{
          backgroundImage: fallbackImage ? `url(${fallbackImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {children}
    </div>
  )
}
