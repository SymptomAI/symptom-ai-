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
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Shield,
  Heart,
  AlertTriangle,
  Info,
  Users,
  TrendingUp,
  CheckCircle,
  X,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface FAQItem {
  question: string
  answer: string
  category: string
}

export default function HelpPage() {
  const router = useRouter()
  const [recentChats, setRecentChats] = useState<string[]>([])
  const [showEmergencyWarning, setShowEmergencyWarning] = useState(true)

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

  const [searchQuery, setSearchQuery] = useState("")
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

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

  const faqItems: FAQItem[] = [
    {
      question: "How accurate is Symptom AI's analysis?",
      answer:
        "Symptom AI provides preliminary analysis based on medical databases and AI algorithms. However, it should never replace professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.",
      category: "General",
    },
    {
      question: "Is my medical information secure and private?",
      answer:
        "Yes, we take your privacy seriously. All data is encrypted and stored securely. We never share your personal medical information with third parties without your explicit consent. You can review our privacy policy for more details.",
      category: "Privacy",
    },
    {
      question: "Can I use Symptom AI for emergency situations?",
      answer:
        "No, Symptom AI is not designed for emergency situations. If you're experiencing a medical emergency, call 911 immediately or go to your nearest emergency room. Our tool is meant for non-urgent symptom analysis only.",
      category: "Safety",
    },
    {
      question: "How do I update my profile information?",
      answer:
        "You can update your profile by clicking on 'Profile Settings' in the sidebar navigation. From there, you can edit your personal information, location, and medical history.",
      category: "Account",
    },
    {
      question: "What should I do if I disagree with the analysis?",
      answer:
        "Our AI provides suggestions based on the symptoms you describe, but it's not infallible. If you disagree with the analysis or have concerns, please consult with a healthcare professional. You can also provide feedback using the thumbs up/down buttons.",
      category: "General",
    },
    {
      question: "Can I export my symptom history?",
      answer:
        "Yes, you can export your data from the Settings page. Click on 'Export My Data' to download a file containing your symptom history, analysis results, and profile information.",
      category: "Account",
    },
    {
      question: "How do I delete my account and data?",
      answer:
        "You can delete all your data from the Settings page by clicking 'Delete All Data'. This action is permanent and cannot be undone. Alternatively, contact our support team for account deletion assistance.",
      category: "Account",
    },
    {
      question: "Why am I not getting location-based results?",
      answer:
        "Make sure location services are enabled in your browser and in the app settings. Also, ensure your profile has your current address information filled out for the most accurate local medical facility recommendations.",
      category: "Technical",
    },
  ]

  const filteredFAQs = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const contactMethods = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email Support",
      description: "Get help via email within 24 hours",
      contact: "support@symptomai.com",
      action: () => window.open("mailto:support@symptomai.com", "_blank"),
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: "Phone Support",
      description: "Speak with our support team",
      contact: "1-800-SYMPTOM",
      action: () => window.open("tel:1-800-796-7866", "_blank"),
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Live Chat",
      description: "Chat with us in real-time",
      contact: "Available 9 AM - 6 PM EST",
      action: () => alert("Live chat feature coming soon!"),
    },
  ]

  const quickLinks = [
    {
      title: "Privacy Policy",
      description: "Learn how we protect your data",
      icon: <Shield className="w-5 h-5" />,
      url: "#",
    },
    {
      title: "Terms of Service",
      description: "Review our terms and conditions",
      icon: <Info className="w-5 h-5" />,
      url: "#",
    },
    {
      title: "Medical Disclaimer",
      description: "Important information about our service",
      icon: <AlertTriangle className="w-5 h-5" />,
      url: "#",
    },
    {
      title: "Health Resources",
      description: "Additional health and wellness resources",
      icon: <Heart className="w-5 h-5" />,
      url: "#",
    },
  ]

  return (
    <div className="flex h-screen bg-[#FCFCFC]">
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
            <div className="flex items-center gap-3 px-3 py-2 text-white bg-[#C1121F] rounded-lg font-medium text-sm">
              <HelpCircle className="w-4 h-4" />
              <span>Help & Support</span>
            </div>
            <div
              onClick={() => router.push("/profile")}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation font-medium text-sm"
            >
              <User className="w-4 h-4" />
              <span>Profile Settings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-8 py-4">
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
        </div>

        {/* Help Content */}
        <div className="flex-1 overflow-auto px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Help & Support</h1>
              <p className="text-gray-600">Find answers to common questions and get support</p>
            </div>

            {/* Contact Support */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Support</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contactMethods.map((method, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={method.action}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#C1121F] rounded-full flex items-center justify-center text-white flex-shrink-0">
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{method.title}</CardTitle>
                          <CardDescription className="text-sm">{method.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm font-medium text-gray-900">{method.contact}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>

              {/* Search FAQ */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search FAQ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border border-[#DDDDDD] rounded-xl text-sm h-10"
                  />
                </div>
              </div>

              {/* FAQ Items */}
              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <Card key={index}>
                    <Collapsible
                      open={openFAQ === index}
                      onOpenChange={() => setOpenFAQ(openFAQ === index ? null : index)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium text-left">{faq.question}</CardTitle>
                            {openFAQ === index ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                          <div className="mt-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {faq.category}
                            </span>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>

              {filteredFAQs.length === 0 && searchQuery && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No FAQ items found matching your search.</p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickLinks.map((link, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                          {link.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {link.title}
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </CardTitle>
                          <CardDescription className="text-sm">{link.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Emergency Warning */}
            {showEmergencyWarning && (
              <Card className="border-red-200 bg-red-50 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmergencyWarning(false)}
                  className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100"
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    Emergency Situations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700 text-sm leading-relaxed mb-4">
                    If you're experiencing a medical emergency, do not use this app. Call emergency services
                    immediately.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => window.open("tel:911", "_blank")}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Call 911
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open("tel:988", "_blank")}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      Crisis Hotline: 988
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
