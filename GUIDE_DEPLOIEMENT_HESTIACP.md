# 🚀 Guide d'Installation Benado sur HestiaCP

## 📋 Vue d'ensemble

**HestiaCP** est un panneau de contrôle web qui facilite la gestion de votre serveur. Ce guide vous montre comment installer l'application Benado en utilisant HestiaCP pour la gestion du système tout en configurant Node.js et MongoDB manuellement.

---

## ✅ Prérequis

- Serveur Ubuntu 20.04/22.04 ou Debian 11/12 (physique ou VM)
- Minimum : 4GB RAM, 2 CPU, 50GB disque
- Accès root SSH
- Nom de domaine configuré (ex: `benado.com`)

---

## 📦 Étape 1 : Installation HestiaCP

### 1.1 Connexion SSH au serveur

```bash
ssh root@VOTRE_IP_SERVEUR
```

### 1.2 Installation HestiaCP

```bash
# Télécharger et lancer l'installateur
wget https://raw.githubusercontent.com/hestiacp/hestiacp/release/install/hst-install.sh

# Rendre exécutable
chmod +x hst-install.sh

# Lancer l'installation (mode interactif)
./hst-install.sh
```

**Configuration recommandée lors de l'installation :**
- Email : votre@email.com
- Hostname : benado.com (votre domaine)
- Admin Password : mot de passe fort
- Options :
  - ✅ Nginx
  - ✅ Apache (backend)
  - ✅ PHP
  - ✅ MySQL (optionnel, MongoDB sera installé séparément)
  - ❌ phpMyAdmin (optionnel)
  - ✅ Firewall
  - ✅ Let's Encrypt

**⏱️ Installation : 15-20 minutes**

### 1.3 Premier Accès HestiaCP

Une fois l'installation terminée :

```
🔗 URL : https://VOTRE_IP:8083
👤 Utilisateur : admin
🔑 Mot de passe : (celui défini durant l'installation)
```

**📝 NOTEZ ces informations !**

---

## 🗄️ Étape 2 : Installation MongoDB

HestiaCP n'installe pas MongoDB par défaut, il faut l'installer manuellement.

### 2.1 Ajouter le Repository MongoDB

```bash
# Importer la clé GPG
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Ajouter le repository (Ubuntu 22.04)
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Ou pour Ubuntu 20.04
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Mettre à jour
apt update
```

### 2.2 Installer MongoDB

```bash
# Installation
apt install -y mongodb-org

# Démarrer et activer
systemctl start mongod
systemctl enable mongod

# Vérifier
systemctl status mongod
```

### 2.3 Créer l'utilisateur MongoDB

```bash
# Se connecter à MongoDB
mongosh
```

**Dans le shell MongoDB :**

```javascript
use benado

db.createUser({
  user: "benado_admin",
  pwd: "CHANGEZ_MOT_DE_PASSE_SECURISE",
  roles: [
    { role: "readWrite", db: "benado" },
    { role: "dbAdmin", db: "benado" }
  ]
})

exit
```

### 2.4 Activer l'authentification

```bash
nano /etc/mongod.conf
```

**Modifier/Ajouter :**

```yaml
security:
  authorization: enabled

net:
  port: 27017
  bindIp: 127.0.0.1
```

**Sauvegarder :** `CTRL+X` → `Y` → `ENTER`

```bash
# Redémarrer MongoDB
systemctl restart mongod
```

---

## 🟢 Étape 3 : Installation Node.js

HestiaCP utilise principalement PHP. Il faut installer Node.js manuellement.

### 3.1 Installer Node.js 18+

```bash
# Ajouter le repository NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Installer Node.js
apt install -y nodejs

# Vérifier
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 3.2 Installer PM2

```bash
npm install -g pm2

