import 'server-only'

/* Variables de entorno del backend. Ninguna lleva prefijo NEXT_PUBLIC_,
   así que nunca llegan al navegador. Ver .env.example. */
export const env = {
  siteUrl:            process.env.SITE_URL ?? 'http://localhost:3000',
  supabaseUrl:        process.env.SUPABASE_URL ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  resendApiKey:       process.env.RESEND_API_KEY ?? '',
  resendSegmentId:    process.env.RESEND_SEGMENT_ID ?? '',
  emailFrom:          process.env.EMAIL_FROM ?? 'rafatrujillo <onboarding@resend.dev>',
  emailReplyTo:       process.env.EMAIL_REPLY_TO ?? '',
  ipHashSalt:         process.env.IP_HASH_SALT ?? 'dev-salt',
  cronSecret:         process.env.CRON_SECRET ?? '',
  contactEmail:       process.env.CONTACT_EMAIL ?? '',   // destino del formulario de booking
  adminPassword:      process.env.ADMIN_PASSWORD ?? '',  // acceso al panel /admin
}

export const isDbConfigured    = () => Boolean(env.supabaseUrl && env.supabaseServiceKey)
export const isEmailConfigured = () => Boolean(env.resendApiKey)
