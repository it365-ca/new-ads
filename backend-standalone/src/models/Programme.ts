import mongoose from 'mongoose';

const programmeSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  actif: { type: Boolean, default: true },
  couleur: { type: String, default: '#6366f1' },
  icone: { type: String, default: '📚' },
  statsConfiguration: {
    afficherGenre: { type: Boolean, default: true },
    afficherAge: { type: Boolean, default: true },
    afficherDegre: { type: Boolean, default: true },
    afficherEcole: { type: Boolean, default: true },
    afficherVille: { type: Boolean, default: true },
    afficherOrigine: { type: Boolean, default: true },
    afficherDemeurAvec: { type: Boolean, default: true },
    afficherInterventions: { type: Boolean, default: true },
    afficherPresence: { type: Boolean, default: true },
    afficherEvolution: { type: Boolean, default: true },
    afficherConversion: { type: Boolean, default: true }
  },
  customStats: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    icon: { type: String, default: '📊' },
    type: { type: String, enum: ['text', 'number', 'select', 'date', 'multiselect'], required: true },
    options: [{ type: String }],
    defaultValue: { type: mongoose.Schema.Types.Mixed }
  }],
  ordre: { type: Number, default: 0 },
  capaciteMax: { type: Number },
  dureeTypique: { type: String },
  creator: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Programme', programmeSchema);
