"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  Music,
  AlertCircle,
  CheckCircle,
  Loader2,
  Play,
  Pause,
  Volume2,
  FileAudio,
  CreditCard,
  Shield,
  Zap,
  Star,
  Crown,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface BucketStatus {
  isWorking: boolean
  error?: string
  details?: string
  retryCount: number
}

export default function SubmitPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    trackTitle: "",
    artistName: "",
    description: "",
    genre: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [audioPreview, setAudioPreview] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [bucketStatus, setBucketStatus] = useState<BucketStatus>({
    isWorking: false,
    retryCount: 0,
  })
  const [checkingBucket, setCheckingBucket] = useState(true)

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      checkBucketStatus()
    }
  }, [user, authLoading, router])

  const checkBucketStatus = async (retryCount = 0) => {
    try {
      setCheckingBucket(true)
      const response = await fetch("/api/debug/simple-bucket-check")
      const data = await response.json()

      if (data.success) {
        setBucketStatus({ isWorking: true, retryCount })
      } else {
        setBucketStatus({
          isWorking: false,
          error: data.error,
          details: data.details,
          retryCount,
        })

        // Auto-retry up to 3 times
        if (retryCount < 3) {
          setTimeout(
            () => {
              checkBucketStatus(retryCount + 1)
            },
            2000 * (retryCount + 1),
          ) // Exponential backoff
        }
      }
    } catch (error) {
      console.error("Bucket check failed:", error)
      setBucketStatus({
        isWorking: false,
        error: "Connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        retryCount,
      })

      // Auto-retry up to 3 times
      if (retryCount < 3) {
        setTimeout(
          () => {
            checkBucketStatus(retryCount + 1)
          },
          2000 * (retryCount + 1),
        )
      }
    } finally {
      setCheckingBucket(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/wave",
      "audio/flac",
      "audio/aac",
      "audio/mp4",
      "audio/m4a",
      "audio/ogg",
      "audio/webm",
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid audio file (MP3, WAV, FLAC, AAC, M4A, OGG, WebM)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)

    // Create audio preview
    const url = URL.createObjectURL(file)
    setAudioPreview(url)

    // Auto-fill track title if empty
    if (!formData.trackTitle) {
      const fileName = file.name.replace(/\.[^/.]+$/, "")
      setFormData((prev) => ({ ...prev, trackTitle: fileName }))
    }
  }

  const handleAudioLoad = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an audio file to submit",
        variant: "destructive",
      })
      return
    }

    if (!formData.trackTitle.trim() || !formData.artistName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both track title and artist name",
        variant: "destructive",
      })
      return
    }

    // Master dev and admin users have unlimited submissions
    if (user && user.role !== "master_dev" && user.role !== "admin" && user.submission_credits <= 0) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 submission credit to submit a track",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      setUploadProgress(0)

      const submitFormData = new FormData()
      submitFormData.append("audio", selectedFile)
      submitFormData.append("trackTitle", formData.trackTitle.trim())
      submitFormData.append("artistName", formData.artistName.trim())
      submitFormData.append("description", formData.description.trim())
      submitFormData.append("genre", formData.genre)

      const response = await fetch("/api/submissions/create", {
        method: "POST",
        body: submitFormData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Submission failed")
      }

      toast({
        title: "Submission Successful!",
        description: "Your track has been submitted for review. You'll be notified once it's been reviewed.",
      })

      // Reset form
      setFormData({
        trackTitle: "",
        artistName: "",
        description: "",
        genre: "",
      })
      setSelectedFile(null)
      setAudioPreview(null)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Redirect to submissions page
      router.push("/submissions")
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  if (authLoading || checkingBucket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {authLoading ? "Loading..." : `Checking system status${".".repeat((bucketStatus.retryCount % 3) + 1)}`}
          </p>
          {bucketStatus.retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">Attempt {bucketStatus.retryCount + 1} of 4</p>
          )}
        </div>
      </div>
    )
  }

  if (!bucketStatus.isWorking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              System Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The submission system is currently unavailable. {bucketStatus.error}
                {bucketStatus.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm">Technical Details</summary>
                    <p className="text-xs mt-1 font-mono">{bucketStatus.details}</p>
                  </details>
                )}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={() => checkBucketStatus(0)} variant="outline" className="flex-1">
                <Loader2 className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={() => router.push("/dashboard")} variant="outline" className="flex-1">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check if user has unlimited submissions (master_dev or admin)
  const hasUnlimitedSubmissions = user.role === "master_dev" || user.role === "admin"
  const canSubmit = hasUnlimitedSubmissions || (user.submission_credits && user.submission_credits > 0)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Your Track</h1>
          <p className="text-gray-600">Share your music with industry professionals</p>
        </div>

        {/* Credits Display */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Submission Access</p>
                  <p className="text-sm text-gray-600">
                    {hasUnlimitedSubmissions ? "Unlimited submissions" : "Each submission uses 1 credit"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  {hasUnlimitedSubmissions ? (
                    <Badge variant="default" className="text-lg px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600">
                      <Crown className="h-4 w-4 mr-1" />
                      Unlimited
                    </Badge>
                  ) : (
                    <Badge
                      variant={user.submission_credits && user.submission_credits > 0 ? "default" : "destructive"}
                      className="text-lg px-3 py-1"
                    >
                      {user.submission_credits || 0} credits
                    </Badge>
                  )}
                  {user.role && (
                    <Badge
                      variant="outline"
                      className={`${
                        user.role === "master_dev"
                          ? "border-red-500 text-red-700"
                          : user.role === "admin"
                            ? "border-purple-500 text-purple-700"
                            : user.tier === "pro"
                              ? "border-purple-500 text-purple-700"
                              : user.tier === "indie"
                                ? "border-blue-500 text-blue-700"
                                : "border-gray-500 text-gray-700"
                      }`}
                    >
                      {user.role === "master_dev" && <Crown className="h-3 w-3 mr-1" />}
                      {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                      {user.tier === "pro" && <Star className="h-3 w-3 mr-1" />}
                      {user.tier === "indie" && <Zap className="h-3 w-3 mr-1" />}
                      {user.tier === "creator" && <Shield className="h-3 w-3 mr-1" />}
                      {user.role === "master_dev"
                        ? "Master Dev"
                        : user.role === "admin"
                          ? "Admin"
                          : user.tier || "User"}
                    </Badge>
                  )}
                </div>
                {!hasUnlimitedSubmissions && (!user.submission_credits || user.submission_credits === 0) && (
                  <p className="text-sm text-red-600 mt-1">No credits remaining</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {!canSubmit && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have any submission credits. Please upgrade your plan or contact support to get more credits.
            </AlertDescription>
          </Alert>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Audio File
                </CardTitle>
                <CardDescription>Upload your track (MP3, WAV, FLAC, AAC, M4A, OGG, WebM - Max 50MB)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    selectedFile
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-gray-400 cursor-pointer"
                  }`}
                  onClick={() => !selectedFile && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isSubmitting}
                  />

                  {selectedFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="font-medium text-green-800">{selectedFile.name}</p>
                      <p className="text-sm text-green-600">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFile(null)
                          setAudioPreview(null)
                          setIsPlaying(false)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                        disabled={isSubmitting}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileAudio className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-gray-600">Click to select an audio file</p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </div>
                  )}
                </div>

                {/* Audio Preview */}
                {audioPreview && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Preview</span>
                      <span className="text-xs text-gray-500">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={togglePlayback}
                        disabled={isSubmitting}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <div className="flex-1">
                        <Progress value={duration > 0 ? (currentTime / duration) * 100 : 0} className="h-2" />
                      </div>
                      <Volume2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <audio
                      ref={audioRef}
                      src={audioPreview}
                      onLoadedMetadata={handleAudioLoad}
                      onTimeUpdate={handleAudioTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Track Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Music className="h-5 w-5 mr-2" />
                  Track Information
                </CardTitle>
                <CardDescription>Provide details about your track</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="trackTitle">Track Title *</Label>
                  <Input
                    id="trackTitle"
                    value={formData.trackTitle}
                    onChange={(e) => setFormData({ ...formData, trackTitle: e.target.value })}
                    placeholder="Enter track title"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="artistName">Artist Name *</Label>
                  <Input
                    id="artistName"
                    value={formData.artistName}
                    onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                    placeholder="Enter artist name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Select
                    value={formData.genre}
                    onValueChange={(value) => setFormData({ ...formData, genre: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell us about your track (optional)"
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submission Progress */}
          {isSubmitting && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uploading...</span>
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !selectedFile ||
                !formData.trackTitle.trim() ||
                !formData.artistName.trim() ||
                isSubmitting ||
                !canSubmit
              }
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Track {hasUnlimitedSubmissions ? "" : "(1 Credit)"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
