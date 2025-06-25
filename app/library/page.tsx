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
  FileText,
  Heart,
  Brain,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"

export default function LibraryPage() {
  const router = useRouter()
  const [recentChats, setRecentChats] = useState<string[]>([])

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

  const medicalTopics = [
    {
      title: "Common Cold & Flu",
      description: "Symptoms, treatments, and prevention tips",
      icon: <Activity className="w-6 h-6" />,
      articles: 24,
    },
    {
      title: "Mental Health",
      description: "Understanding anxiety, depression, and wellness",
      icon: <Brain className="w-6 h-6" />,
      articles: 18,
    },
    {
      title: "Heart Health",
      description: "Cardiovascular conditions and prevention",
      icon: <Heart className="w-6 h-6" />,
      articles: 15,
    },
    {
      title: "Digestive Issues",
      description: "Stomach problems, IBS, and dietary solutions",
      icon: <FileText className="w-6 h-6" />,
      articles: 21,
    },
  ]

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
            <div className="flex items-center gap-3 px-3 py-2 text-white bg-[#C1121F] rounded-lg cursor-pointer">
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

        {/* Library Content */}
        <div className="flex-1 overflow-auto px-8 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Medical Library</h1>
              <p className="text-gray-600">Explore trusted medical information and health resources</p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search medical topics..."
                  className="pl-10 bg-white border border-[#DDDDDD] rounded-xl text-sm h-10"
                />
              </div>
            </div>

            {/* Medical Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {medicalTopics.map((topic, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#C1121F] rounded-full flex items-center justify-center text-white">
                        {topic.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{topic.title}</CardTitle>
                        <CardDescription>{topic.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">{topic.articles} articles available</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
