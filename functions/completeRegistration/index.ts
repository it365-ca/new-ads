import { createClient } from "https://esm.sh/@lumi.new/sdk@0.3.3"

// Helper functions for password hashing
async function generateSalt(): Promise<string> {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("")
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return new Response(JSON.stringify({ 
        error: "Token et mot de passe requis" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ 
        error: "Le mot de passe doit contenir au moins 8 caractères" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const authorization = req.headers.get("Authorization")
    const lumi = createClient({
      projectId: Deno.env.get("PROJECT_ID") || "",
      apiBaseUrl: Deno.env.get("API_BASE_URL") || "",
      authOrigin: "",
      authorization
    })

    // Rechercher le token d'invitation
    const invitations = await lumi.entities.invitationTokens.list({
      filter: { token, used: false },
      limit: 1
    })

    if (invitations.list.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Token invalide ou déjà utilisé" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const invitation = invitations.list[0] as any

    // Vérifier l'expiration
    if (new Date(invitation.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ 
        error: "Ce lien d'invitation a expiré. Veuillez demander un nouveau lien à votre administrateur." 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Générer salt et hash du mot de passe
    const salt = await generateSalt()
    const passwordHash = await hashPassword(password, salt)

    // Mettre à jour l'intervenant avec le mot de passe
    await lumi.entities.intervenants.update(invitation.intervenantId, {
      passwordHash,
      salt,
      actif: true
    })

    // Marquer le token comme utilisé
    await lumi.entities.invitationTokens.update(invitation._id, {
      used: true
    })

    return new Response(JSON.stringify({ 
      success: true,
      message: "Inscription complétée avec succès ! Vous pouvez maintenant vous connecter."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Erreur completeRegistration:", error)
    return new Response(JSON.stringify({ 
      error: "Erreur lors de la finalisation de l'inscription" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})