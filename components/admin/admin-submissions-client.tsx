"use client"

import { useState, useMemo } from "react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, PlayCircle } from "lucide-react"
import { EnhancedAudioPlayer } from "@/components/player/enhanced-audio-player"
import type { SubmissionWithUser, User } from "./types"

type FilterStatus = "all" | "ranked" | "unranked" | "my_ranked"

export default function AdminSubmissionsClient({
  initialSubmissions,
  currentUser,
}: {
  initialSubmissions: SubmissionWithUser[]
  currentUser: User
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [filter, setFilter] = useState<FilterStatus>("unranked")
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithUser | null>(null)
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState("")

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      if (filter === "all") return true
      if (filter === "ranked") return submission.rating !== null
      if (filter === "unranked") return submission.rating === null
      if (filter === "my_ranked") return submission.reviewed_by === currentUser.id
      return true
    })
  }, [submissions, filter, currentUser.id])

  const handleSelectSubmission = (submission: SubmissionWithUser) => {
    setSelectedSubmission(submission)
    setRating(submission.rating || 0)
    setNotes(submission.admin_notes || "")
  }

  const handleUpdateSubmission = async (status: "pending" | "reviewed" | "finalized") => {
    if (!selectedSubmission) return

    const updatedData = {
      rating,
      admin_notes: notes,
      status,
      reviewed_by: currentUser.id,
    }

    const response = await fetch(`/api/admin/submissions/${selectedSubmission.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    })

    if (response.ok) {
      const updatedSubmission = await response.json()
      setSubmissions(submissions.map((s) => (s.id === updatedSubmission.id ? updatedSubmission : s)))
      if (selectedSubmission.id === updatedSubmission.id) {
        setSelectedSubmission(updatedSubmission)
      }
    } else {
      console.error("Failed to update submission")
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <Button variant={filter === "all" ? "secondary" : "ghost"} onClick={() => setFilter("all")}>
            All
          </Button>
          <Button variant={filter === "unranked" ? "secondary" : "ghost"} onClick={() => setFilter("unranked")}>
            Unranked
          </Button>
          <Button variant={filter === "ranked" ? "secondary" : "ghost"} onClick={() => setFilter("ranked")}>
            Ranked
          </Button>
          <Button variant={filter === "my_ranked" ? "secondary" : "ghost"} onClick={() => setFilter("my_ranked")}>
            My Ranked
          </Button>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Track</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow
                  key={submission.id}
                  onClick={() => handleSelectSubmission(submission)}
                  className={`cursor-pointer ${selectedSubmission?.id === submission.id ? "bg-neutral-800" : ""}`}
                >
                  <TableCell className="font-medium flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-neutral-400" />
                    {submission.track_title}
                  </TableCell>
                  <TableCell>{submission.user?.name || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={submission.user?.tier === "pro" ? "default" : "secondary"}>
                      {submission.user?.tier || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{submission.status}</TableCell>
                  <TableCell>{submission.rating ? `${submission.rating} ★` : "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="md:col-span-1">
        {selectedSubmission ? (
          <div className="sticky top-8 bg-neutral-900 p-6 rounded-lg border border-neutral-800">
            <h2 className="text-2xl font-bold mb-2">{selectedSubmission.track_title}</h2>
            <p className="text-neutral-400 mb-4">by {selectedSubmission.user?.name}</p>

            {selectedSubmission.audio_url && <EnhancedAudioPlayer src={selectedSubmission.audio_url} />}

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Review & Rate</h3>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-8 w-8 cursor-pointer ${rating >= star ? "text-yellow-400 fill-yellow-400" : "text-neutral-600"}`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
              <Textarea
                placeholder="Add written notes/feedback..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mb-4 bg-neutral-800 border-neutral-700"
              />
              <div className="flex flex-col gap-2">
                <Button onClick={() => handleUpdateSubmission("reviewed")}>Save as Reviewed</Button>
                <Button variant="secondary" onClick={() => handleUpdateSubmission("finalized")}>
                  Save as Finalized
                </Button>
                <Button variant="ghost" onClick={() => handleUpdateSubmission("pending")}>
                  Revert to Pending
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="sticky top-8 flex items-center justify-center h-96 bg-neutral-900 p-6 rounded-lg border border-neutral-800 border-dashed">
            <p className="text-neutral-500">Select a submission to review</p>
          </div>
        )}
      </div>
    </div>
  )
}
