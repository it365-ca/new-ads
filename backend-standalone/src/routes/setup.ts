import express from 'express';
import bcrypt from 'bcryptjs';
import Intervenant from '../models/Intervenant';

const router = express.Router();

// Vérifier si un admin existe déjà
router.get('/check', async (req, res) => {
  try {
    const count = await Intervenant.countDocuments();
    res.json({ 
      hasAdmin: count > 0,
      totalUsers: count
    });
  } catch (error) {
    console.error('Erreur check admin:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

// Créer le premier admin (seulement si aucun utilisateur existe)
router.post('/create-first-admin', async (req, res) => {
  try {
    // Vérifier qu'aucun utilisateur n'existe déjà
    const count = await Intervenant.countDocuments();
    if (count > 0) {
      return res.status(400).json({ 
        error: 'Un administrateur existe déjà. Utilisez la page de connexion.' 
      });
    }

    const { email, nom, prenom, password, telephone, specialite } = req.body;

    // Validation
    if (!email || !nom || !prenom || !password) {
      return res.status(400).json({ 
        error: 'Email, nom, prénom et mot de passe sont requis' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Le mot de passe doit contenir au moins 8 caractères' 
      });
    }

    // Générer salt et hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Créer l'admin avec toutes les permissions
    const admin = new Intervenant({
      email: email.toLowerCase().trim(),
      nom: nom.trim(),
      prenom: prenom.trim(),
      passwordHash,
      salt,
      telephone: telephone?.trim() || '',
      specialite: specialite?.trim() || 'Administrateur système',
      actif: true,
      mustChangePassword: false,
      permissions: {
        accessNotes: true,
        accessStats: true,
        accessTickets: true,
        accessMessagerie: true,
        modifierEtudiants: true
      }
    });

    await admin.save();

    console.log('✅ Premier administrateur créé:', email);

    res.status(201).json({
      success: true,
      message: 'Administrateur créé avec succès',
      user: {
        email: admin.email,
        nom: admin.nom,
        prenom: admin.prenom
      }
    });

  } catch (error: any) {
    console.error('Erreur création admin:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Cet email existe déjà' 
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de la création de l\'administrateur' 
    });
  }
});

export default router;
