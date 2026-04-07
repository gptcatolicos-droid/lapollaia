// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// ─── TOURNAMENT CONTEXT ───────────────────────────────────────────────────────
const TOURNAMENT_SLUG = (()=>{
  const m = window.location.pathname.match(/^\/t\/([^/]+)/)
  return m ? m[1] : null
})()

// Base API call — injects tournamentId into every request
const _apiBase = window.__apiBase__ || ''

const FLAGS={
  // GRUPOS CONFIRMADOS — FIFA World Cup 2026
  // GRUPO A
  'Mexico':'🇲🇽','South Africa':'🇿🇦','Korea Republic':'🇰🇷','Czechia':'🇨🇿',
  // GRUPO B
  'Canada':'🇨🇦','Bosnia and Herzegovina':'🇧🇦','Qatar':'🇶🇦','Switzerland':'🇨🇭',
  // GRUPO C
  'Brazil':'🇧🇷','Morocco':'🇲🇦','Haiti':'🇭🇹','Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  // GRUPO D
  'USA':'🇺🇸','Paraguay':'🇵🇾','Australia':'🇦🇺','Turkey':'🇹🇷',
  // GRUPO E
  'Germany':'🇩🇪','Curaçao':'🇨🇼','Ivory Coast':'🇨🇮','Ecuador':'🇪🇨',
  // GRUPO F
  'Netherlands':'🇳🇱','Japan':'🇯🇵','Sweden':'🇸🇪','Tunisia':'🇹🇳',
  // GRUPO G
  'Belgium':'🇧🇪','Egypt':'🇪🇬','IR Iran':'🇮🇷','New Zealand':'🇳🇿',
  // GRUPO H
  'Spain':'🇪🇸','Cape Verde':'🇨🇻','Saudi Arabia':'🇸🇦','Uruguay':'🇺🇾',
  // GRUPO I
  'France':'🇫🇷','Senegal':'🇸🇳','Iraq':'🇮🇶','Norway':'🇳🇴',
  // GRUPO J
  'Argentina':'🇦🇷','Algeria':'🇩🇿','Austria':'🇦🇹','Jordan':'🇯🇴',
  // GRUPO K
  'Portugal':'🇵🇹','DR Congo':'🇨🇩','Uzbekistan':'🇺🇿','Colombia':'🇨🇴',
  // GRUPO L
  'England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Croatia':'🇭🇷','Ghana':'🇬🇭','Panama':'🇵🇦',
}

const ES={
  'Mexico':'México','South Africa':'Sudáfrica','Korea Republic':'Corea del Sur','Czechia':'Rep. Checa',
  'Canada':'Canadá','Bosnia and Herzegovina':'Bosnia y Herzegovina','Qatar':'Qatar','Switzerland':'Suiza',
  'Brazil':'Brasil','Morocco':'Marruecos','Haiti':'Haití','Scotland':'Escocia',
  'USA':'EE.UU.','Paraguay':'Paraguay','Australia':'Australia','Turkey':'Turquía',
  'Germany':'Alemania','Curaçao':'Curazao','Ivory Coast':'Costa de Marfil','Ecuador':'Ecuador',
  'Netherlands':'Países Bajos','Japan':'Japón','Sweden':'Suecia','Tunisia':'Túnez',
  'Belgium':'Bélgica','Egypt':'Egipto','IR Iran':'Irán','New Zealand':'Nueva Zelanda',
  'Spain':'España','Cape Verde':'Cabo Verde','Saudi Arabia':'Arabia Saudita','Uruguay':'Uruguay',
  'France':'Francia','Senegal':'Senegal','Iraq':'Irak','Norway':'Noruega',
  'Argentina':'Argentina','Algeria':'Argelia','Austria':'Austria','Jordan':'Jordania',
  'Portugal':'Portugal','DR Congo':'RD Congo','Uzbekistan':'Uzbekistán','Colombia':'Colombia',
  'England':'Inglaterra','Croatia':'Croacia','Ghana':'Ghana','Panama':'Panamá',
}

const PHASE_LABELS={
  group:'Fase de Grupos',round32:'Ronda de 32',round16:'Octavos de Final',
  quarters:'Cuartos de Final',semis:'Semifinales',third:'Tercer Puesto',final:'🏆 Gran Final'
}
const PHASE_PTS={
  group:{exact:3,winner:2},round32:{exact:4,winner:2},round16:{exact:5,winner:3},
  quarters:{exact:6,winner:3},semis:{exact:7,winner:4},third:{exact:5,winner:3},final:{exact:10,winner:5}
}

// Estadísticas de selecciones (actualizado post-sorteo 2026)
const TEAM_STATS={
  'Brazil':   {rank:1,  notes:'Vinícius Jr., Rodrygo · Favorito histórico'},
  'France':   {rank:2,  notes:'Mbappé · Campeón 2018 · candidato firme'},
  'Argentina':{rank:3,  notes:'Messi · Campeón 2022 · defiende título'},
  'England':  {rank:4,  notes:'Bellingham, Saka · generación dorada'},
  'Spain':    {rank:5,  notes:'Yamal, Pedri · campeón Euro 2024'},
  'Portugal': {rank:6,  notes:'CR7 en su último Mundial · B.Silva'},
  'Germany':  {rank:7,  notes:'Wirtz · renovados · peligrosos'},
  'Netherlands':{rank:8,notes:'De Jong, Gakpo · camino abierto'},
  'Belgium':  {rank:9,  notes:'Lukaku, De Bruyne · generación veterana'},
  'USA':      {rank:11, notes:'Pulisic · anfitrión · busca cuartos'},
  'Mexico':   {rank:15, notes:'Lozano · abre el torneo en el Azteca'},
  'Colombia': {rank:12, notes:'Luis Díaz, James · mejor momento en años'},
  'Uruguay':  {rank:18, notes:'Núñez, De Arrascaeta · garra charrúa'},
  'Morocco':  {rank:13, notes:'Hakimi · semifinalistas 2022'},
  'Japan':    {rank:16, notes:'Doan, Mitoma · estilo rápido'},
  'Canada':   {rank:38, notes:'Davies · debut histórico como anfitrión'},
  'Senegal':  {rank:20, notes:'Mané, Sarr · uno de los mejores de África'},
  'Ecuador':  {rank:31, notes:'Valencia, Caicedo · solidez defensiva'},
  'Norway':   {rank:23, notes:'Haaland · favorito a sorpresa'},
  'Australia':{rank:24, notes:'Leckie, Rowles · dura en defensa'},
  'Switzerland':{rank:14,notes:'Shaqiri, Xhaka · equilibrados'},
  'Croatia':  {rank:10, notes:'Modrić, Kovačić · subcampeones 2018'},
  'Sweden':   {rank:25, notes:'Isak, Kulusevski · calidad ofensiva'},
  'Austria':  {rank:22, notes:'Sabitzer · mejores últimos años'},
  'Turkey':   {rank:29, notes:'Güler, Çalhanoğlu · sorpresa potencial'},
  'Korea Republic':{rank:19,notes:'Son Heung-min · capitán estrella'},
  'Ghana':    {rank:60, notes:'Kudus, Jordan Ayew · rápidos'},
  'IR Iran':  {rank:22, notes:'Taremi · compactos defensivamente'},
  'Saudi Arabia':{rank:56,notes:'Al-Dawsari · sorpresa Qtar 2022'},
  'Ivory Coast':{rank:41,notes:'Haller, Zaha · físicos y directos'},
  'Iraq':     {rank:62, notes:'Primer Mundial — debutante'},
  'DR Congo': {rank:44, notes:'Primer Mundial — debutante'},
  'Uzbekistan':{rank:67,notes:'Primer Mundial — debutante'},
  'Curaçao':  {rank:81, notes:'Primer Mundial — debutante'},
  'Panama':   {rank:70, notes:'Segundo Mundial · apasionados'},
  'Jordan':   {rank:74, notes:'Primer Mundial — debutante'},
  'New Zealand':{rank:93,notes:'Calidad en portería · apretados'},
  'Scotland': {rank:37, notes:'McTominay, Robertson · aguerridos'},
  'Cape Verde':{rank:73,notes:'Primer Mundial — debutante'},
  'Haiti':    {rank:88, notes:'Primer Mundial — debutante'},
  'Algeria':  {rank:33, notes:'Mahrez · peligrosos en contraataque'},
  'Tunisia':  {rank:32, notes:'Msakni · sólidos en défensa'},
  'Bosnia and Herzegovina':{rank:49,notes:'Džeko · ganaron el playoff UEFA'},
  'Czechia':  {rank:36, notes:'Schick · ganaron el playoff UEFA'},
  'Egypt':    {rank:35, notes:'Salah · debut Mundial tras 2018'},
  'Qatar':    {rank:58, notes:'Anfitrión 2022 · debutan en foráneo'},
  'South Africa':{rank:68,notes:'Seleção Bafana · abre vs México'},
}

const ALL_TEAMS=Object.keys(FLAGS)
const f = n => n?(FLAGS[n]||'🏳️'):'❓'
const es = n => n?(ES[n]||n):'Por definir'
const teamDisp = n => n?`${f(n)} ${es(n)}`:'❓ Por definir'
const getToken = () => localStorage.getItem('polla_token')

async function api(url,method='GET',body=null){
  const headers={'Content-Type':'application/json'}
  const token=getToken()
  if(token) headers['Authorization']=`Bearer ${token}`
  const opts={method,headers}
  if(body) opts.body=JSON.stringify(body)
  const res=await fetch(url,opts)
  const data=await res.json()
  if(!res.ok) throw new Error(data.error||'Error del servidor')
  return data
}

function formatDate(d){
  if(!d) return 'Fecha por confirmar'
  return new Date(d).toLocaleString('es-CO',{
    day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'
  })
}
function formatDateShort(d){
  if(!d) return '—'
  return new Date(d).toLocaleString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
}

function isLocked(match){
  if(match.phase_locked) return true
  if(!match.match_date) return false
  const hours = match.auto_lock_hours||2
  return Date.now()>=new Date(match.match_date).getTime()-hours*3600000
}

function getWinner(h,a){ return +h>+a?'home':+h<+a?'away':'draw' }

