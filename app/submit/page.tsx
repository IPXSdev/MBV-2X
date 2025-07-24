"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EnhancedAudioPlayer } from "@/components/ui/enhanced-audio-player"
import { Upload, Music, X, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

const GENRES = [
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

const MOOD_TAGS = [
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
  "Dreamy",
  "Intense",
  "Playful",
  "Emotional",
  "Atmospheric",
]

export default function SubmitPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    track_title: "",
    artist_name: "",
    genre: "",
    description: "",
  })

  const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Redirect if not authenticated
  if (!loading && !user) {
    router.push("/login")
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleMoodTagToggle = (tag: string) => {
    setSelectedMoodTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 5)))
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      setError("Please select a valid audio file")
      return
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB")
      return
    }

    setAudioFile(file)
    setError(null)

    // Create preview URL
    const url = URL.createObjectURL(file)
    setAudioUrl(url)
  }

  const uploadToSupabase = async (file: File): Promise<string> => {
    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Create a unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split(".").pop()
      const fileName = `${user?.id}_${timestamp}_${randomString}.${fileExtension}`

      // Use the service client for upload
      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { data, error } = await supabase.storage.from("audio-submissions").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("Upload error:", error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("audio-submissions").getPublicUrl(data.path)

      setUploadProgress(100)
      return urlData.publicUrl
    } catch (error) {
      console.error("Upload error:", error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validation
    if (!formData.track_title.trim()) {
      setError("Track title is required")
      return
    }

    if (!formData.artist_name.trim()) {
      setError("Artist name is required")
      return
    }

    if (!formData.genre) {
      setError("Genre is required")
      return
    }

    if (!audioFile) {
      setError("Please select an audio file")
      return
    }

    if (user?.role !== "master_dev" && (user?.submission_credits || 0) <= 0) {
      setError("You don't have any submission credits remaining")
      return
    }

    try {
      setIsSubmitting(true)

      // Upload file first
      const fileUrl = await uploadToSupabase(audioFile)

      // Create submission
      const response = await fetch("/api/submissions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          track_title: formData.track_title.trim(),
          artist_name: formData.artist_name.trim(),
          genre: formData.genre,
          mood_tags: selectedMoodTags,
          description: formData.description.trim(),
          file_url: fileUrl,
          file_size: Math.round((audioFile.size / 1024 / 1024) * 100) / 100, // MB with 2 decimal places
          duration: 0, // Will be calculated on the backend if needed
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit track")
      }

      setSuccess("Track submitted successfully! You can view your submissions in your dashboard.")

      // Reset form
      setFormData({
        track_title: "",
        artist_name: "",
        genre: "",
        description: "",
      })
      setSelectedMoodTags([])
      setAudioFile(null)
      setAudioUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Redirect to submissions page after a delay
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Submit Your Track
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Share your music with industry professionals
            </CardDescription>
            {user && user.role !== "master_dev" && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Submission Credits:</strong> {user.submission_credits || 0} remaining
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Audio File Upload */}
              <div className="space-y-2">
                <Label htmlFor="audio-file" className="text-sm font-medium text-gray-700">
                  Audio File *
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading || isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isSubmitting}
                    className="mb-2"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Audio File
                  </Button>
                  <p className="text-sm text-gray-500">Supported formats: MP3, WAV, FLAC, M4A (Max 50MB)</p>
                  {audioFile && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {audioFile.name} ({Math.round((audioFile.size / 1024 / 1024) * 100) / 100} MB)
                    </p>
                  )}
                </div>
              </div>

              {/* Audio Preview */}
              {audioUrl && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Preview</Label>
                  <EnhancedAudioPlayer
                    src={audioUrl}
                    title={formData.track_title || "Untitled Track"}
                    artist={formData.artist_name || "Unknown Artist"}
                  />
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Track Title */}
              <div className="space-y-2">
                <Label htmlFor="track-title" className="text-sm font-medium text-gray-700">
                  Track Title *
                </Label>
                <Input
                  id="track-title"
                  value={formData.track_title}
                  onChange={(e) => handleInputChange("track_title", e.target.value)}
                  placeholder="Enter track title"
                  disabled={isSubmitting}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Artist Name */}
              <div className="space-y-2">
                <Label htmlFor="artist-name" className="text-sm font-medium text-gray-700">
                  Artist Name *
                </Label>
                <Input
                  id="artist-name"
                  value={formData.artist_name}
                  onChange={(e) => handleInputChange("artist_name", e.target.value)}
                  placeholder="Enter artist name"
                  disabled={isSubmitting}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Genre */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Genre *</Label>
                <Select value={formData.genre} onValueChange={(value) => handleInputChange("genre", value)}>
                  <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mood Tags */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Mood Tags (Select up to 5)</Label>
                <div className="flex flex-wrap gap-2">
                  {MOOD_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedMoodTags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedMoodTags.includes(tag)
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          : "hover:bg-purple-50 hover:border-purple-300"
                      }`}
                      onClick={() => handleMoodTagToggle(tag)}
                    >
                      {tag}
                      {selectedMoodTags.includes(tag) && <X className="w-3 h-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Selected: {selectedMoodTags.length}/5</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Tell us about your track..."
                  rows={4}
                  disabled={isSubmitting}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || isUploading || !audioFile}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting Track...
                  </>
                ) : (
                  "Submit Track"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
