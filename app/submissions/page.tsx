"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EnhancedAudioPlayer } from "@/components/player/enhanced-audio-player"
import {
  Music,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Star,
  Crown,
  Zap,
  ArrowLeft,
} from "lucide-react"

interface Submission {
  id: string
  track_title: string
  artist_name: string
  genre: string
  status: "pending" | "approved" | "rejected" | "in_review"
  created_at: string
  updated_at: string
  admin_feedback?: string
  mood_tags: string[]
  audio_url?: string
  duration?: number
  file_size?: number
  admin_rating?: number
}

interface User {
  id: string
  name: string
  email: string
  tier: "creator" | "indie" | "pro"
  submission_credits: number
}

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  in_review: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  approved: "bg-green-500/20 text-green-300 border-green-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
}

const statusIcons = {
  pending: Clock,
  in_review: Eye,
  approved: CheckCircle,
  rejected: XCircle,
}

export default function SubmissionsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [genreFilter, setGenreFilter] = useState<string>("all")
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const authResponse = await fetch("/api/auth/me")
      if (!authResponse.ok) {
        router.push("/login?redirect=/submissions")
        return
      }

      const userData = await authResponse.json()
      setUser(userData.user)

      const submissionsResponse = await fetch("/api/user/submissions")
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        setSubmissions(submissionsData.submissions || [])
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.track_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.artist_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || submission.status === statusFilter
    const matchesGenre = genreFilter === "all" || submission.genre === genreFilter

    return matchesSearch && matchesStatus && matchesGenre
  })

  const getStatusCounts = () => {
    return {
      all: submissions.length,
      pending: submissions.filter((s) => s.status === "pending").length,
      in_review: submissions.filter((s) => s.status === "in_review").length,
      approved: submissions.filter((s) => s.status === "approved").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading your submissions...</p>
        </div>
      </div>
    )
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
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
              <h1 className="text-3xl font-bold">My Submissions</h1>
              <p className="text-gray-400">Track your music submissions and feedback</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
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

            <Button
              onClick={() => router.push("/submit")}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit New Track
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{statusCounts.all}</div>
              <div className="text-sm text-gray-400">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{statusCounts.pending}</div>
              <div className="text-sm text-gray-400">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{statusCounts.in_review}</div>
              <div className="text-sm text-gray-400">In Review</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{statusCounts.approved}</div>
              <div className="text-sm text-gray-400">Approved</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{statusCounts.rejected}</div>
              <div className="text-sm text-gray-400">Rejected</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by title or artist..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all" className="text-white hover:bg-gray-600">
                    All Status
                  </SelectItem>
                  <SelectItem value="pending" className="text-white hover:bg-gray-600">
                    Pending
                  </SelectItem>
                  <SelectItem value="in_review" className="text-white hover:bg-gray-600">
                    In Review
                  </SelectItem>
                  <SelectItem value="approved" className="text-white hover:bg-gray-600">
                    Approved
                  </SelectItem>
                  <SelectItem value="rejected" className="text-white hover:bg-gray-600">
                    Rejected
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="w-full md:w-48 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Filter by genre" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all" className="text-white hover:bg-gray-600">
                    All Genres
                  </SelectItem>
                  <SelectItem value="Hip Hop" className="text-white hover:bg-gray-600">
                    Hip Hop
                  </SelectItem>
                  <SelectItem value="R&B" className="text-white hover:bg-gray-600">
                    R&B
                  </SelectItem>
                  <SelectItem value="Pop" className="text-white hover:bg-gray-600">
                    Pop
                  </SelectItem>
                  <SelectItem value="Rock" className="text-white hover:bg-gray-600">
                    Rock
                  </SelectItem>
                  <SelectItem value="Electronic" className="text-white hover:bg-gray-600">
                    Electronic
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {filteredSubmissions.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <Music className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {submissions.length === 0 ? "No submissions yet" : "No submissions match your filters"}
              </h3>
              <p className="text-gray-400 mb-6">
                {submissions.length === 0
                  ? "Submit your first track to get started with professional feedback"
                  : "Try adjusting your search or filter criteria"}
              </p>
              {submissions.length === 0 && (
                <Button
                  onClick={() => router.push("/submit")}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Track
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredSubmissions.map((submission) => {
              const StatusIcon = statusIcons[submission.status]
              return (
                <Card
                  key={submission.id}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-800/80 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{submission.track_title}</h3>
                          <Badge className={`${statusColors[submission.status]} border`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {submission.status.replace("_", " ").toUpperCase()}
                          </Badge>
                          {submission.admin_rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-yellow-400 text-sm font-medium">{submission.admin_rating}/5</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                          <span>by {submission.artist_name}</span>
                          <span>•</span>
                          <span>{submission.genre}</span>
                          <span>•</span>
                          <span>Submitted {formatDate(submission.created_at)}</span>
                          {submission.duration && (
                            <>
                              <span>•</span>
                              <span>{formatDuration(submission.duration)}</span>
                            </>
                          )}
                        </div>

                        {submission.mood_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {submission.mood_tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {submission.audio_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(submission.audio_url, "_blank")}
                            className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {submission.audio_url && (
                      <div className="mb-4">
                        <EnhancedAudioPlayer
                          src={submission.audio_url}
                          title={submission.track_title}
                          artist={submission.artist_name}
                          duration={submission.duration}
                          compact={true}
                          showWaveform={true}
                        />
                      </div>
                    )}

                    {submission.admin_feedback && (
                      <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                        <h4 className="text-sm font-medium text-white mb-2">Admin Feedback:</h4>
                        <p className="text-gray-300 text-sm">{submission.admin_feedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
