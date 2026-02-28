// Fonctions de hashing - identiques à loginCustom
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

// Fonction pure - pas de dépendance Lumi
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const { token, newPassword } = await req.json()

    if (!token || !newPassword) {
      return new Response(JSON.stringify({ 
        error: "Token et nouveau mot de passe requis" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    if (newPassword.length < 8) {
      return new Response(JSON.stringify({ 
        error: "Le mot de passe doit contenir au moins 8 caractères" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const projectId = "p384255179950706688"
    const apiBaseUrl = "https://api.lumi.new"
    const apiKey = Deno.env.get("LUMI_API_KEY")

    if (!apiKey) {
      throw new Error("LUMI_API_KEY not configured")
    }

    // Trouver le token - API directe
    const tokenSearchResponse = await fetch(
      `${apiBaseUrl}/v1/entities/${projectId}/passwordResetTokens/list`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          filter: { token: token, used: false },
          limit: 1
        })
      }
    )

    if (!tokenSearchResponse.ok) {
      const errorText = await tokenSearchResponse.text()
      console.error("Token search error:", tokenSearchResponse.status, errorText)
      throw new Error(`Token search failed: ${tokenSearchResponse.status}`)
    }

    const tokenResult = await tokenSearchResponse.json()

    if (!tokenResult.list || tokenResult.list.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Token invalide ou déjà utilisé" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const resetToken = tokenResult.list[0]

    // Vérifier expiration
    const expiresAt = new Date(resetToken.expiresAt)
    if (expiresAt < new Date()) {
      return new Response(JSON.stringify({ 
        error: "Ce lien a expiré" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Trouver l'intervenant - API directe
    const intervenantSearchResponse = await fetch(
      `${apiBaseUrl}/v1/entities/${projectId}/intervenants/list`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          filter: { email: resetToken.email },
          limit: 1
        })
      }
    )

    if (!intervenantSearchResponse.ok) {
      throw new Error(`Intervenant search failed: ${intervenantSearchResponse.status}`)
    }

    const intervenantResult = await intervenantSearchResponse.json()

    if (!intervenantResult.list || intervenantResult.list.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Utilisateur non trouvé" 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

    const intervenant = intervenantResult.list[0]

    // Générer nouveau salt et hash - MÊME LOGIQUE QUE loginCustom
    const salt = await generateSalt()
    const passwordHash = await hashPassword(newPassword, salt)

    // Mettre à jour le mot de passe - API directe
    const updateResponse = await fetch(
      `${apiBaseUrl}/v1/entities/${projectId}/intervenants/${intervenant._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          passwordHash,
          salt,
          mustChangePassword: false
        })
      }
    )

    if (!updateResponse.ok) {
      throw new Error(`Password update failed: ${updateResponse.status}`)
    }

    // Marquer le token comme utilisé - API directe
    await fetch(
      `${apiBaseUrl}/v1/entities/${projectId}/passwordResetTokens/${resetToken._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          used: true
        })
      }
    )

    return new Response(JSON.stringify({ 
      success: true,
      message: "Mot de passe réinitialisé avec succès"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error("Error:", error.message)
    return new Response(JSON.stringify({ 
      error: "Erreur lors de la réinitialisation" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
