# 🔧 Configuration du domaine Resend pour envoi de courriels

## ⚠️ Problème actuel

Vous recevez cette erreur :
```
Resend error: You can only send testing emails to your own email address (marcfrancoisauger@gmail.com)
```

**Raison** : Resend en mode test ne permet d'envoyer des courriels qu'à l'adresse email du propriétaire du compte. Pour envoyer à d'autres destinataires (parents, directrice, intervenants), vous devez **vérifier un domaine**.

---

## ✅ Solution : Vérifier un domaine sur Resend

### Étape 1 : Accéder à la configuration des domaines
1. Connectez-vous à votre compte Resend : https://resend.com/
2. Allez dans **Domains** : https://resend.com/domains
3. Cliquez sur **Add Domain**

### Étape 2 : Ajouter votre domaine
1. Entrez votre nom de domaine (ex: `benado.org`)
2. Cliquez sur **Add**
3. Resend vous donnera des enregistrements DNS à configurer

### Étape 3 : Configurer les enregistrements DNS
Chez votre hébergeur (ex: HestiaCP, cPanel, Cloudflare), ajoutez ces enregistrements DNS :

**Enregistrements typiques Resend** :
- **Type TXT** : `_resend` → valeur fournie par Resend
- **Type MX** : pour la réception (optionnel si vous voulez recevoir)
- **Type CNAME** : pour DKIM (signature email)

**Exemple dans HestiaCP** :
1. Allez dans **DNS** → Votre domaine
2. Ajoutez un enregistrement **TXT**
   - Nom : `_resend`
   - Valeur : (copiez depuis Resend)
3. Sauvegardez

### Étape 4 : Vérifier le domaine
1. Retournez sur Resend
2. Cliquez sur **Verify Domain**
3. Attendez quelques minutes (propagation DNS)
4. Statut devrait passer à ✅ **Verified**

---

## 🔄 Mise à jour du code après vérification

### Option 1 : Modifier le code manuellement

Une fois votre domaine vérifié (ex: `benado.org`), modifiez le fichier :

**`functions/sendStudentEmail/index.ts`** — Ligne 137 :

```typescript
// ❌ AVANT (mode test)
const fromHeader = `${finalSentBy} via Benado <onboarding@resend.dev>`

// ✅ APRÈS (domaine vérifié)
const fromHeader = `${finalSentBy} <noreply@benado.org>`
// OU
const fromHeader = `Benado - ${finalSentBy} <notifications@benado.org>`
```

### Option 2 : Utiliser une variable d'environnement

**Méthode recommandée** pour faciliter les changements :

1. Ajoutez une variable d'environnement `SMTP_FROM` :
   ```
   SMTP_FROM=noreply@benado.org
   ```

2. Modifiez le code :
   ```typescript
   const smtpFrom = Deno.env.get("SMTP_FROM") || "onboarding@resend.dev"
   const fromHeader = `${finalSentBy} <${smtpFrom}>`
   ```

---

## 🧪 Test après configuration

1. Vérifiez que votre domaine est ✅ **Verified** sur Resend
2. Mettez à jour le code (Option 1 ou 2)
3. Redéployez la fonction Deno (automatique)
4. Essayez d'envoyer un courriel à un parent/intervenant
5. ✅ Le courriel devrait être envoyé sans erreur

---

## 📧 Adresses email recommandées

Avec votre domaine vérifié, vous pouvez utiliser :

- `noreply@benado.org` — Pour les notifications automatiques
- `notifications@benado.org` — Pour les courriels système
- `admin@benado.org` — Pour la direction
- `info@benado.org` — Pour les contacts généraux

**Important** : Le champ `replyTo` reste configuré avec l'email de l'intervenante, donc les réponses iront bien à la bonne personne.

---

## 🔍 Vérification du statut actuel

Pour vérifier si votre domaine est déjà configuré :
1. Allez sur https://resend.com/domains
2. Cherchez votre domaine
3. Statut devrait être **Verified** ✅

Si vous voyez **Pending** ⏳ : les enregistrements DNS ne sont pas encore propagés ou incorrects.

---

## ❓ Besoin d'aide ?

Si vous avez des difficultés avec la configuration DNS ou la vérification du domaine, contactez le support Resend ou vérifiez la documentation officielle : https://resend.com/docs/dashboard/domains/introduction
