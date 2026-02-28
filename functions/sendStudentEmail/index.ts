import { createClient } from "@lumi.new/sdk"
import { Resend } from "npm:resend@4.0.0"

Deno.serve(async (req) => {
  console.log(JSON.stringify({ 
    stage: "start", 
    method: req.method, 
    url: req.url,
    timestamp: new Date().toISOString()
  }))

  // CORS préflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    })
  }

  try {
    // 1. Vérification Authorization header
    const authorization = req.headers.get("Authorization")
    console.log(JSON.stringify({ 
      stage: "auth_check", 
      hasAuth: !!authorization,
      authType: authorization ? authorization.split(' ')[0] : 'none'
    }))

    if (!authorization) {
      console.error(JSON.stringify({ stage: "error", message: "Missing Authorization header" }))
      return new Response(JSON.stringify({ error: "Authorization requise" }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        }
      })
    }

    // 2. Parse body
    const bodyData = await req.json()
    console.log(JSON.stringify({ 
      stage: "body_parsed", 
      hasEnrollmentId: !!bodyData.enrollmentId,
      hasTo: !!bodyData.to,
      hasSubject: !!bodyData.subject,
      hasBody: !!bodyData.body
    }))

    const { enrollmentId, to, subject, body, sentBy, sentByEmail, replyTo, senderName } = bodyData

    // 3. Validation des champs requis
    if (!enrollmentId || !to || !subject || !body) {
      console.error(JSON.stringify({ 
        stage: "validation_error", 
        missing: {
          enrollmentId: !enrollmentId,
          to: !to,
          subject: !subject,
          body: !body
        }
      }))
      return new Response(JSON.stringify({ error: "Champs requis manquants" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        }
      })
    }

    // 4. Initialisation Lumi SDK
    const projectId = "p384255179950706688"
    const apiBaseUrl = "https://api.lumi.new"
    const authOrigin = "https://lumi.new"
    
    console.log(JSON.stringify({ 
      stage: "sdk_init", 
      hasProjectId: !!projectId,
      hasApiBaseUrl: !!apiBaseUrl,
      hasAuthOrigin: !!authOrigin
    }))

    const lumi = createClient({ 
      projectId, 
      apiBaseUrl,
      authOrigin,
      authorization 
    })

    // 5. Récupération utilisateur courant
    let currentUser
    try {
      currentUser = await lumi.auth.refreshUser()
      console.log(JSON.stringify({ 
        stage: "user_retrieved", 
        hasUser: !!currentUser,
        email: currentUser?.email
      }))
    } catch (userError: any) {
      console.error(JSON.stringify({ 
        stage: "user_error", 
        message: userError.message 
      }))
    }

    const finalSentBy = senderName || sentBy || (currentUser ? `${currentUser.userName || currentUser.email}` : "Système")
    const finalSentByEmail = sentByEmail || currentUser?.email || "system@benado.org"
    const finalReplyTo = replyTo || finalSentByEmail

    console.log(JSON.stringify({ 
      stage: "sender_info", 
      sentBy: finalSentBy,
      sentByEmail: finalSentByEmail
    }))

    // 6. Vérification RESEND_API_KEY
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    if (!resendApiKey) {
      console.error(JSON.stringify({ stage: "config_error", message: "RESEND_API_KEY non configuré" }))
      return new Response(JSON.stringify({ error: "Configuration email manquante" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        }
      })
    }

    // 7. Envoi email via Resend
    const resend = new Resend(resendApiKey)
    // Formater le From avec le nom de l'intervenante
    // IMPORTANT: Changez 'onboarding@resend.dev' par votre domaine vérifié (ex: noreply@benado.org)
    const fromHeader = `${finalSentBy} via Benado <onboarding@resend.dev>`
    
    console.log(JSON.stringify({ 
      stage: "sending_email", 
      to,
      subject,
      from: fromHeader,
      replyTo: finalReplyTo
    }))

    const emailResult = await resend.emails.send({
      from: fromHeader,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: body,
      replyTo: finalReplyTo
    })

    console.log(JSON.stringify({ 
      stage: "email_sent", 
      success: !!emailResult.data?.id,
      emailId: emailResult.data?.id,
      error: emailResult.error
    }))

    if (emailResult.error) {
      throw new Error(`Resend error: ${emailResult.error.message}`)
    }

    // 8. Sauvegarde dans historique emails
    const now = new Date().toISOString()
    console.log(JSON.stringify({ stage: "saving_email_record" }))

    const emailRecord = await lumi.entities.emails.create({
      enrollmentId,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      body,
      sentBy: finalSentBy,
      sentByEmail: finalSentByEmail,
      sentAt: now,
      status: "sent",
      creator: finalSentByEmail,
      createdAt: now,
      updatedAt: now
    })

    console.log(JSON.stringify({ 
      stage: "email_saved", 
      recordId: emailRecord._id 
    }))

    // 9. Réponse succès
    console.log(JSON.stringify({ 
      stage: "success", 
      emailId: emailRecord._id 
    }))

    return new Response(JSON.stringify({
      success: true,
      emailId: emailRecord._id,
      resendId: emailResult.data?.id,
      message: "Courriel envoyé avec succès"
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      }
    })

  } catch (error: any) {
    console.error(JSON.stringify({ 
      stage: "error", 
      name: error.name,
      message: error.message, 
      stack: error.stack 
    }))

    return new Response(JSON.stringify({ 
      error: error.message || "Erreur lors de l'envoi du courriel"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      }
    })
  }
})
