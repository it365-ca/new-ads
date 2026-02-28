import express from 'express';
import { Client } from '@microsoft/microsoft-graph-client';
import { google } from 'googleapis';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import Intervenant from '../models/Intervenant';
import Appointment from '../models/Appointment';

const router = express.Router();

router.use(authenticateToken);

// ==================== MICROSOFT OAUTH ====================

// Initier la connexion Microsoft
router.get('/connect/microsoft', async (req: AuthRequest, res) => {
  try {
    const redirectUri = `${process.env.BACKEND_URL}/api/calendar/callback/microsoft`;
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ error: 'Configuration Microsoft manquante' });
    }

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_mode=query` +
      `&scope=${encodeURIComponent('Calendars.ReadWrite offline_access')}` +
      `&state=${req.user!.userId}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Erreur connexion Microsoft:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Callback Microsoft OAuth
router.get('/callback/microsoft', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    // Échanger le code contre un token
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code: code as string,
        redirect_uri: `${process.env.BACKEND_URL}/api/calendar/callback/microsoft`,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Token non reçu');
    }

    // Mettre à jour l'intervenant
    await Intervenant.findByIdAndUpdate(userId, {
      calendarSync: {
        provider: 'microsoft',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        enabled: true,
        lastSync: new Date()
      }
    });

    // Synchroniser les RDV existants
    await syncAppointmentsToCalendar(userId as string, 'microsoft');

    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar=success`);
  } catch (error) {
    console.error('Erreur callback Microsoft:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar=error`);
  }
});

// ==================== GOOGLE OAUTH ====================

// Initier la connexion Google
router.get('/connect/google', async (req: AuthRequest, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BACKEND_URL}/api/calendar/callback/google`
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: req.user!.userId
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Erreur connexion Google:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Callback Google OAuth
router.get('/callback/google', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BACKEND_URL}/api/calendar/callback/google`
    );

    const { tokens } = await oauth2Client.getToken(code as string);

    if (!tokens.access_token) {
      throw new Error('Token non reçu');
    }

    // Mettre à jour l'intervenant
    await Intervenant.findByIdAndUpdate(userId, {
      calendarSync: {
        provider: 'google',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        calendarId: 'primary',
        enabled: true,
        lastSync: new Date()
      }
    });

    // Synchroniser les RDV existants
    await syncAppointmentsToCalendar(userId as string, 'google');

    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar=success`);
  } catch (error) {
    console.error('Erreur callback Google:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar=error`);
  }
});

// ==================== SYNCHRONISATION ====================

// Synchroniser un rendez-vous vers le calendrier externe
router.post('/sync/:appointmentId', async (req: AuthRequest, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    const intervenant = await Intervenant.findById(appointment.intervenantId);
    
    if (!intervenant?.calendarSync?.enabled) {
      return res.status(400).json({ error: 'Synchronisation calendrier non activée' });
    }

    const eventId = await syncSingleAppointment(appointment, intervenant);

    res.json({ 
      success: true, 
      eventId,
      provider: intervenant.calendarSync.provider 
    });
  } catch (error) {
    console.error('Erreur synchronisation:', error);
    res.status(500).json({ error: 'Erreur lors de la synchronisation' });
  }
});

