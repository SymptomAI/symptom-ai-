import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { symptoms } = await request.json()

    if (!symptoms || symptoms.trim().length === 0) {
      return NextResponse.json({ error: "Symptoms are required" }, { status: 400 })
    }

    // For now, we'll simulate the API response with realistic medical data
    // In production, you would uncomment the OpenAI integration below

    const simulatedResponse = {
      possibleConditions: [
        {
          condition: "Common Cold",
          severity: "Mild",
          percentage: "75%",
          symptoms: "Runny nose, sneezing, mild fatigue",
        },
        {
          condition: "Seasonal Allergies",
          severity: "Mild",
          percentage: "60%",
          symptoms: "Itchy eyes, persistent sneezing, clear nasal discharge",
        },
        {
          condition: "Upper Respiratory Infection",
          severity: "Moderate",
          percentage: "45%",
          symptoms: "Persistent cough, throat irritation, mild fever",
        },
      ],
      nearbyMedicalHelp: [
        {
          name: "Johns Hopkins Hospital",
          type: "Hospital",
          distance: "2.3 miles",
          wait: "45-60 min",
        },
        {
          name: "MedStar Urgent Care",
          type: "Urgent Care",
          distance: "1.1 miles",
          wait: "15-30 min",
        },
        {
          name: "University of Maryland Medical Center",
          type: "Hospital",
          distance: "3.2 miles",
          wait: "30-45 min",
        },
      ],
      prescriptions: [
        {
          name: "Amoxicillin (if bacterial)",
          cost: "$15-25",
          duration: "7-10 days",
        },
        {
          name: "Prednisone (for severe symptoms)",
          cost: "$10-20",
          duration: "5-7 days",
        },
        {
          name: "Prescription nasal spray",
          cost: "$25-40",
          duration: "As needed",
        },
      ],
      otcMedications: [
        {
          name: "Acetaminophen (Tylenol)",
          use: "Pain and fever relief",
          cost: "$5-12",
        },
        {
          name: "Ibuprofen (Advil)",
          use: "Anti-inflammatory, pain relief",
          cost: "$6-15",
        },
        {
          name: "Loratadine (Claritin)",
          use: "Allergy symptom relief",
          cost: "$8-18",
        },
      ],
      homeRemedies: [
        "Rest and get 8+ hours of sleep",
        "Stay hydrated with water, herbal teas, and warm broths",
        "Use a humidifier or breathe steam from hot shower",
        "Gargle with warm salt water for throat relief",
        "Consume honey and ginger for natural anti-inflammatory effects",
        "Apply warm compress to sinus areas if congested",
      ],
      expectedDuration: "3-7 days for mild symptoms, up to 2 weeks if complications arise",
      estimatedCost: "$25-150 depending on treatment approach",
      additionalQuestions: [
        "Have you had a fever? If so, how high and for how long?",
        "Are your symptoms getting worse or staying the same?",
        "Do you have any known allergies or chronic conditions?",
        "Have you been around anyone who was sick recently?",
        "Are you experiencing any difficulty breathing or chest pain?",
      ],
    }

    // Customize response based on symptoms
    const lowerSymptoms = symptoms.toLowerCase()
    if (lowerSymptoms.includes("fever") || lowerSymptoms.includes("high temperature")) {
      simulatedResponse.possibleConditions[0].percentage = "85%"
      simulatedResponse.expectedDuration = "5-10 days with fever management"
    }

    if (lowerSymptoms.includes("headache") || lowerSymptoms.includes("head pain")) {
      simulatedResponse.possibleConditions.unshift({
        condition: "Tension Headache",
        severity: "Mild to Moderate",
        percentage: "70%",
        symptoms: "Tight band-like pressure around head, neck tension",
      })
    }

    if (lowerSymptoms.includes("stomach") || lowerSymptoms.includes("nausea")) {
      simulatedResponse.possibleConditions.unshift({
        condition: "Gastroenteritis",
        severity: "Moderate",
        percentage: "65%",
        symptoms: "Nausea, stomach cramps, possible diarrhea",
      })
    }

    return NextResponse.json({ analysis: simulatedResponse })

    /* 
    // Uncomment this section when you have OpenAI API key configured
    
    const { openai } = await import("@ai-sdk/openai")
    const { generateText } = await import("ai")

    const prompt = `According to WebMD, if I have ${symptoms}, what might be the cause? For each possible cause, explain the unique symptoms that differentiate it from the others. Also include what kind of specialist I should see in Maryland, what medications might be prescribed, what over-the-counter or home remedies can help, and how long each condition typically takes to heal.

Please format your response as a JSON object with the following structure:
{
  "possibleConditions": [
    {
      "condition": "condition name",
      "severity": "Mild/Moderate/Severe",
      "percentage": "likelihood percentage",
      "symptoms": "unique differentiating symptoms"
    }
  ],
  "nearbyMedicalHelp": [
    {
      "name": "facility name",
      "type": "Hospital/Urgent Care/Primary Care",
      "distance": "estimated distance",
      "wait": "estimated wait time"
    }
  ],
  "prescriptions": [
    {
      "name": "medication name",
      "cost": "estimated cost range",
      "duration": "treatment duration"
    }
  ],
  "otcMedications": [
    {
      "name": "medication name",
      "use": "what it treats",
      "cost": "estimated cost range"
    }
  ],
  "homeRemedies": [
    "remedy description"
  ],
  "expectedDuration": "typical healing time",
  "estimatedCost": "total treatment cost range",
  "additionalQuestions": [
    "question to consider"
  ]
}`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
    })

    // Try to parse the JSON response
    let analysisData
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0])
      } else {
        analysisData = JSON.parse(text)
      }
    } catch (parseError) {
      // Fallback to simulated response if parsing fails
      analysisData = simulatedResponse
    }

    return NextResponse.json({ analysis: analysisData })
    */
  } catch (error) {
    console.error("Error analyzing symptoms:", error)

    // Return a fallback response instead of an error
    const fallbackResponse = {
      possibleConditions: [
        {
          condition: "Symptom Analysis Available",
          severity: "Unknown",
          percentage: "N/A",
          symptoms: "Please consult with a healthcare professional for proper diagnosis",
        },
      ],
      nearbyMedicalHelp: [
        {
          name: "Consult Your Primary Care Doctor",
          type: "Primary Care",
          distance: "Contact your provider",
          wait: "Schedule appointment",
        },
      ],
      prescriptions: [
        {
          name: "Consult physician for prescriptions",
          cost: "Varies",
          duration: "As prescribed",
        },
      ],
      otcMedications: [
        {
          name: "Consult pharmacist for recommendations",
          use: "Symptom relief",
          cost: "Varies",
        },
      ],
      homeRemedies: ["Rest and stay hydrated", "Monitor symptoms closely", "Seek medical attention if symptoms worsen"],
      expectedDuration: "Consult healthcare provider",
      estimatedCost: "Varies by treatment",
      additionalQuestions: [
        "When did symptoms start?",
        "Have symptoms changed or worsened?",
        "Do you have any other health conditions?",
      ],
    }

    return NextResponse.json({ analysis: fallbackResponse })
  }
}
