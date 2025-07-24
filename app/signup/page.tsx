import type { Metadata } from "next"
import SignupClientPage from "./signup-client-page"

export const metadata: Metadata = {
  title: "Signup - The Man Behind The Music",
  description: "Create an account to submit your music to The Man Behind The Music podcast.",
}

export default function SignupPage() {
  return <SignupClientPage />
}
