import { connection } from 'next/server'
import { db } from '@/lib/server/supabase'

/* GET /api/admin/export — CSV con los suscriptores confirmados (protegido por proxy.ts). */
export async function GET() {
  await connection()
  const { data, error } = await db()
    .from('subscribers')
    .select('email, name, source, confirmed_at')
    .eq('status', 'confirmed')
    .order('confirmed_at', { ascending: false })
  if (error) return new Response('Error', { status: 500 })

  const rows = (data ?? []).filter(s => !/@resend\.dev$/i.test(s.email) && s.source !== 'test')
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = ['correo,nombre,origen,confirmado', ...rows.map(r => [r.email, r.name, r.source, r.confirmed_at].map(cell).join(','))].join('\n')

  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="suscriptores-rafatrujillo-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
