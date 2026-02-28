import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant {
  type: 'parent1' | 'parent2' | 'eleve';
  nom: string;
  email: string;
  telephone?: string;
  confirme: boolean;
  confirmationToken: string;
  dateConfirmation?: Date;
}

export interface IAppointment extends Document {
  titre: string;
  dateRendezVous: Date;
  heureRendezVous: string;
  duree?: number;
  lieu?: string;
  typeRendezVous: 'en_personne' | 'virtuel' | 'telephone';
  enrollmentId: string;
  intervenantId: string;
  intervenantNom: string;
  participants: IParticipant[];
  notes?: string;
  status: 'en_attente' | 'confirme' | 'annule' | 'complete';
  rappel48hEnvoye: boolean;
  rappel24hEnvoye: boolean;
  dateRappel48h?: Date;
  dateRappel24h?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema({
  type: { 
    type: String, 
    enum: ['parent1', 'parent2', 'eleve'],
    required: true 
  },
  nom: { type: String, required: true },
  email: { type: String, required: true },
  telephone: { type: String },
  confirme: { type: Boolean, default: false },
  confirmationToken: { type: String, required: true },
  dateConfirmation: { type: Date }
}, { _id: false });

const AppointmentSchema: Schema = new Schema({
  titre: { type: String, required: true, trim: true },
  dateRendezVous: { type: Date, required: true },
  heureRendezVous: { type: String, required: true },
  duree: { type: Number, default: 60 },
  lieu: { type: String },
  typeRendezVous: { 
    type: String, 
    enum: ['en_personne', 'virtuel', 'telephone'],
    default: 'en_personne'
  },
  enrollmentId: { type: String, required: true },
  intervenantId: { type: String, required: true },
  intervenantNom: { type: String, required: true },
  participants: [ParticipantSchema],
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['en_attente', 'confirme', 'annule', 'complete'],
    default: 'en_attente'
  },
  rappel48hEnvoye: { type: Boolean, default: false },
  rappel24hEnvoye: { type: Boolean, default: false },
  dateRappel48h: { type: Date },
  dateRappel24h: { type: Date }
}, {
  timestamps: true
});

// Index pour performance
AppointmentSchema.index({ dateRendezVous: 1 });
AppointmentSchema.index({ enrollmentId: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ 'participants.confirmationToken': 1 });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
