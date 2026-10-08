# rafatrujillo-web · Plan de backend, métricas y despliegue

Estado al 7 de octubre de 2026. Arquitectura: **todo el backend vive en Vercel** (route handlers de Next.js + Cron). Supabase es solo la base de datos y Resend solo el envío de correo. Ningún secreto llega al navegador.

```
Navegador ──► Vercel (Next.js 16)
               ├─ /              página estática (CDN)
               ├─ /suscripcion   confirmar / darse de baja
               ├─ /api/subscribe            POST  alta + correo de confirmación
               ├─ /api/subscribe/confirm    POST  doble opt-in + automatización de bienvenida
               ├─ /api/unsubscribe          POST  baja (incluye one-click de Gmail/Yahoo)
               ├─ /api/track                POST  eventos propios de métricas
               ├─ /api/cron/maintenance     GET   Vercel Cron diario
               ├─ Web Analytics + Speed Insights
               │
               ├──► Supabase (Postgres, plan gratuito)  tablas subscribers, events
               └──► Resend (plan gratuito)              correos + contactos
```

---

## 1. Plan por fases

| Fase | Qué | Estado |
|---|---|---|
| **0. Correcciones** | Letra de "Borracho y Loco", pop-up tras scroll, cursor sobre videos, Next 16.4 (vulnerabilidades críticas), código muerto | ✅ Hecho |
| **1. Backend en código** | Esquema SQL, rutas API, doble opt-in, automatización de bienvenida, rate limit, honeypot, cabeceras de seguridad, CSP, robots/sitemap | ✅ Hecho (falta conectar credenciales) |
| **2. Supabase** | Proyecto `qrgrzbkjngbgvbzesvaf` (`us-east-1`, gratuito), migración `init` aplicada, *Security Advisor* sin alertas de riesgo | ✅ Hecho (8 oct 2026) |
| **3. Resend** | Dominio `rafatrujillo.xyz` agregado (DKIM, SPF, MX de rebotes y DMARC `p=none` creados en Vercel DNS). Verificación en curso: espera a que el registro .xyz publique el dominio | ⏳ Verificando |
| **4. Vercel** | Repositorio en GitHub, variables de entorno, activar Web Analytics y Speed Insights, dominio propio, reglas de Firewall | ⏳ |
| **5. Prueba end-to-end** | Alta → correo → confirmar → bienvenida → baja one-click, en un *preview deployment* | ⏳ |
| **6. Lanzamiento** | Producción, Search Console + sitemap, monitoreo de uptime | ⏳ |
| **7. Después** | Panel de métricas privado, webhooks de Resend (aperturas/clics), broadcasts por lanzamiento | Backlog |

---

## 2. Base de datos (Supabase, plan gratuito)

Migración: `supabase/migrations/20261007000000_init.sql`

- **`subscribers`**: correo (único, sin distinguir mayúsculas), nombre, estado `pending → confirmed → unsubscribed`, tokens de confirmación y de baja, fechas de consentimiento, confirmación y bienvenida, y **hash** de IP (nunca la IP en claro).
- **`events`**: eventos de métricas con nombres en lista blanca y propiedades acotadas a 2 KB.
- Vistas **`subscriber_daily`** y **`event_daily`** para reportes.

**Seguridad:** RLS está activado en todas las tablas **sin políticas** y se revocan los permisos de `anon` y `authenticated`. Con la *anon key* no se puede leer ni escribir nada; solo el backend, que usa la `service_role`, lo hace desde Vercel. Por eso el proyecto **no usa** la anon key en ningún lugar.

**Límites del plan gratuito a tener en cuenta:** 500 MB de base de datos (sobra para este uso) y **pausa tras 7 días sin actividad**. El cron diario hace consultas y mantiene el proyecto activo.

---

## 3. Correo y automatización (Resend + Vercel)

Flujo con **doble opt-in**, que es la mejor práctica para entregabilidad y consentimiento:

1. La persona se suscribe (pop-up o formulario). `POST /api/subscribe` valida los datos, aplica el rate limit (5 por IP por hora) y el honeypot, guarda el registro como `pending` y envía el **correo de confirmación**.
2. El enlace abre `/suscripcion?accion=confirmar&token=…`, donde la persona pulsa **Confirmar**. Es un POST a propósito: los escáneres de enlaces de Outlook o Gmail no pueden confirmar solos.
3. `POST /api/subscribe/confirm` marca el registro como `confirmed` y, **después de responder** (`after()` de Next), ejecuta la **automatización**:
   - envía el correo de **bienvenida** (último lanzamiento, Spotify, video, Instagram);
   - sincroniza el contacto con Resend (segmento), para enviar *Broadcasts* desde su panel;
   - registra el evento `subscribe_confirmed`.
