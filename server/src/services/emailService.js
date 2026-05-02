import { Resend } from 'resend';

let resend;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export async function sendLeadNotification(lead) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@talyakobi.com',
      to: process.env.NOTIFICATION_EMAIL || 'tal@talyakobi.com',
      subject: `ליד חדש: ${lead.name}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>ליד חדש התקבל!</h2>
          <p><strong>שם:</strong> ${lead.name}</p>
          <p><strong>טלפון:</strong> ${lead.phone}</p>
          <p><strong>אימייל:</strong> ${lead.email}</p>
          <p><strong>שירות:</strong> ${lead.service}</p>
          ${lead.message ? `<p><strong>הודעה:</strong> ${lead.message}</p>` : ''}
          <p><strong>תאריך:</strong> ${new Date(lead.createdAt).toLocaleString('he-IL')}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send lead notification:', err.message);
  }
}

export async function sendAutoReply(lead) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@talyakobi.com',
      to: lead.email,
      subject: 'קיבלתי את פנייתך — טל יעקבי',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>שלום ${lead.name},</h2>
          <p>תודה על פנייתך! קיבלתי את הפרטים ואחזור אליך בהקדם.</p>
          <p>בינתיים, ניתן לפנות אלי ישירות בוואטסאפ.</p>
          <br>
          <p>בברכה,</p>
          <p><strong>טל יעקבי — צלם ווידאוגרף פרילנסר</strong></p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send auto reply:', err.message);
  }
}
