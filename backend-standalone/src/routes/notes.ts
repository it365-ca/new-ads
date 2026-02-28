import express from 'express';
import Note from '../models/Note';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

// Liste des notes
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { enrollmentId, statut } = req.query;
    
    const filter: any = {};
    if (enrollmentId) filter.enrollmentId = enrollmentId;
    if (statut) filter.statut = statut;

    const notes = await Note.find(filter).sort({ dateCreation: -1 });
    
    res.json({
      list: notes,
      total: notes.length
    });
  } catch (error) {
    console.error('Erreur liste notes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Get une note
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note non trouvée' });
    }
    res.json(note);
  } catch (error) {
    console.error('Erreur get note:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Créer note
router.post('/', async (req: AuthRequest, res) => {
  try {
    const noteData = {
      ...req.body,
      auteurId: req.user?.userId,
      auteurEmail: req.user?.email
    };
    
    const note = new Note(noteData);
    await note.save();
    res.status(201).json(note);
  } catch (error) {
    console.error('Erreur création note:', error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// Modifier note
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!note) {
      return res.status(404).json({ error: 'Note non trouvée' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Erreur modification note:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// Supprimer note
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note non trouvée' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression note:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;
