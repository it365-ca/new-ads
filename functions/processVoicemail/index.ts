import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "@lumi.new/sdk"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")
const LUMI_API_KEY = Deno.env.get("LUMI_API_KEY")
const API_BASE_URL = Deno.env.get("API_BASE_URL")
const PROJECT_ID = Deno.env.get("PROJECT_ID")

// Initialize Lumi SDK
const lumi = createClient({
  projectId: PROJECT_ID || "",
  apiBaseUrl: API_BASE_URL || "",
  authOrigin: "",
  authorization: `Bearer ${LUMI_API_KEY}`
})

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

interface VoicemailPayload {
  from: string        // Numéro téléphone appelant (ex: "+15141234567")
  to: string          // Numéro appelé
  audioUrl: string    // URL du fichier audio .wav
  duration?: string   // Durée en secondes
  timestamp?: string  // Date/heure du message
}

/**
 * Transcrit un fichier audio via OpenAI Whisper API
 */
async function transcribeAudio(audioUrl: string): Promise<string> {
  console.log(JSON.stringify({
    stage: "transcription_start",
    audioUrl
  }))

  try {
    // Télécharger le fichier audio
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.statusText}`)
    }

    const audioBlob = await audioResponse.blob()
    console.log(JSON.stringify({
      stage: "audio_downloaded",
      size: audioBlob.size,
      type: audioBlob.type
    }))

    // Créer FormData pour Whisper API
    const formData = new FormData()
    formData.append("file", audioBlob, "voicemail.wav")
    formData.append("model", "whisper-1")
    formData.append("language", "fr")  // Français pour Québec
    formData.append("response_format", "json")

    // Appel API Whisper
    console.log(JSON.stringify({
      stage: "external_request",
      url: "https://api.openai.com/v1/audio/transcriptions",
      model: "whisper-1"
    }))

    const transcriptionResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: formData
      }
    )

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text()
      console.error(JSON.stringify({
        stage: "transcription_error",
        status: transcriptionResponse.status,
        error: errorText
      }))
      throw new Error(`Whisper API error: ${errorText}`)
    }

    const result = await transcriptionResponse.json()
    console.log(JSON.stringify({
      stage: "external_response",
      status: transcriptionResponse.status,
      textLength: result.text?.length
    }))

    return result.text || ""
  } catch (error) {
    console.error(JSON.stringify({
      stage: "transcription_error",
      error: error instanceof Error ? error.message : "Unknown error"
    }))
    throw error
  }
}

/**
 * Recherche un étudiant par numéro de téléphone (parents)
 */
async function findStudentByPhone(phoneNumber: string): Promise<any | null> {
  console.log(JSON.stringify({
    stage: "search_student",
    phoneNumber
  }))

  try {
    // Nettoyer le numéro (enlever +1, espaces, tirets)
    const cleanPhone = phoneNumber.replace(/[\s\-\+]/g, "").slice(-10)

    // Rechercher dans les étudiants
    const result = await lumi.entities.students.list({
      filter: {},
      limit: 1000
    })

    console.log(JSON.stringify({
      stage: "students_fetched",
      total: result.total
    }))

    // Chercher dans les numéros de parents
    for (const student of result.list) {
      if (student.parents && Array.isArray(student.parents)) {
        for (const parent of student.parents) {
          const parentPhone = (parent.téléphone || "").replace(/[\s\-\+]/g, "").slice(-10)
          if (parentPhone === cleanPhone) {
            console.log(JSON.stringify({
              stage: "student_found",
              studentId: student._id,
              studentName: `${student.prénom} ${student.nom}`
            }))
            return student
          }
        }
      }
    }

    console.log(JSON.stringify({
      stage: "student_not_found",
      phoneNumber
    }))
    return null
  } catch (error) {
    console.error(JSON.stringify({
      stage: "search_error",
      error: error instanceof Error ? error.message : "Unknown error"
    }))
    return null
  }
}

/**
 * Crée une note de suivi automatique
 */
async function createFollowUpNote(
  studentId: string,
  transcription: string,
  phoneNumber: string,
  duration?: string
): Promise<any> {
  console.log(JSON.stringify({
    stage: "create_note",
    studentId
  }))

  try {
    const noteContent = `📞 **Message vocal reçu**\n\n` +
      `**De:** ${phoneNumber}\n` +
      `**Durée:** ${duration || "inconnu"}\n` +
      `**Date:** ${new Date().toLocaleString("fr-CA", { timeZone: "America/Toronto" })}\n\n` +
      `**Transcription:**\n${transcription}\n\n` +
      `_Note générée automatiquement par le système de boîte vocale_`

    const note = await lumi.entities.notes.create({
      studentId,
      intervenant: "Système automatique",
      contenu: noteContent,
      date_creation: new Date().toISOString(),
      date_evenement: new Date().toISOString(),
      status: "actif",
      type: "message_vocal"
    })

    console.log(JSON.stringify({
      stage: "note_created",
      noteId: note._id
    }))

    return note
  } catch (error) {
    console.error(JSON.stringify({
      stage: "note_creation_error",
      error: error instanceof Error ? error.message : "Unknown error"
    }))
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  console.log(JSON.stringify({
    stage: "start",
    method: req.method,
    url: req.url
  }))

  try {
    // Vérifier les clés API
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY manquante")
    }
    if (!LUMI_API_KEY) {
      throw new Error("LUMI_API_KEY manquante")
    }

    // Parser le webhook (SendGrid Inbound Parse ou format personnalisé)
    const payload: VoicemailPayload = await req.json()

    console.log(JSON.stringify({
      stage: "payload_received",
      from: payload.from,
      to: payload.to,
      hasAudio: Boolean(payload.audioUrl)
    }))

    if (!payload.audioUrl) {
      throw new Error("audioUrl manquant dans le payload")
    }

    // Étape 1 : Transcrire l'audio
    const transcription = await transcribeAudio(payload.audioUrl)

    if (!transcription || transcription.trim().length === 0) {
      throw new Error("Transcription vide")
    }

    // Étape 2 : Trouver l'étudiant
    const student = await findStudentByPhone(payload.from)

    // Étape 3 : Créer la note de suivi
    let note = null
    if (student) {
      note = await createFollowUpNote(
        student._id,
        transcription,
        payload.from,
        payload.duration
      )
    }

    const response = {
      success: true,
      transcription,
      student: student ? {
        id: student._id,
        nom: `${student.prénom} ${student.nom}`
      } : null,
      note: note ? { id: note._id } : null,
      message: student
        ? "Message vocal transcrit et note créée"
        : "Message vocal transcrit mais aucun étudiant trouvé"
    }

    console.log(JSON.stringify({
      stage: "response",
      success: true,
      hasStudent: Boolean(student),
      hasNote: Boolean(note)
    }))

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error(JSON.stringify({
      stage: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }))

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})