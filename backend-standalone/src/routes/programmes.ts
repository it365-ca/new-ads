import express from 'express';
import Programme from '../models/Programme';

const router = express.Router();

// Liste tous les programmes
router.get('/', async (req, res) => {
  try {
    const { filter, sort, limit, skip } = req.query;
    
    let query = Programme.find();
    
    if (filter) {
      query = query.where(JSON.parse(filter as string));
    }
    
    if (sort) {
      query = query.sort(JSON.parse(sort as string));
    }
    
    if (skip) {
      query = query.skip(parseInt(skip as string));
    }
    
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    
    const list = await query.exec();
    const total = await Programme.countDocuments(filter ? JSON.parse(filter as string) : {});
    
    res.json({ list, total });
  } catch (error) {
    console.error('Erreur liste programmes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un programme par ID
router.get('/:id', async (req, res) => {
  try {
    const programme = await Programme.findById(req.params.id);
    if (!programme) {
      return res.status(404).json({ error: 'Programme non trouvé' });
    }
    res.json(programme);
  } catch (error) {
    console.error('Erreur récupération programme:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouveau programme
router.post('/', async (req, res) => {
  try {
    const programme = new Programme(req.body);
    await programme.save();
    res.status(201).json(programme);
  } catch (error: any) {
    console.error('Erreur création programme:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Un programme avec ce code existe déjà' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un programme
router.put('/:id', async (req, res) => {
  try {
    const programme = await Programme.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!programme) {
      return res.status(404).json({ error: 'Programme non trouvé' });
    }
    
    res.json(programme);
  } catch (error) {
    console.error('Erreur mise à jour programme:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un programme
router.delete('/:id', async (req, res) => {
  try {
    const programme = await Programme.findByIdAndDelete(req.params.id);
    
    if (!programme) {
      return res.status(404).json({ error: 'Programme non trouvé' });
    }
    
    res.json({ message: 'Programme supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression programme:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
