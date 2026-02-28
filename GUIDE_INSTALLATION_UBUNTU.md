# 🚀 Guide d'Installation Benado - Ubuntu 22.04 LTS
## ✅ Configuration Testée et Fonctionnelle

---

## 📋 Prérequis

- **Serveur Ubuntu 22.04 LTS** (VPS, VM Proxmox, ou dédié)
- **Minimum**: 2 CPU, 4GB RAM, 50GB disque
- **Accès root** ou utilisateur avec sudo
- **Domaine configuré** (optionnel pour SSL)

---

## 🎯 ÉTAPE 1: Préparation du Système

### 1.1 Connexion SSH

```bash
ssh root@VOTRE_IP_SERVEUR
# Ou avec utilisateur sudo:
ssh utilisateur@VOTRE_IP_SERVEUR
sudo su -
```

### 1.2 Mise à Jour Système

```bash
# Mise à jour complète
apt update && apt upgrade -y

# Installer outils essentiels
apt install -y curl wget git nano ufw net-tools

# Configurer le hostname
hostnamectl set-hostname benado-app
```

### 1.3 Configurer le Firewall (UFW)

```bash
# Activer UFW
ufw --force enable

# Autoriser SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Vérifier
ufw status
```

**✅ Système préparé!**

---

## 🎯 ÉTAPE 2: Installation MongoDB

### 2.1 Importer la Clé GPG

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
  gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg
```

### 2.2 Ajouter le Repository

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | \
tee /etc/apt/sources.list.d/mongodb-org-6.0.list
```

### 2.3 Installer MongoDB

```bash
apt update
apt install -y mongodb-org

# Démarrer MongoDB
systemctl start mongod
systemctl enable mongod

# Vérifier le statut
systemctl status mongod
```

**✅ MongoDB doit être "active (running)"**

### 2.4 Créer l'Utilisateur et la Base de Données

```bash
# Se connecter à MongoDB
mongosh
```

**Dans le shell MongoDB, exécuter:**

```javascript
// Créer la base de données
use benado

// Créer l'utilisateur admin
db.createUser({
  user: "benado_admin",
  pwd: "MotDePasseSecurise123!",
  roles: [
    { role: "readWrite", db: "benado" },
    { role: "dbAdmin", db: "benado" }
  ]
})

// Quitter
exit
```

### 2.5 Activer l'Authentification

```bash
# Éditer la configuration
nano /etc/mongod.conf
```

**Modifier ces sections:**

```yaml
security:
  authorization: enabled

net:
  port: 27017
  bindIp: 127.0.0.1
```

**Sauvegarder: CTRL+X → Y → ENTER**

```bash
# Redémarrer MongoDB
systemctl restart mongod

# Tester la connexion
mongosh -u benado_admin -p MotDePasseSecurise123! --authenticationDatabase benado
```

**Si connexion OK → ✅ MongoDB configuré!**

---

## 🎯 ÉTAPE 3: Installation Node.js 18

### 3.1 Installer Node.js via NodeSource

```bash
# Ajouter le repository NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Installer Node.js
apt install -y nodejs

# Vérifier les versions
node --version   # Doit afficher v18.x.x
npm --version    # Doit afficher 9.x.x
```

### 3.2 Installer PM2 (Gestionnaire de Processus)

```bash
npm install -g pm2

# Vérifier
pm2 --version
```

**✅ Node.js 18 installé!**

---

## 🎯 ÉTAPE 4: Installation du Backend

### 4.1 Créer le Dossier Backend

```bash
mkdir -p /var/www/benado-backend
cd /var/www/benado-backend
```

### 4.2 Upload des Fichiers

**Option A: Depuis votre PC via SCP**

```bash
# Sur votre PC, dans le dossier backend-standalone
tar -czf backend.tar.gz src/ package.json tsconfig.json create-admin.js README-SETUP.md

# Upload vers le serveur
scp backend.tar.gz root@VOTRE_IP:/var/www/benado-backend/

# Sur le serveur, extraire
cd /var/www/benado-backend
tar -xzf backend.tar.gz
rm backend.tar.gz
```

**Option B: Via Git (si vous avez un repository)**

```bash
git clone https://github.com/votre-repo/benado-backend.git /var/www/benado-backend
cd /var/www/benado-backend
```

### 4.3 Créer le Fichier .env

```bash
nano /var/www/benado-backend/.env
```

**Copier cette configuration (MODIFIER LES VALEURS):**

```env
# Serveur
NODE_ENV=production
PORT=4000
API_URL=https://api.votre-domaine.com
FRONTEND_URL=https://app.votre-domaine.com

# MongoDB
MONGODB_URI=mongodb://localhost:27017/benado
MONGODB_USER=benado_admin
MONGODB_PASSWORD=MotDePasseSecurise123!

# JWT Secret (générer une clé aléatoire ci-dessous)
JWT_SECRET=REMPLACER_PAR_CLE_ALEATOIRE_32_CARACTERES
JWT_EXPIRES_IN=7d

# Email SMTP (exemple Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_app
SMTP_FROM=noreply@votre-domaine.com

# Upload
UPLOAD_DIR=/var/www/benado-backend/uploads
MAX_FILE_SIZE=10485760
```

