/* Sube ANTHROPIC_API_KEY de .env.local al Worker de Cloudflare (rafa-admin-services)
   como secreto. Nunca imprime la llave. Uso: npm run ai:key */
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '..')
const line = fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/).find(l => l.startsWith('ANTHROPIC_API_KEY='))
const key = (line ?? '').slice('ANTHROPIC_API_KEY='.length).trim().replace(/^["']|["']$/g, '')

if (!key) { console.error('✗ ANTHROPIC_API_KEY está vacía en .env.local. Pega la llave después del "=" y vuelve a ejecutar.'); process.exit(1) }
if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key)) { console.error('✗ La llave no tiene el formato esperado (empieza por "sk-ant-"). Revísala en .env.local.'); process.exit(1) }

// Comprobación rápida contra la API de Anthropic (sin gastar tokens: lista modelos)
const check = await fetch('https://api.anthropic.com/v1/models?limit=1', { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } }).catch(() => null)
if (!check) console.warn('! No se pudo verificar la llave (sin conexión). Se sube igual.')
else if (check.status === 401) { console.error('✗ Anthropic rechazó la llave (401). Genera una nueva en console.anthropic.com.'); process.exit(1) }
else if (!check.ok) console.warn(`! Anthropic respondió ${check.status}; se sube igual.`)
else console.log('✓ Llave válida en Anthropic')

const child = spawn('npx', ['wrangler', 'secret', 'put', 'ANTHROPIC_API_KEY'], {
  cwd: path.join(root, 'services', 'admin-worker'), shell: true, stdio: ['pipe', 'inherit', 'inherit'],
})
child.stdin.end(key)
child.on('exit', code => {
  if (code === 0) console.log('✓ Llave guardada en el Worker. "Redactar con IA" ya está activo en /admin → Asistente.')
  else console.error('✗ No se pudo guardar el secreto (¿sesión de wrangler vencida? ejecuta: npx wrangler login).')
  process.exit(code ?? 1)
})
