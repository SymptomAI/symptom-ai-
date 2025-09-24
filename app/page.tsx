"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Stethoscope, Pill, Heart, Brain } from "lucide-react"

export default function HomePage() {
  const [symptoms, setSymptoms] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const router = useRouter()

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return

    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/analyze-symptoms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symptoms }),
      })

      if (response.ok) {
        const data = await response.json()

        // Save to localStorage for results page
        localStorage.setItem(
          "symptomAnalysis",
          JSON.stringify({
            symptoms,
            analysis: data.analysis,
            timestamp: new Date().toISOString(),
          }),
        )

        // Save to history
        const history = JSON.parse(localStorage.getItem("symptomHistory") || "[]")
        history.unshift({
          id: Date.now().toString(),
          symptoms,
          analysis: data.analysis,
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem("symptomHistory", JSON.stringify(history.slice(0, 50))) // Keep last 50

        router.push("/results")
      } else {
        console.error("Analysis failed")
      }
    } catch (error) {
      console.error("Error analyzing symptoms:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCardClick = (prompt: string) => {
    setSymptoms(prompt)
  }

  const quickPrompts = [
    {
      icon: Stethoscope,
      title: "What are the symptoms of a common cold?",
      prompt: "I have a runny nose, sneezing, and mild fatigue that started 2 days ago.",
    },
    {
      icon: Pill,
      title: "Should I be concerned about this headache?",
      prompt: "I've had a persistent headache for 3 days with sensitivity to light.",
    },
    {
      icon: Heart,
      title: "Is this chest discomfort serious?",
      prompt: "I'm experiencing mild chest tightness and shortness of breath during exercise.",
    },
    {
      icon: Brain,
      title: "What could be causing my dizziness?",
      prompt: "I've been feeling dizzy and lightheaded when standing up quickly for the past week.",
    },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-2xl mx-auto px-4 space-y-6">
            {/* Emergency Notice */}
            <div className="flex items-center justify-center text-red-600 text-sm mb-4">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>For medical emergencies, call 911 immediately</span>
            </div>

            {/* Main Content */}
            <div className="text-center space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Describe Your Symptoms</h1>
                <p className="text-gray-600">Tell us what you're experiencing and get AI-powered health insights</p>
              </div>

              <div className="space-y-4">
                <Textarea
                  placeholder="Describe your symptoms in detail... (e.g., I have a headache that started this morning, along with nausea and sensitivity to light)"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="min-h-[120px] text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  rows={5}
                />

                <Button
                  onClick={handleAnalyze}
                  disabled={!symptoms.trim() || isAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Symptoms"}
                </Button>
              </div>
            </div>

            {/* Quick Prompt Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 -mt-2">
              {quickPrompts.map((prompt, index) => {
                const IconComponent = prompt.icon
                return (
                  <Card
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200 relative"
                    onClick={() => handleCardClick(prompt.prompt)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">{prompt.title}</h3>
                        </div>
                        <IconComponent className="w-5 h-5 text-blue-600 ml-3 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
