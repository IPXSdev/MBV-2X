import { SignInForm } from "@/components/auth/sign-in-form"
import { getCurrentUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const user = await getCurrentUser()

  // Redirect if already logged in
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-lg mx-auto mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/holographic%20nav%20logo-qI8h2EHhrvruK8MhJfUE8k87DbX2xv.png"
              alt="TMBM Logo"
              className="w-full h-full object-cover scale-110"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to continue your music journey</p>
        </div>

        <SignInForm />
      </div>
    </div>
  )
}
