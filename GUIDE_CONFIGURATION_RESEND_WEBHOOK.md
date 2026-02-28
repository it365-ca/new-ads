# 📬 Guide de Configuration - Réception de Courriels via Resend

## Vue d'ensemble

Ce système permet de recevoir automatiquement les réponses aux courriels envoyés et de les enregistrer dans le dossier de l'étudiant concerné.

## Architecture

```
Parent répond au courriel
        ↓
   Resend reçoit
        ↓
Webhook vers Deno Function
        ↓
Identification de l'étudiant (via sujet)
        ↓
Création automatique d'une note
        ↓
Enregistrement dans historique emails
```

## Étape 1 : Configuration du domaine Resend

### A. Configurer un domaine pour recevoir des emails

1. Aller sur le dashboard Resend : https://resend.com/domains
2. Cliquer sur "Add Domain"
3. Entrer votre domaine (ex: `benado.org`)
4. Suivre les instructions pour configurer les enregistrements DNS :
   - **MX** : Pour recevoir les emails
   - **TXT (SPF)** : Pour l'authentification
   - **TXT (DKIM)** : Pour la signature
   - **TXT (DMARC)** : Pour la politique

### B. Configuration DNS exemple

```
Type    Host                Value                           Priority
MX      @                   feedback-smtp.us-east-1...      10
TXT     @                   v=spf1 include:_spf.resend...   -
TXT     resend._domainkey   [clé DKIM fournie par Resend]   -
TXT     _dmarc              v=DMARC1; p=none; ...           -
```

⏱️ **Temps de propagation DNS** : 10 minutes à 24 heures

## Étape 2 : Configuration de l'Inbound Email dans Resend

### A. Activer la réception d'emails

1. Aller sur : https://resend.com/inbound
2. Cliquer sur "Create Inbound Route"
3. Configuration :
   - **Domain** : Sélectionner votre domaine (benado.org)
   - **Inbound Address** : `replies@benado.org` (ou autre adresse)
   - **Forward to** : Webhook URL (voir étape suivante)

### B. URL du webhook

Après le déploiement de la fonction Deno, utiliser cette URL :

```
https://api.lumi.new/v1/functions/p384255179950706688/receiveEmailReply
```

## Étape 3 : Configuration dans le code d'envoi

### A. Modifier l'adresse d'expédition

Dans `functions/sendStudentEmail/index.ts`, modifier la ligne 143 :

```typescript
// AVANT (adresse de test)
from: "Benado <onboarding@resend.dev>",

// APRÈS (votre domaine vérifié)
from: "Benado <noreply@benado.org>",
```

### B. Configuration du Reply-To

Le `replyTo` est déjà configuré dans `EmailModal.tsx` (ligne 109) :

```typescript
replyTo: finalReplyTo, // Email de l'intervenant sélectionné
```

**Important** : Assurez-vous que l'adresse `replyTo` est bien celle de votre domaine configuré.

## Étape 4 : Tester le système

### A. Envoyer un courriel test

1. Se connecter à l'application Benado
2. Ouvrir le dossier d'un étudiant
3. Cliquer sur "Envoyer un courriel"
4. Envoyer un message avec :
   - **De la part de** : Sélectionner un intervenant
   - **Destinataires** : Votre propre email pour tester
   - **Sujet** : "Test réception"
   - **Message** : "Ceci est un test"

### B. Répondre au courriel

1. Ouvrir votre boîte de réception
2. Cliquer sur "Répondre"
3. Écrire une réponse
4. Envoyer

### C. Vérifier la réception

1. Retourner dans le dossier de l'étudiant
2. Aller dans l'onglet "Notes"
3. Une nouvelle note devrait apparaître avec :
   - **Type** : "Courriel reçu"
   - **Auteur** : "Réponse de [email expéditeur]"
   - **Contenu** : Le texte de la réponse

## Étape 5 : Vérification des logs

### A. Logs de la fonction Deno

Pour voir les logs de traitement des emails reçus :

```bash
# Dans le terminal Lumi
lumi functions logs receiveEmailReply
```

### B. Logs Resend

1. Aller sur : https://resend.com/logs
2. Filtrer par "Inbound"
3. Vérifier que les emails sont bien reçus et transférés au webhook

## Fonctionnement détaillé

### 1. Identification de l'étudiant

Le système utilise le sujet du courriel pour identifier l'étudiant :

```
Sujet original : "[Jean Dupont] Demande de rendez-vous"
                     ↓
          Extraction du nom
                     ↓
        Recherche dans la base de données
                     ↓
           Étudiant trouvé
```

### 2. Création automatique de la note

La note créée contient :
- Date et heure de réception
- Expéditeur (email du parent/intervenant)
- Sujet complet
- Corps du message (HTML ou texte)

### 3. Enregistrement dans l'historique

Chaque réponse est également enregistrée dans la collection `emails` avec :
- `status: "received"` (pour différencier des emails envoyés)
- `isReply: true` (indique que c'est une réponse)

## Sécurité

### A. Validation de la signature Resend

Pour une sécurité maximale, vous pouvez valider la signature du webhook :

```typescript
// Dans receiveEmailReply/index.ts
const signature = req.headers.get("Resend-Signature")
const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET")

// Valider la signature avec la bibliothèque Resend
```

### B. Filtrage des emails

Le système ignore automatiquement :
- Les emails sans le format `[Nom Étudiant]` dans le sujet
- Les types de webhooks autres que `email.received`
- Les emails où l'étudiant n'est pas trouvé

## Dépannage

### Problème : Les réponses ne sont pas reçues

**Vérifications** :
1. ✅ Le domaine est-il vérifié dans Resend ?
2. ✅ Les enregistrements DNS sont-ils configurés ?
3. ✅ L'Inbound Route est-elle active ?
4. ✅ L'URL du webhook est-elle correcte ?
5. ✅ La fonction Deno est-elle déployée ?

### Problème : L'étudiant n'est pas trouvé

**Cause** : Le nom dans le sujet ne correspond pas exactement

**Solution** : 
- Vérifier que le sujet contient `[Prénom Nom]`
- S'assurer que l'orthographe est correcte

### Problème : Erreurs dans les logs

**Vérifier** :
```bash
# Logs de la fonction
lumi functions logs receiveEmailReply

# Vérifier la structure du webhook
# Les données doivent contenir: type, data.from, data.subject, etc.
```

## Configuration avancée

### A. Filtrage par expéditeur

Pour n'accepter que les réponses de certaines adresses :

```typescript
// Dans receiveEmailReply/index.ts
const allowedDomains = ["gmail.com", "outlook.com", "benado.org"]
const senderDomain = from.split("@")[1]

if (!allowedDomains.includes(senderDomain)) {
  console.log(JSON.stringify({ stage: "blocked_domain", from }))
  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
```

### B. Notification aux intervenants

Ajouter une notification lorsqu'une réponse est reçue :

```typescript
// Créer une notification pour l'intervenant
await lumi.entities.notifications.create({
  userId: intervenant._id,
  message: `Nouvelle réponse de ${from} pour ${studentName}`,
  lu: false,
  date: now
})
```

## Support

Pour toute question sur la configuration Resend :
- Documentation : https://resend.com/docs/send-with-nodejs
- Support : support@resend.com

Pour les questions sur Benado :
- Voir le code dans `functions/receiveEmailReply/index.ts`
- Vérifier les logs Deno Functions
