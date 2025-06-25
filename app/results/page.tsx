"use client"

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
  Share2,
  Download,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Map,
  Pill,
  FileText,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AnalysisData {
  possibleConditions: Array<{
    condition: string
    severity: string
    percentage: string
    symptoms?: string
  }>
  nearbyMedicalHelp: Array<{
    name: string
    type: string
    distance: string
    wait: string
  }>
  prescriptions: Array<{
    name: string
    cost: string
    duration: string
  }>
  otcMedications: Array<{
    name: string
    use: string
    cost: string
  }>
  homeRemedies: string[]
  expectedDuration: string
  estimatedCost: string
  additionalQuestions: string[]
}

export default function ResultsPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [userSymptoms, setUserSymptoms] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [recentChats, setRecentChats] = useState<string[]>([])
  const router = useRouter()

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

    // Get analysis data from sessionStorage
    const storedAnalysis = sessionStorage.getItem("symptomAnalysis")
    const storedSymptoms = sessionStorage.getItem("userSymptoms")

    if (storedAnalysis) {
      setAnalysisData(JSON.parse(storedAnalysis))
    }

    if (storedSymptoms) {
      setUserSymptoms(storedSymptoms)
      setSearchValue(storedSymptoms)
    }

    // If no data, redirect back to home
    if (!storedAnalysis) {
      router.push("/")
    }

    loadRecentChats()

    // Listen for storage changes to update recent chats when searches are made on other pages
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "searchHistory") {
        loadRecentChats()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also listen for custom events for same-tab updates
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
      // If no analysis found, set symptoms and search
      setSearchValue(chat)
      handleNewSearch()
    }
  }

  const handleNewSearch = async () => {
    if (!searchValue.trim()) return

    setIsSearching(true)

    try {
      const response = await fetch("/api/analyze-symptoms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symptoms: searchValue.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze symptoms")
      }

      if (!data.analysis) {
        throw new Error("No analysis data received")
      }

      // Update the analysis data with new results
      setAnalysisData(data.analysis)
      setUserSymptoms(searchValue.trim())

      // Store the new analysis data
      sessionStorage.setItem("symptomAnalysis", JSON.stringify(data.analysis))
      sessionStorage.setItem("userSymptoms", searchValue.trim())

      // Save detailed search history with analysis data
      const saveDetailedHistory = () => {
        const now = new Date()
        const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        const dateString =
          now.toDateString() === new Date().toDateString()
            ? "Today"
            : now.toDateString() === new Date(Date.now() - 86400000).toDateString()
              ? "Yesterday"
              : now.toLocaleDateString()

        const newSearchItem = {
          symptoms: searchValue.trim(),
          time: timeString,
          conditions: data.analysis.possibleConditions?.slice(0, 2).map((c) => c.condition) || [],
          analysisData: data.analysis,
        }

        const existingDetailedHistory = JSON.parse(localStorage.getItem("detailedSearchHistory") || "[]")

        // Find if date group exists
        const dateGroupIndex = existingDetailedHistory.findIndex((group) => group.date === dateString)

        if (dateGroupIndex >= 0) {
          // Add to existing date group
          existingDetailedHistory[dateGroupIndex].searches.unshift(newSearchItem)
          // Keep only last 10 searches per day
          existingDetailedHistory[dateGroupIndex].searches = existingDetailedHistory[dateGroupIndex].searches.slice(
            0,
            10,
          )
        } else {
          // Create new date group
          existingDetailedHistory.unshift({
            date: dateString,
            searches: [newSearchItem],
          })
        }

        // Keep only last 7 days
        const updatedHistory = existingDetailedHistory.slice(0, 7)
        localStorage.setItem("detailedSearchHistory", JSON.stringify(updatedHistory))
      }

      saveDetailedHistory()

      // Save to search history
      const existingHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]")
      const updatedHistory = [
        searchValue.trim(),
        ...existingHistory.filter((item) => item !== searchValue.trim()),
      ].slice(0, 10)
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory))

      // Update recent chats
      setRecentChats([searchValue.trim(), ...recentChats.filter((item) => item !== searchValue.trim())].slice(0, 3))

      // Dispatch custom event to notify other tabs/components
      window.dispatchEvent(new CustomEvent("searchHistoryUpdated"))
    } catch (error) {
      console.error("Error:", error)
      alert("There was an error analyzing your symptoms. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleMapClick = () => {
    // Get user location from profile
    const userProfile = localStorage.getItem("userProfile")
    let location = "medical facilities near me"

    if (userProfile) {
      const profile = JSON.parse(userProfile)
      if (profile.city && profile.state) {
        location = `medical facilities near ${profile.city}, ${profile.state}`
      } else if (profile.zipCode) {
        location = `medical facilities near ${profile.zipCode}`
      }
    }

    const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(location)}`
    window.open(googleMapsUrl, "_blank")
  }

  if (!analysisData) {
    return (
      <div className="flex h-screen bg-[#FCFCFC] items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 mb-2">Loading analysis...</div>
          <div className="text-sm text-gray-500">Please wait while we process your symptoms.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#FCFCFC]">
      {/* Left Sidebar */}
      <div className="w-60 bg-[#F6F6F6] flex flex-col">
        {/* Logo and Brand */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-E6juYgML470rZv0LnTNQrxbuxeO0Rz.png"
              alt="Symptom AI"
              className="w-8 h-8"
            />
            <span className="text-xl font-semibold text-gray-900 tracking-tight" style={{ letterSpacing: "-0.05em" }}>
              SYMPTOM AI
            </span>
          </div>

          {/* Search Chat */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search chat"
              className="pl-10 bg-[#F6F6F6] border border-[#8E8E8E] rounded-xl text-sm h-8"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-1 mb-8">
            <div
              onClick={() => router.push("/")}
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <House className="w-5 h-5" />
              <span className="font-semibold" style={{ letterSpacing: "-0.05em" }}>
                Home
              </span>
            </div>
            <div
              onClick={() => router.push("/library")}
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold" style={{ letterSpacing: "-0.05em" }}>
                Library
              </span>
            </div>
            <div
              onClick={() => router.push("/history")}
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <Clock className="w-5 h-5" />
              <span className="font-semibold" style={{ letterSpacing: "-0.05em" }}>
                History
              </span>
            </div>
          </nav>

          {/* Recent Chats */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3" style={{ letterSpacing: "-0.05em" }}>
              Recent Chats
            </h3>
            <div className="space-y-1">
              {recentChats.length > 0 ? (
                recentChats.map((chat, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                    onClick={() => handleRecentChatClick(chat)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm truncate font-semibold" style={{ letterSpacing: "-0.05em" }}>
                      {chat}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-400 text-sm">No recent searches</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="p-4 space-y-1">
          <div
            onClick={() => router.push("/settings")}
            className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <Settings className="w-5 h-5" />
            <span className="font-semibold" style={{ letterSpacing: "-0.05em" }}>
              Settings
            </span>
          </div>
          <div
            onClick={() => router.push("/help")}
            className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="font-semibold" style={{ letterSpacing: "-0.05em" }}>
              Help
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with Search */}
        <div className="px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Search Bar with User's Symptoms */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Enter your symptoms..."
                  className="pl-10 pr-20 bg-white border border-[#DDDDDD] rounded-xl text-sm h-10 w-full"
                  disabled={isSearching}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSearching) {
                      handleNewSearch()
                    }
                  }}
                />
                <Button
                  onClick={handleNewSearch}
                  disabled={isSearching}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#C1121F] hover:bg-[#9e0e19] text-white px-2 py-1 rounded-lg text-xs h-8 disabled:opacity-50"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </div>

            {/* User Profile - Clickable */}
            <div
              className="flex items-center gap-3 ml-6 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
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
            {/* Loading Overlay */}
            {isSearching && (
              <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#C1121F]" />
                    <span className="text-lg font-semibold">Analyzing your symptoms...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Possible Conditions - Full Width */}
              <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6 lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-[#C21E26] rounded-full flex items-center justify-center border-2 border-[#9F191F]">
                    <FileText className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Possible Conditions</h2>
                </div>
                <div className="space-y-4">
                  {analysisData.possibleConditions.map((condition, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{condition.condition}</div>
                        <div className="text-sm text-gray-500">Severity: {condition.severity}</div>
                        {condition.symptoms && <div className="text-xs text-gray-400 mt-1">{condition.symptoms}</div>}
                      </div>
                      <div className="bg-[#F4F3F4] rounded-full px-4 py-0.5">
                        <div className="text-base font-semibold text-gray-900">{condition.percentage}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nearby Medical Help */}
              <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-[#C21E26] rounded-full flex items-center justify-center border-2 border-[#9F191F]">
                    <FileText className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Nearby Medical Help</h2>
                </div>
                <div className="space-y-4">
                  {analysisData.nearbyMedicalHelp.map((facility, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="font-semibold text-gray-900 text-sm">{facility.name}</div>
                      <div className="text-sm text-gray-500 flex items-center justify-between">
                        <span>
                          {facility.type} • {facility.distance}
                        </span>
                        <div className="bg-[#F4F3F4] rounded-full px-3 py-1">
                          <span className="text-xs font-bold text-gray-700">Wait: {facility.wait}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-[#C21E26] rounded-full flex items-center justify-center border-2 border-[#9F191F]">
                    <Map className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
                </div>
                <div
                  className="bg-green-50 rounded-lg h-48 flex items-center justify-center relative cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={handleMapClick}
                >
                  <div className="text-gray-500 text-sm">Click to view on Google Maps</div>

                  {/* Location Pins using the provided image */}
                  <div className="absolute top-6 right-8">
                    <img src="/location-pin.png" alt="Medical facility" className="w-6 h-8" />
                  </div>

                  <div className="absolute bottom-12 left-8">
                    <img src="/location-pin.png" alt="Medical facility" className="w-6 h-8" />
                  </div>

                  <div className="absolute bottom-16 right-12">
                    <img src="/location-pin.png" alt="Medical facility" className="w-6 h-8" />
                  </div>
                </div>
              </div>

              {/* Prescription Options */}
              <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-[#C21E26] rounded-full flex items-center justify-center border-2 border-[#9F191F]">
                    <Pill className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Prescription Options</h2>
                </div>
                <div className="space-y-3">
                  {analysisData.prescriptions.map((prescription, index) => (
                    <div key={index} className="bg-[#F3FFF3] rounded-lg p-4">
                      <div className="font-medium text-gray-900 mb-1">{prescription.name}</div>
                      <div className="text-sm text-gray-600">Cost: {prescription.cost}</div>
                      <div className="text-sm text-gray-600">Duration: {prescription.duration}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Over-the-Counter */}
              <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-[#C21E26] rounded-full flex items-center justify-center border-2 border-[#9F191F]">
                    <Pill className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Over-the-Counter</h2>
                </div>
                <div className="space-y-3">
                  {analysisData.otcMedications.map((medication, index) => (
                    <div key={index} className="bg-[#EDFAFF] rounded-lg p-4">
                      <div className="font-medium text-gray-900 mb-1">{medication.name}</div>
                      <div className="text-sm text-gray-600">{medication.use}</div>
                      <div className="text-sm text-gray-600">Cost: {medication.cost}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Home Remedies - Full Width */}
              <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6 lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-[#C21E26] rounded-full flex items-center justify-center border-2 border-[#9F191F]">
                    <span className="text-white text-xs font-bold">H</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Home Remedies</h2>
                </div>
                <ul className="space-y-2">
                  {analysisData.homeRemedies.map((remedy, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{remedy}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Expected Duration */}
              <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-[#C21E26] rounded-full flex items-center justify-center border-2 border-[#9F191F]">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Expected Duration</h2>
                </div>
                <div className="text-left py-0 -mt-2">
                  <div className="text-sm text-gray-700">{analysisData.expectedDuration}</div>
                </div>
              </div>

              {/* Estimated Treatment Cost */}
              <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-[#C21E26] rounded-full flex items-center justify-center border-2 border-[#9F191F]">
                    <span className="text-white text-xs font-bold">$</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Estimated Treatment Cost</h2>
                </div>
                <div className="text-left py-0 -mt-2">
                  <div className="text-sm text-gray-700">{analysisData.estimatedCost}</div>
                </div>
              </div>

              {/* Additional Questions to Consider - Full Width */}
              <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6 lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-[#C21E26] rounded-full flex items-center justify-center border-2 border-[#9F191F]">
                    <span className="text-white text-xs font-bold">?</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Additional Questions to Consider</h2>
                </div>
                <ul className="space-y-2">
                  {analysisData.additionalQuestions.map((question, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-6 mt-8 pb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Check if Web Share API is supported and available
                  if (
                    navigator.share &&
                    navigator.canShare &&
                    navigator.canShare({
                      title: "Symptom Analysis Results",
                      text: `Analysis for: ${userSymptoms}`,
                      url: window.location.href,
                    })
                  ) {
                    navigator
                      .share({
                        title: "Symptom Analysis Results",
                        text: `Analysis for: ${userSymptoms}`,
                        url: window.location.href,
                      })
                      .catch((error) => {
                        // If sharing fails, fall back to clipboard
                        console.log("Share failed, falling back to clipboard:", error)
                        navigator.clipboard
                          .writeText(window.location.href)
                          .then(() => {
                            alert("Link copied to clipboard!")
                          })
                          .catch(() => {
                            // Final fallback if clipboard also fails
                            alert("Unable to share. Please copy the URL manually.")
                          })
                      })
                  } else {
                    // Fallback to clipboard if Web Share API is not supported
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard
                        .writeText(window.location.href)
                        .then(() => {
                          alert("Link copied to clipboard!")
                        })
                        .catch(() => {
                          // Final fallback if clipboard also fails
                          alert("Unable to copy link. Please copy the URL manually.")
                        })
                    } else {
                      // Final fallback for older browsers
                      alert("Sharing not supported. Please copy the URL manually: " + window.location.href)
                    }
                  }
                }}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-2 rounded-lg border border-[#8E8E8E]"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const content = `Symptom Analysis Results\n\nSymptoms: ${userSymptoms}\n\nPossible Conditions:\n${analysisData.possibleConditions.map((c) => `- ${c.condition} (${c.percentage})`).join("\n")}\n\nHome Remedies:\n${analysisData.homeRemedies.map((r) => `- ${r}`).join("\n")}`
                  const blob = new Blob([content], { type: "text/plain" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = "symptom-analysis.txt"
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-2 rounded-lg border border-[#8E8E8E]"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-2 rounded-lg border border-[#8E8E8E]"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Store positive feedback
                  localStorage.setItem("feedback-positive", "true")
                  alert("Thank you for your positive feedback!")
                }}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-2 rounded-lg border border-[#8E8E8E]"
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Store negative feedback
                  localStorage.setItem("feedback-negative", "true")
                  alert("Thank you for your feedback. We will work to improve our analysis.")
                }}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-2 rounded-lg border border-[#8E8E8E]"
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