# Vérifier
pm2 --version
```

---

## 📂 Étape 4 : Création du Site dans HestiaCP

### 4.1 Interface Web HestiaCP

1. **Connexion** : https://VOTRE_IP:8083
2. **Menu** : `WEB` → `Add Web Domain`

### 4.2 Créer les domaines

**Configuration Frontend :**
- Domain : `app.benado.com`
- IP Address : (sélectionner votre IP)
- Web Template : `default`
- Backend Template : `default`
- Enable SSL : ✅
- Enable Let's Encrypt : ✅

**Cliquer** : `Save`

**Configuration Backend API :**
- Domain : `api.benado.com`
- IP Address : (sélectionner votre IP)
- Web Template : `default`
- Backend Template : `default`
- Enable SSL : ✅
- Enable Let's Encrypt : ✅

**Cliquer** : `Save`

**✅ HestiaCP va automatiquement :**
- Créer les dossiers `/home/admin/web/app.benado.com` et `/home/admin/web/api.benado.com`
- Configurer Nginx
- Générer les certificats SSL Let's Encrypt

---

## 🔧 Étape 5 : Installation Backend

### 5.1 Créer le dossier Backend

```bash
mkdir -p /home/admin/benado-backend
cd /home/admin/benado-backend
```

### 5.2 Upload des fichiers Backend

**Option A : SCP depuis votre PC**

```bash
# Sur votre PC, dans backend-standalone/
tar -czf backend.tar.gz *

# Upload
scp backend.tar.gz root@VOTRE_IP:/home/admin/benado-backend/

# Sur le serveur
cd /home/admin/benado-backend
tar -xzf backend.tar.gz
rm backend.tar.gz
```

**Option B : Git**

```bash
git clone https://github.com/votre-repo/benado-backend.git .
```

### 5.3 Installer les dépendances

```bash
cd /home/admin/benado-backend
npm install
```

### 5.4 Configuration .env

```bash
nano .env
```

**Contenu :**

```env
# Serveur
NODE_ENV=production
PORT=4000
API_URL=https://api.benado.com
FRONTEND_URL=https://app.benado.com

# MongoDB
MONGODB_URI=mongodb://localhost:27017/benado
MONGODB_USER=benado_admin
MONGODB_PASSWORD=VOTRE_MOT_DE_PASSE_MONGODB

# JWT (générer une clé aléatoire)
JWT_SECRET=GENEREZ_CLE_ALEATOIRE_32_CARACTERES_MINIMUM
JWT_EXPIRES_IN=7d

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_app
SMTP_FROM=noreply@benado.com

# Upload
UPLOAD_DIR=/home/admin/benado-backend/uploads
MAX_FILE_SIZE=10485760
```

**Sauvegarder :** `CTRL+X` → `Y` → `ENTER`

### 5.5 Générer JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copiez le résultat dans .env**

### 5.6 Créer le dossier uploads

```bash
mkdir -p /home/admin/benado-backend/uploads
chmod 755 /home/admin/benado-backend/uploads
```

### 5.7 Compiler TypeScript

```bash
npm run build
```

### 5.8 Créer le premier admin

```bash
node create-admin.js
```

**📝 Notez les identifiants affichés**

### 5.9 Démarrer avec PM2

```bash
# Démarrer
pm2 start dist/server.js --name benado-backend

# Sauvegarder
pm2 save

# Démarrage automatique
pm2 startup
# Exécuter la commande affichée

# Vérifier
pm2 status
pm2 logs benado-backend
```

---

## 🎨 Étape 6 : Installation Frontend

### 6.1 Build Frontend (sur votre PC)

```bash
# Dans le dossier principal du projet
nano .env.production
```

**Contenu :**

```env
VITE_API_URL=https://api.benado.com/api
```

```bash
# Build
npm install
npm run build
```

### 6.2 Upload Frontend vers HestiaCP

```bash
# Compresser
cd dist
tar -czf frontend.tar.gz *

# Upload
scp frontend.tar.gz root@VOTRE_IP:/home/admin/web/app.benado.com/public_html/

