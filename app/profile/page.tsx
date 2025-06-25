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
  User,
  MapPin,
  Phone,
  Calendar,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  city: string
  state: string
  zipCode: string
  emergencyContact: string
  emergencyPhone: string
  medicalConditions: string
  allergies: string
  medications: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [recentChats, setRecentChats] = useState<string[]>([])

  const [profile, setProfile] = useState<UserProfile>({
    firstName: "Matthew",
    lastName: "Anderson",
    email: "Manderson@gmail.com",
    phone: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalConditions: "",
    allergies: "",
    medications: "",
  })

  const [isSaving, setIsSaving] = useState(false)

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

    // Load profile from localStorage
    const savedProfile = localStorage.getItem("userProfile")
    if (savedProfile) {
      setProfile({ ...profile, ...JSON.parse(savedProfile) })
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

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem("userProfile", JSON.stringify(profile))
      alert("Profile saved successfully!")
    } catch (error) {
      alert("Error saving profile. Please try again.")
    } finally {
      setIsSaving(false)
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
        {/* Header */}
        <div className="px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {profile.firstName} {profile.lastName}
                </div>
                <div className="text-xs text-gray-500">{profile.email}</div>
              </div>
              <div className="w-10 h-10 bg-[#C1121F] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">{profile.firstName.charAt(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-auto px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Profile Settings</h1>
              <p className="text-gray-600">Manage your personal information and medical details</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Your basic personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="mt-1"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location Information
                  </CardTitle>
                  <CardDescription>Your address for location-based medical services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={profile.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="mt-1"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profile.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className="mt-1"
                        placeholder="Baltimore"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={profile.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        className="mt-1"
                        placeholder="MD"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={profile.zipCode}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      className="mt-1"
                      placeholder="21201"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Emergency Contact
                  </CardTitle>
                  <CardDescription>Person to contact in case of emergency</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="emergencyContact">Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      value={profile.emergencyContact}
                      onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                      className="mt-1"
                      placeholder="Jane Anderson"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Contact Phone</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={profile.emergencyPhone}
                      onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                      className="mt-1"
                      placeholder="(555) 987-6543"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Medical Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Medical Information
                  </CardTitle>
                  <CardDescription>Your medical history and current conditions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="medicalConditions">Medical Conditions</Label>
                    <Input
                      id="medicalConditions"
                      value={profile.medicalConditions}
                      onChange={(e) => handleInputChange("medicalConditions", e.target.value)}
                      className="mt-1"
                      placeholder="Diabetes, Hypertension, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="allergies">Allergies</Label>
                    <Input
                      id="allergies"
                      value={profile.allergies}
                      onChange={(e) => handleInputChange("allergies", e.target.value)}
                      className="mt-1"
                      placeholder="Penicillin, Peanuts, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="medications">Current Medications</Label>
                    <Input
                      id="medications"
                      value={profile.medications}
                      onChange={(e) => handleInputChange("medications", e.target.value)}
                      className="mt-1"
                      placeholder="Metformin, Lisinopril, etc."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#C1121F] hover:bg-[#9e0e19] text-white px-8 py-3 rounded-lg font-semibold"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
