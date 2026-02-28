import { createClient } from "https://esm.sh/@lumi.new/sdk@0.3.3"

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const { intervenantId, email, nom, prenom } = await req.json()

    if (!intervenantId || !email || !nom || !prenom) {
      return new Response(JSON.stringify({ 
        error: "intervenantId, email, nom et prenom requis" 
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

    // Générer un token unique
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours

    // Créer le token d'invitation
    await lumi.entities.invitationTokens.create({
      email,
      token,
      intervenantId,
      expiresAt,
      createdAt: new Date().toISOString(),
      used: false
    })

    // Construire le lien d'inscription
    const authOrigin = Deno.env.get("AUTH_ORIGIN") || ""
    const invitationLink = `${authOrigin}/complete-registration?token=${token}`

    // Envoyer l'email
    await lumi.tools.email.send({
      to: email,
      subject: "🎉 Bienvenue chez Benado - Complétez votre inscription",
      fromName: "Équipe Benado",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bienvenue chez Benado !</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
              
              <p>Votre compte intervenant a été créé avec succès ! Pour finaliser votre inscription, veuillez définir votre mot de passe en cliquant sur le bouton ci-dessous :</p>
              
              <div style="text-align: center;">
                <a href="${invitationLink}" class="button">📝 Définir mon mot de passe</a>
              </div>
              
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="background: #e0e0e0; padding: 10px; border-radius: 5px; word-break: break-all;">
                ${invitationLink}
              </p>
              
              <p><strong>⚠️ Important :</strong> Ce lien est valide pendant <strong>7 jours</strong>. Après cette période, vous devrez demander un nouveau lien à votre administrateur.</p>
              
              <p>Une fois votre mot de passe défini, vous pourrez accéder à la plateforme avec votre email : <strong>${email}</strong></p>
              
              <div class="footer">
                <p>Cet email a été envoyé automatiquement par la plateforme Benado.</p>
                <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    })

    return new Response(JSON.stringify({ 
      success: true,
      message: "Email d'invitation envoyé avec succès"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Erreur sendInvitation:", error)
    return new Response(JSON.stringify({ 
      error: "Erreur lors de l'envoi de l'invitation" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})