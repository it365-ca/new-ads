import { createClient } from "@lumi.new/sdk"

Deno.serve(async (req) => {
  console.log(JSON.stringify({ stage: "start", url: req.url, method: req.method }))

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const authorization = req.headers.get("Authorization")
    const lumi = createClient({
      projectId: "p384255179950706688",
      apiBaseUrl: "https://api.lumi.new",
      authOrigin: "",
      authorization
    })

    console.log(JSON.stringify({ stage: "sdk_call", action: "intervenants.delete", id: "6939311e8458665713e0b522" }))

    // Supprimer l'ancien compte en doublon
    await lumi.entities.intervenants.delete("6939311e8458665713e0b522")

    console.log(JSON.stringify({ stage: "response", success: true }))

    return new Response(JSON.stringify({ 
      success: true,
      message: "Doublon supprimé avec succès"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error(JSON.stringify({ stage: "error", type: error.constructor?.name, message: error.message }))
    return new Response(JSON.stringify({ 
      error: "Erreur lors du nettoyage",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
