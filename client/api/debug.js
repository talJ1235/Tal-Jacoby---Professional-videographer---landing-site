export default function handler(req, res) {
  res.json({
    hasResendKey:     !!process.env.RESEND_API_KEY,
    hasDatabase:      !!process.env.DATABASE_URL,
    hasAdminSecret:   !!process.env.ADMIN_SECRET,
    notificationEmail: process.env.NOTIFICATION_EMAIL || 'NOT SET',
    resendFrom:       process.env.RESEND_FROM        || 'NOT SET',
  });
}
