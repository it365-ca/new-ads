import { createClient } from "@lumi.new/sdk"

// Fonction de hashage sécurisé avec salt (identique à loginCustom)
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

interface UpdatePasswordRequest {
  intervenantId: string;
  password: string;
  isTemporary: boolean;
}

Deno.serve(async (req) => {
  console.log(JSON.stringify({ stage: "start", method: req.method, url: req.url }))

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const body = await req.json() as UpdatePasswordRequest
    const { intervenantId, password, isTemporary = false } = body

    console.log(JSON.stringify({
      stage: "request_received",
      hasIntervenantId: !!intervenantId,
      hasPassword: !!password,
      isTemporary,
    }))

    if (!intervenantId || !password) {
      return new Response(
        JSON.stringify({ error: "intervenantId and password are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Créer le client Lumi SDK
    const authorization = req.headers.get("Authorization")
    const lumi = createClient({
      projectId: "p384255179950706688",
      apiBaseUrl: "https://api.lumi.new",
      authOrigin: "",
      authorization
    })

    console.log(JSON.stringify({ stage: "sdk_client_created" }))

    // Récupérer l'intervenant pour obtenir le salt
    console.log(JSON.stringify({ stage: "fetching_intervenant", intervenantId }))
    const intervenant = await lumi.entities.intervenants.get(intervenantId)

    if (!intervenant) {
      console.error(JSON.stringify({ stage: "error", reason: "intervenant_not_found" }))
      return new Response(
        JSON.stringify({ error: "Intervenant not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log(JSON.stringify({
      stage: "intervenant_found",
      email: intervenant.email,
      hasSalt: !!intervenant.salt
    }))

    // Hash le mot de passe avec le salt (comme dans loginCustom)
    const passwordHash = await hashPassword(password, intervenant.salt)
    console.log(JSON.stringify({ stage: "password_hashed" }))

    // Mettre à jour l'intervenant
    console.log(JSON.stringify({ stage: "updating_intervenant" }))
    const updated = await lumi.entities.intervenants.update(intervenantId, {
      passwordHash,
      mustChangePassword: isTemporary
    })

    console.log(JSON.stringify({
      stage: "success",
      intervenantId: updated._id,
      email: updated.email
    }))

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    console.error(JSON.stringify({
      stage: "error",
      type: error.constructor?.name,
      message: error.message,
    }))

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
