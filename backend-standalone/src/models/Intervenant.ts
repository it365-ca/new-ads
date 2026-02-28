import mongoose, { Schema, Document } from 'mongoose';

export interface IIntervenant extends Document {
  email: string;
  nom: string;
  prenom: string;
  passwordHash?: string;
  salt?: string;
  telephone?: string;
  specialite?: string;
  actif: boolean;
  mustChangePassword: boolean;
  resetToken?: string;
  resetTokenExpiry?: Date;
  permissions: {
    accessNotes?: boolean;
    accessStats?: boolean;
    accessTickets?: boolean;
    accessMessagerie?: boolean;
    modifierEtudiants?: boolean;
  };
  dateAjout: Date;
  // Synchronisation calendrier
  calendarSync?: {
    provider: 'microsoft' | 'google';
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    calendarId?: string;
    enabled: boolean;
    lastSync?: Date;
  };
}

const IntervenantSchema: Schema = new Schema({
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
    accessStats: { type: Boolean, default: false },
    accessTickets: { type: Boolean, default: false },
    accessMessagerie: { type: Boolean, default: true },
    modifierEtudiants: { type: Boolean, default: true }
  },
  calendarSync: {
    provider: { type: String, enum: ['microsoft', 'google'] },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiry: { type: Date },
    calendarId: { type: String },
    enabled: { type: Boolean, default: false },
    lastSync: { type: Date }
  },
  dateAjout: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index pour performance
// Note: email a déjà un index via "unique: true"
IntervenantSchema.index({ actif: 1 });

export default mongoose.model<IIntervenant>('Intervenant', IntervenantSchema);