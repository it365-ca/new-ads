import { createClient } from "@lumi.new/sdk"

Deno.serve(async (req) => {
  console.log(JSON.stringify({ 
    stage: "start_receive_email", 
    method: req.method,
    timestamp: new Date().toISOString()
  }))

  // CORS préflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Resend-Signature"
      }
    })
  }

  try {
    // 1. Parse le webhook de Resend
    const webhookData = await req.json()
    console.log(JSON.stringify({ 
      stage: "webhook_received", 
      type: webhookData.type,
      hasData: !!webhookData.data
    }))

    // Vérifier que c'est un email reçu
    if (webhookData.type !== "email.received") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

    const emailData = webhookData.data
    const { from, to, subject, html, text, reply_to } = emailData

    console.log(JSON.stringify({ 
      stage: "email_data", 
      from,
      subject,
      hasHtml: !!html,
      hasText: !!text
    }))

    // 2. Extraire le nom de l'étudiant du sujet (format: [Nom Étudiant] ...)
    const studentNameMatch = subject?.match(/\[([^\]]+)\]/)
    if (!studentNameMatch) {
      console.log(JSON.stringify({ 
        stage: "no_student_match", 
        subject 
      }))
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

    const studentName = studentNameMatch[1]
    console.log(JSON.stringify({ 
      stage: "student_identified", 
      studentName 
    }))

    // 3. Initialiser SDK Lumi (sans auth pour webhook public)
    const projectId = "p384255179950706688"
    const apiBaseUrl = "https://api.lumi.new"
    const authOrigin = "https://lumi.new"
    
    const lumi = createClient({ 
      projectId, 
      apiBaseUrl,
      authOrigin
    })

    // 4. Rechercher l'étudiant par nom
    const [prenom, ...nomParts] = studentName.split(" ")
    const nom = nomParts.join(" ")

    console.log(JSON.stringify({ 
      stage: "searching_student", 
      prenom, 
      nom 
    }))

    const studentsResult = await lumi.entities.students.list({
      filter: {
        prenom: { $regex: prenom, $options: "i" },
        nom: { $regex: nom, $options: "i" }
      },
      limit: 1
    })

    if (!studentsResult.list || studentsResult.list.length === 0) {
      console.log(JSON.stringify({ 
        stage: "student_not_found", 
        studentName 
      }))
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

    const student = studentsResult.list[0]
    console.log(JSON.stringify({ 
      stage: "student_found", 
      studentId: student._id 
    }))

    // 5. Créer une note automatique pour la réponse reçue
    const now = new Date().toISOString()
    const noteContent = `
📬 **Réponse de courriel reçue**

**De:** ${from}
**Sujet:** ${subject}
**Date:** ${new Date().toLocaleString('fr-CA', { timeZone: 'America/Montreal' })}

---

${html || text || "(Pas de contenu)"}
    `.trim()

    console.log(JSON.stringify({ 
      stage: "creating_note", 
      studentId: student._id 
    }))

    await lumi.entities.notes.create({
      studentId: student._id,
      note: noteContent,
      auteur: "Système",
      auteurNom: `Réponse de ${from}`,
      type: "Courriel reçu",
      groupe: "Communication",
      suivi: false,
      dateCreation: now,
      createdAt: now,
      updatedAt: now,
      status: "active"
    })

    console.log(JSON.stringify({ 
      stage: "note_created", 
      studentId: student._id 
    }))

    // 6. Enregistrer dans la collection emails
    await lumi.entities.emails.create({
      enrollmentId: student._id,
      to: to,
      subject: subject,
      body: html || text,
      sentBy: from,
      sentByEmail: from,
      sentAt: now,
      status: "received",
      isReply: true,
      creator: "system",
      createdAt: now,
      updatedAt: now
    })

    console.log(JSON.stringify({ 
      stage: "email_record_saved", 
      studentId: student._id 
    }))

    return new Response(JSON.stringify({
      success: true,
      message: "Réponse enregistrée avec succès",
      studentId: student._id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error(JSON.stringify({ 
      stage: "error", 
      name: error.name,
      message: error.message, 
      stack: error.stack 
    }))

    return new Response(JSON.stringify({ 
      error: error.message || "Erreur lors du traitement de la réponse"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
