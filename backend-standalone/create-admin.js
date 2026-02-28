/**
 * Script de création du premier administrateur
 * À exécuter UNE SEULE FOIS sur votre serveur
 * 
 * Usage: node create-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuration MongoDB (ajustez selon votre .env)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/benado';
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;

// Schéma Intervenant
const IntervenantSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  nom: { type: String, required: true, trim: true },
  prenom: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  telephone: { type: String, trim: true },
  specialite: { type: String, trim: true },
  actif: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  permissions: {
    accessNotes: { type: Boolean, default: true },
    accessStats: { type: Boolean, default: true },
    accessTickets: { type: Boolean, default: true },
    accessMessagerie: { type: Boolean, default: true },
    modifierEtudiants: { type: Boolean, default: true }
  },
  dateAjout: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Intervenant = mongoose.model('Intervenant', IntervenantSchema);

// Données du premier admin
const ADMIN_DATA = {
  email: 'admin@benado.com',
  nom: 'Administrateur',
  prenom: 'Benado',
  password: 'Admin123!', // ⚠️ À changer après première connexion
  telephone: '',
  specialite: 'Administrateur système',
  permissions: {
    accessNotes: true,
    accessStats: true,
    accessTickets: true,
    accessMessagerie: true,
    modifierEtudiants: true
  }
};

async function createFirstAdmin() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    
    // Connexion MongoDB
    await mongoose.connect(MONGODB_URI, {
      user: MONGODB_USER,
      pass: MONGODB_PASSWORD
    });
    
    console.log('✅ Connecté à MongoDB');
    
    // Vérifier si un admin existe déjà
    const existingAdmin = await Intervenant.findOne({ email: ADMIN_DATA.email });
    
    if (existingAdmin) {
      console.log('⚠️  Un administrateur avec cet email existe déjà !');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Nom:', existingAdmin.prenom, existingAdmin.nom);
      console.log('\n💡 Si vous avez oublié le mot de passe, utilisez la fonction de réinitialisation.');
      process.exit(0);
    }
    
    console.log('🔐 Génération du hash du mot de passe...');
    
    // Générer salt et hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_DATA.password, salt);
    
    console.log('👤 Création de l\'administrateur...');
    
    // Créer l'admin
    const admin = new Intervenant({
      email: ADMIN_DATA.email,
      nom: ADMIN_DATA.nom,
      prenom: ADMIN_DATA.prenom,
      passwordHash,
      salt,
      telephone: ADMIN_DATA.telephone,
      specialite: ADMIN_DATA.specialite,
      actif: true,
      mustChangePassword: false,
      permissions: ADMIN_DATA.permissions
    });
    
    await admin.save();
    
    console.log('\n✅ ============================================');
    console.log('✅  ADMINISTRATEUR CRÉÉ AVEC SUCCÈS !');
    console.log('✅ ============================================\n');
    console.log('📧 Email:', ADMIN_DATA.email);
    console.log('🔑 Mot de passe:', ADMIN_DATA.password);
    console.log('\n⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la création de l\'administrateur:');
    console.error(error.message);
    
    if (error.code === 11000) {
      console.error('\n⚠️  Cet email existe déjà dans la base de données.');
    }
    
    process.exit(1);
  }
}

// Exécution
createFirstAdmin();
