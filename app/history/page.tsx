"use client"

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
  Calendar,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"

export default function HistoryPage() {
  const router = useRouter()
  const [recentChats, setRecentChats] = useState<string[]>([])

  const [searchHistory, setSearchHistory] = useState<
    Array<{
      date: string
      searches: Array<{
        symptoms: string
        time: string
        conditions: string[]
        analysisData?: any
      }>
    }>
  >([])

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

    // Load search history from localStorage
    const loadSearchHistory = () => {
      const savedHistory = localStorage.getItem("detailedSearchHistory")
      if (savedHistory) {
        try {
          const history = JSON.parse(savedHistory)
          setSearchHistory(history)
        } catch (error) {
          console.error("Error parsing search history:", error)
          setSearchHistory([])
        }
      } else {
        setSearchHistory([])
      }
    }

    loadRecentChats()
    loadSearchHistory()

    // Listen for storage changes to update recent chats when searches are made on other pages
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "searchHistory") {
        loadRecentChats()
      }
      if (e.key === "detailedSearchHistory") {
        loadSearchHistory()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also listen for custom events for same-tab updates
    const handleCustomUpdate = () => {
      loadRecentChats()
      loadSearchHistory()
    }

    window.addEventListener("searchHistoryUpdated", handleCustomUpdate)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("searchHistoryUpdated", handleCustomUpdate)
    }
  }, [])

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

  const handleSearchClick = (search: any) => {
    // Store the search data for results page
    if (search.analysisData) {
      sessionStorage.setItem("symptomAnalysis", JSON.stringify(search.analysisData))
    }
    sessionStorage.setItem("userSymptoms", search.symptoms)

    // Navigate to results page
    router.push("/results")
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
            <div className="flex items-center gap-3 px-3 py-2 text-white bg-[#C1121F] rounded-lg cursor-pointer">
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
            <div className="flex items-center gap-3">
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

        {/* History Content */}
        <div className="flex-1 overflow-auto px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Search History</h1>
              <p className="text-gray-600">Review your previous symptom searches and analyses</p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search your history..."
                  className="pl-10 bg-white border border-[#DDDDDD] rounded-xl text-sm h-10"
                />
              </div>
            </div>

            {/* History Timeline */}
            {searchHistory.length > 0 ? (
              <div className="space-y-8">
                {searchHistory.map((period, periodIndex) => (
                  <div key={periodIndex}>
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="w-5 h-5 text-[#C1121F]" />
                      <h2 className="text-lg font-semibold text-gray-900">{period.date}</h2>
                    </div>
                    <div className="space-y-4">
                      {period.searches.map((search, searchIndex) => (
                        <Card
                          key={searchIndex}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleSearchClick(search)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base font-medium text-gray-900">{search.symptoms}</CardTitle>
                                <CardDescription className="text-sm text-gray-500 mt-1">{search.time}</CardDescription>
                              </div>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm text-gray-600">Possible conditions:</span>
                              {search.conditions.map((condition, conditionIndex) => (
                                <span
                                  key={conditionIndex}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700"
                                >
                                  {condition}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No search history yet</h3>
                <p className="text-gray-500 mb-6">Start by searching for symptoms to see your history here.</p>
                <Button onClick={() => router.push("/")} className="bg-[#C1121F] hover:bg-[#9e0e19] text-white">
                  Start Searching
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
