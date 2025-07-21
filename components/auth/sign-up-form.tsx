"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, User, Sparkles } from "lucide-react"
import Link from "next/link"
import { signUp } from "@/lib/supabase/auth"

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError("")

    try {
      const result = await signUp(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 2000)
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto bg-gray-900 border-gray-700 shadow-2xl">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Welcome to TMBM! 🎉</h3>
              <p className="text-gray-300">Your music journey starts now</p>
            </div>

            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-lg p-4 space-y-2">
              <p className="text-purple-200 font-semibold">✅ Account created successfully</p>
              <p className="text-blue-200 text-sm">🎵 Free tier activated with 2 submission credits</p>
              <p className="text-green-200 text-sm">🚀 Redirecting to your dashboard...</p>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>🔒 Secured by Supabase</p>
              <p>💾 Your data is safely stored and encrypted</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-900 border-gray-700 shadow-2xl">
      <CardHeader className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-white">Create Your Account</CardTitle>
        <CardDescription className="text-gray-400">
          Join the exclusive community of artists working with industry legends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white font-medium">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                required
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>
          </div>

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
                required
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a secure password"
                required
                minLength={6}
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>
            <p className="text-xs text-gray-500">Must be at least 6 characters long</p>
          </div>

          {error && (
            <Alert className="bg-red-900/50 border-red-700">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Your Account...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Start Your Music Journey
              </>
            )}
          </Button>

          <div className="text-center space-y-3">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Sign in here
              </Link>
            </p>

            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <span>🔒 SSL Secured</span>
              <span>•</span>
              <span>⚡ Instant Access</span>
              <span>•</span>
              <span>🎵 2 Free Credits</span>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
