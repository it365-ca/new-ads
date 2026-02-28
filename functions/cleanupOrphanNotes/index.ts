import { createClient } from "@lumi.new/sdk"

Deno.serve(async (req: Request) => {
  console.log(JSON.stringify({ stage: "start", url: req.url, method: req.method }))
  
  try {
    // Initialiser le client Lumi avec valeurs par défaut
    const projectId = Deno.env.get("PROJECT_ID") || "p384255179950706688"
    const apiBaseUrl = Deno.env.get("API_BASE_URL") || "https://api.lumi.new"
    const lumiApiKey = Deno.env.get("LUMI_API_KEY") || ""
    
    console.log(JSON.stringify({ 
      stage: "config", 
      keys: { 
        PROJECT_ID: Boolean(projectId), 
        API_BASE_URL: Boolean(apiBaseUrl),
        LUMI_API_KEY: Boolean(lumiApiKey)
      }
    }))
    
    const lumi = createClient({
      projectId,
      apiBaseUrl,
      authOrigin: "",
      authorization: `Bearer ${lumiApiKey}`
    })

    console.log(JSON.stringify({ stage: "sdk_call", action: "notes.list" }))
    
    // Récupérer toutes les notes
    const notesResult = await lumi.entities.notes.list({
      filter: {}
    })
    
    const allNotes = notesResult.list || []
    
    console.log(JSON.stringify({ stage: "sdk_response", action: "notes.list", count: allNotes.length }))

    // Récupérer tous les enrollments existants
    console.log(JSON.stringify({ stage: "sdk_call", action: "enrollments.list" }))
    
    const enrollmentsResult = await lumi.entities.enrollments.list({
      filter: {}
    })
    
    const allEnrollments = enrollmentsResult.list || []
    
    console.log(JSON.stringify({ stage: "sdk_response", action: "enrollments.list", count: allEnrollments.length }))

    // Créer un Set des enrollmentIds valides
    const validEnrollmentIds = new Set(
      allEnrollments.map((e: any) => e._id)
    )

    // Trouver les notes orphelines
    const orphanNotes = allNotes.filter((note: any) => 
      note.enrollmentId && !validEnrollmentIds.has(note.enrollmentId)
    )

    console.log(JSON.stringify({ 
      stage: "analysis", 
      orphanCount: orphanNotes.length,
      orphanIds: orphanNotes.map((n: any) => n._id)
    }))

    if (orphanNotes.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No orphan notes found",
          deletedCount: 0
        }),
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    // Supprimer les notes orphelines une par une avec logging
    let deletedCount = 0
    const errors = []
    
    for (const note of orphanNotes) {
      try {
        if (typeof note._id !== 'string') {
          throw new Error(`Invalid ID type: ${typeof note._id}`)
        }
        
        console.log(JSON.stringify({ stage: "sdk_call", action: "notes.delete", id: note._id }))
        await lumi.entities.notes.delete(note._id)
        console.log(JSON.stringify({ stage: "sdk_response", action: "notes.delete", id: note._id, success: true }))
        deletedCount++
      } catch (error: any) {
        console.error(JSON.stringify({ 
          stage: "error", 
          action: "notes.delete", 
          id: note._id, 
          error: error.message 
        }))
        errors.push({ id: note._id, error: error.message })
      }
    }

    console.log(JSON.stringify({ 
      stage: "response", 
      deletedCount, 
      errorCount: errors.length 
    }))

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${deletedCount} orphan notes`,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error: any) {
    console.error(JSON.stringify({ 
      stage: "error", 
      type: error.constructor.name, 
      message: error.message,
      stack: error.stack
    }))
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error" 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
})
