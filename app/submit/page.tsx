"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EnhancedAudioPlayer } from "@/components/ui/enhanced-audio-player"
import { Upload, Music, CheckCircle, AlertCircle, ArrowLeft, Crown, Star, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const MOOD_TAGS = [
  "Energetic",
  "Chill",
  "Dark",
  "Uplifting",
  "Aggressive",
  "Romantic",
  "Melancholic",
  "Party",
  "Introspective",
  "Confident",
  "Dreamy",
  "Raw",
]

const GENRE_OPTIONS = ["Hip Hop", "R&B", "Pop", "Rock", "Electronic", "Jazz", "Blues", "Country", "Other"]

interface User {
  id: string
  name: string
  email: string
  tier: "creator" | "indie" | "pro"
  submission_credits: number
  role: string
}

export default function SubmitPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    genre: "",
    description: "",
    mood_tags: [] as string[],
    contact_email: "",
    contact_phone: "",
    social_media: "",
  })

  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioPreview, setAudioPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (!response.ok) {
        router.push("/login?redirect=/submit")
        return
      }
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/login?redirect=/submit")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMoodToggle = (mood: string) => {
    setFormData((prev) => ({
      ...prev,
      mood_tags: prev.mood_tags.includes(mood)
        ? prev.mood_tags.filter((tag) => tag !== mood)
        : [...prev.mood_tags, mood],
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/m4a", "audio/aac"]
      if (!validTypes.includes(file.type)) {
        setErrorMessage("Please upload a valid audio file (MP3, WAV, M4A, AAC)")
        return
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage("File size must be less than 50MB")
        return
      }

      setAudioFile(file)
      setAudioPreview(URL.createObjectURL(file))
      setErrorMessage("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!audioFile) {
      setErrorMessage("Please select an audio file")
      return
    }

    if (!formData.title || !formData.artist || !formData.contact_email) {
      setErrorMessage("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)
    setSubmitStatus("idle")
    setErrorMessage("")

    try {
      const submitFormData = new FormData()
      submitFormData.append("audio_file", audioFile)
      submitFormData.append("title", formData.title)
      submitFormData.append("artist", formData.artist)
      submitFormData.append("genre", formData.genre)
      submitFormData.append("description", formData.description)
      submitFormData.append("mood_tags", JSON.stringify(formData.mood_tags))
      submitFormData.append("contact_email", formData.contact_email)
      submitFormData.append("contact_phone", formData.contact_phone)
      submitFormData.append("social_media", formData.social_media)

      const response = await fetch("/api/submissions/create", {
        method: "POST",
        body: submitFormData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Submission failed")
      }

      setSubmitStatus("success")
      setUploadProgress(100)

      // Reset form
      setFormData({
        title: "",
        artist: "",
        genre: "",
        description: "",
        mood_tags: [],
        contact_email: "",
        contact_phone: "",
        social_media: "",
      })
      setAudioFile(null)
      setAudioPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Submission error:", error)
      setSubmitStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Submit Your Track</h1>
              <p className="text-gray-400">Share your music with industry professionals</p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              {user.tier === "indie" && <Star className="h-4 w-4 text-blue-400" />}
              {user.tier === "pro" && <Crown className="h-4 w-4 text-purple-400" />}
              <span className="text-sm text-gray-400 capitalize">{user.tier} Plan</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4 text-orange-400" />
              <span className="text-white font-medium">
                {user.submission_credits === 999999 ? "∞" : user.submission_credits} credits
              </span>
            </div>
          </div>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="w-5 h-5" />
              Track Submission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Audio File Upload */}
              <div className="space-y-2">
                <Label htmlFor="audio_file" className="text-white">
                  Audio File *
                </Label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="audio_file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Audio File
                  </Button>
                  <p className="text-sm text-gray-400 mt-2">MP3, WAV, M4A, AAC (Max 50MB)</p>
                  {audioFile && <p className="text-sm text-green-400 mt-2">Selected: {audioFile.name}</p>}
                </div>
              </div>

              {/* Audio Preview */}
              {audioPreview && (
                <div className="space-y-2">
                  <Label className="text-white">Preview</Label>
                  <EnhancedAudioPlayer
                    src={audioPreview}
                    title={formData.title || "Untitled"}
                    artist={formData.artist || "Unknown Artist"}
                  />
                </div>
              )}

              {/* Track Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">
                    Track Title *
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    placeholder="Enter track title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artist" className="text-white">
                    Artist Name *
                  </Label>
                  <Input
                    id="artist"
                    name="artist"
                    value={formData.artist}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    placeholder="Enter artist name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre" className="text-white">
                  Genre
                </Label>
                <select
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="">Select a genre</option>
                  {GENRE_OPTIONS.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  placeholder="Tell us about your track..."
                  rows={3}
                />
              </div>

              {/* Mood Tags */}
              <div className="space-y-2">
                <Label className="text-white">Mood Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {MOOD_TAGS.map((mood) => (
                    <Badge
                      key={mood}
                      variant={formData.mood_tags.includes(mood) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        formData.mood_tags.includes(mood)
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                      }`}
                      onClick={() => handleMoodToggle(mood)}
                    >
                      {mood}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="text-white">
                      Email *
                    </Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone" className="text-white">
                      Phone
                    </Label>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_media" className="text-white">
                    Social Media
                  </Label>
                  <Input
                    id="social_media"
                    name="social_media"
                    value={formData.social_media}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    placeholder="@username or profile URL"
                  />
                </div>
              </div>

              {/* Upload Progress */}
              {isSubmitting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* Status Messages */}
              {submitStatus === "success" && (
                <Alert className="bg-green-500/20 border-green-500/30">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <AlertDescription className="text-green-300">
                    Track submitted successfully! We'll review it and get back to you.
                  </AlertDescription>
                </Alert>
              )}

              {(submitStatus === "error" || errorMessage) && (
                <Alert className="bg-red-500/20 border-red-500/30">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <AlertDescription className="text-red-300">{errorMessage}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !audioFile}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
              >
                {isSubmitting ? "Submitting..." : "Submit Track"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