4. Baja: el enlace del pie de cada correo y la cabecera `List-Unsubscribe` one-click (RFC 8058, exigida por Gmail y Yahoo) llegan a `POST /api/unsubscribe`, que también marca el contacto como dado de baja en Resend.
5. El **cron diario** (`/api/cron/maintenance`, 08:00 UTC) borra los pendientes sin confirmar después de 14 días y los eventos de más de 13 meses.

> **Sí, la automatización queda alojada en Vercel**: son las rutas `/api/subscribe/confirm` (trigger por evento) y `/api/cron/maintenance` (trigger por horario). No se necesita Zapier, n8n ni Edge Functions de Supabase.

**Requisito de Resend:** sin dominio verificado, el remitente `onboarding@resend.dev` **solo entrega a tu propio correo**. Para producción necesitas un dominio (p. ej. `rafatrujillo.com`) con los registros DNS que Resend indique. Verifica en resend.com/pricing la cuota vigente del plan gratuito (correos por día y por mes, y contactos).

Próximas automatizaciones posibles, todas en Vercel:
- `/api/webhooks/resend`: registrar entregas, aperturas, clics y rebotes en `events`, y dar de baja automáticamente a los rebotes duros.
- Correo automático de "nuevo lanzamiento" a confirmados (broadcast de Resend disparado desde un cron o un botón del panel).

---

## 4. Arquitectura de métricas

| Capa | Herramienta | Qué mide | Costo |
|---|---|---|---|
| Tráfico | **Vercel Web Analytics** (`<Analytics />`) | Visitas, páginas, referentes, países, dispositivos | Incluido (Hobby con cuota mensual) |
| Rendimiento | **Vercel Speed Insights** (`<SpeedInsights />`) | Core Web Vitals reales (LCP, INP, CLS) | Incluido (Hobby limitado) |
| Producto / embudo | **Eventos propios → Supabase** (`lib/analytics.ts` → `/api/track` → `events`) | Ver la tabla de abajo | Gratis |
| Correo | Resend (panel y, más adelante, webhooks) | Entregas, aperturas, clics, rebotes | Gratis |
| SEO | Google Search Console + `sitemap.xml` | Búsquedas, posiciones, indexación | Gratis |
| Plataformas | Spotify for Artists, YouTube Studio | Escuchas y vistas | Gratis |

Eventos instrumentados (catálogo en `lib/analytics-events.ts`):
`page_view`, `scroll_depth` (25/50/75/100), `section_view`, `subscribe_view`, `subscribe_submit`, `subscribe_success`, `subscribe_error`, `popup_dismiss`, `video_play`, `lyrics_open`, `credits_open` y `outbound_click` (Spotify, Apple, YouTube, Instagram, con la sección de origen).

- Sin cookies: la sesión anónima vive en `sessionStorage`, así que no hace falta banner de cookies.
- Los eventos personalizados de Vercel Analytics requieren el plan **Pro**. Por eso los eventos se guardan también en Supabase; en Hobby, Vercel los ignora sin dar error.

Consultas útiles (SQL Editor de Supabase):
```sql
-- Embudo de suscripción, últimos 30 días
select name, count(*) from events
where created_at > now() - interval '30 days'
  and name in ('subscribe_view','subscribe_submit','subscribe_success','subscribe_confirmed')
group by name;

-- Plataforma más clicada
select props->>'platform' as plataforma, count(*) from events
where name = 'outbound_click' group by 1 order by 2 desc;

-- Videos más reproducidos
select props->>'title' as video, count(*) from events
where name = 'video_play' group by 1 order by 2 desc;
```

---

## 5. Guía para aprovechar Vercel al máximo

**Ya configurado en el código**
- Route handlers como backend y `after()` para tareas en segundo plano.
- **Vercel Cron** (`vercel.json`). En Hobby solo se permite una ejecución diaria, que es la que usamos.
- Región de funciones `iad1`, junto a Supabase `us-east-1`, para baja latencia a la base de datos.
- Cabeceras de seguridad y CSP (`next.config.ts`), `robots.txt` y `sitemap.xml`.
- Web Analytics y Speed Insights.

