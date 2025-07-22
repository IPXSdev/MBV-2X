"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Music,
  Search,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  Star,
  Headphones,
  Play,
  Pause,
  Filter,
  SortAsc,
  SortDesc,
  Loader2,
  Info,
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { formatRelativeTime } from "@/lib/utils"

interface Submission {
  id: string
  title: string
  artist: string
  genre: string
  description: string
  mood_tags: string[]
  file_url: string
  status: string
  feedback: string | null
  rating: number | null
  created_at: string
  updated_at: string
}

interface SubmissionStats {
  total: number
  pending: number
  approved: number
  rejected: number
  success_rate: number
}

export default function SubmissionsPage() {
  const [user, setUser] = useState<any>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<SubmissionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Filters and search
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")

  // Audio player state
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Feedback modal
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function loadUserData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/login?redirect=/submissions")
          return
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (userError) {
          throw userError
        }

        setUser(userData)
        loadSubmissions(userData.id)
      } catch (err) {
        console.error("Error loading user data:", err)
        setError("Failed to load user data")
        setLoading(false)
      }
    }

    loadUserData()
  }, [router, supabase])

  const loadSubmissions = async (userId: string) => {
    try {
      setLoading(true)
      setError("")

      // Build query
      let query = supabase
        .from("submissions")
        .select("*")
        .eq("user_id", userId)
        .order(sortBy, { ascending: sortOrder === "asc" })

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`)
      }

      // Pagination
      const from = (currentPage - 1) * 10
      const to = from + 9
      query = query.range(from, to)

      const { data: submissions, error: submissionsError, count } = await query

      if (submissionsError) {
        throw submissionsError
      }

      setSubmissions(submissions || [])

      if (count !== null) {
        setTotalPages(Math.ceil(count / 10))
      }

      // Load stats
      const { data: statsData, error: statsError } = await supabase.rpc("get_user_submission_stats", {
        user_id_param: userId,
      })

      if (statsError) {
        console.error("Error loading stats:", statsError)
      } else if (statsData) {
        setStats(statsData)
      }
    } catch (err) {
      console.error("Error loading submissions:", err)
      setError("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  const handlePlayAudio = (submissionId: string) => {
    if (currentlyPlaying === submissionId && isPlaying) {
      setIsPlaying(false)
    } else {
      setCurrentlyPlaying(submissionId)
      setIsPlaying(true)
    }
  }

  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return

    try {
      setDeleting(true)
      setError("")

      // Find the submission
      const submission = submissions.find((s) => s.id === submissionToDelete)

      if (!submission) {
        throw new Error("Submission not found")
      }

      // Check if submission is pending (only pending submissions can be deleted)
      if (submission.status !== "pending") {
        throw new Error("Only pending submissions can be deleted")
      }

      // Delete the submission
      const { error: deleteError } = await supabase
        .from("submissions")
        .delete()
        .eq("id", submissionToDelete)
        .eq("user_id", user.id) // Safety check

      if (deleteError) {
        throw deleteError
      }

      // Refund credit if not pro tier
      if (user.tier !== "pro") {
        const { error: creditError } = await supabase
          .from("users")
          .update({ submission_credits: user.submission_credits + 1 })
          .eq("id", user.id)

        if (creditError) {
          console.error("Error refunding credit:", creditError)
          // Continue anyway, the submission is already deleted
        }
      }

      // Delete the file from storage
      // Extract the path from the URL
      const fileUrl = submission.file_url
      const storageUrl = supabase.storage.from("audio").getPublicUrl("").data.publicUrl
      const filePath = fileUrl.replace(storageUrl, "")

      if (filePath) {
        const { error: storageError } = await supabase.storage.from("audio").remove([filePath])

        if (storageError) {
          console.error("Error deleting file:", storageError)
          // Continue anyway, the submission record is already deleted
        }
      }

      setSuccess("Submission deleted successfully")
      setSubmissions(submissions.filter((s) => s.id !== submissionToDelete))

      // Update stats
      if (stats) {
        setStats({
          ...stats,
          total: stats.total - 1,
          pending: stats.pending - 1,
        })
      }

      // Close modal
      setDeleteModalOpen(false)
      setSubmissionToDelete(null)
    } catch (err: any) {
      console.error("Error deleting submission:", err)
      setError(err.message || "Failed to delete submission")
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-500",
      in_review: "bg-blue-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
    }
    return (
      <Badge className={`${variants[status as keyof typeof variants]} text-white`}>{status.replace("_", " ")}</Badge>
    )
  }

  const renderStarRating = (rating: number | null) => {
    if (!rating) return null

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
          />
        ))}
      </div>
    )
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-xl">Loading your submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Submissions</h1>
          <p className="text-gray-400">Track and manage your music submissions</p>
        </div>

        {error && (
          <Alert className="bg-red-900/50 border-red-700 mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-900/50 border-green-700 mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-200">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Submissions</CardTitle>
                <Music className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.approved}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Rejected</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.rejected}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Success Rate</CardTitle>
                <Star className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.success_rate ? `${stats.success_rate.toFixed(1)}%` : "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <Button onClick={() => router.push("/submit")} className="bg-blue-600 hover:bg-blue-700">
              <Music className="h-4 w-4 mr-2" />
              Submit New Track
            </Button>
            <Button
              onClick={() => {
                setStatusFilter("all")
                setSearchQuery("")
                setSortBy("created_at")
                setSortOrder("desc")
                setCurrentPage(1)
                loadSubmissions(user.id)
              }}
              variant="outline"
              className="border-gray-600 bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full md:w-40 bg-gray-800 border-gray-700 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full md:w-40 bg-gray-800 border-gray-700 text-white">
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="created_at">Date Submitted</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="artist">Artist</SelectItem>
                <SelectItem value="genre">Genre</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              variant="outline"
              size="icon"
              className="border-gray-600 bg-transparent"
            >
              {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-400">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No submissions found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Submit your first track to get started"}
                </p>
                <Button onClick={() => router.push("/submit")} className="mt-4 bg-blue-600 hover:bg-blue-700">
                  Submit a Track
                </Button>
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission) => (
              <Card key={submission.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-white">{submission.title}</h3>
                        {getStatusBadge(submission.status)}
                        {submission.rating && renderStarRating(submission.rating)}
                      </div>
                      <div className="text-gray-400 space-y-1">
                        <p className="flex items-center">
                          <Headphones className="h-4 w-4 mr-2" />
                          Artist: {submission.artist}
                        </p>
                        <p className="flex items-center">
                          <Music className="h-4 w-4 mr-2" />
                          Genre: {submission.genre}
                        </p>
                        {submission.mood_tags && submission.mood_tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-sm text-gray-500">Mood:</span>
                            {submission.mood_tags.map((tag) => (
                              <Badge key={tag} className="bg-gray-700 text-gray-300 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Submitted: {formatRelativeTime(submission.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={() => handlePlayAudio(submission.id)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 bg-transparent"
                      >
                        {currentlyPlaying === submission.id && isPlaying ? (
                          <Pause className="h-4 w-4 mr-1" />
                        ) : (
                          <Play className="h-4 w-4 mr-1" />
                        )}
                        {currentlyPlaying === submission.id && isPlaying ? "Pause" : "Play"}
                      </Button>

                      <Button
                        onClick={() => window.open(submission.file_url, "_blank")}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 bg-transparent"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>

                      {submission.feedback && (
                        <Button
                          onClick={() => {
                            setSelectedSubmission(submission)
                            setFeedbackModalOpen(true)
                          }}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Feedback
                        </Button>
                      )}

                      {submission.status === "pending" && (
                        <Button
                          onClick={() => {
                            setSubmissionToDelete(submission.id)
                            setDeleteModalOpen(true)
                          }}
                          variant="destructive"
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && submissions.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing {Math.min((currentPage - 1) * 10 + 1, submissions.length)} to{" "}
              {Math.min(currentPage * 10, submissions.length)} of {totalPages * 10} submissions
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1)
                  setCurrentPage(newPage)
                  loadSubmissions(user.id)
                }}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="border-gray-600"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => {
                  const newPage = Math.min(totalPages, currentPage + 1)
                  setCurrentPage(newPage)
                  loadSubmissions(user.id)
                }}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="border-gray-600"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Feedback for "{selectedSubmission?.title}"</DialogTitle>
              <DialogDescription className="text-gray-400">Review feedback from our team</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedSubmission?.rating && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Rating</h4>
                  <div className="flex items-center">
                    {renderStarRating(selectedSubmission.rating)}
                    <span className="ml-2 text-white">{selectedSubmission.rating}/5</span>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Feedback</h4>
                <div className="bg-gray-700 rounded-md p-4 text-white">
                  {selectedSubmission?.feedback || "No detailed feedback provided."}
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-400 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Reviewed {selectedSubmission?.updated_at && formatRelativeTime(selectedSubmission.updated_at)}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Delete Submission</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete this submission? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-white">
                If you delete this submission, your credit will be refunded and you can submit another track.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteModalOpen(false)
                    setSubmissionToDelete(null)
                  }}
                  className="border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteSubmission}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Submission"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
