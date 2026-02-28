import express from 'express';
import nodemailer from 'nodemailer';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Configuration transporter email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

router.use(authenticateToken);

// Envoyer email
router.post('/send', async (req: AuthRequest, res) => {
  try {
    const { to, subject, html, text, fromName, replyTo } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const mailOptions = {
      from: fromName 
        ? `${fromName} <${process.env.SMTP_FROM}>` 
        : process.env.SMTP_FROM,
      to,
      subject,
      html,
      text,
      replyTo: replyTo || process.env.SMTP_FROM
    };

    const info = await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Erreur envoi email:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi' });
  }
});

export default router;
