# rafatrujillo-web · Análisis de navegación y visualización

Revisión del 8 de octubre de 2026 sobre el build de producción en local, en móvil (375 px), tablet (768 px) y escritorio (1440 px).

## 1. Recorrido actual

```
Hero ─► Nuevo lanzamiento (Borracho y Loco + Mosquito Beach) ─► El artista ─► Lista de correo
     ─► Discografía (nuevo sencillo · álbum · EP · sencillos) ─► Equo ─► Videoclips ─► Footer
```
Menú: Inicio · Nuevo · Sobre · Música · Equo · Videos. Es una sola página con anclas, y el pop-up de correo aparece después del scroll.

## 2. Corregido en esta revisión

| Problema | Impacto | Solución |
|---|---|---|
| Marco blanco de unos 15 px en la foto del hero | Barras blancas a los costados | Se recortó el archivo original; la foto llena la pantalla |
| El nombre del hero esperaba a que cargara el JavaScript para aparecer | En móviles lentos, el título quedaba invisible varios segundos | Hero 100 % servidor con animaciones CSS |
| Contenido del hero desalineado en pantallas de más de 1200 px | El título quedaba pegado al borde izquierdo | Alineado al mismo contenedor que el resto de la página |
| 79 bloques animados con JavaScript (`motion`) | Más JS y trabajo de hidratación | Animaciones CSS y un único observador compartido; se eliminó la librería `motion` |
| 75 textos de menos de 11 px | Poca legibilidad en móvil | Tamaño mínimo de unos 10,5–11 px |
| Íconos y enlaces con área táctil de 16 a 28 px | Difíciles de tocar con el dedo | Áreas de 44 px (estándar WCAG/Apple) |
| "Toca cualquier canción…" bajo el título de la discografía | Instrucción lejos de donde se usa | Indicación junto a cada lista (sencillo, álbum, EP y sencillos) |
| La pista "Letra →" solo aparecía con hover | En celular nunca se veía | Visible siempre en pantallas táctiles |
| Portada del álbum cargada con prioridad máxima | Competía con la foto del hero (LCP) | Carga diferida normal |
| Menú sin Escape, sin manejo de foco | Accesibilidad con teclado | Escape, foco al abrir y cerrar, `inert` y `aria-expanded` |
| Scripts de Vercel daban error en local | Ruido en la consola | Solo se cargan en despliegues de Vercel |
| Imágenes solo en JPG/PNG | Peso | AVIF/WebP automáticos |

**Resultado:** JavaScript inicial de **648 KB → 524 KB (−19 %)**, sin scroll horizontal en ninguna resolución y 0 textos por debajo del mínimo.

### Capa de animaciones (nueva)
- **Hero:** zoom suave de la foto, el nombre aparece letra por letra y un indicador de "Scroll" (solo en escritorio).
- **Imágenes destacadas** (portadas, foto del artista, video destacado): cortina que se abre con un zoom de 1,08 a 1.
- **Títulos principales** ("Escucha y lee", "Equo", "Videoclips", "Sé el primero"): emergen desde una máscara.
- **Bloques de texto:** suben y aparecen en cascada.
- **Hover** (solo con mouse): zoom leve en portadas y subrayado que se dibuja en el enlace del hero.
- Solo se animan `transform`, `opacity` y `clip-path` (GPU, sin recalcular el layout). Con "reducir movimiento" activado, o sin JavaScript, todo se muestra estático.

## 3. Mejoras implementadas (8 oct 2026)

