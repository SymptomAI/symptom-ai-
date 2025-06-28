"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

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
        headers: {\
          "Content-Type\": \"application\
