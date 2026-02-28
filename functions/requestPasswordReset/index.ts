import { Resend } from "npm:resend@4.0.0"
import { createClient } from "@lumi.new/sdk"

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: "Email requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Utiliser SDK Lumi comme dans loginCustom
    const lumi = createClient({
      projectId: "p384255179950706688",
      apiBaseUrl: "https://api.lumi.new",
      authOrigin: ""
    })

    // Chercher l'intervenant
    const result = await lumi.entities.intervenants.list({
      filter: { email },
      limit: 1
    })

    if (!result.list || result.list.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Aucun compte trouvé avec cet email" 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

    const intervenant = result.list[0]

    // Générer token
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    // Sauvegarder le token
    await lumi.entities.passwordResetTokens.create({
      email: intervenant.email,
      token: token,
      expiresAt: expiresAt.toISOString(),
      used: false,
      createdAt: new Date().toISOString()
    })

    // Envoyer email via Resend
    const resetUrl = `${req.headers.get("Origin") || "https://p384255179950706688.project.lumi.dev"}/reset-password?token=${token}`
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured")
    }

    const resend = new Resend(resendApiKey)
    const testEmail = "marcfrancoisauger@gmail.com"

    const { error } = await resend.emails.send({
      from: "Benado <onboarding@resend.dev>",
      to: [testEmail],
      subject: "Réinitialisation de votre mot de passe",
      html: `<p><strong>[MODE TEST - Destinataire réel: ${email}]</strong></p>
<p>Bonjour ${intervenant.prenom} ${intervenant.nom},</p>
<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
<p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Ce lien expirera dans 1 heure.</p>
<p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
<p>-- <br/>Benado</p>`,
    })

    if (error) {
      throw new Error("Email send failed: " + JSON.stringify(error))
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Un email de réinitialisation a été envoyé"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error("Error:", error.message)
    return new Response(JSON.stringify({ 
      error: "Erreur lors de l'envoi de l'email" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
