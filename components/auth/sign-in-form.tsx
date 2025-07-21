"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, LogIn, Shield } from "lucide-react"
import Link from "next/link"
import { signIn } from "@/lib/supabase/auth"

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("🔐 Form submission started for:", email)

    const formData = new FormData()
    formData.append("email", email)
    formData.append("password", password)

    try {
      const result = await signIn(formData)
      console.log("📊 SignIn result:", result)

      if (result.error) {
        console.log("❌ SignIn error:", result.error)
        setError(result.error)
      } else if (result.success && result.user) {
        console.log("✅ Sign in successful, redirecting to dashboard...")
        // Force a hard redirect to avoid caching issues
        window.location.href = "/dashboard"
      } else {
        console.log("❌ Unexpected result:", result)
        setError("Sign in failed. Please try again.")
      }
    } catch (err) {
      console.error("❌ SignIn form error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-900 border-gray-700 shadow-2xl">
      <CardHeader className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
          <LogIn className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
        <CardDescription className="text-gray-400">
          Sign in to continue your music journey with industry legends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white font-medium">
              Password / Master Key
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password or master key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {error && (
            <Alert className="bg-red-900/50 border-red-700">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In to Dashboard
              </>
            )}
          </Button>

          <div className="text-center space-y-4">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Join the community
              </Link>
            </p>

            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Secure Login</span>
              </div>
              <span>•</span>
              <span>⚡ Instant Access</span>
              <span>•</span>
              <span>🎵 Your Dashboard</span>
            </div>

            <div className="pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                Forgot your password?{" "}
                <button type="button" className="text-blue-400 hover:text-blue-300 underline">
                  Reset here
                </button>
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
