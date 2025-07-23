"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Music, Star, Crown, Diamond, Trophy, Zap } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPlan?: string
}

function AuthModal({ isOpen, onClose, selectedPlan }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        window.location.reload()
      } else {
        console.error("Authentication failed")
      }
    } catch (error) {
      console.error("Authentication error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">{isLogin ? "Sign In" : "Create Account"}</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            {selectedPlan && `Continue with ${selectedPlan} plan`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-400 hover:text-blue-300">
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function PricingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [user, setUser] = useState<any>(null)

  const handlePlanSelect = async (planType: string, priceId: string) => {
    // Check if user is logged in
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        if (userData.user) {
          // User is logged in, proceed to Stripe
          const stripeResponse = await fetch("/api/stripe/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priceId, planType }),
          })

          if (stripeResponse.ok) {
            const { url } = await stripeResponse.json()
            window.location.href = url
          }
        } else {
          // User not logged in, show auth modal
          setSelectedPlan(planType)
          setAuthModalOpen(true)
        }
      } else {
        // User not logged in, show auth modal
        setSelectedPlan(planType)
        setAuthModalOpen(true)
      }
    } catch (error) {
      console.error("Error checking auth:", error)
      setSelectedPlan(planType)
      setAuthModalOpen(true)
    }
  }

  const tiers = [
    {
      name: "Creator",
      price: "Free",
      description: "Perfect for getting started",
      icon: <Music className="w-8 h-8" />,
      iconBg: "bg-blue-500",
      features: [
        "Access select podcast clips",
        "Behind-the-scenes sneak peeks",
        "Artist placement news & announcements",
        "Community access",
        "Basic industry insights",
      ],
      buttonText: "Get Started Free",
      buttonClass: "bg-blue-600 hover:bg-blue-700",
      popular: false,
    },
    {
      name: "Indie",
      price: "$19.99",
      period: "/month",
      description: "For serious independent artists",
      icon: <Star className="w-8 h-8" />,
      iconBg: "bg-pink-500",
      features: [
        "Everything in Creator",
        "Submit 3 tracks per month",
        "Professional feedback from industry pros",
        "Priority review queue",
        "Monthly sync opportunities newsletter",
        "Access to exclusive artist showcases",
      ],
      buttonText: "Start Indie Plan",
      buttonClass: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      popular: true,
      priceId: "price_indie_monthly",
    },
    {
      name: "Pro",
      price: "$24.99",
      period: "/month",
      description: "Maximum exposure and opportunities",
      icon: <Crown className="w-8 h-8" />,
      iconBg: "bg-orange-500",
      features: [
        "Everything in Indie",
        "Submit 5 tracks per month",
        "Direct A&R contact for top tracks",
        "Exclusive sync opportunities",
        "Monthly industry insights call",
        "Priority placement consideration",
        "Advanced analytics dashboard",
      ],
      buttonText: "Go Pro",
      buttonClass: "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
      popular: false,
      priceId: "price_pro_monthly",
    },
  ]

  const packs = [
    {
      name: "Silver Pack",
      price: "$4.99",
      description: "Perfect for trying us out",
      credits: "1 submission credit",
      icon: <Diamond className="w-8 h-8" />,
      iconBg: "bg-gray-500",
      features: [
        "1 track submission credit",
        "Professional industry feedback",
        "Sync placement consideration",
        "Detailed review report",
      ],
      buttonText: "Buy Silver Pack",
      buttonClass: "bg-gray-600 hover:bg-gray-700",
      value: false,
      priceId: "price_silver_pack",
    },
    {
      name: "Gold Pack",
      price: "$19.99",
      description: "Great value for multiple submissions",
      credits: "2 submission credits",
      icon: <Trophy className="w-8 h-8" />,
      iconBg: "bg-yellow-500",
      features: [
        "2 track submission credits",
        "Professional industry feedback",
        "Priority sync placement consideration",
        "Detailed review reports",
        "Bonus: Extra feedback detail",
      ],
      buttonText: "Buy Gold Pack",
      buttonClass: "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600",
      value: true,
      priceId: "price_gold_pack",
    },
    {
      name: "Platinum Pack",
      price: "$34.99",
      description: "Maximum value and exposure",
      credits: "4 submission credits",
      icon: <Zap className="w-8 h-8" />,
      iconBg: "bg-purple-500",
      features: [
        "4 track submission credits",
        "Professional industry feedback",
        "VIP sync placement consideration",
        "Direct A&R contact for standout tracks",
        "Detailed review reports",
        "Bonus: Industry networking opportunities",
      ],
      buttonText: "Buy Platinum Pack",
      buttonClass: "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600",
      value: false,
      priceId: "price_platinum_pack",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Path
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8">
            Get your music heard by industry professionals and placed in major productions
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Monthly Subscriptions */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Ongoing access with monthly track submissions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 transition-all duration-300 ${
                tier.popular ? "ring-2 ring-yellow-500" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-yellow-500 text-black font-semibold px-4 py-1">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div
                  className={`w-16 h-16 ${tier.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 text-white`}
                >
                  {tier.icon}
                </div>
                <CardTitle className="text-2xl font-bold text-white">{tier.name}</CardTitle>
                <CardDescription className="text-gray-400">{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  {tier.period && <span className="text-gray-400">{tier.period}</span>}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${tier.buttonClass} text-white font-semibold py-3`}
                  onClick={() =>
                    tier.priceId ? handlePlanSelect(tier.name, tier.priceId) : handlePlanSelect(tier.name, "free")
                  }
                >
                  {tier.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* One-time Packs */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">One-Time Submission Packs</h2>
          <p className="text-gray-400">Perfect for testing the waters or occasional submissions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packs.map((pack) => (
            <Card
              key={pack.name}
              className={`relative bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 transition-all duration-300 ${
                pack.value ? "ring-2 ring-yellow-500" : ""
              }`}
            >
              {pack.value && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-yellow-500 text-black font-semibold px-4 py-1">Best Value</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div
                  className={`w-16 h-16 ${pack.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 text-white`}
                >
                  {pack.icon}
                </div>
                <CardTitle className="text-2xl font-bold text-white">{pack.name}</CardTitle>
                <CardDescription className="text-gray-400">{pack.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">{pack.price}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">{pack.credits}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {pack.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${pack.buttonClass} text-white font-semibold py-3`}
                  onClick={() => handlePlanSelect(pack.name, pack.priceId)}
                >
                  {pack.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Get Your Music Placed?</h3>
          <p className="text-gray-400 text-lg mb-8">
            Join hundreds of artists who have successfully placed their music in major productions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-4"
              onClick={() => handlePlanSelect("Indie", "price_indie_monthly")}
            >
              Start Your Journey
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent px-8 py-4"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} selectedPlan={selectedPlan} />
    </div>
  )
}
