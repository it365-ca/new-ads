import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Charger variables d'environnement
dotenv.config();

// Routes
import authRoutes from './routes/auth';
import enrollmentRoutes from './routes/enrollments';
import noteRoutes from './routes/notes';
import documentRoutes from './routes/documents';
import emailRoutes from './routes/email';
import intervenantRoutes from './routes/intervenants';
import setupRoutes from './routes/setup';
import programmeRoutes from './routes/programmes';
import statsRoutes from './routes/stats';
import appointmentRoutes from './routes/appointments';
import calendarRoutes from './routes/calendar';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware de sécurité
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/intervenants', intervenantRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/programmes', programmeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/calendar', calendarRoutes);

// Servir les fichiers uploadés
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI!, {
  user: process.env.MONGODB_USER,
  pass: process.env.MONGODB_PASSWORD
})
.then(() => {
  console.log('✅ Connecté à MongoDB');
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  });
})
.catch(err => {
  console.error('❌ Erreur MongoDB:', err);
  process.exit(1);
});

// Gestion des erreurs
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erreur serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
