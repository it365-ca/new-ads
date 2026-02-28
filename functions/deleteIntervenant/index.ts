import { createClient } from "https://esm.sh/@lumi.new/sdk@0.3.3"

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const authorization = req.headers.get("Authorization")
    const { intervenantId } = await req.json()

    if (!intervenantId) {
      return new Response(JSON.stringify({ error: "intervenantId requis" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const lumi = createClient({
      projectId: "p384255179950706688",
      apiBaseUrl: "https://api.lumi.new",
      authOrigin: "",
      authorization
    })

    await lumi.auth.refreshUser()

    // Supprimer l'intervenant
    await lumi.entities.intervenants.delete(intervenantId)

    return new Response(JSON.stringify({ 
      success: true,
      message: "Intervenant supprimé avec succès"
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Erreur suppression:", error)
    return new Response(JSON.stringify({ 
      error: error.message || "Erreur serveur"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
