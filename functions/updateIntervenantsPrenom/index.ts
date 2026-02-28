import { createClient } from "https://esm.sh/@lumi.new/sdk@latest"

interface Intervenant {
  _id: string
  nom: string
  prenom?: string
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const authorization = req.headers.get("Authorization")
    
    if (!authorization) {
      return new Response(JSON.stringify({ error: "Authorization header required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const lumi = createClient({
      projectId: "p384255179950706688",
      apiBaseUrl: "https://api.lumi.new",
      authOrigin: "",
      authorization
    })

    // Récupérer tous les intervenants
    const result = await lumi.entities.intervenants.list()
    const intervenants = result?.list || []

    console.log(`Trouvé ${intervenants.length} intervenants à mettre à jour`)

    const updates = []

    for (const intervenant of intervenants) {
      // Si le prénom existe déjà, passer
      if (intervenant.prenom && intervenant.prenom.trim() !== "") {
        console.log(`${intervenant.nom} - prénom déjà défini: ${intervenant.prenom}`)
        continue
      }

      // Séparer le nom complet en prénom et nom
      const nomComplet = intervenant.nom.trim()
      const parties = nomComplet.split(" ")

      let prenom = ""
      let nom = ""

      if (parties.length === 1) {
        // Un seul mot = nom
        nom = parties[0]
        prenom = parties[0] // Par défaut, utiliser le même
      } else if (parties.length === 2) {
        // Deux mots = prénom nom
        prenom = parties[0]
        nom = parties[1]
      } else {
        // Plus de deux mots = premier mot est prénom, reste est nom
        prenom = parties[0]
        nom = parties.slice(1).join(" ")
      }

      console.log(`Mise à jour: "${nomComplet}" → Prénom: "${prenom}", Nom: "${nom}"`)

      // Mettre à jour l'intervenant
      await lumi.entities.intervenants.update(intervenant._id, {
        prenom,
        nom
      })

      updates.push({
        id: intervenant._id,
        ancien: nomComplet,
        nouveau: { prenom, nom }
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${updates.length} intervenants mis à jour`,
        updates
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Erreur:", error)
    return new Response(
      JSON.stringify({
        error: "Erreur lors de la mise à jour",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
})
