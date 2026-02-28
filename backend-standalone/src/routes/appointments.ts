import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import Appointment from '../models/Appointment';
import Enrollment from '../models/Enrollment';
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

// Fonction génération token unique
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Fonction génération fichier iCalendar (.ics) pour Outlook/Gmail/Apple Calendar
function generateICalendar(appointment: any): string {
  const now = new Date();
  const dateDebut = new Date(`${appointment.dateRendezVous}T${appointment.heureRendezVous}`);
  const dateFin = new Date(dateDebut.getTime() + (appointment.duree || 60) * 60 * 1000);

  // Format iCalendar: YYYYMMDDTHHMMSSZ
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const uid = `rdv-${appointment._id}@benado.ca`;
  const dtstamp = formatDate(now);
  const dtstart = formatDate(dateDebut);
  const dtend = formatDate(dateFin);

  // Construction du fichier ICS
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Benado//Système de gestion//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${appointment.titre}`,
    `DESCRIPTION:${appointment.notes || 'Rendez-vous Benado'}\\n\\nIntervenant: ${appointment.intervenantNom}`,
    `LOCATION:${appointment.lieu || 'À confirmer'}`,
    `ORGANIZER;CN=${appointment.intervenantNom}:mailto:${process.env.SMTP_FROM}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Rappel: Rendez-vous demain',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

// Fonction envoi email confirmation
async function sendConfirmationEmail(
  appointment: any,
  participant: any,
  type: 'initial' | 'rappel48h' | 'rappel24h'
) {
  const confirmUrl = `${process.env.FRONTEND_URL}/confirmer-rdv?token=${participant.confirmationToken}`;
  
  const typeTexte = {
    'initial': 'Confirmation de votre rendez-vous',
    'rappel48h': 'Rappel : Confirmez votre rendez-vous (dans 48h)',
    'rappel24h': 'Dernier rappel : Rendez-vous demain'
  };

  const dateFormatee = new Date(appointment.dateRendezVous).toLocaleDateString('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .btn:hover { background: #5568d3; }
        .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
        .footer { text-align: center; color: #777; font-size: 12px; margin-top: 30px; }
        .calendar-notice { background: #e8f4fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 ${typeTexte[type]}</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${participant.nom}</strong>,</p>
          
          ${type === 'initial' ? `
            <p>Un rendez-vous a été planifié pour vous :</p>
          ` : type === 'rappel48h' ? `
            <p><strong>⏰ Rappel important :</strong> Votre rendez-vous aura lieu dans 48 heures.</p>
            <p>Merci de confirmer votre présence dès que possible.</p>
          ` : `
            <p><strong>🔔 Dernier rappel :</strong> Votre rendez-vous est prévu pour demain.</p>
            <p>Veuillez confirmer votre présence maintenant.</p>
          `}
          
          <div class="info-box">
            <h3 style="margin-top: 0;">📋 Détails du rendez-vous</h3>
            <p><strong>Sujet :</strong> ${appointment.titre}</p>
            <p><strong>Date :</strong> ${dateFormatee}</p>
            <p><strong>Heure :</strong> ${appointment.heureRendezVous}</p>
            <p><strong>Durée :</strong> ${appointment.duree || 60} minutes</p>
            <p><strong>Type :</strong> ${appointment.typeRendezVous === 'en_personne' ? 'En personne' : appointment.typeRendezVous === 'virtuel' ? 'Virtuel' : 'Téléphone'}</p>
            ${appointment.lieu ? `<p><strong>Lieu :</strong> ${appointment.lieu}</p>` : ''}
            <p><strong>Intervenant :</strong> ${appointment.intervenantNom}</p>
            ${appointment.notes ? `<p><strong>Notes :</strong> ${appointment.notes}</p>` : ''}
          </div>

          <div class="calendar-notice">
            <p style="margin: 0; font-weight: bold;">📆 Ajoutez ce rendez-vous à votre calendrier !</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">
              Un fichier .ics est joint à cet email. Ouvrez-le pour ajouter automatiquement le rendez-vous à 
              <strong>Outlook</strong>, <strong>Gmail</strong>, <strong>Apple Calendar</strong> ou tout autre calendrier compatible.
            </p>
          </div>

          <div style="text-align: center;">
            <a href="${confirmUrl}" class="btn">✅ Confirmer ma présence</a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            ${participant.confirme ? '✅ Vous avez déjà confirmé votre présence.' : '⚠️ Veuillez confirmer votre présence en cliquant sur le bouton ci-dessus.'}
          </p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par le système Benado.</p>
          <p>Si vous avez des questions, contactez ${appointment.intervenantNom}.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Générer le fichier .ics
  const icsContent = generateICalendar(appointment);
  const icsFilename = `rdv-benado-${appointment._id}.ics`;

  await transporter.sendMail({
    from: `Benado - Confirmation RDV <${process.env.SMTP_FROM}>`,
    to: participant.email,
    subject: typeTexte[type],
    html,
    attachments: [
      {
        filename: icsFilename,
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
      }
    ]
  });
}

// Créer un rendez-vous
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { 
      titre, 
      dateRendezVous, 
      heureRendezVous,
      duree,
      lieu,
      typeRendezVous,
      enrollmentId,
      participants,
      notes
    } = req.body;

    if (!titre || !dateRendezVous || !heureRendezVous || !enrollmentId || !participants?.length) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    // Vérifier que l'étudiant existe
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }

    // Générer tokens de confirmation pour chaque participant
    const participantsWithTokens = participants.map((p: any) => ({
      ...p,
      confirme: false,
      confirmationToken: generateToken()
    }));

    // Créer le rendez-vous
    const appointment = new Appointment({
      titre,
      dateRendezVous: new Date(dateRendezVous),
      heureRendezVous,
      duree: duree || 60,
      lieu,
      typeRendezVous: typeRendezVous || 'en_personne',
      enrollmentId,
      intervenantId: req.user!.userId,
      intervenantNom: req.user!.email,
      participants: participantsWithTokens,
      notes,
      status: 'en_attente',
      rappel48hEnvoye: false,
      rappel24hEnvoye: false
    });

    await appointment.save();

    // Envoyer emails de confirmation initiaux
    for (const participant of participantsWithTokens) {
      try {
        await sendConfirmationEmail(appointment, participant, 'initial');
      } catch (emailError) {
        console.error(`Erreur envoi email à ${participant.email}:`, emailError);
      }
    }

    res.status(201).json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Erreur création rendez-vous:', error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// Lister les rendez-vous
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { enrollmentId, status } = req.query;
    
    const filter: any = {};
    if (enrollmentId) filter.enrollmentId = enrollmentId;
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .sort({ dateRendezVous: 1 })
      .limit(100);

    res.json({ appointments });
  } catch (error) {
    console.error('Erreur récupération rendez-vous:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Récupérer un rendez-vous
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Erreur récupération rendez-vous:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Confirmer présence (via token)
router.post('/confirm/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const appointment = await Appointment.findOne({
      'participants.confirmationToken': token
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    // Mettre à jour la confirmation du participant
    const participant = appointment.participants.find(p => p.confirmationToken === token);
    if (participant) {
      participant.confirme = true;
      participant.dateConfirmation = new Date();
      
      // Si tous les participants ont confirmé, changer le statut
      const tousConfirmes = appointment.participants.every(p => p.confirme);
      if (tousConfirmes) {
        appointment.status = 'confirme';
      }
      
      await appointment.save();
    }

    res.json({
      success: true,
      message: 'Confirmation enregistrée',
      appointment
    });
  } catch (error) {
    console.error('Erreur confirmation:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation' });
  }
});

// Envoyer rappels (cron job ou manuel)
router.post('/send-reminders', async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let rappelsEnvoyes = 0;

    // Rappels 48h
    const rdv48h = await Appointment.find({
      dateRendezVous: { $gte: now, $lte: in48h },
      rappel48hEnvoye: false,
      status: { $in: ['en_attente', 'confirme'] }
    });

    for (const appointment of rdv48h) {
      for (const participant of appointment.participants) {
        if (!participant.confirme) {
          try {
            await sendConfirmationEmail(appointment, participant, 'rappel48h');
            rappelsEnvoyes++;
          } catch (error) {
            console.error(`Erreur envoi rappel 48h à ${participant.email}:`, error);
          }
        }
      }
      appointment.rappel48hEnvoye = true;
      appointment.dateRappel48h = now;
      await appointment.save();
    }

    // Rappels 24h
    const rdv24h = await Appointment.find({
      dateRendezVous: { $gte: now, $lte: in24h },
      rappel24hEnvoye: false,
      status: { $in: ['en_attente', 'confirme'] }
    });

    for (const appointment of rdv24h) {
      for (const participant of appointment.participants) {
        if (!participant.confirme) {
          try {
            await sendConfirmationEmail(appointment, participant, 'rappel24h');
            rappelsEnvoyes++;
          } catch (error) {
            console.error(`Erreur envoi rappel 24h à ${participant.email}:`, error);
          }
        }
      }
      appointment.rappel24hEnvoye = true;
      appointment.dateRappel24h = now;
      await appointment.save();
    }

    res.json({
      success: true,
      rappelsEnvoyes,
      rdv48hTraites: rdv48h.length,
      rdv24hTraites: rdv24h.length
    });
  } catch (error) {
    console.error('Erreur envoi rappels:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi des rappels' });
  }
});

// Mettre à jour un rendez-vous
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    console.error('Erreur mise à jour:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Supprimer un rendez-vous
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    res.json({ success: true, message: 'Rendez-vous supprimé' });
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Télécharger le fichier .ics pour ajout au calendrier
router.get('/:id/download-ics', async (req: AuthRequest, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    // Générer le fichier .ics
    const icsContent = generateICalendar(appointment);
    const filename = `rdv-benado-${appointment._id}.ics`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(icsContent);
  } catch (error) {
    console.error('Erreur téléchargement .ics:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du fichier' });
  }
});

export default router;