**Configurar en el panel de Vercel**
1. **Git**: conectar el repositorio de GitHub. Cada PR genera un *Preview Deployment* con URL propia, para probar antes de producción.
2. **Integraciones del Marketplace**: *Supabase* y *Resend* existen como integraciones nativas que crean las variables de entorno automáticamente y las mantienen sincronizadas. Es la forma recomendada de "centralizar en Vercel".
3. **Environment Variables**: las de `.env.example`, separadas por entorno (Production y Preview). `CRON_SECRET` es obligatoria para que el cron funcione.
4. **Analytics** y **Speed Insights**: activarlos en la pestaña del proyecto; el código ya está listo.
5. **Firewall**:
   - activar *Bot Protection*;
   - crear una regla de **rate limit** para `/api/subscribe` y `/api/track` (por ejemplo, 20 peticiones por minuto por IP), como segunda capa del límite que ya hace el código.
6. **Domains**: conectar el dominio propio y redirigir `www` al dominio raíz. Después actualizar `SITE_URL` y `metadataBase` en `app/layout.tsx`.
7. **Deployment Protection**: proteger los *previews* con Vercel Authentication.
8. **Observability y Logs**: revisar los errores de las rutas API (`console.error` con los prefijos `[subscribe]` y `[confirm]`).
9. **Rolling back**: si un despliegue falla, *Instant Rollback* desde el panel.

> ⚠️ **Plan Hobby = uso personal y no comercial.** Si la web vende entradas o merchandising, o la gestiona un equipo o sello, corresponde el plan **Pro** (USD 20 al mes por usuario), que además desbloquea eventos personalizados, más ejecuciones de cron, log drains y más cuota de Analytics.

---

## 6. Herramientas complementarias recomendadas

| Necesidad | Herramienta | Por qué |
|---|---|---|
| Repositorio y CI | **GitHub** + Dependabot | Previews automáticos en Vercel y alertas de vulnerabilidades (Next 16.2.6 tenía varias críticas) |
| Errores en producción | **Sentry** (plan gratuito) | Errores de cliente y servidor con contexto |
| Rate limit distribuido | **Upstash Redis** (Marketplace de Vercel, gratis) | Si el tráfico crece, reemplaza el rate limit basado en la base de datos |
| Disponibilidad | **Better Stack** o **UptimeRobot** (gratis) | Alerta si la web o `/api/subscribe` se caen |
| SEO | **Google Search Console** | Enviar `sitemap.xml` y ver cómo encuentran la web |
| DNS del dominio | El proveedor del dominio o **Cloudflare** (solo DNS) | Necesario para verificar el dominio en Resend |
| Analítica avanzada (opcional) | **PostHog** (plan gratuito amplio) | Si más adelante quieren embudos visuales y grabaciones de sesión sin pagar Vercel Pro |

---

## 7. Checklist antes del despliegue

- [x] Conectar el MCP de Supabase, crear el proyecto y aplicar la migración.
- [x] Ejecutar el *Security Advisor* de Supabase (solo avisos informativos esperados).
- [x] Dominio `rafatrujillo.xyz` comprado en Vercel; registros de Resend creados; `EMAIL_FROM=hola@rafatrujillo.xyz` en producción.
- [ ] ⚠️ Activar la **renovación automática** del dominio en Vercel (está desactivada; vence el 8 oct 2027).
- [ ] Confirmar que Resend marque el dominio como *verified*.
- [x] Variables cargadas en Vercel (Production; las secretas como *sensitive*).
- [ ] Asignar `rafatrujillo.xyz` (+ `www` → redirect) al proyecto al momento de desplegar.
- [ ] En el preview: suscribirse, confirmar, recibir la bienvenida y darse de baja.
- [x] Instagram correcto: `@rafatrujillomusic` (actualizado en la web).
- [ ] Añadir un aviso de privacidad breve (qué datos se guardan y cómo darse de baja).
- [ ] Activar Analytics, Speed Insights y el Firewall en Vercel.
- [ ] Enviar el sitemap a Search Console.

## 8. Variables de entorno

Ver `.env.example`. Ninguna lleva el prefijo `NEXT_PUBLIC_`.

| Variable | Origen |
|---|---|
| `SITE_URL` | URL de producción |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (o la integración del Marketplace) |
| `RESEND_API_KEY`, `RESEND_SEGMENT_ID` | Resend |
| `EMAIL_FROM`, `EMAIL_REPLY_TO` | Dominio verificado en Resend |
| `IP_HASH_SALT`, `CRON_SECRET` | `openssl rand -hex 32` |
