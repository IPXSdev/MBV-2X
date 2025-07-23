"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { AlertCircle, CheckCircle, Crown, Music, Star, Zap } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  tier: string
  submission_credits: number
  verified?: boolean
}

interface TierManagementPanelProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onUpdate: (userId: string) => void
}

export function TierManagementPanel({ user, isOpen, onClose, onUpdate }: TierManagementPanelProps) {
  const [selectedTier, setSelectedTier] = useState(user.tier || "creator")
  const [selectedRole, setSelectedRole] = useState(user.role || "user")
  const [credits, setCredits] = useState(user.submission_credits || 0)
  const [isVerified, setIsVerified] = useState(user.verified || false)
  const [unlimitedCredits, setUnlimitedCredits] = useState(user.submission_credits >= 999)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier: selectedTier,
          role: selectedRole,
          submission_credits: unlimitedCredits ? 999999 : credits,
          verified: isVerified,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user")
      }

      setSuccess("User updated successfully!")
      setTimeout(() => {
        onUpdate(user.id)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "creator":
        return <Music className="h-5 w-5" />
      case "indie":
        return <Star className="h-5 w-5" />
      case "pro":
        return <Zap className="h-5 w-5" />
      default:
        return <Music className="h-5 w-5" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "creator":
        return "bg-blue-600 hover:bg-blue-700"
      case "indie":
        return "bg-purple-600 hover:bg-purple-700"
      case "pro":
        return "bg-yellow-600 hover:bg-yellow-700"
      default:
        return "bg-gray-600 hover:bg-gray-700"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "user":
        return "bg-gray-600 hover:bg-gray-700"
      case "admin":
        return "bg-orange-600 hover:bg-orange-700"
      case "master_dev":
        return "bg-red-600 hover:bg-red-700"
      default:
        return "bg-gray-600 hover:bg-gray-700"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit User: {user.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-lg font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium text-white">{user.name}</h3>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-md p-3 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/30 border border-green-700 rounded-md p-3 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          {/* Tier Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Subscription Tier</Label>
            <div className="grid grid-cols-3 gap-2">
              {["creator", "indie", "pro"].map((tier) => (
                <Button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedTier(tier)}
                  className={`${
                    selectedTier === tier ? getTierColor(tier) : "bg-gray-800 hover:bg-gray-700"
                  } flex items-center justify-center`}
                >
                  {getTierIcon(tier)}
                  <span className="ml-2 capitalize">{tier}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">User Role</Label>
            <div className="grid grid-cols-3 gap-2">
              {["user", "admin", "master_dev"].map((role) => (
                <Button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`${
                    selectedRole === role ? getRoleColor(role) : "bg-gray-800 hover:bg-gray-700"
                  } flex items-center justify-center`}
                >
                  {role === "master_dev" && <Crown className="h-4 w-4 mr-1" />}
                  <span className="capitalize">{role.replace("_", " ")}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Submission Credits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-400">Submission Credits</Label>
              <Badge className="bg-blue-600">{unlimitedCredits ? "Unlimited" : credits}</Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Switch checked={unlimitedCredits} onCheckedChange={setUnlimitedCredits} id="unlimited-credits" />
              <Label htmlFor="unlimited-credits" className="text-sm">
                Unlimited Credits
              </Label>
            </div>

            {!unlimitedCredits && (
              <div className="pt-2">
                <Slider
                  value={[credits]}
                  min={0}
                  max={50}
                  step={1}
                  onValueChange={(value) => setCredits(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>
            )}
          </div>

          {/* Verification Status */}
          <div className="flex items-center space-x-2">
            <Switch checked={isVerified} onCheckedChange={setIsVerified} id="verified" />
            <Label htmlFor="verified" className="text-sm">
              Verified User
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-600 bg-transparent">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
