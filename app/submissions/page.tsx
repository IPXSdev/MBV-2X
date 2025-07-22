"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WaveformPlayer } from "@/components/ui/waveform-player"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Music,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Plus,
  ArrowUpDown,
} from "lucide-react"

interface Submission {
  id: string
  title: string
  artist_name: string
  genre: string
  mood_tags: string[]
  status: "pending" | "approved" | "rejected"
  file_url: string
  description?: string
  created_at: string
  updated_at: string
  admin_feedback?: {
    rating: number
    comments: string
    reviewer_name: string
    reviewed_at: string
  }
}

interface SubmissionStats {
  total: number
  pending: number
  approved: number
  rejected: number
  success_rate: number
}

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-300 border-green-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
}

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    success_rate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/user/submissions")
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions)
        calculateStats(data.submissions)
      } else if (response.status === 401) {
        router.push("/login?redirect=/submissions")
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (submissionList: Submission[]) => {
    const total = submissionList.length
    const pending = submissionList.filter((s) => s.status === "pending").length
    const approved = submissionList.filter((s) => s.status === "approved").length
    const rejected = submissionList.filter((s) => s.status === "rejected").length
    const success_rate = total > 0 ? Math.round((approved / total) * 100) : 0

    setStats({ total, pending, approved, rejected, success_rate })
  }

  const handleDelete = async (submissionId: string) => {
    if (!confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSubmissions(submissions.filter((s) => s.id !== submissionId))
        calculateStats(submissions.filter((s) => s.id !== submissionId))
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to delete submission")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Network error. Please try again.")
    }
  }

  const handleDownload = (submission: Submission) => {
    const link = document.createElement("a")
    link.href = submission.file_url
    link.download = `${submission.artist_name} - ${submission.title}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredAndSortedSubmissions = submissions
    .filter((submission) => {
      const matchesSearch =
        submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.genre.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || submission.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "artist":
          return a.artist_name.localeCompare(b.artist_name)
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Submissions</h1>
            <p className="text-gray-400">Track your music submissions and feedback</p>
          </div>
          <Button
            onClick={() => router.push("/submit")}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit New Track
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Music className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Approved</p>
                  <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Rejected</p>
                  <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.success_rate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by title, artist, or genre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all" className="text-white hover:bg-gray-600">
                      All Status
                    </SelectItem>
                    <SelectItem value="pending" className="text-white hover:bg-gray-600">
                      Pending
                    </SelectItem>
                    <SelectItem value="approved" className="text-white hover:bg-gray-600">
                      Approved
                    </SelectItem>
                    <SelectItem value="rejected" className="text-white hover:bg-gray-600">
                      Rejected
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="newest" className="text-white hover:bg-gray-600">
                      Newest First
                    </SelectItem>
                    <SelectItem value="oldest" className="text-white hover:bg-gray-600">
                      Oldest First
                    </SelectItem>
                    <SelectItem value="title" className="text-white hover:bg-gray-600">
                      Title A-Z
                    </SelectItem>
                    <SelectItem value="artist" className="text-white hover:bg-gray-600">
                      Artist A-Z
                    </SelectItem>
                    <SelectItem value="status" className="text-white hover:bg-gray-600">
                      Status
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        {filteredAndSortedSubmissions.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <Music className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {submissions.length === 0 ? "No submissions yet" : "No submissions match your filters"}
              </h3>
              <p className="text-gray-400 mb-6">
                {submissions.length === 0
                  ? "Submit your first track to get professional feedback and potential placement opportunities."
                  : "Try adjusting your search or filter criteria."}
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
          <div className="space-y-4">
            {filteredAndSortedSubmissions.map((submission) => {
              const StatusIcon = statusIcons[submission.status]
              return (
                <Card
                  key={submission.id}
                  className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{submission.title}</h3>
                          <Badge className={`${statusColors[submission.status]} border`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-gray-400 text-sm mb-2">
                          <span>by {submission.artist_name}</span>
                          <span>•</span>
                          <span>{submission.genre}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(submission.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {submission.mood_tags && submission.mood_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {submission.mood_tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {submission.description && (
                          <p className="text-gray-300 text-sm mb-3">{submission.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Audio Player */}
                    <div className="mb-4">
                      <WaveformPlayer
                        audioUrl={submission.file_url}
                        title={`${submission.artist_name} - ${submission.title}`}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(submission)}
                          className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        {submission.admin_feedback && (
                          <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSubmission(submission)}
                                className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Feedback
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Professional Feedback</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                  {selectedSubmission?.title} by {selectedSubmission?.artist_name}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedSubmission?.admin_feedback && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400">Rating:</span>
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${
                                            star <= selectedSubmission.admin_feedback!.rating
                                              ? "text-yellow-400 fill-current"
                                              : "text-gray-600"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-white font-medium">
                                      {selectedSubmission.admin_feedback.rating}/5
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-white mb-2">Comments:</h4>
                                    <p className="text-gray-300 leading-relaxed">
                                      {selectedSubmission.admin_feedback.comments}
                                    </p>
                                  </div>
                                  <div className="text-sm text-gray-400 pt-2 border-t border-gray-700">
                                    Reviewed by {selectedSubmission.admin_feedback.reviewer_name} on{" "}
                                    {new Date(selectedSubmission.admin_feedback.reviewed_at).toLocaleDateString()}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        )}
                        {submission.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(submission.id)}
                            className="border-red-600 text-red-400 hover:bg-red-900/20 bg-transparent"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">ID: {submission.id.slice(0, 8)}...</div>
                    </div>
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
