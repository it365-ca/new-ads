# 🚀 Guide de Déploiement - Application Benado sur AlmaLinux/Proxmox

## 📋 Table des Matières

0. [Installation Proxmox](#0-installation-proxmox-facultatif---si-pas-encore-installé) (Facultatif)
1. [Proxmox - Création VM](#1-proxmox-création-vm)
2. [AlmaLinux - Installation](#2-almalinux-installation)
3. [Configuration Système](#3-configuration-système)
4. [Installation MongoDB](#4-installation-mongodb)
5. [Installation Backend](#5-installation-backend)
6. [Installation Frontend](#6-installation-frontend)
7. [Configuration Nginx](#7-configuration-nginx)
8. [SSL avec Certbot](#8-ssl-avec-certbot)
9. [Maintenance](#9-maintenance)

---

## 0. Installation Proxmox (Facultatif - Si pas encore installé)

### 0.1 Télécharger Proxmox VE

1. **Site officiel** : https://www.proxmox.com/en/downloads
2. **Télécharger** : Proxmox VE ISO Installer (dernière version stable)
3. **Fichier** : `proxmox-ve_X.X-X.iso` (~1GB)

### 0.2 Créer une Clé USB Bootable

**Windows - Avec Rufus :**
1. Télécharger Rufus : https://rufus.ie
2. Insérer clé USB (8GB minimum)
3. Dans Rufus :
   - Device : Votre clé USB
   - Boot selection : `proxmox-ve_X.X-X.iso`
   - Partition scheme : GPT
   - Target system : UEFI
4. Cliquer `START`

**Linux/Mac :**
```bash
# Identifier la clé USB
lsblk   # Linux
diskutil list   # Mac

# Écrire l'ISO (remplacer /dev/sdX)
sudo dd if=proxmox-ve_X.X-X.iso of=/dev/sdX bs=1M status=progress
```

### 0.3 Installer Proxmox sur Serveur Physique

**⚠️ ATTENTION : Cela EFFACE tout le disque !**

1. **Brancher** la clé USB sur le serveur
2. **Démarrer** et appuyer sur F11/F12/ESC (selon fabricant) pour boot menu
3. **Sélectionner** la clé USB

**Installation Proxmox :**

1. **Écran d'accueil** : `Install Proxmox VE (Graphical)`
2. **EULA** : Accepter
3. **Target Harddisk** :
   - Sélectionner disque système (SSD recommandé)
   - Filesystem : `ext4` (défaut) ou `ZFS` (raid matériel)
4. **Location and Time Zone** :
   - Country : Canada (ou votre pays)
   - Time zone : America/Montreal
   - Keyboard Layout : fr (français)
5. **Administration Password** :
   - Password : `MOT_DE_PASSE_FORT`
   - Confirm : (même mot de passe)
   - Email : votre@email.com
6. **Management Network Configuration** :
   - Hostname : `proxmox.local` (ou votre domaine)
   - IP Address : `192.168.1.100` (selon votre réseau)
   - Netmask : `255.255.255.0` (ou /24)
   - Gateway : `192.168.1.1` (IP de votre routeur)
   - DNS Server : `8.8.8.8` (ou DNS local)
7. **Summary** : Vérifier → `Install`

**⏱️ Installation (5-10 min) → Reboot**

### 0.4 Premier Accès Proxmox

**Depuis votre PC :**

1. **Ouvrir navigateur** : https://192.168.1.100:8006
   (Remplacer par votre IP)
2. **Certificat SSL** : Accepter (auto-signé)
3. **Login** :
   - Username : `root`
   - Password : (mot de passe défini)
   - Realm : `Linux PAM`
4. **Popup "No valid subscription"** : Cliquer `OK`

**✅ Proxmox installé et accessible !**

### 0.5 Télécharger l'ISO AlmaLinux

**Dans l'interface Proxmox :**

1. **Menu gauche** : `local (proxmox)` → `ISO Images`
2. **Bouton** : `Download from URL`
3. **URL** : 
   ```
   https://mirrors.almalinux.org/isos/x86_64/9.5.iso
   ```
4. **Cliquer** : `Query URL` puis `Download`

**⏱️ Téléchargement (5-10 min selon connexion)**

**Ou télécharger sur votre PC puis upload :**
```bash
# Sur votre PC
scp AlmaLinux-9-latest-x86_64-minimal.iso root@192.168.1.100:/var/lib/vz/template/iso/
```

---

## 1. Proxmox - Création VM

### 1.1 Créer la VM

**Dans l'interface Proxmox :**

1. **Cliquez** sur `Create VM` (bouton bleu en haut à droite)

2. **Onglet General :**
   - VM ID : `100` (ou auto)
   - Name : `benado-app`

3. **Onglet OS :**
   - ISO : AlmaLinux-9-latest-x86_64-minimal.iso
   - Type : Linux
   - Version : 6.x - 2.6 Kernel

4. **Onglet System :**
   - BIOS : OVMF (UEFI)
   - Add EFI Disk : ✓
   - Machine : q35

5. **Onglet Disks :**
   - Bus/Device : SCSI 0
   - Storage : local-lvm
   - Disk size : **50 GB minimum**
   - Cache : Write back
   - Discard : ✓

6. **Onglet CPU :**
   - Cores : **2 minimum** (recommandé 4)
   - Type : host

7. **Onglet Memory :**
   - Memory : **4096 MB minimum** (recommandé 8192 MB)

8. **Onglet Network :**
   - Bridge : vmbr0
   - Model : VirtIO
   - Firewall : ✓

9. **Cliquez** `Finish`

### 1.2 Démarrer et Installer AlmaLinux

```bash
# Démarrer la VM
# Dans Proxmox: Sélectionner VM → Start → Console
```

**Suivez l'installation AlmaLinux :**
1. Langue : Français (ou English)
2. **Installation Destination** : Disque 50GB
3. **Network & Hostname** :
   - Activer Ethernet (ON)
   - Hostname : `benado.local`
4. **Root Password** : Définir un mot de passe fort
5. **User Creation** : Créer un utilisateur admin avec sudo
6. **Begin Installation**

**⏱️ Attendre la fin (5-10 min) → Reboot**

---

## 2. AlmaLinux - Installation

### 2.1 Connexion SSH

```bash
# Depuis votre PC, se connecter à la VM
ssh root@IP_DE_VOTRE_VM

# Ou avec votre utilisateur
ssh votre_user@IP_DE_VOTRE_VM
sudo su -
```

### 2.2 Mise à Jour Système

```bash
# Mettre à jour tous les paquets
dnf update -y

# Installer outils de base
dnf install -y wget curl nano vim git net-tools
```

---

## 3. Configuration Système

### 3.1 Firewall (Firewalld)

```bash
# Démarrer et activer firewalld
systemctl start firewalld
systemctl enable firewalld

# Ouvrir les ports HTTP/HTTPS/SSH
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh

# Recharger
firewall-cmd --reload

# Vérifier
firewall-cmd --list-all
```

### 3.2 SELinux (Optionnel - Désactivation)

```bash
# Vérifier le statut
getenforce

# Désactiver temporairement (recommandé pour développement)
setenforce 0

# Désactiver définitivement
nano /etc/selinux/config
```

**Modifier :**
```
SELINUX=disabled
```

**Sauvegarder :** `CTRL+X` → `Y` → `ENTER`

```bash
# Redémarrer (pour appliquer SELinux)
reboot
```

### 3.3 Hostname et DNS

```bash
# Définir le hostname
hostnamectl set-hostname benado.local

# Vérifier
hostnamectl
```

---

## 4. Installation MongoDB

### 4.1 Ajouter le Repository MongoDB

```bash
# Créer le fichier repo MongoDB
nano /etc/yum.repos.d/mongodb-org-6.0.repo
```

**Copier ce contenu :**

```ini
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
```

**Sauvegarder :** `CTRL+X` → `Y` → `ENTER`

### 4.2 Installer MongoDB

```bash
# Installer MongoDB
dnf install -y mongodb-org

# Démarrer MongoDB
systemctl start mongod
systemctl enable mongod

# Vérifier le statut
systemctl status mongod
```

**✅ MongoDB devrait être "active (running)"**

### 4.3 Créer l'Utilisateur MongoDB

```bash
# Se connecter à MongoDB
mongosh
```

**Dans le shell MongoDB :**

```javascript
use benado

db.createUser({
  user: "benado_admin",
  pwd: "CHANGEZ_CE_MOT_DE_PASSE_SECURISE",
  roles: [
    { role: "readWrite", db: "benado" },
    { role: "dbAdmin", db: "benado" }
  ]
})

exit
```

### 4.4 Activer l'Authentification MongoDB

```bash
# Éditer la configuration
nano /etc/mongod.conf
```

**Ajouter/Modifier ces sections :**

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

# Vérifier
systemctl status mongod
```

### 4.5 Tester la Connexion

```bash
mongosh -u benado_admin -p VOTRE_MOT_DE_PASSE --authenticationDatabase benado
```

**Si connexion OK → ✅ MongoDB configuré !**

---

## 5. Installation Backend

### 5.1 Installer Node.js 18+

```bash
# Ajouter le repository NodeSource
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -

# Installer Node.js
dnf install -y nodejs

# Vérifier
node --version  # Doit afficher v18.x.x
npm --version   # Doit afficher 9.x.x
```

### 5.2 Installer PM2

```bash
npm install -g pm2

# Vérifier
pm2 --version
```

### 5.3 Créer le Dossier Backend

```bash
mkdir -p /var/www/benado-backend
cd /var/www/benado-backend
```

### 5.4 Upload des Fichiers Backend

**Option A : Depuis votre PC (SCP)**

```bash
# Sur votre PC, dans le dossier backend-standalone
tar -czf backend.tar.gz *

# Upload vers le serveur
scp backend.tar.gz root@IP_SERVEUR:/var/www/benado-backend/

# Sur le serveur, extraire
cd /var/www/benado-backend
tar -xzf backend.tar.gz
rm backend.tar.gz
```

**Option B : Git (si vous avez un repo)**

```bash
git clone https://github.com/votre-compte/benado-backend.git .
```

### 5.5 Installer les Dépendances

```bash
cd /var/www/benado-backend
npm install
```

### 5.6 Configuration .env

```bash
nano .env
```

**Copier et MODIFIER les valeurs :**

```env
# Serveur
NODE_ENV=production
PORT=4000
API_URL=https://api.votre-domaine.com
FRONTEND_URL=https://app.votre-domaine.com

# MongoDB
MONGODB_URI=mongodb://localhost:27017/benado
MONGODB_USER=benado_admin
MONGODB_PASSWORD=VOTRE_MOT_DE_PASSE_MONGODB

# JWT (générer une clé aléatoire sécurisée)
JWT_SECRET=GENEREZ_UNE_CLE_ALEATOIRE_DE_32_CARACTERES_MINIMUM
JWT_EXPIRES_IN=7d

# Email (SMTP) - Exemple Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_application
SMTP_FROM=noreply@votre-domaine.com

# Upload
UPLOAD_DIR=/var/www/benado-backend/uploads
MAX_FILE_SIZE=10485760
```

**Sauvegarder :** `CTRL+X` → `Y` → `ENTER`

### 🔐 Générer JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copiez le résultat dans `JWT_SECRET=`**

### 5.7 Créer le Dossier Uploads

```bash
mkdir -p /var/www/benado-backend/uploads
chmod 755 /var/www/benado-backend/uploads
```

### 5.8 Compiler TypeScript

```bash
npm run build
```

**✅ Vérifier que le dossier `dist/` est créé**

### 5.9 Créer le Premier Admin

```bash
node create-admin.js
```

**📝 Notez les identifiants affichés :**
- Email : `admin@benado.com`
- Mot de passe : `Admin123!`

### 5.10 Démarrer avec PM2

```bash
# Démarrer le backend
pm2 start dist/server.js --name benado-backend

# Sauvegarder la config PM2
pm2 save

# Démarrage automatique au boot
pm2 startup

# Exécuter la commande affichée (exemple):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

### 5.11 Vérifier le Backend

```bash
# Voir les logs
pm2 logs benado-backend

# Tester l'API
curl http://localhost:4000/api/auth/verify
```

**Si répond un JSON → ✅ Backend OK !**

---

## 6. Installation Frontend

### 6.1 Préparer les Fichiers (Sur votre PC)

```bash
# Dans le dossier principal du projet
cd /chemin/vers/votre-projet

# Créer .env.production
nano .env.production
```

**Contenu :**

```env
VITE_API_URL=https://api.votre-domaine.com/api
```

### 6.2 Build Frontend

```bash
npm install
npm run build
```

**✅ Dossier `dist/` créé**

### 6.3 Upload sur le Serveur

```bash
# Sur votre PC
cd dist
tar -czf frontend.tar.gz *

# Upload
scp frontend.tar.gz root@IP_SERVEUR:/tmp/
```

### 6.4 Déployer sur AlmaLinux

```bash
# Sur le serveur
mkdir -p /var/www/benado-frontend
cd /var/www/benado-frontend

# Extraire
tar -xzf /tmp/frontend.tar.gz

# Permissions
chown -R nginx:nginx /var/www/benado-frontend
chmod -R 755 /var/www/benado-frontend
```

---

## 7. Configuration Nginx

### 7.1 Installer Nginx

```bash
# Installer Nginx
dnf install -y nginx

# Démarrer et activer
systemctl start nginx
systemctl enable nginx

# Vérifier
systemctl status nginx
```

### 7.2 Configuration Nginx

```bash
nano /etc/nginx/conf.d/benado.conf
```

**Copier cette configuration :**

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

**⚠️ REMPLACEZ `votre-domaine.com` par votre vrai domaine !**

**Sauvegarder :** `CTRL+X` → `Y` → `ENTER`

### 7.3 Tester et Activer Nginx

```bash
# Tester la configuration
nginx -t

# Si OK, recharger
systemctl reload nginx
```

### 7.4 SELinux - Autoriser Nginx (si SELinux actif)

```bash
# Autoriser les connexions réseau pour Nginx
setsebool -P httpd_can_network_connect 1

# Autoriser Nginx à lire les fichiers web
chcon -R -t httpd_sys_content_t /var/www/benado-frontend
```

---

## 8. SSL avec Certbot

### 8.1 Installer Certbot

```bash
# Installer Certbot pour Nginx
dnf install -y certbot python3-certbot-nginx
```

### 8.2 Obtenir les Certificats SSL

```bash
certbot --nginx -d app.votre-domaine.com -d api.votre-domaine.com
```

**Suivre les instructions :**
1. Email : votre@email.com
2. Conditions : `Y`
3. Partage email : `N` ou `Y` (optionnel)
4. Redirect HTTP → HTTPS : **2** (Recommandé)

### 8.3 Renouvellement Automatique

```bash
# Tester le renouvellement
certbot renew --dry-run

# Le renouvellement auto est déjà configuré via systemd timer
systemctl list-timers | grep certbot
```

**✅ Si OK → SSL configuré !**

### 8.4 Vérifier HTTPS

**Ouvrir dans le navigateur :**
- `https://app.votre-domaine.com`
- `https://api.votre-domaine.com`

**🔒 Cadenas vert = SSL actif !**

---

## 9. Maintenance

### 9.1 Sauvegardes MongoDB Automatiques

```bash
# Créer le script de backup
nano /root/backup-mongo.sh
```

**Contenu :**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mongodump --db benado \
  --username benado_admin \
  --password VOTRE_MOT_DE_PASSE_MONGODB \
  --out $BACKUP_DIR/$DATE

# Compresser
tar -czf $BACKUP_DIR/benado-$DATE.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

# Garder seulement 7 derniers jours
find $BACKUP_DIR -type f -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup terminé: benado-$DATE.tar.gz"
```

**Rendre exécutable :**

```bash
chmod +x /root/backup-mongo.sh
```

### 9.2 Cron - Automatiser les Backups

```bash
crontab -e
```

**Ajouter (backup tous les jours à 2h du matin) :**

```
0 2 * * * /root/backup-mongo.sh >> /var/log/mongodb-backup.log 2>&1
```

**Sauvegarder :** `CTRL+X` → `Y` → `ENTER`

### 9.3 Monitoring avec PM2

```bash
# État des processus
pm2 status

# Monitoring temps réel
pm2 monit

# Logs live
pm2 logs benado-backend --lines 100
```

### 9.4 Commandes Utiles

```bash
# Redémarrer services
systemctl restart mongod
systemctl restart nginx
pm2 restart benado-backend

# Voir les logs
pm2 logs benado-backend
tail -f /var/log/nginx/benado-api-error.log
tail -f /var/log/mongodb/mongod.log

# Sauvegarder MongoDB manuellement
/root/backup-mongo.sh

# Espace disque
df -h

# RAM
free -h

# Processus
pm2 status
```

---

## 🎉 Installation Terminée !

### 🔗 Accès Application

- **Frontend** : https://app.votre-domaine.com
- **API** : https://api.votre-domaine.com

### 🔐 Identifiants Admin

- **Email** : admin@benado.com
- **Mot de passe** : Admin123!

**⚠️ CHANGEZ CE MOT DE PASSE IMMÉDIATEMENT !**

---

## 🆘 Dépannage AlmaLinux

### Erreur "Cannot connect to MongoDB"

```bash
# Vérifier MongoDB
systemctl status mongod

# Voir les logs
journalctl -u mongod -n 50

# Redémarrer
systemctl restart mongod
```

### Erreur "502 Bad Gateway" (Nginx)

```bash
# Vérifier backend
pm2 status
pm2 logs benado-backend

# Vérifier ports
netstat -tlnp | grep 4000

# Redémarrer
pm2 restart benado-backend
```

### Firewall bloque les connexions

```bash
# Vérifier les règles
firewall-cmd --list-all

# Ajouter les services
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

### SELinux bloque Nginx

```bash
# Logs SELinux
ausearch -m avc -ts recent

# Désactiver temporairement
setenforce 0

# Ou autoriser Nginx
setsebool -P httpd_can_network_connect 1
```

---

## 📞 Résumé Installation Rapide

```bash
# 1. Créer VM Proxmox (4GB RAM, 2 CPU, 50GB)
# 2. Installer AlmaLinux 9
# 3. Mise à jour
dnf update -y

# 4. MongoDB
# ... keep existing code

# 5. Node.js + Backend
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs
# ... keep existing code

# 6. Frontend
# ... keep existing code

# 7. Nginx + SSL
dnf install -y nginx certbot python3-certbot-nginx
# ... keep existing code
```

---

**Document généré le :** 2025-01-XX  
**Version :** 1.0.0 - AlmaLinux  
**Application :** Benado - 100% Indépendant  
**Infrastructure :** Proxmox + AlmaLinux + MongoDB + Express + React
