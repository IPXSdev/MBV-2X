"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

interface LegalWaiverProps {
  isOpen: boolean
  onClose: () => void
  onAccept: (compensationType: string) => void
  userName: string
}

export function LegalWaiver({ isOpen, onClose, onAccept, userName }: LegalWaiverProps) {
  const [nameInput, setNameInput] = useState("")
  const [compensationType, setCompensationType] = useState("no_compensation")
  const [error, setError] = useState<string | null>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const currentDate = new Date().toLocaleDateString()

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNameInput("")
      setCompensationType("no_compensation")
      setError(null)
      setHasScrolledToBottom(false)
    }
  }, [isOpen])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    // Check if user has scrolled to bottom (with a small buffer)
    if (scrollHeight - scrollTop - clientHeight < 30) {
      setHasScrolledToBottom(true)
    }
  }

  const handleAccept = () => {
    // Validate that user has scrolled through the document
    if (!hasScrolledToBottom) {
      setError("Please read the entire agreement by scrolling to the bottom.")
      return
    }

    // Validate that user has typed their name correctly
    if (nameInput.trim().toLowerCase() !== userName.trim().toLowerCase()) {
      setError("Please type your full name exactly as entered during signup.")
      return
    }

    onAccept(compensationType)
  }

  const handleCompensationChange = (type: string) => {
    setCompensationType(type)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Music Release, Waiver, and Clearance Agreement</DialogTitle>
        </DialogHeader>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pr-4 my-4 max-h-[50vh] border border-gray-200 rounded-md p-4"
        >
          <div className="space-y-4">
            <h2 className="text-center font-bold text-lg">MUSIC RELEASE, WAIVER, AND CLEARANCE AGREEMENT</h2>

            <div>
              <p>Podcast Name: The Man Behind The Music</p>
              <p>Podcast Host/Producer: _________________</p>
              <p>Artist: {userName}</p>
              <p>Track(s) Submitted/Titles: ________________________</p>
              <p>Date of Submission: {currentDate}</p>
            </div>

            <div>
              <p className="font-bold">1. GRANT OF RIGHTS:</p>
              <p>The Artist irrevocably grants the Podcast:</p>
              <p>
                - Non-exclusive, worldwide rights to reproduce, distribute, and publicly perform the Track(s) in all
                episodes of the Podcast.
              </p>
              <p>
                - Right to edit/synchronize the Track(s) with podcast content (e.g., intro/outro, background, segments).
              </p>
              <p>
                - Perpetual license to use the Track(s) in existing and future episodes, including archival/re-runs.
              </p>
            </div>

            <div>
              <p className="font-bold">2. COMPENSATION:</p>
              <p>(Check Box that applies)</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="no_compensation"
                    name="compensation"
                    checked={compensationType === "no_compensation"}
                    onChange={() => handleCompensationChange("no_compensation")}
                    className="h-4 w-4"
                  />
                  <label htmlFor="no_compensation">
                    No Compensation: Artist acknowledges submission is voluntary with no monetary payment.
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="one_time_fee"
                    name="compensation"
                    checked={compensationType === "one_time_fee"}
                    onChange={() => handleCompensationChange("one_time_fee")}
                    className="h-4 w-4"
                  />
                  <label htmlFor="one_time_fee">One-Time Fee [$______] paid upon execution of this agreement.</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="other"
                    name="compensation"
                    checked={compensationType === "other"}
                    onChange={() => handleCompensationChange("other")}
                    className="h-4 w-4"
                  />
                  <label htmlFor="other">Other: [Specify, e.g., promotion only].</label>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold">3. ARTIST WARRANTIES:</p>
              <p>Artist warrants and represents:</p>
              <p>- They own all rights to the Track(s) and have authority to grant this license.</p>
              <p>- The Track(s) do not infringe any third-party rights (copyright, trademark, etc.).</p>
              <p>- If the Track(s) contain samples, all sample clearances have been obtained.</p>
              <p>- If the Track(s) contain vocals, all vocal clearances have been obtained.</p>
            </div>

            <div>
              <p className="font-bold">4. WAIVER OF CLAIMS:</p>
              <p>
                Artist waives all claims against the Podcast relating to the use of the Track(s) under this agreement,
                including:
              </p>
              <p>- Copyright infringement, royalties (e.g., BMI/ASCAP/SESAC, etc.), or moral rights claims.</p>
              <p>- Liability for editorial context, editing, or podcast distribution.</p>
            </div>

            <div>
              <p className="font-bold">5. INDEMNIFICATION:</p>
              <p>
                Artist agrees to indemnify and hold the Podcast harmless from any claims, damages, or costs (including
                legal fees) arising from breach of warranties.
              </p>
            </div>

            <div>
              <p className="font-bold">6. CREDIT:</p>
              <p>(Check Box that applies)</p>
              <p>The Podcast will provide artist credit:</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="verbal_credit" className="h-4 w-4" />
                  <label htmlFor="verbal_credit">Verbally in the episode</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="show_notes_credit" className="h-4 w-4" />
                  <label htmlFor="show_notes_credit">
                    In show notes/description: [Specify format, e.g., "Music by [Artist]"]
                  </label>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold">7. GOVERNING LAW:</p>
              <p>
                This agreement is governed by the laws of Nevada. Any disputes will be resolved in Clark County, Nevada,
                Las Vegas courts.
              </p>
            </div>

            <div>
              <p className="font-bold">8. ENTIRE AGREEMENT:</p>
              <p>This document supersedes all prior agreements. Modifications require written consent.</p>
            </div>

            <p className="font-bold text-center pt-4">
              BY CLICKING THE BELOW THE ARTIST ACCEPTS ALL THE ABOVE TERMS AND CONDITIONS:
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          {!hasScrolledToBottom && (
            <div className="text-sm text-amber-500 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Please read the entire agreement by scrolling to the bottom.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full-name" className="font-bold">
              Type your full name to accept all terms and conditions:
            </Label>
            <Input
              id="full-name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Type your full name here"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAccept}>I Agree</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
