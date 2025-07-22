"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  Music,
  Tag,
  FileAudio,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  ArrowLeft,
  Zap,
  Crown,
  Star,
} from "lucide-react"

interface SubmissionUser {
  id: string
  name: string
  email: string
  tier: "creator" | "indie" | "pro"
  submission_credits: number
  role: string
}

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
  "Latin",
  "World",
  "Alternative",
  "Indie",
  "Funk",
  "Soul",
  "Gospel",
  "Trap",
  "Drill",
  "Afrobeats",
  "Other",
]

const moodTags = [
  "Energetic",
  "Chill",
  "Dark",
  "Uplifting",
  "Melancholic",
  "Aggressive",
  "Romantic",
  "Mysterious",
  "Playful",
  "Intense",
  "Dreamy",
  "Nostalgic",
  "Powerful",
  "Smooth",
  "Raw",
  "Cinematic",
  "Atmospheric",
  "Groovy",
  "Emotional",
  "Epic",
]

export default function SubmitPage() {
  const [user, setUser] = useState<SubmissionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: "",
    artistName: "",
    genre: "",
    description: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)

        // Check if user can submit
        if (userData.user.tier === "creator") {
          // Redirect to upgrade page
          router.push("/pricing?reason=submit")
          return
        }

        if (userData.user.submission_credits === 0) {
          // Redirect to buy credits
          router.push("/pricing?reason=credits")
          return
        }
      } else {
        router.push("/login?redirect=/submit")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/login?redirect=/submit")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/m4a", "audio/aac"]
    if (!allowedTypes.includes(file.type)) {
      setErrors({ file: "Please select a valid audio file (MP3, WAV, M4A, AAC)" })
      return
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setErrors({ file: "File size must be less than 50MB" })
      return
    }

    setSelectedFile(file)
    setErrors({ ...errors, file: "" })
  }

  const handleMoodTagToggle = (tag: string) => {
    if (selectedMoodTags.includes(tag)) {
      setSelectedMoodTags(selectedMoodTags.filter((t) => t !== tag))
    } else if (selectedMoodTags.length < 5) {
      setSelectedMoodTags([...selectedMoodTags, tag])
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Track title is required"
    }

    if (!formData.artistName.trim()) {
      newErrors.artistName = "Artist name is required"
    }

    if (!formData.genre) {
      newErrors.genre = "Genre is required"
    }

    if (!selectedFile) {
      newErrors.file = "Audio file is required"
    }

    if (selectedMoodTags.length === 0) {
      newErrors.moodTags = "Select at least one mood tag"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !selectedFile || !user) return

    setSubmitting(true)
    setUploadProgress(0)

    try {
      // Create form data for file upload
      const uploadFormData = new FormData()
      uploadFormData.append("file", selectedFile)
      uploadFormData.append("title", formData.title)
      uploadFormData.append("artistName", formData.artistName)
      uploadFormData.append("genre", formData.genre)
      uploadFormData.append("description", formData.description)
      uploadFormData.append("moodTags", JSON.stringify(selectedMoodTags))

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 10
        })
      }, 200)

      const response = await fetch("/api/submissions/create", {
        method: "POST",
        body: uploadFormData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        setSuccess(true)
        // Reset form
        setFormData({ title: "", artistName: "", genre: "", description: "" })
        setSelectedFile(null)
        setSelectedMoodTags([])

        // Redirect after success
        setTimeout(() => {
          router.push("/submissions")
        }, 2000)
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || "Failed to submit track" })
      }
    } catch (error) {
      console.error("Submission error:", error)
      setErrors({ submit: "Network error. Please try again." })
    } finally {
      setSubmitting(false)
      setTimeout(() => setUploadProgress(0), 1000)
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="bg-gray-800 border-gray-700 w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Submission Successful!</h2>
            <p className="text-gray-400 mb-6">
              Your track has been submitted for review. You'll receive feedback within 3-5 business days.
            </p>
            <Button
              onClick={() => router.push("/submissions")}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              View My Submissions
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
              <h1 className="text-3xl font-bold">Submit Your Music</h1>
              <p className="text-gray-400">Get your track reviewed by industry professionals</p>
            </div>
          </div>
          {user && (
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
          )}
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Track Details */}
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Music className="h-5 w-5 mr-2" />
                    Track Information
                  </CardTitle>
                  <CardDescription className="text-gray-400">Provide details about your track</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-white">
                      Track Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter your track title"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                    {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <Label htmlFor="artistName" className="text-white">
                      Artist Name *
                    </Label>
                    <Input
                      id="artistName"
                      value={formData.artistName}
                      onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                      placeholder="Enter artist name"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                    {errors.artistName && <p className="text-red-400 text-sm mt-1">{errors.artistName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="genre" className="text-white">
                      Genre *
                    </Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(value) => setFormData({ ...formData, genre: value })}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select a genre" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {genres.map((genre) => (
                          <SelectItem key={genre} value={genre} className="text-white hover:bg-gray-600">
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.genre && <p className="text-red-400 text-sm mt-1">{errors.genre}</p>}
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Tell us about your track, inspiration, or any specific feedback you're looking for..."
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mood Tags */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Tag className="h-5 w-5 mr-2" />
                    Mood Tags *
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Select up to 5 tags that describe the mood of your track
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedMoodTags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-purple-600 text-white cursor-pointer hover:bg-purple-700"
                        onClick={() => handleMoodTagToggle(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {moodTags
                      .filter((tag) => !selectedMoodTags.includes(tag))
                      .map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-gray-600 text-gray-300 cursor-pointer hover:bg-gray-700"
                          onClick={() => handleMoodTagToggle(tag)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Selected: {selectedMoodTags.length}/5</p>
                  {errors.moodTags && <p className="text-red-400 text-sm mt-1">{errors.moodTags}</p>}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - File Upload */}
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <FileAudio className="h-5 w-5 mr-2" />
                    Audio File *
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Upload your track (MP3, WAV, M4A, AAC - Max 50MB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors">
                    {selectedFile ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{selectedFile.name}</p>
                          <p className="text-gray-400 text-sm">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedFile(null)}
                          className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                          <Upload className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium mb-2">Drop your audio file here</p>
                          <p className="text-gray-400 text-sm mb-4">or click to browse</p>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="audio-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("audio-upload")?.click()}
                            className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.file && <p className="text-red-400 text-sm mt-2">{errors.file}</p>}
                </CardContent>
              </Card>

              {/* Submission Guidelines */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Submission Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">High-quality audio files only</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">Original compositions only</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">Professional feedback within 3-5 days</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">Potential placement opportunities</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Upload Progress */}
          {submitting && uploadProgress > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white">Uploading...</span>
                    <span className="text-gray-400">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Alert */}
          {errors.submit && (
            <Alert className="bg-red-900/50 border-red-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-200">{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedFile}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Track
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
