import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  // Informations personnelles
  nom: string;
  prenom: string;
  dateNaissance: string;
  age: string;
  origine: string;
  genre: string;
  degreScolaire: string;
  
  // Adresse
  adresseComplete: string;
  appartement?: string;
  codePostal: string;
  ville: string;
  
  // Famille
  demeurAvec: string;
  parent1Type?: string;
  parent1Nom?: string;
  parent1Prenom?: string;
  parent1Tel?: string;
  parent1Email?: string;
  parent2Type?: string;
  parent2Nom?: string;
  parent2Prenom?: string;
  parent2Tel?: string;
  parent2Email?: string;
  contactUrgence?: string;
  contactUrgenceTel?: string;
  contactUrgenceLien?: string;
  
  // Santé
  problemeSante?: string;
  allergies?: string;
  epipen?: string;
  
  // École et programme
  ecoleReferente: string;
  intervenantNom?: string;
  intervenantTitre?: string;
  intervenantPoste?: string;
  intervenantEmail?: string;
  directionNom?: string;
  directionEmail?: string;
  programme: string;
  dateEntree: string;
  dateFin?: string;
  
  // Projet
  apresSejourPlan?: string;
  motifReference?: string;
  moyensProposesAutres?: string;
  suiviExterne?: string;
  motivationsAdolescent?: string;
  
  // Statut et profil virtuel
  status: 'en_attente' | 'actif' | 'ferme' | 'refuse';
  isVirtualProfile?: boolean;
  titre?: string;
}

const EnrollmentSchema: Schema = new Schema({
  // Informations personnelles
  nom: { type: String, required: true, trim: true },
  prenom: { type: String, required: true, trim: true },
  dateNaissance: { type: String },
  age: { type: String },
  origine: { type: String },
  genre: { type: String },
  degreScolaire: { type: String },
  
  // Adresse
  adresseComplete: { type: String },
  appartement: { type: String },
  codePostal: { type: String },
  ville: { type: String },
  
  // Famille
  demeurAvec: { type: String },
  parent1Type: { type: String },
  parent1Nom: { type: String },
  parent1Prenom: { type: String },
  parent1Tel: { type: String },
  parent1Email: { type: String },
  parent2Type: { type: String },
  parent2Nom: { type: String },
  parent2Prenom: { type: String },
  parent2Tel: { type: String },
  parent2Email: { type: String },
  contactUrgence: { type: String },
  contactUrgenceTel: { type: String },
  contactUrgenceLien: { type: String },
  
  // Santé
  problemeSante: { type: String },
  allergies: { type: String },
  epipen: { type: String },
  
  // École et programme
  ecoleReferente: { type: String, required: true },
  intervenantNom: { type: String },
  intervenantTitre: { type: String },
  intervenantPoste: { type: String },
  intervenantEmail: { type: String },
  directionNom: { type: String },
  directionEmail: { type: String },
  programme: { type: String, required: true },
  dateEntree: { type: String },
  dateFin: { type: String },
  
  // Projet
  apresSejourPlan: { type: String },
  motifReference: { type: String },
  moyensProposesAutres: { type: String },
  suiviExterne: { type: String },
  motivationsAdolescent: { type: String },
  
  // Statut
  status: { 
    type: String, 
    enum: ['en_attente', 'actif', 'ferme', 'refuse'],
    default: 'en_attente'
  },
  isVirtualProfile: { type: Boolean, default: false },
  titre: { type: String }
}, {
  timestamps: true
});

// Index pour performance
EnrollmentSchema.index({ status: 1 });
EnrollmentSchema.index({ isVirtualProfile: 1 });
EnrollmentSchema.index({ nom: 1, prenom: 1 });
EnrollmentSchema.index({ ecoleReferente: 1 });
EnrollmentSchema.index({ programme: 1 });

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
