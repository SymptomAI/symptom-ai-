"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Phone,
  Calendar,
  DollarSign,
  Pill,
  Home,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  AlertTriangle,
  ExternalLink,
  Clock,
  HelpCircle,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

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
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        conditions: analysisData.conditions?.slice(0, 2).map((c) => c.name) || [],
        analysisData: analysisData,
      })

      // Keep only last 10 searches per day
      todayGroup.searches = todayGroup.searches.slice(0, 10)

      // Keep only last 7 days
      const updatedDetailedHistory = detailedHistory.slice(0, 7)
      localStorage.setItem("detailedSearchHistory", JSON.stringify(updatedDetailedHistory))

      // Update recent chats
      setRecentChats([searchQuery, ...recentChats.filter((item) => item !== searchQuery)].slice(0, 3))

      // Clear search query
      setSearchQuery("")
    } catch (error) {
      console.error("Error analyzing symptoms:", error)
      alert("There was an error analyzing your symptoms. Please try again.")
    } finally {
      setIsLoading(false)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => router.push("/")} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <img src="/medical-cross-logo.png" alt="Medical Cross" className="w-8 h-8 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">SYMPTOM AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search new symptoms..."
                  className="pl-10 pr-20 w-80"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleNewSearch()
                    }
                  }}
                />
                <Button
                  onClick={handleNewSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#C1121F] hover:bg-[#9e0e19] text-white px-3 py-1 text-sm h-8"
                >
                  Search
                </Button>
              </div>
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <div
                className="w-8 h-8 bg-[#C1121F] rounded-full flex items-center justify-center cursor-pointer"
                onClick={() => router.push("/profile")}
              >
                <span className="text-white font-bold text-sm">M</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analysis Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Analysis Complete</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              <strong>Your symptoms:</strong> "{userSymptoms}"
            </p>
          </div>
        </div>

        {/* Feedback Buttons */}
        <div className="flex gap-3 mb-8">
          <Button onClick={() => handleFeedback(true)} variant="outline" className="flex items-center gap-2">
            <ThumbsUp className="w-4 h-4" />
            Helpful
          </Button>
          <Button onClick={() => handleFeedback(false)} variant="outline" className="flex items-center gap-2">
            <ThumbsDown className="w-4 h-4" />
            Not Helpful
          </Button>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Possible Conditions */}
          <div className="lg:col-span-2">
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

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Timeline & Cost */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#C1121F]" />
                  Timeline & Cost
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            {/* Find Healthcare */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#C1121F]" />
                  Find Healthcare
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-[#C1121F] hover:bg-[#9e0e19] text-white">
                  <MapPin className="w-4 h-4 mr-2" />
                  Find Nearby Doctors
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Phone className="w-4 h-4 mr-2" />
                  Telemedicine
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Treatment Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#C1121F]" />
                Medications
              </CardTitle>
              <CardDescription>Over-the-counter options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis?.otc_medications.map((med, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Pill className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{med}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Home Remedies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-[#C1121F]" />
                Home Remedies
              </CardTitle>
              <CardDescription>Natural treatment options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis?.home_remedies.map((remedy, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                    <Home className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{remedy}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Questions to Ask Doctor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#C1121F]" />
                Questions for Doctor
              </CardTitle>
              <CardDescription>Important questions to discuss</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis?.questions.map((question, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                    <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{question}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medical Disclaimer */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              Important Medical Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 text-sm leading-relaxed mb-4">
              This AI-powered analysis is for informational purposes only and should not be considered as professional
              medical advice, diagnosis, or treatment. The suggestions provided are based on general medical knowledge
              and should not replace consultation with qualified healthcare professionals.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => window.open("tel:911", "_blank")}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Emergency: Call 911
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("https://www.google.com/maps/search/doctor+near+me", "_blank")}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Find Local Doctors
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
