"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

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
import { Upload, Tag, FileAudio, CheckCircle, AlertCircle, Zap, Crown, Star, Clock } from "lucide-react"

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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioDuration, setAudioDuration] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

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
        if (userData.user.tier === "creator" && userData.user.submission_credits === 0) {
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Update audio duration when a new file is selected
      const reader = new FileReader()
      reader.onload = (e) => {
        const audioContext = new AudioContext()
        audioContext.decodeAudioData(e.target?.result as ArrayBuffer).then((buffer) => {
          setAudioDuration(buffer.duration)
        })
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const toggleMoodTag = (tag: string) => {
    setSelectedMoodTags((prevTags) => {
      if (prevTags.includes(tag)) {
        return prevTags.filter((t) => t !== tag)
      } else {
        return [...prevTags, tag]
      }
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

    setSubmitting(true)
    setUploadProgress(0) // Reset upload progress

    const submitData = new FormData()
    submitData.append("title", formData.title)
    submitData.append("artistName", formData.artistName)
    submitData.append("genre", formData.genre)
    submitData.append("description", formData.description)
    submitData.append("audio", selectedFile as Blob) // Explicitly cast selectedFile to Blob
    submitData.append("moodTags", JSON.stringify(selectedMoodTags))

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        body: submitData,
      })

      if (response.ok) {
        setSuccess(true)
        setFormData({
          title: "",
          artistName: "",
          genre: "",
          description: "",
        })
        setSelectedFile(null)
        setSelectedMoodTags([])
        setErrors({})
        // Optionally, reset the file input
        const fileInput = document.getElementById("audio") as HTMLInputElement
        if (fileInput) {
          fileInput.value = "" // This will reset the file input
        }
      } else {
        const errorData = await response.json()
        setErrors(errorData.errors || { submit: "Submission failed" })
      }
    } catch (error) {
      console.error("Submission error:", error)
      setErrors({ submit: "Submission failed" })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener("ended", () => setIsPlaying(false))
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", () => setIsPlaying(false))
      }
    }
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Not authorized</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Submit Your Music</CardTitle>
          <CardDescription>Share your latest track with the world.</CardDescription>
        </CardHeader>
        <CardContent>
          {user && (
            <div className="mb-4">
              <Badge variant="secondary">
                <Zap className="mr-2 h-4 w-4" />
                {user.tier === "creator" ? (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    Creator Tier: {user.submission_credits} Credits Remaining
                  </>
                ) : user.tier === "pro" ? (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Pro Tier: {user.submission_credits} Credits Remaining
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Indie Tier: {user.submission_credits} Credits Remaining
                  </>
                )}
              </Badge>
            </div>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Track submitted successfully!</AlertDescription>
            </Alert>
          )}

          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} />
                {errors.title && <p className="text-red-500">{errors.title}</p>}
              </div>
              <div>
                <Label htmlFor="artistName">Artist Name</Label>
                <Input
                  type="text"
                  id="artistName"
                  name="artistName"
                  value={formData.artistName}
                  onChange={handleInputChange}
                />
                {errors.artistName && <p className="text-red-500">{errors.artistName}</p>}
              </div>
              <div>
                <Label htmlFor="genre">Genre</Label>
                <Select onValueChange={handleGenreChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.genre && <p className="text-red-500">{errors.genre}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Mood Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {moodTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedMoodTags.includes(tag) ? "secondary" : "outline"}
                      onClick={() => toggleMoodTag(tag)}
                      className="cursor-pointer"
                    >
                      <Tag className="mr-2 h-4 w-4" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="audio">
                  Audio File
                  {selectedFile && (
                    <div className="mt-2 flex items-center space-x-2">
                      <FileAudio className="h-4 w-4 text-gray-500" />
                      <span>{selectedFile.name}</span>
                      {audioDuration && (
                        <span>
                          ({Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, "0")})
                        </span>
                      )}
                      {selectedFile && (
                        <button type="button" onClick={handlePlayPause} className="rounded-full p-1 hover:bg-gray-100">
                          {isPlaying ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-4 w-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6.75 5.25a1.5 1.5 0 013 0v13.5a1.5 1.5 0 01-3 0V5.25zm7.5 0a1.5 1.5 0 013 0v13.5a1.5 1.5 0 01-3 0V5.25z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-4 w-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.5 5.653c0-1.426 1.529-2.333 2.779-.966l11.208 6.59a1.5 1.5 0 010 2.634l-11.208 6.59c-1.25.867-2.779-.039-2.779-1.426V5.653z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  <audio ref={audioRef} src={selectedFile ? URL.createObjectURL(selectedFile) : null} />
                </Label>
                <Input type="file" id="audio" name="audio" accept="audio/*" onChange={handleFileChange} />
                {errors.file && <p className="text-red-500">{errors.file}</p>}
              </div>
              {uploadProgress > 0 && (
                <div>
                  <Label>Upload Progress</Label>
                  <Progress value={uploadProgress} />
                </div>
              )}
              <Button disabled={submitting}>
                {submitting ? (
                  <>
                    Submitting...
                    <Upload className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Submit
                    <Upload className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
