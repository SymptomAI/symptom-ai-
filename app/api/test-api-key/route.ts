import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || !apiKey.startsWith("sk-")) {
      return NextResponse.json({
        valid: false,
        error: "Invalid API key format. OpenAI keys start with 'sk-'",
      })
    }

    // Test the API key with a simple request
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      // Check if we have access to GPT models
      const hasGPTModels = data.data?.some((model: any) => model.id.includes("gpt-3.5") || model.id.includes("gpt-4"))

      return NextResponse.json({
        valid: true,
        message: hasGPTModels
          ? "API key is valid with GPT model access"
          : "API key is valid but may have limited model access",
        modelCount: data.data?.length || 0,
      })
    } else {
      const errorData = await response.json().catch(() => ({}))

      let errorMessage = "Invalid API key"
      if (response.status === 401) {
        errorMessage = "Invalid API key or insufficient permissions"
      } else if (response.status === 429) {
        errorMessage = "API key rate limit exceeded"
      } else if (response.status === 403) {
        errorMessage = "API key access denied"
      }

      return NextResponse.json({
        valid: false,
        error: errorMessage,
        details: errorData.error?.message || "Unknown error",
      })
    }
  } catch (error) {
    console.error("API key test error:", error)
    return NextResponse.json({
      valid: false,
      error: "Failed to test API key. Please check your internet connection.",
    })
  }
}
