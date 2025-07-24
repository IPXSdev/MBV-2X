"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { StripeElementsProvider } from "@/components/stripe-provider"

const tiers = [
  {
    name: "Creator",
    price: "$0",
    priceId: null,
    description: "Get started and explore the platform.",
    features: ["View podcast clips", "See BTS previews", "Read placement announcements"],
    tierKey: "creator",
  },
  {
    name: "Indie",
    price: "$19.99",
    priceSuffix: "/ month",
    priceId: "price_1PfA6qRxH3a7y9z8abcd1234", // Replace with your actual Stripe Price ID
    description: "For artists ready to get heard.",
    features: [
      "1 song submission/mo",
      "Extended BTS access",
      "Music presented to A&Rs",
      "Reviewed in podcast breakdowns",
    ],
    tierKey: "indie",
  },
  {
    name: "Pro",
    price: "$24.99",
    priceSuffix: "/ month",
    priceId: "price_1PfA6qRxH3a7y9z8efgh5678", // Replace with your actual Stripe Price ID
    description: "For serious creators seeking maximum exposure.",
    features: [
      "2 song submissions/mo",
      "Full BTS & podcast access",
      "Weekly DJ sets inclusion",
      "Featured in live mixes",
    ],
    tierKey: "pro",
  },
]

function PricingContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      router.push("/login?redirect=/pricing")
      return
    }
    setIsLoading(priceId)
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId: user.id, email: user.email }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { sessionId } = await response.json()
      // We can't access stripe here directly, but the Elements provider handles it.
      // The checkout logic needs to be in a component wrapped by Elements.
      // This is a placeholder for now, as the main issue is auth.
      // A full implementation would use `useStripe` hook here.
      alert(`Redirecting to checkout for session: ${sessionId}`)
    } catch (error) {
      console.error("Stripe checkout error:", error)
    } finally {
      setIsLoading(null)
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen p-4 sm:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Find Your Perfect Plan</h1>
        <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
          Join a community of creators and get your music in front of industry legends.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`flex flex-col bg-black/40 backdrop-blur-md border ${
              user?.tier === tier.tierKey ? "border-purple-500 shadow-purple-500/20 shadow-lg" : "border-white/10"
            }`}
          >
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">{tier.name}</CardTitle>
              <div className="text-4xl font-extrabold mt-4">
                {tier.price}
                <span className="text-lg font-normal text-gray-400">{tier.priceSuffix}</span>
              </div>
              <CardDescription className="text-gray-300 h-10 mt-2">{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow py-6">
              <ul className="space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {user?.tier === tier.tierKey ? (
                <Button
                  disabled
                  className="w-full bg-purple-600 text-white font-semibold h-12 rounded-lg transition-all duration-200"
                >
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={() => tier.priceId && handleCheckout(tier.priceId)}
                  disabled={!tier.priceId || !!isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold h-12 rounded-lg transition-all duration-200"
                >
                  {isLoading === tier.priceId ? <Loader2 className="w-5 h-5 animate-spin" /> : `Choose ${tier.name}`}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function PricingPageWrapper() {
  return (
    <StripeElementsProvider>
      <PricingContent />
    </StripeElementsProvider>
  )
}