// Désactiver la synchronisation
router.post('/disconnect', async (req: AuthRequest, res) => {
  try {
    await Intervenant.findByIdAndUpdate(req.user!.userId, {
      'calendarSync.enabled': false,
      'calendarSync.accessToken': undefined,
      'calendarSync.refreshToken': undefined
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

// Statut de synchronisation
router.get('/status', async (req: AuthRequest, res) => {
  try {
    const intervenant = await Intervenant.findById(req.user!.userId);
    
    res.json({
      enabled: intervenant?.calendarSync?.enabled || false,
      provider: intervenant?.calendarSync?.provider,
      lastSync: intervenant?.calendarSync?.lastSync
    });
  } catch (error) {
    console.error('Erreur statut:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
  }
});

// Synchronisation manuelle (force)
router.post('/sync-all', async (req: AuthRequest, res) => {
  try {
    const intervenant = await Intervenant.findById(req.user!.userId);
    
    if (!intervenant?.calendarSync?.enabled) {
      return res.status(400).json({ error: 'Synchronisation non activée' });
    }

    await syncAppointmentsToCalendar(
      req.user!.userId, 
      intervenant.calendarSync.provider
    );

    res.json({ success: true, message: 'Synchronisation complète effectuée' });
  } catch (error) {
    console.error('Erreur synchronisation manuelle:', error);
    res.status(500).json({ error: 'Erreur lors de la synchronisation' });
  }
});

// ==================== FONCTIONS HELPERS ====================

async function syncSingleAppointment(appointment: any, intervenant: any): Promise<string> {
  const provider = intervenant.calendarSync.provider;
  
  const event = {
    summary: appointment.titre,
    description: appointment.notes || 'Rendez-vous Benado',
    location: appointment.lieu || '',
    start: {
      dateTime: new Date(`${appointment.dateRendezVous}T${appointment.heureRendezVous}`).toISOString(),
      timeZone: 'America/Toronto'
    },
    end: {
      dateTime: new Date(
        new Date(`${appointment.dateRendezVous}T${appointment.heureRendezVous}`).getTime() + 
        (appointment.duree || 60) * 60 * 1000
      ).toISOString(),
      timeZone: 'America/Toronto'
    }
  };

  if (provider === 'microsoft') {
    return await syncToMicrosoft(event, intervenant);
  } else if (provider === 'google') {
    return await syncToGoogle(event, intervenant);
  }

  throw new Error('Provider non supporté');
}

async function syncToMicrosoft(event: any, intervenant: any): Promise<string> {
  const client = Client.init({
    authProvider: (done) => {
      done(null, intervenant.calendarSync.accessToken);
    }
  });

  const result = await client.api('/me/events').post(event);
  return result.id;
}

async function syncToGoogle(event: any, intervenant: any): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: intervenant.calendarSync.accessToken,
    refresh_token: intervenant.calendarSync.refreshToken
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const result = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event
  });

  return result.data.id!;
}

async function syncAppointmentsToCalendar(
  intervenantId: string, 
  provider: 'microsoft' | 'google'
): Promise<void> {
  const appointments = await Appointment.find({
    intervenantId,
    status: { $in: ['en_attente', 'confirme'] }
  });

  const intervenant = await Intervenant.findById(intervenantId);
  
  if (!intervenant) return;

  for (const appointment of appointments) {
    try {
      await syncSingleAppointment(appointment, intervenant);
    } catch (error) {
      console.error(`Erreur sync RDV ${appointment._id}:`, error);
    }
  }

  // Mettre à jour la date de dernière synchro
  intervenant.calendarSync!.lastSync = new Date();
  await intervenant.save();
}

// ==================== SYNCHRONISATION PÉRIODIQUE ====================

// Endpoint pour récupérer les changements depuis le calendrier externe
router.get('/pull-changes', async (req: AuthRequest, res) => {
  try {
    const intervenant = await Intervenant.findById(req.user!.userId);
    
    if (!intervenant?.calendarSync?.enabled) {
      return res.status(400).json({ error: 'Synchronisation non activée' });
    }

    const changes = await pullChangesFromCalendar(intervenant);

    res.json({ 
      success: true, 
      changes,
      lastSync: new Date()
    });
  } catch (error) {
    console.error('Erreur récupération changements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

async function pullChangesFromCalendar(intervenant: any): Promise<any[]> {
  const provider = intervenant.calendarSync.provider;
  const lastSync = intervenant.calendarSync.lastSync || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  if (provider === 'microsoft') {
    return await pullFromMicrosoft(intervenant, lastSync);
  } else if (provider === 'google') {
    return await pullFromGoogle(intervenant, lastSync);
  }

  return [];
}

async function pullFromMicrosoft(intervenant: any, since: Date): Promise<any[]> {
  const client = Client.init({
    authProvider: (done) => {
      done(null, intervenant.calendarSync.accessToken);
    }
  });

  const filter = `lastModifiedDateTime ge ${since.toISOString()}`;
  const events = await client.api('/me/events')
    .filter(filter)
    .select('id,subject,start,end,location,body')
    .get();

  return events.value || [];
}

async function pullFromGoogle(intervenant: any, since: Date): Promise<any[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: intervenant.calendarSync.accessToken,
    refresh_token: intervenant.calendarSync.refreshToken
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: since.toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
  });

  return response.data.items || [];
}

export default router;