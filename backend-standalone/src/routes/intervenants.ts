import express from 'express';
import bcrypt from 'bcryptjs';
import Intervenant from '../models/Intervenant';
import { authenticateToken, AuthRequest, checkPermission } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

// Liste des intervenants
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { actif } = req.query;
    
    const filter: any = {};
    if (actif !== undefined) filter.actif = actif === 'true';

    const intervenants = await Intervenant.find(filter)
      .select('-passwordHash -resetToken -resetTokenExpiry')
      .sort({ nom: 1, prenom: 1 });
    
    res.json({
      list: intervenants,
      total: intervenants.length
    });
  } catch (error) {
    console.error('Erreur liste intervenants:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Get un intervenant
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const intervenant = await Intervenant.findById(req.params.id)
      .select('-passwordHash -resetToken -resetTokenExpiry');
      
    if (!intervenant) {
      return res.status(404).json({ error: 'Intervenant non trouvé' });
    }
    res.json(intervenant);
  } catch (error) {
    console.error('Erreur get intervenant:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Créer intervenant (admin only)
router.post('/', checkPermission('gererIntervenants'), async (req: AuthRequest, res) => {
  try {
    const { email, password, nom, prenom, permissions } = req.body;

    // Vérifier si email existe déjà
    const existing = await Intervenant.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const intervenant = new Intervenant({
      email,
      passwordHash: hashedPassword,
      nom,
      prenom,
      permissions,
      mustChangePassword: true,
      actif: true
    });

    await intervenant.save();
    
    const result = intervenant.toObject();
    const { passwordHash: _, ...safeResult } = result;
    
    res.status(201).json(safeResult);
  } catch (error) {
    console.error('Erreur création intervenant:', error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// Modifier intervenant
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const updates = { ...req.body };
    delete updates.passwordHash; // Ne pas permettre modification directe du password
    
    const intervenant = await Intervenant.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    if (!intervenant) {
      return res.status(404).json({ error: 'Intervenant non trouvé' });
    }
    
    res.json(intervenant);
  } catch (error) {
    console.error('Erreur modification intervenant:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// Changer mot de passe
router.post('/:id/change-password', async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const intervenant = await Intervenant.findById(req.params.id);
    
    if (!intervenant || !intervenant.passwordHash) {
      return res.status(404).json({ error: 'Intervenant non trouvé' });
    }

    // Vérifier mot de passe actuel
    const isValid = await bcrypt.compare(currentPassword, intervenant.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hash nouveau mot de passe
    intervenant.passwordHash = await bcrypt.hash(newPassword, 10);
    intervenant.mustChangePassword = false;
    
    await intervenant.save();

    res.json({ success: true, message: 'Mot de passe modifié' });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ error: 'Erreur lors du changement' });
  }
});

export default router;
