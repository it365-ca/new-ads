Deno.serve(async (req) => {
  const authorization = req.headers.get("Authorization")
  
  console.log(JSON.stringify({ stage: "start", hasAuth: Boolean(authorization) }))
  
  if (!authorization) {
    return new Response(JSON.stringify({ error: "Authorization requise" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    // Vérifier la session via la Deno Function verifySession (URL publique)
    const sessionToken = authorization?.replace("Bearer ", "")
    console.log(JSON.stringify({ stage: "verify_session", hasToken: Boolean(sessionToken) }))
    
    const sessionResponse = await fetch("https://api.lumi.new/v1/functions/p384255179950706688/verifySession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authorization || ""
      },
      body: JSON.stringify({ sessionToken })
    })
    
    if (!sessionResponse.ok) {
      console.error(JSON.stringify({ stage: "session_error", status: sessionResponse.status }))
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }
    
    const sessionData = await sessionResponse.json()
    console.log(JSON.stringify({ stage: "session_verified", valid: sessionData?.valid }))
    
    if (!sessionData?.valid) {
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }
    
    const user = sessionData.user

    // Déterminer l'URL de l'API backend (dynamique pour cloud et local)
    const apiBaseUrl = Deno.env.get("API_BASE_URL") || "https://your-backend-url.com/api"
    console.log(JSON.stringify({ stage: "config", apiBaseUrl: apiBaseUrl.substring(0, 30) }))

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
    
    // Créer 25 étudiants ACTIFS via API Express REST
    console.log(JSON.stringify({ stage: "start_creation", count: 25 }))
    
    for (let i = 0; i < 25; i++) {
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
      
      const studentData = {
        nom: noms[i % noms.length],
        prenom: prenoms[i % prenoms.length],
        dateNaissance: `${year}-${month}-${day}T00:00:00.000Z`,
        age: age,
        origine: origines[i % origines.length],
        genre: genres[i % genres.length],
        degreScolaire: degres[i % degres.length],
        adresse: `${100 + i} Rue Principale`,
        codePostal: `H${Math.floor(Math.random() * 9) + 1}A ${Math.floor(Math.random() * 9) + 1}B${Math.floor(Math.random() * 9) + 1}`,
        ville: villes[i % villes.length],
        demeurAvec: demeurAvecOptions[i % demeurAvecOptions.length],
        parent1Type: i % 2 === 0 ? "Mere" : "Pere",
        parent1Nom: noms[(i + 5) % noms.length],
        parent1Prenom: i % 2 === 0 ? "Marie" : "Jean",
        parent1Tel: `514-555-${String(1000 + i).padStart(4, "0")}`,
        parent1Email: `parent${i + 1}@email.com`,
        contactUrgence: `Contact Urgence ${i + 1}`,
        contactUrgenceTel: `438-555-${String(2000 + i).padStart(4, "0")}`,
        contactUrgenceLien: i % 3 === 0 ? "Tante" : i % 3 === 1 ? "Oncle" : "Grand-parent",
        epipen: Math.random() < 0.1 ? "oui" : "non",
        ecoleReferente: ecoles[i % ecoles.length],
        intervenantNom: `Intervenant ${i + 1}`,
        intervenantTitre: i % 3 === 0 ? "TES" : i % 3 === 1 ? "Psychologue" : "Travailleur social",
        intervenantPoste: String(1000 + i),
        intervenantEmail: `intervenant${i + 1}@ecole.com`,
        directionNom: `Direction ${(i % 5) + 1}`,
        directionEmail: `direction${(i % 5) + 1}@ecole.com`,
        programme: programmes[i % programmes.length],
        dateEntree: `${entreeYear}-${entreeMonth}-${entreeDay}T00:00:00.000Z`,
        dateFin: `${finYear}-${entreeMonth}-${entreeDay}T00:00:00.000Z`,
        apresSejourPlan: i % 4 === 0 ? "Changement d'école" : i % 4 === 1 ? "Changement de programme" : i % 4 === 2 ? "Réintégration" : "À évaluer",
        motifReference: `Motif reference etudiant ${i + 1}`,
        motivationsAdolescent: `Motivations adolescent ${i + 1}`,
        status: "actif",
        creator: user.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      console.log(JSON.stringify({ stage: "create_student", index: i + 1 }))
      
      // Appeler l'API Express REST pour créer l'étudiant
      try {
        const response = await fetch(`${apiBaseUrl}/enrollments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authorization
          },
          body: JSON.stringify(studentData)
        })
        
        if (!response.ok) {
          const errorData = await response.text()
          console.error(JSON.stringify({ stage: "create_error", index: i + 1, status: response.status, error: errorData }))
          continue
        }
        
        const created = await response.json()
        totalCreated.push(created)
        console.log(JSON.stringify({ stage: "student_created", index: i + 1, id: created._id || created.id }))
      } catch (error: any) {
        console.error(JSON.stringify({ stage: "create_error", index: i + 1, message: error.message }))
      }
      
      // Pause entre chaque création pour éviter surcharge
      if (i < 24) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    console.log(JSON.stringify({ stage: "success", total: totalCreated.length }))
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `${totalCreated.length} étudiants actifs créés avec succès`,
      count: totalCreated.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error: any) {
    console.error(JSON.stringify({ stage: "error", type: error.constructor?.name, message: error.message }))
    return new Response(JSON.stringify({ 
      error: "Erreur lors de la création",
      details: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