| # | Mejora | Implementación |
|---|---|---|
| 1 | Spotify sin iframes pesados | Los 2 iframes de la discografía se reemplazaron por botones **Reproducir** que usan un único reproductor global (`MusicPlayer`, Spotify iFrame API) cargado cuando la página está inactiva |
| — | **Canción aleatoria al abrir** | El reproductor elige una canción al azar; intenta sonar solo y, si el navegador bloquea el audio sin interacción (Chrome/Safari/Firefox lo hacen por política), arranca con el primer toque o clic. Compacto en el hero y en móvil; pausa automática al reproducir un video; si la persona lo cierra se respeta en próximas visitas |
| 2 | Aviso de privacidad | `/privacidad` y `/en/privacy` (Ley 1581 de 2012), enlazados en el formulario y el footer |
| 3 | Nuevo recorrido | Hero → Nuevo → Discografía → Videos → El artista → Equo → (Fechas) → Prensa → Lista de correo |
| 4 | Imagen para redes 1200×630 | `public/og.jpg` |
| 5 | Scrollspy y volver arriba | Sección activa resaltada en el menú; botón ↑ tras 1,5 pantallas |
| 6 | Menos repetición | "Borracho y Loco" salió de la grilla de sencillos |
| 7 | Enlace directo a letras | `/#letra-<cancion>` abre la letra; botón "Copiar enlace" en el modal |
| 8 | 404 propia | `app/not-found.tsx` |
| 9 | Prensa / EPK | Biografía corta copiable (ES/EN) y fotos descargables |
| 10 | Booking | Formulario → `/api/contact` → tabla `contact_messages` en Supabase + reenvío por correo a `CONTACT_EMAIL` |
| 11 | Fechas | Sección que aparece sola al cargar eventos en `EVENTS` (`lib/artist-data.ts`) |
| 12 | Versión en inglés | `/en` con todos los textos traducidos (`lib/i18n.ts`), hreflang, selector de idioma en menú y footer |
| 13 | Cursor opcional | Selector "Cursor clásico / animado" en el footer (escritorio) |
| 14 | Panel de métricas | `/admin` (usuario `admin` + `ADMIN_PASSWORD`, protegido en `proxy.ts`): KPIs, visitas por día, embudo, plataformas, canciones, letras, videos, dispositivos, países y últimos mensajes |

### Pendiente de decisión
- **`CONTACT_EMAIL`**: correo que recibirá los mensajes de booking (mientras tanto se guardan en Supabase y se ven en `/admin`).
- **CSP con `unsafe-eval`**: lo exige la Spotify iFrame API oficial. Alternativa sin `eval`: controlar el embed por mensajes no documentados (más frágil).
- Correos de confirmación/bienvenida solo en español (los suscriptores desde `/en` quedan marcados con `source = popup-en / inline-en` para una versión en inglés futura).

## 4. Auditoría previa al despliegue (ronda 3)

**Errores encontrados y corregidos**
| Problema | Impacto | Solución |
|---|---|---|
| El pop-up de suscripción no aparecía nunca | Se perdía la captación de correos | El menú (siempre presente, oculto) tenía `role="dialog"` y bloqueaba al pop-up; ahora solo bloquean diálogos visibles |
| Ícono del sitio = triángulo genérico de Vercel | Pestaña, favoritos y Google sin marca | Monograma "rt" estilo máquina de escribir: `favicon.ico`, `icon.png`, `apple-icon.png` |
| Animaciones de scroll congeladas | Parallax/derivas no se movían | Contenedores con `overflow: hidden` actuaban como "scroll container"; cambiados a `overflow: clip` |
| Foco de teclado escapaba de los modales | Accesibilidad | `useFocusTrap` en letras y pop-up |
| Barra del navegador móvil blanca | Estética en celular | `theme-color: #0a0a0a` |
| "Contacto" en el menú llevaba a la lista de correo | Confusión con Booking | Renombrado a "Suscríbete / Subscribe" |
| Datos estructurados mínimos | SEO | `MusicGroup` + álbumes, integrante, videos y servicios |

**Cambios pedidos**
- Fotos de prensa eliminadas (queda la biografía corta copiable).
- **Toque/clic (móvil y escritorio):** onda que nace en el punto de contacto (botones, canciones, portadas, tarjetas), presión `scale(0.95)` y vibración corta en Android al reproducir.
- **Scroll en móvil:** barra de progreso dorada arriba, foto del hero en parallax, texto del hero que se desvanece, textos de fondo con deriva, portada con parallax.
- **Textos destacados:** frases clave aparecen palabra por palabra (desenfoque → nítido) y las palabras en acento se subrayan solas.
- **Parallax:** dos bandas a pantalla completa — sesión 2025 con "Cada canción funciona también como una escena…" (antes de *El artista*) y estudio 2024 con "Del home studio a la pantalla…" (antes de *Booking*). CSS scroll-driven con fallback JS para iOS antiguos.

**Verificado:** 64 bloques animados se revelan todos al recorrer la página, 0 violaciones de CSP, JS inicial 563 KB.
