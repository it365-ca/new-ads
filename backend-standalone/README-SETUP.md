# 🚀 Guide de configuration initiale - Backend Benado

## 📋 Prérequis

- Node.js 18+ installé
- MongoDB en cours d'exécution
- Variables d'environnement configurées (`.env`)

---

## ✅ Option 1 : Script Node.js (Ligne de commande)

### 1️⃣ Installation des dépendances

```bash
cd backend-standalone
npm install
```

### 2️⃣ Configuration `.env`

Créez le fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

Modifiez `.env` avec vos valeurs :

```env
MONGODB_URI=mongodb://localhost:27017/benado
MONGODB_USER=votre_user
MONGODB_PASSWORD=votre_password
JWT_SECRET=votre_secret_jwt_super_securise
PORT=4000
```

### 3️⃣ Créer le premier administrateur

```bash
node create-admin.js
```

**Résultat attendu :**

```
✅ ============================================
✅  ADMINISTRATEUR CRÉÉ AVEC SUCCÈS !
✅ ============================================

📧 Email: admin@benado.com
🔑 Mot de passe: Admin123!

⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !
```

### 4️⃣ Démarrer le serveur

```bash
npm run dev
```

### 5️⃣ Se connecter à l'application

1. Ouvrez votre navigateur sur l'application frontend
2. Connectez-vous avec :
   - **Email** : `admin@benado.com`
   - **Mot de passe** : `Admin123!`
3. ⚠️ Changez immédiatement le mot de passe !

---

## ✅ Option 2 : Interface web `/setup` (Sans terminal)

### 1️⃣ Démarrer le serveur backend

```bash
cd backend-standalone
npm install
npm run dev
```

### 2️⃣ Accéder à la page de configuration

Ouvrez votre navigateur sur :

```
http://localhost:3000/setup
```

### 3️⃣ Remplir le formulaire

- **Email** : `admin@benado.com`
- **Nom** : `Administrateur`
- **Prénom** : `Benado`
- **Mot de passe** : `Admin123!` (ou votre choix)
- **Téléphone** : (optionnel)
- **Spécialité** : `Administrateur système`

### 4️⃣ Cliquer sur "Créer l'administrateur"

La page vous redirigera automatiquement vers la connexion.

### 5️⃣ Se connecter

Utilisez les identifiants que vous venez de créer.

---

## 🔒 Sécurité - Changement du mot de passe

### Après la première connexion :

1. Allez dans **Profil** ou **Paramètres**
2. Cliquez sur **Changer le mot de passe**
3. Entrez un nouveau mot de passe fort

**Recommandations** :
- ✅ Au moins 12 caractères
- ✅ Majuscules + minuscules
- ✅ Chiffres + symboles
- ❌ Pas de mots du dictionnaire

---

## 🛠️ Dépannage

### ❌ Erreur : "Cet email existe déjà"

L'administrateur a déjà été créé. Options :

1. **Mot de passe oublié** : Utilisez la fonction "Mot de passe oublié" sur la page de connexion
2. **Suppression manuelle** : Connectez-vous à MongoDB et supprimez l'utilisateur

```javascript
// Dans mongosh
use benado
db.intervenants.deleteOne({ email: "admin@benado.com" })
```

### ❌ Erreur : "Cannot connect to MongoDB"

Vérifiez :
- MongoDB est démarré : `sudo systemctl status mongod`
- Les variables `MONGODB_URI`, `MONGODB_USER`, `MONGODB_PASSWORD` dans `.env`

### ❌ Erreur : "Port 4000 already in use"

Changez le port dans `.env` :

```env
PORT=5000
```

---

## 📞 Support

En cas de problème, contactez l'équipe technique Benado.

---

## 🎉 Prochaines étapes

Une fois connecté en tant qu'administrateur :

1. ✅ Changez votre mot de passe
2. ✅ Créez d'autres intervenants via **Gestion des utilisateurs**
3. ✅ Configurez les permissions
4. ✅ Commencez à utiliser l'application !