function generateAvatarColor(str){
  const colors=[
    'linear-gradient(135deg,#C8A84B,#F0C060)',
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#f7971e,#ffd200)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    'linear-gradient(135deg,#1A5C38,#2E8B57)',
  ]
  let hash=0
  for(let i=0;i<str.length;i++) hash=str.charCodeAt(i)+((hash<<5)-hash)
  return colors[Math.abs(hash)%colors.length]
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
const AppCtx=React.createContext(null)
const useApp=()=>React.useContext(AppCtx)

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function Alert({type='error',children}){
  return <div className={`alert alert-${type}`}>{children}</div>
}
function Spinner(){return <div className="loading">⚽</div>}
function PhaseBadge({phase}){
  return <span className="chip chip-ink" style={{fontSize:'9px'}}>{PHASE_LABELS[phase]||phase}</span>
}

function MedalRank({rank}){
  const faces=['🥇','🥈','🥉']
  if(rank<=3) return <span style={{fontSize:'1.2rem'}}>{faces[rank-1]}</span>
  if(rank<=6) return <span style={{fontSize:'1.1rem'}}>😢</span>
  return <span style={{fontSize:'1.1rem'}}>{rank<=9?'😭':'😱'}</span>
}

function AvatarCircle({nickname,photoUrl,size=42,style={}}){
  const initials=(nickname||'?').substring(0,2).toUpperCase()
  const bg=generateAvatarColor(nickname||'x')
  if(photoUrl) return <img src={photoUrl} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',...style}} alt={nickname}/>
  return <div style={{width:size,height:size,borderRadius:'50%',background:bg,display:'flex',
    alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff',
    fontSize:Math.floor(size*0.3)+'px',flexShrink:0,...style}}>{initials}</div>
}

function Toggle({on,onChange}){
  return <button className={`tog ${on?'tog-on':'tog-off'}`} onClick={()=>onChange(!on)}>
    <div className="tok"/>
  </button>
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function Nav(){
  const {user,activeAvatar,view,setView,logout,tournament}=useApp()
  return(
    <nav className="nav">
      <div style={{cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}} onClick={()=>setView(user?'dashboard':'landing')}>
        <img src={tournament?.logo_url||"/logo.png"} alt={tournament?.name||"Polla IA"} style={{height:'42px',width:'42px',objectFit:'contain'}}/>
        <div>
          <div className="nav-logo" style={{lineHeight:1,fontSize:tournament?.name&&tournament.name.length>12?'1rem':'inherit'}}>{tournament?.name||'POLLA'} <span style={{color:'var(--gold)'}}>2026</span></div>
          <div className="nav-sub">FIFA World Cup · USA · CAN · MEX</div>
        </div>
      </div>
      <div className="nav-actions">
        <button className="btn btn-outline btn-sm" onClick={()=>setView('ranking')}>🏅 Ranking</button>
        {user?(
          <>
            {user.isAdmin&&<button className="btn btn-red btn-sm" onClick={()=>setView('admin')}>⚙️ Admin</button>}
            <button className="btn btn-outline btn-sm" onClick={()=>setView('dashboard')}>
              {activeAvatar?<AvatarCircle nickname={activeAvatar.nickname} photoUrl={activeAvatar.photo_url} size={22}/>:'🏠'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={logout}>Salir</button>
          </>
        ):(
          <button className="btn btn-ink btn-sm" onClick={()=>setView('auth')}>Entrar →</button>
        )}
      </div>
    </nav>
  )
}

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function Countdown(){
  const [t,setT]=React.useState({d:0,h:0,m:0,s:0})
  React.useEffect(()=>{
    const target=new Date('2026-06-11T19:00:00Z').getTime()
    const tick=()=>{
      const diff=target-Date.now()
      if(diff<=0){setT({d:0,h:0,m:0,s:0});return}
      setT({d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),
        m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)})
    }
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id)
  },[])
  return(
    <div className="countdown">
      {[['d','Días'],['h','Horas'],['m','Min'],['s','Seg']].map(([k,l])=>(
        <div key={k} className="cd">
          <div className="cd-n">{String(t[k]).padStart(2,'0')}</div>
          <div className="cd-l">{l}</div>
        </div>
      ))}
    </div>
  )
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage(){
  const {setView,tournament}=useApp()
  // If no tournament context (user landed on /t/slug directly without valid slug), go home
  React.useEffect(()=>{
    if(TOURNAMENT_SLUG&&!tournament){
      // still loading, wait
    } else if(!TOURNAMENT_SLUG){
      window.location.href='/'
    }
  },[tournament])
  return(
    <div className="page">
      <Nav/>
      <div className="hero">
        <div className="hero-bg" style={{backgroundImage:`url('/bg.jpg')`}}/>
        <div className="hero-content">
          <img src="/logo.png" alt="Polla 2026" style={{width:'220px',height:'220px',objectFit:'contain',filter:'drop-shadow(0 8px 32px rgba(0,0,0,.7))',marginBottom:'0.5rem'}}/>
          <div className="hero-date">⚽ Partido inaugural · 11 Jun · México vs Sudáfrica</div>
          <Countdown/>
          <div className="hero-ctas">
            <button className="btn btn-gold btn-lg" onClick={()=>setView('auth')}>¡Quiero participar! →</button>
            <button className="btn btn-outline btn-lg" style={{background:'rgba(247,244,238,.1)',color:'rgba(255,255,255,.85)',borderColor:'rgba(247,244,238,.2)'}} onClick={()=>setView('ranking')}>Ver Ranking 🏅</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage(){
  const {setUser,setAvatars,setView,tournament}=useApp()
  const [tab,setTab]=React.useState('login') // 'login' | 'register' | 'admin'
  const [form,setForm]=React.useState({name:'',email:'',password:''})
  const [loading,setLoading]=React.useState(false)
  const [err,setErr]=React.useState('')

  const upd=k=>e=>setForm(p=>({...p,[k]:e.target.value}))

  async function handleLogin(e){
    e.preventDefault(); setLoading(true); setErr('')
    try{
      const data=await api('/api/auth/login','POST',{email:form.email,password:form.password,tournamentId:window.__TOURNAMENT_ID__||''})
      localStorage.setItem('polla_token',data.token)
      setUser(data.user); setAvatars(data.avatars||[])
      if(data.user.isAdmin) setView('admin')
      else if(!data.user.termsAccepted) setView('terms')
      else if(!data.avatars||!data.avatars.length) setView('avatars')
      else setView('dashboard')
    }catch(e){setErr(e.message)}
    setLoading(false)
  }

  async function handleRegister(e){
    e.preventDefault(); setLoading(true); setErr('')
    try{
      const data=await api('/api/auth/register','POST',{name:form.name,email:form.email,password:form.password,tournamentId:window.__TOURNAMENT_ID__||''})
      localStorage.setItem('polla_token',data.token)
      setUser(data.user); setAvatars([])
      setView('terms')
    }catch(e){setErr(e.message)}
    setLoading(false)
  }

  const tabStyle=active=>({
    flex:1,padding:'.5rem',fontWeight:700,fontSize:'12px',letterSpacing:'.5px',textTransform:'uppercase',
    border:'none',cursor:'pointer',transition:'all .2s',
    background:active?'var(--ink)':'transparent',
    color:active?'var(--cream)':'var(--ink3)',
    borderRadius:'6px'
  })

  return(
    <div className="page">
      <Nav/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',flex:1,padding:'2rem 1rem'}}>
        <div className="card" style={{maxWidth:400,width:'100%'}}>
          <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
            <img src={tournament?.logo_url||"/logo.png"} alt={tournament?.name||"Polla 2026"} style={{width:'90px',height:'90px',objectFit:'contain',marginBottom:'.5rem'}}/>
            <p className="text-muted text-sm">Un correo · múltiples avatares · U$20 por avatar</p>
          </div>

          {err&&<Alert type="error">{err}</Alert>}

          {tab!=='admin'?(
            <>
              <div style={{display:'flex',background:'var(--cream2)',borderRadius:'8px',padding:'3px',marginBottom:'1.25rem'}}>
                <button style={tabStyle(tab==='login')} onClick={()=>{setTab('login');setErr('')}}>Ingresar</button>
                <button style={tabStyle(tab==='register')} onClick={()=>{setTab('register');setErr('')}}>Registrarse</button>
              </div>

              {tab==='login'?(
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label>Correo electrónico</label>
                    <input className="inp" type="email" placeholder="tu@correo.com" value={form.email} onChange={upd('email')} required/>
                  </div>
                  <div className="form-group">
                    <label>Contraseña</label>
                    <input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={upd('password')} required/>
                  </div>
                  <button className="btn btn-ink btn-full" disabled={loading}>{loading?'Ingresando...':'Ingresar →'}</button>
                </form>
              ):(
                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <label>Nombre completo</label>
                    <input className="inp" type="text" placeholder="Tu nombre" value={form.name} onChange={upd('name')} required/>
                  </div>
                  <div className="form-group">
                    <label>Correo electrónico</label>
                    <input className="inp" type="email" placeholder="tu@correo.com" value={form.email} onChange={upd('email')} required/>
                  </div>
                  <div className="form-group">
                    <label>Contraseña <span className="text-muted text-xs">(mínimo 6 caracteres)</span></label>
                    <input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={upd('password')} required minLength={6}/>
                  </div>
                  <button className="btn btn-gold btn-full" disabled={loading}>{loading?'Creando cuenta...':'Crear cuenta →'}</button>
                </form>
              )}

              <div style={{textAlign:'center',marginTop:'1.25rem'}}>
                <button className="btn btn-outline btn-sm" style={{fontSize:'11px',opacity:.6}} onClick={()=>{setTab('admin');setErr('')}}>⚙️ Acceso Admin</button>
              </div>
            </>
          ):(
            <form onSubmit={handleLogin}>
              <div style={{textAlign:'center',marginBottom:'1rem',fontWeight:700,fontSize:'13px',letterSpacing:'.5px'}}>ADMINISTRADOR</div>
              <div className="form-group">
                <label>Correo</label>
                <input className="inp" type="email" value={form.email} onChange={upd('email')} required/>
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input className="inp" type="password" value={form.password} onChange={upd('password')} required/>
              </div>
              <button className="btn btn-ink btn-full" disabled={loading}>{loading?'Entrando...':'Entrar como Admin'}</button>
              <button type="button" className="btn btn-outline btn-sm btn-full mt1" onClick={()=>{setTab('login');setErr('')}}>← Volver</button>
            </form>
          )}

          <p className="text-center text-muted text-xs mt2">
            Al entrar aceptas los <span className="text-gold" style={{cursor:'pointer'}} onClick={()=>setView('landing')}>Términos y Condiciones</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── TERMS MODAL ──────────────────────────────────────────────────────────────
function TermsPage(){
  const {user,setUser,setView}=useApp()
  const [form,setForm]=React.useState({phone:'',whatsapp:false,accepted:false})
  const [loading,setLoading]=React.useState(false)
  const [err,setErr]=React.useState('')
  const upd=k=>e=>setForm(p=>({...p,[k]:k==='phone'?e.target.value:e.target.checked}))

  async function accept(){
    if(!form.accepted) return setErr('Debes aceptar los términos para continuar')
    setLoading(true); setErr('')
    try{
      await api('/api/auth/terms','POST',{phone:form.phone,whatsappConsent:form.whatsapp})
      setUser(u=>({...u,termsAccepted:true,phone:form.phone,whatsappConsent:form.whatsapp}))
      setView('guide')
    }catch(e){setErr(e.message)}
    setLoading(false)
  }

  return(
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-head">
          <div className="modal-title">📋 TÉRMINOS Y CONDICIONES · POLLA 2026</div>
          <span className="chip chip-gold">Lee antes de continuar</span>
        </div>
        <div className="modal-body">
          {err&&<Alert type="error">{err}</Alert>}
          <div style={{fontSize:'12px',color:'var(--ink3)',lineHeight:'1.8'}}>
            <strong style={{color:'var(--ink)',display:'block',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.5px',margin:'8px 0 3px'}}>1. Registro y Avatares</strong>
            Un usuario puede registrarse con su correo y contraseña, y crear múltiples avatares (nicknames de competencia). Cada avatar tiene un costo de <strong>U$20</strong>, pagaderos por PayPal o Nequi. La activación de cada avatar es manual por parte del administrador.
            <strong style={{color:'var(--ink)',display:'block',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.5px',margin:'8px 0 3px'}}>2. Plazo de Pago</strong>
            Todos los avatares deben tener su pago confirmado antes del inicio del torneo. Avatares sin pago quedan bloqueados permanentemente.
            <strong style={{color:'var(--ink)',display:'block',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.5px',margin:'8px 0 3px'}}>3. Pronósticos y Edición</strong>
            Cada avatar puede editar sus marcadores hasta 2 horas antes de cada partido. El administrador puede cerrar fases manualmente. El sistema guarda automáticamente. No se aceptan reclamos por pronósticos no guardados.
            <strong style={{color:'var(--ink)',display:'block',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.5px',margin:'8px 0 3px'}}>4. Sistema de Puntos</strong>
            Marcador exacto: 3-10 pts según fase. Ganador correcto: 2-5 pts. Extra Points (tarjetas, goles, MVP): +1 pt si aciertas al menos uno. Predicciones especiales: Campeón +10, Sorpresa +3, Balón/Guante/Bota de Oro +5 c/u.
            <strong style={{color:'var(--ink)',display:'block',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.5px',margin:'8px 0 3px'}}>5. Premios</strong>
            Del total recaudado: 80% al primer lugar y 20% al segundo. Los premios se transfieren por PayPal o Nequi dentro de los 5 días hábiles siguientes al partido final.
            <strong style={{color:'var(--ink)',display:'block',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.5px',margin:'8px 0 3px'}}>6. Privacidad</strong>
            Los datos personales solo se usan para gestionar la Polla. El celular solo se usa para notificaciones WhatsApp si el usuario lo aprueba.
          </div>
          <div className="divider"/>
          <div className="form-group">
            <label>Tu celular (para notificaciones)</label>
            <input className="inp" type="tel" value={form.phone} onChange={upd('phone')} placeholder="+57 300 000 0000"/>
          </div>
          <div className="check-row">
            <div className={`chk ${form.whatsapp?'chk-on':''}`} onClick={()=>setForm(p=>({...p,whatsapp:!p.whatsapp}))}>
              {form.whatsapp&&'✓'}
            </div>
            <span>Quiero recibir notificaciones por WhatsApp después de cada partido</span>
          </div>
          <div className="check-row">
            <div className={`chk ${form.accepted?'chk-on':''}`} onClick={()=>setForm(p=>({...p,accepted:!p.accepted}))}>
              {form.accepted&&'✓'}
            </div>
            <span><strong>He leído y acepto los Términos y Condiciones</strong> — incluye política de premios y pagos</span>
          </div>
        </div>
        <div className="modal-foot">
          <span className="text-muted text-xs">¡Ya casi! Un paso más →</span>
          <button className="btn btn-ink" onClick={accept} disabled={loading||!form.accepted}>
            {loading?'Guardando...':'Aceptar y continuar →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── GUIDE MODAL ──────────────────────────────────────────────────────────────
function GuidePage(){
  const {setView,avatars}=useApp()
  const steps=[
    {n:1,icon:'🏆',title:'Crea tu avatar y paga U$20',
      desc:'Regístrate y crea un nickname (avatar) por U$20. Puedes crear varios — cada uno compite por separado. El admin lo activa al confirmar el pago por PayPal o Nequi.',
      badges:['U$20 por avatar','Activación manual']},
    {n:2,icon:'💬',title:'Habla con Pelé IA y llena tus pronósticos',
      desc:'Pelé IA te guía partido por partido con estadísticas. Puedes editar tus pronósticos hasta 2 horas antes de cada partido. Todo se guarda automáticamente.',
      badges:['104 partidos totales','Guardado automático']},
    {n:3,icon:'⭐',title:'Extra Points — puntos adicionales',
      desc:'Después de cada marcador, apuesta campos extra: tarjetas, goles por tiempo, MVP. Si aciertas al menos uno, ganas +1 punto extra.',
      badges:['+1 pt si aciertas ≥1 campo']},
    {n:4,gold:true,icon:'🎯',title:'Sistema de puntos',
      table:[
        ['Grupos','3','2','+1'],['Ronda de 32','4','2','+1'],
        ['Octavos','5','3','+1'],['Cuartos','6','3','+1'],
        ['Semis','7','4','+1'],['3er Puesto','5','3','+1'],
        ['Final','10','5','+1']
      ]},
    {n:5,gold:true,icon:'🌟',title:'Predicciones especiales',
      desc:'Al inicio: Campeón del Mundial (+10 pts) y equipo sorpresa (+3 pts). Antes de la Final: Balón de Oro, Guante de Oro y Bota de Oro (+5 pts c/u).',
      badges:['🏆 Campeón +10','😲 Sorpresa +3','⭐+🧤+👟 +5 c/u']},
    {n:6,icon:'💰',title:'Premios al ganador',
      desc:'Del total recaudado: 80% al primer lugar y 20% al segundo. Los premios se envían por PayPal o Nequi en los 5 días tras la Gran Final.',
      badges:['🥇 80% del pozo','🥈 20% del pozo']},
  ]
  return(
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-head">
          <div className="modal-title">🏆 CÓMO FUNCIONA LA POLLA 2026</div>
          <button className="btn btn-outline btn-sm" onClick={()=>setView(avatars&&avatars.length?'special':'avatars')}>
            Saltar →
          </button>
        </div>
        <div className="modal-body">
          <div>
            {steps.map(s=>(
              <div key={s.n} className="step-item">
                <div className={`step-num ${s.gold?'step-num-gold':''}`}>{s.n}</div>
                <div className="step-body">
                  <div className="step-title">{s.icon} {s.title}</div>
                  {s.desc&&<div className="step-desc">{s.desc}</div>}
                  {s.table&&(
                    <table className="pts-table">
                      <thead><tr><th>Fase</th><th>Exacto</th><th>Ganador</th><th>Extra</th></tr></thead>
                      <tbody>{s.table.map(([fase,...pts])=>(
                        <tr key={fase}><td>{fase}</td>{pts.map((p,i)=><td key={i}>{p}</td>)}</tr>
                      ))}</tbody>
                    </table>
                  )}
                  {s.badges&&(
                    <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginTop:'5px'}}>
                      {s.badges.map(b=><span key={b} className={`chip ${s.gold?'chip-gold':'chip-ink'}`}>{b}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <span className="text-muted text-xs">¡Ya estás listo para jugar! 🏆</span>
          <button className="btn btn-ink" onClick={()=>setView(avatars&&avatars.length?'special':'avatars')}>
            ¡Entendido! Hablar con Pelé IA →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AVATAR SYSTEM ────────────────────────────────────────────────────────────
function AvatarsPage(){
  const {user,avatars,setAvatars,activeAvatar,setActiveAvatar,setView}=useApp()
  const [showCreate,setShowCreate]=React.useState(false)
  const [payInfo,setPayInfo]=React.useState(null)

  function onCreated(av,info){
    setAvatars(p=>[...p,av])
    setActiveAvatar(av)
    setPayInfo(info)
  }

  if(payInfo) return(
    <div className="page">
      <Nav/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',flex:1,padding:'2rem 1rem'}}>
        <div className="card" style={{maxWidth:400,width:'100%',textAlign:'center'}}>
          <div style={{fontSize:'2.5rem',marginBottom:'.5rem'}}>🎉</div>
          <h2 style={{fontFamily:'Bebas Neue',fontSize:'1.5rem',marginBottom:'.5rem'}}>¡Avatar creado!</h2>
          <p className="text-muted text-sm mb2">Nickname: <strong className="text-gold">{payInfo.avatar.nickname}</strong></p>
          <div className="card-gold" style={{textAlign:'left',marginBottom:'1rem'}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'1.1rem',color:'var(--gold)',marginBottom:'.5rem'}}>💳 Inscripción · U${payInfo.settings?.inscription_fee||20}</div>
            <p className="text-sm text-muted">El administrador te contactará con las instrucciones de pago para activar tu avatar. Pronto estarás en la competencia 🏆</p>
          </div>
          <button className="btn btn-gold btn-full mb1" onClick={()=>setView('chat')}>⚽ Ingresar marcadores</button>
          {avatars&&avatars.length<3?(
            <button className="btn btn-outline btn-full mb1" onClick={()=>{setPayInfo(null);setShowCreate(true)}}>
              ➕ Crear otro avatar ({avatars.length}/3)
            </button>
          ):(
            <p className="text-muted text-xs mb1">Has alcanzado el máximo de 3 avatares.</p>
          )}
          <button className="btn btn-outline btn-sm btn-full" onClick={()=>setView('dashboard')}>Ir al inicio</button>
        </div>
      </div>
    </div>
  )

  return(
    <div className="page">
      <Nav/>
      <div className="container pad">
        <h2 style={{fontFamily:'Bebas Neue',fontSize:'1.6rem',marginBottom:'.25rem'}}>MIS AVATARES</h2>
        <p className="text-muted text-sm mb2">Cada avatar compite por separado · U$20 por avatar</p>

        <div className="av-grid mb2">
          {(avatars||[]).map(av=>(
            <div key={av.id} className={`av-card ${activeAvatar?.id===av.id?'av-card-active':''}`}
              onClick={()=>{setActiveAvatar(av);setView('dashboard')}}>
              <div className="av-circle" style={{background:generateAvatarColor(av.nickname)}}>
                {av.photo_url?<img src={av.photo_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt=""/>
                  :<span>{av.nickname.substring(0,2).toUpperCase()}</span>}
                <div className={`av-status-dot ${av.is_paid?'':'chip-o'}`}
                  style={{background:av.is_paid?'var(--green)':'var(--orange)'}}>
                  {av.is_paid?'✓':'⏳'}
                </div>
              </div>
              <div className="av-nick">{av.nickname}</div>
              <div className="av-pts">{av.is_paid?'Activo 🟢':'Pendiente pago ⏳'}</div>
            </div>
          ))}
          {(!avatars||avatars.length<3)&&(
            <div className="av-card av-card-add" onClick={()=>setShowCreate(true)}>
              <div className="av-add-icon">+</div>
              <div className="av-nick" style={{color:'var(--gold)'}}>Nuevo avatar</div>
              <div className="av-pts">{avatars?.length||0}/3 máx · U$20</div>
            </div>
          )}
        </div>

        <div className="alert alert-info text-sm">
          💡 Cada avatar participa por separado en el ranking. Al crear uno nuevo, el admin recibe una notificación para verificar tu pago.
        </div>

        {avatars&&avatars.length>0&&(
          <button className="btn btn-ink btn-full mt2" onClick={()=>setView('dashboard')}>
            Continuar con {activeAvatar?.nickname||'mi avatar'} →
          </button>
        )}
      </div>
      {showCreate&&<CreateAvatarModal onClose={()=>setShowCreate(false)} onCreated={onCreated}/>}
    </div>
  )
}

function CreateAvatarModal({onClose,onCreated}){
  const {settings}=useApp()
  const [form,setForm]=React.useState({nickname:'',photoUrl:''})
  const [loading,setLoading]=React.useState(false)
  const [err,setErr]=React.useState('')
  const upd=k=>e=>setForm(p=>({...p,[k]:e.target.value}))

  async function submit(e){
    e.preventDefault(); setErr(''); setLoading(true)
    try{
      const data=await api('/api/avatars','POST',{nickname:form.nickname,photoUrl:form.photoUrl||null})
      onCreated(data.avatar,{avatar:data.avatar,settings:data.paymentInfo})
      onClose()
    }catch(e){setErr(e.message)}
    setLoading(false)
  }

  return(
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-head">
          <div className="modal-title">Nuevo Avatar</div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {err&&<Alert type="error">{err}</Alert>}
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Nickname (aparece en el ranking)</label>
              <input className="inp" value={form.nickname} onChange={upd('nickname')}
                placeholder="Ej: LosPerez, ElLeón, DanFire..." required minLength={3} maxLength={25}/>
            </div>
            <div className="form-group">
              <label>URL de foto (opcional)</label>
              <input className="inp" value={form.photoUrl} onChange={upd('photoUrl')}
                placeholder="https://... · JPG/PNG · mín 200×200px · máx 2MB"/>
            </div>
            <div className="alert alert-info text-sm">
              📸 Sin foto → La IA genera un avatar con tus iniciales y colores únicos.<br/>
              Si subes foto: JPG/PNG · Mínimo 200×200px · Máx 2MB · Se recorta en círculo.
            </div>
            <div className="alert alert-warn text-sm">
              💰 Cada avatar cuesta <strong>U${settings?.inscription_fee||20}</strong>. El admin lo activará al confirmar el pago.
            </div>
            <button className="btn btn-gold btn-full mt1" disabled={loading}>
              {loading?'Creando...':'🏆 Crear avatar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── SPECIAL PREDICTIONS (Onboarding) ────────────────────────────────────────
const TEAMS_SPECIAL=Object.keys(FLAGS).filter(t=>!t.startsWith('Play-Off')&&FLAGS[t]!=='❓')
const UNDERDOGS=['Morocco','Japan','Norway','Turkey','Korea Republic','Iraq','DR Congo','Uzbekistan','Curaçao','Cape Verde','Bosnia and Herzegovina','Czechia','South Africa','Haiti','Jordan','Panama','Ghana','Senegal','Ecuador','Algeria']

function SpecialPredictionsPage(){
  const {activeAvatar,setView}=useApp()
  const [preds,setPreds]=React.useState({champion:'',surprise:'',balonDeOro:'',guanteDeOro:'',botaDeOro:''})
  const [existing,setExisting]=React.useState(null)
  const [loading,setLoading]=React.useState(false)
  const [err,setErr]=React.useState('')
  const isFinal=false // Could check if final is near

  React.useEffect(()=>{
    if(!activeAvatar) return
    api(`/api/special/${activeAvatar.id}`).then(d=>{
      if(d&&d.avatar_id){ setExisting(d);setPreds({champion:d.champion_team||'',surprise:d.surprise_team||'',
        balonDeOro:d.balon_de_oro||'',guanteDeOro:d.guante_de_oro||'',botaDeOro:d.bota_de_oro||''}) }
    }).catch(()=>{})
  },[activeAvatar])

  async function save(){
    if(!activeAvatar) return
    setErr(''); setLoading(true)
    try{
      await api('/api/special','POST',{
        avatarId:activeAvatar.id,
        championTeam:preds.champion,surpriseTeam:preds.surprise,
        balonDeOro:preds.balonDeOro,guanteDeOro:preds.guanteDeOro,botaDeOro:preds.botaDeOro
      })
      setView('chat')
    }catch(e){setErr(e.message)}
    setLoading(false)
  }

  const topTeams=['Brazil','France','Argentina','England','Spain','Portugal','Germany','Netherlands',
    'Belgium','Croatia','Colombia','Uruguay']

  return(
    <div className="page">
      <Nav/>
      <div className="container pad">
        <h2 style={{fontFamily:'Bebas Neue',fontSize:'1.6rem',marginBottom:'.25rem',color:'var(--gold)'}}>🌟 PREDICCIONES ESPECIALES</h2>
        <p className="text-muted text-sm mb2">Antes de empezar los pronósticos · Se guardan automáticamente</p>
        {err&&<Alert type="error">{err}</Alert>}

        {/* Champion */}
        <div className="card mb2">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.75rem'}}>
            <div><div style={{fontWeight:700,fontSize:'13px'}}>🏆 Campeón del Mundial 2026</div>
              <div className="text-muted text-xs">Editable hasta que empiece la Ronda de 32</div>
            </div>
            <span className="chip chip-gold">+10 pts</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>
            {[...topTeams,'Mexico','USA','Morocco','Norway','Turkey','Japan','Korea Republic','Senegal'].map(t=>(
              <div key={t} style={{
                background:preds.champion===t?'var(--ink)':'var(--cream2)',
                border:`1.5px solid ${preds.champion===t?'var(--ink)':'var(--border)'}`,
                borderRadius:'8px',padding:'6px 3px',textAlign:'center',cursor:'pointer',transition:'all .15s'
              }} onClick={()=>setPreds(p=>({...p,champion:t}))}>
                <div style={{fontSize:'1.2rem'}}>{f(t)}</div>
                <div style={{fontSize:'9px',fontWeight:700,color:preds.champion===t?'var(--cream)':'var(--ink)',marginTop:'2px'}}>{es(t).split(' ')[0]}</div>
              </div>
            ))}
          </div>
          {!topTeams.includes(preds.champion)&&!['Mexico','USA','Morocco','Norway','Turkey','Japan','Korea Republic','Senegal'].includes(preds.champion)&&preds.champion&&(
            <div className="chip chip-gold mt1">{f(preds.champion)} {es(preds.champion)} seleccionado</div>
          )}
          <select className="inp mt1" value={preds.champion} onChange={e=>setPreds(p=>({...p,champion:e.target.value}))}>
            <option value="">— Otra selección —</option>
            {TEAMS_SPECIAL.map(t=><option key={t} value={t}>{f(t)} {es(t)}</option>)}
          </select>
        </div>

        {/* Surprise */}
        <div className="card mb2">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.75rem'}}>
            <div><div style={{fontWeight:700,fontSize:'13px'}}>😲 Equipo Sorpresa</div>
              <div className="text-muted text-xs">El que llega más lejos de lo esperado · Si llega a cuartos o más, ganas +3 pts</div>
            </div>
            <span className="chip chip-gold">+3 pts</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>
            {UNDERDOGS.slice(0,8).map(t=>(
              <div key={t} style={{
                background:preds.surprise===t?'var(--ink)':'var(--cream2)',
                border:`1.5px solid ${preds.surprise===t?'var(--ink)':'var(--border)'}`,
                borderRadius:'8px',padding:'6px 3px',textAlign:'center',cursor:'pointer'
              }} onClick={()=>setPreds(p=>({...p,surprise:t}))}>
                <div style={{fontSize:'1.2rem'}}>{f(t)}</div>
                <div style={{fontSize:'9px',fontWeight:700,color:preds.surprise===t?'var(--cream)':'var(--ink)',marginTop:'2px'}}>{es(t).split(' ')[0]}</div>
              </div>
            ))}
          </div>
          <select className="inp mt1" value={preds.surprise} onChange={e=>setPreds(p=>({...p,surprise:e.target.value}))}>
            <option value="">— Selecciona equipo sorpresa —</option>
            {TEAMS_SPECIAL.map(t=><option key={t} value={t}>{f(t)} {es(t)}</option>)}
          </select>
        </div>

        {/* Pre-final awards (show always so user can fill) */}
        <div className="card mb2">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.75rem'}}>
            <div><div style={{fontWeight:700,fontSize:'13px'}}>🌟 Premios Individuales · Antes de la Final</div>
              <div className="text-muted text-xs">Puedes llenarlos ahora o antes de la Gran Final</div>
            </div>
            <span className="chip chip-gold">+15 pts</span>
          </div>
          {[
            {k:'balonDeOro',icon:'⭐',label:'Balón de Oro',sub:'Mejor jugador del Mundial',ph:'Ej: Vinícius Jr., Bellingham, Mbappé...'},
            {k:'guanteDeOro',icon:'🧤',label:'Guante de Oro',sub:'Mejor portero del torneo',ph:'Ej: Alisson, Courtois, Dibu Martínez...'},
            {k:'botaDeOro',icon:'👟',label:'Bota de Oro',sub:'Máximo goleador del Mundial',ph:'Ej: CR7, Mbappé, Lautaro...'},
          ].map(({k,icon,label,sub,ph})=>(
            <div key={k} className="spec-row">
              <div className="spec-icon">{icon}</div>
              <div className="spec-info">
                <div className="spec-label">{label}</div>
                <div className="spec-sub">{sub}</div>
                <input className="inp mt1" value={preds[k]} onChange={e=>setPreds(p=>({...p,[k]:e.target.value}))}
                  placeholder={ph} style={{fontSize:'12px'}}/>
              </div>
              <div className="spec-pts">+5</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:'.6rem'}}>
          <button className="btn btn-outline" onClick={()=>setView('chat')}>Omitir por ahora</button>
          <button className="btn btn-gold" style={{flex:1}} onClick={save} disabled={loading}>
            {loading?'Guardando...':'💾 Guardar predicciones →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage(){
  const {user,avatars,activeAvatar,setActiveAvatar,setView}=useApp()
  const [stats,setStats]=React.useState(null)

  React.useEffect(()=>{
    if(!activeAvatar) return
    api(`/api/results/${activeAvatar.id}`).then(rows=>{
      const total=rows.reduce((s,r)=>(r.points_earned||0)+(r.extra_pts||0)+s,0)
      setStats({total,played:rows.length})
    }).catch(()=>{})
  },[activeAvatar])

  return(
    <div className="page">
      <Nav/>
      <div className="container pad">
        <div style={{display:'flex',alignItems:'center',gap:'.75rem',marginBottom:'1rem'}}>
          {activeAvatar&&<AvatarCircle nickname={activeAvatar.nickname} photoUrl={activeAvatar.photo_url} size={46}/>}
          <div>
            <div style={{fontFamily:'Bebas Neue',fontSize:'1.4rem',color:'var(--ink)'}}>
              Hola, {user?.name?.split(' ')[0]}! 👋
            </div>
            {activeAvatar&&(
              <div style={{display:'flex',alignItems:'center',gap:'5px',flexWrap:'wrap'}}>
                <span className={`chip ${activeAvatar.is_paid?'chip-g':'chip-o'}`}>
                  {activeAvatar.is_paid?'✓ Activo':'⏳ Pago pendiente'}
                </span>
                <span className="text-muted text-xs">{activeAvatar.nickname}</span>
              </div>
            )}
          </div>
        </div>

        {/* Avatar selector */}
        {avatars&&avatars.length>1&&(
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'.85rem'}}>
            {avatars.map(av=>(
              <div key={av.id} style={{
                display:'flex',alignItems:'center',gap:'5px',padding:'4px 10px',
                borderRadius:'50px',cursor:'pointer',border:'1.5px solid var(--border)',
                background:activeAvatar?.id===av.id?'var(--ink)':'transparent',
                color:activeAvatar?.id===av.id?'var(--cream)':'var(--ink2)',
                fontSize:'11px',fontWeight:600
              }} onClick={()=>setActiveAvatar(av)}>
                <AvatarCircle nickname={av.nickname} photoUrl={av.photo_url} size={18}/>
                {av.nickname}
              </div>
            ))}
            <div style={{padding:'4px 10px',borderRadius:'50px',cursor:'pointer',border:'1.5px dashed var(--border)',
              color:'var(--gold)',fontSize:'11px',fontWeight:600}} onClick={()=>setView('avatars')}>+ Nuevo</div>
          </div>
        )}

        {activeAvatar&&!activeAvatar.is_paid&&false&&(
          <div className="alert alert-warn mb2">
            ⚠️ <strong>{activeAvatar.nickname}</strong> está pendiente de pago. El admin lo activará al confirmar.
          </div>
        )}

        {stats&&(
          <div className="dash-stats">
            <div className="stat-card"><div className={`stat-n ${stats.total>0?'stat-n-gold':''}`}>{stats.total}</div><div className="stat-l">Puntos</div></div>
            <div className="stat-card"><div className="stat-n">{stats.played}</div><div className="stat-l">Jugados</div></div>
            <div className="stat-card"><div className="stat-n">—</div><div className="stat-l">Posición</div></div>
          </div>
        )}

        <div className="action-grid">
          <div className="action-card action-card-dark" onClick={()=>setView('chat')}>
            <div className="ac-icon">💬</div>
            <div className="ac-label ac-label-w">Pronósticos</div>
            <div className="ac-desc ac-desc-w">Chat con Pelé IA · Stats</div>
          </div>
          <div className="action-card" onClick={()=>setView('board')}>
            <div className="ac-icon">📋</div>
            <div className="ac-label">Tablero</div>
            <div className="ac-desc">Todos los partidos</div>
          </div>
          <div className="action-card" onClick={()=>setView('results')}>
            <div className="ac-icon">📊</div>
            <div className="ac-label">Resultados</div>
            <div className="ac-desc">Mis puntos y stats</div>
          </div>
          <div className="action-card" onClick={()=>setView('ranking')}>
            <div className="ac-icon">🏅</div>
            <div className="ac-label">Ranking</div>
            <div className="ac-desc">Tabla de posiciones</div>
          </div>
          <div className="action-card" onClick={()=>setView('special')}>
            <div className="ac-icon">🌟</div>
            <div className="ac-label">Predicciones Especiales</div>
            <div className="ac-desc">Campeón · Premios individuales</div>
          </div>
          <div className="action-card" onClick={()=>setView('avatars')}>
            <div className="ac-icon">➕</div>
            <div className="ac-label">Mis Avatares</div>
            <div className="ac-desc">Crear · Cambiar</div>
          </div>
        </div>

        {/* Pelé IA free chat CTA */}
        <div style={{marginTop:'1.25rem',background:'linear-gradient(135deg,#1a1a2a,#0f1923)',
          border:'1.5px solid var(--gold)',borderRadius:'var(--r-lg)',padding:'1rem 1.25rem',
          display:'flex',alignItems:'center',gap:'1rem',cursor:'pointer'}}
          onClick={()=>setView('pele_chat')}>
          <img src="/pele.jpg" alt="Pelé IA"
            style={{width:52,height:52,borderRadius:'50%',objectFit:'cover',objectPosition:'top',
              border:'2px solid var(--gold)',flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'1.1rem',color:'var(--gold)',letterSpacing:1}}>Hablar con Pelé IA</div>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,.55)',lineHeight:1.4}}>
              Pregúntale cualquier cosa sobre fútbol — estadísticas, historial, jugadores, tácticas…
            </div>
          </div>
          <div style={{fontSize:'1.5rem'}}>💬</div>
        </div>

      </div>
    </div>
  )
}

// ─── PELÉ IA FREE CHAT (Cualquier pregunta de fútbol) ────────────────────────
function PeleFreeChatPage(){
  const {activeAvatar,setView}=useApp()
  const [messages,setMessages]=React.useState([
    {role:'pele',content:'¡Hola! Soy **Pelé IA** 🏆 — el mayor experto en fútbol de esta plataforma.\n\nPuedes preguntarme lo que quieras sobre fútbol: estadísticas, jugadores, equipos, tácticas, historia, partidos, jugadas… ¡Todo! Si no tiene que ver con el fútbol, mejor busca en Google 😄',id:'intro'}
  ])
  const [input,setInput]=React.useState('')
  const [loading,setLoading]=React.useState(false)
  const bottomRef=React.useRef(null)

  React.useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  async function send(){
    const txt=input.trim(); if(!txt||loading) return
    const userMsg={role:'user',content:txt,id:Date.now()+'u'}
    setMessages(p=>[...p,userMsg]); setInput(''); setLoading(true)
    try{
      const data=await api('/api/pele/free','POST',{
        message:txt, avatarName:activeAvatar?.nickname||'campeón',
        history:messages.slice(-6).map(m=>({role:m.role==='pele'?'assistant':'user',content:m.content}))
      })
      setMessages(p=>[...p,{role:'pele',content:data.response,id:Date.now()+'p'}])
    }catch(e){
      setMessages(p=>[...p,{role:'pele',content:'¡Ups! Tuve un problema técnico. ¿Lo intentamos de nuevo? ⚽',id:Date.now()+'e'}])
    }
    setLoading(false)
  }

  return(
    <div className="page" style={{display:'flex',flexDirection:'column'}}>
      <Nav/>
      {/* Topbar Pelé */}
      <div className="chat-topbar">
        <div className="pele-av" style={{padding:0,overflow:'hidden'}}>
          <img src="/pele.jpg" alt="Pelé IA" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>
          <div className="pele-dot"/>
        </div>
        <div>
          <div className="pele-name">Pelé IA · Modo Libre</div>
          <div className="pele-sub">● Experto en fútbol · Pregunta lo que quieras</div>
        </div>
        <button className="btn btn-outline btn-sm" style={{marginLeft:'auto'}} onClick={()=>setView('dashboard')}>← Volver</button>
      </div>

      {/* Suggested questions */}
      <div style={{padding:'.6rem 1rem',display:'flex',gap:'6px',overflowX:'auto',borderBottom:'1px solid var(--border)'}}>
        {['¿Quién tiene más goles en la historia?','¿Cuál es el mejor equipo de Europa?','Explícame el offside','¿Qué es el tiki-taka?','¿Cuántos balones de oro tiene Messi?'].map(q=>(
          <button key={q} className="btn btn-outline btn-sm"
            style={{whiteSpace:'nowrap',fontSize:'10px',padding:'4px 10px'}}
            onClick={()=>{setInput(q);setTimeout(()=>document.getElementById('pele-inp')?.focus(),50)}}>
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="chat-body" style={{flex:1,overflowY:'auto',maxHeight:'calc(100vh - 220px)'}}>
        {messages.map(msg=>(
          msg.role==='user'
          ? <div key={msg.id} className="row-user">
              <div className="bbl bbl-user">{msg.content}</div>
            </div>
          : <div key={msg.id} className="row-ai">
              <div className="pm" style={{padding:0,overflow:'hidden'}}>
                <img src="/pele.jpg" alt="Pelé" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>
              </div>
              <div className="bbl bbl-ai" dangerouslySetInnerHTML={{__html:(msg.content||'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}}/>
            </div>
        ))}
        {loading&&(
          <div className="row-ai">
            <div className="pm" style={{padding:0,overflow:'hidden'}}>
              <img src="/pele.jpg" alt="Pelé" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>
            </div>
            <div className="bbl bbl-ai" style={{display:'flex',gap:'4px',alignItems:'center'}}>
              {[0,150,300].map(d=>(<div key={d} style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--ink3)',animation:'bounce .9s infinite',animationDelay:d+'ms'}}/>))}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="chat-nav">
        <input id="pele-inp" className="chat-inp" value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyPress={e=>e.key==='Enter'&&send()}
          placeholder="Pregunta cualquier cosa de fútbol..."/>
        <button className="send-btn" onClick={send}>➤</button>
      </div>
    </div>
  )
}

// ─── PELÉ IA CHAT ─────────────────────────────────────────────────────────────
const JOKES=[
  '¿Por qué los porteros son tan buenos en matemáticas?\n¡Porque siempre trabajan bajo los tres palos! 🥅',
  '¿Qué le dijo un poste al otro?\nNada, los postes no hablan... pero los delanteros sí que los abrazan después de fallar 😂',
  '¿Cuál es el deporte favorito de los electricistas?\nEl fútbol, porque siempre buscan el cable... o sea, el balón ⚡⚽',
]

function ChatPage(){
  const {activeAvatar,matches,settings,setView}=useApp()
  const [predictions,setPredictions]=React.useState({})
  const [extras,setExtras]=React.useState({})
  const [chatPhase,setChatPhase]=React.useState('intro') // intro,group_select,stats,score_input,confirm,extra,group_done
  const [messages,setMessages]=React.useState([])
  const [currentGroupKey,setCurrentGroupKey]=React.useState(null)
  const [currentMatchIdx,setCurrentMatchIdx]=React.useState(0)
  const [inputVal,setInputVal]=React.useState('')
  const [scoreForm,setScoreForm]=React.useState({home:'',away:'',pen:''})
  const [extraForm,setExtraForm]=React.useState({yellow:'',red:'',pen_count:'',g1h:'',g2h:'',mvp:''})
  const [loadingMsg,setLoadingMsg]=React.useState(false)
  const [saving,setSaving]=React.useState(false)
  const bottomRef=React.useRef(null)

  const groupMatches=React.useMemo(()=>{
    if(!currentGroupKey||!matches) return []
    return matches.filter(m=>m.phase==='group'&&m.group_name===currentGroupKey)
  },[matches,currentGroupKey])
  const currentMatch=groupMatches[currentMatchIdx]

  const allGroups=['A','B','C','D','E','F','G','H','I','J','K','L']
  const doneCounts=React.useMemo(()=>{
    const c={}
    allGroups.forEach(g=>{
      const ms=(matches||[]).filter(m=>m.phase==='group'&&m.group_name===g)
      c[g]=ms.filter(m=>predictions[m.id]!=null).length
    })
    return c
  },[matches,predictions])
  const totalDone=Object.values(doneCounts).reduce((s,v)=>s+v,0)
  const totalMatches=(matches||[]).length

  React.useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  React.useEffect(()=>{
    if(!activeAvatar) return
    api(`/api/predictions/${activeAvatar.id}`).then(data=>{
      setPredictions(data.predictions||{})
      setExtras(data.extras||{})
    }).catch(()=>{})
    // Start with intro messages
    addPeleMsgs([
      `¡Hola ${activeAvatar.nickname}! 👋 Soy **Pelé IA** 🏆 — tu asistente para el Mundial 2026.`,
      `Antes de empezar... ${JOKES[Math.floor(Math.random()*JOKES.length)]}`,
      `¿De qué equipo eres hincha y cuál es tu selección favorita? ⚽`
    ], 'intro')
  },[activeAvatar])

  function addMsg(role,content,type='text'){
    setMessages(p=>[...p,{role,content,type,id:Date.now()+Math.random()}])
  }
  function addPeleMsgs(texts,ph){
    setMessages(p=>[...p,...texts.map((content,i)=>({role:'pele',content,type:'text',id:Date.now()+i}))])
    if(ph) setChatPhase(ph)
  }

  async function askPele(userMsg,matchCtx,phase){
    setLoadingMsg(true)
    try{
      const data=await api('/api/pele','POST',{
        userMessage:userMsg,matchContext:matchCtx,phase,avatarName:activeAvatar?.nickname
      })
      addMsg('pele',data.response)
    }catch(e){ addMsg('pele','¡Tuve un pequeño problema técnico! ⚽ Pero sigamos — ¿cuánto crees que queda?') }
    setLoadingMsg(false)
  }

  async function handleUserSend(text){
    if(!text.trim()) return
    addMsg('user',text)
    setInputVal('')

    if(chatPhase==='intro'){
      await askPele(text,{phase:'greeting'},chatPhase)
      setTimeout(()=>{
        addMsg('pele','🎯 ¡Ya rompimos el hielo! Estoy listo para ayudarte con todos tus pronósticos. ¿Por qué grupo quieres empezar?','text')
        addMsg('pele','__GROUP_SELECT__','group_select')
        setChatPhase('group_select')
      },800)
    } else if(chatPhase==='group_select'){
      const g=allGroups.find(k=>text.toUpperCase().includes(k)||text.toLowerCase().includes(`grupo ${k.toLowerCase()}`))
      if(g) selectGroup(g)
      else addMsg('pele','Dime la letra del grupo (A-L) o haz clic en uno de los grupos de arriba 😄')
    } else if(chatPhase==='score_input'||chatPhase==='stats'||chatPhase==='confirm'){
      const m=text.match(/(\d+)\s*[-–a]\s*(\d+)/i)
      if(m){
        setScoreForm({home:m[1],away:m[2],pen:''})
        // Save directly — no intermediate confirm step via chat
        setTimeout(async()=>{
          if(!currentMatch||!activeAvatar) return
          setSaving(true)
          try{
            const h=parseInt(m[1])||0, a=parseInt(m[2])||0
            await api('/api/predictions','POST',{
              avatarId:activeAvatar.id,matchId:currentMatch.id,home:h,away:a,penaltyWinner:null
            })
            setPredictions(p=>({...p,[currentMatch.id]:{score_home:h,score_away:a,penalty_winner:null}}))
            setScoreForm({home:'',away:'',pen:''})
            goToNextMatch()
          }catch(e){ addMsg('pele','❌ Error: '+e.message) }
          setSaving(false)
        },0)
      } else if(/no s[eé]|ni idea|sugier|recomiend/i.test(text)){
        suggestScore()
      } else {
        addMsg('pele','Dime el marcador así: "2-1" 😄')
      }
    }
  }

  function selectGroup(g){
    setCurrentGroupKey(g)
    setCurrentMatchIdx(0)
    const teams=matches?.filter(m=>m.phase==='group'&&m.group_name===g).map(m=>[m.team1,m.team2]).flat().filter(Boolean)
    const uniqueTeams=[...new Set(teams)]
    addMsg('pele',`¡Grupo ${g}! 🎯 ${uniqueTeams.map(t=>f(t)).join(' ')} — empecemos con el primer partido.`)
    setChatPhase('stats')
    setTimeout(()=>{
      const ms=matches?.filter(m=>m.phase==='group'&&m.group_name===g)||[]
      if(ms[0]) showMatchStats(ms[0], 0)
    },400)
  }

  function showMatchStats(match, forceIdx){
    if(!match) return
    if(forceIdx!==undefined) setCurrentMatchIdx(forceIdx)
    addMsg('pele','__STATS__','stats')
    addMsg('pele',`¿Cuánto crees que queda este partido? 🤔\n(Dime el marcador o escribe "no sé" para que yo te sugiera)`)
    setChatPhase('score_input')
  }

  async function suggestScore(){
    if(!currentMatch) return
    const t1=currentMatch.team1, t2=currentMatch.team2
    const s1=TEAM_STATS[t1]||{rank:50,notes:''}
    const s2=TEAM_STATS[t2]||{rank:50,notes:''}
    setLoadingMsg(true)
    try{
      const data=await api('/api/pele/suggest','POST',{
        team1:t1, team2:t2,
        rank1:s1.rank, rank2:s2.rank,
        notes1:s1.notes||'Sin datos adicionales',
        notes2:s2.notes||'Sin datos adicionales',
        venue:currentMatch.venue||'',
        matchDate:currentMatch.match_date||'',
        group:currentMatch.group_name||''
      })
      const h=data.home??1, a=data.away??0
      setScoreForm({home:String(h),away:String(a),pen:''})
      addMsg('pele',`💡 Mi análisis: **${es(t1)} ${h} – ${a} ${es(t2)}**\n${data.reason||''}`)
    }catch(e){
      addMsg('pele','No pude conectarme al análisis 😅 Pon el marcador que creas.')
    }
    setLoadingMsg(false)
  }

  async function confirmScore(){
    if(!currentMatch||!activeAvatar) return
    setSaving(true)
    try{
      const h=parseInt(scoreForm.home)||0, a=parseInt(scoreForm.away)||0
      await api('/api/predictions','POST',{
        avatarId:activeAvatar.id,matchId:currentMatch.id,home:h,away:a,
        penaltyWinner:scoreForm.pen||null
      })
      setPredictions(p=>({...p,[currentMatch.id]:{score_home:h,score_away:a,penalty_winner:scoreForm.pen||null}}))
      setScoreForm({home:'',away:'',pen:''})
      // Immediately advance — no Extra Points blocking
      goToNextMatch()
    }catch(e){ addMsg('pele','❌ Error guardando: '+e.message) }
    setSaving(false)
  }

  async function saveExtras(){
    if(!currentMatch||!activeAvatar) return
    try{
      const ef=extraForm
      if(ef.yellow||ef.red||ef.pen_count||ef.g1h||ef.g2h||ef.mvp){
        await api('/api/extra-predictions','POST',{
          avatarId:activeAvatar.id,matchId:currentMatch.id,
          yellowCards:ef.yellow?+ef.yellow:null,redCards:ef.red?+ef.red:null,
          penaltiesCount:ef.pen_count?+ef.pen_count:null,
          goalsFirstHalf:ef.g1h?+ef.g1h:null,goalsSecondHalf:ef.g2h?+ef.g2h:null,
          mvpPlayer:ef.mvp||null
        })
        setExtras(p=>({...p,[currentMatch.id]:ef}))
      }
    }catch(e){ console.error('extra:',e) }
    goToNextMatch()
  }

  function goToNextMatch(){
    setExtraForm({yellow:'',red:'',pen_count:'',g1h:'',g2h:'',mvp:''})
    const nextIdx=currentMatchIdx+1
    if(nextIdx<groupMatches.length){
      const next=groupMatches[nextIdx]
      const total=groupMatches.length
      addMsg('pele',`✅ Guardado — partido ${nextIdx}/${total} del Grupo ${currentGroupKey}. Siguiente ⚽`,'ok')
      showMatchStats(next, nextIdx)
    } else {
      addMsg('pele',`🎉 ¡Grupo ${currentGroupKey} completado! (${groupMatches.length}/${groupMatches.length} partidos) — ¿Cuál grupo seguimos?`,'ok')
      addMsg('pele','__GROUP_DONE__','group_done')
      setChatPhase('group_select')
    }
  }

  if(!activeAvatar) return(
    <div className="page"><Nav/>
      <div className="container pad">
        <Alert type="warn">Selecciona un avatar en el Dashboard primero.</Alert>
        <button className="btn btn-ink" onClick={()=>setView('dashboard')}>← Dashboard</button>
      </div>
    </div>
  )

  return(
    <div className="page">
      <Nav/>
      {/* Topbar */}
      <div className="chat-topbar">
        <div className="pele-av" style={{padding:0,overflow:'hidden'}}>
          <img src="/pele.jpg" alt="Pelé IA" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>
          <div className="pele-dot"/>
        </div>
        <div>
          <div className="pele-name">Pelé IA</div>
          <div className="pele-sub">● En línea · {activeAvatar.nickname}</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'3px'}}>
          <span className="chip chip-gold" style={{fontSize:'9px'}}>{totalDone}/{(matches||[]).filter(m=>m.phase==='group').length} grupos</span>
          <div className="autosave"><div className="dot-g"/>Auto-guardado</div>
        </div>
      </div>
      <div className="prog-bar"><div className="prog-fill" style={{width:`${totalMatches?Math.round(totalDone/72*100):0}%`}}/></div>

      {/* Phase strip */}
      {currentGroupKey&&(
        <div className="phase-bar">
          <div className={`ph ph-on`}>Grupo {currentGroupKey}</div>
          {allGroups.filter(g=>g!==currentGroupKey).map(g=>(
            <div key={g} className={`ph ${doneCounts[g]>=6?'ph-done':''}`} onClick={()=>selectGroup(g)} style={{cursor:'pointer'}}>
              {doneCounts[g]>=6?'✓ ':''}{g}
            </div>
          ))}
        </div>
      )}

      {/* Chat messages */}
      <div className="chat-body" style={{flex:1,overflowY:'auto',maxHeight:'calc(100vh - 240px)'}}>
        {messages.map(msg=>{
          if(msg.role==='user') return(
            <div key={msg.id} className="row-user">
              <div className="bbl bbl-user" dangerouslySetInnerHTML={{__html:msg.content.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}}/>
            </div>
          )
          if(msg.type==='ok') return(
            <div key={msg.id} className="row-ai">
              <div className="pm" style={{padding:0,overflow:'hidden'}}><img src="/pele.jpg" alt="Pelé" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/></div>
              <div className="bbl bbl-ok">{msg.content}</div>
            </div>
          )
          if(msg.type==='group_select') return(
            <div key={msg.id} style={{width:'100%'}}>
              <div className="group-grid">
                {allGroups.map(g=>{
                  const done=doneCounts[g]>=6
                  const GRPS={'A':'🇲🇽🇿🇦🇰🇷🇨🇿','B':'🇨🇦🇧🇦🇶🇦🇨🇭','C':'🇧🇷🇲🇦🇭🇹🏴󠁧󠁢󠁳󠁣󠁴󠁿','D':'🇺🇸🇵🇾🇦🇺🇹🇷','E':'🇩🇪🇨🇼🇨🇮🇪🇨','F':'🇳🇱🇯🇵🇸🇪🇹🇳','G':'🇧🇪🇪🇬🇮🇷🇳🇿','H':'🇪🇸🇨🇻🇸🇦🇺🇾','I':'🇫🇷🇸🇳🇮🇶🇳🇴','J':'🇦🇷🇩🇿🇦🇹🇯🇴','K':'🇵🇹🇨🇩🇺🇿🇨🇴','L':'🏴󠁧󠁢󠁥󠁮󠁧󠁿🇭🇷🇬🇭🇵🇦'}
                  return(
                    <div key={g} className={`grp-btn ${done?'grp-btn-done':currentGroupKey===g?'grp-btn-on':''}`}
                      onClick={()=>selectGroup(g)}>
                      <div className={`grp-lbl ${done?'grp-lbl-g':currentGroupKey===g?'grp-lbl-w':''}`}>{done?'✓':''}{g}</div>
                      <div className="grp-flags">{GRPS[g]}</div>
                      <div className="grp-count">{doneCounts[g]||0}/6</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
          if(msg.type==='stats'){
            const isLatest=messages.filter(m=>m.type==='stats').slice(-1)[0]?.id===msg.id
            if(!isLatest||!currentMatch){
              // Old stats msg — just show a done chip
              const pred=predictions[currentMatch?.id]
              return pred?(
                <div key={msg.id} className="chip chip-g" style={{fontSize:'10px',alignSelf:'flex-start',margin:'0 0 .25rem 0'}}>
                  ✓ {es(currentMatch?.team1)} {pred.score_home} – {pred.score_away} {es(currentMatch?.team2)}
                </div>
              ):null
            }
            return(
              <div key={msg.id} style={{width:'100%'}}>
                <MatchStatsCard match={currentMatch} predictions={predictions}
                  scoreForm={scoreForm} setScoreForm={setScoreForm}
                  onSave={()=>{
                    const h=parseInt(scoreForm.home), a=parseInt(scoreForm.away)
                    if(isNaN(h)||isNaN(a)||scoreForm.home===''||scoreForm.away==='') return
                    confirmScore()
                  }}
                  onSuggest={suggestScore}
                  saving={saving}/>
              </div>
            )
          }
          if(msg.type==='confirm'){
            const isLatest=messages.filter(m=>m.type==='confirm').slice(-1)[0]?.id===msg.id
            if(!isLatest||!currentMatch) return null
            return(
              <div key={msg.id} style={{width:'100%'}}>
                <ConfirmCard match={currentMatch} home={scoreForm.home} away={scoreForm.away}
                  onOk={confirmScore} onEdit={()=>setChatPhase('score_input')}
                  saving={saving}
                  scoreForm={scoreForm} setScoreForm={setScoreForm}/>
              </div>
            )
          }
          if(msg.type==='extra'&&currentMatch) return(
            <div key={msg.id} style={{width:'100%'}}>
              <ExtraPointsCard match={currentMatch} form={extraForm}
                setForm={setExtraForm} onSave={saveExtras} onSkip={goToNextMatch}/>
            </div>
          )
          if(msg.type==='group_done') return(
            <div key={msg.id} style={{width:'100%'}}>
              <div className="group-grid">
                {allGroups.filter(g=>g!==currentGroupKey).map(g=>{
                  const done=doneCounts[g]>=6
                  const GRPS={'A':'🇲🇽🇿🇦🇰🇷🇨🇿','B':'🇨🇦🇧🇦🇶🇦🇨🇭','C':'🇧🇷🇲🇦🇭🇹🏴󠁧󠁢󠁳󠁣󠁴󠁿','D':'🇺🇸🇵🇾🇦🇺🇹🇷','E':'🇩🇪🇨🇼🇨🇮🇪🇨','F':'🇳🇱🇯🇵🇸🇪🇹🇳','G':'🇧🇪🇪🇬🇮🇷🇳🇿','H':'🇪🇸🇨🇻🇸🇦🇺🇾','I':'🇫🇷🇸🇳🇮🇶🇳🇴','J':'🇦🇷🇩🇿🇦🇹🇯🇴','K':'🇵🇹🇨🇩🇺🇿🇨🇴','L':'🏴󠁧󠁢󠁥󠁮󠁧󠁿🇭🇷🇬🇭🇵🇦'}
                  return(
                    <div key={g} className={`grp-btn ${done?'grp-btn-done':''}`}
                      onClick={()=>selectGroup(g)} style={{cursor:'pointer'}}>
                      <div className={`grp-lbl ${done?'grp-lbl-g':''}`}>{done?'✓':''}{g}</div>
                      <div className="grp-flags">{GRPS[g]}</div>
                      <div className="grp-count">{doneCounts[g]||0}/6</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
          return(
            <div key={msg.id} className="row-ai">
              <div className="pm" style={{padding:0,overflow:'hidden'}}><img src="/pele.jpg" alt="Pelé" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/></div>
              <div className="bbl bbl-ai" dangerouslySetInnerHTML={{__html:(msg.content||'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}}/>
            </div>
          )
        })}
        {loadingMsg&&(
          <div className="row-ai">
            <div className="pm">🏆</div>
            <div className="bbl bbl-ai" style={{display:'flex',gap:'4px',alignItems:'center'}}>
              {[0,150,300].map(d=>(
                <div key={d} style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--ink3)',
                  animation:'bounce .9s infinite',animationDelay:d+'ms'}}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Quick replies */}
      {chatPhase==='group_select'&&(
        <div className="qr-row">
          <div className="qr qr-gold" onClick={()=>setView('board')}>📋 Ver tablero general</div>
          <div className="qr" onClick={()=>setView('dashboard')}>🏠 Inicio</div>
        </div>
      )}
      {(chatPhase==='score_input'||chatPhase==='stats')&&(
        <div className="qr-row">
          <div className="qr qr-gold" onClick={suggestScore}>💡 Sugiéreme el marcador</div>
          <div className="qr" onClick={()=>setChatPhase('group_select')}>Cambiar grupo</div>
        </div>
      )}

      {/* Input bar */}
      <div className="chat-nav">
        <input className="chat-inp" value={inputVal} onChange={e=>setInputVal(e.target.value)}
          onKeyPress={e=>e.key==='Enter'&&handleUserSend(inputVal)}
          placeholder={chatPhase==='score_input'?'Ej: 2-1 o "no sé"...':'Escribe tu respuesta...'}/>
        <button className="send-btn" onClick={()=>handleUserSend(inputVal)}>➤</button>
      </div>
    </div>
  )
}

function MatchStatsCard({match,predictions,scoreForm,setScoreForm,onSave,onSuggest,saving}){
  if(!match) return null
  const pred=predictions[match.id]
  const t1=match.team1, t2=match.team2
  const s1=TEAM_STATS[t1]||{rank:'?',notes:'Datos en actualización'}
  const s2=TEAM_STATS[t2]||{rank:'?',notes:'Datos en actualización'}
  const locked=isLocked(match)
  return(
    <div className="stats-card" style={{marginBottom:'.25rem'}}>
      <div className="sc-head">
        <div><div className="sc-phase">{PHASE_LABELS[match.phase]}{match.group_name?` · Grupo ${match.group_name}`:''}</div>
          <div style={{fontSize:'10px',color:'rgba(247,244,238,.4)',marginTop:'1px'}}>{formatDateShort(match.match_date)} · {match.venue}</div>
        </div>
        <div className="sc-num">#{match.match_num}</div>
      </div>
      <div className="sc-body">
        <div className="sc-teams">
          <div className="sct"><span className="sct-flag">{f(t1)}</span><div className="sct-name">{es(t1)}</div><div className="sct-rank">FIFA #{s1.rank}</div></div>
          <div className="sct-vs">VS</div>
          <div className="sct"><span className="sct-flag">{f(t2)}</span><div className="sct-name">{es(t2)}</div><div className="sct-rank">FIFA #{s2.rank}</div></div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'2px',marginBottom:'.6rem'}}>
          {[
            ['📊 '+es(t1),s1.notes],
            ['📊 '+es(t2),s2.notes],
          ].map(([k,v],i)=>(
            <div key={i} className="sr"><span className="sr-k">{k}</span><span className="sr-v" style={{textAlign:'right',maxWidth:'55%'}}>{v}</span></div>
          ))}
        </div>
        {locked?(<div className="chip" style={{fontSize:'10px',background:'var(--red)',color:'#fff'}}>🔒 Cerrado</div>)
        :scoreForm&&setScoreForm&&onSave?(
          <div style={{marginTop:'.5rem'}}>
            {pred&&<div className="chip chip-g" style={{fontSize:'10px',marginBottom:'.5rem'}}>✓ Pronóstico guardado: {pred.score_home} – {pred.score_away}</div>}
            <div style={{display:'flex',alignItems:'center',gap:'8px',justifyContent:'center',marginBottom:'.5rem'}}>
              <span style={{fontSize:'12px',fontWeight:600}}>{f(t1)}</span>
              <input type="number" min="0" max="20" value={scoreForm?.home||''} onChange={e=>setScoreForm(p=>({...p,home:e.target.value}))}
                style={{width:'44px',textAlign:'center',fontSize:'1.3rem',fontWeight:700,fontFamily:'Bebas Neue',
                  border:'2px solid var(--gold)',borderRadius:'6px',background:'var(--cream)',color:'var(--ink)',padding:'4px'}}/>
              <span style={{fontFamily:'Bebas Neue',fontSize:'1rem',color:'var(--ink3)'}}>—</span>
              <input type="number" min="0" max="20" value={scoreForm?.away||''} onChange={e=>setScoreForm(p=>({...p,away:e.target.value}))}
                style={{width:'44px',textAlign:'center',fontSize:'1.3rem',fontWeight:700,fontFamily:'Bebas Neue',
                  border:'2px solid var(--gold)',borderRadius:'6px',background:'var(--cream)',color:'var(--ink)',padding:'4px'}}/>
              <span style={{fontSize:'12px',fontWeight:600}}>{f(t2)}</span>
            </div>
            <div style={{display:'flex',gap:'6px'}}>
              {onSuggest&&<button className="btn btn-outline btn-sm" style={{flex:1}} onClick={onSuggest}>💡 Sugiéreme</button>}
              <button className="btn btn-gold" style={{flex:2}} onClick={onSave} disabled={saving||scoreForm?.home===''||scoreForm?.away===''}>
                {saving?'Guardando...':'💾 Guardar marcador'}
              </button>
            </div>
          </div>
        ):(
          pred
            ?<div className="chip chip-g" style={{fontSize:'10px'}}>✓ Tu pronóstico: {pred.score_home} – {pred.score_away}</div>
            :null
        )}
      </div>
    </div>
  )
}

function ConfirmCard({match,home,away,onOk,onEdit,saving,scoreForm,setScoreForm}){
  const h=parseInt(home)||0, a=parseInt(away)||0
  const winner=h>a?match.team1:h<a?match.team2:'Empate'
  return(
    <div className="confirm-card" style={{marginBottom:'.25rem'}}>
      <div className="cc-head">
        <div><div className="cc-label">{PHASE_LABELS[match.phase]}{match.group_name?` · Grupo ${match.group_name}`:''} · #{match.match_num}</div>
          <div style={{fontSize:'10px',color:'rgba(247,244,238,.4)'}}>{formatDateShort(match.match_date)} · {match.venue}</div>
        </div>
        <div className="cc-deadline">⏰ Cierra 2h antes</div>
      </div>
      <div className="cc-body">
        <div className="cc-teams">
          <div className="cct"><span className="cct-flag">{f(match.team1)}</span><div className="cct-name">{es(match.team1)}</div></div>
          <div className="cc-score">
            <div className="cc-sc cc-sc-a">{h}</div>
            <div style={{fontFamily:'Bebas Neue',fontSize:'1rem',color:'var(--cream3)'}}>—</div>
            <div className="cc-sc cc-sc-b">{a}</div>
          </div>
          <div className="cct"><span className="cct-flag">{f(match.team2)}</span><div className="cct-name">{es(match.team2)}</div></div>
        </div>
        <div className="cc-agree">✅ Resultado: {winner==='Empate'?'Empate':es(winner)+' gana'}</div>
        <div style={{display:'flex',gap:'.5rem'}}>
          <button className="btn btn-outline btn-sm" onClick={onEdit}>✏️ Editar</button>
          <button className="btn btn-green" style={{flex:1}} onClick={onOk} disabled={saving}>
            {saving?'Guardando...':'✓ Confirmar este pronóstico'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ExtraPointsCard({match,form,setForm,onSave,onSkip}){
  const upd=k=>e=>setForm(p=>({...p,[k]:e.target.value}))
  return(
    <div className="extra-block" style={{marginBottom:'.25rem'}}>
      <div className="extra-hdr">
        <div className="extra-title-c">⭐ Extra Points · {es(match.team1)} vs {es(match.team2)}</div>
        <span className="chip chip-gold">+1 si aciertas ≥1</span>
      </div>
      <div className="extra-grid">
        {[
          {k:'yellow',icon:'🟨',l:'T. Amarillas',type:'number'},
          {k:'red',icon:'🟥',l:'T. Rojas',type:'number'},
          {k:'pen_count',icon:'⚡',l:'Penales',type:'number'},
          {k:'g1h',icon:'⚽',l:'Goles 1T',type:'number'},
          {k:'g2h',icon:'⚽',l:'Goles 2T',type:'number'},
          {k:'mvp',icon:'🏅',l:'MVP',type:'text',full:true},
        ].map(({k,icon,l,type,full})=>(
          <div key={k} className={`ef ${full?'ef-full':''}`}>
            <div className="ef-icon">{icon}</div>
            <div className="ef-label">{l}</div>
            <input className={`ef-inp ${type==='text'?'ef-inp-txt':''}`} type={type} value={form[k]}
              onChange={upd(k)} placeholder={type==='number'?'0':'Nombre...'}/>
          </div>
        ))}
      </div>
      <div className="pele-rec"><span className="rec-lbl">💡 Son opcionales</span> Si aciertas al menos uno de estos campos, ganas +1 punto extra en este partido.</div>
      <div style={{display:'flex',gap:'.5rem',marginTop:'.6rem'}}>
        <button className="btn btn-outline btn-sm" onClick={onSkip}>Omitir →</button>
        <button className="btn btn-gold" style={{flex:1}} onClick={onSave}>💾 Guardar y siguiente →</button>
      </div>
    </div>
  )
}

// ─── BOARD PAGE ───────────────────────────────────────────────────────────────
function BoardPage(){
  const {matches,activeAvatar,setView}=useApp()
  const [predictions,setPredictions]=React.useState({})
  const [filterPhase,setFilterPhase]=React.useState('all')
  const [filterGroup,setFilterGroup]=React.useState('all')
  const [loading,setLoading]=React.useState(true)

  React.useEffect(()=>{
    if(activeAvatar)
      api(`/api/predictions/${activeAvatar.id}`).then(d=>setPredictions(d.predictions||{})).catch(()=>{})
    setLoading(false)
  },[activeAvatar])

  const phases=['group','round32','round16','quarters','semis','third','final']
  const groups=['A','B','C','D','E','F','G','H','I','J','K','L']

  const filtered=(matches||[]).filter(m=>{
    if(filterPhase!=='all'&&m.phase!==filterPhase) return false
    if(filterGroup!=='all'&&filterPhase==='group'&&m.group_name!==filterGroup) return false
    return true
  })

  const grouped={}
  filtered.forEach(m=>{
    const key=m.phase==='group'?`group_${m.group_name}`:m.phase
    if(!grouped[key]) grouped[key]=[]
    grouped[key].push(m)
  })

  if(loading) return <div className="page"><Nav/><Spinner/></div>

  return(
    <div className="page">
      <Nav/>
      <div className="container pad">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.75rem'}}>
          <h2 style={{fontFamily:'Bebas Neue',fontSize:'1.5rem'}}>📋 TABLERO GENERAL</h2>
          <button className="btn btn-outline btn-sm" onClick={()=>setView('chat')}>💬 Pelé IA</button>
        </div>

        {/* Filter tabs */}
        <div style={{overflowX:'auto',paddingBottom:'5px',marginBottom:'1rem'}}>
          <div style={{display:'flex',gap:'5px',whiteSpace:'nowrap'}}>
            <div className={`ph ${filterPhase==='all'?'ph-on':''}`} style={{cursor:'pointer'}} onClick={()=>setFilterPhase('all')}>Todos</div>
            {phases.map(ph=><div key={ph} className={`ph ${filterPhase===ph?'ph-on':''}`} style={{cursor:'pointer'}} onClick={()=>setFilterPhase(ph)}>{PHASE_LABELS[ph]}</div>)}
          </div>
        </div>

        {filterPhase==='group'&&(
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'1rem'}}>
            <div className={`ph ${filterGroup==='all'?'ph-on':''}`} style={{cursor:'pointer'}} onClick={()=>setFilterGroup('all')}>Todos</div>
            {groups.map(g=><div key={g} className={`ph`} style={{cursor:'pointer'}} onClick={()=>setFilterGroup(g)}>Grupo {g}</div>)}
          </div>
        )}

        {Object.entries(grouped).map(([key,ms])=>{
          const ph=ms[0]?.phase
          const grp=ms[0]?.group_name
          const header=ph==='group'?`Grupo ${grp} — ${PHASE_LABELS[ph]}`:PHASE_LABELS[ph]||key
          return(
            <div key={key}>
              <div className="phase-header">{header}</div>
              {ms.map(m=>{
                const pred=predictions[m.id]
                const hasResult=m.r_home!=null
                const locked=isLocked(m)
                const pts=pred?.points_earned||0
                return(
                  <div key={m.id} className={`match-row ${hasResult?'match-row-done':locked?'match-row-locked':''}`}
                    onClick={()=>setView('chat')} style={{cursor:'pointer'}}>
                    <div className="match-teams">
                      <span style={{flex:1,textAlign:'right'}}>{f(m.team1)} {es(m.team1)}</span>
                      {hasResult?<span className="match-score">{m.r_home}–{m.r_away}</span>
                        :<span className="match-score" style={{color:'var(--cream3)'}}>vs</span>}
                      <span style={{flex:1}}>{es(m.team2)} {f(m.team2)}</span>
                    </div>
                    <div className="match-meta">{formatDateShort(m.match_date)} · {m.venue}</div>
                    {pred&&(
                      <div className="match-pred">
                        <span style={{color:'var(--ink3)'}}>Pronóstico: {pred.score_home}–{pred.score_away}</span>
                        {hasResult&&<span className={`pts-badge ${pts>=PHASE_PTS[ph]?.exact?'pts-exact':pts>0?'pts-win':'pts-miss'}`}>{pts>0?`+${pts}pts`:'Sin pts'}</span>}
                        <span className={`chip ${locked?'chip-r':'chip-g'}`} style={{fontSize:'8px'}}>{locked?'🔒 Bloqueado':'✏️ Editable'}</span>
                      </div>
                    )}
                    {!pred&&!locked&&<div className="match-pred text-xs" style={{color:'var(--gold)'}}>💬 Toca para pronosticar</div>}
                    {!pred&&locked&&<div className="match-pred text-xs" style={{color:'var(--red)'}}>⏰ Sin pronóstico — bloqueado</div>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── RANKING PAGE ─────────────────────────────────────────────────────────────
function RankingPage(){
  const {setView}=useApp()
  const [ranking,setRanking]=React.useState([])
  const [loading,setLoading]=React.useState(true)

  React.useEffect(()=>{
    api('/api/ranking').then(data=>{setRanking(data);setLoading(false)}).catch(()=>setLoading(false))
    const id=setInterval(()=>api('/api/ranking').then(setRanking).catch(()=>{}),30000)
    return()=>clearInterval(id)
  },[])

  const top3=ranking.slice(0,3)
  const rest=ranking.slice(3)

  if(loading) return <div className="page"><Nav/><Spinner/></div>

  const PODIUM_ORDER=[1,0,2] // Silver, Gold, Bronze positioning

  return(
    <div className="page">
      <Nav/>
      <div className="container pad">
        <h2 style={{fontFamily:'Bebas Neue',fontSize:'1.5rem',marginBottom:'.25rem'}}>🏅 RANKING FINAL</h2>
        <p className="text-muted text-xs mb2">Se actualiza en tiempo real · {ranking.length} avatares activos</p>

        {/* Prizes */}
        {ranking.length>0&&(
          <div className="prize-row">
            <div className="prize-card p-card-g">
              <div className="p-icon">🥇</div><div className="p-label">1er Lugar</div>
              <div className="p-amt">80%</div><div className="p-pct">del pozo total</div>
            </div>
            <div className="prize-card p-card-n">
              <div className="p-icon">🥈</div><div className="p-label">2do Lugar</div>
              <div className="p-amt">20%</div><div className="p-pct">del pozo total</div>
            </div>
          </div>
        )}

        {/* Podium top 3 */}
        {top3.length>0&&(
          <div className="podium">
            {PODIUM_ORDER.map(pos=>{
              const r=top3[pos]
              if(!r) return <div key={pos} className="pod-col"/>
              const heights=[130,160,110]
              const sizes=[40,50,36]
              const colors=['linear-gradient(135deg,#C0C0C0,#E0E0E0)','linear-gradient(135deg,#C8A84B,#F6C90E)','linear-gradient(135deg,#CD7F32,#D4913A)']
              return(
                <div key={r.id} className="pod-col">
                  <div className="pod-face" style={{fontSize:pos===0?'1.6rem':'1.4rem'}}><MedalRank rank={r.rank}/></div>
                  <AvatarCircle nickname={r.nickname} photoUrl={r.photo_url} size={sizes[pos]} style={{marginBottom:'5px'}}/>
                  <div style={{fontWeight:700,fontSize:'10px',color:'var(--ink)',marginBottom:'4px',textAlign:'center',maxWidth:'70px',lineHeight:'1.2'}}>{r.nickname}</div>
                  <div className="pod-bar" style={{height:heights[pos]+'px',background:colors[pos],borderRadius:'.75rem .75rem 0 0'}}>
                    <div style={{fontFamily:'Bebas Neue',fontSize:'1.3rem',color:'rgba(26,24,20,.7)'}}>{r.total_pts}</div>
                    <div style={{fontSize:'9px',color:'rgba(26,24,20,.5)'}}>pts</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Rest of ranking */}
        <div className="rank-list">
          {[...top3,...rest].map((r,i)=>(
            <div key={r.id} className="rank-row">
              <div className="rk-pos">{r.rank}</div>
              <div className="rk-face"><MedalRank rank={r.rank}/></div>
              <AvatarCircle nickname={r.nickname} photoUrl={r.photo_url} size={34}/>
              <div className="rk-name">
                <div className="rk-nick">{r.nickname}</div>
                <div className="rk-sub">{r.user_name} · {r.hits||0} aciertos</div>
              </div>
              <div>
                <div className="rk-pts">{r.total_pts}</div>
                <div className="rk-sub" style={{textAlign:'right'}}>pts</div>
              </div>
            </div>
          ))}
          {ranking.length===0&&<div style={{padding:'2rem',textAlign:'center',color:'var(--ink3)'}}>Aún no hay avatares activos 🏆</div>}
        </div>
      </div>
    </div>
  )
}

// ─── RESULTS PAGE ─────────────────────────────────────────────────────────────
function ResultsPage(){
  const {activeAvatar,setView}=useApp()
  const [results,setResults]=React.useState([])
  const [special,setSpecial]=React.useState(null)
  const [loading,setLoading]=React.useState(true)

  React.useEffect(()=>{
    if(!activeAvatar){setLoading(false);return}
    Promise.all([
      api(`/api/results/${activeAvatar.id}`),
      api(`/api/special/${activeAvatar.id}`)
    ]).then(([r,s])=>{setResults(r);setSpecial(s)}).catch(()=>{}).finally(()=>setLoading(false))
  },[activeAvatar])

  if(loading) return <div className="page"><Nav/><Spinner/></div>

  const totalPts=results.reduce((s,r)=>(r.points_earned||0)+(r.extra_pts||0)+s,0)
  const specPts=special?(special.champion_pts||0)+(special.surprise_pts||0)+(special.balon_pts||0)+(special.guante_pts||0)+(special.bota_pts||0):0

  return(
    <div className="page">
      <Nav/>
      <div className="container pad">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.75rem'}}>
          <div>
            <h2 style={{fontFamily:'Bebas Neue',fontSize:'1.5rem'}}>📊 MIS RESULTADOS</h2>
            {activeAvatar&&<p className="text-muted text-xs">{activeAvatar.nickname}</p>}
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'2rem',color:'var(--gold)',lineHeight:1}}>{totalPts+specPts}</div>
            <div className="text-muted text-xs">puntos totales</div>
          </div>
        </div>

        {special&&specPts>0&&(
          <div className="card-gold mb2">
            <div style={{fontFamily:'Bebas Neue',fontSize:'1rem',color:'var(--gold)',marginBottom:'.5rem'}}>🌟 PREDICCIONES ESPECIALES</div>
            {[
              {icon:'🏆',l:'Campeón',v:special.champion_team,pts:special.champion_pts,max:10},
              {icon:'😲',l:'Sorpresa',v:special.surprise_team,pts:special.surprise_pts,max:3},
              {icon:'⭐',l:'Balón de Oro',v:special.balon_de_oro,pts:special.balon_pts,max:5},
              {icon:'🧤',l:'Guante de Oro',v:special.guante_de_oro,pts:special.guante_pts,max:5},
              {icon:'👟',l:'Bota de Oro',v:special.bota_de_oro,pts:special.bota_pts,max:5},
            ].filter(x=>x.v).map(({icon,l,v,pts,max})=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:'12px',padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
                <span>{icon} {l}: <strong>{f(v)?f(v)+' ':''}{es(v)||v}</strong></span>
                <span className={pts>0?'text-green':'text-muted'}>{pts>0?`+${pts}pts`:`0/${max}pts`}</span>
              </div>
            ))}
          </div>
        )}

        {results.length===0&&(
          <div className="card text-center">
            <div style={{fontSize:'2rem',marginBottom:'.5rem'}}>⚽</div>
            <div className="text-muted">Aún no hay partidos con resultado oficial.</div>
            <button className="btn btn-ink btn-sm mt2" onClick={()=>setView('chat')}>¡Ir a pronosticar!</button>
          </div>
        )}

        {results.map(r=>{
          const pts=(r.points_earned||0)+(r.extra_pts||0)
          const exact=r.points_earned>=PHASE_PTS[r.phase]?.exact
          return(
            <div key={r.id} className={`match-row ${pts>0?'match-row-done':''}`} style={{marginBottom:'.4rem'}}>
              <div className="match-teams">
                <span style={{flex:1,textAlign:'right'}}>{f(r.team1)} {es(r.team1)}</span>
                <span className="match-score">{r.real_home}–{r.real_away}</span>
                <span style={{flex:1}}>{es(r.team2)} {f(r.team2)}</span>
              </div>
              <div className="match-pred">
                <span className="text-muted text-xs">Tu pronóstico:</span>
                {r.pred_home!=null?<span className="text-sm font-bold">{r.pred_home}–{r.pred_away}</span>
                  :<span className="text-xs text-muted">Sin pronóstico</span>}
                {r.points_earned>0&&<span className={`pts-badge ${exact?'pts-exact':'pts-win'}`}>+{r.points_earned}pts {exact?'(exacto!)':'(ganador)'}</span>}
                {r.extra_pts>0&&<span className="pts-badge pts-extra">+{r.extra_pts}pt extra</span>}
                {pts===0&&r.pred_home!=null&&<span className="pts-badge pts-miss">Sin puntos</span>}
                <span className="chip chip-ink text-xs">{PHASE_LABELS[r.phase]}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
function AdminPage(){
  const {user,setView}=useApp()
  const [tab,setTab]=React.useState('users')
  if(!user?.isAdmin) return null
  const tabs=[
    {k:'users',l:'👥 Usuarios'},
    {k:'locks',l:'🔒 Fases'},
    {k:'teams',l:'⚽ Equipos'},
    {k:'results',l:'📊 Resultados'},
    {k:'sync',l:'🔄 Sync'},
    {k:'whatsapp',l:'💬 WhatsApp'},
    {k:'config',l:'⚙️ Config'},
  ]
  return(
    <div className="page">
      <Nav/>
      <div className="container pad">
        <h2 style={{fontFamily:'Bebas Neue',fontSize:'1.5rem',marginBottom:'.5rem'}}>⚙️ ADMIN · POLLA 2026</h2>
        <div className="admin-tabs">
          {tabs.map(({k,l})=><button key={k} className={`at ${tab===k?'at-on':''}`} onClick={()=>setTab(k)}>{l}</button>)}
        </div>
        {tab==='users'&&<AdminUsers/>}
        {tab==='locks'&&<AdminLocks/>}
        {tab==='teams'&&<AdminTeams/>}
        {tab==='results'&&<AdminResults/>}
        {tab==='sync'&&<AdminSync/>}
        {tab==='whatsapp'&&<AdminWhatsApp/>}
        {tab==='config'&&<AdminConfig/>}
      </div>
    </div>
  )
}

function AdminUsers(){
  const [users,setUsers]=React.useState([])
  const [loading,setLoading]=React.useState(true)
  const [search,setSearch]=React.useState('')

  React.useEffect(()=>{
    api('/api/admin/users').then(d=>{setUsers(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  async function toggleAvatar(avId,field,val){
    try{
      await api(`/api/admin/avatars/${avId}`,'PUT',{[field]:val})
      setUsers(us=>us.map(u=>({...u,avatars:(u.avatars||[]).map(a=>a.id===avId?{...a,[field==='isPaid'?'is_paid':'is_active']:val}:a)})))
    }catch(e){alert(e.message)}
  }

  async function deleteUser(uid,name){
    if(!confirm(`¿Eliminar a "${name}" y todos sus datos? Esta acción no se puede deshacer.`)) return
    try{
      await api(`/api/admin/users/${uid}`,'DELETE')
      setUsers(us=>us.filter(u=>u.id!==uid))
    }catch(e){alert('Error al eliminar: '+e.message)}
  }

  if(loading) return <Spinner/>
  const filtered=users.filter(u=>!search||u.name?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase()))

  return(
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.75rem'}}>
        <div style={{fontFamily:'Bebas Neue',fontSize:'1rem',color:'var(--ink3)'}}>{users.length} USUARIOS · {users.reduce((s,u)=>s+(u.avatars?.length||0),0)} AVATARES</div>
        <input className="inp" style={{maxWidth:200}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."/>
      </div>
      {filtered.map(u=>(
        <div key={u.id} className="user-row">
          <div className="ua-av" style={{background:generateAvatarColor(u.name||'x')}}>
            {u.picture?<img src={u.picture} style={{width:38,height:38,borderRadius:'50%',objectFit:'cover'}} alt=""/>
              :(u.name||'?').substring(0,2).toUpperCase()}
          </div>
          <div className="ua-info">
            <div className="ua-name">{u.name}</div>
            <div className="ua-email">{u.email}{u.phone&&<>{' · '}<a href={`https://wa.me/${u.phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" style={{color:'#25D366',fontWeight:600,textDecoration:'none'}} title="Abrir WhatsApp">📱 {u.phone}</a></>}</div>
            <div className="ua-avatars">
              {(u.avatars||[]).map(av=>(
                <div key={av.id} style={{background:'var(--cream2)',border:'1px solid var(--border)',borderRadius:6,padding:'3px 8px',fontSize:10}}>
                  <span className="font-bold">{av.nickname}</span>{' '}
                  <span className={`chip ${av.is_paid?'chip-g':'chip-o'}`}>{av.is_paid?'Pagado':'Pendiente'}</span>{' '}
                  <button className={`btn btn-sm ${av.is_paid?'btn-red':'btn-green'}`} style={{padding:'1px 6px',fontSize:9}} onClick={()=>toggleAvatar(av.id,'isPaid',!av.is_paid)}>
                    {av.is_paid?'Desactivar pago':'✓ Confirmar pago'}
                  </button>{' '}
                  <button className={`btn btn-sm btn-outline`} style={{padding:'1px 6px',fontSize:9}} onClick={()=>toggleAvatar(av.id,'isActive',!av.is_active)}>
                    {av.is_active?'🚫 Suspender':'✓ Activar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'4px'}}>
            <div style={{fontSize:10,color:'var(--ink3)'}}>{new Date(u.created_at).toLocaleDateString('es-CO')}</div>
            <button className="btn btn-sm" style={{background:'#fee2e2',color:'#dc2626',border:'1px solid #fca5a5',padding:'2px 8px',fontSize:9,fontWeight:700}} onClick={()=>deleteUser(u.id,u.name)}>🗑 Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function AdminLocks(){
  const [locks,setLocks]=React.useState([])
  const [loading,setLoading]=React.useState(true)

  React.useEffect(()=>{
    api('/api/admin/phase-locks').then(d=>{setLocks(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  async function toggle(phase,val){
    try{
      await api(`/api/admin/phase-locks/${phase}`,'PUT',{isLocked:val})
      setLocks(ls=>ls.map(l=>l.phase===phase?{...l,is_locked:val}:l))
    }catch(e){alert(e.message)}
  }
  async function setHours(phase,h){
    try{
      await api(`/api/admin/phase-locks/${phase}`,'PUT',{isLocked:locks.find(l=>l.phase===phase)?.is_locked,autoLockHours:+h})
      setLocks(ls=>ls.map(l=>l.phase===phase?{...l,auto_lock_hours:+h}:l))
    }catch(e){alert(e.message)}
  }

  async function deleteUser(uid,name){
    if(!confirm(`¿Eliminar a "${name}" y todos sus datos? Esta acción no se puede deshacer.`)) return
    try{
      await api(`/api/admin/users/${uid}`,'DELETE')
      setUsers(us=>us.filter(u=>u.id!==uid))
    }catch(e){alert('Error al eliminar: '+e.message)}
  }

  if(loading) return <Spinner/>
  return(
    <div className="card">
      <div style={{fontWeight:700,fontSize:'12px',marginBottom:'.75rem',color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'.5px'}}>Control de bloqueo por fase</div>
      <div className="alert alert-info text-xs mb2">🔒 Bloquear una fase impide editar todos sus partidos. El auto-lock cierra cada partido individualmente N horas antes del pitazo.</div>
      {locks.map(l=>(
        <div key={l.phase} className="phase-lock-row">
          <div className="pl-info">
            <div className="pl-name">{PHASE_LABELS[l.phase]}</div>
            <div className="pl-meta">Auto-lock:{' '}
              <input type="number" min={0} max={72} value={l.auto_lock_hours||2} onChange={e=>setHours(l.phase,e.target.value)}
                style={{width:45,border:'1px solid var(--border)',borderRadius:4,padding:'1px 4px',fontSize:11}}
              /> h antes del partido
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
            <span className={`chip ${l.is_locked?'chip-r':'chip-g'}`}>{l.is_locked?'🔒 Bloqueado':'🔓 Abierto'}</span>
            <Toggle on={l.is_locked} onChange={v=>toggle(l.phase,v)}/>
          </div>
        </div>
      ))}
    </div>
  )
}

function AdminTeams(){
  const {matches,setMatches}=useApp()
  const [saving,setSaving]=React.useState({})

  const knockoutMatches=(matches||[]).filter(m=>m.phase!=='group')

  async function updateMatch(id,team1,team2){
    setSaving(s=>({...s,[id]:true}))
    try{
      await api(`/api/admin/matches/${id}`,'PUT',{team1,team2})
      setMatches(ms=>ms.map(m=>m.id===id?{...m,team1,team2}:m))
      setSaving(s=>({...s,[id]:false}))
    }catch(e){alert(e.message);setSaving(s=>({...s,[id]:false}))}
  }

  return(
    <div>
      <div className="alert alert-info text-sm mb2">⚽ Asigna los equipos para las fases eliminatorias cuando FIFA confirme los clasificados.</div>
      {Object.entries(PHASE_LABELS).filter(([ph])=>ph!=='group').map(([ph,label])=>{
        const phMs=knockoutMatches.filter(m=>m.phase===ph)
        if(!phMs.length) return null
        return(
          <div key={ph}>
            <div className="phase-header">{label}</div>
            {phMs.map(m=><KnockoutMatchRow key={m.id} match={m} onSave={updateMatch} saving={saving[m.id]}/>)}
          </div>
        )
      })}
    </div>
  )
}

function KnockoutMatchRow({match,onSave,saving}){
  const [t1,setT1]=React.useState(match.team1||'')
  const [t2,setT2]=React.useState(match.team2||'')
  return(
    <div className="card-sm mb1">
      <div style={{fontSize:'10px',color:'var(--ink3)',marginBottom:'.5rem'}}>{match.label} · {formatDateShort(match.match_date)} · {match.venue}</div>
      <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
        <select className="inp" style={{flex:1}} value={t1} onChange={e=>setT1(e.target.value)}>
          <option value="">— Local —</option>
          {ALL_TEAMS.map(t=><option key={t} value={t}>{f(t)} {es(t)}</option>)}
        </select>
        <span style={{fontFamily:'Bebas Neue',fontSize:'1rem',color:'var(--cream3)'}}>VS</span>
        <select className="inp" style={{flex:1}} value={t2} onChange={e=>setT2(e.target.value)}>
          <option value="">— Visitante —</option>
          {ALL_TEAMS.map(t=><option key={t} value={t}>{f(t)} {es(t)}</option>)}
        </select>
        <button className="btn btn-ink btn-sm" disabled={saving} onClick={()=>onSave(match.id,t1||null,t2||null)}>
          {saving?'...':'💾'}
        </button>
      </div>
    </div>
  )
}

function AdminResults(){
  const {matches}=useApp()
  const [form,setForm]=React.useState({matchId:'',home:'',away:'',hadPen:false,penWinner:'',
    yellow:'',red:'',penCount:'',g1h:'',g2h:'',mvp:'',champWinner:'',surprise:'',
    balonDeOro:'',guanteDeOro:'',botaDeOro:''})
  const [loading,setLoading]=React.useState(false)
  const [msg,setMsg]=React.useState(null)
  const upd=k=>e=>setForm(p=>({...p,[k]:e.type==='checkbox'?e.target.checked:e.target.value}))

  const selectedMatch=(matches||[]).find(m=>+m.id===+form.matchId)

  async function submit(e){
    e.preventDefault(); setLoading(true); setMsg(null)
    try{
      const data=await api('/api/admin/results','POST',{
        matchId:+form.matchId,home:+form.home,away:+form.away,
        hadPenalties:form.hadPen,penaltyWinner:form.penWinner||null,
        yellowCards:form.yellow?+form.yellow:null,redCards:form.red?+form.red:null,
        penaltiesCount:form.penCount?+form.penCount:null,
        goalsFirstHalf:form.g1h?+form.g1h:null,goalsSecondHalf:form.g2h?+form.g2h:null,
        mvpPlayer:form.mvp||null,championWinner:form.champWinner||null,
        surpriseTeamReached:form.surprise||null,balonDeOro:form.balonDeOro||null,
        guanteDeOro:form.guanteDeOro||null,botaDeOro:form.botaDeOro||null
      })
      setMsg({type:'success',text:`✅ Resultado guardado · ${data.updated} pronósticos actualizados · ${data.extraUpdated} extras`})
    }catch(e){setMsg({type:'error',text:e.message})}
    setLoading(false)
  }

  const playedMatches=(matches||[]).filter(m=>m.r_home!=null)
  const pendingMatches=(matches||[]).filter(m=>m.r_home==null&&(m.team1||m.label))

  return(
    <div>
      {msg&&<Alert type={msg.type}>{msg.text}</Alert>}
      <div className="card">
        <div style={{fontWeight:700,fontSize:'12px',marginBottom:'.75rem',color:'var(--ink3)',textTransform:'uppercase'}}>Ingresar resultado</div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Partido</label>
            <select className="inp" value={form.matchId} onChange={upd('matchId')} required>
              <option value="">— Selecciona partido —</option>
              <optgroup label="Pendientes">
                {pendingMatches.map(m=><option key={m.id} value={m.id}>#{m.match_num} · {teamDisp(m.team1)} vs {teamDisp(m.team2)} {m.label&&'·'+m.label}</option>)}
              </optgroup>
              <optgroup label="Ya ingresados">
                {playedMatches.map(m=><option key={m.id} value={m.id}>#{m.match_num} · {teamDisp(m.team1)} vs {teamDisp(m.team2)} ({m.r_home}-{m.r_away})</option>)}
              </optgroup>
            </select>
          </div>
          {selectedMatch&&(
            <div style={{background:'var(--cream2)',borderRadius:8,padding:'8px 10px',marginBottom:'.75rem',fontSize:'12px'}}>
              {f(selectedMatch.team1)} {es(selectedMatch.team1)} vs {es(selectedMatch.team2)} {f(selectedMatch.team2)} · {formatDateShort(selectedMatch.match_date)}
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.65rem'}}>
            <div className="form-group"><label>Goles local</label><input className="inp" type="number" min="0" value={form.home} onChange={upd('home')} required/></div>
            <div className="form-group"><label>Goles visitante</label><input className="inp" type="number" min="0" value={form.away} onChange={upd('away')} required/></div>
          </div>
          <div className="check-row">
            <div className={`chk ${form.hadPen?'chk-on':''}`} onClick={()=>setForm(p=>({...p,hadPen:!p.hadPen}))}>
              {form.hadPen&&'✓'}
            </div>
            <span>¿Hubo definición por penales?</span>
          </div>
          {form.hadPen&&(
            <div className="form-group mt1">
              <label>Ganador en penales</label>
              <select className="inp" value={form.penWinner} onChange={upd('penWinner')}>
                <option value="">— Selecciona —</option>
                {selectedMatch&&[selectedMatch.team1,selectedMatch.team2].filter(Boolean).map(t=>(
                  <option key={t} value={t}>{f(t)} {es(t)}</option>
                ))}
              </select>
            </div>
          )}
          <div className="divider"/>
          <div style={{fontWeight:700,fontSize:'10px',color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'.5rem'}}>Extra Points</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.5rem',marginBottom:'.6rem'}}>
            {[
              {k:'yellow',l:'🟨 Amarillas'},{k:'red',l:'🟥 Rojas'},
              {k:'penCount',l:'⚡ Penales'},{k:'g1h',l:'⚽ Goles 1T'},{k:'g2h',l:'⚽ Goles 2T'},
            ].map(({k,l})=>(
              <div key={k} className="form-group" style={{marginBottom:0}}>
                <label style={{fontSize:'9px'}}>{l}</label>
                <input className="inp" type="number" min="0" value={form[k]} onChange={upd(k)}/>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label>🏅 MVP del partido</label>
            <input className="inp" value={form.mvp} onChange={upd('mvp')} placeholder="Nombre del jugador..."/>
          </div>

          {selectedMatch?.phase==='final'&&(
            <>
              <div className="divider"/>
              <div style={{fontWeight:700,fontSize:'10px',color:'var(--gold)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'.5rem'}}>🏆 Premios Finales</div>
              <div className="form-group"><label>⭐ Balón de Oro</label><input className="inp" value={form.balonDeOro} onChange={upd('balonDeOro')} placeholder="Jugador..."/></div>
              <div className="form-group"><label>🧤 Guante de Oro</label><input className="inp" value={form.guanteDeOro} onChange={upd('guanteDeOro')} placeholder="Portero..."/></div>
              <div className="form-group"><label>👟 Bota de Oro</label><input className="inp" value={form.botaDeOro} onChange={upd('botaDeOro')} placeholder="Goleador..."/></div>
              <div className="form-group"><label>😲 Equipo sorpresa que llegó más lejos</label>
                <select className="inp" value={form.surprise} onChange={upd('surprise')}>
                  <option value="">— Selecciona —</option>
                  {ALL_TEAMS.map(t=><option key={t} value={t}>{f(t)} {es(t)}</option>)}
                </select>
              </div>
            </>
          )}

          <button className="btn btn-gold btn-full" disabled={loading||!form.matchId}>
            {loading?'Guardando y calculando...':'💾 Guardar resultado y recalcular puntos'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AdminSync(){
  const [loading,setLoading]=React.useState(false)
  const [result,setResult]=React.useState(null)
  async function sync(){
    setLoading(true); setResult(null)
    try{
      const data=await api('/api/admin/sync','POST')
      setResult({type:'success',text:`✅ Sincronizado · ${data.updated} partidos actualizados de ${data.total} revisados`})
    }catch(e){setResult({type:'error',text:e.message})}
    setLoading(false)
  }
  return(
    <div className="card">
      <h3 style={{fontFamily:'Bebas Neue',fontSize:'1rem',marginBottom:'.5rem'}}>🔄 SINCRONIZAR CON football-data.org</h3>
      <div className="alert alert-info text-sm mb2">Conecta tu cuenta gratuita en <strong>football-data.org</strong> y pega la API Key en la variable <code>FOOTBALL_API_KEY</code> en Render. La sincronización solo agrega resultados nuevos, nunca sobreescribe resultados manuales.</div>
      {result&&<Alert type={result.type}>{result.text}</Alert>}
      <button className="btn btn-ink" onClick={sync} disabled={loading}>{loading?'Sincronizando...':'🔄 Sincronizar ahora'}</button>
    </div>
  )
}

function AdminWhatsApp(){
  const [numbers,setNumbers]=React.useState([])
  const [form,setForm]=React.useState({phone:'',name:''})
  const [loading,setLoading]=React.useState(false)

  React.useEffect(()=>{
    api('/api/admin/whatsapp').then(setNumbers).catch(()=>{})
  },[])

  async function add(e){
    e.preventDefault(); setLoading(true)
    try{
      const data=await api('/api/admin/whatsapp','POST',form)
      setNumbers(p=>[...p,data.number])
      setForm({phone:'',name:''})
    }catch(e){alert(e.message)}
    setLoading(false)
  }

  async function remove(id){
    try{ await api(`/api/admin/whatsapp/${id}`,'DELETE'); setNumbers(p=>p.filter(n=>n.id!==id)) }
    catch(e){alert(e.message)}
  }

  return(
    <div>
      <div className="card mb2">
        <div style={{fontWeight:700,fontSize:'12px',marginBottom:'.5rem',color:'var(--ink3)',textTransform:'uppercase'}}>Agregar número</div>
        <div className="alert alert-info text-xs mb1">Asegúrate de tener el sandbox de Twilio WhatsApp configurado y que el número haya enviado el código de activación al +1 415 523 8886.</div>
        <form onSubmit={add}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:'.5rem',alignItems:'flex-end'}}>
            <div className="form-group" style={{marginBottom:0}}><label>Teléfono</label><input className="inp" type="tel" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+57300..." required/></div>
            <div className="form-group" style={{marginBottom:0}}><label>Nombre</label><input className="inp" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Ej: Juan"/></div>
            <button className="btn btn-ink btn-sm" disabled={loading}>+</button>
          </div>
        </form>
      </div>
      <div className="card">
        <div style={{fontWeight:700,fontSize:'12px',marginBottom:'.5rem',color:'var(--ink3)',textTransform:'uppercase'}}>{numbers.length} números activos</div>
        {numbers.map(n=>(
          <div key={n.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
            <div><div style={{fontSize:'12px',fontWeight:600}}>{n.name||n.phone}</div>{n.name&&<div style={{fontSize:'10px',color:'var(--ink3)'}}>{n.phone}</div>}</div>
            <button className="btn btn-red btn-sm" onClick={()=>remove(n.id)}>✕ Quitar</button>
          </div>
        ))}
        {!numbers.length&&<div className="text-muted text-sm text-center" style={{padding:'1rem'}}>Sin números configurados</div>}
      </div>
    </div>
  )
}

const COLOR_PRESETS=[
  {name:'Dorado',hex:'#F6C90E',dark:'#0d1117',label:'⚽ Clásico'},
  {name:'Rojo',hex:'#E53E3E',dark:'#1a0000',label:'🔴 Pasión'},
  {name:'Azul',hex:'#3B82F6',dark:'#0d1a2e',label:'🔵 Élite'},
  {name:'Verde',hex:'#22C55E',dark:'#0d1a10',label:'🟢 Cancha'},
]
function AdminConfig(){
  const {settings,setSettings,tournament,setTournament}=useApp()
  const [form,setForm]=React.useState({})
  const [loading,setLoading]=React.useState(false)
  const [msg,setMsg]=React.useState(null)

  React.useEffect(()=>{
    if(settings) setForm({
      paypal:settings.paypal||'',nequi:settings.nequi||'',
      inscription_fee:settings.inscription_fee??'20',
      currency:settings.currency||'USD',
      predictions_open:settings.predictions_open===true||settings.predictions_open==='true',
      primary_color:settings.primary_color||'#F6C90E',
    })
  },[settings])

  async function save(e){
    e.preventDefault(); setLoading(true); setMsg(null)
    try{
      await api('/api/admin/tournament','PUT',{
        paypalInfo:form.paypal,nequiInfo:form.nequi,
        inscriptionFee:parseFloat(form.inscription_fee)||0,
        currency:form.currency,
        predictions_open:form.predictions_open,
        primary_color:form.primary_color
      })
      // Also update predictions_open via settings route
      await api('/api/settings','PUT',{
        predictions_open:form.predictions_open,
        paypal_info:form.paypal, nequi_info:form.nequi,
        inscription_fee:parseFloat(form.inscription_fee)||0,
        currency:form.currency, primary_color:form.primary_color
      })
      setSettings(s=>({...s,...form}))
      if(tournament) setTournament(t=>({...t,primary_color:form.primary_color,inscription_fee:form.inscription_fee}))
      document.documentElement.style.setProperty('--gold',form.primary_color)
      setMsg({type:'success',text:'✅ Configuración guardada'})
    }catch(e){setMsg({type:'error',text:e.message})}
    setLoading(false)
  }

  const [logoInput,setLogoInput]=React.useState(tournament?.logo_url||'')
  const logoUrl=tournament?.logo_url||'/logo.png'

  async function saveLogo(){
    const url=logoInput.trim()
    if(!url) return
    try{
      await api('/api/admin/tournament','PUT',{logoUrl:url})
      setTournament(t=>({...t,logo_url:url}))
      setMsg({type:'success',text:'✅ Logo actualizado'})
    }catch(e){setMsg({type:'error',text:'Error: '+e.message})}
  }

  return(
    <div className="card">
      {msg&&<Alert type={msg.type}>{msg.text}</Alert>}

      {/* LOGO */}
      <div className="form-group">
        <label style={{fontWeight:700,marginBottom:'.5rem',display:'block'}}>🖼️ Logo de tu Polla</label>
        <div style={{display:'flex',alignItems:'flex-start',gap:'1rem',flexWrap:'wrap',marginBottom:'.5rem'}}>
          <img src={logoUrl} alt="Logo" onError={e=>e.target.src='/logo.png'}
            style={{width:72,height:72,objectFit:'contain',background:'var(--cream2)',borderRadius:'var(--r)',border:'1px solid var(--border)',padding:4,flexShrink:0}}/>
          <div style={{flex:1,minWidth:200}}>
            <input className="inp" value={logoInput} onChange={e=>setLogoInput(e.target.value)}
              placeholder="https://drive.google.com/..." style={{marginBottom:'.4rem'}}/>
            <button className="btn btn-outline btn-sm" onClick={saveLogo}>💾 Guardar logo</button>
          </div>
        </div>
        <div className="text-muted text-xs" style={{lineHeight:1.6}}>
          📌 <strong>Cómo obtener el link de Google Drive:</strong><br/>
          1. Sube tu logo a Google Drive → clic derecho → "Compartir" → "Cualquier persona con el link"<br/>
          2. Copia el link, extrae el ID (la parte entre <code>/d/</code> y <code>/view</code>)<br/>
          3. Usa este formato: <code>https://drive.google.com/uc?id=TU_ID</code><br/>
          Si no tienes logo, dejamos el nuestro 🏆
        </div>
      </div>

      <div style={{height:1,background:'var(--border)',margin:'1rem 0'}}/>

      {/* COLOR */}
      <div className="form-group">
        <label style={{fontWeight:700,marginBottom:'.75rem',display:'block'}}>🎨 Color principal</label>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'.5rem'}}>
          {COLOR_PRESETS.map(c=>(
            <div key={c.hex} onClick={()=>setForm(p=>({...p,primary_color:c.hex}))}
              style={{border:`2px solid ${form.primary_color===c.hex?c.hex:'var(--border)'}`,
                borderRadius:8,padding:'.6rem .4rem',textAlign:'center',cursor:'pointer',
                background:form.primary_color===c.hex?c.hex+'18':'var(--cream2)',transition:'all .15s'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:c.hex,margin:'0 auto .4rem',
                boxShadow:form.primary_color===c.hex?`0 0 12px ${c.hex}80`:undefined}}/>
              <div style={{fontSize:9,fontWeight:700,color:form.primary_color===c.hex?c.hex:'var(--ink3)'}}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{height:1,background:'var(--border)',margin:'1rem 0'}}/>

      <form onSubmit={save}>
        {/* Inscripción */}
        <div className="form-group">
          <label style={{fontWeight:700}}>💰 Inscripción por participante</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'.5rem',marginTop:'.35rem',alignItems:'center'}}>
            <input className="inp" type="number" min="0" step="0.01" value={form.inscription_fee??''} 
              onChange={e=>setForm(p=>({...p,inscription_fee:e.target.value}))} placeholder="0"/>
            <select className="inp" style={{width:'auto'}} value={form.currency||'USD'} onChange={e=>setForm(p=>({...p,currency:e.target.value}))}>
              <option value="USD">USD</option><option value="COP">COP</option><option value="MXN">MXN</option>
              <option value="ARS">ARS</option><option value="PEN">PEN</option>
            </select>
          </div>
          <div className="text-muted text-xs mt1">Pon 0 si tu polla es gratis — solo por el honor ⚽</div>
        </div>

        {/* Pagos */}
        {parseFloat(form.inscription_fee)>0&&(
          <div style={{background:'var(--cream2)',borderRadius:8,padding:'1rem',marginBottom:'1rem'}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:'.5rem'}}>📬 Métodos de pago para tus participantes</div>
            <div className="form-group"><label>💙 PayPal / correo</label><input className="inp" value={form.paypal||''} onChange={e=>setForm(p=>({...p,paypal:e.target.value}))} placeholder="tu@paypal.com"/></div>
            <div className="form-group" style={{marginBottom:0}}><label>📱 Nequi / Daviplata / número</label><input className="inp" value={form.nequi||''} onChange={e=>setForm(p=>({...p,nequi:e.target.value}))} placeholder="300-000-0000"/></div>
          </div>
        )}

        {/* Pronósticos */}
        <div className="form-group">
          <label>🔓 Pronósticos</label>
          <div style={{display:'flex',alignItems:'center',gap:'.75rem',marginTop:'.25rem'}}>
            <Toggle on={form.predictions_open} onChange={v=>setForm(p=>({...p,predictions_open:v}))}/>
            <span className="text-sm">{form.predictions_open?'✅ Abiertos — participantes pueden ingresar marcadores':'🔒 Cerrados — solo el admin puede abrir'}</span>
          </div>
        </div>

        <button className="btn btn-gold btn-full" disabled={loading}>{loading?'Guardando...':'💾 Guardar configuración'}</button>
      </form>
    </div>
  )
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
function AppRoot(){
  const [view,setView]=React.useState('landing')
  const [user,setUser]=React.useState(null)
  const [avatars,setAvatars]=React.useState([])
  const [activeAvatar,setActiveAvatar]=React.useState(null)
  const [matches,setMatches]=React.useState([])
  const [settings,setSettings]=React.useState({})

  const [tournament,setTournament]=React.useState(null)

  // Load tournament config FIRST, then init everything else
  React.useEffect(()=>{
    async function init(){
      // Step 1: load tournament (required for all subsequent calls)
      if(TOURNAMENT_SLUG){
        try{
          const r=await fetch(`/api/tournaments/${TOURNAMENT_SLUG}`)
          const t=await r.json()
          if(t.id){
            window.__TOURNAMENT_ID__=t.id
            setTournament(t)
            setSettings({
              predictions_open:t.predictions_open,
              inscription_fee:t.inscription_fee,
              currency:t.currency,
              paypal:t.paypal_info||'',
              nequi:t.nequi_info||'',
              primary_color:t.primary_color||'#F6C90E',
            })
            if(t.primary_color&&t.primary_color!=='#F6C90E')
              document.documentElement.style.setProperty('--gold',t.primary_color)
            document.title=t.name+' · La Polla IA'
          } else {
            setView('not_found')
            return
          }
        }catch(e){ setView('not_found'); return }
      }
      // Step 2: load matches (global, no tournament needed)
      api('/api/matches').then(setMatches).catch(()=>{})
      // Step 3: auto-login from stored token
      const token=getToken()
      if(token){
        api('/api/me').then(({user:u,avatars:avs})=>{
          setUser(u); setAvatars(avs||[])
          if(avs&&avs.length>0){
            const first=avs.find(a=>a.is_paid&&a.is_active)||avs[0]
            setActiveAvatar(first)
          }
          if(!u.termsAccepted) setView('terms')
          else if(!avs||!avs.length) setView('avatars')
          else setView('dashboard')
        }).catch(()=>{ localStorage.removeItem('polla_token') })
      }
    }
    init()
  },[])

  React.useEffect(()=>{
    if(avatars.length&&!activeAvatar){
      const first=avatars.find(a=>a.is_paid&&a.is_active)||avatars[0]
      setActiveAvatar(first)
    }
  },[avatars])

  function logout(){
    localStorage.removeItem('polla_token')
    setUser(null); setAvatars([]); setActiveAvatar(null)
    setView('landing')
  }

  const ctx={view,setView,user,setUser,avatars,setAvatars,activeAvatar,setActiveAvatar,
    matches,setMatches,settings,setSettings,logout,tournament,setTournament}

  // Animated chat bounce keyframes
  const bounceStyle=`.bounce-dot{width:6px;height:6px;border-radius:50%;background:var(--ink3);}
@keyframes bounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}`

  return(
    <AppCtx.Provider value={ctx}>
      <style>{bounceStyle+`
        [class*="bounce"]{animation:bounce .9s infinite;}
        .bounce-1{animation-delay:.15s!important;}
        .bounce-2{animation-delay:.3s!important;}
      `}</style>

      {view==='landing'&&<LandingPage/>}

      {/* Auth views — wrap in page shell */}
      {view==='auth'&&(user?<>{setView('dashboard')&&null}</>:<AuthPage/>)}

      {/* Modals over landing */}
      {view==='terms'&&<><LandingPage/><TermsPage/></>}
      {view==='guide'&&<><LandingPage/><GuidePage/></>}

      {/* Authenticated views */}
      {view==='avatars'&&<AvatarsPage/>}
      {view==='special'&&<SpecialPredictionsPage/>}
      {view==='dashboard'&&<DashboardPage/>}
      {view==='chat'&&<ChatPage/>}
      {view==='pele_chat'&&<PeleFreeChatPage/>}
      {view==='board'&&<BoardPage/>}
      {view==='ranking'&&<RankingPage/>}
      {view==='results'&&<ResultsPage/>}
      {view==='not_found'&&(
        <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
          background:'var(--ink)',flexDirection:'column',gap:'1rem',textAlign:'center',padding:'2rem'}}>
          <img src="/logo.png" style={{width:80,opacity:.4}}/>
          <div style={{fontFamily:'Bebas Neue',fontSize:'2rem',color:'var(--gold)',letterSpacing:2}}>Polla no encontrada</div>
          <div style={{color:'rgba(255,255,255,.4)',fontSize:14}}>Esta polla no existe o aún no ha sido activada.</div>
          <a href="/" style={{color:'var(--gold)',fontSize:13,marginTop:'.5rem'}}>← Crear una Polla IA</a>
        </div>
      )}
      {view==='admin'&&<AdminPage/>}
    </AppCtx.Provider>
  )
}

// ─── MOUNT ────────────────────────────────────────────────────────────────────
const rootEl=document.getElementById('root')
const root=ReactDOM.createRoot(rootEl)
root.render(React.createElement(AppRoot))
