'use strict'
const express = require('express')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const path = require('path')
const crypto = require('crypto')
const https = require('https')
const Anthropic = require('@anthropic-ai/sdk')
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')
const nodemailer = require('nodemailer')
const { calcPoints, calcExtraPoints } = require('./scoring')

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`
const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lapollaia.com'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TEAM_STATS_SERVER={
  'Brazil':{rank:1,notes:'Vinícius Jr., Rodrygo'},'France':{rank:2,notes:'Mbappé, campeón 2018'},
  'Argentina':{rank:3,notes:'Messi, campeón 2022'},'England':{rank:4,notes:'Bellingham, Saka'},
  'Spain':{rank:5,notes:'Yamal, Pedri'},'Portugal':{rank:6,notes:'Cristiano Ronaldo'},
  'Germany':{rank:7,notes:'Wirtz, renovados'},'Netherlands':{rank:8,notes:'De Jong, Gakpo'},
  'Belgium':{rank:9,notes:'Lukaku, De Bruyne'},'Croatia':{rank:10,notes:'Modrić, Kovačić'},
  'USA':{rank:11,notes:'Pulisic, anfitrión'},'Colombia':{rank:12,notes:'Luis Díaz, James'},
  'Morocco':{rank:13,notes:'Hakimi, semifinalistas 2022'},'Switzerland':{rank:14,notes:'Shaqiri, Xhaka'},
  'Mexico':{rank:15,notes:'Lozano, abre el torneo'},'Japan':{rank:16,notes:'Doan, Mitoma'},
  'Uruguay':{rank:18,notes:'Núñez, De Arrascaeta'},'Korea Republic':{rank:19,notes:'Son Heung-min'},
  'Senegal':{rank:20,notes:'Mané, Sarr'},'Austria':{rank:22,notes:'Sabitzer'},
  'IR Iran':{rank:22,notes:'Taremi'},'Norway':{rank:23,notes:'Haaland'},
  'Australia':{rank:24,notes:'Leckie, Rowles'},'Sweden':{rank:25,notes:'Isak, Kulusevski'},
  'Algeria':{rank:33,notes:'Mahrez'},'Tunisia':{rank:32,notes:'Msakni'},
  'Egypt':{rank:35,notes:'Salah'},'Czechia':{rank:36,notes:'Schick'},
  'Scotland':{rank:37,notes:'McTominay, Robertson'},'Canada':{rank:38,notes:'Davies'},
  'Ivory Coast':{rank:41,notes:'Haller, Zaha'},'DR Congo':{rank:44,notes:'debutante'},
  'Bosnia and Herzegovina':{rank:49,notes:'Džeko'},'Qatar':{rank:58,notes:'anfitrión 2022'},
  'Saudi Arabia':{rank:56,notes:'Al-Dawsari'},'Ecuador':{rank:31,notes:'Valencia, Caicedo'},
  'Ghana':{rank:60,notes:'Kudus'},'Iraq':{rank:62,notes:'debutante'},
  'Uzbekistan':{rank:67,notes:'debutante'},'South Africa':{rank:68,notes:'Bafana'},
  'Panama':{rank:70,notes:'segundo Mundial'},'Cape Verde':{rank:73,notes:'debutante'},
  'Jordan':{rank:74,notes:'debutante'},'Curaçao':{rank:81,notes:'debutante'},
  'Haiti':{rank:88,notes:'debutante'},'New Zealand':{rank:93,notes:'portería sólida'},
  'Turkey':{rank:29,notes:'Güler, Çalhanoğlu'},
}

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' })

// ─── EMAIL SETUP ──────────────────────────────────────────────────────────────
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT||'587'),
  secure: process.env.SMTP_SECURE==='true',
  auth: { user: process.env.SMTP_USER||'', pass: process.env.SMTP_PASS||'' }
})
async function sendMail(to, subject, html){
  if(!process.env.SMTP_USER) return console.log('Email not configured, skipping:', subject)
  try{
    await mailer.sendMail({
      from: `"La Polla IA" <${process.env.SMTP_USER}>`,
      to, subject, html
    })
    console.log('✉️ Email sent to:', to)
  }catch(e){ console.error('Email error:', e.message) }
}



app.use(express.json({ limit: '2mb' }))

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.APP_URL || 'http://localhost:3000',
  'https://lapollaia.com',
  'https://www.lapollaia.com',
  'https://lapollaia.onrender.com'
]
app.use((req,res,next)=>{
  const origin = req.headers.origin
  if(origin && ALLOWED_ORIGINS.some(o=>origin.startsWith(o))){
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials','true')
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization,x-super-key')
  }
  if(req.method==='OPTIONS'){ res.sendStatus(204); return }
  next()
})

// ─── SECURITY HEADERS ─────────────────────────────────────────────────────────
app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff')
  res.setHeader('X-Frame-Options','SAMEORIGIN')
  res.setHeader('X-XSS-Protection','1; mode=block')
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy','camera=(),microphone=(),geolocation=()')
  res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains')
  next()
})

// ─── RATE LIMITING (in-memory, no extra packages needed) ──────────────────────
const _rl = {}
function rateLimit(max, windowMs=60000){
  return (req,res,next)=>{
    const key = (req.ip||'unknown') + ':' + req.path + ':' + Math.floor(Date.now()/windowMs)
    _rl[key] = (_rl[key]||0) + 1
    if(_rl[key] > max) return res.status(429).json({error:'Demasiadas solicitudes. Intenta en un momento.'})
    next()
  }
}
// Throttle sensitive auth endpoints
const authLimit = rateLimit(20, 60000)    // 20 req/min per IP on auth
const apiLimit  = rateLimit(200, 60000)   // 200 req/min per IP on API
app.use('/api/auth', authLimit)
app.use('/api/', apiLimit)
// Clean stale rate limit keys every 5 minutes
setInterval(()=>{
  const cutoff = Math.floor(Date.now()/60000) - 2
  Object.keys(_rl).forEach(k=>{ if(parseInt(k.split(':').pop()) < cutoff) delete _rl[k] })
}, 5*60*1000)

// ─── PAYPAL HELPERS ───────────────────────────────────────────────────────────
async function paypalToken(){
  const cid=process.env.PAYPAL_CLIENT_ID||''
  const sec=process.env.PAYPAL_CLIENT_SECRET||''
  if(!cid||!sec) throw new Error('PayPal no configurado')
  const auth=Buffer.from(`${cid}:${sec}`).toString('base64')
  const body='grant_type=client_credentials'
  return new Promise((resolve,reject)=>{
    const req=https.request({hostname:'api-m.paypal.com',path:'/v1/oauth2/token',method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded','Authorization':`Basic ${auth}`,'Content-Length':Buffer.byteLength(body)}
    },res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve(JSON.parse(d).access_token)}catch(e){reject(e)}})})
    req.on('error',reject);req.write(body);req.end()
  })
}
async function paypalAPI(method,path,body,token){
  const data=body?JSON.stringify(body):undefined
  return new Promise((resolve,reject)=>{
    const req=https.request({hostname:'api-m.paypal.com',path,method,
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`,...(data?{'Content-Length':Buffer.byteLength(data)}:{})}
    },res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve({status:res.statusCode,data:JSON.parse(d)})}catch(e){resolve({status:res.statusCode,data:d})}})})
    req.on('error',reject);if(data)req.write(data);req.end()
  })
}

// ─── STATIC ───────────────────────────────────────────────────────────────────
// Serve marketing home at /
// Serve game SPA at /t/:slug
app.use(express.static(path.join(__dirname, 'public')))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// ─── DB INIT ──────────────────────────────────────────────────────────────────
async function initDb() {
  const c = await pool.connect()
  try {
    // Run migrations first — safe to run even if column already exists
    try{
      await c.query("ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE")
    }catch(e){ /* column may not exist yet if fresh DB, that's ok */ }

    await c.query(`
      -- Tournaments: one per admin who pays $3.99
      CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        owner_email TEXT NOT NULL,
        logo_url TEXT,
        primary_color TEXT DEFAULT '#F6C90E',
        inscription_fee NUMERIC DEFAULT 20,
        currency TEXT DEFAULT 'USD',
        paypal_info TEXT,
        nequi_info TEXT,
        predictions_open BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT FALSE,
        is_demo BOOLEAN DEFAULT FALSE,
        mp_payment_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Users: scoped per tournament
      CREATE TABLE IF NOT EXISTS users(
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        password_hash TEXT,
        terms_accepted BOOLEAN DEFAULT FALSE,
        terms_accepted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(email, tournament_id)
      );

      -- Avatars: linked via user (already tournament-scoped)
      CREATE TABLE IF NOT EXISTS avatars(
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        nickname TEXT NOT NULL,
        photo_url TEXT,
        is_paid BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(nickname, tournament_id)
      );

      -- Matches: GLOBAL FIFA 2026 calendar (shared by all tournaments)
      CREATE TABLE IF NOT EXISTS matches(
        id SERIAL PRIMARY KEY, match_num INTEGER NOT NULL,
        phase TEXT NOT NULL DEFAULT 'group',
        team1 TEXT, team2 TEXT, match_date TIMESTAMPTZ,
        venue TEXT, group_name TEXT, label TEXT
      );

      CREATE TABLE IF NOT EXISTS phase_locks(
        id SERIAL PRIMARY KEY,
        tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        phase TEXT NOT NULL,
        is_locked BOOLEAN DEFAULT FALSE,
        auto_lock_hours INTEGER DEFAULT 2,
        UNIQUE(tournament_id, phase)
      );

      CREATE TABLE IF NOT EXISTS predictions(
        id TEXT PRIMARY KEY,
        avatar_id TEXT NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
        match_id INTEGER NOT NULL REFERENCES matches(id),
        score_home INTEGER, score_away INTEGER, penalty_winner TEXT,
        points_earned INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(avatar_id, match_id)
      );

      CREATE TABLE IF NOT EXISTS extra_predictions(
        id TEXT PRIMARY KEY,
        avatar_id TEXT NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
        match_id INTEGER NOT NULL REFERENCES matches(id),
        yellow_cards INTEGER, red_cards INTEGER, penalties_count INTEGER,
        goals_first_half INTEGER, goals_second_half INTEGER, mvp_player TEXT,
        points_earned INTEGER DEFAULT 0,
        UNIQUE(avatar_id, match_id)
      );

      CREATE TABLE IF NOT EXISTS match_results(
        match_id INTEGER PRIMARY KEY REFERENCES matches(id),
        score_home INTEGER NOT NULL, score_away INTEGER NOT NULL,
        had_penalties BOOLEAN DEFAULT FALSE, penalty_winner TEXT,
        yellow_cards INTEGER, red_cards INTEGER, penalties_count INTEGER,
        goals_first_half INTEGER, goals_second_half INTEGER, mvp_player TEXT,
        entered_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS special_predictions(
        id TEXT PRIMARY KEY,
        avatar_id TEXT UNIQUE REFERENCES avatars(id) ON DELETE CASCADE,
        champion_team TEXT, surprise_team TEXT,
        balon_de_oro TEXT, guante_de_oro TEXT, bota_de_oro TEXT,
        champion_pts INTEGER DEFAULT 0, surprise_pts INTEGER DEFAULT 0,
        balon_pts INTEGER DEFAULT 0, guante_pts INTEGER DEFAULT 0,
        bota_pts INTEGER DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bracket_predictions(
        id TEXT PRIMARY KEY,
        avatar_id TEXT UNIQUE REFERENCES avatars(id) ON DELETE CASCADE,
        bracket JSONB NOT NULL DEFAULT '{}',
        is_ai_generated BOOLEAN DEFAULT FALSE,
        has_been_edited BOOLEAN DEFAULT FALSE,
        pts_earned INTEGER DEFAULT 0,
        locked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Trivia questions created by admin (Pelé IA assisted)
      CREATE TABLE IF NOT EXISTS trivia_questions(
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options JSONB NOT NULL DEFAULT '[]',
        correct_answer INTEGER NOT NULL,
        difficulty TEXT NOT NULL DEFAULT 'easy',
        points INTEGER NOT NULL DEFAULT 2,
        is_active BOOLEAN DEFAULT TRUE,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Trivia answers by users
      CREATE TABLE IF NOT EXISTS trivia_answers(
        id TEXT PRIMARY KEY,
        trivia_id TEXT NOT NULL REFERENCES trivia_questions(id) ON DELETE CASCADE,
        avatar_id TEXT NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
        answer_idx INTEGER NOT NULL,
        is_correct BOOLEAN NOT NULL DEFAULT FALSE,
        points_earned INTEGER NOT NULL DEFAULT 0,
        answered_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(trivia_id, avatar_id)
      );

      -- Registration bonus tracking
      CREATE TABLE IF NOT EXISTS registration_bonus(
        id TEXT PRIMARY KEY,
        avatar_id TEXT UNIQUE REFERENCES avatars(id) ON DELETE CASCADE,
        points INTEGER NOT NULL DEFAULT 20,
        awarded_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Courtesy tournaments (created by superadmin, no payment required)
      ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_courtesy BOOLEAN DEFAULT FALSE;
    `)

    const {rows:[{count}]} = await c.query('SELECT COUNT(*) FROM matches')
    if(+count===0) await seedMatches(c)

    // Auto-create demo tournament if not exists
    const {rows:[demo]}=await c.query("SELECT id FROM tournaments WHERE slug='demo'")
    if(!demo){
      const demoId='t-demo-'+crypto.randomBytes(6).toString('hex')
      await c.query(`
        INSERT INTO tournaments(id,slug,name,owner_name,owner_email,primary_color,inscription_fee,currency,is_active,is_demo,predictions_open)
        VALUES($1,'demo','Demo — La Polla IA','La Polla IA','demo@lapollaia.com','#F6C90E',0,'USD',TRUE,TRUE,TRUE)
        ON CONFLICT(slug) DO NOTHING`,[demoId])
      const phases=['group','round32','round16','quarters','semis','third','final']
      for(const ph of phases)
        await c.query('INSERT INTO phase_locks(tournament_id,phase) VALUES($1,$2) ON CONFLICT DO NOTHING',[demoId,ph])
      console.log('✅ Demo tournament created')
    }

    // Make sure demo is always active
    await c.query("UPDATE tournaments SET is_active=TRUE WHERE slug='demo'")

    console.log('✅ DB multi-tenant lista')
  } finally { c.release() }
}

