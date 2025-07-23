import type { Metadata } from "next"
import { SignupForm } from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Signup - The Man Behind The Music",
  description: "Create an account to submit your music to The Man Behind The Music podcast.",
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <SignupForm />
    </div>
  )
}
