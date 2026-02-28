# Guide de Configuration Resend pour Envoi de Courriels

## Problème Actuel

❌ **Erreur Resend** : "You can only send testing emails to your own email address (marcfrancoisauger@gmail.com)"

En mode test, Resend limite l'envoi aux emails du propriétaire du compte uniquement.

---

## Solution : Vérifier un Domaine Personnalisé

### Étape 1 : Connexion à Resend
1. Accédez à : https://resend.com/domains
2. Connectez-vous avec votre compte Resend

### Étape 2 : Ajouter votre Domaine
1. Cliquez sur **"Add Domain"**
2. Entrez votre domaine (ex: `benado.org`)
3. Cliquez sur **"Add"**

### Étape 3 : Configuration DNS
Resend vous fournira des enregistrements DNS à ajouter :

**Exemple d'enregistrements à créer chez votre hébergeur DNS** :

```
Type: TXT
Name: _resend
Value: resend-domain-verify=xxxxxxxxxxxxx

Type: MX
Name: @
Priority: 10
Value: feedback-smtp.resend.com

Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

### Étape 4 : Vérification
1. Ajoutez ces enregistrements dans votre gestionnaire DNS (ex: Cloudflare, OVH, GoDaddy)
2. Attendez 24-48h pour la propagation DNS
3. Retournez sur Resend et cliquez sur **"Verify Domain"**
4. ✅ Status devrait passer à **"Verified"**

---

## Modification du Code (APRÈS vérification du domaine)

### Option 1 : Utiliser une Variable d'Environnement (Recommandé)

**1. Ajouter dans `.env` ou variables Deno** :
```env
RESEND_FROM_EMAIL=noreply@benado.org
```

**2. Modifier `functions/sendStudentEmail/index.ts`** :
```typescript
// Ligne 142-148 : Remplacer
const emailResult = await resend.emails.send({
  from: "Benado <onboarding@resend.dev>", // ❌ Email de test
  to: Array.isArray(to) ? to : [to],
  subject,
  html: body,
  replyTo: finalSentByEmail
})

// Par :
const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@benado.org"
const emailResult = await resend.emails.send({
  from: `Benado <${fromEmail}>`, // ✅ Email du domaine vérifié
  to: Array.isArray(to) ? to : [to],
  subject,
  html: body,
  replyTo: finalSentByEmail
})
```

### Option 2 : Hardcoder le Domaine Vérifié

**Modifier directement la ligne 143** :
```typescript
from: "Benado <noreply@benado.org>", // Remplacer par votre domaine vérifié
```

---

## Vérification Post-Configuration

### Test 1 : Envoi à un Email Externe
```bash
# Essayer d'envoyer un courriel à un parent/intervenant
# depuis l'interface de création de courriel
```

### Test 2 : Vérifier les Logs Deno
```bash
# Dans les logs de la fonction sendStudentEmail, vous devriez voir :
{
  "stage": "email_sent",
  "success": true,
  "emailId": "re_xxxxx"
}
```

### Test 3 : Vérifier sur Resend Dashboard
1. Allez sur https://resend.com/emails
2. Vous devriez voir les emails envoyés avec status **"Delivered"**

---

## Dépannage

### ❌ "Domain not verified"
- Attendez 24-48h pour la propagation DNS
- Vérifiez que tous les enregistrements DNS sont corrects
- Utilisez https://mxtoolbox.com/ pour vérifier vos enregistrements

### ❌ "SPF validation failed"
- Assurez-vous que l'enregistrement SPF est correct
- Format : `v=spf1 include:_spf.resend.com ~all`

### ❌ "DKIM not configured"
- Vérifiez l'enregistrement TXT `resend._domainkey`
- Copiez EXACTEMENT la valeur fournie par Resend

---

## Résumé des Actions

1. ✅ Vérifier un domaine sur https://resend.com/domains
2. ✅ Configurer les enregistrements DNS
3. ✅ Attendre la vérification (24-48h)
4. ✅ Modifier le code pour utiliser le domaine vérifié
5. ✅ Tester l'envoi de courriels

---

## Contact Support Resend

Si vous rencontrez des problèmes :
- Email : support@resend.com
- Documentation : https://resend.com/docs
- Discord : https://resend.com/discord
