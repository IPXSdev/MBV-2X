"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, Music, Play, Pause, AlertCircle, CheckCircle, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SubmitPage() {
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    artistName: "",
    genre: "",
    description: "",
    moodTags: [] as string[],
  })

  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioPreview, setAudioPreview] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)

  // Redirect if not logged in
  if (!user) {
    router.push("/login")
    return null
  }

  // Check if user has credits (unless master dev)
  const hasCredits = user.role === "master_dev" || user.submission_credits > 0

  const genres = [
    "Hip Hop",
    "R&B",
    "Pop",
    "Rock",
    "Electronic",
    "Jazz",
    "Blues",
    "Country",
    "Folk",
    "Classical",
    "Reggae",
    "Funk",
    "Soul",
    "Alternative",
    "Indie",
    "Other",
  ]

  const moodOptions = [
    "Energetic",
    "Chill",
    "Dark",
    "Uplifting",
    "Melancholic",
    "Aggressive",
    "Romantic",
    "Mysterious",
    "Nostalgic",
    "Triumphant",
    "Peaceful",
    "Intense",
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Clear previous errors
    setError(null)

    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/x-wav"]
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload MP3 or WAV files only.")
      return
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      setError("File too large. Maximum size is 50MB.")
      return
    }

    setAudioFile(file)

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setAudioPreview(previewUrl)
    setIsPlaying(false)
  }

  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const handleMoodToggle = (mood: string) => {
    setFormData((prev) => ({
      ...prev,
      moodTags: prev.moodTags.includes(mood) ? prev.moodTags.filter((tag) => tag !== mood) : [...prev.moodTags, mood],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasCredits) {
      setError("You don't have any submission credits. Please upgrade your plan or purchase credits.")
      return
    }

    if (!audioFile) {
      setError("Please select an audio file to upload.")
      return
    }

    if (!formData.title.trim() || !formData.artistName.trim() || !formData.genre) {
      setError("Please fill in all required fields.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const submitFormData = new FormData()
      submitFormData.append("title", formData.title.trim())
      submitFormData.append("artistName", formData.artistName.trim())
      submitFormData.append("genre", formData.genre)
      submitFormData.append("description", formData.description.trim())
      submitFormData.append("moodTags", JSON.stringify(formData.moodTags))
      submitFormData.append("audioFile", audioFile)

      const response = await fetch("/api/submissions/create", {
        method: "POST",
        body: submitFormData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit track")
      }

      setSuccess("Track submitted successfully! Redirecting to your submissions...")

      // Reset form
      setFormData({
        title: "",
        artistName: "",
        genre: "",
        description: "",
        moodTags: [],
      })
      setAudioFile(null)
      setAudioPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Redirect to submissions page after a short delay
      setTimeout(() => {
        router.push("/submissions")
      }, 2000)
    } catch (error) {
      console.error("Submission error:", error)
      setError(error instanceof Error ? error.message : "Failed to submit track")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Submit Your Music</h1>
          <p className="text-gray-400 text-lg">
            Share your track with industry professionals for review and potential placement opportunities.
          </p>
        </div>

        {/* Credits Display */}
        <div className="mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                  <span className="text-gray-300">Submission Credits:</span>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {user.role === "master_dev" ? "Unlimited" : user.submission_credits}
                  </Badge>
                </div>
                {!hasCredits && (
                  <Button onClick={() => router.push("/pricing")} className="bg-blue-600 hover:bg-blue-700">
                    Get Credits
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-500 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Music className="h-6 w-6 mr-2" />
              Track Submission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div>
                <Label htmlFor="audioFile" className="text-gray-300 mb-2 block">
                  Audio File *
                </Label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                  {audioFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{audioFile.name}</p>
                          <p className="text-gray-400 text-sm">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>

                      {audioPreview && (
                        <div className="flex items-center justify-center space-x-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={togglePlayback}
                            className="border-gray-600 bg-transparent"
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {isPlaying ? "Pause" : "Preview"}
                          </Button>
                          <audio ref={audioRef} src={audioPreview} onEnded={handleAudioEnded} className="hidden" />
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-gray-600"
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">Drag and drop your audio file here</p>
                      <p className="text-gray-500 text-sm mb-4">or click to browse</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-gray-600"
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <p className="text-gray-500 text-sm mt-2">Supported formats: MP3, WAV • Maximum size: 50MB</p>
              </div>

              {/* Track Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title" className="text-gray-300">
                    Track Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter track title"
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="artistName" className="text-gray-300">
                    Artist/Producer Name *
                  </Label>
                  <Input
                    id="artistName"
                    value={formData.artistName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, artistName: e.target.value }))}
                    placeholder="Enter artist or producer name"
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="genre" className="text-gray-300">
                  Genre *
                </Label>
                <Select
                  value={formData.genre}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, genre: value }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre} className="text-white">
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Mood/Vibe Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map((mood) => (
                    <Button
                      key={mood}
                      type="button"
                      variant={formData.moodTags.includes(mood) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMoodToggle(mood)}
                      className={
                        formData.moodTags.includes(mood)
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "border-gray-600 text-gray-300 hover:bg-gray-700"
                      }
                    >
                      {mood}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">
                  Description/Notes
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell us about your track, inspiration, or any specific notes for reviewers..."
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={!hasCredits || isSubmitting || !audioFile}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : !hasCredits ? "No Credits Available" : "Submit Track for Review"}
                </Button>

                {!hasCredits && (
                  <p className="text-center text-gray-400 text-sm mt-2">
                    You need submission credits to submit tracks.{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/pricing")}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Upgrade your plan or purchase credits
                    </button>
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
