const functionName = "notifyNewEnrollment"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface EnrollmentData {
  nom: string
  prenom: string
  dateNaissance: string
  age: string
  programme: string
  dateEntree: string
  ecoleReferente: string
  parent1Nom: string
  parent1Email: string
  parent1Tel: string
  motifReference: string
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405)
    }

    const body = await req.json() as { enrollment: EnrollmentData }
    console.log(JSON.stringify({ stage: "start", functionName, method: req.method }))

    // Validation des variables d'environnement
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    const fromEmail = "onboarding@resend.dev"  // Email par défaut Resend (vérifié)
    const toEmail = "marcfrancoisauger@gmail.com"  // Votre email pour mode test Resend

    if (!resendApiKey) {
      console.error(JSON.stringify({ 
        stage: "config_error", 
        functionName,
        missing: { resendApiKey: !resendApiKey }
      }))
      return jsonResponse({ 
        error: "Service configuration error: Missing Resend API key" 
      }, 500)
    }

    console.log(JSON.stringify({ 
      stage: "config", 
      functionName,
      resend: { configured: true, from: fromEmail, to: toEmail }
    }))

    const enrollment = body.enrollment

    // Création du contenu email HTML
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
    .section h2 { color: #2563eb; margin-top: 0; font-size: 18px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: bold; color: #4b5563; }
    .info-value { color: #1f2937; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Nouvelle inscription en attente</h1>
    </div>
    
    <div class="content">
      <div class="alert">
        <strong>⚠️ Action requise :</strong> Une nouvelle demande d'inscription nécessite votre révision
      </div>

      <div class="section">
        <h2>Informations de l'élève</h2>
        <div class="info-row">
          <span class="info-label">Nom complet :</span>
          <span class="info-value">${enrollment.prenom} ${enrollment.nom}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date de naissance :</span>
          <span class="info-value">${enrollment.dateNaissance} (${enrollment.age} ans)</span>
        </div>
        <div class="info-row">
          <span class="info-label">École référente :</span>
          <span class="info-value">${enrollment.ecoleReferente}</span>
        </div>
      </div>

      <div class="section">
        <h2>Programme demandé</h2>
        <div class="info-row">
          <span class="info-label">Programme :</span>
          <span class="info-value">${enrollment.programme}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date d'entrée :</span>
          <span class="info-value">${enrollment.dateEntree}</span>
        </div>
      </div>

      <div class="section">
        <h2>Contact parent/tuteur</h2>
        <div class="info-row">
          <span class="info-label">Nom :</span>
          <span class="info-value">${enrollment.parent1Nom}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Téléphone :</span>
          <span class="info-value">${enrollment.parent1Tel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email :</span>
          <span class="info-value">${enrollment.parent1Email}</span>
        </div>
      </div>

      <div class="section">
        <h2>Motif de référence</h2>
        <p style="margin: 0; padding: 10px; background: #f3f4f6; border-radius: 4px;">
          ${enrollment.motifReference}
        </p>
      </div>

      <div class="footer">
        <p>Cet email a été généré automatiquement par le système d'inscription Benado</p>
        <p>Veuillez vous connecter au tableau de bord pour réviser cette demande</p>
      </div>
    </div>
  </div>
</body>
</html>
    `

    // Envoi de l'email via Resend API
    console.log(JSON.stringify({ 
      stage: "sending_email", 
      functionName,
      to: toEmail,
      subject: `Nouvelle inscription: ${enrollment.prenom} ${enrollment.nom}`
    }))

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: `🔔 Nouvelle inscription en attente: ${enrollment.prenom} ${enrollment.nom}`,
          html: emailContent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Resend API Error: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      
      console.log(JSON.stringify({ 
        stage: "email_sent", 
        functionName,
        message: "Resend email sent successfully",
        emailId: result.id
      }))
    } catch (apiError: any) {
      console.error(JSON.stringify({ 
        stage: "resend_error", 
        functionName,
        error: apiError.message,
        stack: apiError.stack
      }))
      throw new Error(`Resend Error: ${apiError.message}`)
    }

    console.log(JSON.stringify({ 
      stage: "success", 
      functionName,
      message: "Email sent successfully"
    }))

    return jsonResponse({ 
      success: true, 
      message: "Notification email envoyée avec succès" 
    })

  } catch (error: any) {
    console.error(JSON.stringify({ 
      stage: "error", 
      functionName,
      message: error.message,
      stack: error.stack
    }))

    return jsonResponse({ 
      error: error.message ?? "Internal server error" 
    }, 500)
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

await Deno.serve(handler)