**Sauvegarder: CTRL+X → Y → ENTER**

### 🔐 Générer une Clé JWT Sécurisée

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copier le résultat et le mettre dans `JWT_SECRET=` du fichier .env**

### 4.4 Installer les Dépendances

```bash
cd /var/www/benado-backend
npm install
```

**⏱️ Attendre l'installation (2-3 min)**

### 4.5 Créer le Dossier Uploads

```bash
mkdir -p /var/www/benado-backend/uploads
chmod 755 /var/www/benado-backend/uploads
```

### 4.6 Compiler TypeScript

```bash
npm run build
```

**✅ Vérifier que le dossier `dist/` est créé**

```bash
ls -la dist/
# Vous devez voir: server.js
```

### 4.7 Créer le Premier Administrateur

```bash
node create-admin.js
```

**📝 Notez les identifiants affichés:**
- **Email**: admin@benado.com
- **Mot de passe**: Admin123!

### 4.8 Tester le Backend Manuellement

```bash
# Démarrer en mode test
node dist/server.js
```

**Vous devez voir:**
```
✅ Connecté à MongoDB
🚀 Serveur démarré sur le port 4000
```

**Ouvrir un NOUVEAU terminal et tester:**

```bash
curl http://localhost:4000/health
```

**Réponse attendue:**
```json
{"status":"ok","timestamp":"2025-01-XX..."}
```

**Si OK → CTRL+C pour arrêter le serveur**

### 4.9 Démarrer avec PM2

```bash
# Démarrer le backend
pm2 start dist/server.js --name benado-backend

# Sauvegarder la config
pm2 save

# Démarrage automatique au boot
pm2 startup
# Exécuter la commande affichée (copier-coller)
```

### 4.10 Vérifier les Logs

```bash
# Voir les logs en temps réel
pm2 logs benado-backend

# Voir le statut
pm2 status
```

**✅ Backend démarré et fonctionnel!**

---

## 🎯 ÉTAPE 5: Installation du Frontend

### 5.1 Préparer le Build (Sur votre PC)

```bash
# Dans le dossier principal du projet
cd /chemin/vers/votre-projet

# Créer .env.production
nano .env.production
```

**Contenu:**

```env
VITE_API_URL=https://api.votre-domaine.com/api
```

**Sauvegarder: CTRL+X → Y → ENTER**

### 5.2 Build du Frontend

```bash
# Installer les dépendances
npm install

# Build de production
npm run build
```

**✅ Le dossier `dist/` est créé**

### 5.3 Upload sur le Serveur

```bash
# Sur votre PC, dans le dossier dist/
cd dist
tar -czf frontend.tar.gz *

# Upload vers le serveur
scp frontend.tar.gz root@VOTRE_IP:/tmp/
```

### 5.4 Déployer sur le Serveur

```bash
# Sur le serveur
mkdir -p /var/www/benado-frontend
cd /var/www/benado-frontend

# Extraire
tar -xzf /tmp/frontend.tar.gz

# Nettoyer
rm /tmp/frontend.tar.gz
```

**✅ Frontend uploadé!**

---

## 🎯 ÉTAPE 6: Configuration Nginx

### 6.1 Installer Nginx

```bash
apt install -y nginx

# Démarrer et activer
systemctl start nginx
systemctl enable nginx

# Vérifier
systemctl status nginx
```

### 6.2 Créer la Configuration

```bash
nano /etc/nginx/sites-available/benado
```

**Copier cette configuration:**

```nginx
# Backend API
server {
    listen 80;
    server_name api.votre-domaine.com;

    access_log /var/log/nginx/benado-api-access.log;
    error_log /var/log/nginx/benado-api-error.log;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name app.votre-domaine.com;
    root /var/www/benado-frontend;
    index index.html;

    access_log /var/log/nginx/benado-app-access.log;
    error_log /var/log/nginx/benado-app-error.log;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache des assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**⚠️ REMPLACER `votre-domaine.com` par votre vrai domaine!**

**Sauvegarder: CTRL+X → Y → ENTER**

### 6.3 Activer le Site

```bash
# Créer le lien symbolique
ln -s /etc/nginx/sites-available/benado /etc/nginx/sites-enabled/

# Supprimer le site par défaut
rm /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t

# Si OK, recharger
systemctl reload nginx
```

**✅ Nginx configuré!**

---

## 🎯 ÉTAPE 7: SSL avec Certbot (Optionnel mais Recommandé)

### 7.1 Installer Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 7.2 Obtenir les Certificats

```bash
certbot --nginx -d app.votre-domaine.com -d api.votre-domaine.com
```

**Suivre les instructions:**
1. Email: votre@email.com
2. Conditions: `Y`
3. Partage email: `N`
4. Redirect HTTP → HTTPS: **2** (Oui)

### 7.3 Renouvellement Automatique

```bash
# Tester le renouvellement
certbot renew --dry-run
```

**Le renouvellement automatique est déjà configuré via systemd timer**

**✅ SSL configuré!**

---

## 🎯 ÉTAPE 8: Vérification Finale

### 8.1 Vérifier Tous les Services

```bash
# MongoDB
systemctl status mongod

