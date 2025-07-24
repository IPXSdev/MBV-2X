export interface User {
  id: string
  name: string | null
  email: string | null
  role: "user" | "admin" | "master_dev"
  tier: "creator" | "indie" | "pro" | null
}

export interface Submission {
  id: string
  created_at: string
  user_id: string
  track_title: string | null
  genre: string | null
  mood: string | null
  description: string | null
  audio_url: string | null
  status: "pending" | "reviewed" | "finalized" | "approved" | "rejected"
  rating: number | null
  admin_notes: string | null
  reviewed_by: string | null
}

export interface SubmissionWithUser extends Submission {
  user: User | null
}
