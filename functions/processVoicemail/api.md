# API Information - processVoicemail

## Function URL
```
https://api.lumi.new/v1/functions/p384255179950706688/processVoicemail
```

## Description
Traite automatiquement les messages vocaux du Grandstream UCM6204 :
1. Télécharge le fichier audio (.wav)
2. Transcrit avec OpenAI Whisper (français/québécois)
3. Recherche l'étudiant correspondant par numéro de téléphone
4. Crée une note de suivi automatique avec la transcription

## Headers
```json
{
  "Content-Type": "application/json"
}
```

## Request Body
```json
{
  "from": "+15141234567",
  "to": "+15147654321",
  "audioUrl": "https://votre-serveur.com/voicemail.wav",
  "duration": "45",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Paramètres :
- `from` (string, requis) : Numéro téléphone de l'appelant
- `to` (string) : Numéro appelé
- `audioUrl` (string, requis) : URL publique du fichier audio .wav
- `duration` (string, optionnel) : Durée en secondes
- `timestamp` (string, optionnel) : Date/heure du message

## Response Success (200)
```json
{
  "success": true,
  "transcription": "Bonjour, c'est Marie Tremblay, je voulais vous parler du rendez-vous de demain...",
  "student": {
    "id": "674a3b2c1f8d9e0012345678",
    "nom": "Alexandre Tremblay"
  },
  "note": {
    "id": "674a3b2c1f8d9e0098765432"
  },
  "message": "Message vocal transcrit et note créée"
}
```

## Response Error (500)
```json
{
  "success": false,
  "error": "OPENAI_API_KEY manquante"
}
```

## Configuration UCM6204

### Voicemail-to-Email
1. Connectez-vous à l'admin UCM6204
2. **Call Features → Voicemail → Voicemail to Email**
3. Activez l'envoi email avec fichier .wav attaché
4. Email destination : configurer un webhook email-to-webhook (SendGrid, Mailgun, etc.)

### Webhook Email Parser
Le parser email doit extraire :
- Numéro appelant (from)
- Fichier .wav attaché → upload vers URL publique
- Envoyer POST vers cette fonction avec le payload JSON

## Coûts estimés
- **OpenAI Whisper** : 0,006$/minute
- **Exemple** : 50 messages/mois × 2 min = ~0,60$/mois

## Notes de suivi générées
Format automatique :
```
📞 **Message vocal reçu**

**De:** +15141234567
**Durée:** 45 secondes
**Date:** 15/01/2025 10:30

**Transcription:**
[Texte transcrit ici...]

_Note générée automatiquement par le système de boîte vocale_
```

## Usage Example (cURL)
```bash
curl -X POST "https://api.lumi.new/v1/functions/p384255179950706688/processVoicemail" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+15141234567",
    "to": "+15147654321",
    "audioUrl": "https://votre-serveur.com/voicemail.wav",
    "duration": "45"
  }'
```

## Logs de débogage
La fonction génère des logs JSON structurés :
- `transcription_start` : Début de transcription
- `audio_downloaded` : Audio téléchargé
- `external_request` : Appel Whisper API
- `external_response` : Réponse Whisper
- `search_student` : Recherche étudiant
- `student_found` / `student_not_found` : Résultat recherche
- `create_note` : Création note
- `response` : Réponse finale
