# 🏆 La Polla de la Familia — FIFA World Cup 2026

## Stack
- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** React 18 (CDN) + Babel Standalone
- **AI:** Claude claude-sonnet-4-20250514 (Pelé IA)
- **Auth:** Google OAuth (GSI) + JWT + bcrypt (admin)
- **WhatsApp:** Twilio
- **Deploy:** Render.com

## Variables de entorno (Render → Settings → Environment)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Automático desde Render PostgreSQL |
| `JWT_SECRET` | Automático (generateValue: true) |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `ADMIN_EMAIL` | Tu correo de admin |
| `ADMIN_PASSWORD` | Tu contraseña de admin |
| `TWILIO_ACCOUNT_SID` | Twilio Console |
| `TWILIO_AUTH_TOKEN` | Twilio Console |
| `TWILIO_WHATSAPP_FROM` | +14155238886 (sandbox) |
| `APP_URL` | https://polla2026.onrender.com |
| `FOOTBALL_API_KEY` | football-data.org (gratis) |
| `NODE_ENV` | production |

## Deploy paso a paso

### 1. Google OAuth Setup
1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Application type: **Web application**
4. Authorized JavaScript origins: `https://polla2026.onrender.com`
5. Copiar el **Client ID** (no el secret)

### 2. Deploy en Render
1. Push tu repo a GitHub bajo `gptcatolicos-droid`
2. Render → New → PostgreSQL → nombre: `polla-db` → Create
3. Render → New → Web Service → conectar tu repo
4. Build command: `npm install`
5. Start command: `npm start`
6. Pegar todas las variables de entorno
7. Deploy!

### 3. Google Client ID en el frontend
En `public/app.js` busca `YOUR_GOOGLE_CLIENT_ID` y reemplaza con tu Client ID.

O mejor: agregar al `<head>` del index.html:
```html
<script>window.__GOOGLE_CLIENT_ID__ = 'TU_CLIENT_ID_AQUI'</script>
```

### 4. Twilio WhatsApp Sandbox
1. Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. Los participantes envían el código al +1 415 523 8886
3. Agregar sus números en Admin → WhatsApp

## Estructura del torneo (104 partidos)

| Fase | Partidos | Equipos |
|---|---|---|
| Grupos (12×6) | 72 | 48 → 32 |
| Ronda de 32 | 16 | 32 → 16 |
| Octavos de Final | 8 | 16 → 8 |
| Cuartos de Final | 4 | 8 → 4 |
| Semifinales | 2 | 4 → 2 |
| Tercer Puesto | 1 | — |
| Gran Final | 1 | 2 → 1 🏆 |
| **TOTAL** | **104** | |

## Sistema de puntos

| Fase | Exacto | Ganador | Extra |
|---|---|---|---|
| Grupos | 3 | 2 | +1 |
| Ronda de 32 | 4 | 2 | +1 |
| Octavos | 5 | 3 | +1 |
| Cuartos | 6 | 3 | +1 |
| Semis | 7 | 4 | +1 |
| 3er Puesto | 5 | 3 | +1 |
| Final | 10 | 5 | +1 |

Extra: +1 si aciertas ≥1 de: amarillas, rojas, penales, goles 1T, goles 2T, MVP

## Predicciones especiales
- 🏆 Campeón: +10 pts
- 😲 Equipo sorpresa (llega a cuartos+): +3 pts
- ⭐ Balón de Oro: +5 pts
- 🧤 Guante de Oro: +5 pts
- 👟 Bota de Oro: +5 pts

## Admin
- `ADMIN_EMAIL` + `ADMIN_PASSWORD` → login en /auth → click "Acceso Admin"
- Activar avatares: Admin → Usuarios → Confirmar pago
- Ingresar resultados: Admin → Resultados → seleccionar partido → guardar
- Los puntos se recalculan automáticamente al guardar cada resultado
