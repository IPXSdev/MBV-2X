"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  FileAudio,
  Play,
  Pause,
  Star,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Music,
} from "lucide-react"
import { formatRelativeTime, getStatusBadgeColor } from "@/lib/utils"

interface Submission {
  id: string
  title: string
  artist_name: string
  genre?: string
  status: "pending" | "in_review" | "approved" | "rejected"
  admin_rating?: number
  admin_feedback?: string
  submitted_at: string
  updated_at?: string
  file_url?: string
  file_size?: number
  mood_tags?: string[]
  description?: string
  users?: {
    id: string
    name: string
    email: string
    tier: string
  }
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "ranked" | "unranked" | "my_ranked">("all")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewData, setReviewData] = useState({
    rating: 0,
    feedback: "",
    status: "pending" as "pending" | "in_review" | "approved" | "rejected",
    tags: [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadSubmissions()
  }, [filter, statusFilter, pagination.page])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      if (statusFilter) queryParams.append("status", statusFilter)
      queryParams.append("filter", filter)
      queryParams.append("page", pagination.page.toString())
      queryParams.append("limit", pagination.limit.toString())

      const response = await fetch(`/api/admin/submissions?${queryParams.toString()}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch submissions")
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error loading submissions:", error)
      setError(error instanceof Error ? error.message : "Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  const handlePlayAudio = (url: string, submissionId: string) => {
    if (currentlyPlaying === submissionId && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsPlaying(false)
      setCurrentlyPlaying(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(url)
      audio.play()
      audioRef.current = audio

      setCurrentlyPlaying(submissionId)
      setIsPlaying(true)

      audio.addEventListener("ended", () => {
        setIsPlaying(false)
        setCurrentlyPlaying(null)
      })
    }
  }

  const openReviewDialog = (submission: Submission) => {
    setSelectedSubmission(submission)
    setReviewData({
      rating: submission.admin_rating || 0,
      feedback: submission.admin_feedback || "",
      status: submission.status || "pending",
      tags: submission.mood_tags || [],
    })
    setReviewDialogOpen(true)
  }

  const handleReviewSubmit = async () => {
    if (!selectedSubmission) return

    try {
      setSubmitting(true)

      const response = await fetch(`/api/admin/submissions/${selectedSubmission.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit review")
      }

      // Update the submission in the local state
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === selectedSubmission.id
            ? {
                ...sub,
                admin_rating: reviewData.rating,
                admin_feedback: reviewData.feedback,
                status: reviewData.status,
                mood_tags: reviewData.tags,
              }
            : sub,
        ),
      )

      setReviewDialogOpen(false)
      setSelectedSubmission(null)
    } catch (error) {
      console.error("Error submitting review:", error)
      alert(error instanceof Error ? error.message : "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRatingChange = (rating: number) => {
    setReviewData((prev) => ({ ...prev, rating }))
  }

  const handleStatusChange = (status: "pending" | "in_review" | "approved" | "rejected") => {
    setReviewData((prev) => ({ ...prev, status }))
  }

  const handleTagToggle = (tag: string) => {
    setReviewData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Error Loading Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-400">{error}</p>
            <Button onClick={loadSubmissions} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileAudio className="h-5 w-5 text-gray-400" />
              <CardTitle className="text-white">Submissions</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-purple-500">{pagination.total} Total</Badge>
            </div>
          </div>
          <CardDescription className="text-gray-400">
            Review and manage all music submissions from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Tabs
                value={filter}
                onValueChange={(value) => setFilter(value as "all" | "ranked" | "unranked" | "my_ranked")}
                className="w-full"
              >
                <TabsList className="bg-gray-700">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gray-600">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="ranked" className="data-[state=active]:bg-gray-600">
                    Ranked
                  </TabsTrigger>
                  <TabsTrigger value="unranked" className="data-[state=active]:bg-gray-600">
                    Unranked
                  </TabsTrigger>
                  <TabsTrigger value="my_ranked" className="data-[state=active]:bg-gray-600">
                    My Ranked
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Tabs
                value={statusFilter || "all"}
                onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
                className="w-full"
              >
                <TabsList className="bg-gray-700">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gray-600">
                    All Status
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="data-[state=active]:bg-gray-600">
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="in_review" className="data-[state=active]:bg-gray-600">
                    In Review
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="data-[state=active]:bg-gray-600">
                    Approved
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="data-[state=active]:bg-gray-600">
                    Rejected
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Submissions List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-white">Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 bg-gray-700/50 rounded-lg">
                <Music className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">No submissions found</p>
                <p className="text-gray-500 text-sm mt-2">Try changing your filters or check back later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors duration-200"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <FileAudio className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{submission.title}</h4>
                      <p className="text-gray-400 text-sm">by {submission.artist_name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`${getStatusBadgeColor(submission.status)} text-white text-xs`}>
                          {submission.status.replace("_", " ")}
                        </Badge>
                        <span className="text-gray-500 text-xs">{formatRelativeTime(submission.submitted_at)}</span>
                        {submission.users && (
                          <Badge variant="outline" className="text-xs border-gray-500 text-gray-300">
                            {submission.users.tier}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {submission.admin_rating ? (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-yellow-400 text-sm font-medium">{submission.admin_rating}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs border-gray-500 text-gray-300">
                          Unrated
                        </Badge>
                      )}
                      {submission.file_url && (
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePlayAudio(submission.file_url!, submission.id)}
                            className="border-gray-600 bg-transparent hover:bg-gray-600"
                          >
                            {currentlyPlaying === submission.id && isPlaying ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(submission.file_url, "_blank")}
                            className="border-gray-600 bg-transparent hover:bg-gray-600"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <Button
                        size="sm"
                        onClick={() => openReviewDialog(submission)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1 || loading}
                  className="border-gray-600 bg-transparent hover:bg-gray-600"
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNumber =
                      pagination.page <= 3
                        ? i + 1
                        : pagination.page >= pagination.totalPages - 2
                          ? pagination.totalPages - 4 + i
                          : pagination.page - 2 + i

                    if (pageNumber > 0 && pageNumber <= pagination.totalPages) {
                      return (
                        <Button
                          key={pageNumber}
                          variant={pagination.page === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPagination((prev) => ({ ...prev, page: pageNumber }))}
                          disabled={loading}
                          className={
                            pagination.page === pageNumber
                              ? "bg-purple-600 hover:bg-purple-700"
                              : "border-gray-600 bg-transparent hover:bg-gray-600"
                          }
                        >
                          {pageNumber}
                        </Button>
                      )
                    }
                    return null
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages || loading}
                  className="border-gray-600 bg-transparent hover:bg-gray-600"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Review Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 space-y-4">
                  <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg aspect-square flex items-center justify-center">
                    <FileAudio className="h-16 w-16 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-lg">{selectedSubmission.title}</h3>
                    <p className="text-gray-400">by {selectedSubmission.artist_name}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={`${getStatusBadgeColor(selectedSubmission.status)} text-white`}>
                        {selectedSubmission.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">{selectedSubmission.users?.name || "Unknown User"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">
                        {new Date(selectedSubmission.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedSubmission.genre && (
                      <div className="flex items-center space-x-2">
                        <Music className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">{selectedSubmission.genre}</span>
                      </div>
                    )}
                    {selectedSubmission.file_url && (
                      <div className="flex space-x-2 mt-4">
                        <Button
                          onClick={() => handlePlayAudio(selectedSubmission.file_url!, selectedSubmission.id)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          {currentlyPlaying === selectedSubmission.id && isPlaying ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Play Track
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(selectedSubmission.file_url, "_blank")}
                          className="border-gray-600"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:w-2/3 space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-2">Rating</h4>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          variant={reviewData.rating === rating ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleRatingChange(rating)}
                          className={
                            reviewData.rating === rating
                              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                              : "border-gray-600"
                          }
                        >
                          <Star className={`h-4 w-4 ${reviewData.rating >= rating ? "fill-current" : ""}`} />
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Status</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={reviewData.status === "pending" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange("pending")}
                        className={
                          reviewData.status === "pending" ? "bg-yellow-500 hover:bg-yellow-600" : "border-gray-600"
                        }
                      >
                        <Clock className="h-4 w-4 mr-1" /> Pending
                      </Button>
                      <Button
                        variant={reviewData.status === "in_review" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange("in_review")}
                        className={
                          reviewData.status === "in_review" ? "bg-blue-500 hover:bg-blue-600" : "border-gray-600"
                        }
                      >
                        <Clock className="h-4 w-4 mr-1" /> In Review
                      </Button>
                      <Button
                        variant={reviewData.status === "approved" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange("approved")}
                        className={
                          reviewData.status === "approved" ? "bg-green-500 hover:bg-green-600" : "border-gray-600"
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approved
                      </Button>
                      <Button
                        variant={reviewData.status === "rejected" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange("rejected")}
                        className={reviewData.status === "rejected" ? "bg-red-500 hover:bg-red-600" : "border-gray-600"}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Rejected
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Mood Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Energetic",
                        "Chill",
                        "Dark",
                        "Uplifting",
                        "Melancholic",
                        "Aggressive",
                        "Romantic",
                        "Mysterious",
                      ].map((tag) => (
                        <Badge
                          key={tag}
                          variant={reviewData.tags.includes(tag) ? "default" : "outline"}
                          className={`cursor-pointer ${
                            reviewData.tags.includes(tag)
                              ? "bg-purple-500 hover:bg-purple-600"
                              : "border-gray-600 text-gray-300 hover:bg-gray-700"
                          }`}
                          onClick={() => handleTagToggle(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Feedback</h4>
                    <Textarea
                      value={reviewData.feedback}
                      onChange={(e) => setReviewData((prev) => ({ ...prev, feedback: e.target.value }))}
                      placeholder="Provide feedback for the artist..."
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[120px]"
                    />
                  </div>
                </div>
              </div>
              <Separator className="bg-gray-700" />
              <DialogFooter>
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)} className="border-gray-600">
                  Cancel
                </Button>
                <Button
                  onClick={handleReviewSubmit}
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