// ─── SEED MATCHES — CALENDARIO OFICIAL FIFA 2026 ─────────────────────────────
async function seedMatches(c) {
  const ins = (num, phase, t1, t2, date, venue, grp, label) =>
    c.query('INSERT INTO matches(match_num,phase,team1,team2,match_date,venue,group_name,label) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [num, phase, t1||null, t2||null, date, venue, grp||null, label||null])
  let n = 1
  await ins(n++,'group','Mexico','South Africa','2026-06-11T19:00:00Z','Estadio Azteca, Ciudad de México','A',null)
  await ins(n++,'group','Korea Republic','Czechia','2026-06-12T02:00:00Z','Estadio Akron, Guadalajara','A',null)
  await ins(n++,'group','Czechia','South Africa','2026-06-18T16:00:00Z','Mercedes-Benz Stadium, Atlanta','A',null)
  await ins(n++,'group','Mexico','Korea Republic','2026-06-19T01:00:00Z','Estadio Akron, Guadalajara','A',null)
  await ins(n++,'group','Czechia','Mexico','2026-06-25T01:00:00Z','Estadio Azteca, Ciudad de México','A',null)
  await ins(n++,'group','South Africa','Korea Republic','2026-06-25T01:00:00Z','Estadio BBVA, Monterrey','A',null)
  await ins(n++,'group','Canada','Bosnia and Herzegovina','2026-06-12T19:00:00Z','BMO Field, Toronto','B',null)
  await ins(n++,'group','Qatar','Switzerland','2026-06-13T19:00:00Z',"Levi's Stadium, Santa Clara",'B',null)
  await ins(n++,'group','Switzerland','Bosnia and Herzegovina','2026-06-18T19:00:00Z','SoFi Stadium, Los Ángeles','B',null)
  await ins(n++,'group','Canada','Qatar','2026-06-18T22:00:00Z','BC Place, Vancouver','B',null)
  await ins(n++,'group','Switzerland','Canada','2026-06-24T19:00:00Z','BC Place, Vancouver','B',null)
  await ins(n++,'group','Bosnia and Herzegovina','Qatar','2026-06-24T19:00:00Z','Lumen Field, Seattle','B',null)
  await ins(n++,'group','Brazil','Morocco','2026-06-13T22:00:00Z','MetLife Stadium, Nueva York/NJ','C',null)
  await ins(n++,'group','Haiti','Scotland','2026-06-14T01:00:00Z','Gillette Stadium, Boston','C',null)
  await ins(n++,'group','Scotland','Morocco','2026-06-19T22:00:00Z','Gillette Stadium, Boston','C',null)
  await ins(n++,'group','Brazil','Haiti','2026-06-20T01:00:00Z','Lincoln Financial Field, Filadelfia','C',null)
  await ins(n++,'group','Scotland','Brazil','2026-06-24T22:00:00Z','Hard Rock Stadium, Miami','C',null)
  await ins(n++,'group','Morocco','Haiti','2026-06-24T22:00:00Z','Mercedes-Benz Stadium, Atlanta','C',null)
  await ins(n++,'group','USA','Paraguay','2026-06-13T01:00:00Z','SoFi Stadium, Los Ángeles','D',null)
  await ins(n++,'group','Australia','Turkey','2026-06-13T04:00:00Z','BC Place, Vancouver','D',null)
  await ins(n++,'group','Turkey','Paraguay','2026-06-19T04:00:00Z',"Levi's Stadium, Santa Clara",'D',null)
  await ins(n++,'group','USA','Australia','2026-06-19T19:00:00Z','Lumen Field, Seattle','D',null)
  await ins(n++,'group','Turkey','USA','2026-06-26T02:00:00Z','SoFi Stadium, Los Ángeles','D',null)
  await ins(n++,'group','Paraguay','Australia','2026-06-26T02:00:00Z',"Levi's Stadium, Santa Clara",'D',null)
  await ins(n++,'group','Germany','Curaçao','2026-06-14T17:00:00Z','NRG Stadium, Houston','E',null)
  await ins(n++,'group','Ivory Coast','Ecuador','2026-06-14T23:00:00Z','Lincoln Financial Field, Filadelfia','E',null)
  await ins(n++,'group','Germany','Ivory Coast','2026-06-20T20:00:00Z','BMO Field, Toronto','E',null)
  await ins(n++,'group','Ecuador','Curaçao','2026-06-21T00:00:00Z','Arrowhead Stadium, Kansas City','E',null)
  await ins(n++,'group','Curaçao','Ivory Coast','2026-06-25T20:00:00Z','Lincoln Financial Field, Filadelfia','E',null)
  await ins(n++,'group','Ecuador','Germany','2026-06-25T20:00:00Z','MetLife Stadium, Nueva York/NJ','E',null)
  await ins(n++,'group','Netherlands','Japan','2026-06-14T20:00:00Z','AT&T Stadium, Dallas','F',null)
  await ins(n++,'group','Sweden','Tunisia','2026-06-15T02:00:00Z','Estadio BBVA, Monterrey','F',null)
  await ins(n++,'group','Netherlands','Sweden','2026-06-20T17:00:00Z','NRG Stadium, Houston','F',null)
  await ins(n++,'group','Tunisia','Japan','2026-06-20T04:00:00Z','Estadio BBVA, Monterrey','F',null)
  await ins(n++,'group','Japan','Sweden','2026-06-25T23:00:00Z','AT&T Stadium, Dallas','F',null)
  await ins(n++,'group','Tunisia','Netherlands','2026-06-25T23:00:00Z','Arrowhead Stadium, Kansas City','F',null)
  await ins(n++,'group','Belgium','Egypt','2026-06-15T19:00:00Z','Lumen Field, Seattle','G',null)
  await ins(n++,'group','IR Iran','New Zealand','2026-06-16T01:00:00Z','SoFi Stadium, Los Ángeles','G',null)
  await ins(n++,'group','Belgium','IR Iran','2026-06-21T19:00:00Z','SoFi Stadium, Los Ángeles','G',null)
  await ins(n++,'group','New Zealand','Egypt','2026-06-22T01:00:00Z','BC Place, Vancouver','G',null)
  await ins(n++,'group','Egypt','IR Iran','2026-06-27T03:00:00Z','Lumen Field, Seattle','G',null)
  await ins(n++,'group','New Zealand','Belgium','2026-06-27T03:00:00Z','BC Place, Vancouver','G',null)
  await ins(n++,'group','Spain','Cape Verde','2026-06-15T16:00:00Z','Mercedes-Benz Stadium, Atlanta','H',null)
  await ins(n++,'group','Saudi Arabia','Uruguay','2026-06-15T22:00:00Z','Hard Rock Stadium, Miami','H',null)
  await ins(n++,'group','Spain','Saudi Arabia','2026-06-21T16:00:00Z','Mercedes-Benz Stadium, Atlanta','H',null)
  await ins(n++,'group','Uruguay','Cape Verde','2026-06-21T22:00:00Z','Hard Rock Stadium, Miami','H',null)
  await ins(n++,'group','Cape Verde','Saudi Arabia','2026-06-27T00:00:00Z','NRG Stadium, Houston','H',null)
  await ins(n++,'group','Uruguay','Spain','2026-06-27T00:00:00Z','Estadio Akron, Guadalajara','H',null)
  await ins(n++,'group','France','Senegal','2026-06-16T19:00:00Z','MetLife Stadium, Nueva York/NJ','I',null)
  await ins(n++,'group','Iraq','Norway','2026-06-16T22:00:00Z','Gillette Stadium, Boston','I',null)
  await ins(n++,'group','France','Iraq','2026-06-22T21:00:00Z','Lincoln Financial Field, Filadelfia','I',null)
  await ins(n++,'group','Norway','Senegal','2026-06-23T00:00:00Z','MetLife Stadium, Nueva York/NJ','I',null)
  await ins(n++,'group','Norway','France','2026-06-26T19:00:00Z','Gillette Stadium, Boston','I',null)
  await ins(n++,'group','Senegal','Iraq','2026-06-26T19:00:00Z','BMO Field, Toronto','I',null)
  await ins(n++,'group','Argentina','Algeria','2026-06-17T01:00:00Z','Arrowhead Stadium, Kansas City','J',null)
  await ins(n++,'group','Austria','Jordan','2026-06-16T04:00:00Z',"Levi's Stadium, Santa Clara",'J',null)
  await ins(n++,'group','Argentina','Austria','2026-06-22T17:00:00Z','AT&T Stadium, Dallas','J',null)
  await ins(n++,'group','Jordan','Algeria','2026-06-23T03:00:00Z',"Levi's Stadium, Santa Clara",'J',null)
  await ins(n++,'group','Jordan','Argentina','2026-06-28T02:00:00Z','AT&T Stadium, Dallas','J',null)
  await ins(n++,'group','Algeria','Austria','2026-06-28T02:00:00Z','Arrowhead Stadium, Kansas City','J',null)
  await ins(n++,'group','Portugal','DR Congo','2026-06-17T17:00:00Z','NRG Stadium, Houston','K',null)
  await ins(n++,'group','Uzbekistan','Colombia','2026-06-18T02:00:00Z','Estadio Azteca, Ciudad de México','K',null)
  await ins(n++,'group','Portugal','Uzbekistan','2026-06-23T17:00:00Z','NRG Stadium, Houston','K',null)
  await ins(n++,'group','Colombia','DR Congo','2026-06-24T02:00:00Z','Estadio Akron, Guadalajara','K',null)
  await ins(n++,'group','Colombia','Portugal','2026-06-28T23:30:00Z','Hard Rock Stadium, Miami','K',null)
  await ins(n++,'group','DR Congo','Uzbekistan','2026-06-28T23:30:00Z','Mercedes-Benz Stadium, Atlanta','K',null)
  await ins(n++,'group','England','Croatia','2026-06-17T20:00:00Z','AT&T Stadium, Dallas','L',null)
  await ins(n++,'group','Ghana','Panama','2026-06-17T23:00:00Z','BMO Field, Toronto','L',null)
  await ins(n++,'group','England','Ghana','2026-06-23T20:00:00Z','Gillette Stadium, Boston','L',null)
  await ins(n++,'group','Panama','Croatia','2026-06-23T23:00:00Z','BMO Field, Toronto','L',null)
  await ins(n++,'group','Panama','England','2026-06-27T21:00:00Z','MetLife Stadium, Nueva York/NJ','L',null)
  await ins(n++,'group','Croatia','Ghana','2026-06-27T21:00:00Z','Lincoln Financial Field, Filadelfia','L',null)
  // Ronda 32
  for(const [label,date,venue] of [
    ['2do A vs 2do B','2026-06-28T19:00:00Z','SoFi Stadium'],['1ro C vs 2do F','2026-06-29T17:00:00Z','NRG Houston'],
    ['1ro E vs Mejor 3ro','2026-06-29T20:30:00Z','Gillette Boston'],['1ro F vs 2do C','2026-06-30T01:00:00Z','BBVA Monterrey'],
    ['2do E vs 2do I','2026-06-30T17:00:00Z','AT&T Dallas'],['1ro I vs Mejor 3ro','2026-06-30T21:00:00Z','MetLife NY'],
    ['1ro A vs Mejor 3ro','2026-07-01T01:00:00Z','Azteca México'],['1ro L vs Mejor 3ro','2026-07-01T16:00:00Z','Atlanta'],
    ['1ro G vs Mejor 3ro','2026-07-01T20:00:00Z','Seattle'],['1ro D vs Mejor 3ro','2026-07-02T00:00:00Z','Santa Clara'],
    ['1ro H vs 2do J','2026-07-02T19:00:00Z','SoFi LA'],['2do K vs 2do L','2026-07-02T23:00:00Z','Toronto'],
    ['1ro B vs Mejor 3ro','2026-07-03T03:00:00Z','Vancouver'],['2do D vs 2do G','2026-07-03T18:00:00Z','AT&T Dallas'],
    ['1ro J vs 2do H','2026-07-03T22:00:00Z','Miami'],['1ro K vs Mejor 3ro','2026-07-04T01:30:00Z','Kansas City']
  ]) await ins(n++,'round32',null,null,date,venue,null,label)
  for(let i=1;i<=8;i++) await ins(n++,'round16',null,null,`2026-07-0${4+Math.floor((i-1)/2)}T${i%2?'17':'21'}:00:00Z`,'Por definir',null,`Octavos — Partido ${i}`)
  for(let i=1;i<=4;i++) await ins(n++,'quarters',null,null,`2026-07-${9+i}T20:00:00Z`,'Por definir',null,`Cuartos — Partido ${i}`)
  await ins(n++,'semis',null,null,'2026-07-14T19:00:00Z','AT&T Stadium, Dallas',null,'Semifinal 1')
  await ins(n++,'semis',null,null,'2026-07-15T19:00:00Z','Mercedes-Benz Stadium, Atlanta',null,'Semifinal 2')
  await ins(n++,'third',null,null,'2026-07-18T21:00:00Z','Hard Rock Stadium, Miami',null,'Tercer Puesto')
  await ins(n,'final',null,null,'2026-07-19T19:00:00Z','MetLife Stadium, Nueva York/NJ',null,'🏆 GRAN FINAL')
  console.log(`✅ ${n} partidos sembrados`)
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
function auth(req,res,next){
  const token=(req.headers.authorization||'').replace('Bearer ','')
  if(!token) return res.status(401).json({error:'Token requerido'})
  try{ req.user=jwt.verify(token,JWT_SECRET); next() }
  catch{ res.status(401).json({error:'Token inválido'}) }
}
function tournamentAdmin(req,res,next){
  if(!req.user?.isAdmin) return res.status(403).json({error:'Solo administradores del torneo'})
  next()
}
function isMatchLocked(match,lockHours=2,phaseLocked=false){
  if(phaseLocked) return true
  if(!match.match_date) return false
  return Date.now()>=new Date(match.match_date).getTime()-lockHours*3600000
}
function getWinner(h,a){ return +h>+a?'home':+h<+a?'away':'draw' }

// ─── ROUTES ───────────────────────────────────────────────────────────────────
// Marketing home
app.get('/', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')))
app.get('/pele', (req,res) => res.sendFile(path.join(__dirname,'public','pele.html')))
app.get('/bracket', (req,res) => res.sendFile(path.join(__dirname,'public','bracket-demo.html')))

// Game SPA — serve app.html for all /t/:slug routes
app.get('/t/:slug', (req,res) => res.sendFile(path.join(__dirname,'public','app.html')))
app.get('/t/:slug/*', (req,res) => res.sendFile(path.join(__dirname,'public','app.html')))

// ─── MERCADOPAGO CHECKOUT ─────────────────────────────────────────────────────
app.post('/api/tournaments/create', async(req,res)=>{
  const {name,slug,adminName,email,password,inscriptionFee,currency}=req.body
  if(!name||!slug||!adminName||!email||!password)
    return res.status(400).json({error:'Todos los campos son requeridos'})
  const cleanSlug=slug.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')
  if(cleanSlug.length<3) return res.status(400).json({error:'El slug debe tener al menos 3 caracteres'})
  try{
    const {rows:[ex]}=await pool.query('SELECT id,is_active FROM tournaments WHERE slug=$1',[cleanSlug])
    // If active → truly taken
    if(ex&&ex.is_active) return res.status(400).json({error:'Ese nombre de polla ya está tomado. Elige otro.'})

    let tid
    if(ex&&!ex.is_active){
      // Pending slug — reuse it
      tid=ex.id
      const hash=await bcrypt.hash(password,10)
      await pool.query('UPDATE tournaments SET name=$1,owner_name=$2,owner_email=$3 WHERE id=$4',[name,adminName,email.toLowerCase(),tid])
      await pool.query('UPDATE users SET name=$1,email=$2,password_hash=$3 WHERE tournament_id=$4 AND is_admin=TRUE',[adminName,email.toLowerCase(),hash,tid])
    } else {
      // New slug
      tid='t-'+crypto.randomBytes(12).toString('hex')
      const hash=await bcrypt.hash(password,10)
      await pool.query(`INSERT INTO tournaments(id,slug,name,owner_name,owner_email,inscription_fee,currency,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,FALSE)`,
        [tid,cleanSlug,name,adminName,email.toLowerCase(),parseFloat(inscriptionFee)||0,currency||'USD'])
      const uid='u-'+crypto.randomBytes(12).toString('hex')
      await pool.query(`INSERT INTO users(id,tournament_id,name,email,password_hash,is_admin,terms_accepted) VALUES($1,$2,$3,$4,$5,TRUE,TRUE)`,
        [uid,tid,adminName,email.toLowerCase(),hash])
    }

    // Create MercadoPago preference
    const preference = new Preference(mp)
    const result = await preference.create({ body:{
      items:[{
        id:'lapollaia-torneo',
        title:`La Polla IA — ${name}`,
        description:`Torneo privado del Mundial 2026 · lapollaia.com/t/${cleanSlug}`,
        quantity:1,
        unit_price:3.99,
        currency_id:'USD'
      }],
      payer:{ name:adminName, email:email.toLowerCase() },
      back_urls:{
        success:`${APP_URL}/payment/success`,
        failure:`${APP_URL}/payment/failure`,
        pending:`${APP_URL}/payment/pending`
      },
      auto_return:'approved',
      external_reference:tid,
      notification_url:`${APP_URL}/api/mp/webhook`
    }})
    res.json({ initPoint: result.init_point, tournamentId: tid, slug: cleanSlug })
  }catch(e){ console.error('create tournament:',e.message); res.status(500).json({error:'Error al crear el torneo: '+e.message}) }
})

// MercadoPago webhook
app.post('/api/mp/webhook', async(req,res)=>{
  const {type,data}=req.body
  res.sendStatus(200)
  if(type==='payment'&&data?.id){
    try{
      const payment=new Payment(mp)
      const pd=await payment.get({id:data.id})
      if(pd.status==='approved'){
        const tid=pd.external_reference
        await pool.query('UPDATE tournaments SET is_active=TRUE,mp_payment_id=$1 WHERE id=$2',[data.id,tid])
        const phases=['group','round32','round16','quarters','semis','third','final']
        for(const ph of phases)
          await pool.query('INSERT INTO phase_locks(tournament_id,phase) VALUES($1,$2) ON CONFLICT DO NOTHING',[tid,ph])
        // Send confirmation email
        const {rows:[t]}=await pool.query('SELECT name,slug,owner_email,owner_name FROM tournaments WHERE id=$1',[tid])
        if(t) await sendActivationEmail(t)
        console.log(`✅ Tournament activated: ${tid}`)
      }
    }catch(e){ console.error('webhook:',e.message) }
  }
})

// Payment success redirect
app.get('/payment/success', async(req,res)=>{
  const {payment_id,external_reference,collection_status}=req.query
  if(collection_status==='approved'&&external_reference){
    try{
      await pool.query('UPDATE tournaments SET is_active=TRUE,mp_payment_id=$1 WHERE id=$2',[payment_id||'redirect',external_reference])
      const phases=['group','round32','round16','quarters','semis','third','final']
      for(const ph of phases)
        await pool.query('INSERT INTO phase_locks(tournament_id,phase) VALUES($1,$2) ON CONFLICT DO NOTHING',[external_reference,ph])
      const {rows:[t]}=await pool.query('SELECT slug,name,owner_email,owner_name FROM tournaments WHERE id=$1',[external_reference])
      if(t){
        await sendActivationEmail(t)
        return res.redirect(`/confirmacion?slug=${t.slug}&nombre=${encodeURIComponent(t.name)}`)
      }
    }catch(e){ console.error('success redirect:',e.message) }
  }
  res.redirect('/payment/failure')
})

app.get('/payment/failure', (req,res)=>{
  res.send(`<!DOCTYPE html><html><head><title>Pago fallido</title><style>body{font-family:sans-serif;text-align:center;padding:4rem;background:#0d1117;color:#fff}</style></head><body><h2>❌ El pago no se completó</h2><p>No te preocupes, tu información fue guardada. Intenta de nuevo.</p><a href="/" style="color:#F6C90E">← Volver al inicio</a></body></html>`)
})

app.get('/payment/pending', (req,res)=>{
  res.redirect('/')
})

// ─── PAYPAL CHECKOUT ──────────────────────────────────────────────────────────
// Create tournament without MP (PayPal path) — sets a server-side cookie with tournamentId
app.post('/api/tournaments/create-paypal', async(req,res)=>{
  const {name,slug,adminName,email,password}=req.body
  if(!name||!slug||!adminName||!email||!password) return res.status(400).json({error:'Datos incompletos'})
  const cleanSlug=slug.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')
  if(cleanSlug.length<3) return res.status(400).json({error:'El slug es muy corto'})
  try{
    const {rows:[ex]}=await pool.query('SELECT id,is_active,owner_email FROM tournaments WHERE slug=$1',[cleanSlug])
    if(ex&&ex.is_active) return res.status(400).json({error:'Ese nombre de polla ya está tomado. Elige otro.'})

    let tid, finalSlug=cleanSlug
    if(ex&&!ex.is_active){
      tid=ex.id
      const hash=await bcrypt.hash(password,10)
      await pool.query('UPDATE tournaments SET name=$1,owner_name=$2,owner_email=$3 WHERE id=$4',[name,adminName,email.toLowerCase(),tid])
      await pool.query('UPDATE users SET name=$1,email=$2,password_hash=$3 WHERE tournament_id=$4 AND is_admin=TRUE',[adminName,email.toLowerCase(),hash,tid])
    } else {
      tid='t-'+crypto.randomBytes(12).toString('hex')
      const hash=await bcrypt.hash(password,10)
      await pool.query(`INSERT INTO tournaments(id,slug,name,owner_name,owner_email,inscription_fee,currency,is_active) VALUES($1,$2,$3,$4,$5,0,'USD',FALSE)`,[tid,cleanSlug,name,adminName,email.toLowerCase()])
      const uid='u-'+crypto.randomBytes(12).toString('hex')
      await pool.query(`INSERT INTO users(id,tournament_id,name,email,password_hash,is_admin,terms_accepted) VALUES($1,$2,$3,$4,$5,TRUE,TRUE)`,[uid,tid,adminName,email.toLowerCase(),hash])
    }

    // Set httpOnly cookie — persists across PayPal redirect (30 min TTL)
    res.setHeader('Set-Cookie', `pp_tid=${tid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800${process.env.NODE_ENV==='production'?'; Secure':''}`)
    res.json({tournamentId:tid, slug:finalSlug})
  }catch(e){ res.status(500).json({error:e.message}) }
})

app.post('/api/paypal/create-order', async(req,res)=>{
  res.status(410).json({error:'Use hosted button redirect'})
})

app.post('/api/paypal/capture-order', async(req,res)=>{
  res.status(410).json({error:'Use /api/paypal/activate-pending'})
})

// PayPal: activate tournament — reads tournamentId from httpOnly cookie (set before redirect)
app.post('/api/paypal/activate-pending', async(req,res)=>{
  // Read cookie
  const cookies=req.headers.cookie||''
  const match=cookies.match(/pp_tid=([^;]+)/)
  const tid=match?match[1].trim():null

  if(!tid){
    // Fallback: try to find the most recent pending tournament created in last 30 min
    // (covers mobile browsers that may lose cookies)
    const {rows:[fallback]}=await pool.query(
      `SELECT id,slug,name,owner_email,owner_name FROM tournaments
       WHERE is_active=FALSE AND slug!='demo' AND created_at > NOW()-INTERVAL '30 minutes'
       ORDER BY created_at DESC LIMIT 1`)
    if(!fallback) return res.status(400).json({error:'No encontramos un pago pendiente reciente. Contacta soporte.'})

    await pool.query('UPDATE tournaments SET is_active=TRUE WHERE id=$1',[fallback.id])
    const phases=['group','round32','round16','quarters','semis','third','final']
    for(const ph of phases)
      await pool.query('INSERT INTO phase_locks(tournament_id,phase) VALUES($1,$2) ON CONFLICT DO NOTHING',[fallback.id,ph])
    await sendActivationEmail(fallback)
    // Clear cookie
    res.setHeader('Set-Cookie','pp_tid=; Path=/; Max-Age=0')
    return res.json({success:true, slug:fallback.slug, via:'fallback'})
  }

  try{
    const {rows:[t]}=await pool.query('SELECT id,slug,name,owner_email,owner_name,is_active FROM tournaments WHERE id=$1',[tid])
    if(!t) return res.status(404).json({error:'Torneo no encontrado'})
    if(!t.is_active){
      await pool.query('UPDATE tournaments SET is_active=TRUE WHERE id=$1',[tid])
      const phases=['group','round32','round16','quarters','semis','third','final']
      for(const ph of phases)
        await pool.query('INSERT INTO phase_locks(tournament_id,phase) VALUES($1,$2) ON CONFLICT DO NOTHING',[tid,ph])
      await sendActivationEmail(t)
    }
    // Clear cookie
    res.setHeader('Set-Cookie','pp_tid=; Path=/; Max-Age=0')
    res.json({success:true, slug:t.slug})
  }catch(e){ console.error('paypal activate:',e); res.status(500).json({error:e.message}) }
})

// PayPal confirmation page — activates tournament using tournamentId from sessionStorage
app.get('/confirmacionpagopaypal', async(req,res)=>{
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Pago Recibido — La Polla IA</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#0d1117;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
.card{background:#1a1f2e;border:1px solid rgba(246,201,14,.25);border-radius:20px;padding:2.5rem;max-width:500px;width:100%;text-align:center}
.icon{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1.5rem}
.icon-ok{background:rgba(22,163,74,.15);border:2px solid #16a34a}
.icon-spin{background:rgba(246,201,14,.1);border:2px solid rgba(246,201,14,.3);animation:spin 1.2s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.icon-err{background:rgba(192,57,43,.1);border:2px solid rgba(192,57,43,.3)}
h1{font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#F6C90E;letter-spacing:2px;margin-bottom:.5rem}
p{color:rgba(255,255,255,.55);font-size:14px;line-height:1.7;margin-bottom:1rem}
.note{background:rgba(246,201,14,.08);border:1px solid rgba(246,201,14,.2);border-radius:10px;padding:1rem;margin-bottom:1.5rem}
.note strong{color:#F6C90E}
.btn{display:inline-block;background:#F6C90E;color:#0d1117;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;transition:all .2s;border:none;cursor:pointer}
.btn:hover{background:#d4aa00}
.btn-outline{background:transparent;border:1.5px solid rgba(255,255,255,.2);color:rgba(255,255,255,.7);padding:10px 24px;font-size:13px}
.small{font-size:12px;color:rgba(255,255,255,.18);margin-top:1.25rem}
#status-area{display:none}
</style>
</head>
<body>

<!-- Loading state -->
<div class="card" id="card-loading">
  <div class="icon icon-spin">⏳</div>
  <h1>Activando tu Polla</h1>
  <p>Estamos confirmando tu pago con PayPal y activando tu polla.<br/>Esto toma unos segundos...</p>
</div>

<!-- Success state -->
<div class="card" id="card-ok" style="display:none">
  <div class="icon icon-ok">✅</div>
  <h1>¡Pago Confirmado!</h1>
  <p>Tu pago de <strong style="color:#F6C90E">$3.99 USD</strong> vía PayPal fue recibido y tu polla quedó activada.</p>
  <div class="note">
    <p style="margin:0"><strong>¡Ya puedes entrar a tu polla!</strong> Usa el correo y contraseña que registraste.</p>
  </div>
  <a href="/" id="btn-polla" class="btn">🏆 Ir a mi Polla →</a>
  <p class="small" id="slug-txt"></p>
</div>

<!-- Error state -->
<div class="card" id="card-err" style="display:none">
  <div class="icon icon-err">⚠️</div>
  <h1>Revisar Pago</h1>
  <p id="err-msg">Hubo un inconveniente activando tu polla automáticamente.</p>
  <div class="note">
    <p style="margin:0"><strong>Tu pago fue recibido por PayPal.</strong> Escríbenos a <strong>lapollaia.com</strong> con tu comprobante de pago y activamos tu polla manualmente en menos de 1 hora.</p>
  </div>
  <a href="/" class="btn btn-outline" style="display:inline-block">← Volver al inicio</a>
  <p class="small" id="err-detail"></p>
</div>

<script>
(async function(){
  try{
    // Cookie is read server-side — just call the endpoint
    // No sessionStorage needed — server reads the httpOnly cookie automatically
    const r = await fetch('/api/paypal/activate-pending', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include'
    })
    const d = await r.json()

    if(d.success){
      document.getElementById('card-loading').style.display='none'
      document.getElementById('card-ok').style.display='flex'
      const pollSlug = d.slug || ''
      if(pollSlug){
        document.getElementById('btn-polla').href = '/t/' + pollSlug
        document.getElementById('btn-polla').textContent = '🏆 Ir a mi Polla → lapollaia.com/t/' + pollSlug
        document.getElementById('slug-txt').textContent = 'Link: lapollaia.com/t/' + pollSlug
      }
    } else {
      throw new Error(d.error || 'Error desconocido')
    }
  } catch(e){
    document.getElementById('card-loading').style.display='none'
    document.getElementById('card-err').style.display='flex'
    document.getElementById('err-detail').textContent = 'Error técnico: ' + e.message
  }
})()
</script>
</body>
</html>`)
})

// ─── TOURNAMENT PUBLIC INFO ───────────────────────────────────────────────────
// Check slug availability — MUST be before /:slug to avoid route conflict
app.get('/api/tournaments/check/:slug', async(req,res)=>{
  const slug=req.params.slug.toLowerCase().replace(/[^a-z0-9-]/g,'-')
  const {rows:[ex]}=await pool.query('SELECT id FROM tournaments WHERE slug=$1',[slug])
  res.json({available:!ex, slug})
})

app.get('/api/tournaments/:slug', async(req,res)=>{
  try{
    const {rows:[t]}=await pool.query(
      'SELECT id,slug,name,logo_url,primary_color,is_active,is_demo,predictions_open FROM tournaments WHERE slug=$1',
      [req.params.slug]
    )
    if(!t) return res.status(404).json({error:'Polla no encontrada'})
    if(!t.is_active) return res.status(403).json({error:'Esta polla aún no está activada. El administrador debe completar el pago.'})
    res.json(t)
  }catch(e){ res.status(500).json({error:'Error'}) }
})

// ─── AUTH (tournament-scoped) ─────────────────────────────────────────────────
app.post('/api/auth/register', async(req,res)=>{
  const {name,email,password,tournamentId}=req.body
  if(!name||!email||!password||!tournamentId) return res.status(400).json({error:'Datos incompletos'})
  if(password.length<6) return res.status(400).json({error:'La contraseña debe tener al menos 6 caracteres'})
  try{
    const {rows:[t]}=await pool.query('SELECT id,is_active FROM tournaments WHERE id=$1',[tournamentId])
    if(!t||!t.is_active) return res.status(403).json({error:'Torneo no disponible'})
    const {rows:[ex]}=await pool.query('SELECT id FROM users WHERE LOWER(email)=$1 AND tournament_id=$2',[email.toLowerCase(),tournamentId])
    if(ex) return res.status(400).json({error:'Ya existe una cuenta con ese correo en esta polla'})
    const id='u-'+crypto.randomBytes(12).toString('hex')
    const hash=await bcrypt.hash(password,10)
    const {rows:[user]}=await pool.query(
      'INSERT INTO users(id,tournament_id,name,email,password_hash) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [id,tournamentId,name.trim(),email.toLowerCase(),hash]
    )
    const token=jwt.sign({id:user.id,email:user.email,isAdmin:false,tournamentId},JWT_SECRET,{expiresIn:'30d'})

    // Auto-create default avatar so user can predict immediately
    const avId='av-'+crypto.randomBytes(12).toString('hex')
    const rawNick=name.trim().split(' ')[0]
    const {rows:nickEx}=await pool.query(
      'SELECT id FROM avatars WHERE LOWER(nickname)=$1 AND tournament_id=$2',
      [rawNick.toLowerCase(),tournamentId])
    const finalNick=nickEx.length?rawNick+'_'+avId.slice(-3):rawNick
    const {rows:[autoAv]}=await pool.query(
      'INSERT INTO avatars(id,user_id,tournament_id,nickname,is_paid,is_active) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [avId,user.id,tournamentId,finalNick,true,false])

    // Award 20pt registration bonus
    const bonusId='bonus-'+crypto.randomBytes(8).toString('hex')
    await pool.query('INSERT INTO registration_bonus(id,avatar_id,points) VALUES($1,$2,20) ON CONFLICT DO NOTHING',[bonusId,avId])

    res.json({token,user:{id:user.id,name:user.name,email:user.email,isAdmin:false,termsAccepted:false},avatars:[autoAv]})
  }catch(e){ console.error('register:',e.message); res.status(500).json({error:'Error del servidor'}) }
})

app.post('/api/auth/login', async(req,res)=>{
  const {email,password,tournamentId}=req.body
  if(!tournamentId) return res.status(400).json({error:'Torneo requerido'})
  try{
    const {rows:[u]}=await pool.query('SELECT * FROM users WHERE LOWER(email)=$1 AND tournament_id=$2',[(email||'').toLowerCase(),tournamentId])
    if(!u||!await bcrypt.compare(password||'',u.password_hash||''))
      return res.status(401).json({error:'Correo o contraseña incorrectos'})
    const {rows:avatars}=await pool.query('SELECT * FROM avatars WHERE user_id=$1 ORDER BY created_at',[u.id])
    const token=jwt.sign({id:u.id,email:u.email,isAdmin:u.is_admin,tournamentId},JWT_SECRET,{expiresIn:'30d'})
    res.json({token,user:{id:u.id,name:u.name,email:u.email,isAdmin:u.is_admin,termsAccepted:u.terms_accepted},avatars})
  }catch(e){ res.status(500).json({error:'Error del servidor'}) }
})

app.get('/api/me', auth, async(req,res)=>{
  try{
    const {rows:[u]}=await pool.query('SELECT * FROM users WHERE id=$1 AND tournament_id=$2',[req.user.id,req.user.tournamentId])
    if(!u) return res.status(404).json({error:'Usuario no encontrado'})
    const {rows:avatars}=await pool.query('SELECT * FROM avatars WHERE user_id=$1 ORDER BY created_at',[u.id])
    res.json({user:{id:u.id,name:u.name,email:u.email,phone:u.phone,termsAccepted:u.terms_accepted,isAdmin:u.is_admin},avatars})
  }catch(e){ res.status(500).json({error:'Error del servidor'}) }
})

app.post('/api/auth/terms', auth, async(req,res)=>{
  const {phone,whatsappConsent}=req.body
  try{
    await pool.query('UPDATE users SET terms_accepted=TRUE,terms_accepted_at=NOW(),phone=$1 WHERE id=$2',[phone||null,req.user.id])
    res.json({success:true})
  }catch(e){ res.status(500).json({error:'Error del servidor'}) }
})

// ─── TOURNAMENT SETTINGS (admin edits own tournament) ─────────────────────────
app.get('/api/settings', auth, async(req,res)=>{
  try{
    const {rows:[t]}=await pool.query('SELECT * FROM tournaments WHERE id=$1',[req.user.tournamentId])
    if(!t) return res.status(404).json({error:'Torneo no encontrado'})
    res.json({
      predictions_open:t.predictions_open,
      name:t.name,
      logo_url:t.logo_url||'',
      primary_color:t.primary_color||'#F6C90E'
    })
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.put('/api/settings', auth, tournamentAdmin, async(req,res)=>{
  const {predictions_open,primary_color}=req.body
  try{
    await pool.query(`
      UPDATE tournaments SET
        predictions_open=COALESCE($1,predictions_open),
        primary_color=COALESCE($2,primary_color)
      WHERE id=$3
    `,[predictions_open,primary_color,req.user.tournamentId])
    res.json({success:true})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

// ─── AVATARS ──────────────────────────────────────────────────────────────────
app.post('/api/avatars', auth, async(req,res)=>{
  const {nickname,photoUrl}=req.body
  if(!nickname||nickname.trim().length<3) return res.status(400).json({error:'Nickname mínimo 3 caracteres'})
  const tid=req.user.tournamentId
  try{
    const {rows:ex}=await pool.query('SELECT id FROM avatars WHERE LOWER(nickname)=$1 AND tournament_id=$2',[nickname.trim().toLowerCase(),tid])
    if(ex.length) return res.status(400).json({error:'Ese nickname ya existe en esta polla, elige otro'})
    const {rows:mine}=await pool.query('SELECT id FROM avatars WHERE user_id=$1',[req.user.id])
    if(mine.length>=3) return res.status(400).json({error:'Máximo 3 avatares por usuario'})
    const id='av-'+crypto.randomBytes(12).toString('hex')
    const {rows:[av]}=await pool.query(
      'INSERT INTO avatars(id,user_id,tournament_id,nickname,photo_url,is_paid,is_active) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [id,req.user.id,tid,nickname.trim(),photoUrl||null,true,false])
    res.json({avatar:av})
  }catch(e){ console.error(e); res.status(500).json({error:'Error del servidor'}) }
})

// ─── MATCHES ──────────────────────────────────────────────────────────────────
app.get('/api/matches', async(req,res)=>{
  try{
    const {rows}=await pool.query('SELECT * FROM matches ORDER BY match_num')
    res.json(rows)
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.get('/api/phase-locks', auth, async(req,res)=>{
  try{
    const {rows}=await pool.query('SELECT * FROM phase_locks WHERE tournament_id=$1',[req.user.tournamentId])
    res.json(rows)
  }catch(e){ res.status(500).json({error:'Error'}) }
})

// ─── PREDICTIONS ──────────────────────────────────────────────────────────────
app.get('/api/predictions/:avatarId', auth, async(req,res)=>{
  try{
    const {rows:preds}=await pool.query('SELECT * FROM predictions WHERE avatar_id=$1',[req.params.avatarId])
    const {rows:extras}=await pool.query('SELECT * FROM extra_predictions WHERE avatar_id=$1',[req.params.avatarId])
    const predictions={},exts={}
    preds.forEach(p=>predictions[p.match_id]={score_home:p.score_home,score_away:p.score_away,penalty_winner:p.penalty_winner,points:p.points_earned})
    extras.forEach(e=>exts[e.match_id]=e)
    res.json({predictions,extras:exts})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.post('/api/predictions', auth, async(req,res)=>{
  const {avatarId,matchId,home,away,penaltyWinner}=req.body
  if(home==null||away==null||+home<0||+away<0) return res.status(400).json({error:'Marcador inválido'})
  try{
    const {rows:[av]}=await pool.query('SELECT * FROM avatars WHERE id=$1',[avatarId])
    if(!av||av.user_id!==req.user.id) return res.status(403).json({error:'Sin permisos'})
    const {rows:[t]}=await pool.query('SELECT predictions_open FROM tournaments WHERE id=$1',[req.user.tournamentId])
    if(!t?.predictions_open) return res.status(403).json({error:'Los pronósticos están cerrados'})
    const {rows:[match]}=await pool.query(`SELECT m.*,pl.is_locked,pl.auto_lock_hours FROM matches m LEFT JOIN phase_locks pl ON m.phase=pl.phase AND pl.tournament_id=$1 WHERE m.id=$2`,[req.user.tournamentId,matchId])
    if(!match) return res.status(404).json({error:'Partido no encontrado'})
    if(isMatchLocked(match,match.auto_lock_hours||2,match.is_locked)) return res.status(403).json({error:'Este partido ya no admite cambios'})
    const id='pr-'+crypto.randomBytes(12).toString('hex')
    const {rows:[pred]}=await pool.query(`
      INSERT INTO predictions(id,avatar_id,match_id,score_home,score_away,penalty_winner)
      VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(avatar_id,match_id) DO UPDATE SET score_home=$4,score_away=$5,penalty_winner=$6,updated_at=NOW()
      RETURNING *`,[id,avatarId,matchId,+home,+away,penaltyWinner||null])
    res.json({prediction:pred})
  }catch(e){ console.error(e); res.status(500).json({error:'Error del servidor'}) }
})

app.post('/api/extra-predictions', auth, async(req,res)=>{
  const {avatarId,matchId,yellowCards,redCards,penaltiesCount,goalsFirstHalf,goalsSecondHalf,mvpPlayer}=req.body
  try{
    const {rows:[av]}=await pool.query('SELECT * FROM avatars WHERE id=$1',[avatarId])
    if(!av||av.user_id!==req.user.id) return res.status(403).json({error:'Sin permisos'})
    const id='ex-'+crypto.randomBytes(12).toString('hex')
    await pool.query(`
      INSERT INTO extra_predictions(id,avatar_id,match_id,yellow_cards,red_cards,penalties_count,goals_first_half,goals_second_half,mvp_player)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT(avatar_id,match_id) DO UPDATE SET yellow_cards=$4,red_cards=$5,penalties_count=$6,goals_first_half=$7,goals_second_half=$8,mvp_player=$9`,
      [id,avatarId,matchId,yellowCards??null,redCards??null,penaltiesCount??null,goalsFirstHalf??null,goalsSecondHalf??null,mvpPlayer||null])
    res.json({success:true})
  }catch(e){ res.status(500).json({error:'Error del servidor'}) }
})

// ─── RANKING ──────────────────────────────────────────────────────────────────
app.get('/api/ranking', auth, async(req,res)=>{
  try{
    const tid=req.user.tournamentId
    const {rows}=await pool.query(`
      SELECT av.id,av.nickname,av.photo_url,u.name as user_name,
        COALESCE(SUM(p.points_earned),0)+COALESCE(SUM(ep.points_earned),0)+
        COALESCE(sp.champion_pts,0)+COALESCE(sp.surprise_pts,0)+
        COALESCE(sp.balon_pts,0)+COALESCE(sp.guante_pts,0)+COALESCE(sp.bota_pts,0)+
        COALESCE(rb.points,0)+COALESCE(SUM(ta.points_earned),0) as total_points,
        COUNT(DISTINCT p.match_id) FILTER(WHERE p.score_home IS NOT NULL) as matches_predicted
      FROM avatars av
      JOIN users u ON u.id=av.user_id
      LEFT JOIN predictions p ON p.avatar_id=av.id
      LEFT JOIN extra_predictions ep ON ep.avatar_id=av.id
      LEFT JOIN special_predictions sp ON sp.avatar_id=av.id
      LEFT JOIN registration_bonus rb ON rb.avatar_id=av.id
      LEFT JOIN trivia_answers ta ON ta.avatar_id=av.id AND ta.is_correct=TRUE
      WHERE av.tournament_id=$1 AND av.is_active=TRUE
      GROUP BY av.id,av.nickname,av.photo_url,u.name,sp.champion_pts,sp.surprise_pts,sp.balon_pts,sp.guante_pts,sp.bota_pts,rb.points
      ORDER BY total_points DESC,matches_predicted ASC`,[tid])
    res.json(rows.map((r,i)=>({...r,rank:i+1})))
  }catch(e){ res.status(500).json({error:'Error'}) }
})

// ─── EMAIL TEMPLATES ─────────────────────────────────────────────────────────
async function sendActivationEmail(t){
  const url=`${APP_URL}/t/${t.slug}`
  await sendMail(t.owner_email, `🏆 Tu Polla IA "${t.name}" ya está activa`,`
    <!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f7f4ee;padding:2rem">
    <div style="background:#0d1117;border-radius:16px;padding:2rem;text-align:center;margin-bottom:1.5rem">
      <img src="${APP_URL}/logo.png" style="width:80px;height:80px;object-fit:contain" alt="La Polla IA"/>
      <h1 style="color:#F6C90E;font-size:2rem;margin:.5rem 0">¡Tu Polla está lista!</h1>
      <p style="color:rgba(255,255,255,.6);margin:0">La Polla IA · FIFA World Cup 2026</p>
    </div>
    <div style="background:#fff;border-radius:12px;padding:1.5rem;margin-bottom:1rem">
      <p style="margin:0 0 1rem">Hola <strong>${t.owner_name}</strong>,</p>
      <p>Tu torneo <strong>"${t.name}"</strong> ha sido activado exitosamente. Ya puedes compartir el link con tus participantes:</p>
      <div style="background:#f7f4ee;border:2px solid #F6C90E;border-radius:8px;padding:1rem;text-align:center;margin:1rem 0">
        <a href="${url}" style="color:#0d1117;font-weight:700;font-size:1.1rem;text-decoration:none">${url}</a>
      </div>
      <p style="color:#666;font-size:14px">Próximos pasos:</p>
      <ol style="color:#666;font-size:14px;line-height:2">
        <li>Entra a tu polla con tu correo y contraseña</li>
        <li>Ve a Admin → Configuración y personaliza logo y colores</li>
        <li>Comparte el link por WhatsApp con tus participantes</li>
        <li>Confirma los pagos de inscripción de cada jugador</li>
      </ol>
    </div>
    <p style="text-align:center;color:#999;font-size:12px">© 2026 La Polla IA · <a href="${APP_URL}" style="color:#999">lapollaia.com</a></p>
    </body></html>
  `)
}



// ─── CONFIRMATION PAGE ────────────────────────────────────────────────────────
app.get('/confirmacion', (req,res)=>{
  const {slug,nombre}=req.query
  const name=decodeURIComponent(nombre||'tu Polla')
  const url=`${APP_URL}/t/${slug}`
  res.send(`<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>¡Pago exitoso! — La Polla IA</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#0d1117;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
.card{background:rgba(255,255,255,.03);border:1px solid rgba(246,201,14,.3);border-radius:20px;padding:3rem 2rem;max-width:480px;width:100%;text-align:center;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at top,rgba(246,201,14,.08),transparent 60%);pointer-events:none}
.check{width:80px;height:80px;background:rgba(22,163,74,.15);border:2px solid #16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1.5rem}
h1{font-family:'Bebas Neue',sans-serif;font-size:2.5rem;letter-spacing:2px;color:#F6C90E;margin-bottom:.5rem}
.sub{color:rgba(255,255,255,.5);margin-bottom:2rem;font-size:15px;line-height:1.6}
.url-box{background:rgba(246,201,14,.08);border:1px solid rgba(246,201,14,.2);border-radius:10px;padding:1rem;margin-bottom:2rem}
.url-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.4);margin-bottom:4px}
.url-link{color:#F6C90E;font-weight:700;font-size:1rem;word-break:break-all}
.steps{text-align:left;background:rgba(255,255,255,.03);border-radius:10px;padding:1.25rem;margin-bottom:2rem}
.steps h3{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.4);margin-bottom:.75rem}
.step-item{display:flex;gap:.75rem;align-items:flex-start;margin-bottom:.6rem;font-size:14px;color:rgba(255,255,255,.75)}
.step-n{background:#F6C90E;color:#0d1117;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;margin-top:1px}
.btn{background:#F6C90E;color:#0d1117;border:none;border-radius:10px;padding:1rem 2rem;font-size:16px;font-weight:700;cursor:pointer;width:100%;text-decoration:none;display:block;transition:transform .2s}
.btn:hover{transform:translateY(-2px)}
.note{margin-top:1rem;font-size:11px;color:rgba(255,255,255,.25)}
</style></head><body>
<div class="card">
  <div class="check">✓</div>
  <h1>¡Pago Exitoso!</h1>
  <p class="sub">Tu Polla "<strong style="color:#F6C90E">${name}</strong>" ya está activa y lista para jugar.</p>
  <div class="url-box">
    <div class="url-label">Tu link único</div>
    <div class="url-link">${url}</div>
  </div>
  <div class="steps">
    <h3>Próximos pasos</h3>
    <div class="step-item"><div class="step-n">1</div><div>Entra con tu correo y contraseña para configurar tu polla</div></div>
    <div class="step-item"><div class="step-n">2</div><div>Sube tu logo y elige tus colores en Admin → Configuración</div></div>
    <div class="step-item"><div class="step-n">3</div><div>Copia tu link y mándalo por WhatsApp al grupo — cada jugador recibe <strong>🎁 20 pts de bienvenida</strong> al registrarse</div></div>
    <div class="step-item"><div class="step-n">4</div><div>Cuando un jugador se registre, confirma su participación en Admin → Participantes</div></div>
    <div class="step-item"><div class="step-n">5</div><div>Crea preguntas de trivia en Admin → Extra Points con ayuda de Pelé IA — aparecen automáticamente en el tablero de todos 🧠</div></div>
  </div>
  <a href="${url}" class="btn">🏆 Ir a configurar mi Polla →</a>
  <p class="note">📧 También te enviamos un correo de confirmación con todos los detalles</p>
</div>
</body></html>`)
})

// ─── FOOTBALL API HELPER ─────────────────────────────────────────────────────
async function getFootballStats(query){
  if(!process.env.FOOTBALL_API_KEY) return null
  try{
    const r=await fetch(`https://api.football-data.org/v4/teams?name=${encodeURIComponent(query)}`,{
      headers:{'X-Auth-Token':process.env.FOOTBALL_API_KEY}
    })
    if(!r.ok) return null
    return await r.json()
  }catch(e){ return null }
}

// ─── PELÉ IA — SYSTEM PROMPT BASE ────────────────────────────────────────────
const PELE_SYSTEM=`Eres Pelé IA 🏆, el asistente experto en fútbol de La Polla IA.

CONTEXTO TEMPORAL — MUY IMPORTANTE:
- La fecha actual es Abril de 2026. Estamos a semanas del FIFA World Cup 2026.
- El Mundial 2026 (USA, Canadá, México) inicia el 11 de Junio de 2026. AÚN NO HA COMENZADO.
- El campeón del Mundial 2022 fue Argentina. El Mundial más reciente jugado es 2022.
- Cuando alguien diga "este año" o "2024", corrígelo: estamos en 2026.
- El Balón de Oro más reciente fue el de 2025 (ceremonia Octubre 2025).

IDENTIDAD: Eres un enciclopédico del fútbol. Conoces todo sobre el deporte: historia, estadísticas, jugadores, equipos, ligas, tácticas, reglas, transferencias, torneos internacionales y curiosidades. Hablas con pasión y humor latino.

REGLAS ABSOLUTAS:
1. SOLO respondes preguntas relacionadas con fútbol o el torneo de pronósticos.
2. Si alguien pregunta algo que NO tiene relación con el fútbol (recetas, música, amor, política, tecnología, etc.), respondes EXACTAMENTE: "⚽ Soy una IA especializada en fútbol. Para eso no te puedo ayudar, ¡pero pregúntame algo del deporte rey!"
3. Nunca inventes estadísticas. Si no tienes el dato exacto, dilo honestamente.
4. Siempre en español. BREVE (máx 4 líneas para respuestas normales). Emojis con moderación.
5. Cuando sugieras un marcador, SIEMPRE explica el razonamiento en 2-3 líneas.`

// ─── PELÉ IA — PRONÓSTICOS (contexto de partido) ─────────────────────────────
app.post('/api/pele', auth, async(req,res)=>{
  const {userMessage,matchContext,phase,avatarName}=req.body
  const {rows:[t]}=await pool.query('SELECT name FROM tournaments WHERE id=$1',[req.user.tournamentId]).catch(()=>({rows:[]}))
  try{
    const contextExtra=matchContext
      ?`
PARTIDO ACTUAL: ${matchContext.team1||'?'} vs ${matchContext.team2||'?'} · Fase: ${matchContext.phase||'grupos'} · Sede: ${matchContext.venue||'?'}`
      :''
    const msg=await anthropic.messages.create({
      model:'claude-sonnet-4-6', max_tokens:400,
      system:PELE_SYSTEM+`
TORNEO: "${t?.name||'La Polla IA'}"
JUGADOR: ${avatarName||'el usuario'}${contextExtra}`,
      messages:[{role:'user',content:userMessage}]
    })
    res.json({response:msg.content[0].text})
  }catch(e){ res.json({response:'¡Tuve un problema técnico! ⚽ Intenta de nuevo.'}) }
})

// ─── PELÉ IA — SUGERENCIA DE MARCADOR (con razonamiento) ─────────────────────
app.post('/api/pele/suggest', auth, async(req,res)=>{
  const {team1,team2,rank1,rank2,notes1,notes2,venue,matchDate,group}=req.body
  try{
    const msg=await anthropic.messages.create({
      model:'claude-sonnet-4-6', max_tokens:500,
      system:`Eres un analista experto de fútbol internacional. Cuando sugieras un marcador SIEMPRE debes explicar el razonamiento.
Responde SOLO en JSON válido (sin markdown): {"home":NUMERO,"away":NUMERO,"reason":"2-3 líneas en español explicando POR QUÉ ese marcador: ranking, historial entre equipos, forma reciente, ventaja de sede, jugadores clave"}`,
      messages:[{role:'user',content:`Partido del Grupo ${group}: ${team1} (ranking #${rank1}, ${notes1}) vs ${team2} (ranking #${rank2}, ${notes2}). Sede: ${venue}. Fecha: ${matchDate}. Analiza el partido considerando: ranking FIFA, historial directo, jugadores estrella, sede y contexto del grupo. Sugiere el marcador más probable y explica el razonamiento.`}]
    })
    let result={home:1,away:0,reason:'No pude obtener el análisis completo.'}
    try{
      const text=msg.content[0].text.trim().replace(/```json|```/g,'').trim()
      result=JSON.parse(text)
      result.home=Math.max(0,Math.min(9,parseInt(result.home)||0))
      result.away=Math.max(0,Math.min(9,parseInt(result.away)||0))
    }catch(pe){ console.error('suggest parse:',pe.message) }
    res.json(result)
  }catch(e){ res.json({home:1,away:0,reason:'No pude conectarme al análisis en este momento.'}) }
})

// ─── PELÉ IA — PÚBLICO (sin auth, para home page) ────────────────────────────
app.post('/api/pele/public', async(req,res)=>{
  const {message,history=[]}=req.body
  if(!message||message.trim().length<2) return res.status(400).json({error:'Mensaje vacío'})
  // Rate limit: max 20 messages per IP per hour (simple in-memory)
  const ip=req.ip||req.connection.remoteAddress||'unknown'
  if(!global._pelePublicRate) global._pelePublicRate={}
  const now=Date.now()
  const key=ip+':'+Math.floor(now/3600000)
  global._pelePublicRate[key]=(global._pelePublicRate[key]||0)+1
  if(global._pelePublicRate[key]>25) return res.status(429).json({error:'Límite de mensajes alcanzado. ¡Crea tu polla para acceso ilimitado!'})
  try{
    const msgs=[
      ...history.slice(-6).map(m=>({role:m.role,content:m.content})),
      {role:'user',content:message}
    ]
    const resp=await anthropic.messages.create({
      model:'claude-sonnet-4-6', max_tokens:600,
      system:`Eres Pelé IA, el mayor experto en fútbol del mundo. Hablas en español con pasión y conocimiento profundo.

CONTEXTO TEMPORAL CRÍTICO — MUY IMPORTANTE:
- La fecha actual es Abril de 2026. NO es 2024 ni 2025.
- El FIFA World Cup 2026 (USA, Canadá, México) comienza el 11 de Junio de 2026. AÚN NO HA COMENZADO.
- Cuando alguien pregunte por el "Balón de Oro este año" o "2024/2025", responde sobre el Balón de Oro 2025 (ceremonia Octubre 2025) o aclara que estamos en 2026.
- El campeón del Mundial 2022 fue Argentina (Messi). El Mundial 2026 aún no ha comenzado.
- NUNCA respondas como si estuvieras en 2024. Siempre contextualiza en Abril 2026.

REGLAS:
- Solo respondes sobre fútbol y deportes relacionados
- Si te preguntan algo fuera del fútbol, dices amablemente que solo sabes de fútbol
- Eres apasionado, usas emojis de fútbol ocasionalmente ⚽🏆
- Máximo 3 párrafos por respuesta
- Al final de cada respuesta, si es pertinente, menciona lapollaia.com`,
      messages:msgs
    })
    res.json({response:resp.content[0].text})
  }catch(e){
    console.error('pele/public:',e.message)
    res.status(500).json({error:'Error conectando con Pelé IA'})
  }
})

// ─── PELÉ IA — MODO LIBRE (cualquier pregunta de fútbol) ─────────────────────
app.post('/api/pele/free', auth, async(req,res)=>{
  const {message,avatarName,history=[]}=req.body
  if(!message||message.trim().length<2) return res.status(400).json({error:'Mensaje vacío'})
  try{
    // Try Football API for team/player queries
    let footballData=null
    const teamMatch=message.match(/(?:equipo|club|team|datos de|estadísticas de|info de)\s+([A-Za-záéíóúüñÁÉÍÓÚ\s]+)/i)
    if(teamMatch&&process.env.FOOTBALL_API_KEY){
      footballData=await getFootballStats(teamMatch[1].trim())
    }

    const messages=[
      ...history.slice(-8).map(m=>({role:m.role,content:m.content})),
      {role:'user',content:footballData
        ? `${message}

[Datos de Football API disponibles: ${JSON.stringify(footballData).substring(0,500)}]`
        : message}
    ]

    const msg=await anthropic.messages.create({
      model:'claude-sonnet-4-6', max_tokens:600,
      system:PELE_SYSTEM+`
JUGADOR: ${avatarName||'el usuario'}
MODO: Chat libre de fútbol. El usuario puede preguntar CUALQUIER cosa sobre fútbol. Responde con datos precisos y análisis de calidad. Si tienes datos de Football API disponibles en el mensaje, úsalos para enriquecer tu respuesta.`,
      messages
    })
    res.json({response:msg.content[0].text})
  }catch(e){
    console.error('pele/free:',e.message)
    res.json({response:'¡Tuve un problema técnico! ⚽ Intenta de nuevo en un momento.'})
  }
})

// ─── SPECIAL PREDICTIONS ─────────────────────────────────────────────────────
app.get('/api/special/:avatarId', auth, async(req,res)=>{
  try{
    const {rows:[sp]}=await pool.query('SELECT * FROM special_predictions WHERE avatar_id=$1',[req.params.avatarId])
    res.json(sp||{})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.post('/api/special', auth, async(req,res)=>{
  const {avatarId,champion,surprise,balonDeOro,guanteDeOro,botaDeOro}=req.body
  try{
    const id='sp-'+crypto.randomBytes(12).toString('hex')
    await pool.query(`
      INSERT INTO special_predictions(id,avatar_id,champion_team,surprise_team,balon_de_oro,guante_de_oro,bota_de_oro)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(avatar_id) DO UPDATE SET champion_team=$3,surprise_team=$4,balon_de_oro=$5,guante_de_oro=$6,bota_de_oro=$7,updated_at=NOW()`,
      [id,avatarId,champion||null,surprise||null,balonDeOro||null,guanteDeOro||null,botaDeOro||null])
    res.json({success:true})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

// ─── AUTO-FILL PREDICTIONS ────────────────────────────────────────────────────
app.post('/api/autofill', auth, async(req,res)=>{
  const {avatarId, groupFilter} = req.body  // groupFilter: null=all, 'A'=group A only, matchId=single
  try{
    const tid = req.user.tournamentId
    const now = new Date()

    // Get matches to fill
    let matchQuery = 'SELECT m.* FROM matches m WHERE 1=1'
    const qparams = []
    if(groupFilter && groupFilter.length===1){
      qparams.push(groupFilter)
      matchQuery += ` AND m.phase='group' AND m.group_name=$${qparams.length}`
    }
    const {rows:matchesToFill} = await pool.query(matchQuery + ' ORDER BY m.match_num', qparams)

    // Filter to only unlocked matches without predictions
    const {rows:existing} = await pool.query(
      'SELECT match_id FROM predictions WHERE avatar_id=$1', [avatarId])
    const existingIds = new Set(existing.map(r=>r.match_id))

    const {rows:locks} = await pool.query(
      'SELECT phase,is_locked,auto_lock_hours FROM phase_locks WHERE tournament_id=$1',[tid])
    const lockMap = {}
    locks.forEach(l=>{ lockMap[l.phase]={isLocked:l.is_locked, hours:l.auto_lock_hours||2} })

    const pending = matchesToFill.filter(m=>{
      if(existingIds.has(m.id)) return false
      const lock = lockMap[m.phase]||{isLocked:false,hours:2}
      if(lock.isLocked) return false
      if(!m.match_date) return false
      const lockTime = new Date(m.match_date).getTime() - lock.hours*3600000
      return Date.now() < lockTime
    })

    if(pending.length===0) return res.json({filled:0, message:'No hay partidos disponibles para llenar'})

    // Process ALL pending matches in parallel batches of 8
    const BATCH_SIZE = 8
    const results = []
    for(let i=0; i<pending.length; i+=BATCH_SIZE){
      const batch = pending.slice(i, i+BATCH_SIZE)
      const batchResults = await Promise.all(batch.map(async m=>{
        const t1stats = TEAM_STATS_SERVER[m.team1]||{rank:50,notes:'Datos no disponibles'}
        const t2stats = TEAM_STATS_SERVER[m.team2]||{rank:50,notes:'Datos no disponibles'}
        try{
          const msg = await anthropic.messages.create({
            model:'claude-sonnet-4-6', max_tokens:80,
            system:`Eres analista de fútbol. Responde SOLO JSON: {"home":N,"away":N}`,
            messages:[{role:'user',content:`${m.team1}(#${t1stats.rank}) vs ${m.team2}(#${t2stats.rank}). Fase:${m.phase}. Grupo:${m.group_name||''}. Marcador probable:`}]
          })
          const text = msg.content[0].text.trim().replace(/```json|```/g,'').trim()
          const parsed = JSON.parse(text)
          const h = Math.max(0,Math.min(9,parseInt(parsed.home)||0))
          const a = Math.max(0,Math.min(9,parseInt(parsed.away)||0))
          return {matchId:m.id, home:h, away:a}
        } catch(e){
          const r1 = t1stats.rank||50, r2 = t2stats.rank||50
          return {matchId:m.id, home:r1<r2?2:r1>r2?1:1, away:r1<r2?0:r1>r2?2:1}
        }
      }))
      results.push(...batchResults)
    }

    // Save all predictions
    let saved = 0
    for(const r of results){
      const id = 'p-'+crypto.randomBytes(8).toString('hex')
      await pool.query(`
        INSERT INTO predictions(id,avatar_id,match_id,score_home,score_away)
        VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(avatar_id,match_id) DO UPDATE SET score_home=$4,score_away=$5,updated_at=NOW()
      `,[id,avatarId,r.matchId,r.home,r.away])
      saved++
    }

    res.json({filled:saved, total:pending.length, predictions:results})
  }catch(e){ console.error('autofill:',e); res.status(500).json({error:'Error en auto-fill'}) }
})

// ─── BRACKET PREDICTIONS ─────────────────────────────────────────────────────
app.get('/api/bracket/:avatarId', auth, async(req,res)=>{
  try{
    const {rows:[bp]} = await pool.query(
      'SELECT * FROM bracket_predictions WHERE avatar_id=$1',[req.params.avatarId])
    res.json(bp||null)
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.post('/api/bracket', auth, async(req,res)=>{
  const {avatarId, bracket, isAiGenerated} = req.body
  if(!avatarId||!bracket) return res.status(400).json({error:'Datos incompletos'})
  try{
    const {rows:[existing]} = await pool.query(
      'SELECT id,has_been_edited,locked_at FROM bracket_predictions WHERE avatar_id=$1',[avatarId])
    const id = existing?.id || 'br-'+crypto.randomBytes(10).toString('hex')
    const hasBeenEdited = existing ? (!existing.locked_at ? false : true) : false

    await pool.query(`
      INSERT INTO bracket_predictions(id,avatar_id,bracket,is_ai_generated,has_been_edited,updated_at)
      VALUES($1,$2,$3,$4,$5,NOW())
      ON CONFLICT(avatar_id) DO UPDATE SET bracket=$3,is_ai_generated=$4,has_been_edited=$5,updated_at=NOW()
    `,[id, avatarId, JSON.stringify(bracket), !!isAiGenerated, hasBeenEdited])

    res.json({success:true, id, hasBeenEdited})
  }catch(e){ console.error('bracket save:',e); res.status(500).json({error:'Error guardando bracket'}) }
})

// Lock bracket (user confirms - start earning 100pts potential)
app.post('/api/bracket/lock', auth, async(req,res)=>{
  const {avatarId} = req.body
  try{
    await pool.query(
      'UPDATE bracket_predictions SET locked_at=NOW(),updated_at=NOW() WHERE avatar_id=$1',[avatarId])
    res.json({success:true})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

// ─── BRACKET PÚBLICO — sin auth, rate-limited ────────────────────────────────
app.post('/api/bracket/public-suggest', async(req,res)=>{
  const {champion} = req.body
  if(!champion) return res.status(400).json({error:'Selecciona un campeón'})
  // Simple IP rate limit: max 5 brackets/hora por IP
  const ip = req.ip||req.connection.remoteAddress||'unknown'
  if(!global._bracketPubRate) global._bracketPubRate={}
  const key = ip+':'+Math.floor(Date.now()/3600000)
  global._bracketPubRate[key]=(global._bracketPubRate[key]||0)+1
  if(global._bracketPubRate[key]>5) return res.status(429).json({error:'Límite alcanzado. Crea tu polla en lapollaia.com para más pronósticos.'})
  const VALID=['Brazil','France','Argentina','England','Spain','Portugal','Germany','Uruguay','Colombia']
  if(!VALID.includes(champion)) return res.status(400).json({error:'Campeón no válido'})
  try{
    const GROUPS={A:['Mexico','South Africa','Korea Republic','Czechia'],B:['Canada','Bosnia and Herzegovina','Qatar','Switzerland'],C:['Brazil','Morocco','Haiti','Scotland'],D:['USA','Paraguay','Australia','Turkey'],E:['Germany','Curaçao','Ivory Coast','Ecuador'],F:['Netherlands','Japan','Sweden','Tunisia'],G:['Belgium','Egypt','IR Iran','New Zealand'],H:['Spain','Cape Verde','Saudi Arabia','Uruguay'],I:['France','Senegal','Iraq','Norway'],J:['Argentina','Algeria','Austria','Jordan'],K:['Portugal','DR Congo','Uzbekistan','Colombia'],L:['England','Croatia','Ghana','Panama']}
    const msg=await anthropic.messages.create({
      model:'claude-sonnet-4-6',max_tokens:3200,
      system:`Eres un experto en fútbol. Genera un bracket completo del Mundial FIFA 2026 donde ${champion} es CAMPEÓN.\nGRUPOS: ${JSON.stringify(GROUPS)}\nREGLAS: 1. ${champion} DEBE ganar la final. 2. Marcadores realistas (0-0 a 4-0). 3. Nombres en inglés exactos.\nResponde SOLO JSON válido sin markdown:\n{"round32":[{"match":1,"home":"T","away":"T","winner":"T","home_score":N,"away_score":N},...16 items],"round16":[...8],"quarters":[...4],"semis":[...2],"third":{"home":"T","away":"T","winner":"T","home_score":N,"away_score":N},"final":{"home":"T","away":"T","winner":"CHAMPION","home_score":N,"away_score":N},"champion":"CHAMPION"}`,
      messages:[{role:'user',content:`Bracket completo. Campeón: ${champion}. Exactamente 16 en round32, 8 en round16, 4 en quarters, 2 en semis. Solo JSON.`}]
    })
    let text=msg.content[0].text.trim()
    // Robust JSON extraction: strip markdown, find outermost {...}
    text=text.replace(/```json|```/g,'').trim()
    const m=text.match(/\{[\s\S]*\}/)
    if(!m) throw new Error('No JSON found in response')
    // Try progressive truncation if parse fails due to trailing content
    let bracket
    let jsonStr=m[0]
    try{ bracket=JSON.parse(jsonStr) }catch(e1){
      // Find last valid closing brace
      let depth=0,lastValid=-1
      for(let i=0;i<jsonStr.length;i++){
        if(jsonStr[i]==='{')depth++
        else if(jsonStr[i]==='}'){depth--;if(depth===0){lastValid=i;break}}
      }
      if(lastValid>0) bracket=JSON.parse(jsonStr.slice(0,lastValid+1))
      else throw e1
    }
    const emptyM=i=>({match:i+1,home:'',away:'',winner:'',home_score:null,away_score:null})
    const pad=(arr,len)=>{if(!Array.isArray(arr))arr=[];while(arr.length<len)arr.push(emptyM(arr.length));return arr.slice(0,len)}
    bracket.round32=pad(bracket.round32,16);bracket.round16=pad(bracket.round16,8)
    bracket.quarters=pad(bracket.quarters,4);bracket.semis=pad(bracket.semis,2)
    if(!bracket.third)bracket.third={home:'',away:'',winner:'',home_score:0,away_score:0}
    if(!bracket.final)bracket.final={home:'',away:'',winner:champion,home_score:1,away_score:0}
    bracket.champion=champion;bracket.final.winner=champion
    res.json({bracket})
  }catch(e){console.error('public bracket:',e.message);res.status(500).json({error:'Error generando bracket: '+e.message})}
})

// AI bracket suggestion based on champion
app.post('/api/bracket/suggest', auth, async(req,res)=>{
  const {champion, avatarId} = req.body
  if(!champion) return res.status(400).json({error:'Selecciona un campeón'})
  try{
    // FIFA 2026 oficial R32 seeding structure (16 matches, 8 per side)
    const R32_LABELS = [
      '2do A vs 2do B','1ro C vs 2do F','1ro E vs Mejor 3ro','1ro F vs 2do C',
      '2do E vs 2do I','1ro I vs Mejor 3ro','1ro A vs Mejor 3ro','1ro L vs Mejor 3ro',
      '1ro G vs Mejor 3ro','1ro D vs Mejor 3ro','1ro H vs 2do J','2do K vs 2do L',
      '1ro B vs Mejor 3ro','2do D vs 2do G','1ro J vs 2do H','1ro K vs Mejor 3ro'
    ]
    // Each group's teams for reference
    const GROUPS = {
      A:['Mexico','South Africa','Korea Republic','Czechia'],
      B:['Canada','Bosnia and Herzegovina','Qatar','Switzerland'],
      C:['Brazil','Morocco','Haiti','Scotland'],
      D:['USA','Paraguay','Australia','Turkey'],
      E:['Germany','Curaçao','Ivory Coast','Ecuador'],
      F:['Netherlands','Japan','Sweden','Tunisia'],
      G:['Belgium','Egypt','IR Iran','New Zealand'],
      H:['Spain','Cape Verde','Saudi Arabia','Uruguay'],
      I:['France','Senegal','Iraq','Norway'],
      J:['Argentina','Algeria','Austria','Jordan'],
      K:['Portugal','DR Congo','Uzbekistan','Colombia'],
      L:['England','Croatia','Ghana','Panama']
    }
    const groupsJson = JSON.stringify(GROUPS)
    const r32json = JSON.stringify(R32_LABELS)
    const msg = await anthropic.messages.create({
      model:'claude-sonnet-4-6', max_tokens:3200,
      system:`Eres un experto en fútbol. Genera un bracket completo del Mundial FIFA 2026 donde ${champion} es CAMPEÓN.

ESTRUCTURA DEL TORNEO FIFA 2026:
- 12 Grupos (A-L), 4 equipos c/u, clasifican 1ro y 2do de cada grupo + 8 mejores 3ros = 32 equipos al Round of 32
- Round of 32: 16 partidos (8 izquierda del bracket, 8 derecha)
- Round of 16: 8 partidos
- Cuartos: 4 partidos  
- Semifinales: 2 partidos
- Final + 3er Puesto: 1 partido cada uno

GRUPOS: ${groupsJson}
EMPAREJAMIENTOS R32 (en orden): ${r32json}

REGLAS:
1. Para R32: asigna al home/away el equipo real de ese grupo que crees que clasificó (1ro, 2do o 3ro)
2. El winner debe avanzar consistentemente: ganadores R32→R16→QF→SF→Final
3. ${champion} DEBE llegar y ganar la final
4. Los marcadores deben ser realistas (0-0 a 4-0 típico, penales si necesario)
5. Usa nombres en inglés EXACTOS: Brazil, France, Argentina, England, Spain, Portugal, Germany, Netherlands, Belgium, Colombia, Morocco, Japan, USA, Mexico, Uruguay, Croatia, Korea Republic, Senegal, Ecuador, Norway, Australia, Switzerland, Turkey, Sweden, Austria, Ghana, IR Iran, Saudi Arabia, Ivory Coast, Iraq, DR Congo, Uzbekistan, Curaçao, Panama, Jordan, New Zealand, Scotland, Cape Verde, Haiti, Algeria, Tunisia, Bosnia and Herzegovina, Czechia, Egypt, Qatar, South Africa, Canada

Responde SOLO con JSON válido, sin markdown, sin texto extra:
{"round32":[{"match":1,"home":"TEAM","away":"TEAM","winner":"TEAM","home_score":N,"away_score":N},...16 items],"round16":[...8 items],"quarters":[...4 items],"semis":[...2 items],"third":{"home":"T","away":"T","winner":"T","home_score":N,"away_score":N},"final":{"home":"T","away":"T","winner":"CHAMPION","home_score":N,"away_score":N},"champion":"CHAMPION"}`,
      messages:[{role:'user',content:`Genera el bracket completo del Mundial 2026. Campeón: ${champion}. Asegúrate de tener exactamente 16 partidos en round32, 8 en round16, 4 en quarters, 2 en semis. Los ganadores de cada ronda deben aparecer como home o away en la ronda siguiente. Responde solo JSON.`}]
    })
    let text = msg.content[0].text.trim()
    // Robust JSON extraction — strip markdown fences or surrounding text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if(jsonMatch) text = jsonMatch[0]
    text = text.replace(/```json|```/g,'').trim()
    const bracket = JSON.parse(text)
    // Normalize — pad arrays to required sizes instead of throwing
    const emptyM=(i)=>({match:i+1,home:'',away:'',winner:'',home_score:null,away_score:null,penalties:false})
    const pad=(arr,len)=>{ if(!Array.isArray(arr)) arr=[]; while(arr.length<len) arr.push(emptyM(arr.length)); return arr.slice(0,len) }
    bracket.round32  = pad(bracket.round32,16)
    bracket.round16  = pad(bracket.round16,8)
    bracket.quarters = pad(bracket.quarters,4)
    bracket.semis    = pad(bracket.semis,2)
    if(!bracket.third) bracket.third={home:'',away:'',winner:'',home_score:null,away_score:null,penalties:false}
    if(!bracket.final) bracket.final={home:'',away:'',winner:champion,home_score:null,away_score:null,penalties:false}
    bracket.champion = champion
    bracket.final.winner = champion
    res.json({bracket})
  }catch(e){
    console.error('bracket suggest:',e)
    res.status(500).json({error:'No pude generar el bracket. Intenta de nuevo: '+e.message})
  }
})


// ─── DEMO 24H AUTO-CLEANUP ────────────────────────────────────────────────────
// Every 30 min delete registrations older than 24h in demo tournaments
setInterval(async()=>{
  try{
    const {rows:[demo]}=await pool.query("SELECT id FROM tournaments WHERE slug='demo' LIMIT 1")
    if(!demo) return
    const tid=demo.id
    // Delete predictions, extra_predictions, brackets for old demo avatars
    await pool.query(`DELETE FROM extra_predictions WHERE avatar_id IN (
      SELECT av.id FROM avatars av JOIN users u ON u.id=av.user_id
      WHERE u.tournament_id=$1 AND u.is_admin=FALSE AND u.created_at < NOW()-INTERVAL '24 hours')`,[tid])
    await pool.query(`DELETE FROM predictions WHERE avatar_id IN (
      SELECT av.id FROM avatars av JOIN users u ON u.id=av.user_id
      WHERE u.tournament_id=$1 AND u.is_admin=FALSE AND u.created_at < NOW()-INTERVAL '24 hours')`,[tid])
    await pool.query(`DELETE FROM bracket_predictions WHERE avatar_id IN (
      SELECT av.id FROM avatars av JOIN users u ON u.id=av.user_id
      WHERE u.tournament_id=$1 AND u.is_admin=FALSE AND u.created_at < NOW()-INTERVAL '24 hours')`,[tid])
    await pool.query(`DELETE FROM avatars WHERE user_id IN (
      SELECT id FROM users WHERE tournament_id=$1 AND is_admin=FALSE AND created_at < NOW()-INTERVAL '24 hours')`,[tid])
    const {rowCount}=await pool.query(`DELETE FROM users WHERE tournament_id=$1 AND is_admin=FALSE AND created_at < NOW()-INTERVAL '24 hours'`,[tid])
    if(rowCount>0) console.log(`🧹 Demo cleanup: ${rowCount} usuarios eliminados`)
  }catch(e){ console.error('Demo cleanup error:',e.message) }
},30*60*1000)

// ─── RESULTS ─────────────────────────────────────────────────────────────────
// Results by user (across all their avatars in this tournament)
app.get('/api/results/user/:userId', auth, async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT p.match_id,p.home_score,p.away_score,p.points_earned,p.extra_pts
      FROM predictions p
      JOIN avatars av ON av.id=p.avatar_id
      WHERE av.user_id=$1 AND av.tournament_id=$2
      ORDER BY p.match_id`,
      [req.params.userId, req.user.tournamentId])
    res.json(rows)
  }catch(e){res.json([])}
})

app.get('/api/results/:avatarId', auth, async(req,res)=>{
  try{
    const {rows:preds}=await pool.query('SELECT p.*,m.phase,m.group_name FROM predictions p JOIN matches m ON m.id=p.match_id WHERE p.avatar_id=$1',[req.params.avatarId])
    const {rows:results}=await pool.query('SELECT * FROM match_results')
    const resultsMap={}; results.forEach(r=>resultsMap[r.match_id]=r)
    const summary={total:0,played:0,exact:0,winner:0,wrong:0}
    preds.forEach(p=>{
      const r=resultsMap[p.match_id]
      if(!r) return
      summary.played++
      const pts=calcPoints(p,r,p.phase)
      summary.total+=pts
      if(pts>=3) summary.exact++
      else if(pts>0) summary.winner++
      else summary.wrong++
    })
    res.json({summary,predictions:preds,results:resultsMap})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

// ─── ADMIN ────────────────────────────────────────────────────────────────────
app.get('/api/admin/users', auth, tournamentAdmin, async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT u.id,u.name,u.email,u.phone,u.created_at,
        json_agg(json_build_object('id',av.id,'nickname',av.nickname,'is_active',av.is_active,'created_at',av.created_at)
          ORDER BY av.created_at) FILTER(WHERE av.id IS NOT NULL) as avatars
      FROM users u LEFT JOIN avatars av ON u.id=av.user_id
      WHERE u.tournament_id=$1 AND u.is_admin=FALSE GROUP BY u.id ORDER BY u.created_at DESC`,[req.user.tournamentId])
    res.json(rows)
  }catch(e){ res.status(500).json({error:'Error'}) }
})

// Admin: view full details of one user (predictions + bracket + special) — READ ONLY
app.get('/api/admin/users/:userId/details', auth, tournamentAdmin, async(req,res)=>{
  const {userId}=req.params
  try{
    // Verify user belongs to this tournament
    const {rows:[u]}=await pool.query('SELECT id,name,email,created_at FROM users WHERE id=$1 AND tournament_id=$2',[userId,req.user.tournamentId])
    if(!u) return res.status(404).json({error:'Usuario no encontrado'})
    // Get avatars
    const {rows:avatars}=await pool.query('SELECT id,nickname,is_active FROM avatars WHERE user_id=$1',[userId])
    const avIds=avatars.map(a=>a.id)
    if(!avIds.length) return res.json({user:u,avatars:[],predictions:[],bracket:null,special:null,stats:{total:0,played:0}})
    // Predictions with match info + results
    const {rows:predictions}=await pool.query(`
      SELECT p.id,p.match_id,p.score_home,p.score_away,p.points_earned,p.created_at as predicted_at,
        m.phase,m.group_name,m.team1,m.team2,m.match_date,m.match_num,
        r.score_home as real_home,r.score_away as real_away
      FROM predictions p
      JOIN matches m ON m.id=p.match_id
      LEFT JOIN match_results r ON r.match_id=p.match_id
      WHERE p.avatar_id=ANY($1)
      ORDER BY m.match_date ASC`,[[avIds[0]]])
    // Bracket
    const {rows:[bk]}=await pool.query('SELECT bracket,is_ai_generated,has_been_edited,locked_at,updated_at FROM bracket_predictions WHERE avatar_id=ANY($1)',[avIds])
    // Special predictions
    const {rows:[sp]}=await pool.query('SELECT * FROM special_predictions WHERE avatar_id=ANY($1)',[avIds])
    // Stats
    const total=predictions.reduce((s,p)=>s+(p.points_earned||0),0)
    const played=predictions.filter(p=>p.real_home!=null).length
    res.json({user:u,avatars,predictions,bracket:bk||null,special:sp||null,stats:{total,played}})
  }catch(e){ console.error(e); res.status(500).json({error:e.message}) }
})

app.put('/api/admin/avatars/:id', auth, tournamentAdmin, async(req,res)=>{
  const {isActive}=req.body
  try{
    const sets=[]; const vals=[]
    if(isActive!==undefined){ sets.push(`is_active=$${vals.length+1}`); vals.push(!!isActive) }
    if(!sets.length) return res.status(400).json({error:'Nada que actualizar'})
    vals.push(req.params.id)
    const {rows:[av]}=await pool.query(`UPDATE avatars SET ${sets.join(',')} WHERE id=$${vals.length} RETURNING *`,vals)
    res.json({avatar:av})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.delete('/api/admin/users/:id', auth, tournamentAdmin, async(req,res)=>{
  try{
    const uid=req.params.id
    await pool.query('DELETE FROM extra_predictions WHERE avatar_id IN (SELECT id FROM avatars WHERE user_id=$1)',[uid])
    await pool.query('DELETE FROM predictions WHERE avatar_id IN (SELECT id FROM avatars WHERE user_id=$1)',[uid])
    await pool.query('DELETE FROM avatars WHERE user_id=$1',[uid])
    await pool.query('DELETE FROM users WHERE id=$1 AND tournament_id=$2',[uid,req.user.tournamentId])
    res.json({success:true})
  }catch(e){ res.status(500).json({error:'Error al eliminar usuario'}) }
})

app.get('/api/admin/phase-locks', auth, tournamentAdmin, async(req,res)=>{
  try{
    const {rows}=await pool.query('SELECT * FROM phase_locks WHERE tournament_id=$1 ORDER BY phase',[req.user.tournamentId])
    res.json(rows)
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.put('/api/admin/phase-locks/:phase', auth, tournamentAdmin, async(req,res)=>{
  const {isLocked,autoLockHours}=req.body
  try{
    await pool.query(`
      INSERT INTO phase_locks(tournament_id,phase,is_locked,auto_lock_hours) VALUES($1,$2,$3,$4)
      ON CONFLICT(tournament_id,phase) DO UPDATE SET is_locked=$3,auto_lock_hours=COALESCE($4,phase_locks.auto_lock_hours)`,
      [req.user.tournamentId,req.params.phase,!!isLocked,autoLockHours||null])
    res.json({success:true})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

// Admin: update tournament branding
app.put('/api/admin/tournament', auth, tournamentAdmin, async(req,res)=>{
  const {name,logoUrl,primaryColor,predictions_open}=req.body
  try{
    await pool.query(`
      UPDATE tournaments SET
        name=COALESCE($1,name), logo_url=COALESCE($2,logo_url),
        primary_color=COALESCE($3,primary_color),
        predictions_open=COALESCE($4,predictions_open)
      WHERE id=$5`,
      [name,logoUrl,primaryColor,predictions_open,req.user.tournamentId])
    res.json({success:true})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

// Admin: enter match results
app.post('/api/admin/results', auth, tournamentAdmin, async(req,res)=>{
  const {matchId,home,away,hadPenalties,penaltyWinner,yellowCards,redCards,penaltiesCount,goalsFirstHalf,goalsSecondHalf,mvpPlayer}=req.body
  try{
    await pool.query(`
      INSERT INTO match_results(match_id,score_home,score_away,had_penalties,penalty_winner,yellow_cards,red_cards,penalties_count,goals_first_half,goals_second_half,mvp_player)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT(match_id) DO UPDATE SET score_home=$2,score_away=$3,had_penalties=$4,penalty_winner=$5,yellow_cards=$6,red_cards=$7,penalties_count=$8,goals_first_half=$9,goals_second_half=$10,mvp_player=$11,entered_at=NOW()`,
      [matchId,+home,+away,!!hadPenalties,penaltyWinner||null,yellowCards??null,redCards??null,penaltiesCount??null,goalsFirstHalf??null,goalsSecondHalf??null,mvpPlayer||null])
    // Recalculate points for all predictions of this match in this tournament
    const {rows:preds}=await pool.query(`
      SELECT p.*,m.phase FROM predictions p JOIN matches m ON m.id=p.match_id
      JOIN avatars av ON av.id=p.avatar_id WHERE p.match_id=$1 AND av.tournament_id=$2`,[matchId,req.user.tournamentId])
    const result={match_id:matchId,score_home:+home,score_away:+away,had_penalties:!!hadPenalties,penalty_winner:penaltyWinner||null}
    for(const p of preds){
      const pts=calcPoints(p,result,p.phase)
      await pool.query('UPDATE predictions SET points_earned=$1 WHERE id=$2',[pts,p.id])
    }
    res.json({success:true,updated:preds.length})
  }catch(e){ console.error(e); res.status(500).json({error:'Error'}) }
})

// ─── TRIVIA ────────────────────────────────────────────────────────────────────

// Get all trivia for tournament (admin view)
app.get('/api/admin/trivia', auth, async(req,res)=>{
  try{
    const tid=req.user.tournamentId
    const {rows}=await pool.query(`
      SELECT tq.*,
        COUNT(ta.id) as answer_count,
        COUNT(ta.id) FILTER(WHERE ta.is_correct) as correct_count
      FROM trivia_questions tq
      LEFT JOIN trivia_answers ta ON ta.trivia_id=tq.id
      WHERE tq.tournament_id=$1
      GROUP BY tq.id ORDER BY tq.created_at DESC`,[tid])
    res.json(rows)
  }catch(e){res.status(500).json({error:e.message})}
})

// Create trivia question (admin)
app.post('/api/admin/trivia', auth, async(req,res)=>{
  if(!req.user.isAdmin) return res.status(403).json({error:'Solo admin'})
  const {question,options,correct_answer,difficulty}=req.body
  if(!question||!options||options.length<2||correct_answer==null) return res.status(400).json({error:'Datos incompletos'})
  const pts={easy:2,medium:3,hard:4}[difficulty]||2
  try{
    const id='trv-'+crypto.randomBytes(8).toString('hex')
    const {rows:[q]}=await pool.query(`
      INSERT INTO trivia_questions(id,tournament_id,question,options,correct_answer,difficulty,points,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id,req.user.tournamentId,question,JSON.stringify(options),correct_answer,difficulty||'easy',pts,req.user.id])
    res.json(q)
  }catch(e){res.status(500).json({error:e.message})}
})

// Delete trivia question (admin)
app.delete('/api/admin/trivia/:id', auth, async(req,res)=>{
  if(!req.user.isAdmin) return res.status(403).json({error:'Solo admin'})
  try{
    await pool.query('DELETE FROM trivia_questions WHERE id=$1 AND tournament_id=$2',[req.params.id,req.user.tournamentId])
    res.json({success:true})
  }catch(e){res.status(500).json({error:e.message})}
})

// Toggle trivia active/inactive
app.put('/api/admin/trivia/:id/toggle', auth, async(req,res)=>{
  if(!req.user.isAdmin) return res.status(403).json({error:'Solo admin'})
  try{
    const {rows:[q]}=await pool.query('SELECT is_active FROM trivia_questions WHERE id=$1',[req.params.id])
    if(!q) return res.status(404).json({error:'No encontrada'})
    await pool.query('UPDATE trivia_questions SET is_active=$1 WHERE id=$2',[!q.is_active,req.params.id])
    res.json({is_active:!q.is_active})
  }catch(e){res.status(500).json({error:e.message})}
})

// Pele IA: generate trivia question suggestion
app.post('/api/admin/trivia/generate', auth, async(req,res)=>{
  if(!req.user.isAdmin) return res.status(403).json({error:'Solo admin'})
  const diff=req.body.difficulty||'easy'
  const topicHint=req.body.topic||'futbol del Mundial 2026'
  try{
    const msg=await anthropic.messages.create({
      model:'claude-sonnet-4-6',max_tokens:400,
      system:'Eres Pele IA. Genera una pregunta de trivia de futbol en espanol. Responde SOLO JSON: {"question":"...","options":["A","B","C","D"],"correct_answer":0,"explanation":"..."} correct_answer es el indice 0-3 de la correcta. Sin markdown.',
      messages:[{role:'user',content:'Genera pregunta de trivia. Dificultad: '+diff+'. Tema: '+topicHint+'. SOLO JSON.'}]
    })
    let text=msg.content[0].text.trim().replace(/```json|```/g,'').trim()
    const m=text.match(/\{[\s\S]*\}/);if(m)text=m[0]
    res.json(JSON.parse(text))
  }catch(e){res.status(500).json({error:'Error generando: '+e.message})}
})

// Get trivia for user (unanswered, active questions for their avatar)
app.get('/api/trivia/:avatarId', auth, async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT tq.id,tq.question,tq.options,tq.difficulty,tq.points
      FROM trivia_questions tq
      WHERE tq.tournament_id=$1 AND tq.is_active=TRUE
        AND tq.id NOT IN (SELECT trivia_id FROM trivia_answers WHERE avatar_id=$2)
      ORDER BY tq.created_at DESC`,
      [req.user.tournamentId,req.params.avatarId])
    res.json(rows)
  }catch(e){res.status(500).json({error:e.message})}
})

// Submit trivia answer (one shot only)
app.post('/api/trivia/:triviaId/answer', auth, async(req,res)=>{
  const {avatarId,answerIdx}=req.body
  if(answerIdx==null||!avatarId) return res.status(400).json({error:'Datos incompletos'})
  try{
    const {rows:[av]}=await pool.query('SELECT id FROM avatars WHERE id=$1 AND user_id=$2',[avatarId,req.user.id])
    if(!av) return res.status(403).json({error:'Avatar no encontrado'})
    const {rows:[q]}=await pool.query('SELECT * FROM trivia_questions WHERE id=$1 AND tournament_id=$2',[req.params.triviaId,req.user.tournamentId])
    if(!q) return res.status(404).json({error:'Pregunta no encontrada'})
    const {rows:[existing]}=await pool.query('SELECT id FROM trivia_answers WHERE trivia_id=$1 AND avatar_id=$2',[req.params.triviaId,avatarId])
    if(existing) return res.status(400).json({error:'Ya respondiste esta pregunta'})
    const isCorrect=parseInt(answerIdx)===q.correct_answer
    const pts=isCorrect?q.points:0
    const id='ta-'+crypto.randomBytes(8).toString('hex')
    await pool.query('INSERT INTO trivia_answers(id,trivia_id,avatar_id,answer_idx,is_correct,points_earned) VALUES($1,$2,$3,$4,$5,$6)',
      [id,q.id,avatarId,answerIdx,isCorrect,pts])
    res.json({isCorrect,points_earned:pts,correct_answer:q.correct_answer})
  }catch(e){res.status(500).json({error:e.message})}
})

// Registration bonus info
app.get('/api/bonus/:avatarId', auth, async(req,res)=>{
  try{
    const {rows:[b]}=await pool.query('SELECT * FROM registration_bonus WHERE avatar_id=$1',[req.params.avatarId])
    res.json(b||null)
  }catch(e){res.status(500).json({error:e.message})}
})


// ─── SUPER ADMIN (dueño de la plataforma) ────────────────────────────────────
function superAdmin(req,res,next){
  const key=req.headers['x-super-key']||req.query.key
  if(key!==process.env.SUPER_ADMIN_KEY) return res.status(403).json({error:'Acceso denegado'})
  next()
}

// Ver todas las pollas
app.get('/superadmin/tournaments', superAdmin, async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT t.id,t.slug,t.name,t.owner_name,t.owner_email,t.is_active,t.mp_payment_id,t.created_at,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT av.id) as avatar_count
      FROM tournaments t
      LEFT JOIN users u ON u.tournament_id=t.id
      LEFT JOIN avatars av ON av.tournament_id=t.id
      GROUP BY t.id ORDER BY t.created_at DESC`)
    res.json({total:rows.length, revenue_usd:(rows.filter(r=>r.is_active).length*3.99).toFixed(2), tournaments:rows})
  }catch(e){res.status(500).json({error:e.message})}
})

// Activar torneo manualmente
app.post('/superadmin/activate/:id', superAdmin, async(req,res)=>{
  try{
    const {rowCount}=await pool.query('UPDATE tournaments SET is_active=TRUE WHERE id=$1',[req.params.id])
    if(rowCount===0) return res.status(404).json({error:'Torneo no encontrado'})
    const phases=['group','round32','round16','quarters','semis','third','final']
    for(const ph of phases)
      await pool.query('INSERT INTO phase_locks(tournament_id,phase) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.params.id,ph])
    res.json({success:true})
  }catch(e){res.status(500).json({error:e.message})}
})

// Activar por slug
app.post('/superadmin/activate-slug/:slug', superAdmin, async(req,res)=>{
  try{
    const {rows:[t]}=await pool.query('SELECT id FROM tournaments WHERE slug=$1',[req.params.slug])
    if(!t) return res.status(404).json({error:'Torneo no encontrado'})
    await pool.query('UPDATE tournaments SET is_active=TRUE WHERE id=$1',[t.id])
    const phases=['group','round32','round16','quarters','semis','third','final']
    for(const ph of phases)
      await pool.query('INSERT INTO phase_locks(tournament_id,phase) VALUES($1,$2) ON CONFLICT DO NOTHING',[t.id,ph])
    res.json({success:true, tournamentId:t.id})
  }catch(e){res.status(500).json({error:e.message})}
})

// Eliminar torneo
app.delete('/superadmin/tournaments/:id', superAdmin, async(req,res)=>{
  try{
    const id=req.params.id
    await pool.query('DELETE FROM extra_predictions WHERE avatar_id IN (SELECT id FROM avatars WHERE tournament_id=$1)',[id])
    await pool.query('DELETE FROM predictions WHERE avatar_id IN (SELECT id FROM avatars WHERE tournament_id=$1)',[id])
    await pool.query('DELETE FROM special_predictions WHERE avatar_id IN (SELECT id FROM avatars WHERE tournament_id=$1)',[id])
    await pool.query('DELETE FROM avatars WHERE tournament_id=$1',[id])
    await pool.query('DELETE FROM phase_locks WHERE tournament_id=$1',[id])
    await pool.query('DELETE FROM users WHERE tournament_id=$1',[id])
    await pool.query('DELETE FROM tournaments WHERE id=$1',[id])
    res.json({success:true})
  }catch(e){res.status(500).json({error:e.message})}
})

// Super admin: get users of a tournament
app.get('/superadmin/tournaments/:id/users', superAdmin, async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT u.id,u.name,u.email,u.created_at,u.is_admin,
        COALESCE(json_agg(json_build_object('id',av.id,'nickname',av.nickname,'is_active',av.is_active)
          ORDER BY av.created_at) FILTER(WHERE av.id IS NOT NULL),'[]') as avatars
      FROM users u LEFT JOIN avatars av ON u.id=av.user_id
      WHERE u.tournament_id=$1 GROUP BY u.id ORDER BY u.is_admin DESC, u.created_at ASC`,
      [req.params.id])
    res.json(rows)
  }catch(e){res.status(500).json({error:e.message})}
})

// Super admin: delete a user
app.delete('/superadmin/users/:uid', superAdmin, async(req,res)=>{
  try{
    const uid=req.params.uid
    await pool.query('DELETE FROM extra_predictions WHERE avatar_id IN (SELECT id FROM avatars WHERE user_id=$1)',[uid])
    await pool.query('DELETE FROM predictions WHERE avatar_id IN (SELECT id FROM avatars WHERE user_id=$1)',[uid])
    await pool.query('DELETE FROM bracket_predictions WHERE avatar_id IN (SELECT id FROM avatars WHERE user_id=$1)',[uid])
    await pool.query('DELETE FROM special_predictions WHERE avatar_id IN (SELECT id FROM avatars WHERE user_id=$1)',[uid])
    await pool.query('DELETE FROM avatars WHERE user_id=$1',[uid])
    await pool.query('DELETE FROM users WHERE id=$1',[uid])
    res.json({success:true})
  }catch(e){res.status(500).json({error:e.message})}
})

// ─── SUPERADMIN: CREATE COURTESY TOURNAMENT ───────────────────────────────────
app.post('/superadmin/courtesy', superAdmin, async(req,res)=>{
  const {name,ownerName,ownerEmail,slug}=req.body
  if(!name||!ownerName||!ownerEmail) return res.status(400).json({error:'Faltan datos'})
  try{
    // Generate slug if not provided
    const finalSlug=slug||(name.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').slice(0,30)+'-'+crypto.randomBytes(3).toString('hex'))
    const {rows:[existing]}=await pool.query('SELECT id FROM tournaments WHERE slug=$1',[finalSlug])
    if(existing) return res.status(400).json({error:'Slug ya existe: '+finalSlug})

    const tid='t-'+crypto.randomBytes(8).toString('hex')
    const hash=await bcrypt.hash(crypto.randomBytes(12).toString('hex'),10)
    const uid='u-'+crypto.randomBytes(8).toString('hex')

    await pool.query(`INSERT INTO tournaments(id,slug,name,owner_name,owner_email,primary_color,inscription_fee,currency,is_active,is_courtesy)
      VALUES($1,$2,$3,$4,$5,'#F6C90E',0,'USD',TRUE,TRUE)`,[tid,finalSlug,name,ownerName,ownerEmail])

    const phases=['group','round32','round16','quarters','semis','third','final']
    for(const ph of phases)
      await pool.query('INSERT INTO phase_locks(tournament_id,phase) VALUES($1,$2) ON CONFLICT DO NOTHING',[tid,ph])

    // Create admin user for the tournament
    await pool.query('INSERT INTO users(id,tournament_id,name,email,password_hash,is_admin,terms_accepted) VALUES($1,$2,$3,$4,$5,TRUE,TRUE)',
      [uid,tid,ownerName,ownerEmail.toLowerCase(),hash])

    const link=`${process.env.APP_URL||'https://lapollaia.onrender.com'}/t/${finalSlug}`
    res.json({success:true,tournamentId:tid,slug:finalSlug,link})
  }catch(e){console.error('courtesy:',e);res.status(500).json({error:e.message})}
})

// SUPERADMIN: list courtesy tournaments
app.get('/superadmin/courtesy', superAdmin, async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT t.id,t.slug,t.name,t.owner_name,t.owner_email,t.created_at,
        COUNT(DISTINCT u.id) FILTER(WHERE u.is_admin=FALSE) as user_count
      FROM tournaments t LEFT JOIN users u ON u.tournament_id=t.id
      WHERE t.is_courtesy=TRUE
      GROUP BY t.id ORDER BY t.created_at DESC`)
    res.json(rows)
  }catch(e){res.status(500).json({error:e.message})}
})


// Panel HTML del super admin
app.get('/superadmin', superAdmin, async(req,res)=>{
  const key=req.query.key||''
  try{
    const {rows}=await pool.query(`
      SELECT t.id,t.slug,t.name,t.owner_name,t.owner_email,t.is_active,t.mp_payment_id,t.created_at,
        COUNT(DISTINCT u.id) as user_count
      FROM tournaments t LEFT JOIN users u ON u.tournament_id=t.id
      GROUP BY t.id ORDER BY t.created_at DESC`)
    const active=rows.filter(r=>r.is_active&&r.slug!=='demo').length
    const pendingPay=rows.filter(r=>!r.is_active&&r.slug!=='demo').length
    const revenue=(active*3.99).toFixed(2)

    const safeStr=s=>String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;')

    const rows_html=rows.map(t=>{
      const paid=t.is_active
      const isDemo=t.slug==='demo'
      const statusBadge=isDemo
        ?`<span class="badge badge-blue">⚡ Demo</span>`
        :paid
          ?`<span class="badge badge-green">✅ Pagada</span>`
          :`<span class="badge badge-amber">⏳ Pend. pago</span>`
      return `
      <div class="t-row" onclick="viewTournament('${safeStr(t.id)}','${safeStr(t.name)}','${safeStr(t.slug)}')">
        <div class="t-cell">
          <div class="t-name">${t.name}</div>
          <div class="t-slug">/t/${t.slug}</div>
        </div>
        <div class="t-cell">
          <div class="t-admin">${t.owner_name}</div>
          <div class="t-email">${t.owner_email}</div>
        </div>
        <div class="t-cell">${statusBadge}</div>
        <div class="t-cell t-center"><strong>${t.user_count}</strong></div>
        <div class="t-cell t-date">${new Date(t.created_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'2-digit'})}</div>
        <div class="t-cell t-actions" onclick="event.stopPropagation()">
          <button class="btn-act btn-view-t" onclick="viewTournament('${safeStr(t.id)}','${safeStr(t.name)}','${safeStr(t.slug)}')">Ver →</button>
          <button class="btn-act btn-del" onclick="delTournament('${safeStr(t.id)}','${safeStr(t.name)}')">Eliminar</button>
        </div>
      </div>`}).join('')

    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Super Admin — La Polla IA</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Bebas+Neue&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',sans-serif;background:#EFEBE3;color:#1A1814;min-height:100vh}
:root{
  --cream:#F7F4EE;--cream2:#EFEBE3;--cream3:#E5E0D5;
  --ink:#1A1814;--ink2:#3D3A35;--ink3:#7A7570;
  --gold:#C8A84B;--gold-bg:rgba(200,168,75,.1);--gold-border:rgba(200,168,75,.28);
  --green:#2D7D4A;--green-bg:rgba(45,125,74,.08);--green-border:rgba(45,125,74,.22);
  --red:#C0392B;--red-bg:rgba(192,57,43,.07);--red-border:rgba(192,57,43,.18);
  --amber:#B45309;--amber-bg:rgba(180,83,9,.08);--amber-border:rgba(180,83,9,.2);
  --blue:#1d4ed8;--blue-bg:rgba(29,78,216,.07);--blue-border:rgba(29,78,216,.2);
  --border:rgba(26,24,20,.07);--border2:rgba(26,24,20,.13);
  --r:12px;--r-lg:18px;
}
.nav{background:rgba(247,244,238,.96);backdrop-filter:blur(20px);padding:.7rem 1.5rem;
  display:flex;align-items:center;justify-content:space-between;
  border-bottom:1px solid var(--border2);position:sticky;top:0;z-index:100;box-shadow:0 1px 8px rgba(26,24,20,.05)}
.nav-l{display:flex;align-items:center;gap:10px}
.nav-icon{width:32px;height:32px;background:var(--gold-bg);border:1px solid var(--gold-border);
  border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px}
.nav-title{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:1.5px;color:var(--ink)}
.nav-sub{font-size:10px;color:var(--ink3);letter-spacing:.3px}
.nav-key{font-size:10px;font-family:monospace;background:var(--cream3);border:1px solid var(--border2);border-radius:6px;padding:3px 9px;color:var(--ink3)}
.wrap{max-width:1100px;margin:0 auto;padding:1.5rem}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin-bottom:1.5rem}
.stat{background:var(--cream);border:1px solid var(--border);border-radius:var(--r);padding:1rem 1.25rem}
.stat-n{font-family:'Bebas Neue',sans-serif;font-size:2.2rem;line-height:1}
.stat-n.gold{color:var(--gold)}.stat-n.green{color:var(--green)}.stat-n.amber{color:var(--amber)}
.stat-l{font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:.5px;margin-top:3px}
.sec-label{font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:.6rem}
.t-table{background:var(--cream);border:1px solid var(--border2);border-radius:var(--r-lg);overflow:hidden}
.t-head{display:grid;grid-template-columns:2.2fr 1.8fr .85fr .45fr .7fr 1fr;
  background:var(--cream2);border-bottom:1px solid var(--border)}
.t-th{font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.6px;padding:.65rem 1rem}
.t-row{display:grid;grid-template-columns:2.2fr 1.8fr .85fr .45fr .7fr 1fr;
  border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s;align-items:center}
.t-row:last-child{border-bottom:none}
.t-row:hover{background:#f0ece3}
.t-cell{padding:.75rem 1rem}
.t-name{font-size:13px;font-weight:700;color:var(--ink)}
.t-slug{font-family:monospace;font-size:10px;color:var(--ink3);margin-top:2px}
.t-admin{font-size:12px;font-weight:600;color:var(--ink)}
.t-email{font-size:10px;color:var(--ink3);margin-top:1px}
.t-center{text-align:center;font-size:14px;font-weight:700}
.t-date{font-size:11px;color:var(--ink3)}
.t-actions{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
.badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:50px;font-size:10px;font-weight:700;white-space:nowrap}
.badge-green{background:var(--green-bg);color:var(--green);border:1px solid var(--green-border)}
.badge-amber{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-border)}
.badge-blue{background:var(--blue-bg);color:var(--blue);border:1px solid var(--blue-border)}
.badge-red{background:var(--red-bg);color:var(--red);border:1px solid var(--red-border)}
.btn-act{border:none;border-radius:6px;padding:4px 10px;font-size:10px;font-weight:700;cursor:pointer;transition:all .12s;white-space:nowrap}
.btn-view-t{background:var(--gold-bg);color:var(--gold);border:1px solid var(--gold-border)}
.btn-view-t:hover{background:var(--gold);color:#fff}
.btn-del{background:var(--red-bg);color:var(--red);border:1px solid var(--red-border)}
.btn-del:hover{background:var(--red);color:#fff}
.btn-del-u{background:var(--red-bg);color:var(--red);border:1px solid var(--red-border);border-radius:6px;padding:3px 8px;font-size:10px;font-weight:700;cursor:pointer}
.btn-del-u:hover{background:var(--red);color:#fff}
.btn-back{background:transparent;border:1.5px solid var(--border2);border-radius:50px;
  padding:6px 16px;font-size:12px;font-weight:600;color:var(--ink2);cursor:pointer;display:inline-flex;align-items:center;gap:5px}
.btn-back:hover{background:var(--cream2)}
.detail-header{background:var(--cream);border:1px solid var(--border2);border-radius:var(--r-lg);
  padding:1.25rem 1.5rem;margin-bottom:1rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.detail-icon{width:44px;height:44px;background:var(--gold-bg);border:1px solid var(--gold-border);
  border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0}
.detail-title{font-family:'Bebas Neue',sans-serif;font-size:1.25rem;letter-spacing:1px}
.detail-meta{font-size:11px;color:var(--ink3);margin-top:2px}
.detail-url{font-family:monospace;font-size:11px;background:var(--cream2);border:1px solid var(--border);
  border-radius:6px;padding:2px 8px;color:var(--gold);display:inline-block;margin-top:4px}
.u-table{background:var(--cream);border:1px solid var(--border2);border-radius:var(--r-lg);overflow:hidden}
.u-head{display:grid;grid-template-columns:2fr 2fr .9fr 1fr .8fr;
  background:var(--cream2);border-bottom:1px solid var(--border)}
.u-th{font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.5px;padding:.6rem 1rem}
.u-row{display:grid;grid-template-columns:2fr 2fr .9fr 1fr .8fr;
  border-bottom:1px solid var(--border);align-items:center}
.u-row:last-child{border-bottom:none}
.u-cell{padding:.65rem 1rem;font-size:12px;color:var(--ink2)}
.u-name{font-weight:700;color:var(--ink)}
.u-sub{font-size:10px;color:var(--ink3);margin-top:1px}
.empty{text-align:center;padding:2.5rem;color:var(--ink3);font-size:13px}
.spinner-txt{text-align:center;padding:2rem;color:var(--ink3);font-size:13px}
.list-view{display:block}.list-view.hidden{display:none}
.detail-view{display:none}.detail-view.on{display:block}
@media(max-width:800px){
  .stats{grid-template-columns:repeat(2,1fr)}
  .t-head,.t-row{grid-template-columns:1fr auto}
  .t-cell:nth-child(n+3):not(:nth-child(6)){display:none}
}
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-l">
    <div class="nav-icon">🏆</div>
    <div>
      <div class="nav-title">Super Admin — La Polla IA</div>
      <div class="nav-sub">Panel de control global de la plataforma</div>
    </div>
  </div>
  <div class="nav-key">key: ${key.substring(0,4)}****</div>
</nav>

<div class="wrap">

<!-- LIST VIEW -->
<div class="list-view" id="list-view">
  <div class="stats">
    <div class="stat"><div class="stat-n">${rows.length}</div><div class="stat-l">Pollas totales</div></div>
    <div class="stat"><div class="stat-n green">${active}</div><div class="stat-l">Pagadas y activas</div></div>
    <div class="stat"><div class="stat-n amber">${pendingPay}</div><div class="stat-l">Pendientes de pago</div></div>
    <div class="stat"><div class="stat-n gold">$${revenue}</div><div class="stat-l">Ingresos USD</div></div>
  </div>

  <!-- COURTESY SECTION -->
  <div style="margin-bottom:1.5rem;background:var(--cream);border:1.5px solid var(--gold-border);border-radius:var(--r-lg);padding:1.25rem 1.5rem">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem">
      <div style="font-size:1.3rem">🎁</div>
      <div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:1px;color:var(--ink)">POLLAS DE CORTESÍA</div>
        <div style="font-size:11px;color:var(--ink3)">Crea pollas gratuitas (sin pago) y comparte el link directo.</div>
      </div>
    </div>
    <div id="courtesy-list" style="margin-bottom:1rem"><div style="font-size:12px;color:var(--ink3)">Cargando...</div></div>
    <div style="background:var(--cream2);border:1px solid var(--border);border-radius:var(--r);padding:1rem" id="courtesy-form">
      <div style="font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.75rem">Nueva polla de cortesía</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <input id="c-name" placeholder="Nombre de la polla (ej: Polla Familia García)" style="padding:8px 10px;border:1px solid var(--border2);border-radius:8px;font-size:12px;font-family:inherit"/>
        <input id="c-slug" placeholder="slug-personalizado (opcional)" style="padding:8px 10px;border:1px solid var(--border2);border-radius:8px;font-size:12px;font-family:monospace"/>
        <input id="c-owner" placeholder="Nombre del admin" style="padding:8px 10px;border:1px solid var(--border2);border-radius:8px;font-size:12px;font-family:inherit"/>
        <input id="c-email" placeholder="Email del admin" style="padding:8px 10px;border:1px solid var(--border2);border-radius:8px;font-size:12px;font-family:inherit"/>
      </div>
      <button onclick="createCourtesy()" style="background:var(--gold);color:#fff;border:none;border-radius:8px;padding:8px 20px;font-size:12px;font-weight:700;cursor:pointer;width:100%">🎁 Crear polla gratis y generar link</button>
      <div id="courtesy-result" style="margin-top:.75rem"></div>
    </div>
  </div>

  <div class="sec-label">Todas las pollas</div>
  <div class="t-table">
    <div class="t-head">
      <div class="t-th">Nombre / Slug</div>
      <div class="t-th">Administrador</div>
      <div class="t-th">Estado</div>
      <div class="t-th">Usuarios</div>
      <div class="t-th">Fecha</div>
      <div class="t-th">Acciones</div>
    </div>
    ${rows_html}
  </div>
</div>

<!-- DETAIL VIEW -->
<div class="detail-view" id="detail-view">
  <button class="btn-back" onclick="backToList()" style="margin-bottom:1rem">← Volver a todas las pollas</button>
  <div class="detail-header" id="detail-header"></div>
  <div class="sec-label">Participantes</div>
  <div id="users-container"></div>
</div>

</div><!-- /wrap -->

<script>
const KEY='${key}'

async function delTournament(id,name){
  if(!confirm('¿ELIMINAR "'+name+'" y TODOS sus datos? Esto no se puede deshacer.'))return
  const r=await fetch('/superadmin/tournaments/'+id,{method:'DELETE',headers:{'x-super-key':KEY}})
  const d=await r.json()
  if(d.success)location.reload(); else alert('Error: '+d.error)
}

async function viewTournament(id,name,slug){
  document.getElementById('list-view').classList.add('hidden')
  const dv=document.getElementById('detail-view')
  dv.classList.add('on')
  document.getElementById('detail-header').innerHTML=\`
    <div style="width:44px;height:44px;background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0">🏆</div>
    <div style="flex:1">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.25rem;letter-spacing:1px">\${name}</div>
      <div style="font-size:11px;color:var(--ink3);margin-top:2px">ID: \${id}</div>
      <div style="font-family:monospace;font-size:11px;background:var(--cream2);border:1px solid var(--border);border-radius:6px;padding:2px 8px;color:var(--gold);display:inline-block;margin-top:4px">lapollaia.com/t/\${slug}</div>
    </div>
    <button class="btn-act btn-del" onclick="delTournament('\${id}','\${name}')">Eliminar polla completa</button>
  \`
  const uc=document.getElementById('users-container')
  uc.innerHTML='<div class="spinner-txt">Cargando participantes...</div>'
  try{
    const r=await fetch('/superadmin/tournaments/'+id+'/users',{headers:{'x-super-key':KEY}})
    const users=await r.json()
    if(!Array.isArray(users)||users.length===0){
      uc.innerHTML='<div class="u-table"><div class="empty">No hay participantes aún.</div></div>'
      return
    }
    const rows=users.map(u=>{
      const av=(u.avatars||[])[0]
      const approved=av?.is_active
      const isAdmin=u.is_admin
      return \`<div class="u-row">
        <div class="u-cell"><div class="u-name">\${u.name}\${isAdmin?' <span style="font-size:9px;background:var(--gold-bg);color:var(--gold);border:1px solid var(--gold-border);border-radius:4px;padding:1px 5px;margin-left:4px">Admin</span>':''}</div></div>
        <div class="u-cell"><div class="u-sub">\${u.email}</div></div>
        <div class="u-cell">
          \${approved
            ?'<span class="badge badge-green" style="font-size:9px">✅ Aprobado</span>'
            :'<span class="badge badge-amber" style="font-size:9px">⏳ Pendiente</span>'}
        </div>
        <div class="u-cell u-sub">\${new Date(u.created_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
        <div class="u-cell">
          \${!isAdmin
            ?'<button class="btn-del-u" onclick="delUser(\\\''+u.id+'\\\',\\\''+u.name.replace(/'/g,"\\\\'")+'\\\')">Eliminar</button>'
            :'<span style="font-size:10px;color:var(--ink3)">—</span>'}
        </div>
      </div>\`
    }).join('')
    uc.innerHTML=\`<div class="u-table">
      <div class="u-head">
        <div class="u-th">Nombre</div>
        <div class="u-th">Correo</div>
        <div class="u-th">Estado</div>
        <div class="u-th">Se unió</div>
        <div class="u-th">Acción</div>
      </div>
      \${rows}
    </div>\`
  }catch(e){ uc.innerHTML='<div class="empty">Error cargando: '+e.message+'</div>' }
}

window._currentTournamentId=null
async function delUser(uid,name){
  if(!confirm('¿Eliminar a "'+name+'" y todos sus pronósticos?'))return
  const r=await fetch('/superadmin/users/'+uid,{method:'DELETE',headers:{'x-super-key':KEY}})
  const d=await r.json()
  if(d.success){
    document.querySelectorAll('.u-row').forEach(row=>{
      if(row.innerHTML.includes(uid)) row.remove()
    })
    // reload detail to refresh counts
    const header=document.getElementById('detail-header')
    const titleEl=header.querySelector('[style*="Bebas"]')
    const slugEl=header.querySelector('[style*="lapollaia.com"]')
    if(titleEl&&slugEl){
      const tournamentName=titleEl.textContent
      const slug=slugEl.textContent.replace('lapollaia.com/t/','')
      // just refresh users section
      location.reload()
    }
  } else alert('Error: '+d.error)
}

function backToList(){
  document.getElementById('list-view').classList.remove('hidden')
  document.getElementById('detail-view').classList.remove('on')
}

// ── Courtesy tournaments ─────────────────────────────────────────────────────
async function loadCourtesy(){
  try{
    const r=await fetch('/superadmin/courtesy',{headers:{'x-super-key':KEY}})
    const rows=await r.json()
    const el=document.getElementById('courtesy-list')
    if(!rows.length){el.innerHTML='<div style="font-size:12px;color:var(--ink3)">No hay pollas de cortesia aun.</div>';return}
    el.innerHTML=rows.map(function(t){
      var uc=t.user_count||0
      var link='https://lapollaia.onrender.com/t/'+t.slug
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:12px;font-weight:700;color:var(--ink)">'+t.name+'</div>'+
          '<div style="font-family:monospace;font-size:10px;color:var(--gold)">lapollaia.com/t/'+t.slug+'</div>'+
        '</div>'+
        '<div style="font-size:11px;'+(uc>0?'color:var(--green);font-weight:700':'color:var(--ink3)')+'">'+uc+' participantes</div>'+
        '<button onclick="copyCourtesyLink(\''+link+'\')" style="background:var(--gold-bg);color:var(--gold);border:1px solid var(--gold-border);border-radius:6px;padding:4px 10px;font-size:10px;font-weight:700;cursor:pointer">Copiar link</button>'+
        '<button onclick="delTournament(\''+t.id+'\',\''+t.name+'\')" style="background:var(--red-bg);color:var(--red);border:1px solid var(--red-border);border-radius:6px;padding:4px 10px;font-size:10px;font-weight:700;cursor:pointer">Eliminar</button>'+
      '</div>'
    }).join('')
  }catch(e){document.getElementById('courtesy-list').innerHTML='<div style="font-size:12px;color:red">Error: '+e.message+'</div>'}
}

async function createCourtesy(){
  var name=document.getElementById('c-name').value.trim()
  var slug=document.getElementById('c-slug').value.trim()
  var ownerName=document.getElementById('c-owner').value.trim()
  var ownerEmail=document.getElementById('c-email').value.trim()
  var res_el=document.getElementById('courtesy-result')
  if(!name||!ownerName||!ownerEmail){res_el.innerHTML='<div style="color:red;font-size:12px">Completa todos los campos requeridos</div>';return}
  res_el.innerHTML='<div style="font-size:12px;color:var(--ink3)">Creando...</div>'
  try{
    var r=await fetch('/superadmin/courtesy',{method:'POST',headers:{'Content-Type':'application/json','x-super-key':KEY},body:JSON.stringify({name:name,slug:slug,ownerName:ownerName,ownerEmail:ownerEmail})})
    var d=await r.json()
    if(!r.ok){res_el.innerHTML='<div style="color:red;font-size:12px">Error: '+d.error+'</div>';return}
    var link=d.link||('https://lapollaia.onrender.com/t/'+d.slug)
    res_el.innerHTML='<div style="background:var(--green-bg);border:1px solid var(--green-border);border-radius:8px;padding:.75rem 1rem">'+
      '<div style="font-size:12px;font-weight:700;color:var(--green);margin-bottom:6px">Polla creada exitosamente</div>'+
      '<div id="courtesy-link-box" style="font-family:monospace;font-size:11px;background:#fff;border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--ink);word-break:break-all;margin-bottom:8px">'+link+'</div>'+
      '<button onclick="copyCourtesyLink(\''+link+'\')" style="background:var(--green);color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer">Copiar link</button>'+
    '</div>'
    document.getElementById('c-name').value=''
    document.getElementById('c-slug').value=''
    document.getElementById('c-owner').value=''
    document.getElementById('c-email').value=''
    loadCourtesy()
  }catch(e){res_el.innerHTML='<div style="color:red;font-size:12px">Error: '+e.message+'</div>'}
}

function copyCourtesyLink(url){
  navigator.clipboard.writeText(url).then(function(){
    alert('Link copiado: '+url)
  }).catch(function(){
    prompt('Copia este link:',url)
  })
}

loadCourtesy()
</script>
</body>
</html>`)
  }catch(e){res.status(500).send('Error: '+e.message)}
})


// ─── START ────────────────────────────────────────────────────────────────────
initDb().then(()=>{
  app.listen(PORT,()=>console.log(`🚀 La Polla IA v2.0 en puerto ${PORT}`))
}).catch(e=>{ console.error('DB error:',e); process.exit(1) })
