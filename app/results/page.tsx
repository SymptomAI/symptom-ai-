"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  HomeIcon as House,
  BookOpen,
  Clock,
  Settings,
  HelpCircle,
  MessageCircle,
  ArrowLeft,
  MapPin,
  Phone,
  Calendar,
  DollarSign,
  Pill,
  Home,
  Heart,
  Users,
  TrendingUp,
  CheckCircle,
  Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AnalysisData {
  conditions: Array<{
    name: string
    probability: string
    description: string
    severity: "low" | "medium" | "high"
  }>
  prescriptions: string[]
  otc_medications: string[]
  home_remedies: string[]
  questions: string[]
  timeline: string
  cost: string
}

export default function ResultsPage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [userSymptoms, setUserSymptoms] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [recentChats, setRecentChats] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showDisclaimer, setShowDisclaimer] = useState(true)

  useEffect(() => {
    // Load recent chats from localStorage
    const loadRecentChats = () => {
      const savedHistory = localStorage.getItem("searchHistory")
      if (savedHistory) {
        try {
          const history = JSON.parse(savedHistory)
          setRecentChats(history.slice(0, 3))
        } catch (error) {
          console.error("Error parsing search history:", error)
          setRecentChats([])
        }
      } else {
        setRecentChats([])
      }
    }

    // Load analysis data from sessionStorage
    const loadAnalysisData = () => {
      const savedAnalysis = sessionStorage.getItem("symptomAnalysis")
      const savedSymptoms = sessionStorage.getItem("userSymptoms")

      if (savedAnalysis && savedSymptoms) {
        try {
          setAnalysis(JSON.parse(savedAnalysis))
          setUserSymptoms(savedSymptoms)
        } catch (error) {
          console.error("Error parsing analysis data:", error)
          router.push("/")
          return
        }
      } else {
        router.push("/")
        return
      }
      setIsLoading(false)
    }

    loadRecentChats()
    loadAnalysisData()

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "searchHistory") {
        loadRecentChats()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    const handleCustomUpdate = () => {
      loadRecentChats()
    }

    window.addEventListener("searchHistoryUpdated", handleCustomUpdate)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("searchHistoryUpdated", handleCustomUpdate)
    }
  }, [router])

  const handleRecentChatClick = (chat: string) => {
    // Find the analysis data for this chat from detailed history
    const detailedHistory = JSON.parse(localStorage.getItem("detailedSearchHistory") || "[]")
    let foundAnalysis = null

    for (const dateGroup of detailedHistory) {
      const foundSearch = dateGroup.searches.find((search) => search.symptoms === chat)
      if (foundSearch && foundSearch.analysisData) {
        foundAnalysis = foundSearch.analysisData
        break
      }
    }

    if (foundAnalysis) {
      sessionStorage.setItem("symptomAnalysis", JSON.stringify(foundAnalysis))
      sessionStorage.setItem("userSymptoms", chat)
      router.push("/results")
    } else {
      // If no analysis found, go to home with symptoms pre-filled
      sessionStorage.setItem("userSymptoms", chat)
      router.push("/")
    }
  }

  const handleFeedback = (isPositive: boolean) => {
    alert(isPositive ? "Thank you for your positive feedback!" : "Thank you for your feedback. We'll work to improve.")
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Symptom Analysis Results",
        text: `Analysis for: ${userSymptoms}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const handleDownload = () => {
    const content = `
Symptom Analysis Report
======================

Symptoms: ${userSymptoms}
Date: ${new Date().toLocaleDateString()}

Possible Conditions:
${analysis?.conditions.map((c) => `- ${c.name} (${c.probability}): ${c.description}`).join("\n") || ""}

Recommended Medications:
${analysis?.otc_medications.map((med) => `- ${med}`).join("\n") || ""}

Home Remedies:
${analysis?.home_remedies.map((remedy) => `- ${remedy}`).join("\n") || ""}

Timeline: ${analysis?.timeline || ""}
Estimated Cost: ${analysis?.cost || ""}

DISCLAIMER: This analysis is for informational purposes only and should not replace professional medical advice.
    `

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "symptom-analysis.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleNewSearch = async () => {
    if (!searchQuery.trim()) return

    // Save to search history
    const currentHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]")
    const updatedHistory = [searchQuery, ...currentHistory.filter((item) => item !== searchQuery)].slice(0, 10)
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory))

    // Trigger custom event for sidebar update
    window.dispatchEvent(new CustomEvent("searchHistoryUpdated"))

    // Set loading state
    setIsLoading(true)

    try {
      // Call the analysis API directly
      const response = await fetch("/api/analyze-symptoms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symptoms: searchQuery }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze symptoms")
      }

      const analysisData = await response.json()

      // Update the current analysis data
      setAnalysis(analysisData)
      setUserSymptoms(searchQuery)

      // Store in session storage
      sessionStorage.setItem("symptomAnalysis", JSON.stringify(analysisData))
      sessionStorage.setItem("userSymptoms", searchQuery)

      // Save to detailed history
      const detailedHistory = JSON.parse(localStorage.getItem("detailedSearchHistory") || "[]")
      const today = new Date().toLocaleDateString()

      let todayGroup = detailedHistory.find((group) => group.date === today)
      if (!todayGroup) {
        todayGroup = { date: today, searches: [] }
        detailedHistory.unshift(todayGroup)
      }

      todayGroup.searches.unshift({
        id: Date.now().toString(),
        symptoms: searchQuery,
        timestamp: new Date().toLocaleTimeString(),
        analysisData: analysisData,
      })

      localStorage.setItem("detailedSearchHistory", JSON.stringify(detailedHistory.slice(0, 30)))

      // Clear the search input
      setSearchQuery("")
    } catch (error) {
      console.error("Error analyzing symptoms:", error)
      alert("Failed to analyze symptoms. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNewSearch()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#C1121F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#FCFCFC] overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-69 bg-white flex flex-col h-full shadow-lg">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src="/medical-cross-logo.png" alt="Medical Cross" className="w-8 h-8" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">SYMPTOM AI</h1>
                <p className="text-xs text-gray-500">AI-Powered Medical Analysis</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search chat"
              className="pl-10 bg-gray-50 border-gray-200 rounded-lg text-sm h-9 focus:ring-2 focus:ring-[#C1121F]/20"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-100">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C1121F]" />
                <span className="text-gray-600 text-xs">Medical Professionals</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">15,000+</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#C1121F]" />
                <span className="text-gray-600 text-xs">Analyses Completed</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">2.3M+</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#C1121F]" />
                <span className="text-gray-600 text-xs">Accuracy Rate</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">96.8%</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 flex-1">
          <nav className="space-y-1 mb-6">
            <div
              onClick={() => router.push("/")}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation font-medium text-sm"
            >
              <House className="w-4 h-4" />
              <span>New Analysis</span>
            </div>
            <div
              onClick={() => router.push("/library")}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation font-medium text-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>Medical Library</span>
            </div>
            <div
              onClick={() => router.push("/history")}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation font-medium text-sm"
            >
              <Clock className="w-4 h-4" />
              <span>Case History</span>
            </div>
          </nav>

          {/* Recent Conversations */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Conversations</h3>
            <div className="space-y-1">
              {recentChats.length > 0 ? (
                recentChats.map((chat, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer group touch-manipulation"
                    onClick={() => handleRecentChatClick(chat)}
                  >
                    <MessageCircle className="w-3 h-3 flex-shrink-0" />
                    <span className="text-xs truncate flex-1">{chat}</span>
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-gray-400 text-xs">No recent conversations</div>
              )}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="space-y-1">
            <div
              onClick={() => router.push("/settings")}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation font-medium text-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </div>
            <div
              onClick={() => router.push("/help")}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation font-medium text-sm"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help & Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>

            {/* User Profile */}
            <div
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
              onClick={() => router.push("/profile")}
            >
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">Matthew Anderson</div>
                <div className="text-xs text-gray-500">Manderson@gmail.com</div>
              </div>
              <div className="w-10 h-10 bg-[#C1121F] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Content */}
        <div className="flex-1 overflow-auto px-8 py-4">
          <div className="max-w-7xl mx-auto">
            {/* Analysis Header */}
            <div className="mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Describe new symptoms for another analysis..."
                      className="pl-10 border-gray-300 focus:border-[#C1121F] focus:ring-[#C1121F]"
                    />
                  </div>
                  <Button
                    onClick={handleNewSearch}
                    disabled={!searchQuery.trim()}
                    className="bg-[#C1121F] hover:bg-[#9e0e19] text-white px-6"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Analyze
                  </Button>
                </div>
              </div>
            </div>

            {/* Possible Conditions - Standalone Section */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-[#C1121F]" />
                    Possible Conditions
                  </CardTitle>
                  <CardDescription>Based on the symptoms you described</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis?.conditions.map((condition, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{condition.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              condition.severity === "high"
                                ? "destructive"
                                : condition.severity === "medium"
                                  ? "secondary"
                                  : "secondary"
                            }
                          >
                            {condition.severity}
                          </Badge>
                          <span className="text-sm font-medium text-[#C1121F]">{condition.probability}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{condition.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Find Healthcare and Location - Standalone Section */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#C1121F]" />
                    Find Healthcare & Location
                  </CardTitle>
                  <CardDescription>Nearby medical facilities and services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Map Section */}
                    <div className="space-y-4">
                      <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                        <iframe
                          src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d3024.1234567890123!2d-74.0059413!3d40.7127753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1shospital%20near%20me!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Nearby Hospitals and Medical Facilities"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Navigation className="w-4 h-4" />
                        <span>Showing hospitals and clinics within 5 miles</span>
                      </div>
                    </div>

                    {/* Healthcare Options */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <Button className="w-full bg-[#C1121F] hover:bg-[#9e0e19] text-white justify-start h-12">
                          <MapPin className="w-5 h-5 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Find Nearby Doctors</div>
                            <div className="text-xs opacity-90">Primary care & specialists</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start h-12 bg-transparent">
                          <Phone className="w-5 h-5 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Telemedicine</div>
                            <div className="text-xs text-gray-500">Virtual consultations available</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start h-12 bg-transparent">
                          <Calendar className="w-5 h-5 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Book Appointment</div>
                            <div className="text-xs text-gray-500">Schedule with local providers</div>
                          </div>
                        </Button>
                      </div>

                      {/* Timeline & Cost Info */}
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h4 className="font-medium text-gray-900">Treatment Information</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Recovery Time</p>
                              <p className="text-xs text-gray-600">{analysis?.timeline}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Estimated Cost</p>
                              <p className="text-xs text-gray-600">{analysis?.cost}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Treatment Information */}
            {/* Treatment Information - Redesigned Layout */}
            <div className="space-y-6 mb-8">
              {/* Prescription and OTC Medications - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prescription Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5 text-[#C1121F]" />
                      Prescription Options
                    </CardTitle>
                    <CardDescription>Medications that may require a prescription</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        "Ibuprofen 600mg (prescription strength)",
                        "Naproxen 500mg",
                        "Muscle relaxants (Cyclobenzaprine)",
                        "Topical anti-inflammatory cream",
                        "Prescription pain relievers",
                      ].map((med, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                          <Pill className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{med}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Over-the-Counter Medications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5 text-[#C1121F]" />
                      Over-the-Counter
                    </CardTitle>
                    <CardDescription>Available without prescription</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis?.otc_medications.map((med, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                          <Pill className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{med}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Home Remedies - Full Width */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-[#C1121F]" />
                    Home Remedies
                  </CardTitle>
                  <CardDescription>Natural treatment options you can try at home</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis?.home_remedies.map((remedy, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-900">
                        <span className="text-sm mt-1">•</span>
                        <span className\
