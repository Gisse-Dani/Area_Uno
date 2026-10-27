const nodemailer = require('nodemailer');

const MAX_BODY_SIZE = 12000;
const REASONS = new Set([
  'Equipamiento / Cotización',
  'Analítica & Procesos',
  'Proyectos Digitales',
  'Eventos / Invitaciones digitales',
  'Shop / Productos recomendados',
  'Consulta general'
]);

function clean(value, max = 3000) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || '').trim());
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > MAX_BODY_SIZE) return res.status(413).json({ error: 'La consulta es demasiado extensa.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const name = clean(body.name, 100);
  const email = clean(body.email, 160).toLowerCase();
  const emailConfirm = clean(body.emailConfirm, 160).toLowerCase();
  const reason = clean(body.reason, 100);
  const message = clean(body.message, 3000);
  const honeypot = clean(body.website, 200);
  const region = String(body.region || 'ar').toLowerCase() === 'cl' ? 'cl' : 'ar';
  const regionName = region === 'cl' ? 'Chile' : 'Argentina';

  if (honeypot) return res.status(200).json({ ok: true });
  if (!validEmail(email) || email !== emailConfirm) return res.status(400).json({ error: 'El correo electrónico no es válido o no coincide.' });
  if (!REASONS.has(reason)) return res.status(400).json({ error: region === 'cl' ? 'Selecciona un motivo de consulta válido.' : 'Seleccioná un motivo de consulta válido.' });
  if (region === 'cl' && reason === 'Shop / Productos recomendados') return res.status(400).json({ error: 'Área 1 Shop está disponible únicamente en Argentina.' });
  if (message.length < 10) return res.status(400).json({ error: 'La consulta es demasiado breve.' });

  const suffix = region.toUpperCase();
  const vertical = reason === 'Equipamiento / Cotización' ? 'EQUIPMENT'
    : reason === 'Analítica & Procesos' ? 'ANALYTICS'
    : reason === 'Proyectos Digitales' || reason === 'Eventos / Invitaciones digitales' ? 'PROJECTS'
    : reason === 'Shop / Productos recomendados' ? 'SHOP'
    : 'GENERAL';
  const gmailUser = process.env[`GMAIL_USER_${suffix}`] || process.env.GMAIL_USER;
  const gmailAppPassword = process.env[`GMAIL_APP_PASSWORD_${suffix}`] || process.env.GMAIL_APP_PASSWORD;
  const defaultRecipient = region === 'cl' ? 'areaunocl@gmail.com' : '';
  const recipient = process.env[`CONTACT_RECIPIENT_${vertical}_${suffix}`]
    || process.env[`CONTACT_RECIPIENT_${suffix}`]
    || (region === 'ar' ? process.env.CONTACT_RECIPIENT : '')
    || defaultRecipient
    || gmailUser;

  if (!gmailUser || !gmailAppPassword || !recipient) {
    console.error('Contact form environment variables are not configured.');
    return res.status(503).json({ error: region === 'cl' ? 'El formulario todavía no está habilitado para Chile. Intenta nuevamente más tarde.' : 'El formulario todavía no está habilitado. Podés escribirnos por WhatsApp.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailAppPassword }
  });

  const safeName = escapeHtml(name || 'Sin nombre informado');
  const safeEmail = escapeHtml(email);
  const safeReason = escapeHtml(reason);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  const receivedAt = new Intl.DateTimeFormat(region === 'cl' ? 'es-CL' : 'es-AR', { dateStyle: 'full', timeStyle: 'short', timeZone: region === 'cl' ? 'America/Santiago' : 'America/Argentina/Buenos_Aires' }).format(new Date());

  try {
    await transporter.sendMail({
      from: `Área 1 Web <${gmailUser}>`,
      to: recipient,
      replyTo: email,
      subject: `[Área 1 ${regionName}] ${reason}`,
      text: `Nueva consulta desde Area 1 - ${regionName}\n\nRegión: ${regionName}\nMotivo: ${reason}\nNombre / empresa: ${name || 'Sin informar'}\nCorreo de respuesta: ${email}\nFecha: ${receivedAt}\n\nConsulta:\n${message}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#122033;line-height:1.55;max-width:680px;margin:auto">
          <div style="padding:22px 26px;background:#07182e;color:white;border-radius:16px 16px 0 0">
            <div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#82cfff">Nueva consulta web</div>
            <h1 style="font-size:22px;margin:6px 0 0">Área 1 · ${escapeHtml(regionName)}</h1>
          </div>
          <div style="padding:26px;border:1px solid #dfe7ef;border-top:0;border-radius:0 0 16px 16px">
            <p><strong>Región:</strong> ${escapeHtml(regionName)}</p>
            <p><strong>Motivo:</strong> ${safeReason}</p>
            <p><strong>Nombre / empresa:</strong> ${safeName}</p>
            <p><strong>Correo de respuesta:</strong> ${safeEmail}</p>
            <p><strong>Fecha:</strong> ${escapeHtml(receivedAt)}</p>
            <hr style="border:0;border-top:1px solid #e6edf4;margin:24px 0">
            <p style="margin-bottom:8px"><strong>Consulta:</strong></p>
            <div style="padding:16px;background:#f5f8fb;border-radius:12px">${safeMessage}</div>
          </div>
        </div>`
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact form mail error:', error && error.message ? error.message : error);
    return res.status(500).json({ error: region === 'cl' ? 'No pudimos enviar la consulta en este momento. Intenta nuevamente desde el formulario.' : 'No pudimos enviar la consulta en este momento. Probá nuevamente o escribinos por WhatsApp.' });
  }
};
