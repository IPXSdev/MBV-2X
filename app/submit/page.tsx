"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { EnhancedAudioPlayer } from "@/components/ui/enhanced-audio-player"
import {
  Upload,
  Tag,
  FileAudio,
  CheckCircle,
  AlertCircle,
  Zap,
  Crown,
  Star,
  Clock,
  ArrowLeft,
  Music,
  Sparkles,
  RefreshCw,
  Settings,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  const [selectedMoodTag, setSelectedMoodTag] = useState<string>("")
  const [formData, setFormData] = useState({
    title: "",
    artistName: "",
    genre: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [bucketStatus, setBucketStatus] = useState<{
    exists: boolean
    checking: boolean
    error: string | null
    details?: any
  }>({
    exists: false,
    checking: true,
    error: null,
  })
  const router = useRouter()
  const [audioDuration, setAudioDuration] = useState<number | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    checkBucketStatus()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)

        // Check if user can submit
        if (userData.user.tier === "creator" && userData.user.submission_credits === 0) {
          router.push("/pricing?reason=submit")
          return
        }

        if (userData.user.submission_credits === 0) {
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

  const checkBucketStatus = async () => {
    setBucketStatus({ exists: false, checking: true, error: null })

    try {
      console.log("Checking bucket status...")
      const response = await fetch("/api/debug/bucket-status")

      console.log("Bucket status response:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Bucket status error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Bucket status data:", data)

      if (data.success && data.audioSubmissionsBucket) {
        setBucketStatus({
          exists: true,
          checking: false,
          error: null,
          details: data,
        })
      } else {
        setBucketStatus({
          exists: false,
          checking: false,
          error: data.error || "Audio submissions bucket not found",
          details: data,
        })
      }
    } catch (error) {
      console.error("Bucket status check failed:", error)
      setBucketStatus({
        exists: false,
        checking: false,
        error: error instanceof Error ? error.message : "Failed to check bucket status",
      })
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)

      // Create URL for audio preview
      const url = URL.createObjectURL(file)
      setAudioUrl(url)

      // Create audio element to get duration
      const audio = document.createElement("audio")
      audio.src = url

      audio.addEventListener("loadedmetadata", () => {
        setAudioDuration(audio.duration)
      })

      audio.addEventListener("error", () => {
        console.error("Error loading audio file")
        URL.revokeObjectURL(url)
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleGenreChange = (value: string) => {
    setFormData({
      ...formData,
      genre: value,
    })
  }

  const validateForm = () => {
    const tempErrors: Record<string, string> = {}
    if (!formData.title) {
      tempErrors.title = "Title is required"
    }
    if (!formData.artistName) {
      tempErrors.artistName = "Artist Name is required"
    }
    if (!formData.genre) {
      tempErrors.genre = "Genre is required"
    }
    if (!selectedMoodTag) {
      tempErrors.moodTag = "Mood tag is required"
    }
    if (!selectedFile) {
      tempErrors.file = "Audio file is required"
    }
    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!bucketStatus.exists) {
      setErrors({
        submit: "Storage bucket is not configured. Please contact support or run the bucket creation script.",
      })
      return
    }

    setSubmitting(true)
    setUploadProgress(0)

    try {
      let fileUrl = ""

      // Upload file to Supabase storage if selected
      if (selectedFile) {
        const supabase = createClient()

        const fileExt = selectedFile.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `submissions/${fileName}`

        setUploadProgress(25)

        console.log("Upload details:", {
          bucket: "audio-submissions",
          filePath,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          fileName: selectedFile.name,
        })

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("audio-submissions")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("Upload error details:", uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        console.log("Upload successful:", uploadData)
        setUploadProgress(50)

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("audio-submissions").getPublicUrl(filePath)

        fileUrl = publicUrl
        console.log("Generated public URL:", fileUrl)
        setUploadProgress(75)
      }

      // Submit to API
      const response = await fetch("/api/submissions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          track_title: formData.title,
          artist_name: formData.artistName,
          genre: formData.genre,
          mood_tags: [selectedMoodTag],
          file_url: fileUrl,
          file_size: selectedFile?.size || 0,
          duration: audioDuration || 0,
        }),
      })

      setUploadProgress(100)

      if (response.ok) {
        setSuccess(true)
        setFormData({
          title: "",
          artistName: "",
          genre: "",
        })
        setSelectedFile(null)
        setSelectedMoodTag("")
        setErrors({})
        setAudioDuration(null)
        setAudioUrl(null)

        // Reset file input
        const fileInput = document.getElementById("audio") as HTMLInputElement
        if (fileInput) {
          fileInput.value = ""
        }
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || "Submission failed" })
      }
    } catch (error) {
      console.error("Submission error:", error)
      setErrors({ submit: error instanceof Error ? error.message : "Submission failed" })
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading submission form...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">You need to be logged in to submit music.</p>
        </div>
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
              <h1 className="text-3xl font-bold flex items-center">
                <Music className="h-8 w-8 mr-3 text-purple-400" />
                Submit Your Music
              </h1>
              <p className="text-gray-400">Share your latest track with Grammy-nominated producers</p>
            </div>
          </div>

          {user && (
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                {user.tier === "creator" && <Clock className="h-4 w-4 text-orange-400" />}
                {user.tier === "indie" && <Star className="h-4 w-4 text-blue-400" />}
                {user.tier === "pro" && <Crown className="h-4 w-4 text-purple-400" />}
                <span className="text-sm text-gray-400 capitalize">{user.tier} Plan</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="h-4 w-4 text-orange-400" />
                <span className="text-white font-medium">
                  {user.submission_credits === 999999 ? "∞" : user.submission_credits} credits remaining
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bucket Status Alert */}
        {bucketStatus.checking && (
          <Alert className="mb-6 bg-blue-500/20 border-blue-500/30">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription className="text-blue-300">Checking storage configuration...</AlertDescription>
          </Alert>
        )}

        {!bucketStatus.checking && !bucketStatus.exists && (
          <Alert variant="destructive" className="mb-6 bg-red-500/20 border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              <div className="space-y-3">
                <p className="font-medium">Storage bucket is not configured properly.</p>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Error:</strong> {bucketStatus.error}
                  </p>
                  <p>Please run the bucket creation script or contact support.</p>
                  {bucketStatus.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-red-200 hover:text-red-100">
                        Show technical details
                      </summary>
                      <pre className="mt-2 p-2 bg-red-900/20 rounded text-xs overflow-auto">
                        {JSON.stringify(bucketStatus.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={checkBucketStatus}
                    size="sm"
                    variant="outline"
                    className="border-red-400 text-red-300 hover:bg-red-500/20 bg-transparent"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry Check
                  </Button>
                  <Button
                    onClick={() => window.open("/api/debug/supabase-test", "_blank")}
                    size="sm"
                    variant="outline"
                    className="border-red-400 text-red-300 hover:bg-red-500/20 bg-transparent"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Debug Info
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 bg-green-500/20 border-green-500/30 text-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-300">
              🎉 Track submitted successfully! Our team will review it and provide feedback within 48-72 hours.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {errors.submit && (
          <Alert variant="destructive" className="mb-6 bg-red-500/20 border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">{errors.submit}</AlertDescription>
          </Alert>
        )}

        {/* Main Form Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full">
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Ready to Get Professional Feedback?</CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              Submit your track and get expert review from industry professionals
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Track Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Music className="h-5 w-5 mr-2 text-purple-400" />
                  Track Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title" className="text-white">
                      Track Title *
                    </Label>
                    <Input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                      placeholder="Enter your track title"
                    />
                    {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <Label htmlFor="artistName" className="text-white">
                      Artist Name *
                    </Label>
                    <Input
                      type="text"
                      id="artistName"
                      name="artistName"
                      value={formData.artistName}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                      placeholder="Enter artist name"
                    />
                    {errors.artistName && <p className="text-red-400 text-sm mt-1">{errors.artistName}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="genre" className="text-white">
                    Genre *
                  </Label>
                  <Select onValueChange={handleGenreChange}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-purple-500">
                      <SelectValue placeholder="Select your track's genre" />
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
              </div>

              {/* Mood Tag - Clickable Bubbles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-purple-400" />
                  Mood Tag *
                </h3>
                <p className="text-gray-400 text-sm">Select the mood that best describes your track</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {moodTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedMoodTag(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                        selectedMoodTag === tag
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-transparent shadow-lg transform scale-105"
                          : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:text-white hover:border-gray-500"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {errors.moodTag && <p className="text-red-400 text-sm mt-1">{errors.moodTag}</p>}
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <FileAudio className="h-5 w-5 mr-2 text-purple-400" />
                  Audio File *
                </h3>

                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                  <Input
                    type="file"
                    id="audio"
                    name="audio"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label htmlFor="audio" className="cursor-pointer">
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div className="text-white font-medium">
                        {selectedFile ? selectedFile.name : "Click to upload your audio file"}
                      </div>
                      <div className="text-gray-400 text-sm">Supported formats: MP3, WAV, FLAC (Max 50MB)</div>
                      {selectedFile && audioDuration && (
                        <div className="text-purple-400 text-sm">
                          Duration: {Math.floor(audioDuration / 60)}:
                          {String(Math.floor(audioDuration % 60)).padStart(2, "0")}
                        </div>
                      )}
                    </div>
                  </Label>
                </div>

                {/* Enhanced Audio Player */}
                {selectedFile && audioUrl && (
                  <div className="mt-4">
                    <EnhancedAudioPlayer
                      src={audioUrl}
                      title={formData.title || selectedFile.name}
                      artist={formData.artistName || "Unknown Artist"}
                      duration={audioDuration || undefined}
                      showWaveform={true}
                    />
                  </div>
                )}

                {errors.file && <p className="text-red-400 text-sm">{errors.file}</p>}
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <Label className="text-white">Upload Progress</Label>
                  <Progress value={uploadProgress} className="bg-gray-700" />
                  <p className="text-sm text-gray-400 text-center">{uploadProgress}% uploaded</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={submitting || !bucketStatus.exists}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting Your Track...
                    </>
                  ) : !bucketStatus.exists ? (
                    <>
                      <AlertCircle className="mr-2 h-5 w-5" />
                      Storage Not Configured
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Submit for Professional Review
                    </>
                  )}
                </Button>

                <p className="text-center text-gray-400 text-sm mt-3">
                  {bucketStatus.exists
                    ? "You'll receive expert feedback within 48-72 hours"
                    : "Please configure storage before submitting"}
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Professional Review</h3>
              <p className="text-gray-400 text-sm">Get detailed feedback from Grammy-nominated producers</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Quick Turnaround</h3>
              <p className="text-gray-400 text-sm">Receive feedback within 48-72 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Industry Insights</h3>
              <p className="text-gray-400 text-sm">Learn from professionals who've worked with top artists</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
