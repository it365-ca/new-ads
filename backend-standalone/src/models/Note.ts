import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  enrollmentId: string;
  contenu: string;
  auteurNom: string;
  ecole: string;
  couleur: string;
  position: {
    x: number;
    y: number;
  };
  categorie: string;
  rappel?: {
    date: string;
    heure: string;
    type: 'telephone_parent' | 'telephone_eleve' | 'rencontre' | 'suivi' | 'autre';
    description: string;
  };
  checklist?: Array<{
    text: string;
    completed: boolean;
  }>;
  suivi: boolean;
  status: string;
  creator: string;
  
  // Champs numériques requis
  contactScolaire: number;
  rencontreScolaire: number;
  nombreScolaire: number;
  contactJeune: number;
  rencontreJeune: number;
  nombreJeune: number;
  contactParent: number;
  rencontreParent: number;
  nombreParent: number;
  contactAutre: number;
  rencontreAutre: number;
  nombreAutre: number;
}

const NoteSchema: Schema = new Schema({
  enrollmentId: { type: String, required: true, index: true },
  contenu: { type: String, required: true },
  auteurNom: { type: String, required: true },
  ecole: { type: String, required: true },
  couleur: { type: String, default: 'yellow' },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  categorie: { type: String, default: 'general' },
  rappel: {
    date: String,
    heure: String,
    type: {
      type: String,
      enum: ['telephone_parent', 'telephone_eleve', 'rencontre', 'suivi', 'autre']
    },
    description: String
  },
  checklist: [{
    text: String,
    completed: { type: Boolean, default: false }
  }],
  suivi: { type: Boolean, default: false },
  status: { type: String, default: 'actif' },
  creator: { type: String, default: 'user' },
  
  // Champs numériques
  contactScolaire: { type: Number, default: 0 },
  rencontreScolaire: { type: Number, default: 0 },
  nombreScolaire: { type: Number, default: 0 },
  contactJeune: { type: Number, default: 0 },
  rencontreJeune: { type: Number, default: 0 },
  nombreJeune: { type: Number, default: 0 },
  contactParent: { type: Number, default: 0 },
  rencontreParent: { type: Number, default: 0 },
  nombreParent: { type: Number, default: 0 },
  contactAutre: { type: Number, default: 0 },
  rencontreAutre: { type: Number, default: 0 },
  nombreAutre: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Index pour performance
NoteSchema.index({ enrollmentId: 1, createdAt: -1 });
NoteSchema.index({ suivi: 1 });
NoteSchema.index({ status: 1 });
NoteSchema.index({ categorie: 1 });

export default mongoose.model<INote>('Note', NoteSchema);
