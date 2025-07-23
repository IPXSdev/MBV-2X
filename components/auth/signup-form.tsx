"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle, Music, Trophy, Star, Crown } from "lucide-react"
import { useAuth } from "./auth-provider"
import { LegalWaiver } from "./legal-waiver"

export function SignupForm() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [artistName, setArtistName] = useState("")
  const [primaryGenre, setPrimaryGenre] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showWaiver, setShowWaiver] = useState(false)
  const [agreedToWaiver, setAgreedToWaiver] = useState(false)
  const router = useRouter()
  const { signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Basic validation
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required")
      return
    }

    if (!email.trim()) {
      setError("Email is required")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (!agreeToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy")
      return
    }

    // Show the legal waiver if not already agreed to
    if (!agreedToWaiver) {
      setShowWaiver(true)
      return
    }

    // If we get here, the user has agreed to the waiver
    setLoading(true)

    try {
      const fullName = `${firstName} ${lastName}`
      const result = await signup(email, password, fullName)

      if (result.success) {
        setSuccess("Account created successfully! Redirecting...")
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else {
        setError(result.error || "Signup failed")
      }
    } catch (err) {
      console.error("Unexpected signup error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleWaiverAgree = () => {
    setAgreedToWaiver(true)
    setShowWaiver(false)

    // Automatically submit the form after agreeing to the waiver
    setLoading(true)
    const fullName = `${firstName} ${lastName}`
    signup(email, password, fullName)
      .then((result) => {
        if (result.success) {
          setSuccess("Account created successfully! Redirecting...")
          setTimeout(() => {
            router.push("/dashboard")
          }, 1500)
        } else {
          setError(result.error || "Signup failed")
        }
      })
      .catch((err) => {
        console.error("Signup error after waiver agreement:", err)
        setError("An unexpected error occurred")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Panel - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-black items-center justify-center p-8">
        <div className="w-full max-w-lg space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Music className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Join MBM Today</h1>
            <p className="text-gray-300 text-lg">Start your music industry journey</p>
          </div>

          {/* Benefits */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">What You'll Get:</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Industry Professional Reviews</h3>
                  <p className="text-gray-300">
                    Get your music heard by Grammy-nominated producers and A&Rs who can change your career trajectory
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Sync Placement Opportunities</h3>
                  <p className="text-gray-300">
                    Top-rated tracks get featured in films, TV shows, commercials, and streaming content
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Exclusive Content & Insights</h3>
                  <p className="text-gray-300">
                    Learn from industry legends through exclusive behind-the-scenes content and masterclasses
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">Trusted by 10,000+ Artists</h3>
                </div>
                <p className="text-gray-300 mb-4">Join the community that's changing music careers</p>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">500+</div>
                    <div className="text-gray-400 text-sm">Sync Placements</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">95%</div>
                    <div className="text-gray-400 text-sm">Artist Satisfaction</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">24/7</div>
                    <div className="text-gray-400 text-sm">Industry Access</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Create Your Account</h1>
            <p className="text-gray-400">Join thousands of artists advancing their careers</p>
          </div>

          {error && (
            <Alert className="bg-red-900/50 border-red-500/50">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-900/50 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white text-sm font-medium">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white text-sm font-medium">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm font-medium">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white text-sm font-medium">
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white text-sm font-medium">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="artistName" className="text-white text-sm font-medium">
                  Artist Name *
                </Label>
                <Input
                  id="artistName"
                  type="text"
                  placeholder="Your stage name"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryGenre" className="text-white text-sm font-medium">
                  Primary Genre *
                </Label>
                <Input
                  id="primaryGenre"
                  type="text"
                  placeholder="Hip-Hop, R&B, Pop, etc."
                  value={primaryGenre}
                  onChange={(e) => setPrimaryGenre(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-11"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={setAgreeToTerms}
                  className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-0.5"
                />
                <Label htmlFor="terms" className="text-gray-300 text-sm leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                    Privacy Policy
                  </Link>{" "}
                  *
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="newsletter"
                  checked={subscribeNewsletter}
                  onCheckedChange={setSubscribeNewsletter}
                  className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-0.5"
                />
                <Label htmlFor="newsletter" className="text-gray-300 text-sm leading-relaxed">
                  Subscribe to our newsletter for industry insights, exclusive opportunities, and artist success stories
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-12 font-semibold text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account & Start Journey
                  <Crown className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Free to start • No credit card required</span>
            </div>
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Legal Waiver Dialog */}
      <LegalWaiver
        isOpen={showWaiver}
        onClose={() => setShowWaiver(false)}
        onAccept={handleWaiverAgree}
        userName={`${firstName} ${lastName}`}
      />
    </div>
  )
}