# Backend PM2
pm2 status

# Nginx
systemctl status nginx
```

**Tous doivent être "active (running)"**

### 8.2 Tester les Endpoints

```bash
# Health check backend
curl http://localhost:4000/health

# API via Nginx (remplacer par votre domaine)
curl http://api.votre-domaine.com/health
```

### 8.3 Accéder à l'Application

**Ouvrir dans le navigateur:**
- Frontend: `https://app.votre-domaine.com`
- API: `https://api.votre-domaine.com/health`

**Identifiants admin:**
- Email: `admin@benado.com`
- Mot de passe: `Admin123!`

**⚠️ CHANGEZ CE MOT DE PASSE IMMÉDIATEMENT!**

---

## 🛠️ Maintenance et Commandes Utiles

### Gestion Backend

```bash
# Voir les logs
pm2 logs benado-backend

# Redémarrer
pm2 restart benado-backend

# Arrêter
pm2 stop benado-backend

# Monitoring temps réel
pm2 monit
```

### Gestion MongoDB

```bash
# Statut
systemctl status mongod

# Redémarrer
systemctl restart mongod

# Logs
tail -f /var/log/mongodb/mongod.log

# Connexion shell
mongosh -u benado_admin -p MotDePasseSecurise123! --authenticationDatabase benado
```

### Gestion Nginx

```bash
# Tester config
nginx -t

# Recharger
systemctl reload nginx

# Redémarrer
systemctl restart nginx

# Logs
tail -f /var/log/nginx/benado-api-error.log
tail -f /var/log/nginx/benado-app-error.log
```

### Mise à Jour du Code

```bash
# Backend
cd /var/www/benado-backend
git pull  # ou upload des nouveaux fichiers
npm install
npm run build
pm2 restart benado-backend

# Frontend
cd /var/www/benado-frontend
# Upload le nouveau dist/ depuis votre PC
tar -xzf /tmp/frontend.tar.gz
```

---

## 🆘 Dépannage

### Erreur "Cannot connect to MongoDB"

```bash
# Vérifier MongoDB
systemctl status mongod
mongosh -u benado_admin -p --authenticationDatabase benado

# Vérifier les logs
tail -50 /var/log/mongodb/mongod.log

# Redémarrer
systemctl restart mongod
```

### Erreur "502 Bad Gateway"

```bash
# Vérifier backend
pm2 status
pm2 logs benado-backend

# Vérifier port 4000
netstat -tlnp | grep 4000

# Redémarrer
pm2 restart benado-backend
```

### Backend ne démarre pas

```bash
# Voir les erreurs
pm2 logs benado-backend --err

# Vérifier .env
cat /var/www/benado-backend/.env

# Tester manuellement
cd /var/www/benado-backend
node dist/server.js
```

### Frontend 404

```bash
# Vérifier les fichiers
ls -la /var/www/benado-frontend/

# Vérifier Nginx
nginx -t
tail -50 /var/log/nginx/benado-app-error.log
```

---

## 📊 Backup Automatique MongoDB

### Créer le Script

```bash
nano /root/backup-mongo.sh
```

**Contenu:**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mongodump --db benado \
  --username benado_admin \
  --password MotDePasseSecurise123! \
  --out $BACKUP_DIR/$DATE

tar -czf $BACKUP_DIR/benado-$DATE.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

# Garder 7 derniers jours
find $BACKUP_DIR -type f -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup: benado-$DATE.tar.gz"
```

**Rendre exécutable:**

```bash
chmod +x /root/backup-mongo.sh
```

### Automatiser avec Cron

```bash
crontab -e
```

**Ajouter (backup quotidien à 2h):**

```
0 2 * * * /root/backup-mongo.sh >> /var/log/mongodb-backup.log 2>&1
```

---

## 🎉 Installation Terminée!

### ✅ Checklist Finale

- [ ] MongoDB installé et sécurisé
- [ ] Backend démarré avec PM2
- [ ] Frontend déployé
- [ ] Nginx configuré
- [ ] SSL activé (optionnel)
- [ ] Backup automatique configuré
- [ ] Firewall (UFW) actif
- [ ] Identifiants admin notés

### 🔗 Accès

- **Frontend**: https://app.votre-domaine.com
- **API**: https://api.votre-domaine.com
- **Admin**: admin@benado.com / Admin123!

---

**Document créé le:** 2025-01-27  
**Version:** 2.0.0 - Ubuntu 22.04 LTS  
**Application:** Benado Backend Standalone  
**Stack:** MongoDB + Express + React + Node.js 18
