import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Intervenant from '../models/Intervenant';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Chercher l'intervenant
    const intervenant = await Intervenant.findOne({ email, actif: true });
    if (!intervenant) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, intervenant.passwordHash || '');
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Créer le token JWT
    const token = jwt.sign(
      {
        userId: intervenant._id,
        email: intervenant.email,
        permissions: intervenant.permissions
      },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      success: true,
      token,
      mustChangePassword: intervenant.mustChangePassword || false,
      user: {
        userId: intervenant._id,
        email: intervenant.email,
        nom: intervenant.nom,
        prenom: intervenant.prenom,
        permissions: intervenant.permissions
      }
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Vérifier session
router.post('/verify', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as any;
    const intervenant = await Intervenant.findById(decoded.userId);
    
    if (!intervenant || !intervenant.actif) {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      user: {
        userId: intervenant._id,
        email: intervenant.email,
        nom: intervenant.nom,
        prenom: intervenant.prenom,
        permissions: intervenant.permissions
      }
    });
  } catch (error) {
    res.json({ valid: false });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Vérifier le token de reset
    const intervenant = await Intervenant.findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!intervenant) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

    // Hash nouveau mot de passe
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    intervenant.passwordHash = passwordHash;
    intervenant.resetToken = undefined;
    intervenant.resetTokenExpiry = undefined;
    intervenant.mustChangePassword = false;
    
    await intervenant.save();

    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

export default router;
