"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Send, CheckCircle, AlertCircle, Users, Headphones, MessageSquare, ExternalLink } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSuccess(true)
      setFormData({ name: "", email: "", subject: "", message: "" })
    } catch (err) {
      setError("Failed to send message. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Get In{" "}
            <span className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8">
            Have questions about submissions, partnerships, or need support? We're here to help you succeed.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card className="bg-gray-900/80 backdrop-blur-sm border border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <MessageSquare className="h-6 w-6 mr-3 text-purple-400" />
                  Send Us a Message
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Fill out the form below and we'll get back to you within 24-48 hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {success && (
                  <Alert className="bg-green-900/50 border-green-500/50">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-200">
                      Thanks for reaching out! We'll get back to you within 24–48 hours.
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert className="bg-red-900/50 border-red-500/50">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-white">
                      Subject *
                    </Label>
                    <Select value={formData.subject} onValueChange={(value) => handleInputChange("subject", value)}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="partnership">Partnership Proposal</SelectItem>
                        <SelectItem value="media">Media Request</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help you..."
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      required
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-32"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white h-12"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Details */}
            <Card className="bg-gray-900/80 backdrop-blur-sm border border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Contact Information</CardTitle>
                <CardDescription className="text-gray-400">Multiple ways to reach our team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Email Support</h3>
                    <p className="text-gray-400 text-sm mb-2">Get help with your account or submissions</p>
                    <a href="mailto:support@themanbehindthemusic.app" className="text-purple-400 hover:text-purple-300">
                      support@themanbehindthemusic.app
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Business Inquiries</h3>
                    <p className="text-gray-400 text-sm mb-2">Partnerships, press, and business opportunities</p>
                    <a href="mailto:press@themanbehindthemusic.app" className="text-blue-400 hover:text-blue-300">
                      press@themanbehindthemusic.app
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Headphones className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Artist Support</h3>
                    <p className="text-gray-400 text-sm mb-2">Questions about submissions and feedback</p>
                    <a href="mailto:artists@themanbehindthemusic.app" className="text-green-400 hover:text-green-300">
                      artists@themanbehindthemusic.app
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="bg-gray-900/80 backdrop-blur-sm border border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Follow Us</CardTitle>
                <CardDescription className="text-gray-400">Stay connected on social media</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start bg-transparent border-gray-700 text-white hover:bg-gray-800"
                    onClick={() => window.open("https://www.youtube.com/@Themanbehindthemusicpodcast", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-3 text-red-400" />
                    YouTube Channel
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start bg-transparent border-gray-700 text-white hover:bg-gray-800"
                    onClick={() => window.open("https://instagram.com/themanbehindthemusic", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-3 text-pink-400" />
                    Instagram
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start bg-transparent border-gray-700 text-white hover:bg-gray-800"
                    onClick={() => window.open("https://twitter.com/tmbmpodcast", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-3 text-blue-400" />
                    Twitter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Quick Links */}
            <Card className="bg-gray-900/80 backdrop-blur-sm border border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Quick Help</CardTitle>
                <CardDescription className="text-gray-400">Common questions and resources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="text-white font-semibold text-sm">Frequently Asked Questions:</h4>
                  <ul className="space-y-1 text-sm text-gray-400">
                    <li>• How do I submit my music?</li>
                    <li>• What file formats are accepted?</li>
                    <li>• How long does review take?</li>
                    <li>• Can I upgrade my plan anytime?</li>
                    <li>• How do sync placements work?</li>
                  </ul>
                </div>
                <Button
                  variant="outline"
                  className="w-full bg-transparent border-gray-700 text-white hover:bg-gray-800 mt-4"
                >
                  View Full FAQ
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Response Time Notice */}
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-red-500/10 rounded-lg p-6 mt-12 text-center">
          <h3 className="text-xl font-bold text-white mb-2">We're Here to Help</h3>
          <p className="text-gray-300">
            Our team typically responds within 24-48 hours. For urgent matters, please mark your subject as "Urgent" and
            we'll prioritize your request.
          </p>
        </div>
      </div>
    </div>
  )
}
