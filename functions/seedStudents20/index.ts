Deno.serve(async (req) => {
  const sessionToken = req.headers.get("Authorization")?.replace("Bearer ", "")
  
  console.log(JSON.stringify({ stage: "start", hasToken: Boolean(sessionToken) }))
  
  if (!sessionToken) {
    return new Response(JSON.stringify({ error: "Authorization requise" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    })
  }

  const PROJECT_ID = "p384255179950706688"
  const API_BASE = "https://api.lumi.new"
  const AUTH_ORIGIN = "https://auth.lumi.new"

  // Vérifier la session custom
  try {
    console.log(JSON.stringify({ stage: "verify_session", action: "call_verifySession" }))
    
    const sessionResponse = await fetch(`${API_BASE}/v1/functions/${PROJECT_ID}/verifySession`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken })
    })

    const sessionData = await sessionResponse.json()
    
    console.log(JSON.stringify({ stage: "verify_session_response", valid: sessionData?.valid }))
    
    if (!sessionData?.valid) {
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const user = sessionData.user

    const noms = ["Tremblay", "Gagnon", "Roy", "Cote", "Bouchard", "Jean-Baptiste", "Diallo", "El Amrani", "Nguyen", "Singh", "Martinez", "Chen", "Mohammed", "Silva", "Dubois", "Patel", "Kim", "Santos", "Ali", "Lopez"]
    
    const prenoms = ["Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Avery", "Riley", "Jamie", "Chris", "Pat", "Skyler", "Dakota", "Sage", "River", "Phoenix", "Quinn", "Reese", "Drew", "Kendall"]
    
    const villes = [
      "Candiac", "Châteauguay", "La Prairie", "Mercier", "Napierville", "Sherrington",
      "St-Bernard de Lacolle", "St-Constant", "St-Isidore", "St-Michel", "St-Philippe",
      "St-Rémi", "Ste-Catherine", "Ste-Clotilde", "St-Mathieu", "St-Édouard", "Hemmingford", "Léry", "Delson"
    ]
    
    const ecoles = [
      "Bonnier", "Des Timoniers", "Gabrielle-Roy", "Jacques-Leber", "Marguerite-Bourgeois",
      "Louis-Cyr", "St-François-Xavier", "Louis-Philippe-Paré", "De La Magdeleine", "Du Tournant",
      "Pierre-Bédard", "Fernand-Séguin", "Hors Territoire", "École aux adultes", "J-L Vinet-Souligny",
      "J-L Des Cheminots", "J-L Félix-Leclerc", "J-L Piché-Dufrost", "J-L Aquarelle-Armand-Frappier"
    ]
    
    const programmes = ["ALT", "OPTION", "PIVOT", "APOSTROPHE", "SAUTS", "Suivis Estivaux"]
    
    const degres = ["6e Année", "Secondaire 1", "Secondaire 2", "Secondaire 3", "Secondaire 4", "Secondaire 5", "FPT", "FMS", "GADP", "GADSP", "PEP"]
    
    const origines = [
      "Canadienne", "Asiatique occidental", "Asiatique du Sud-Est", "Europe de l'est/l'ouest",
      "Sud-Asiatique", "Latino-Américaine", "Arabe", "Africaine", "Haïtienne", "Chinoise", "Autochtone"
    ]
    
    const genres = ["Masculin", "Féminin", "Autres"]
    
    const demeurAvecOptions = [
      "Mère", "Père", "Les deux parents", "Garde partagée",
      "Beaux-parents de la mère", "Beaux-parents du père", "Tante", "Oncle",
      "Oncle et tante (couple)", "Grands-oncles et grandes tantes",
      "Grands-parents (maternels)", "Grands-parents (paternels)",
      "Arrière-grands-parents", "Frères et/ou Sœurs (majeurs)",
      "Demi-frères et/ou Demi-sœurs", "Beaux-frères et/ou Belles-sœurs",
      "Cousins et/ou cousines", "Tuteur et/ou Tutrice",
      "En résidence", "Foyer de groupe", "Famille d'accueil", "Un ou une Ami(e)"
    ]
    
    const totalCreated = []
    let emailsSent = 0
    
    // Créer 20 étudiants en 2 lots de 10
    for (let batch = 0; batch < 2; batch++) {
      const students = []
      
      for (let i = 0; i < 10; i++) {
        const idx = batch * 10 + i
        const age = 9 + Math.floor(Math.random() * 9)
        const year = 2025 - age
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")
        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")
        
        const entreeStartDate = new Date("2024-04-01")
        const entreeEndDate = new Date("2025-03-31")
        const randomTime = entreeStartDate.getTime() + Math.random() * (entreeEndDate.getTime() - entreeStartDate.getTime())
        const randomDate = new Date(randomTime)
        const entreeYear = randomDate.getFullYear()
        const entreeMonth = String(randomDate.getMonth() + 1).padStart(2, "0")
        const entreeDay = String(randomDate.getDate()).padStart(2, "0")
        
        const finYear = entreeYear + 1
        
        students.push({
          nom: noms[idx % noms.length],
          prenom: prenoms[idx % prenoms.length],
          dateNaissance: `${year}-${month}-${day}T00:00:00.000Z`,
          age: age,
          origine: origines[idx % origines.length],
          genre: genres[idx % genres.length],
          degreScolaire: degres[idx % degres.length],
          adresse: `${100 + idx} Rue Principale`,
          codePostal: `H${Math.floor(Math.random() * 9) + 1}A ${Math.floor(Math.random() * 9) + 1}B${Math.floor(Math.random() * 9) + 1}`,
          ville: villes[idx % villes.length],
          demeurAvec: demeurAvecOptions[idx % demeurAvecOptions.length],
          parent1Type: idx % 2 === 0 ? "Mere" : "Pere",
          parent1Nom: noms[(idx + 5) % noms.length],
          parent1Prenom: idx % 2 === 0 ? "Marie" : "Jean",
          parent1Tel: `514-555-${String(1000 + idx).padStart(4, "0")}`,
          parent1Email: `parent${idx + 1}@email.com`,
          contactUrgence: `Contact Urgence ${idx + 1}`,
          contactUrgenceTel: `438-555-${String(2000 + idx).padStart(4, "0")}`,
          contactUrgenceLien: idx % 3 === 0 ? "Tante" : idx % 3 === 1 ? "Oncle" : "Grand-parent",
          epipen: Math.random() < 0.1 ? "oui" : "non",
          ecoleReferente: ecoles[idx % ecoles.length],
          intervenantNom: `Intervenant ${idx + 1}`,
          intervenantTitre: idx % 3 === 0 ? "TES" : idx % 3 === 1 ? "Psychologue" : "Travailleur social",
          intervenantPoste: String(1000 + idx),
          intervenantEmail: `intervenant${idx + 1}@ecole.com`,
          directionNom: `Direction ${(idx % 5) + 1}`,
          directionEmail: `direction${(idx % 5) + 1}@ecole.com`,
          programme: programmes[idx % programmes.length],
          dateEntree: `${entreeYear}-${entreeMonth}-${entreeDay}T00:00:00.000Z`,
          dateFin: `${finYear}-${entreeMonth}-${entreeDay}T00:00:00.000Z`,
          apresSejourPlan: idx % 4 === 0 ? "Changement d'école" : idx % 4 === 1 ? "Changement de programme" : idx % 4 === 2 ? "Réintégration" : "À évaluer",
          motifReference: `Motif reference etudiant ${idx + 1}`,
          motivationsAdolescent: `Motivations adolescent ${idx + 1}`,
          status: "en_attente",
          creator: user.userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
      
      console.log(JSON.stringify({ stage: "create_students", batch: batch + 1, count: students.length }))
      
      // Créer via SDK Lumi
      for (const student of students) {
        const created = await lumi.entities.enrollments.create(student)
        totalCreated.push(created)
      }
      
      console.log(JSON.stringify({ stage: "create_response", count: students.length }))
      
      // Envoyer emails
      for (const enrollment of (created.documents || [])) {
        try {
          const emailResponse = await fetch(`${API_BASE}/v1/functions/${PROJECT_ID}/notifyNewEnrollment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
              enrollment: {
                nom: enrollment.nom,
                prenom: enrollment.prenom,
                dateNaissance: enrollment.dateNaissance,
                age: enrollment.age,
                programme: enrollment.programme,
                dateEntree: enrollment.dateEntree,
                ecoleReferente: enrollment.ecoleReferente,
                parent1Nom: enrollment.parent1Nom,
                parent1Email: enrollment.parent1Email,
                parent1Tel: enrollment.parent1Tel,
                motifReference: enrollment.motifReference
              }
            })
          })
          
          if (emailResponse.ok) {
            emailsSent++
          }
        } catch (emailError) {
          console.error(JSON.stringify({ stage: "email_error", error: String(emailError) }))
        }
      }
      
      if (batch < 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    console.log(JSON.stringify({ stage: "success", total: totalCreated.length, emailsSent }))
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `${totalCreated.length} etudiants en_attente crees avec succes - ${emailsSent} emails envoyes`,
      count: totalCreated.length,
      emailsSent: emailsSent
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error: any) {
    console.error(JSON.stringify({ stage: "error", type: error.constructor?.name, message: error.message }))
    return new Response(JSON.stringify({ 
      error: "Erreur lors de la creation",
      details: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
