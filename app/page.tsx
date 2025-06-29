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
  AlertCircle,
  Pill,
  User,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

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

  const bottomCards = [
    {
      question: "What are the symptoms of hypertension?",
      icon: Stethoscope,
      prompt:
        "I've been having headaches, dizziness, and my blood pressure readings have been consistently high around 150/95. I also feel short of breath sometimes.",
    },
    {
      question: "Which medications help with digestion?",
      icon: Pill,
      prompt:
        "I've been experiencing stomach pain, bloating, and indigestion after meals. I feel nauseous and have acid reflux symptoms.",
    },
    {
      question: "What lifestyle changes can help with high blood pressure?",
      icon: User,
      prompt:
        "My doctor said I have high blood pressure and recommended lifestyle changes. I want to know what symptoms to watch for and how to manage it naturally.",
    },
    {
      question: "How many calories should I eat daily?",
      icon: Activity,
      prompt:
        "I'm trying to maintain a healthy weight and wondering about proper nutrition. I sometimes feel tired and want to make sure I'm eating enough.",
    },
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
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 flex-1 shadow-xl">
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
            <div
              onClick={() => router.push("/profile")}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation"
            >
              <div className="w-6 h-6 bg-[#C1121F] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 truncate">Matthew Anderson</div>
                <div className="text-xs text-gray-500 truncate">Manderson@gmail.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Main Content - Centered Design */}
        <div className="flex-1 flex items-center justify-center px-16 bg-[rgba(252,252,252,1)]">
          <div className="w-full max-w-4xl mx-auto text-center space-y-8">
            {/* Logo and Heading */}
            <div className="space-y-3">
              <div className="flex justify-center opacity-0">
                <img src="/medical-cross-logo.png" alt="Medical Cross" className="w-12 h-12" />
              </div>

              <div className="space-y-1">
                <h1 className="text-4xl font-bold text-gray-900">Built to diagnose.</h1>
                <p className="text-xl text-gray-500">Designed to assist.</p>
              </div>
            </div>

            {/* Symptom Input Card */}
            <div className="w-full max-w-2xl mx-auto">
              <Card className="border-2 border-gray-200 rounded-xl shadow-sm">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Stethoscope className="w-5 h-5 text-[#C1121F]" />
                    <h2 className="text-xl font-semibold text-gray-900">Describe Your Symptoms</h2>
                  </div>

                  {/* Subtitle */}
                  <p className="text-gray-600 mb-4 text-left text-sm">
                    Be as detailed as possible. Include when symptoms started, severity, and any relevant context.
                  </p>

                  {/* Text Input */}
                  <Textarea
                    placeholder="Shortness of Breath"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full min-h-[100px] text-base border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C1121F]/20 focus:border-[#C1121F] resize-none placeholder:text-gray-500 mb-4"
                  />

                  {/* Bottom Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      <Button
                        onClick={handleVoiceInput}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 px-3 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg bg-transparent"
                      >
                        <Mic className="w-4 h-4" />
                        Voice Input
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 px-3 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg bg-transparent"
                      >
                        <MapPin className="w-4 h-4" />
                        Use Location
                      </Button>
                    </div>
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !symptoms.trim()}
                      className="bg-[#C1121F] hover:bg-[#9e0e19] text-white px-6 py-2 rounded-lg flex items-center gap-2 font-semibold"
                    >
                      {isAnalyzing ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Analyze Symptoms
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Emergency Notice */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              
              
            </div>

            {/* Bottom Cards - Directly under symptom input */}
            <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
              {bottomCards.map((card, index) => {
                const IconComponent = card.icon
                return (
                  <Card
                    key={index}
                    className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-[#C1121F]/30 rounded-lg group bg-white relative min-h-[120px]"
                    onClick={() => setSymptoms(card.prompt)}
                  >
                    <div className="flex flex-col h-full">
                      {/* Question text at top */}
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-[#C1121F] transition-colors leading-tight text-left mb-auto">
                        {card.question}
                      </h3>
                      {/* Icon in bottom right corner */}
                      <div className="flex justify-end mt-4">
                        <IconComponent className="w-6 h-6 text-gray-400 group-hover:text-[#C1121F] transition-colors" />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
