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
  Send,
  Mic,
  MapPin,
  Users,
  TrendingUp,
  CheckCircle,
  Stethoscope,
  Shield,
  Brain,
  Activity,
  AlertCircle,
  Zap,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const router = useRouter()
  const [symptoms, setSymptoms] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
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

    // Check if there are pre-filled symptoms from navigation
    const prefilledSymptoms = sessionStorage.getItem("userSymptoms")
    if (prefilledSymptoms) {
      setSymptoms(prefilledSymptoms)
      sessionStorage.removeItem("userSymptoms")
    }

    loadRecentChats()

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
  }, [])

  const handleRecentChatClick = (chat: string) => {
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
      setSymptoms(chat)
    }
  }

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      alert("Please describe your symptoms first.")
      return
    }

    setIsAnalyzing(true)

    try {
      // Save to search history
      const currentHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]")
      const updatedHistory = [symptoms.trim(), ...currentHistory.filter((item) => item !== symptoms.trim())].slice(
        0,
        10,
      )
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory))

      // Create analysis data (mock for demo)
      const analysisData = {
        conditions: [
          {
            name: "Common Cold",
            probability: "75%",
            description:
              "A viral infection affecting the upper respiratory tract, commonly causing congestion, runny nose, and mild fatigue.",
            severity: "low" as const,
          },
          {
            name: "Seasonal Allergies",
            probability: "45%",
            description: "Allergic reaction to environmental allergens like pollen, dust, or pet dander.",
            severity: "low" as const,
          },
          {
            name: "Viral Upper Respiratory Infection",
            probability: "35%",
            description: "A broader category of viral infections affecting the nose, throat, and upper airways.",
            severity: "medium" as const,
          },
        ],
        prescriptions: [],
        otc_medications: ["Decongestants", "Pain relievers (Acetaminophen or Ibuprofen)", "Antihistamines"],
        home_remedies: [
          "Rest and adequate sleep",
          "Stay hydrated with water and warm fluids",
          "Warm tea with honey",
          "Steam inhalation",
        ],
        questions: [
          "How long have you been experiencing these symptoms?",
          "Do you have a fever or elevated body temperature?",
          "Have you been around anyone who was sick recently?",
          "Are you taking any current medications?",
        ],
        timeline: "Expected recovery within 7-10 days with proper rest",
        cost: "Estimated cost of OTC medications: $15-30",
      }

      // Save detailed history
      const today = new Date().toLocaleDateString()
      const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      const detailedHistory = JSON.parse(localStorage.getItem("detailedSearchHistory") || "[]")

      let todayGroup = detailedHistory.find((group) => group.date === today)
      if (!todayGroup) {
        todayGroup = { date: today, searches: [] }
        detailedHistory.unshift(todayGroup)
      }

      todayGroup.searches.unshift({
        symptoms: symptoms.trim(),
        time: currentTime,
        conditions: analysisData.conditions.map((c) => c.name),
        analysisData: analysisData,
      })

      localStorage.setItem("detailedSearchHistory", JSON.stringify(detailedHistory.slice(0, 30)))

      // Store analysis data for results page
      sessionStorage.setItem("symptomAnalysis", JSON.stringify(analysisData))
      sessionStorage.setItem("userSymptoms", symptoms.trim())

      // Dispatch custom event for real-time updates
      window.dispatchEvent(new Event("searchHistoryUpdated"))

      // Navigate to results
      router.push("/results")
    } catch (error) {
      console.error("Analysis error:", error)
      alert("Sorry, there was an error analyzing your symptoms. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleVoiceInput = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onstart = () => {
        console.log("Voice recognition started")
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setSymptoms((prev) => prev + " " + transcript)
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        alert("Voice recognition failed. Please try again or type your symptoms.")
      }

      recognition.start()
    } else {
      alert("Voice recognition is not supported in your browser.")
    }
  }

  const commonSymptoms = [
    "Headache",
    "Chest Pain",
    "Dyspnea",
    "Abdominal Pain",
    "Fever",
    "Fatigue",
    "Nausea",
    "Dizziness",
  ]

  const quickPrompts = [
    "I've been experiencing a persistent headache for the past 2 days",
    "Experiencing chest tightness and difficulty breathing",
    "Sudden onset of severe abdominal pain",
    "High fever with body aches and fatigue",
  ]

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#C1121F]" />
                <span className="text-gray-600 text-xs">Countries Served</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">50+</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 flex-1">
          <nav className="space-y-1 mb-6">
            <div className="flex items-center gap-3 px-3 py-2 text-white bg-[#C1121F] rounded-lg font-medium text-sm">
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
        <div className="px-8 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                <Activity className="w-3 h-3 mr-1" />
                System Healthy
              </Badge>
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

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            {/* Main Input Section */}
            <div className="mb-6">
              <Card className="border-2 border-[#DDDDDD] shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Stethoscope className="w-6 h-6 text-[#C1121F]" />
                    Describe Your Symptoms
                  </CardTitle>
                  <CardDescription className="text-base">
                    Be as detailed as possible. Include when symptoms started, severity, location, and any relevant
                    context for the most accurate analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Example: I've been experiencing a persistent headache for the past 2 days, along with mild fever (99.5°F) and fatigue. The headache is worse in the morning and I feel nauseous. I also have some sensitivity to light..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="min-h-[100px] text-base border-[#DDDDDD] focus:ring-2 focus:ring-[#C1121F]/20 focus:border-[#C1121F] resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3">
                      <Button
                        onClick={handleVoiceInput}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 border-[#C1121F] text-[#C1121F] hover:bg-[#C1121F] hover:text-white bg-transparent"
                      >
                        <Mic className="w-4 h-4" />
                        Voice Input
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 border-[#C1121F] text-[#C1121F] hover:bg-[#C1121F] hover:text-white bg-transparent"
                      >
                        <MapPin className="w-4 h-4" />
                        Use Location
                      </Button>
                    </div>
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !symptoms.trim()}
                      className="bg-[#C1121F] hover:bg-[#9e0e19] text-white px-8 py-2 font-semibold text-base"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Analyze Symptoms
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-8 flex-1">
              {/* Quick Prompts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Prompts:</h3>
                <div className="space-y-3">
                  {quickPrompts.map((prompt, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 hover:border-[#C1121F]/30"
                      onClick={() => setSymptoms(prompt)}
                    >
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-700">{prompt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* System Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Capabilities:</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Brain className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">AI-Powered Analysis</div>
                      <div className="text-xs text-gray-600">Advanced machine learning algorithms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <Shield className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Privacy Protected</div>
                      <div className="text-xs text-gray-600">Your data is encrypted and secure</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                    <Stethoscope className="w-6 h-6 text-[#C1121F]" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Medical Grade</div>
                      <div className="text-xs text-gray-600">Developed with medical professionals</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                    <Zap className="w-6 h-6 text-yellow-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Instant Results</div>
                      <div className="text-xs text-gray-600">Get insights in seconds</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Common Symptoms Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Common Symptoms:</h4>
                  <div className="flex flex-wrap gap-2">
                    {commonSymptoms.map((symptom, index) => (
                      <button
                        key={index}
                        onClick={() => setSymptoms(symptom)}
                        className="px-3 py-1 border border-[#C1121F] text-[#C1121F] rounded-full hover:bg-[#C1121F] hover:text-white transition-colors text-sm"
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <AlertCircle className="w-3 h-3" />
                    <span>For emergencies, call 911 immediately</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
