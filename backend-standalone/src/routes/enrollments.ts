import express from 'express';
import Enrollment from '../models/Enrollment';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// Liste des enrollments
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, isVirtualProfile } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (isVirtualProfile !== undefined) filter.isVirtualProfile = isVirtualProfile === 'true';

    const enrollments = await Enrollment.find(filter).sort({ createdAt: -1 });
    
    res.json({
      list: enrollments,
      total: enrollments.length
    });
  } catch (error) {
    console.error('Erreur liste enrollments:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Get un enrollment
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }
    res.json(enrollment);
  } catch (error) {
    console.error('Erreur get enrollment:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Créer enrollment
router.post('/', async (req: AuthRequest, res) => {
  try {
    const enrollment = new Enrollment(req.body);
    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Erreur création enrollment:', error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// Modifier enrollment
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!enrollment) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }
    
    res.json(enrollment);
  } catch (error) {
    console.error('Erreur modification enrollment:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// Supprimer enrollment
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression enrollment:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;
