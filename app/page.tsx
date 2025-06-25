"use client"

import { useState, useEffect } from "react"
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
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function SymptomAI() {
  const [symptoms, setSymptoms] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const [recentChats, setRecentChats] = useState<string[]>([])
  const router = useRouter()

  const commonSymptoms = [
    "Headache",
    "Cough",
    "Sore Throat",
    "Fever",
    "Stomach Pain",
    "Fatigue",
    "Chest Pain",
    "Dizziness",
    "Shortness of Breath",
    "Back Pain",
    "Rash",
    "Muscle Pains",
    "Anxiety",
  ]

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
  }, [])

  const handleSymptomClick = (symptom: string) => {
    if (symptoms.includes(symptom)) return

    const newSymptoms = symptoms ? `${symptoms}, ${symptom}` : symptom
    setSymptoms(newSymptoms)
  }

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
      setSymptoms(chat)
    }
  }

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError("Please enter your symptoms before analysis.")
      return
    }

    setIsAnalyzing(true)
    setError("")

    try {
      const response = await fetch("/api/analyze-symptoms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symptoms: symptoms.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze symptoms")
      }

      if (!data.analysis) {
        throw new Error("No analysis data received")
      }

      // Store the analysis data in sessionStorage to pass to results page
      sessionStorage.setItem("symptomAnalysis", JSON.stringify(data.analysis))
      sessionStorage.setItem("userSymptoms", symptoms.trim())

      // Save to search history
      const existingHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]")
      const updatedHistory = [symptoms.trim(), ...existingHistory.filter((item) => item !== symptoms.trim())].slice(
        0,
        10,
      )
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory))

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
          symptoms: symptoms.trim(),
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

      // Update recent chats immediately
      setRecentChats([symptoms.trim(), ...recentChats.filter((item) => item !== symptoms.trim())].slice(0, 3))

      // Dispatch custom event to notify other tabs/components
      window.dispatchEvent(new CustomEvent("searchHistoryUpdated"))

      // Navigate to results page
      router.push("/results")
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "There was an error analyzing your symptoms. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
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
              className="pl-10 bg-[#F6F6F6] border border-[#8E8E8E] rounded-lg text-sm h-8"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-1 mb-8">
            <div className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
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
        {/* Header */}
        <div className="px-8 py-4">
          <div className="flex justify-end items-center">
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

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-8">
          <div className="max-w-4xl w-full">
            {/* Greeting */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-[#950E17] mb-1">
                Hello Matthew <span className="text-yellow-400">👋</span>
              </h1>
              <h2 className="text-3xl font-medium text-[#000000]">How are you feeling today?</h2>
            </div>

            {/* Input Container */}
            <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6 mb-10">
              <div className="flex items-center gap-4 mb-8">
                <Input
                  placeholder="Enter your symptoms and context (e.g., a headache after taking eating my icecream...)"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="flex-1 border-0 text-base placeholder:text-gray-400 focus-visible:ring-0 px-0 h-12 font-normal tracking-normal"
                  disabled={isAnalyzing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isAnalyzing) {
                      handleAnalyze()
                    }
                  }}
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-[#C1121F] hover:bg-[#9e0e19] text-white px-6 py-3 rounded-full font-semibold text-base disabled:opacity-50"
                  style={{ letterSpacing: "0%" }}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              {/* Symptom Tags */}
              <div className="flex flex-wrap justify-center gap-3">
                {commonSymptoms.map((symptom, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    onClick={() => !isAnalyzing && handleSymptomClick(symptom)}
                    className={`px-4 py-2 text-sm font-semibold hover:bg-gray-200 cursor-pointer border-0 rounded-full transition-colors duration-200 tracking-normal ${
                      symptoms.includes(symptom) ? "bg-[#C1121F] text-white hover:bg-[#9e0e19]" : "bg-gray-100"
                    } ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Check if Web Share API is supported and available
                  if (
                    navigator.share &&
                    navigator.canShare &&
                    navigator.canShare({
                      title: "Symptom AI",
                      text: "Check out this AI-powered symptom analysis tool",
                      url: window.location.href,
                    })
                  ) {
                    navigator
                      .share({
                        title: "Symptom AI",
                        text: "Check out this AI-powered symptom analysis tool",
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
                  const content = `My Symptoms: ${symptoms}\n\nGenerated by Symptom AI`
                  const blob = new Blob([content], { type: "text/plain" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = "my-symptoms.txt"
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
                onClick={() => setSymptoms("")}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-2 rounded-lg border border-[#8E8E8E]"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => alert("Thank you for your positive feedback!")}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-2 rounded-lg border border-[#8E8E8E]"
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => alert("Thank you for your feedback. We will continue to improve!")}
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
