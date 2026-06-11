'use strict'
const express = require('express')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const path = require('path')
const crypto = require('crypto')
// google-auth-library removed
const Anthropic = require('@anthropic-ai/sdk')
const { calcPoints, calcExtraPoints } = require('./scoring')

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
// googleClient removed
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

app.use(express.json({ limit: '10mb' }))
app.use(express.static(path.join(__dirname, 'public')))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// ─── DB INIT ──────────────────────────────────────────────────────────────────
async function initDb() {
  const c = await pool.connect()
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS users(
        id TEXT PRIMARY KEY, google_id TEXT UNIQUE, name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL, picture TEXT, phone TEXT,
        whatsapp_consent BOOLEAN DEFAULT FALSE, is_admin BOOLEAN DEFAULT FALSE,
        password_hash TEXT, terms_accepted BOOLEAN DEFAULT FALSE,
        terms_accepted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS avatars(
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
        nickname TEXT UNIQUE NOT NULL, photo_url TEXT,
        is_paid BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS matches(
        id SERIAL PRIMARY KEY, match_num INTEGER NOT NULL,
        phase TEXT NOT NULL DEFAULT 'group',
        team1 TEXT, team2 TEXT, match_date TIMESTAMPTZ,
        venue TEXT, group_name TEXT, label TEXT
      );
      CREATE TABLE IF NOT EXISTS phase_locks(
        phase TEXT PRIMARY KEY, is_locked BOOLEAN DEFAULT FALSE,
        auto_lock_hours INTEGER DEFAULT 2
      );
      CREATE TABLE IF NOT EXISTS predictions(
        id TEXT PRIMARY KEY, avatar_id TEXT NOT NULL REFERENCES avatars(id),
        match_id INTEGER NOT NULL REFERENCES matches(id),
        score_home INTEGER, score_away INTEGER, penalty_winner TEXT,
        points_earned INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(avatar_id, match_id)
      );
      CREATE TABLE IF NOT EXISTS extra_predictions(
        id TEXT PRIMARY KEY, avatar_id TEXT NOT NULL REFERENCES avatars(id),
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
        avatar_id TEXT PRIMARY KEY REFERENCES avatars(id),
        champion_team TEXT, surprise_team TEXT,
        balon_de_oro TEXT, guante_de_oro TEXT, bota_de_oro TEXT,
        champion_pts INTEGER DEFAULT 0, surprise_pts INTEGER DEFAULT 0,
        balon_pts INTEGER DEFAULT 0, guante_pts INTEGER DEFAULT 0,
        bota_pts INTEGER DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS whatsapp_numbers(
        id SERIAL PRIMARY KEY, phone TEXT NOT NULL, name TEXT,
        is_active BOOLEAN DEFAULT TRUE, added_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await c.query(`
      INSERT INTO settings(key,value) VALUES
        ('predictions_open','true'),('paypal','pollamundial2026@gmail.com'),
        ('nequi','300-000-0000'),('inscription_fee','20'),
        ('bg_brightness','30'),('bg_blur','4')
      ON CONFLICT(key) DO NOTHING
    `)

    const phases = ['group','round32','round16','quarters','semis','third','final']
    for(const ph of phases)
      await c.query(`INSERT INTO phase_locks(phase) VALUES($1) ON CONFLICT(phase) DO NOTHING`,[ph])

    const adminEmail = process.env.ADMIN_EMAIL||'admin@polla2026.com'
    const adminPass  = process.env.ADMIN_PASSWORD||'Mundial2026!'
    const hash = await bcrypt.hash(adminPass, 12)
    const adminId = 'admin-'+crypto.randomBytes(8).toString('hex')
    await c.query(`
      INSERT INTO users(id,name,email,password_hash,is_admin,terms_accepted)
      VALUES($1,'Administrador',$2,$3,TRUE,TRUE)
      ON CONFLICT(email) DO NOTHING
    `,[adminId, adminEmail, hash])

    const {rows:[{count}]} = await c.query('SELECT COUNT(*) FROM matches')
    if(+count===0) await seedMatches(c)
    console.log('✅ DB lista — 104 partidos')
  } finally { c.release() }
}

// ─── SEED MATCHES — CALENDARIO OFICIAL FIFA 2026 ─────────────────────────────
// Todas las fechas en UTC. Hora ET (verano, EDT = UTC-4)
// Grupos confirmados post-playoffs marzo 2026
async function seedMatches(c) {
  // Helper: insert match
  const ins = (num, phase, t1, t2, date, venue, grp, label) =>
    c.query('INSERT INTO matches(match_num,phase,team1,team2,match_date,venue,group_name,label) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [num, phase, t1||null, t2||null, date, venue, grp||null, label||null])

  let n = 1

  // ── GRUPO A: México, Sudáfrica, Corea del Sur, Rep. Checa ─────────────────
  await ins(n++,'group','Mexico','South Africa',       '2026-06-11T19:00:00Z','Estadio Azteca, Ciudad de México','A',null)
  await ins(n++,'group','Korea Republic','Czechia',    '2026-06-12T02:00:00Z','Estadio Akron, Guadalajara','A',null)
  await ins(n++,'group','Czechia','South Africa',      '2026-06-18T16:00:00Z','Mercedes-Benz Stadium, Atlanta','A',null)
  await ins(n++,'group','Mexico','Korea Republic',     '2026-06-19T01:00:00Z','Estadio Akron, Guadalajara','A',null)
  await ins(n++,'group','Czechia','Mexico',            '2026-06-25T01:00:00Z','Estadio Azteca, Ciudad de México','A',null)
  await ins(n++,'group','South Africa','Korea Republic','2026-06-25T01:00:00Z','Estadio BBVA, Monterrey','A',null)

  // ── GRUPO B: Canadá, Bosnia y Herzegovina, Qatar, Suiza ───────────────────
  await ins(n++,'group','Canada','Bosnia and Herzegovina','2026-06-12T19:00:00Z','BMO Field, Toronto','B',null)
  await ins(n++,'group','Qatar','Switzerland',         '2026-06-13T19:00:00Z',"Levi's Stadium, Santa Clara",'B',null)
  await ins(n++,'group','Switzerland','Bosnia and Herzegovina','2026-06-18T19:00:00Z','SoFi Stadium, Los Ángeles','B',null)
  await ins(n++,'group','Canada','Qatar',              '2026-06-18T22:00:00Z','BC Place, Vancouver','B',null)
  await ins(n++,'group','Switzerland','Canada',        '2026-06-24T19:00:00Z','BC Place, Vancouver','B',null)
  await ins(n++,'group','Bosnia and Herzegovina','Qatar','2026-06-24T19:00:00Z','Lumen Field, Seattle','B',null)

  // ── GRUPO C: Brasil, Marruecos, Haití, Escocia ────────────────────────────
  await ins(n++,'group','Brazil','Morocco',            '2026-06-13T22:00:00Z','MetLife Stadium, Nueva York/NJ','C',null)
  await ins(n++,'group','Haiti','Scotland',            '2026-06-14T01:00:00Z','Gillette Stadium, Boston','C',null)
  await ins(n++,'group','Scotland','Morocco',          '2026-06-19T22:00:00Z','Gillette Stadium, Boston','C',null)
  await ins(n++,'group','Brazil','Haiti',              '2026-06-20T01:00:00Z','Lincoln Financial Field, Filadelfia','C',null)
  await ins(n++,'group','Scotland','Brazil',           '2026-06-24T22:00:00Z','Hard Rock Stadium, Miami','C',null)
  await ins(n++,'group','Morocco','Haiti',             '2026-06-24T22:00:00Z','Mercedes-Benz Stadium, Atlanta','C',null)

  // ── GRUPO D: EE.UU., Paraguay, Australia, Turquía ─────────────────────────
  await ins(n++,'group','USA','Paraguay',              '2026-06-13T01:00:00Z','SoFi Stadium, Los Ángeles','D',null)
  await ins(n++,'group','Australia','Turkey',          '2026-06-13T04:00:00Z','BC Place, Vancouver','D',null)
  await ins(n++,'group','Turkey','Paraguay',           '2026-06-19T04:00:00Z',"Levi's Stadium, Santa Clara",'D',null)
  await ins(n++,'group','USA','Australia',             '2026-06-19T19:00:00Z','Lumen Field, Seattle','D',null)
  await ins(n++,'group','Turkey','USA',                '2026-06-26T02:00:00Z','SoFi Stadium, Los Ángeles','D',null)
  await ins(n++,'group','Paraguay','Australia',        '2026-06-26T02:00:00Z',"Levi's Stadium, Santa Clara",'D',null)

  // ── GRUPO E: Alemania, Curazao, Costa de Marfil, Ecuador ──────────────────
  await ins(n++,'group','Germany','Curaçao',           '2026-06-14T17:00:00Z','NRG Stadium, Houston','E',null)
  await ins(n++,'group','Ivory Coast','Ecuador',       '2026-06-14T23:00:00Z','Lincoln Financial Field, Filadelfia','E',null)
  await ins(n++,'group','Germany','Ivory Coast',       '2026-06-20T20:00:00Z','BMO Field, Toronto','E',null)
  await ins(n++,'group','Ecuador','Curaçao',           '2026-06-21T00:00:00Z','Arrowhead Stadium, Kansas City','E',null)
  await ins(n++,'group','Curaçao','Ivory Coast',       '2026-06-25T20:00:00Z','Lincoln Financial Field, Filadelfia','E',null)
  await ins(n++,'group','Ecuador','Germany',           '2026-06-25T20:00:00Z','MetLife Stadium, Nueva York/NJ','E',null)

  // ── GRUPO F: Países Bajos, Japón, Suecia, Túnez ───────────────────────────
  await ins(n++,'group','Netherlands','Japan',         '2026-06-14T20:00:00Z','AT&T Stadium, Dallas','F',null)
  await ins(n++,'group','Sweden','Tunisia',            '2026-06-15T02:00:00Z','Estadio BBVA, Monterrey','F',null)
  await ins(n++,'group','Netherlands','Sweden',        '2026-06-20T17:00:00Z','NRG Stadium, Houston','F',null)
  await ins(n++,'group','Tunisia','Japan',             '2026-06-20T04:00:00Z','Estadio BBVA, Monterrey','F',null)
  await ins(n++,'group','Japan','Sweden',              '2026-06-25T23:00:00Z','AT&T Stadium, Dallas','F',null)
  await ins(n++,'group','Tunisia','Netherlands',       '2026-06-25T23:00:00Z','Arrowhead Stadium, Kansas City','F',null)

  // ── GRUPO G: Bélgica, Egipto, Irán, Nueva Zelanda ─────────────────────────
  await ins(n++,'group','Belgium','Egypt',             '2026-06-15T19:00:00Z','Lumen Field, Seattle','G',null)
  await ins(n++,'group','IR Iran','New Zealand',       '2026-06-16T01:00:00Z','SoFi Stadium, Los Ángeles','G',null)
  await ins(n++,'group','Belgium','IR Iran',           '2026-06-21T19:00:00Z','SoFi Stadium, Los Ángeles','G',null)
  await ins(n++,'group','New Zealand','Egypt',         '2026-06-22T01:00:00Z','BC Place, Vancouver','G',null)
  await ins(n++,'group','Egypt','IR Iran',             '2026-06-27T03:00:00Z','Lumen Field, Seattle','G',null)
  await ins(n++,'group','New Zealand','Belgium',       '2026-06-27T03:00:00Z','BC Place, Vancouver','G',null)

  // ── GRUPO H: España, Cabo Verde, Arabia Saudita, Uruguay ──────────────────
  await ins(n++,'group','Spain','Cape Verde',          '2026-06-15T16:00:00Z','Mercedes-Benz Stadium, Atlanta','H',null)
  await ins(n++,'group','Saudi Arabia','Uruguay',      '2026-06-15T22:00:00Z','Hard Rock Stadium, Miami','H',null)
  await ins(n++,'group','Spain','Saudi Arabia',        '2026-06-21T16:00:00Z','Mercedes-Benz Stadium, Atlanta','H',null)
  await ins(n++,'group','Uruguay','Cape Verde',        '2026-06-21T22:00:00Z','Hard Rock Stadium, Miami','H',null)
  await ins(n++,'group','Cape Verde','Saudi Arabia',   '2026-06-27T00:00:00Z','NRG Stadium, Houston','H',null)
  await ins(n++,'group','Uruguay','Spain',             '2026-06-27T00:00:00Z','Estadio Akron, Guadalajara','H',null)

  // ── GRUPO I: Francia, Senegal, Irak, Noruega ──────────────────────────────
  await ins(n++,'group','France','Senegal',            '2026-06-16T19:00:00Z','MetLife Stadium, Nueva York/NJ','I',null)
  await ins(n++,'group','Iraq','Norway',               '2026-06-16T22:00:00Z','Gillette Stadium, Boston','I',null)
  await ins(n++,'group','France','Iraq',               '2026-06-22T21:00:00Z','Lincoln Financial Field, Filadelfia','I',null)
  await ins(n++,'group','Norway','Senegal',            '2026-06-23T00:00:00Z','MetLife Stadium, Nueva York/NJ','I',null)
  await ins(n++,'group','Norway','France',             '2026-06-26T19:00:00Z','Gillette Stadium, Boston','I',null)
  await ins(n++,'group','Senegal','Iraq',              '2026-06-26T19:00:00Z','BMO Field, Toronto','I',null)

  // ── GRUPO J: Argentina, Argelia, Austria, Jordania ────────────────────────
  await ins(n++,'group','Argentina','Algeria',         '2026-06-17T01:00:00Z','Arrowhead Stadium, Kansas City','J',null)
  await ins(n++,'group','Austria','Jordan',            '2026-06-16T04:00:00Z',"Levi's Stadium, Santa Clara",'J',null)
  await ins(n++,'group','Argentina','Austria',         '2026-06-22T17:00:00Z','AT&T Stadium, Dallas','J',null)
  await ins(n++,'group','Jordan','Algeria',            '2026-06-23T03:00:00Z',"Levi's Stadium, Santa Clara",'J',null)
  await ins(n++,'group','Jordan','Argentina',          '2026-06-28T02:00:00Z','AT&T Stadium, Dallas','J',null)
  await ins(n++,'group','Algeria','Austria',           '2026-06-28T02:00:00Z','Arrowhead Stadium, Kansas City','J',null)

  // ── GRUPO K: Portugal, RD Congo, Uzbekistán, Colombia ─────────────────────
  await ins(n++,'group','Portugal','DR Congo',         '2026-06-17T17:00:00Z','NRG Stadium, Houston','K',null)
  await ins(n++,'group','Uzbekistan','Colombia',       '2026-06-18T02:00:00Z','Estadio Azteca, Ciudad de México','K',null)
  await ins(n++,'group','Portugal','Uzbekistan',       '2026-06-23T17:00:00Z','NRG Stadium, Houston','K',null)
  await ins(n++,'group','Colombia','DR Congo',         '2026-06-24T02:00:00Z','Estadio Akron, Guadalajara','K',null)
  await ins(n++,'group','Colombia','Portugal',         '2026-06-28T23:30:00Z','Hard Rock Stadium, Miami','K',null)
  await ins(n++,'group','DR Congo','Uzbekistan',       '2026-06-28T23:30:00Z','Mercedes-Benz Stadium, Atlanta','K',null)

  // ── GRUPO L: Inglaterra, Croacia, Ghana, Panamá ───────────────────────────
  await ins(n++,'group','England','Croatia',           '2026-06-17T20:00:00Z','AT&T Stadium, Dallas','L',null)
  await ins(n++,'group','Ghana','Panama',              '2026-06-17T23:00:00Z','BMO Field, Toronto','L',null)
  await ins(n++,'group','England','Ghana',             '2026-06-23T20:00:00Z','Gillette Stadium, Boston','L',null)
  await ins(n++,'group','Panama','Croatia',            '2026-06-23T23:00:00Z','BMO Field, Toronto','L',null)
  await ins(n++,'group','Panama','England',            '2026-06-27T21:00:00Z','MetLife Stadium, Nueva York/NJ','L',null)
  await ins(n++,'group','Croatia','Ghana',             '2026-06-27T21:00:00Z','Lincoln Financial Field, Filadelfia','L',null)

  // ── RONDA DE 32 (16 partidos) ──────────────────────────────────────────────
  await ins(n++,'round32',null,null,'2026-06-28T19:00:00Z','SoFi Stadium, Los Ángeles',null,'2do Grupo A vs 2do Grupo B')
  await ins(n++,'round32',null,null,'2026-06-29T17:00:00Z','NRG Stadium, Houston',null,'1ro Grupo C vs 2do Grupo F')
  await ins(n++,'round32',null,null,'2026-06-29T20:30:00Z','Gillette Stadium, Boston',null,'1ro Grupo E vs Mejor 3ro A/B/C/D/F')
  await ins(n++,'round32',null,null,'2026-06-30T01:00:00Z','Estadio BBVA, Monterrey',null,'1ro Grupo F vs 2do Grupo C')
  await ins(n++,'round32',null,null,'2026-06-30T17:00:00Z','AT&T Stadium, Dallas',null,'2do Grupo E vs 2do Grupo I')
  await ins(n++,'round32',null,null,'2026-06-30T21:00:00Z','MetLife Stadium, Nueva York/NJ',null,'1ro Grupo I vs Mejor 3ro C/D/F/G/H')
  await ins(n++,'round32',null,null,'2026-07-01T01:00:00Z','Estadio Azteca, Ciudad de México',null,'1ro Grupo A vs Mejor 3ro C/E/F/H/I')
  await ins(n++,'round32',null,null,'2026-07-01T16:00:00Z','Mercedes-Benz Stadium, Atlanta',null,'1ro Grupo L vs Mejor 3ro E/H/I/J/K')
  await ins(n++,'round32',null,null,'2026-07-01T20:00:00Z','Lumen Field, Seattle',null,'1ro Grupo G vs Mejor 3ro A/E/H/I/J')
  await ins(n++,'round32',null,null,'2026-07-02T00:00:00Z',"Levi's Stadium, San Francisco",null,'1ro Grupo D vs Mejor 3ro B/E/F/I/J')
  await ins(n++,'round32',null,null,'2026-07-02T19:00:00Z','SoFi Stadium, Los Ángeles',null,'1ro Grupo H vs 2do Grupo J')
  await ins(n++,'round32',null,null,'2026-07-02T23:00:00Z','BMO Field, Toronto',null,'2do Grupo K vs 2do Grupo L')
  await ins(n++,'round32',null,null,'2026-07-03T03:00:00Z','BC Place, Vancouver',null,'1ro Grupo B vs Mejor 3ro E/F/G/I/J')
  await ins(n++,'round32',null,null,'2026-07-03T18:00:00Z','AT&T Stadium, Dallas',null,'2do Grupo D vs 2do Grupo G')
  await ins(n++,'round32',null,null,'2026-07-03T22:00:00Z','Hard Rock Stadium, Miami',null,'1ro Grupo J vs 2do Grupo H')
  await ins(n++,'round32',null,null,'2026-07-04T01:30:00Z','Arrowhead Stadium, Kansas City',null,'1ro Grupo K vs Mejor 3ro D/E/I/J/L')

  // ── OCTAVOS DE FINAL (8 partidos) ─────────────────────────────────────────
  await ins(n++,'round16',null,null,'2026-07-04T17:00:00Z','NRG Stadium, Houston',null,'Octavos — Partido 1')
  await ins(n++,'round16',null,null,'2026-07-04T21:00:00Z','Lincoln Financial Field, Filadelfia',null,'Octavos — Partido 2')
  await ins(n++,'round16',null,null,'2026-07-05T20:00:00Z','MetLife Stadium, Nueva York/NJ',null,'Octavos — Partido 3')
  await ins(n++,'round16',null,null,'2026-07-06T00:00:00Z','Estadio Azteca, Ciudad de México',null,'Octavos — Partido 4')
  await ins(n++,'round16',null,null,'2026-07-06T19:00:00Z','AT&T Stadium, Dallas',null,'Octavos — Partido 5')
  await ins(n++,'round16',null,null,'2026-07-07T00:00:00Z','Lumen Field, Seattle',null,'Octavos — Partido 6')
  await ins(n++,'round16',null,null,'2026-07-07T16:00:00Z','Mercedes-Benz Stadium, Atlanta',null,'Octavos — Partido 7')
  await ins(n++,'round16',null,null,'2026-07-07T20:00:00Z','BC Place, Vancouver',null,'Octavos — Partido 8')

  // ── CUARTOS DE FINAL (4 partidos) ─────────────────────────────────────────
  await ins(n++,'quarters',null,null,'2026-07-09T20:00:00Z','Gillette Stadium, Boston',null,'Cuartos — Partido 1')
  await ins(n++,'quarters',null,null,'2026-07-10T19:00:00Z','SoFi Stadium, Los Ángeles',null,'Cuartos — Partido 2')
  await ins(n++,'quarters',null,null,'2026-07-11T21:00:00Z','Hard Rock Stadium, Miami',null,'Cuartos — Partido 3')
  await ins(n++,'quarters',null,null,'2026-07-12T01:00:00Z','Arrowhead Stadium, Kansas City',null,'Cuartos — Partido 4')

  // ── SEMIFINALES ────────────────────────────────────────────────────────────
  await ins(n++,'semis',null,null,'2026-07-14T19:00:00Z','AT&T Stadium, Dallas',null,'Semifinal 1')
  await ins(n++,'semis',null,null,'2026-07-15T19:00:00Z','Mercedes-Benz Stadium, Atlanta',null,'Semifinal 2')

  // ── TERCER PUESTO ──────────────────────────────────────────────────────────
  await ins(n++,'third',null,null,'2026-07-18T21:00:00Z','Hard Rock Stadium, Miami',null,'Tercer Puesto')

  // ── GRAN FINAL ─────────────────────────────────────────────────────────────
  await ins(n,  'final',null,null,'2026-07-19T19:00:00Z','MetLife Stadium, Nueva York/NJ',null,'🏆 GRAN FINAL')

  console.log(`✅ Sembrados ${n} partidos con calendario oficial FIFA 2026`)
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
function auth(req,res,next){
  const token=(req.headers.authorization||'').replace('Bearer ','')
  if(!token) return res.status(401).json({error:'Token requerido'})
  try{ req.user=jwt.verify(token,JWT_SECRET); next() }
  catch{ res.status(401).json({error:'Token inválido'}) }
}
function admin(req,res,next){
  if(!req.user?.isAdmin) return res.status(403).json({error:'Solo administradores'})
  next()
}
function isMatchLocked(match, lockHours=2, phaseLocked=false){
  if(phaseLocked) return true
  if(!match.match_date) return false
  return Date.now()>=new Date(match.match_date).getTime()-lockHours*3600000
}
function getWinner(h,a){ return +h>+a?'home':+h<+a?'away':'draw' }

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async(req,res)=>{
  const {name,email,password}=req.body
  if(!name||!email||!password) return res.status(400).json({error:'Nombre, correo y contraseña son requeridos'})
  if(password.length<6) return res.status(400).json({error:'La contraseña debe tener al menos 6 caracteres'})
  try{
    const {rows:[ex]}=await pool.query('SELECT id FROM users WHERE LOWER(email)=$1',[(email).toLowerCase()])
    if(ex) return res.status(400).json({error:'Ya existe una cuenta con ese correo'})
    const id='u-'+crypto.randomBytes(12).toString('hex')
    const hash=await bcrypt.hash(password,10)
    const {rows:[user]}=await pool.query(
      'INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4) RETURNING *',
      [id,name.trim(),email.toLowerCase(),hash]
    )
    const token=jwt.sign({id:user.id,email:user.email,isAdmin:false},JWT_SECRET,{expiresIn:'30d'})
    res.json({token,user:{id:user.id,name:user.name,email:user.email,isAdmin:false,termsAccepted:false},avatars:[]})
  }catch(e){ console.error('register:',e.message); res.status(500).json({error:'Error del servidor'}) }
})

app.post('/api/auth/login', async(req,res)=>{
  const {email,password}=req.body
  try{
    const {rows:[u]}=await pool.query('SELECT * FROM users WHERE LOWER(email)=$1',[(email||'').toLowerCase()])
    if(!u||!await bcrypt.compare(password||'',u.password_hash||''))
      return res.status(401).json({error:'Correo o contraseña incorrectos'})
    const {rows:avatars}=await pool.query('SELECT * FROM avatars WHERE user_id=$1 ORDER BY created_at',[u.id])
    const token=jwt.sign({id:u.id,email:u.email,isAdmin:u.is_admin},JWT_SECRET,{expiresIn:'30d'})
    res.json({token,user:{id:u.id,name:u.name,email:u.email,isAdmin:u.is_admin,termsAccepted:u.terms_accepted},avatars})
  }catch(e){ res.status(500).json({error:'Error del servidor'}) }
})

app.post('/api/auth/terms', auth, async(req,res)=>{
  const {phone,whatsappConsent}=req.body
  try{
    await pool.query('UPDATE users SET terms_accepted=TRUE,terms_accepted_at=NOW(),phone=$1,whatsapp_consent=$2 WHERE id=$3',
      [phone||null,!!whatsappConsent,req.user.id])
    res.json({success:true})
  }catch(e){ res.status(500).json({error:'Error del servidor'}) }
})

app.get('/api/me', auth, async(req,res)=>{
  try{
    const {rows:[u]}=await pool.query('SELECT * FROM users WHERE id=$1',[req.user.id])
    const {rows:avatars}=await pool.query('SELECT * FROM avatars WHERE user_id=$1 ORDER BY created_at',[req.user.id])
    res.json({user:{id:u.id,name:u.name,email:u.email,picture:u.picture,phone:u.phone,
      whatsappConsent:u.whatsapp_consent,termsAccepted:u.terms_accepted,isAdmin:u.is_admin},avatars})
  }catch(e){ res.status(500).json({error:'Error del servidor'}) }
})

// ─── AVATARES ─────────────────────────────────────────────────────────────────
app.post('/api/avatars', auth, async(req,res)=>{
  const {nickname,photoUrl}=req.body
  if(!nickname||nickname.trim().length<3) return res.status(400).json({error:'Nickname mínimo 3 caracteres'})
  try{
    const {rows:ex}=await pool.query('SELECT id FROM avatars WHERE LOWER(nickname)=LOWER($1)',[nickname.trim()])
    if(ex.length) return res.status(400).json({error:'Ese nickname ya existe, elige otro'})
    const id='av-'+crypto.randomBytes(12).toString('hex')
    const {rows:[av]}=await pool.query(
      'INSERT INTO avatars(id,user_id,nickname,photo_url) VALUES($1,$2,$3,$4) RETURNING *',
      [id,req.user.id,nickname.trim(),photoUrl||null])
    const {rows:cfg}=await pool.query("SELECT key,value FROM settings WHERE key IN ('paypal','nequi','inscription_fee')")
    const settings=Object.fromEntries(cfg.map(r=>[r.key,r.value]))
    res.json({avatar:av,paymentInfo:settings})
  }catch(e){ console.error(e); res.status(500).json({error:'Error del servidor'}) }
})

app.put('/api/avatars/:id', auth, async(req,res)=>{
  const {nickname,photoUrl}=req.body
  try{
    const {rows:[av]}=await pool.query('SELECT * FROM avatars WHERE id=$1',[req.params.id])
    if(!av) return res.status(404).json({error:'Avatar no encontrado'})
    if(av.user_id!==req.user.id&&!req.user.isAdmin) return res.status(403).json({error:'Sin permisos'})
    const updates=[]; const vals=[]
    if(nickname){ updates.push(`nickname=$${vals.length+1}`); vals.push(nickname.trim()) }
    if(photoUrl!==undefined){ updates.push(`photo_url=$${vals.length+1}`); vals.push(photoUrl) }
    if(!updates.length) return res.json({avatar:av})
    vals.push(req.params.id)
    const {rows:[updated]}=await pool.query(`UPDATE avatars SET ${updates.join(',')} WHERE id=$${vals.length} RETURNING *`,vals)
    res.json({avatar:updated})
  }catch(e){ res.status(500).json({error:'Error del servidor'}) }
})

// ─── SETTINGS & MATCHES ───────────────────────────────────────────────────────
// ─── CONFIG PÚBLICA (Google Client ID para el frontend) ───────────────────────
app.get('/api/config', (req,res)=>{
  res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || '' })
})

app.get('/api/settings', async(req,res)=>{
  try{
    const {rows}=await pool.query('SELECT key,value FROM settings')
    res.json(Object.fromEntries(rows.map(r=>[r.key,r.value])))
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.get('/api/matches', async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT m.*,
        r.score_home as r_home, r.score_away as r_away,
        r.had_penalties, r.penalty_winner as r_pen_winner,
        r.yellow_cards as r_yellow, r.red_cards as r_red,
        r.penalties_count as r_penalties, r.goals_first_half as r_g1h,
        r.goals_second_half as r_g2h, r.mvp_player as r_mvp,
        pl.is_locked as phase_locked, pl.auto_lock_hours
      FROM matches m
      LEFT JOIN match_results r ON m.id=r.match_id
      LEFT JOIN phase_locks pl ON m.phase=pl.phase
      ORDER BY m.match_num
    `)
    res.json(rows)
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.get('/api/phase-locks', async(req,res)=>{
  try{ const {rows}=await pool.query('SELECT * FROM phase_locks'); res.json(rows) }
  catch(e){ res.status(500).json({error:'Error'}) }
})

// ─── PREDICCIONES ─────────────────────────────────────────────────────────────
app.get('/api/predictions/:avatarId', auth, async(req,res)=>{
  try{
    const {rows:[av]}=await pool.query('SELECT user_id FROM avatars WHERE id=$1',[req.params.avatarId])
    if(!av) return res.status(404).json({error:'Avatar no encontrado'})
    if(av.user_id!==req.user.id&&!req.user.isAdmin) return res.status(403).json({error:'Sin permisos'})
    const {rows:preds}=await pool.query('SELECT * FROM predictions WHERE avatar_id=$1',[req.params.avatarId])
    const {rows:extras}=await pool.query('SELECT * FROM extra_predictions WHERE avatar_id=$1',[req.params.avatarId])
    const predsMap={}; preds.forEach(p=>{ predsMap[p.match_id]=p })
    const extrasMap={}; extras.forEach(e=>{ extrasMap[e.match_id]=e })
    res.json({predictions:predsMap,extras:extrasMap})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.post('/api/predictions', auth, async(req,res)=>{
  const {avatarId,matchId,home,away,penaltyWinner}=req.body
  if(home==null||away==null||+home<0||+away<0) return res.status(400).json({error:'Marcador inválido'})
  try{
    const {rows:[av]}=await pool.query('SELECT * FROM avatars WHERE id=$1',[avatarId])
    if(!av) return res.status(404).json({error:'Avatar no encontrado'})
    if(av.user_id!==req.user.id) return res.status(403).json({error:'Sin permisos'})
    // is_paid check removed: users can save predictions even before payment (won't appear in ranking)
    const {rows:[{value:open}]}=await pool.query("SELECT value FROM settings WHERE key='predictions_open'")
    if(open!=='true') return res.status(403).json({error:'Los pronósticos están cerrados'})
    const {rows:[match]}=await pool.query(`
      SELECT m.*,pl.is_locked,pl.auto_lock_hours
      FROM matches m LEFT JOIN phase_locks pl ON m.phase=pl.phase WHERE m.id=$1`,[matchId])
    if(!match) return res.status(404).json({error:'Partido no encontrado'})
    if(isMatchLocked(match,match.auto_lock_hours||2,match.is_locked))
      return res.status(403).json({error:'Este partido ya no admite cambios'})
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
    // is_paid check removed: allow extra predictions without payment
    const {rows:[match]}=await pool.query(`
      SELECT m.*,pl.is_locked,pl.auto_lock_hours
      FROM matches m LEFT JOIN phase_locks pl ON m.phase=pl.phase WHERE m.id=$1`,[matchId])
    if(isMatchLocked(match,match.auto_lock_hours||2,match.is_locked))
      return res.status(403).json({error:'Partido bloqueado'})
    const id='ex-'+crypto.randomBytes(12).toString('hex')
    const {rows:[ex]}=await pool.query(`
      INSERT INTO extra_predictions(id,avatar_id,match_id,yellow_cards,red_cards,penalties_count,goals_first_half,goals_second_half,mvp_player)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT(avatar_id,match_id) DO UPDATE SET yellow_cards=$4,red_cards=$5,penalties_count=$6,
        goals_first_half=$7,goals_second_half=$8,mvp_player=$9 RETURNING *`,
      [id,avatarId,matchId,yellowCards??null,redCards??null,penaltiesCount??null,
       goalsFirstHalf??null,goalsSecondHalf??null,mvpPlayer||null])
    res.json({extra:ex})
  }catch(e){ console.error(e); res.status(500).json({error:'Error'}) }
})

// ─── PREDICCIONES ESPECIALES ─────────────────────────────────────────────────
app.get('/api/special/:avatarId', auth, async(req,res)=>{
  try{
    const {rows:[sp]}=await pool.query('SELECT * FROM special_predictions WHERE avatar_id=$1',[req.params.avatarId])
    res.json(sp||{})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.post('/api/special', auth, async(req,res)=>{
  const {avatarId,championTeam,surpriseTeam,balonDeOro,guanteDeOro,botaDeOro}=req.body
  try{
    const {rows:[av]}=await pool.query('SELECT * FROM avatars WHERE id=$1',[avatarId])
    if(!av||av.user_id!==req.user.id) return res.status(403).json({error:'Sin permisos'})
    const {rows:[sp]}=await pool.query(`
      INSERT INTO special_predictions(avatar_id,champion_team,surprise_team,balon_de_oro,guante_de_oro,bota_de_oro)
      VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(avatar_id) DO UPDATE SET
        champion_team=COALESCE(NULLIF($2,''),special_predictions.champion_team),
        surprise_team=COALESCE(NULLIF($3,''),special_predictions.surprise_team),
        balon_de_oro=COALESCE(NULLIF($4,''),special_predictions.balon_de_oro),
        guante_de_oro=COALESCE(NULLIF($5,''),special_predictions.guante_de_oro),
        bota_de_oro=COALESCE(NULLIF($6,''),special_predictions.bota_de_oro),
        updated_at=NOW()
      RETURNING *`,[avatarId,championTeam||null,surpriseTeam||null,balonDeOro||null,guanteDeOro||null,botaDeOro||null])
    res.json({special:sp})
  }catch(e){ console.error(e); res.status(500).json({error:'Error'}) }
})

// ─── RANKING ──────────────────────────────────────────────────────────────────
app.get('/api/ranking', async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT av.id,av.nickname,av.photo_url,av.is_paid,u.name as user_name,
        COALESCE(SUM(p.points_earned),0)::int+COALESCE(SUM(ep.points_earned),0)::int+
        COALESCE(sp.champion_pts,0)+COALESCE(sp.surprise_pts,0)+
        COALESCE(sp.balon_pts,0)+COALESCE(sp.guante_pts,0)+COALESCE(sp.bota_pts,0) AS total_pts,
        COUNT(p.id) FILTER(WHERE p.points_earned>0)::int AS hits,
        COUNT(ep.id) FILTER(WHERE ep.points_earned>0)::int AS extra_hits
      FROM avatars av JOIN users u ON av.user_id=u.id
      LEFT JOIN predictions p ON av.id=p.avatar_id
      LEFT JOIN extra_predictions ep ON av.id=ep.avatar_id
      LEFT JOIN special_predictions sp ON av.id=sp.avatar_id
      WHERE av.is_paid=TRUE AND av.is_active=TRUE
      GROUP BY av.id,av.nickname,av.photo_url,av.is_paid,u.name,
        sp.champion_pts,sp.surprise_pts,sp.balon_pts,sp.guante_pts,sp.bota_pts
      ORDER BY total_pts DESC, av.nickname ASC
    `)
    res.json(rows.map((r,i)=>({...r,rank:i+1})))
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.get('/api/results/:avatarId', auth, async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT m.id,m.match_num,m.phase,m.team1,m.team2,m.match_date,m.group_name,m.label,
        r.score_home as real_home,r.score_away as real_away,r.had_penalties,r.penalty_winner,r.mvp_player as real_mvp,
        p.score_home as pred_home,p.score_away as pred_away,p.penalty_winner as pred_pen,p.points_earned,
        ep.yellow_cards,ep.red_cards,ep.penalties_count,ep.goals_first_half,ep.goals_second_half,ep.mvp_player,
        ep.points_earned as extra_pts
      FROM matches m
      INNER JOIN match_results r ON m.id=r.match_id
      LEFT JOIN predictions p ON m.id=p.match_id AND p.avatar_id=$1
      LEFT JOIN extra_predictions ep ON m.id=ep.match_id AND ep.avatar_id=$1
      ORDER BY m.match_num`,[req.params.avatarId])
    res.json(rows)
  }catch(e){ res.status(500).json({error:'Error'}) }
})

// ─── PELÉ IA ──────────────────────────────────────────────────────────────────
app.post('/api/pele', auth, async(req,res)=>{
  const {userMessage,matchContext,phase,avatarName}=req.body
  try{
    const msg=await anthropic.messages.create({
      model:'claude-sonnet-4-20250514',
      max_tokens:350,
      system:`Eres Pelé IA 🏆, analista y asistente del torneo "La Polla de la Familia" - Mundial 2026.
PERSONALIDAD: apasionado por el fútbol, con datos reales, humor latino, BREVE (máx 3 líneas), siempre en español.
JUGADOR: ${avatarName||'el usuario'}.
${matchContext?`PARTIDO ACTUAL: ${JSON.stringify(matchContext)}`:''}
REGLAS: nunca inventes datos falsos, sé honesto si no tienes info específica, usa emojis con moderación.`,
      messages:[{role:'user',content:userMessage}]
    })
    res.json({response:msg.content[0].text})
  }catch(e){
    res.json({response:'¡Tuve un problema técnico! ⚽ ¿Cuánto crees que queda? 😄'})
  }
})

// Sugerencia de marcador con análisis real de Claude
app.post('/api/pele/suggest', auth, async(req,res)=>{
  const {team1,team2,rank1,rank2,notes1,notes2,venue,matchDate,group}=req.body
  try{
    const msg=await anthropic.messages.create({
      model:'claude-sonnet-4-20250514',
      max_tokens:400,
      system:`Eres un analista experto de fútbol del Mundial 2026. Debes sugerir un marcador realista para un partido.
Responde SIEMPRE en este formato JSON exacto (sin markdown, sin texto extra):
{"home":NUMERO,"away":NUMERO,"reason":"texto corto máx 2 líneas en español explicando por qué"}`,
      messages:[{role:'user',content:`Partido del Grupo ${group}: ${team1} (FIFA #${rank1}, ${notes1}) vs ${team2} (FIFA #${rank2}, ${notes2}). Sede: ${venue}. Fecha: ${matchDate}. Sugiere un marcador realista considerando: ranking FIFA, historial reciente, estilo de juego, sede y contexto del grupo.`}]
    })
    let result={home:1,away:0,reason:'Sin datos suficientes para análisis'}
    try{
      const text=msg.content[0].text.trim()
      result=JSON.parse(text)
      result.home=Math.max(0,Math.min(9,parseInt(result.home)||0))
      result.away=Math.max(0,Math.min(9,parseInt(result.away)||0))
    }catch(pe){ console.error('parse suggest:',pe.message) }
    res.json(result)
  }catch(e){
    console.error('suggest:',e.message)
    res.json({home:1,away:0,reason:'No pude conectarme al análisis. Usa tu criterio 😄'})
  }
})

// ─── ADMIN ────────────────────────────────────────────────────────────────────
app.get('/api/admin/users', auth, admin, async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT u.id,u.name,u.email,u.phone,u.picture,u.whatsapp_consent,u.terms_accepted,u.created_at,
        json_agg(json_build_object('id',av.id,'nickname',av.nickname,'is_paid',av.is_paid,
          'is_active',av.is_active,'photo_url',av.photo_url,'created_at',av.created_at)
          ORDER BY av.created_at) FILTER(WHERE av.id IS NOT NULL) as avatars
      FROM users u LEFT JOIN avatars av ON u.id=av.user_id
      WHERE u.is_admin=FALSE GROUP BY u.id ORDER BY u.created_at DESC`)
    res.json(rows)
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.delete('/api/admin/users/:id', auth, admin, async(req,res)=>{
  try{
    const uid=req.params.id
    // Delete all related records in order (foreign keys)
    await pool.query('DELETE FROM extra_predictions WHERE avatar_id IN (SELECT id FROM avatars WHERE user_id=$1)',[uid])
    await pool.query('DELETE FROM predictions WHERE avatar_id IN (SELECT id FROM avatars WHERE user_id=$1)',[uid])
    await pool.query('DELETE FROM avatars WHERE user_id=$1',[uid])
    await pool.query('DELETE FROM users WHERE id=$1',[uid])
    res.json({success:true})
  }catch(e){ console.error('delete user:',e.message); res.status(500).json({error:'Error al eliminar usuario'}) }
})

app.put('/api/admin/avatars/:id', auth, admin, async(req,res)=>{
  const {isPaid,isActive}=req.body
  try{
    const sets=[]; const vals=[]
    if(isPaid!==undefined){ sets.push(`is_paid=$${vals.length+1}`); vals.push(!!isPaid) }
    if(isActive!==undefined){ sets.push(`is_active=$${vals.length+1}`); vals.push(!!isActive) }
    if(!sets.length) return res.status(400).json({error:'Nada que actualizar'})
    vals.push(req.params.id)
    const {rows:[av]}=await pool.query(`UPDATE avatars SET ${sets.join(',')} WHERE id=$${vals.length} RETURNING *`,vals)
    res.json({avatar:av})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.get('/api/admin/phase-locks', auth, admin, async(req,res)=>{
  try{ const {rows}=await pool.query('SELECT * FROM phase_locks ORDER BY phase'); res.json(rows) }
  catch(e){ res.status(500).json({error:'Error'}) }
})

app.put('/api/admin/phase-locks/:phase', auth, admin, async(req,res)=>{
  const {isLocked,autoLockHours}=req.body
  try{
    const {rows:[pl]}=await pool.query(`
      UPDATE phase_locks SET is_locked=$1,auto_lock_hours=COALESCE($2,auto_lock_hours)
      WHERE phase=$3 RETURNING *`,[!!isLocked,autoLockHours||null,req.params.phase])
    res.json({phaseLock:pl})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.put('/api/admin/matches/:id', auth, admin, async(req,res)=>{
  const {team1,team2,matchDate,venue}=req.body
  try{
    const {rows:[m]}=await pool.query(`
      UPDATE matches SET team1=COALESCE($1,team1),team2=COALESCE($2,team2),
        match_date=COALESCE($3,match_date),venue=COALESCE($4,venue)
      WHERE id=$5 RETURNING *`,[team1||null,team2||null,matchDate||null,venue||null,req.params.id])
    res.json({match:m})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.post('/api/admin/results', auth, admin, async(req,res)=>{
  const {matchId,home,away,hadPenalties,penaltyWinner,
    yellowCards,redCards,penaltiesCount,goalsFirstHalf,goalsSecondHalf,mvpPlayer,
    championWinner,surpriseTeamReached,balonDeOro,guanteDeOro,botaDeOro}=req.body
  if(home==null||away==null) return res.status(400).json({error:'Marcador requerido'})
  try{
    const {rows:[match]}=await pool.query('SELECT * FROM matches WHERE id=$1',[matchId])
    if(!match) return res.status(404).json({error:'Partido no encontrado'})
    await pool.query(`
      INSERT INTO match_results(match_id,score_home,score_away,had_penalties,penalty_winner,
        yellow_cards,red_cards,penalties_count,goals_first_half,goals_second_half,mvp_player)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT(match_id) DO UPDATE SET score_home=$2,score_away=$3,had_penalties=$4,
        penalty_winner=$5,yellow_cards=$6,red_cards=$7,penalties_count=$8,
        goals_first_half=$9,goals_second_half=$10,mvp_player=$11,entered_at=NOW()`,
      [matchId,+home,+away,!!hadPenalties,hadPenalties?penaltyWinner:null,
       yellowCards??null,redCards??null,penaltiesCount??null,
       goalsFirstHalf??null,goalsSecondHalf??null,mvpPlayer||null])

    const result={score_home:+home,score_away:+away,yellow_cards:yellowCards,red_cards:redCards,
      penalties_count:penaltiesCount,goals_first_half:goalsFirstHalf,
      goals_second_half:goalsSecondHalf,mvp_player:mvpPlayer}

    const {rows:preds}=await pool.query('SELECT * FROM predictions WHERE match_id=$1',[matchId])
    for(const p of preds){
      const pts=calcPoints({score_home:p.score_home,score_away:p.score_away},result,match.phase)
      await pool.query('UPDATE predictions SET points_earned=$1 WHERE id=$2',[pts,p.id])
    }
    const {rows:extras}=await pool.query('SELECT * FROM extra_predictions WHERE match_id=$1',[matchId])
    for(const e of extras){
      const pts=calcExtraPoints(e,result)
      await pool.query('UPDATE extra_predictions SET points_earned=$1 WHERE id=$2',[pts,e.id])
    }

    if(match.phase==='final'){
      const champ=getWinner(+home,+away)==='home'?match.team1:match.team2
      if(champ){
        const {rows:cps}=await pool.query('SELECT * FROM special_predictions WHERE champion_team=$1',[champ])
        for(const sp of cps) await pool.query('UPDATE special_predictions SET champion_pts=10 WHERE avatar_id=$1',[sp.avatar_id])
      }
      if(balonDeOro){
        const {rows:sps}=await pool.query('SELECT * FROM special_predictions WHERE LOWER(balon_de_oro)=LOWER($1)',[balonDeOro])
        for(const sp of sps) await pool.query('UPDATE special_predictions SET balon_pts=5 WHERE avatar_id=$1',[sp.avatar_id])
      }
      if(guanteDeOro){
        const {rows:sps}=await pool.query('SELECT * FROM special_predictions WHERE LOWER(guante_de_oro)=LOWER($1)',[guanteDeOro])
        for(const sp of sps) await pool.query('UPDATE special_predictions SET guante_pts=5 WHERE avatar_id=$1',[sp.avatar_id])
      }
      if(botaDeOro){
        const {rows:sps}=await pool.query('SELECT * FROM special_predictions WHERE LOWER(bota_de_oro)=LOWER($1)',[botaDeOro])
        for(const sp of sps) await pool.query('UPDATE special_predictions SET bota_pts=5 WHERE avatar_id=$1',[sp.avatar_id])
      }
      if(surpriseTeamReached){
        const {rows:sps}=await pool.query('SELECT * FROM special_predictions WHERE surprise_team=$1',[surpriseTeamReached])
        for(const sp of sps) await pool.query('UPDATE special_predictions SET surprise_pts=3 WHERE avatar_id=$1',[sp.avatar_id])
      }
    }

    await sendMatchResultWA(match,result)
    res.json({success:true,updated:preds.length,extraUpdated:extras.length})
  }catch(e){ console.error('result:',e); res.status(500).json({error:'Error: '+e.message}) }
})

app.put('/api/admin/settings', auth, admin, async(req,res)=>{
  const allowed=['predictions_open','paypal','nequi','inscription_fee','bg_brightness','bg_blur']
  try{
    for(const [k,v] of Object.entries(req.body))
      if(allowed.includes(k))
        await pool.query('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=$2',[k,String(v)])
    res.json({success:true})
  }catch(e){ res.status(500).json({error:'Error'}) }
})

app.get('/api/admin/whatsapp', auth, admin, async(req,res)=>{
  try{ const {rows}=await pool.query('SELECT * FROM whatsapp_numbers WHERE is_active=TRUE ORDER BY added_at'); res.json(rows) }
  catch(e){ res.status(500).json({error:'Error'}) }
})
app.post('/api/admin/whatsapp', auth, admin, async(req,res)=>{
  const {phone,name}=req.body
  if(!phone) return res.status(400).json({error:'Teléfono requerido'})
  try{
    const {rows:[n]}=await pool.query('INSERT INTO whatsapp_numbers(phone,name) VALUES($1,$2) RETURNING *',[phone.trim(),name||null])
    res.json({number:n})
  }catch(e){ res.status(500).json({error:'Error'}) }
})
app.delete('/api/admin/whatsapp/:id', auth, admin, async(req,res)=>{
  try{ await pool.query('UPDATE whatsapp_numbers SET is_active=FALSE WHERE id=$1',[req.params.id]); res.json({success:true}) }
  catch(e){ res.status(500).json({error:'Error'}) }
})

app.post('/api/admin/sync', auth, admin, async(req,res)=>{
  const apiKey=process.env.FOOTBALL_API_KEY
  if(!apiKey) return res.status(400).json({error:'FOOTBALL_API_KEY no configurada'})
  try{
    const axios=require('axios')
    const resp=await axios.get('https://api.football-data.org/v4/competitions/WC2026/matches?status=FINISHED',{headers:{'X-Auth-Token':apiKey}})
    const matches=resp.data?.matches||[]
    let updated=0
    for(const m of matches){
      if(!m.score?.fullTime) continue
      const sh=m.score.fullTime.home,sa=m.score.fullTime.away
      if(sh==null||sa==null) continue
      const home=m.homeTeam?.name,away=m.awayTeam?.name
      const {rows:[dbM]}=await pool.query('SELECT id,phase FROM matches WHERE LOWER(team1)=LOWER($1) AND LOWER(team2)=LOWER($2)',[home,away])
      if(!dbM) continue
      const ex=await pool.query('SELECT match_id FROM match_results WHERE match_id=$1',[dbM.id])
      if(ex.rows.length) continue
      await pool.query('INSERT INTO match_results(match_id,score_home,score_away) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[dbM.id,sh,sa])
      updated++
    }
    await pool.query("INSERT INTO settings(key,value) VALUES('last_sync',NOW()::TEXT) ON CONFLICT(key) DO UPDATE SET value=NOW()::TEXT")
    res.json({success:true,updated,total:matches.length})
  }catch(e){ console.error('sync:',e.message); res.status(500).json({error:'Error de sincronización: '+e.message}) }
})

// ─── WHATSAPP ─────────────────────────────────────────────────────────────────
async function sendMatchResultWA(match,result){
  const sid=process.env.TWILIO_ACCOUNT_SID,token=process.env.TWILIO_AUTH_TOKEN,from=process.env.TWILIO_WHATSAPP_FROM
  if(!sid||!token||!from) return
  try{
    const {rows:numbers}=await pool.query('SELECT phone FROM whatsapp_numbers WHERE is_active=TRUE')
    if(!numbers.length) return
    const score=`${result.score_home} – ${result.score_away}`
    const name=match.team1?`${match.team1} vs ${match.team2}`:match.label
    let msg=`⚽ *${name}* · ${match.label||'Fase de Grupos'}\n📊 Resultado final: *${score}*\n🔗 ${process.env.APP_URL||'https://polla2026.onrender.com'}`
    const twilio=require('twilio')(sid,token)
    for(const {phone} of numbers){
      try{ await twilio.messages.create({from:`whatsapp:${from}`,to:`whatsapp:${phone}`,body:msg}) }
      catch(we){ console.error('WA error:',we.message) }
    }
  }catch(e){ console.error('WA:',e.message) }
}

// ─── SPA ──────────────────────────────────────────────────────────────────────
app.get('*',(req,res)=>{
  if(!req.path.startsWith('/api')) res.sendFile(path.join(__dirname,'public','index.html'))
  else res.status(404).json({error:'Ruta no encontrada'})
})

async function start(){
  try{ await initDb(); app.listen(PORT,()=>console.log(`🏆 Polla Mundial 2026 en puerto ${PORT}`)) }
  catch(e){ console.error('Error al iniciar:',e); process.exit(1) }
}
start()
