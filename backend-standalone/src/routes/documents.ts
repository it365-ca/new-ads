import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Configuration multer pour upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Type de fichier non autorisé'));
  }
});

router.use(authenticateToken);

// Upload fichiers
router.post('/upload', upload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const uploadedFiles = files.map(file => ({
      fileName: file.originalname,
      fileUrl: `${process.env.API_URL}/uploads/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype
    }));

    res.json(uploadedFiles);
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// Supprimer fichiers
router.post('/delete', async (req: AuthRequest, res) => {
  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'URLs manquantes' });
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    
    for (const url of urls) {
      const filename = path.basename(url);
      const filepath = path.join(uploadDir, filename);
      
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression fichiers:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;