# Sur le serveur
cd /home/admin/web/app.benado.com/public_html
tar -xzf frontend.tar.gz
rm frontend.tar.gz

# Permissions
chown -R admin:admin /home/admin/web/app.benado.com/public_html
chmod -R 755 /home/admin/web/app.benado.com/public_html
```

---

## ⚙️ Étape 7 : Configuration Nginx (Reverse Proxy)

HestiaCP a créé les configurations Nginx, mais il faut les modifier pour le reverse proxy.

### 7.1 Configuration API Backend

```bash
nano /home/admin/conf/web/api.benado.com/nginx.ssl.conf_letsencrypt
```

**Remplacer le contenu par :**

```nginx
server {
    listen 443 ssl http2;
    server_name api.benado.com;

    ssl_certificate /home/admin/conf/web/api.benado.com/ssl/api.benado.com.crt;
    ssl_certificate_key /home/admin/conf/web/api.benado.com/ssl/api.benado.com.key;

    # ... keep existing code (SSL config)

    access_log /var/log/nginx/domains/api.benado.com.log combined;
    error_log /var/log/nginx/domains/api.benado.com.error.log error;

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
```

**Sauvegarder :** `CTRL+X` → `Y` → `ENTER`

### 7.2 Configuration Frontend (SPA React)

```bash
nano /home/admin/conf/web/app.benado.com/nginx.ssl.conf_letsencrypt
```

**Ajouter dans la section `location / {}` :**

```nginx
server {
    listen 443 ssl http2;
    server_name app.benado.com;

    root /home/admin/web/app.benado.com/public_html;
    index index.html;

    ssl_certificate /home/admin/conf/web/app.benado.com/ssl/app.benado.com.crt;
    ssl_certificate_key /home/admin/conf/web/app.benado.com/ssl/app.benado.com.key;

    # ... keep existing code (SSL config)

    access_log /var/log/nginx/domains/app.benado.com.log combined;
    error_log /var/log/nginx/domains/app.benado.com.error.log error;

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

**Sauvegarder :** `CTRL+X` → `Y` → `ENTER`

### 7.3 Redémarrer Nginx

```bash
# Tester la configuration
nginx -t

# Si OK, redémarrer via HestiaCP
systemctl restart hestia
systemctl reload nginx
```

---

## 🔥 Étape 8 : Configuration Firewall

HestiaCP utilise son propre firewall. Il faut autoriser le port backend.

### 8.1 Via Interface HestiaCP

1. **Menu** : `FIREWALL` → `Edit Firewall Rules`
2. **Ajouter règle** :
   - Port : `4000`
   - Protocol : `TCP`
   - Comment : `Benado Backend`
   - Action : `ACCEPT`

### 8.2 Via CLI (alternative)

```bash
# Autoriser port 4000 (backend)
ufw allow 4000/tcp comment 'Benado Backend'

# Recharger
ufw reload

# Vérifier
ufw status
```

---

## ✅ Étape 9 : Vérification Finale

### 9.1 Tester l'API

```bash
curl https://api.benado.com/api/auth/verify
```

**Devrait retourner un JSON → ✅**

### 9.2 Accéder au Frontend

**Ouvrir navigateur :**
- https://app.benado.com

**Se connecter avec :**
- Email : `admin@benado.com`
- Mot de passe : `Admin123!`

**⚠️ Changez ce mot de passe immédiatement !**

---

## 🔄 Étape 10 : Maintenance et Sauvegardes

### 10.1 Sauvegardes MongoDB Automatiques

```bash
# Créer script backup
nano /root/backup-benado.sh
```

**Contenu :**

```bash
#!/bin/bash
BACKUP_DIR="/home/admin/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mongodump --db benado \
  --username benado_admin \
  --password VOTRE_MOT_DE_PASSE \
  --out $BACKUP_DIR/$DATE

tar -czf $BACKUP_DIR/benado-$DATE.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

# Garder 7 derniers jours
find $BACKUP_DIR -type f -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup terminé: $DATE"
```

**Rendre exécutable :**

```bash
chmod +x /root/backup-benado.sh
```

### 10.2 Automatiser avec Cron

```bash
crontab -e
```

**Ajouter (backup à 3h du matin) :**

```
0 3 * * * /root/backup-benado.sh >> /var/log/benado-backup.log 2>&1
```

### 10.3 Monitoring PM2

```bash
# État backend
pm2 status

# Logs live
pm2 logs benado-backend

# Monitoring
pm2 monit

# Redémarrer si nécessaire
pm2 restart benado-backend
```

---

## 🆘 Dépannage

### Erreur "502 Bad Gateway"

```bash
# Vérifier backend
pm2 status
pm2 logs benado-backend

# Vérifier port
netstat -tlnp | grep 4000

# Redémarrer
pm2 restart benado-backend
systemctl reload nginx
```

### MongoDB Connection Failed

```bash
# Vérifier MongoDB
systemctl status mongod

# Logs
journalctl -u mongod -n 50

# Redémarrer
systemctl restart mongod
```

### SSL Certificate Issues

**Via HestiaCP Interface :**
1. **Menu** : `WEB` → Sélectionner domaine
2. **Onglet** : `SSL Certificate`
3. **Bouton** : `Renew Certificate`

---

## 📊 Avantages HestiaCP pour Benado

### ✅ Avantages

- **Interface graphique** : Gestion facile des domaines et SSL
- **SSL automatique** : Let's Encrypt intégré
- **Firewall intégré** : Protection réseau simplifiée
- **Sauvegardes** : Interface de backup intégrée
- **Monitoring** : Graphiques CPU/RAM/disque
- **Multi-domaines** : Gérer plusieurs apps facilement

### ⚠️ Limitations

- **Node.js manuel** : HestiaCP ne gère pas nativement Node.js
- **PM2 séparé** : Gestion des processus Node hors HestiaCP
- **MongoDB externe** : Installation manuelle requise
- **Reverse proxy** : Configuration Nginx manuelle

---

## 🎯 Résumé Commandes Rapides

```bash
# Backend
cd /home/admin/benado-backend
pm2 logs benado-backend
pm2 restart benado-backend

# Frontend (mise à jour)
cd /home/admin/web/app.benado.com/public_html
# Upload nouveau build ici

# Nginx
systemctl reload nginx
nginx -t

# MongoDB
systemctl status mongod
mongosh -u benado_admin -p --authenticationDatabase benado

# Logs
tail -f /var/log/nginx/domains/api.benado.com.error.log
tail -f /var/log/nginx/domains/app.benado.com.error.log
pm2 logs benado-backend --lines 100

# Backup manuel
/root/backup-benado.sh
```

---

## 📞 Support et Documentation

- **HestiaCP Docs** : https://docs.hestiacp.com
- **MongoDB Docs** : https://docs.mongodb.com
- **PM2 Docs** : https://pm2.keymetrics.io/docs

---

## ✅ Checklist Installation

- [ ] HestiaCP installé et accessible
- [ ] MongoDB installé et sécurisé
- [ ] Node.js 18+ installé
- [ ] PM2 installé
- [ ] Domaines créés dans HestiaCP (app + api)
- [ ] SSL Let's Encrypt activé
- [ ] Backend déployé et démarré avec PM2
- [ ] Frontend build uploadé
- [ ] Nginx reverse proxy configuré
- [ ] Firewall configuré (port 4000)
- [ ] Premier admin créé
- [ ] Tests connexion réussis
- [ ] Sauvegardes automatiques configurées

---

**Document généré le :** 2025-01-XX  
**Version :** 1.0.0 - HestiaCP  
**Application :** Benado - 100% Indépendant  
**Infrastructure :** HestiaCP + MongoDB + Express + React
