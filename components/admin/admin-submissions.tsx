"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Star, Clock, User, Calendar, FileAudio, Download, Trash2, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Submission {
  id: string
  track_title: string
  artist_name: string
  description: string
  file_path: string
  file_size: number
  duration: number
  status: "pending" | "approved" | "rejected"
  admin_rating?: number
  admin_feedback?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  users: {
    id: string
    username: string
    email: string
    tier: string
    role: string
  }
  audio_url?: string
}

interface AdminSubmissionsProps {
  currentUser: any
}

export default function AdminSubmissions({ currentUser }: AdminSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null)
  const [reviewData, setReviewData] = useState({
    status: "pending",
    rating: 5,
    feedback: "",
    moodTags: [] as string[],
  })
  const { toast } = useToast()

  const moodOptions = [
    "Energetic",
    "Chill",
    "Dark",
    "Uplifting",
    "Aggressive",
    "Melodic",
    "Atmospheric",
    "Groovy",
    "Emotional",
    "Experimental",
    "Commercial",
    "Underground",
  ]

  useEffect(() => {
    fetchSubmissions()
  }, [filter, currentPage])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/submissions?filter=${filter}&page=${currentPage}&limit=20`)

      if (!response.ok) {
        throw new Error("Failed to fetch submissions")
      }

      const data = await response.json()
      setSubmissions(data.submissions)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error("Error fetching submissions:", error)
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedSubmissions.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select submissions to perform bulk actions",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          submissionIds: selectedSubmissions,
        }),
      })

      if (!response.ok) {
        throw new Error("Bulk action failed")
      }

      const result = await response.json()
      toast({
        title: "Success",
        description: result.message,
      })

      setSelectedSubmissions([])
      fetchSubmissions()
    } catch (error) {
      console.error("Bulk action error:", error)
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      })
    }
  }

  const handleReviewSubmission = async () => {
    if (!reviewingSubmission) return

    try {
      const response = await fetch(`/api/admin/submissions/${reviewingSubmission.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      })

      if (!response.ok) {
        throw new Error("Review failed")
      }

      const result = await response.json()
      toast({
        title: "Success",
        description: result.message,
      })

      setReviewingSubmission(null)
      setReviewData({ status: "pending", rating: 5, feedback: "", moodTags: [] })
      fetchSubmissions()
    } catch (error) {
      console.error("Review error:", error)
      toast({
        title: "Error",
        description: "Failed to review submission",
        variant: "destructive",
      })
    }
  }

  const togglePlayback = (submissionId: string) => {
    if (playingId === submissionId) {
      setPlayingId(null)
    } else {
      setPlayingId(submissionId)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-yellow-500"
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "pro":
        return "bg-purple-500"
      case "indie":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Submissions Management</h2>
          <p className="text-gray-600">Review and manage user submissions</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Submissions</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="ranked">Ranked</SelectItem>
              <SelectItem value="unranked">Unranked</SelectItem>
              <SelectItem value="my_ranked">My Ranked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSubmissions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{selectedSubmissions.length} submission(s) selected</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("bulk_approve")}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("bulk_reject")}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("bulk_delete")}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions List */}
      <div className="grid gap-4">
        {submissions.map((submission) => (
          <Card key={submission.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Checkbox
                    checked={selectedSubmissions.includes(submission.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSubmissions([...selectedSubmissions, submission.id])
                      } else {
                        setSelectedSubmissions(selectedSubmissions.filter((id) => id !== submission.id))
                      }
                    }}
                  />

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{submission.track_title || "Untitled"}</h3>
                        <p className="text-gray-600">by {submission.artist_name || "Unknown Artist"}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(submission.status)} text-white`}>{submission.status}</Badge>
                        <Badge className={`${getTierColor(submission.users.tier)} text-white`}>
                          {submission.users.tier}
                        </Badge>
                        {submission.admin_rating && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {submission.admin_rating}/10
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {submission.users.username}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(submission.duration)}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileAudio className="w-4 h-4" />
                        {formatFileSize(submission.file_size)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {submission.description && (
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">{submission.description}</p>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePlayback(submission.id)}
                        className="flex items-center gap-1"
                      >
                        {playingId === submission.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {playingId === submission.id ? "Pause" : "Play"}
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => {
                              setReviewingSubmission(submission)
                              setReviewData({
                                status: submission.status,
                                rating: submission.admin_rating || 5,
                                feedback: submission.admin_feedback || "",
                                moodTags: [],
                              })
                            }}
                          >
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Review Submission</DialogTitle>
                          </DialogHeader>

                          {reviewingSubmission && (
                            <div className="space-y-6">
                              <div>
                                <h3 className="font-semibold text-lg">{reviewingSubmission.track_title}</h3>
                                <p className="text-gray-600">by {reviewingSubmission.artist_name}</p>
                              </div>

                              <Tabs defaultValue="review" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="review">Review</TabsTrigger>
                                  <TabsTrigger value="details">Details</TabsTrigger>
                                </TabsList>

                                <TabsContent value="review" className="space-y-4">
                                  <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                      value={reviewData.status}
                                      onValueChange={(value) => setReviewData({ ...reviewData, status: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label>Rating: {reviewData.rating}/10</Label>
                                    <Slider
                                      value={[reviewData.rating]}
                                      onValueChange={(value) => setReviewData({ ...reviewData, rating: value[0] })}
                                      max={10}
                                      min={1}
                                      step={1}
                                      className="mt-2"
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="feedback">Feedback</Label>
                                    <Textarea
                                      id="feedback"
                                      value={reviewData.feedback}
                                      onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                                      placeholder="Provide feedback for the artist..."
                                      rows={4}
                                    />
                                  </div>

                                  <div>
                                    <Label>Mood Tags</Label>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                      {moodOptions.map((mood) => (
                                        <div key={mood} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={mood}
                                            checked={reviewData.moodTags.includes(mood)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setReviewData({
                                                  ...reviewData,
                                                  moodTags: [...reviewData.moodTags, mood],
                                                })
                                              } else {
                                                setReviewData({
                                                  ...reviewData,
                                                  moodTags: reviewData.moodTags.filter((tag) => tag !== mood),
                                                })
                                              }
                                            }}
                                          />
                                          <Label htmlFor={mood} className="text-sm">
                                            {mood}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <Button onClick={handleReviewSubmission} className="w-full">
                                    Submit Review
                                  </Button>
                                </TabsContent>

                                <TabsContent value="details" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <Label className="font-medium">Submitted by</Label>
                                      <p>{reviewingSubmission.users.username}</p>
                                    </div>
                                    <div>
                                      <Label className="font-medium">User Tier</Label>
                                      <p className="capitalize">{reviewingSubmission.users.tier}</p>
                                    </div>
                                    <div>
                                      <Label className="font-medium">File Size</Label>
                                      <p>{formatFileSize(reviewingSubmission.file_size)}</p>
                                    </div>
                                    <div>
                                      <Label className="font-medium">Duration</Label>
                                      <p>{formatDuration(reviewingSubmission.duration)}</p>
                                    </div>
                                    <div>
                                      <Label className="font-medium">Submitted</Label>
                                      <p>{new Date(reviewingSubmission.created_at).toLocaleString()}</p>
                                    </div>
                                    {reviewingSubmission.reviewed_at && (
                                      <div>
                                        <Label className="font-medium">Last Reviewed</Label>
                                        <p>{new Date(reviewingSubmission.reviewed_at).toLocaleString()}</p>
                                      </div>
                                    )}
                                  </div>

                                  {reviewingSubmission.description && (
                                    <div>
                                      <Label className="font-medium">Description</Label>
                                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mt-1">
                                        {reviewingSubmission.description}
                                      </p>
                                    </div>
                                  )}
                                </TabsContent>
                              </Tabs>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {submission.file_path && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Download functionality would go here
                            window.open(submission.audio_url || "#", "_blank")
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {submissions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileAudio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-600">
              {filter === "all" ? "No submissions have been made yet." : `No submissions match the "${filter}" filter.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
