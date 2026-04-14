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
  const tName=tournament?.name||'POLLA'
  // Truncate tournament name on mobile-ish sizes
  const shortName=tName.length>14?tName.substring(0,13)+'…':tName
  return(
    <nav className="nav">
      <div style={{cursor:'pointer',display:'flex',alignItems:'center',gap:'7px',minWidth:0,flex:1,overflow:'hidden'}} onClick={()=>setView(user?'dashboard':'landing')}>
        <img src={tournament?.logo_url||"/logo.png"} alt={tName} style={{height:'36px',width:'36px',objectFit:'contain',flexShrink:0}}/>
        <div style={{minWidth:0,overflow:'hidden'}}>
          <div className="nav-logo" style={{lineHeight:1,fontSize:tName.length>14?'.9rem':tName.length>10?'1rem':'inherit',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            {shortName} <span style={{color:'var(--gold)'}}>2026</span>
          </div>
          <div className="nav-sub">{tournament?.is_demo?'⚡ Demo':'Pronósticos · Mundial 2026'}</div>
        </div>
      </div>
      <div className="nav-actions" style={{flexShrink:0,flexWrap:'nowrap'}}>
        {user&&view!=='dashboard'&&(
          <button className="btn btn-outline btn-sm" onClick={()=>setView('dashboard')}>← Inicio</button>
        )}
        {user&&view==='dashboard'&&(
          <button className="btn btn-outline btn-sm" onClick={()=>setView('ranking')}>🏅</button>
        )}
        {user&&(
          <>
            {user.isAdmin&&<button className="btn btn-red btn-sm" onClick={()=>setView('admin')}>⚙️</button>}
            <button className="btn btn-outline btn-sm" onClick={logout}>Salir</button>
          </>
        )}
        {!user&&(
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
      {tournament?.is_demo&&(
        <div style={{background:'linear-gradient(135deg,#0f2310,#112011)',borderBottom:'2px solid rgba(34,197,94,.3)',
          padding:'10px 1.25rem',display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap',zIndex:5,position:'relative'}}>
          <span style={{fontSize:'1.3rem'}}>⚡</span>
          <div style={{flex:1,minWidth:180}}>
            <div style={{fontWeight:700,color:'#4ade80',fontSize:'13px',lineHeight:1.3}}>Modo Demo — Todo dura 24 horas</div>
            <div style={{fontSize:'11px',color:'rgba(74,222,128,.6)',marginTop:'2px'}}>
              Lo que ingreses aquí se borra automáticamente. Es para explorar sin compromiso.
            </div>
          </div>
          <a href="/" style={{background:'#16a34a',color:'#fff',textDecoration:'none',fontWeight:700,fontSize:'11px',
            padding:'6px 12px',borderRadius:'6px',whiteSpace:'nowrap',boxShadow:'0 0 12px rgba(22,163,74,.4)'}}>🏆 Crear mi Polla Real ($3.99)</a>
        </div>
      )}
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
  const [tab,setTab]=React.useState('login')
  const [form,setForm]=React.useState({name:'',email:'',password:''})
  const [loading,setLoading]=React.useState(false)
  const [err,setErr]=React.useState('')
  const [captchaQ,setCaptchaQ]=React.useState(()=>{const a=Math.floor(Math.random()*9)+1,b=Math.floor(Math.random()*9)+1;return{a,b,ans:a+b}})
  const [captchaVal,setCaptchaVal]=React.useState('')

  React.useEffect(()=>{
    if(tab==='register'){
      const a=Math.floor(Math.random()*9)+1,b=Math.floor(Math.random()*9)+1
      setCaptchaQ({a,b,ans:a+b}); setCaptchaVal('')
    }
  },[tab])

  const upd=k=>e=>setForm(p=>({...p,[k]:e.target.value}))

  async function handleLogin(e){
    e.preventDefault(); setLoading(true); setErr('')
    try{
      const data=await api('/api/auth/login','POST',{email:form.email,password:form.password,tournamentId:window.__TOURNAMENT_ID__||''})
      localStorage.setItem('polla_token',data.token)
      setUser(data.user); setAvatars(data.avatars||[])
      if(data.user.isAdmin) setView('admin')
      else if(!data.user.termsAccepted) setView('terms')
      else setView('dashboard')
    }catch(e){setErr(e.message)}
    setLoading(false)
  }

  async function handleRegister(e){
    e.preventDefault(); setErr('')
    if(parseInt(captchaVal)!==captchaQ.ans){
      setErr(`La respuesta al captcha es incorrecta. ¿Cuánto es ${captchaQ.a} + ${captchaQ.b}?`)
      const a=Math.floor(Math.random()*9)+1,b=Math.floor(Math.random()*9)+1
      setCaptchaQ({a,b,ans:a+b}); setCaptchaVal('')
      return
    }
    setLoading(true)
    try{
      const data=await api('/api/auth/register','POST',{name:form.name,email:form.email,password:form.password,tournamentId:window.__TOURNAMENT_ID__||''})
      localStorage.setItem('polla_token',data.token)
      setUser(data.user); setAvatars(data.avatars||[])
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
            <p className="text-muted text-sm">{tournament?.is_demo?'⚡ Demo gratuita — explora sin límites':'Regístrate y participa en la polla'}</p>
          </div>

          {err&&<Alert type="error">{err}</Alert>}

          {tab!=='admin'&&(
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
                  <div className="form-group">
                    <label>Verificación — ¿Cuánto es {captchaQ.a} + {captchaQ.b}?</label>
                    <input className="inp" type="number" placeholder="Respuesta" value={captchaVal} onChange={e=>setCaptchaVal(e.target.value)} required style={{maxWidth:120}}/>
                  </div>
                  <button className="btn btn-gold btn-full" disabled={loading}>{loading?'Creando cuenta...':'Crear cuenta →'}</button>
                </form>
              )}

              <div style={{textAlign:'center',marginTop:'1.25rem',fontSize:'11px',color:'var(--ink3)'}}>
                ¿Eres admin? Ingresa con tu correo y contraseña normalmente.
              </div>
            </>
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
      setView('chat')
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
            <strong style={{color:'var(--ink)',display:'block',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.5px',margin:'8px 0 3px'}}>1. Naturaleza del Servicio</strong>
            La Polla IA es una plataforma de entretenimiento y pronósticos deportivos. <strong>No es una plataforma de apuestas ni de juegos de azar.</strong> No se gestionan ni distribuyen premios económicos a través de esta plataforma.
            <strong style={{color:'var(--ink)',display:'block',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.5px',margin:'8px 0 3px'}}>2. Registro y Participación</strong>
            Al registrarte obtienes acceso a la plataforma. El administrador de la polla aprueba quién participa según las normas de su grupo. La participación es de carácter recreativo y social.
            <strong style={{color:'var(--ink)',display:'block',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.5px',margin:'8px 0 3px'}}>3. Pronósticos y Edición</strong>
            Puedes editar tus marcadores hasta 2 horas antes de cada partido. El administrador puede cerrar fases manualmente. El sistema guarda automáticamente. No se aceptan reclamos por pronósticos no guardados.
            <strong style={{color:'var(--ink)',display:'block',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.5px',margin:'8px 0 3px'}}>4. Sistema de Puntos</strong>
            Marcador exacto: 3-10 pts según fase. Ganador correcto: 2-5 pts. Extra Points (tarjetas, goles, MVP): +1 pt si aciertas al menos uno. Predicciones especiales: Campeón +10, Sorpresa +3, Balón/Guante/Bota de Oro +5 c/u. Pronóstico General: +100 pts si aciertas el path completo sin editar, +10 pts si editas y aciertas.
            <strong style={{color:'var(--ink)',display:'block',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.5px',margin:'8px 0 3px'}}>5. Conducta</strong>
            Queda prohibido utilizar la plataforma para apuestas, captación de dinero o cualquier actividad económica entre participantes. El uso es exclusivamente recreativo.
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
            <span><strong>He leído y acepto los Términos y Condiciones</strong> de La Polla IA</span>
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
  const {setView}=useApp()
  const steps=[
    {n:1,icon:'💬',title:'Llena tus pronósticos — tú o con IA',
      desc:'Pelé IA te pregunta si quieres que llene toda tu polla automáticamente, un grupo específico, o hacerlo tú partido por partido con su ayuda. Puedes editar hasta 2 horas antes de cada partido.',
      badges:['🤖 Auto-fill IA','✍️ Manual con ayuda','Guardado automático']},
    {n:2,icon:'🏆',title:'Mi Pronóstico General — hasta 100 pts',
      desc:'Define el camino al título: quién avanza en cada fase hasta el campeón. Pelé IA puede generarlo por ti. Si aciertas sin editar: +100 pts. Si editas y aciertas: +10 pts. ¡Descárgalo como imagen!',
      badges:['🏆 100 pts sin editar','✏️ 10 pts si editas','📸 Exportar PNG']},
    {n:3,icon:'⭐',title:'Extra Points — puntos adicionales',
      desc:'Después de cada marcador, predice campos extra: tarjetas, goles por tiempo, MVP. Si aciertas al menos uno, ganas +1 punto extra.',
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
    {n:6,icon:'🏅',title:'Ranking en tiempo real',
      desc:'El ranking se actualiza automáticamente después de cada partido. ¡Compite por el primer lugar con tu grupo de amigos o familia!',
      badges:['🥇 Primer lugar','🥈 Segundo lugar','🥉 Tercer lugar']},
  ]
  return(
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-head">
          <div className="modal-title">🏆 CÓMO FUNCIONA LA POLLA 2026</div>
          <button className="btn btn-outline btn-sm" onClick={()=>setView('special')}>
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
          <button className="btn btn-ink" onClick={()=>setView('special')}>
            ¡Entendido! Hablar con Pelé IA →
          </button>
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
function TriviaSection(){
  const {activeAvatar,user}=useApp()
  const [questions,setQuestions]=React.useState([])
  const [bonus,setBonus]=React.useState(null)
  const [answers,setAnswers]=React.useState({}) // triviaId -> {isCorrect,points_earned,correct_answer,selected}
  const [loading,setLoading]=React.useState(true)

  const DIFF_LABELS={easy:'🟢 Fácil',medium:'🟡 Refácil',hard:'🔴 Muy fácil'}
  const DIFF_COLORS={easy:'#16a34a',medium:'#d97706',hard:'#dc2626'}
  const DIFF_PTS={easy:2,medium:3,hard:4}

  React.useEffect(()=>{
    if(!activeAvatar?.id) return
    Promise.all([
      api('/api/trivia/'+activeAvatar.id).catch(()=>[]),
      api('/api/bonus/'+activeAvatar.id).catch(()=>null)
    ]).then(([qs,b])=>{
      setQuestions(Array.isArray(qs)?qs:[])
      setBonus(b)
      setLoading(false)
    })
  },[activeAvatar])

  async function submitAnswer(triviaId,answerIdx){
    try{
      const d=await api('/api/trivia/'+triviaId+'/answer','POST',{avatarId:activeAvatar.id,answerIdx})
      setAnswers(p=>({...p,[triviaId]:{...d,selected:answerIdx}}))
    }catch(e){ alert(e.message) }
  }

  if(loading||(!bonus&&questions.length===0)) return null

  return(
    <div style={{marginTop:'1.25rem'}}>
      {/* Registration bonus chip */}
      {bonus&&(
        <div style={{background:'linear-gradient(135deg,rgba(246,201,14,.12),rgba(246,201,14,.04))',
          border:'1.5px solid rgba(246,201,14,.3)',borderRadius:'var(--r)',padding:'10px 14px',
          display:'flex',alignItems:'center',gap:'10px',marginBottom:'0.75rem'}}>
          <div style={{fontSize:'1.5rem'}}>🎁</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,color:'var(--ink)'}}>¡Bienvenido! Bonus de registro</div>
            <div style={{fontSize:11,color:'var(--ink3)',marginTop:2}}>Ya tienes <strong style={{color:'var(--gold)'}}>{bonus.points} puntos</strong> por unirte a la polla. ¡A ganar más!</div>
          </div>
          <div style={{fontFamily:'Bebas Neue',fontSize:'1.4rem',color:'var(--gold)'}}>+{bonus.points}</div>
        </div>
      )}

      {/* Trivia questions */}
      {questions.length>0&&(
        <>
          <div style={{fontFamily:'Bebas Neue',fontSize:'1rem',letterSpacing:1,color:'var(--ink)',marginBottom:'0.5rem'}}>
            🧠 EXTRA POINTS — {questions.length} pregunta{questions.length!==1?'s':''} disponible{questions.length!==1?'s':''}
          </div>
          {questions.map(q=>{
            const ans=answers[q.id]
            const opts=typeof q.options==='string'?JSON.parse(q.options):q.options
            return(
              <div key={q.id} className="card" style={{marginBottom:'0.75rem',border:'1.5px solid '+(ans?'rgba(255,255,255,.08)':'rgba(246,201,14,.25)'),transition:'all .3s'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'0.6rem'}}>
                  <span style={{fontSize:10,fontWeight:700,color:DIFF_COLORS[q.difficulty],background:DIFF_COLORS[q.difficulty]+'15',border:'1px solid '+DIFF_COLORS[q.difficulty]+'30',borderRadius:20,padding:'2px 8px'}}>
                    {DIFF_LABELS[q.difficulty]} · +{q.points} pts
                  </span>
                  {ans&&(
                    <span style={{fontSize:10,fontWeight:700,color:ans.isCorrect?'#16a34a':'#dc2626',background:ans.isCorrect?'rgba(22,163,74,.1)':'rgba(220,38,38,.1)',border:'1px solid '+(ans.isCorrect?'rgba(22,163,74,.3)':'rgba(220,38,38,.3)'),borderRadius:20,padding:'2px 8px'}}>
                      {ans.isCorrect?'✅ +'+ans.points_earned+' pts':'❌ Respuesta incorrecta'}
                    </span>
                  )}
                </div>
                <div style={{fontWeight:700,fontSize:13,color:'var(--ink)',marginBottom:'0.75rem',lineHeight:1.5}}>{q.question}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  {opts.map((opt,i)=>{
                    const isSelected=ans?.selected===i
                    const isCorrect=ans&&i===ans.correct_answer
                    const isWrong=ans&&isSelected&&!isCorrect
                    let bg='var(--cream2)', border='var(--border)', color='var(--ink)', fw=400
                    if(isCorrect&&ans){bg='rgba(22,163,74,.1)';border='rgba(22,163,74,.4)';color='#16a34a';fw=700}
                    else if(isWrong){bg='rgba(220,38,38,.08)';border='rgba(220,38,38,.3)';color='#dc2626'}
                    else if(!ans){bg='var(--cream2)';border='var(--border)'}
                    return(
                      <button key={i} onClick={()=>!ans&&submitAnswer(q.id,i)}
                        disabled={!!ans}
                        style={{background:bg,border:'1px solid '+border,borderRadius:8,padding:'8px 10px',
                          textAlign:'left',cursor:ans?'default':'pointer',transition:'all .15s',
                          fontSize:12,color,fontWeight:fw,lineHeight:1.4,fontFamily:'inherit',
                          outline:'none'}}>
                        <span style={{fontWeight:700,marginRight:4}}>{['A','B','C','D'][i]}.</span>{opt}
                        {isCorrect&&ans?' ✅':''}{isWrong?' ❌':''}
                      </button>
                    )
                  })}
                </div>
                {!ans&&(
                  <div style={{fontSize:10,color:'var(--ink3)',marginTop:6,textAlign:'center'}}>Solo tienes una oportunidad de responder — ¡piensálo bien!</div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}


function DashboardPage(){
  const {user,setView,tournament}=useApp()
  const [stats,setStats]=React.useState(null)

  React.useEffect(()=>{
    if(!user) return
    api(`/api/results/user/${user.id}`).then(rows=>{
      const arr=Array.isArray(rows)?rows:[]
      const total=arr.reduce((s,r)=>(r.points_earned||0)+(r.extra_pts||0)+s,0)
      setStats({total,played:arr.length})
    }).catch(()=>{ setStats({total:0,played:0}) })
  },[user])

  return(
    <div className="page">
      <Nav/>
      <div className="container pad">
        <div style={{marginBottom:'1rem'}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:'1.6rem',color:'var(--ink)'}}>
            Hola, {user?.name?.split(' ')[0]}! 👋
          </div>
          {tournament?.is_demo&&(
            <div style={{marginTop:'8px',background:'linear-gradient(135deg,#0f2310,#112011)',border:'1.5px solid rgba(34,197,94,.3)',
              borderRadius:'10px',padding:'10px 14px',display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
              <span style={{fontSize:'1.3rem'}}>⚡</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:'#4ade80',fontSize:'12px'}}>Modo Demo — los datos duran 24 horas</div>
                <div style={{fontSize:'10px',color:'rgba(74,222,128,.55)',marginTop:'2px'}}>Todo lo que hagas aquí se borra automáticamente. ¡Anímate y crea tu polla real!</div>
              </div>
              <a href="/" style={{background:'#16a34a',color:'#fff',textDecoration:'none',fontWeight:700,fontSize:'10px',
                padding:'5px 10px',borderRadius:'6px',whiteSpace:'nowrap'}}>Crear Polla Real →</a>
            </div>
          )}
        </div>

        {stats&&(
          <div className="dash-stats">
            <div className="stat-card"><div className={'stat-n'+(stats.total>0?' stat-n-gold':'')}>{stats.total}</div><div className="stat-l">Puntos</div></div>
            <div className="stat-card"><div className="stat-n">{stats.played}</div><div className="stat-l">Jugados</div></div>
            <div className="stat-card"><div className="stat-n">—</div><div className="stat-l">Posición</div></div>
          </div>
        )}

        <div className="action-grid">

          {/* Pronósticos — Verde vibrante */}
          <div className="action-card" onClick={()=>setView('chat')}
            style={{background:'linear-gradient(135deg,#0f4c2a,#16a34a)',border:'none',borderRadius:'18px',boxShadow:'0 6px 20px rgba(22,163,74,.35)'}}>
            <div style={{width:52,height:52,borderRadius:14,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'.75rem',flexShrink:0}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
                <polygon points="10,8 16,12 10,16" fill="#fff" stroke="none"/>
              </svg>
            </div>
            <div style={{fontSize:15,fontWeight:800,color:'#fff',lineHeight:1.2}}>Mis Pronósticos</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.75)',marginTop:4,lineHeight:1.5}}>Ingresa tus marcadores con Pelé IA partido a partido</div>
            <div style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(255,255,255,.2)',borderRadius:20,padding:'3px 10px',fontSize:9,fontWeight:700,color:'#fff',marginTop:6,textTransform:'uppercase',letterSpacing:'.5px'}}>⚽ Pelé IA incluido</div>
          </div>

          {/* Tablero — Azul */}
          <div className="action-card" onClick={()=>setView('board')}
            style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)',border:'none',borderRadius:'18px',boxShadow:'0 6px 20px rgba(37,99,235,.35)'}}>
            <div style={{width:52,height:52,borderRadius:14,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'.75rem',flexShrink:0}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/>
                <rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>
              </svg>
            </div>
            <div style={{fontSize:15,fontWeight:800,color:'#fff',lineHeight:1.2}}>Tablero de Partidos</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.75)',marginTop:4,lineHeight:1.5}}>Revisa y edita tus marcadores en todos los grupos y fases</div>
          </div>

          {/* Resultados — Naranja */}
          <div className="action-card" onClick={()=>setView('results')}
            style={{background:'linear-gradient(135deg,#7c2d12,#ea580c)',border:'none',borderRadius:'18px',boxShadow:'0 6px 20px rgba(234,88,12,.35)'}}>
            <div style={{width:52,height:52,borderRadius:14,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'.75rem',flexShrink:0}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20V10M12 20V4M6 20v-6"/>
                <circle cx="6" cy="11" r="2" fill="#fff"/><circle cx="12" cy="1.5" r="2" fill="#fff"/><circle cx="18" cy="7" r="2" fill="#fff"/>
              </svg>
            </div>
            <div style={{fontSize:15,fontWeight:800,color:'#fff',lineHeight:1.2}}>Mis Resultados</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.75)',marginTop:4,lineHeight:1.5}}>Puntos acumulados, aciertos y estadísticas por partido</div>
          </div>

          {/* Ranking — Fucsia/Rosa */}
          <div className="action-card" onClick={()=>setView('ranking')}
            style={{background:'linear-gradient(135deg,#701a75,#c026d3)',border:'none',borderRadius:'18px',boxShadow:'0 6px 20px rgba(192,38,211,.35)'}}>
            <div style={{width:52,height:52,borderRadius:14,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'.75rem',flexShrink:0}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8M12 21V9"/>
                <path d="M12 9a5 5 0 0 0 5-5H7a5 5 0 0 0 5 5z"/>
                <path d="M5 6H3l1 3M19 6h2l-1 3"/>
              </svg>
            </div>
            <div style={{fontSize:15,fontWeight:800,color:'#fff',lineHeight:1.2}}>Ranking General</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.75)',marginTop:4,lineHeight:1.5}}>Tabla de posiciones en tiempo real de todos los jugadores</div>
          </div>

          {/* Especiales — Amarillo dorado */}
          <div className="action-card" onClick={()=>setView('special')}
            style={{background:'linear-gradient(135deg,#713f12,#ca8a04)',border:'none',borderRadius:'18px',boxShadow:'0 6px 20px rgba(202,138,4,.35)'}}>
            <div style={{width:52,height:52,borderRadius:14,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'.75rem',flexShrink:0}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" stroke="none">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
            </div>
            <div style={{fontSize:15,fontWeight:800,color:'#fff',lineHeight:1.2}}>Predicciones Especiales</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.75)',marginTop:4,lineHeight:1.5}}>Pronostica el campeón, Balón de Oro, Bota de Oro y sorpresa</div>
          </div>

          {/* Bracket — Full width oscuro premium */}
          <div className="action-card" onClick={()=>setView('bracket')}
            style={{gridColumn:'span 2',background:'linear-gradient(135deg,#1A1814,#2d2416)',border:'2px solid var(--gold)',borderRadius:'18px',boxShadow:'0 8px 28px rgba(200,168,75,.2)'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:56,height:56,borderRadius:14,background:'rgba(200,168,75,.15)',border:'1.5px solid rgba(200,168,75,.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C8A84B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2z"/>
                  <path d="M20 9h-2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2z"/>
                  <path d="M12 21h-2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2z"/>
                  <path d="M6 9v3h6v3M18 9v3h-6"/>
                </svg>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:800,color:'var(--gold)',lineHeight:1.2}}>Mi Pronóstico General del Torneo</div>
                <div style={{fontSize:11,color:'rgba(247,244,238,.55)',marginTop:4,lineHeight:1.5}}>Define quién llega a cada ronda y quién es el campeón. ¡Hasta 100 pts extra si aciertas el camino completo!</div>
                <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
                  <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(200,168,75,.2)',border:'1px solid rgba(200,168,75,.4)',borderRadius:20,padding:'2px 10px',fontSize:9,fontWeight:700,color:'var(--gold)',textTransform:'uppercase',letterSpacing:'.4px'}}>+100 pts camino completo</span>
                  <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(200,168,75,.2)',border:'1px solid rgba(200,168,75,.4)',borderRadius:20,padding:'2px 10px',fontSize:9,fontWeight:700,color:'var(--gold)',textTransform:'uppercase',letterSpacing:'.4px'}}>📲 Compartible</span>
                </div>
              </div>
            </div>
        </div>

        {/* Registration bonus + Trivia cards */}
        <TriviaSection/>

        {/* Pelé IA free chat CTA */}
        <div style={{marginTop:'1.25rem',background:'linear-gradient(135deg,#1A1814,#2d2416)',
          border:'2px solid rgba(200,168,75,.4)',borderRadius:'18px',padding:'1rem 1.25rem',
          display:'flex',alignItems:'center',gap:'1rem',cursor:'pointer',
          boxShadow:'0 6px 20px rgba(26,24,20,.15)',transition:'all .2s'}}
          onClick={()=>setView('pele_chat')}>
          <img src="/pele.jpg" alt="Pelé IA"
            style={{width:52,height:52,borderRadius:'50%',objectFit:'cover',objectPosition:'top',
              border:'2px solid var(--gold)',flexShrink:0,boxShadow:'0 0 14px rgba(200,168,75,.4)'}}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'1.1rem',color:'var(--gold)',letterSpacing:1}}>Chat libre con Pelé IA</div>
            <div style={{fontSize:'11px',color:'rgba(247,244,238,.55)',lineHeight:1.5,marginTop:2}}>
              Pregúntale cualquier cosa de fútbol — estadísticas, historial, jugadores, tácticas…
            </div>
          </div>
          <div style={{fontSize:'1.5rem'}}>💬</div>
        </div>

      </div>
    </div>
  </div>
  )
}

// ─── PELÉ IA FREE CHAT (Cualquier pregunta de fútbol) ────────────────────────
function PeleFreeChatPage(){
  const {user,setView}=useApp()
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
        message:txt, avatarName:user?.name?.split(' ')[0]||'campeón',
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
  const {user,activeAvatar,matches,settings,setView,tournament}=useApp()
  const [predictions,setPredictions]=React.useState({})
  const [extras,setExtras]=React.useState({})
  const [chatPhase,setChatPhase]=React.useState('intro') // intro,mode_select,autofill_confirm,group_select,stats,score_input,confirm,extra,group_done
  const [messages,setMessages]=React.useState([])
  const [currentGroupKey,setCurrentGroupKey]=React.useState(null)
  const [currentMatchIdx,setCurrentMatchIdx]=React.useState(0)
  const [inputVal,setInputVal]=React.useState('')
  const [scoreForm,setScoreForm]=React.useState({home:'',away:'',pen:''})
  const [extraForm,setExtraForm]=React.useState({yellow:'',red:'',pen_count:'',g1h:'',g2h:'',mvp:''})
  const [autofilling,setAutofilling]=React.useState(false)
  const [autofillStep,setAutofillStep]=React.useState(0)
  const [loadingMsg,setLoadingMsg]=React.useState(false)
  const [saving,setSaving]=React.useState(false)
  const bottomRef=React.useRef(null)

  const groupMatches=React.useMemo(()=>{
    if(!currentGroupKey||!matches) return []
    return matches.filter(m=>m.phase==='group'&&m.group_name===currentGroupKey)
  },[matches,currentGroupKey])
  const currentMatch=groupMatches[currentMatchIdx]

  const allGroups=['A','B','C','D','E','F','G','H','I','J','K','L']

  // doneCounts: predictions already entered per group
  // availableCounts: unlocked matches per group (for the "done" ✓ check)
  const {doneCounts, availableCounts} = React.useMemo(()=>{
    const now = Date.now()
    const dc={}, ac={}
    allGroups.forEach(g=>{
      const ms=(matches||[]).filter(m=>m.phase==='group'&&m.group_name===g)
      dc[g]=ms.filter(m=>predictions[m.id]!=null).length
      ac[g]=ms.filter(m=>{
        if(!m.match_date) return false
        const lockTime = new Date(m.match_date).getTime() - (m.auto_lock_hours||2)*3600000
        return !m.phase_locked && now < lockTime
      }).length
    })
    return {doneCounts:dc, availableCounts:ac}
  },[matches,predictions])

  // Group is "done" when all available (unlocked) matches have predictions
  const isGroupDone = (g) => availableCounts[g] === 0 || doneCounts[g] >= availableCounts[g]

  const totalDone=Object.values(doneCounts).reduce((s,v)=>s+v,0)
  const totalMatches=(matches||[]).length

  React.useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  // Helper: find groups with pending (unlocked, no prediction) matches
  function getPendingGroups(preds, matchList){
    const now = Date.now()
    const result = []
    allGroups.forEach(g=>{
      const gms = (matchList||[]).filter(m=>m.phase==='group'&&m.group_name===g)
      const hasPending = gms.some(m=>{
        if(!m.match_date) return false
        const lockTime = new Date(m.match_date).getTime() - (m.auto_lock_hours||2)*3600000
        const locked = m.phase_locked || now >= lockTime
        return !locked && !preds[m.id]
      })
      if(hasPending) result.push(g)
    })
    return result
  }

  // Helper: find the group currently in progress (has some done but not all unlocked ones done)
  function getGroupInProgress(preds, matchList){
    const now = Date.now()
    for(const g of allGroups){
      const gms = (matchList||[]).filter(m=>m.phase==='group'&&m.group_name===g)
      const hasDone = gms.some(m=>preds[m.id]!=null)
      const hasPending = gms.some(m=>{
        if(!m.match_date) return false
        const lockTime = new Date(m.match_date).getTime() - (m.auto_lock_hours||2)*3600000
        const locked = m.phase_locked || now >= lockTime
        return !locked && !preds[m.id]
      })
      if(hasDone && hasPending) return g
    }
    return null
  }

  React.useEffect(()=>{
    if(!activeAvatar?.id) return
    api(`/api/predictions/${activeAvatar.id}`).then(data=>{
      const preds = data.predictions||{}
      const exts  = data.extras||{}
      setPredictions(preds)
      setExtras(exts)

      const nombre = activeAvatar?.nickname||user?.name?.split(' ')[0]||'campeón'
      const now = Date.now()

      // Count available (unlocked) matches
      const availableMatches = (matches||[]).filter(m=>{
        if(!m.match_date) return false
        const lockTime = new Date(m.match_date).getTime() - (m.auto_lock_hours||2)*3600000
        return !m.phase_locked && now < lockTime
      })

      // How many available group matches already have predictions
      const availableGroupMatches = availableMatches.filter(m=>m.phase==='group')
      const donePreds = availableGroupMatches.filter(m=>preds[m.id]!=null).length
      const totalAvailable = availableGroupMatches.length

      // Find group in progress
      const inProgress = getGroupInProgress(preds, matches)
      // Find first group with pending matches (not started yet)
      const pendingGroups = getPendingGroups(preds, matches)
      const nextPending = pendingGroups.find(g=>g!==inProgress)

      if(totalAvailable === 0){
        // All available matches are locked — tournament started, no more group predictions
        addPeleMsgs([
          `¡Hola ${nombre}! 👋 Soy **Pelé IA** 🏆`,
          `Todos los partidos disponibles ya están bloqueados por fecha. Puedes ver el tablero general o el ranking. ¡A disfrutar el torneo! 🏆`
        ], 'group_select')
        addMsg('pele','__GROUP_SELECT__','group_select')
      } else if(inProgress){
        // Resume group in progress
        addPeleMsgs([
          `¡Hola de nuevo, ${nombre}! 👋 Soy **Pelé IA** 🏆`,
          `Veo que tienes pronósticos pendientes del **Grupo ${inProgress}**. ¿Continuamos desde donde lo dejaste? 🎯`
        ], 'group_select')
        addMsg('pele','__GROUP_SELECT__','group_select')
        // Auto-resume after brief delay
        setTimeout(()=>{
          setCurrentGroupKey(inProgress)
          setChatPhase('stats')
          const gms = (matches||[]).filter(m=>m.phase==='group'&&m.group_name===inProgress)
          const firstPending = gms.find(m=>{
            const lockTime = new Date(m.match_date).getTime() - (m.auto_lock_hours||2)*3600000
            return !m.phase_locked && now < lockTime && !preds[m.id]
          })
          if(firstPending){
            const idx = gms.indexOf(firstPending)
            setCurrentMatchIdx(idx)
            addMsg('pele',`⚽ Seguimos con el **Grupo ${inProgress}** — partido ${idx+1}/${gms.length}`)
            addMsg('pele','__STATS__','stats')
            addMsg('pele',`¿Cuánto crees que queda este partido? 🤔\n(Dime el marcador o escribe "no sé")`)
            setChatPhase('score_input')
          }
        }, 1200)
      } else if(donePreds > 0){
        // Has some predictions but no group in progress — pick next
        addPeleMsgs([
          `¡Hola de nuevo, ${nombre}! 👋 Soy **Pelé IA** 🏆`,
          ('Llevas **'+donePreds+'** pronósticos ingresados. '+(nextPending?('¿Seguimos con el Grupo '+nextPending+'?'):'¿Cuál grupo quieres hacer ahora?')+' 🎯')
        ], 'group_select')
        addMsg('pele','__GROUP_SELECT__','group_select')
      } else {
        // First time — intro + mode selector
        addPeleMsgs([
          `¡Hola ${nombre}! 👋 Soy **Pelé IA** 🏆 — tu asistente para el torneo de fútbol 2026.`,
          `Antes de empezar... ${JOKES[Math.floor(Math.random()*JOKES.length)]}`,
          `¿Cómo quieres llenar tus pronósticos?`
        ], 'mode_select')
        addMsg('pele','__MODE_SELECT__','mode_select')
      }
    }).catch(()=>{
      const nombre = activeAvatar?.nickname||user?.name?.split(' ')[0]||'campeón'
      addPeleMsgs([
        `¡Hola ${nombre}! 👋 Soy **Pelé IA** 🏆 — tu asistente para el torneo de fútbol 2026.`,
        `¿Cómo quieres llenar tus pronósticos?`
      ], 'mode_select')
      addMsg('pele','__MODE_SELECT__','mode_select')
    })
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

  async function runAutofill(groupFilter=null){
    if(!activeAvatar) return
    setAutofilling(true)
    setAutofillStep(0)
    const now2 = Date.now()
    const pendingCount = (matches||[]).filter(m=>{
      if(!m.match_date) return false
      const lt=new Date(m.match_date).getTime()-(m.auto_lock_hours||2)*3600000
      if(m.phase_locked||now2>=lt) return false
      if(predictions[m.id]!=null) return false
      if(groupFilter&&groupFilter.length===1) return m.phase==='group'&&m.group_name===groupFilter
      return true
    }).length
    const label = groupFilter ? `Grupo ${groupFilter}` : `${pendingCount} partidos disponibles`
    addMsg('pele',`🤖 Analizando y llenando ${label} con mi inteligencia... ⏳ Esto tarda unos segundos.`)
    // Animate through steps while API runs
    // Scale delays to match expected duration (48 group matches ~30s, knockout ~8s per batch)
    const estTime = pendingCount > 20 ? 28000 : pendingCount > 8 ? 16000 : 8000
    const delays=[0, estTime*.1, estTime*.22, estTime*.36, estTime*.52, estTime*.68, estTime*.84].map(Math.round)
    const timers=delays.map((d,i)=>setTimeout(()=>setAutofillStep(i),d))
    try{
      const data = await api('/api/autofill','POST',{avatarId:activeAvatar.id, groupFilter})
      timers.forEach(t=>clearTimeout(t))
      setAutofillStep(7)
      await new Promise(r=>setTimeout(r,900))
      if(data.filled===0){
        addMsg('pele','No encontré partidos disponibles para llenar. Puede que ya estén bloqueados o ya tengan pronóstico. ✅')
      } else {
        if(data.predictions){
          const newPreds={...predictions}
          data.predictions.forEach(p=>{ newPreds[p.matchId]={score_home:p.home,score_away:p.away} })
          setPredictions(newPreds)
        }
        addMsg('pele',`✅ ¡Listo! Llené **${data.filled} partido${data.filled>1?'s':''}** con mi análisis IA. Puedes editar cualquier marcador hasta 2 horas antes de cada partido.`)
        if(data.total > data.filled)
          addMsg('pele',`ℹ️ ${data.total-data.filled} partido${data.total-data.filled>1?'s':''} ya estaban bloqueados o con pronóstico previo.`)
        addMsg('pele','¿Quieres revisar algún marcador, o ir al tablero para verlos todos? 🏆')
      }
      setChatPhase('group_select')
      addMsg('pele','__GROUP_SELECT__','group_select')
    }catch(e){ timers.forEach(t=>clearTimeout(t)); addMsg('pele','❌ Error en el auto-fill: '+e.message) }
    setAutofilling(false)
    setAutofillStep(0)
  }

  async function handleUserSend(text){
    if(!text.trim()) return
    addMsg('user',text)
    setInputVal('')

    if(chatPhase==='mode_select'){
      const t=text.toLowerCase()
      if(t.includes('todo')||t.includes('toda')||t.includes('auto')||t.includes('llena')||t.includes('completo')){
        addMsg('pele','¡Perfecto! Voy a analizar todos los partidos disponibles y llenar tu polla completa con mi IA. 🤖⚽')
        await runAutofill(null)
      } else if(t.includes('grupo')||t.includes('group')){
        addMsg('pele','¿De qué grupo quieres que llene los pronósticos? Dime la letra (A-L) 👇')
        setChatPhase('autofill_group')
      } else if(t.includes('manual')||t.includes('yo')||t.includes('personalmente')||t.includes('ayuda')||t.includes('partido')){
        addMsg('pele','¡Genial! Te guío partido por partido con estadísticas reales. ¿Por qué grupo empezamos? 🎯')
        addMsg('pele','__GROUP_SELECT__','group_select')
        setChatPhase('group_select')
      } else {
        await askPele(text,{phase:'greeting'},chatPhase)
        setTimeout(()=>{
          addMsg('pele','¿Cómo quieres llenar tus pronósticos?')
          addMsg('pele','__MODE_SELECT__','mode_select')
        },600)
      }
    } else if(chatPhase==='autofill_group'){
      const g=allGroups.find(k=>text.toUpperCase().includes(k)||text.toLowerCase().includes(`grupo ${k.toLowerCase()}`))
      if(g){ addMsg('pele',`¡Grupo ${g}! Voy a analizarlo. 🤖`); await runAutofill(g) }
      else addMsg('pele','Dime la letra del grupo (A-L) que quieres que llene.')
    } else if(chatPhase==='intro'){
      await askPele(text,{phase:'greeting'},chatPhase)
      setTimeout(()=>{
        addMsg('pele','🎯 ¿Cómo quieres llenar tus pronósticos?')
        addMsg('pele','__MODE_SELECT__','mode_select')
        setChatPhase('mode_select')
      },800)
    } else if(chatPhase==='group_select'){
      const g=allGroups.find(k=>text.toUpperCase().includes(k)||text.toLowerCase().includes(`grupo ${k.toLowerCase()}`))
      if(g) selectGroup(g)
      else addMsg('pele','Dime la letra del grupo (A-L) o haz clic en uno de los grupos de arriba 😄')
    } else if(chatPhase==='score_input'||chatPhase==='stats'||chatPhase==='confirm'){
      const m=text.match(/(\d+)\s*[-–a]\s*(\d+)/i)
      if(m){
        setScoreForm({home:m[1],away:m[2],pen:''})
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
    const now = Date.now()
    const ms=matches?.filter(m=>m.phase==='group'&&m.group_name===g)||[]
    const teams=ms.map(m=>[m.team1,m.team2]).flat().filter(Boolean)
    const uniqueTeams=[...new Set(teams)]

    // Find first match that is not locked and has no prediction yet
    let startIdx = ms.findIndex(m=>{
      if(!m.match_date) return false
      const lockTime = new Date(m.match_date).getTime() - (m.auto_lock_hours||2)*3600000
      const locked = m.phase_locked || now >= lockTime
      return !locked && !predictions[m.id]
    })
    // If all have predictions or all locked, start at first unlocked (for editing)
    if(startIdx === -1){
      startIdx = ms.findIndex(m=>{
        if(!m.match_date) return false
        const lockTime = new Date(m.match_date).getTime() - (m.auto_lock_hours||2)*3600000
        return !m.phase_locked && now < lockTime
      })
    }
    // If everything is locked, start at 0 (will show as locked)
    if(startIdx === -1) startIdx = 0

    setCurrentMatchIdx(startIdx)

    const lockedCount = ms.filter(m=>{
      if(!m.match_date) return false
      const lockTime = new Date(m.match_date).getTime() - (m.auto_lock_hours||2)*3600000
      return m.phase_locked || now >= lockTime
    }).length
    const pendingCount = ms.length - lockedCount

    let msg = `¡Grupo ${g}! 🎯 ${uniqueTeams.map(t=>f(t)).join(' ')}`
    if(lockedCount > 0 && pendingCount > 0)
      msg += ` — ${lockedCount} partido${lockedCount>1?'s':''} ya bloqueado${lockedCount>1?'s':''}, empezamos desde el partido ${startIdx+1}.`
    else if(lockedCount === ms.length)
      msg += ` — todos los partidos de este grupo ya están bloqueados. 🔒`
    else
      msg += ` — empecemos con el primer partido.`

    addMsg('pele', msg)
    setChatPhase('stats')
    setTimeout(()=>{
      if(ms[startIdx]) showMatchStats(ms[startIdx], startIdx)
    },400)
  }

  function showMatchStats(match, forceIdx){
    if(!match) return
    if(forceIdx!==undefined) setCurrentMatchIdx(forceIdx)
    // Pre-fill scoreForm if prediction already exists
    const existingPred = predictions[match.id]
    if(existingPred){
      setScoreForm({
        home: String(existingPred.score_home ?? ''),
        away: String(existingPred.score_away ?? ''),
        pen: existingPred.penalty_winner || ''
      })
    } else {
      setScoreForm({home:'',away:'',pen:''})
    }
    addMsg('pele','__STATS__','stats')
    addMsg('pele',existingPred
      ? `✏️ Ya tienes pronóstico guardado: **${es(match.team1)} ${existingPred.score_home} – ${existingPred.score_away} ${es(match.team2)}**\n¿Quieres editarlo?`
      : `¿Cuánto crees que queda este partido? 🤔\n(Dime el marcador o escribe "no sé" para que yo te sugiera)`)
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
    const now = Date.now()
    // Find next unlocked match after current
    let nextIdx = currentMatchIdx + 1
    while(nextIdx < groupMatches.length){
      const m = groupMatches[nextIdx]
      if(!m.match_date){ nextIdx++; continue }
      const lockTime = new Date(m.match_date).getTime() - (m.auto_lock_hours||2)*3600000
      const locked = m.phase_locked || now >= lockTime
      if(!locked) break
      nextIdx++
    }
    if(nextIdx < groupMatches.length){
      const next = groupMatches[nextIdx]
      const total = groupMatches.length
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
          <div className="pele-sub">● En línea · {activeAvatar?.nickname||user?.name?.split(' ')[0]}</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'3px'}}>
          <span className="chip chip-gold" style={{fontSize:'9px'}}>{totalDone}/{Object.values(availableCounts).reduce((s,v)=>s+v,0)||'?'} disponibles</span>
          <div className="autosave"><div className="dot-g"/>Auto-guardado</div>
        </div>
      </div>
      <div className="prog-bar"><div className="prog-fill" style={{width:`${(()=>{const av=Object.values(availableCounts).reduce((s,v)=>s+v,0);return av?Math.round(totalDone/av*100):0})()||0}%`}}/></div>

      {/* Phase strip */}
      {currentGroupKey&&(
        <div className="phase-bar">
          <div className={`ph ph-on`}>Grupo {currentGroupKey}</div>
          {allGroups.filter(g=>g!==currentGroupKey).map(g=>(
            <div key={g} className={`ph ${isGroupDone(g)?'ph-done':''}`} onClick={()=>selectGroup(g)} style={{cursor:'pointer'}}>
              {isGroupDone(g)?'✓ ':''}{g}
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
          if(msg.type==='mode_select') return(
            <div key={msg.id} style={{width:'100%',padding:'0 .5rem .5rem'}}>
              {autofilling?(
                <div style={{padding:'1.25rem 1rem',background:'linear-gradient(135deg,#0d1117,#111827)',border:'1px solid rgba(246,201,14,.25)',borderRadius:'var(--r)',overflow:'hidden',position:'relative'}}>
                  {/* Animated gold glow bar at top */}
                  <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,transparent,#F6C90E,transparent)',animation:'pele-scan 1.8s ease-in-out infinite'}}/>
                  {/* Header */}
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1rem'}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(246,201,14,.1)',border:'1.5px solid rgba(246,201,14,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',animation:'pele-pulse 1.5s ease-in-out infinite'}}>🤖</div>
                    <div>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1rem',letterSpacing:'2px',color:'#F6C90E',lineHeight:1}}>PELÉ IA CALCULANDO</div>
                      <div style={{fontSize:'10px',color:'rgba(255,255,255,.35)',letterSpacing:'1px',textTransform:'uppercase',marginTop:'2px'}}>Sistema de predicción activo</div>
                    </div>
                    <div style={{marginLeft:'auto',display:'flex',gap:'3px'}}>
                      {[0,1,2].map(i=><div key={i} style={{width:'5px',height:'5px',borderRadius:'50%',background:'#F6C90E',animation:`pele-blink 1s ${i*0.2}s infinite`}}/>)}
                    </div>
                  </div>
                  {/* Steps */}
                  {[
                    {icon:'📡',label:'Escaneando 104 partidos del torneo 2026',sub:'Cargando fixture completo USA · Canadá · México'},
                    {icon:'🧬',label:'Procesando ADN futbolístico de 48 selecciones',sub:'Rankings FIFA · historial reciente · lesionados'},
                    {icon:'⚡',label:'Calculando probabilidades de victoria',sub:'Modelo Elo + regresión logística · 2.4M iteraciones'},
                    {icon:'🌍',label:'Cruzando factores de sede y clima',sub:'Altitud · temperatura · ventaja local · viajes'},
                    {icon:'🏆',label:'Identificando patrones históricos de campeones',sub:'Copa del Mundo 1930-2022 · 22 torneos analizados'},
                    {icon:'🎯',label:'Generando marcadores más probables',sub:'Ponderando goles esperados xG · forma actual'},
                    {icon:'🔮',label:'Optimizando estrategia para maximizar tus puntos',sub:'Calibrando sorpresas · favoritos · grupos de la muerte'},
                    {icon:'✅',label:'¡Predicciones completadas!',sub:'Tu polla está lista · Puedes editar cualquier resultado'},
                  ].map((step,i)=>{
                    const done = autofillStep > i
                    const active = autofillStep === i
                    const pending = autofillStep < i
                    return(
                      <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'6px 0',opacity:pending?0.28:1,transition:'opacity 0.5s,transform 0.4s',transform:active?'translateX(4px)':'translateX(0)'}}>
                        <div style={{width:'28px',height:'28px',borderRadius:'6px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',
                          background:done?'rgba(22,163,74,.15)':active?'rgba(246,201,14,.12)':'rgba(255,255,255,.04)',
                          border:`1px solid ${done?'rgba(22,163,74,.4)':active?'rgba(246,201,14,.5)':'rgba(255,255,255,.06)'}`,
                          transition:'all 0.4s',
                          boxShadow:active?'0 0 10px rgba(246,201,14,.25)':'none'
                        }}>
                          {done?'✓':step.icon}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:'12px',fontWeight:600,color:done?'rgba(74,222,128,.9)':active?'#F6C90E':'rgba(255,255,255,.55)',transition:'color 0.4s',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{step.label}</div>
                          {(active||done)&&<div style={{fontSize:'10px',color:'rgba(255,255,255,.3)',marginTop:'1px'}}>{step.sub}</div>}
                        </div>
                        {active&&<div style={{flexShrink:0,display:'flex',gap:'2px',alignItems:'center',paddingTop:'3px'}}>
                          {[0,1,2].map(j=><div key={j} style={{width:'3px',height:'3px',borderRadius:'50%',background:'rgba(246,201,14,.7)',animation:`pele-blink 0.7s ${j*0.12}s infinite`}}/>)}
                        </div>}
                      </div>
                    )
                  })}
                  {/* Progress bar */}
                  <div style={{marginTop:'10px',height:'3px',background:'rgba(255,255,255,.06)',borderRadius:'2px',overflow:'hidden'}}>
                    <div style={{height:'100%',background:'linear-gradient(90deg,#F6C90E,#ffdd55)',borderRadius:'2px',width:`${Math.min(100,autofillStep*(100/7))}%`,transition:'width 1.2s cubic-bezier(.4,0,.2,1)',boxShadow:'0 0 8px rgba(246,201,14,.5)'}}/>
                  </div>

                </div>
              ):(
                <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'8px'}}>
                  <button onClick={()=>runAutofill(null)}
                    style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',
                      background:'linear-gradient(135deg,var(--ink),#2a2a3a)',
                      border:'2px solid var(--gold)',borderRadius:'var(--r)',cursor:'pointer',textAlign:'left'}}>
                    <span style={{fontSize:'1.5rem'}}>🤖</span>
                    <div>
                      <div style={{fontWeight:700,color:'var(--gold)',fontSize:'13px'}}>Pelé IA llena toda mi polla</div>
                      <div style={{fontSize:'11px',color:'rgba(247,244,238,.5)'}}>Analizo todos los partidos disponibles y los lleno por ti. Puedes editar después.</div>
                    </div>
                  </button>
                  <button onClick={()=>{addMsg('pele','¿De qué grupo quieres que llene los pronósticos? Dime la letra (A-L) 👇');setChatPhase('autofill_group')}}
                    style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',
                      background:'var(--cream2)',border:'1px solid var(--border)',borderRadius:'var(--r)',cursor:'pointer',textAlign:'left'}}>
                    <span style={{fontSize:'1.5rem'}}>📋</span>
                    <div>
                      <div style={{fontWeight:700,color:'var(--ink)',fontSize:'13px'}}>Llenar un grupo específico</div>
                      <div style={{fontSize:'11px',color:'var(--ink3)'}}>Selecciono grupo A-L y Pelé IA llena esos 6 partidos.</div>
                    </div>
                  </button>
                  <button onClick={()=>{addMsg('pele','¡Perfecto! ¿Por qué grupo empezamos? 🎯');addMsg('pele','__GROUP_SELECT__','group_select');setChatPhase('group_select')}}
                    style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',
                      background:'var(--cream2)',border:'1px solid var(--border)',borderRadius:'var(--r)',cursor:'pointer',textAlign:'left'}}>
                    <span style={{fontSize:'1.5rem'}}>⚽</span>
                    <div>
                      <div style={{fontWeight:700,color:'var(--ink)',fontSize:'13px'}}>Yo lo hago con tu ayuda</div>
                      <div style={{fontSize:'11px',color:'var(--ink3)'}}>Me guías partido por partido con estadísticas y análisis.</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )
          if(msg.type==='group_select') return(
            <div key={msg.id} style={{width:'100%'}}>
              {(()=>{
                const GRPS={'A':'🇲🇽🇿🇦🇰🇷🇨🇿','B':'🇨🇦🇧🇦🇶🇦🇨🇭','C':'🇧🇷🇲🇦🇭🇹🏴󠁧󠁢󠁳󠁣󠁴󠁿','D':'🇺🇸🇵🇾🇦🇺🇹🇷','E':'🇩🇪🇨🇼🇨🇮🇪🇨','F':'🇳🇱🇯🇵🇸🇪🇹🇳','G':'🇧🇪🇪🇬🇮🇷🇳🇿','H':'🇪🇸🇨🇻🇸🇦🇺🇾','I':'🇫🇷🇸🇳🇮🇶🇳🇴','J':'🇦🇷🇩🇿🇦🇹🇯🇴','K':'🇵🇹🇨🇩🇺🇿🇨🇴','L':'🏴󠁧󠁢󠁥󠁮󠁧󠁿🇭🇷🇬🇭🇵🇦'}
                const now = Date.now()
                const KNOCKOUT_PHASES=['round32','round16','quarters','semis','third','final']
                const KNOCKOUT_LABELS={round32:'Ronda de 32',round16:'Octavos',quarters:'Cuartos',semis:'Semifinales',third:'3er Puesto',final:'Gran Final'}
                const availableKnockout = KNOCKOUT_PHASES.filter(ph=>(matches||[]).some(m=>{
                  if(m.phase!==ph||!m.match_date) return false
                  const lt=new Date(m.match_date).getTime()-(m.auto_lock_hours||2)*3600000
                  return !m.phase_locked && now<lt && !predictions[m.id]
                }))
                const pendingGroupCount = allGroups.filter(g=>!isGroupDone(g)&&availableCounts[g]>0).length
                const hasPending = pendingGroupCount>0 || availableKnockout.length>0
                return(
                  <>
                    {hasPending && !autofilling && (
                      <button onClick={()=>runAutofill(null)}
                        style={{width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'11px 16px',
                          background:'linear-gradient(135deg,var(--ink),#1a1f30)',
                          border:'1.5px solid var(--gold)',borderRadius:'var(--r)',cursor:'pointer',
                          marginBottom:'10px',textAlign:'left',fontFamily:'inherit'}}>
                        <span style={{fontSize:'1.3rem'}}>🤖</span>
                        <div>
                          <div style={{fontWeight:700,color:'var(--gold)',fontSize:'12px'}}>
                            {'Pelé IA llena '+(pendingGroupCount>0?('los '+pendingGroupCount+' grupos pendientes'):availableKnockout.map(p=>KNOCKOUT_LABELS[p]).join(', '))+' — automático'}
                          </div>
                          <div style={{fontSize:'10px',color:'rgba(255,255,255,.4)',marginTop:'1px'}}>Analiza y completa todos los pronósticos disponibles. Puedes editar después.</div>
                        </div>
                      </button>
                    )}
                    {(pendingGroupCount>0 || allGroups.some(g=>doneCounts[g]>0)) && (
                      <div className="group-grid">
                        {allGroups.map(g=>{
                          const done=isGroupDone(g)
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
                    )}
                    {availableKnockout.length>0 && (
                      <div style={{marginTop:'10px'}}>
                        <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'1px',color:'rgba(255,255,255,.3)',textTransform:'uppercase',marginBottom:'6px'}}>Fases eliminatorias disponibles</div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'6px'}}>
                          {availableKnockout.map(ph=>{
                            const phMs=(matches||[]).filter(m=>m.phase===ph)
                            const phDone=phMs.filter(m=>predictions[m.id]!=null).length
                            const phTotal=phMs.filter(m=>{if(!m.match_date)return false;const lt=new Date(m.match_date).getTime()-(m.auto_lock_hours||2)*3600000;return !m.phase_locked&&now<lt}).length
                            return(
                              <button key={ph}
                                onClick={()=>{
                                  setCurrentGroupKey(ph)
                                  const ms=(matches||[]).filter(m=>m.phase===ph)
                                  const first=ms.find(m=>{if(!m.match_date)return false;const lt=new Date(m.match_date).getTime()-(m.auto_lock_hours||2)*3600000;return !m.phase_locked&&now<lt&&!predictions[m.id]})||ms[0]
                                  if(first){addMsg('pele',`⚽ ${KNOCKOUT_LABELS[ph]} — ¡Vamos!`);setChatPhase('stats');setTimeout(()=>showMatchStats(first,ms.indexOf(first)),400)}
                                }}
                                style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:'2px',padding:'8px 10px',
                                  background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',
                                  borderRadius:'var(--r)',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
                                <div style={{fontWeight:700,fontSize:'12px',color:'#fff'}}>{KNOCKOUT_LABELS[ph]}</div>
                                <div style={{fontSize:'10px',color:'rgba(255,255,255,.4)'}}>{phDone}/{phTotal} completados</div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
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
              {(()=>{
                const GRPS={'A':'🇲🇽🇿🇦🇰🇷🇨🇿','B':'🇨🇦🇧🇦🇶🇦🇨🇭','C':'🇧🇷🇲🇦🇭🇹🏴󠁧󠁢󠁳󠁣󠁴󠁿','D':'🇺🇸🇵🇾🇦🇺🇹🇷','E':'🇩🇪🇨🇼🇨🇮🇪🇨','F':'🇳🇱🇯🇵🇸🇪🇹🇳','G':'🇧🇪🇪🇬🇮🇷🇳🇿','H':'🇪🇸🇨🇻🇸🇦🇺🇾','I':'🇫🇷🇸🇳🇮🇶🇳🇴','J':'🇦🇷🇩🇿🇦🇹🇯🇴','K':'🇵🇹🇨🇩🇺🇿🇨🇴','L':'🏴󠁧󠁢󠁥󠁮󠁧󠁿🇭🇷🇬🇭🇵🇦'}
                const now = Date.now()
                const KNOCKOUT_PHASES=['round32','round16','quarters','semis','third','final']
                const KNOCKOUT_LABELS={round32:'Ronda de 32',round16:'Octavos',quarters:'Cuartos',semis:'Semifinales',third:'3er Puesto',final:'Gran Final'}
                const availableKnockout = KNOCKOUT_PHASES.filter(ph=>(matches||[]).some(m=>{
                  if(m.phase!==ph||!m.match_date) return false
                  const lt=new Date(m.match_date).getTime()-(m.auto_lock_hours||2)*3600000
                  return !m.phase_locked && now<lt && !predictions[m.id]
                }))
                const remaining = allGroups.filter(g=>g!==currentGroupKey&&!isGroupDone(g)&&availableCounts[g]>0)
                const hasPending = remaining.length>0 || availableKnockout.length>0
                return(
                  <>
                    {hasPending && !autofilling && (
                      <button onClick={()=>runAutofill(null)}
                        style={{width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'11px 16px',
                          background:'linear-gradient(135deg,var(--ink),#1a1f30)',
                          border:'1.5px solid var(--gold)',borderRadius:'var(--r)',cursor:'pointer',
                          marginBottom:'10px',textAlign:'left',fontFamily:'inherit'}}>
                        <span style={{fontSize:'1.3rem'}}>🤖</span>
                        <div>
                          <div style={{fontWeight:700,color:'var(--gold)',fontSize:'12px'}}>
                            {'Pelé IA llena '+(remaining.length>0?('los '+remaining.length+' grupos restantes'):availableKnockout.map(p=>KNOCKOUT_LABELS[p]).join(', '))+' — automático'}
                          </div>
                          <div style={{fontSize:'10px',color:'rgba(255,255,255,.4)',marginTop:'1px'}}>Analiza y completa todos. Puedes editar después.</div>
                        </div>
                      </button>
                    )}
                    {allGroups.filter(g=>g!==currentGroupKey).some(g=>!isGroupDone(g)||doneCounts[g]>0) && (
                      <div className="group-grid">
                        {allGroups.filter(g=>g!==currentGroupKey).map(g=>{
                          const done=isGroupDone(g)
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
                    )}
                    {availableKnockout.length>0 && (
                      <div style={{marginTop:'10px'}}>
                        <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'1px',color:'rgba(255,255,255,.3)',textTransform:'uppercase',marginBottom:'6px'}}>Fases eliminatorias disponibles</div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'6px'}}>
                          {availableKnockout.map(ph=>{
                            const phMs=(matches||[]).filter(m=>m.phase===ph)
                            const phDone=phMs.filter(m=>predictions[m.id]!=null).length
                            const phTotal=phMs.filter(m=>{if(!m.match_date)return false;const lt=new Date(m.match_date).getTime()-(m.auto_lock_hours||2)*3600000;return !m.phase_locked&&now<lt}).length
                            return(
                              <button key={ph}
                                onClick={()=>{
                                  setCurrentGroupKey(ph)
                                  const ms=(matches||[]).filter(m=>m.phase===ph)
                                  const first=ms.find(m=>{if(!m.match_date)return false;const lt=new Date(m.match_date).getTime()-(m.auto_lock_hours||2)*3600000;return !m.phase_locked&&now<lt&&!predictions[m.id]})||ms[0]
                                  if(first){addMsg('pele',`⚽ ${KNOCKOUT_LABELS[ph]} — ¡Vamos!`);setChatPhase('stats');setTimeout(()=>showMatchStats(first,ms.indexOf(first)),400)}
                                }}
                                style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:'2px',padding:'8px 10px',
                                  background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',
                                  borderRadius:'var(--r)',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
                                <div style={{fontWeight:700,fontSize:'12px',color:'#fff'}}>{KNOCKOUT_LABELS[ph]}</div>
                                <div style={{fontSize:'10px',color:'rgba(255,255,255,.4)'}}>{phDone}/{phTotal} completados</div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )
          return(
            <div key={msg.id} className="row-ai">
              <div className="pm" style={{padding:0,overflow:'hidden'}}><img src="/pele.jpg" alt="Pelé" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/></div>
              <div className="bbl bbl-ai" dangerouslySetInnerHTML={{__html:(msg.content||'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}}/>
            </div>
          )
        })}
        {autofilling&&(
          <div style={{width:'100%',padding:'0 .5rem .5rem'}}>
            <div style={{padding:'1.1rem .9rem',background:'linear-gradient(135deg,#0d1117,#111827)',border:'1px solid rgba(246,201,14,.25)',borderRadius:'var(--r)',overflow:'hidden',position:'relative'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,transparent,#F6C90E,transparent)',animation:'pele-scan 1.8s ease-in-out infinite'}}/>
              <div style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'.8rem'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'rgba(246,201,14,.1)',border:'1.5px solid rgba(246,201,14,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',animation:'pele-pulse 1.5s ease-in-out infinite'}}>🤖</div>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'.9rem',letterSpacing:'2px',color:'#F6C90E',lineHeight:1}}>PELÉ IA CALCULANDO</div>
                  <div style={{fontSize:'9px',color:'rgba(255,255,255,.35)',letterSpacing:'1px',textTransform:'uppercase',marginTop:'2px'}}>Sistema de predicción activo</div>
                </div>
                <div style={{marginLeft:'auto',display:'flex',gap:'3px'}}>
                  {[0,1,2].map(i=><div key={i} style={{width:'4px',height:'4px',borderRadius:'50%',background:'#F6C90E',animation:`pele-blink 1s ${i*0.2}s infinite`}}/>)}
                </div>
              </div>
              {[
                {icon:'📡',label:'Escaneando partidos del torneo 2026',sub:'Cargando fixture completo USA · Canadá · México'},
                {icon:'🧬',label:'Procesando ADN futbolístico de 48 selecciones',sub:'Rankings FIFA · historial reciente · forma actual'},
                {icon:'⚡',label:'Calculando probabilidades de victoria',sub:'Modelo Elo + regresión logística · 2.4M iteraciones'},
                {icon:'🌍',label:'Cruzando factores de sede y clima',sub:'Altitud · temperatura · ventaja local · viajes'},
                {icon:'🏆',label:'Identificando patrones históricos',sub:'Copa del Mundo 1930-2022 · 22 torneos analizados'},
                {icon:'🎯',label:'Generando marcadores más probables',sub:'Ponderando goles esperados xG · forma actual'},
                {icon:'🔮',label:'Optimizando estrategia para tus puntos',sub:'Calibrando sorpresas · favoritos · grupos de la muerte'},
                {icon:'✅',label:'¡Predicciones completadas!',sub:'Tu polla está lista · Puedes editar cualquier resultado'},
              ].map((step,i)=>{
                const done=autofillStep>i,active=autofillStep===i,pend=autofillStep<i
                return(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'8px',padding:'4px 0',opacity:pend?0.25:1,transition:'opacity 0.5s,transform 0.4s',transform:active?'translateX(3px)':'translateX(0)'}}>
                    <div style={{width:'24px',height:'24px',borderRadius:'5px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',
                      background:done?'rgba(22,163,74,.15)':active?'rgba(246,201,14,.12)':'rgba(255,255,255,.04)',
                      border:`1px solid ${done?'rgba(22,163,74,.4)':active?'rgba(246,201,14,.5)':'rgba(255,255,255,.06)'}`,
                      transition:'all 0.4s',boxShadow:active?'0 0 8px rgba(246,201,14,.25)':'none'
                    }}>{done?'✓':step.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'11px',fontWeight:600,color:done?'rgba(74,222,128,.9)':active?'#F6C90E':'rgba(255,255,255,.5)',transition:'color 0.4s',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{step.label}</div>
                      {(active||done)&&<div style={{fontSize:'9px',color:'rgba(255,255,255,.3)',marginTop:'1px'}}>{step.sub}</div>}
                    </div>
                    {active&&<div style={{flexShrink:0,display:'flex',gap:'2px',alignItems:'center',paddingTop:'2px'}}>
                      {[0,1,2].map(j=><div key={j} style={{width:'3px',height:'3px',borderRadius:'50%',background:'rgba(246,201,14,.7)',animation:`pele-blink 0.7s ${j*0.12}s infinite`}}/>)}
                    </div>}
                  </div>
                )
              })}
              <div style={{marginTop:'8px',height:'3px',background:'rgba(255,255,255,.06)',borderRadius:'2px',overflow:'hidden'}}>
                <div style={{height:'100%',background:'linear-gradient(90deg,#F6C90E,#ffdd55)',borderRadius:'2px',width:`${Math.min(100,autofillStep*(100/7))}%`,transition:'width 1.2s cubic-bezier(.4,0,.2,1)',boxShadow:'0 0 8px rgba(246,201,14,.5)'}}/>
              </div>
            </div>
          </div>
        )}
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
      {chatPhase==='mode_select'&&!autofilling&&(
        <div className="qr-row">
          <div className="qr qr-gold" onClick={()=>setView('bracket')}>🏆 Mi Pronóstico General</div>
          <div className="qr" onClick={()=>setView('dashboard')}>🏠 Inicio</div>
        </div>
      )}
      {chatPhase==='group_select'&&(
        <div className="qr-row">
          <div className="qr qr-gold" onClick={()=>setView('board')}>📋 Ver tablero general</div>
          <div className="qr" onClick={()=>setView('bracket')}>🏆 Mi Pronóstico General</div>
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
            <div className="btn-row" style={{marginTop:'.5rem'}}>
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

// ─── BRACKET PAGE ─────────────────────────────────────────────────────────────
const BRACKET_TEAMS_ALL=['Brazil','France','Argentina','England','Spain','Portugal','Germany','Netherlands',
  'Belgium','Croatia','Colombia','Uruguay','Morocco','Japan','USA','Mexico','Korea Republic','Senegal',
  'Ecuador','Norway','Australia','Switzerland','Turkey','Sweden','Austria','Ghana','IR Iran','Saudi Arabia',
  'Ivory Coast','Iraq','DR Congo','Uzbekistan','Curaçao','Panama','Jordan','New Zealand','Scotland',
  'Cape Verde','Haiti','Algeria','Tunisia','Bosnia and Herzegovina','Czechia','Egypt','Qatar',
  'South Africa','Canada']

function BracketPage(){
  const {activeAvatar,setView}=useApp()
  const [bracket,setBracket]=React.useState(null)
  const [savedBracket,setSavedBracket]=React.useState(null)
  const [loading,setLoading]=React.useState(true)
  const [saving,setSaving]=React.useState(false)
  const [generating,setGenerating]=React.useState(false)
  const [champion,setChampion]=React.useState('')
  const [err,setErr]=React.useState('')
  const [msg,setMsg]=React.useState('')
  const [locked,setLocked]=React.useState(false)
  const [hasBeenEdited,setHasBeenEdited]=React.useState(false)
  const [tab,setTab]=React.useState('view') // view | setup
  const bracketRef=React.useRef(null)

  // Empty bracket structure
  const emptyBracket=()=>({
    round32:Array.from({length:16},(_,i)=>({match:i+1,home:'',away:'',winner:'',home_score:null,away_score:null})),
    round16:Array.from({length:8},(_,i)=>({match:i+1,home:'',away:'',winner:'',home_score:null,away_score:null})),
    quarters:Array.from({length:4},(_,i)=>({match:i+1,home:'',away:'',winner:'',home_score:null,away_score:null})),
    semis:Array.from({length:2},(_,i)=>({match:i+1,home:'',away:'',winner:'',home_score:null,away_score:null})),
    third:{home:'',away:'',winner:'',home_score:0,away_score:0},
    final:{home:'',away:'',winner:'',home_score:0,away_score:0},
    champion:''
  })

  React.useEffect(()=>{
    if(!activeAvatar?.id){setLoading(false);return}
    api(`/api/bracket/${activeAvatar.id}`).then(data=>{
      if(data){
        setBracket(data.bracket)
        setSavedBracket(data.bracket)
        setLocked(!!data.locked_at)
        setHasBeenEdited(data.has_been_edited)
        setChampion(data.bracket?.champion||'')
      } else {
        setBracket(emptyBracket())
      }
    }).catch(()=>setBracket(emptyBracket())).finally(()=>setLoading(false))
  },[activeAvatar])

  // Only these 9 teams are valid champions
  const VALID_CHAMPIONS=['Brazil','France','Argentina','England','Spain','Portugal','Germany','Uruguay','Colombia']
  const [genStep,setGenStep]=React.useState(0) // animation steps

  async function generateWithAI(){
    if(!champion){setErr('Elige un campeón primero');return}

    // Validate champion
    if(!VALID_CHAMPIONS.includes(champion)){
      setErr(`❌ La IA considera que ${es(champion)} no tiene posibilidades reales de ser campeón. Los equipos opcionados son: ${VALID_CHAMPIONS.map(t=>es(t)).join(', ')}.`)
      return
    }

    setGenerating(true); setErr(''); setGenStep(0)

    // Animated steps during generation (7 steps, spread over ~18s)
    const stepDelays=[0,1800,3600,5600,7800,10200,13000]
    const stepTimers=stepDelays.map((d,i)=>setTimeout(()=>setGenStep(i),d))

    try{
      const data=await api('/api/bracket/suggest','POST',{champion,avatarId:activeAvatar.id})
      stepTimers.forEach(t=>clearTimeout(t))
      setGenStep(6)
      await new Promise(r=>setTimeout(r,800))
      setBracket(data.bracket)
      setChampion(data.bracket.champion||champion)
      setMsg('¡Pronóstico general generado por Pelé IA! Revísalo, edita lo que quieras y guárdalo cuando estés listo.')
      setTab('view')
    }catch(e){
      stepTimers.forEach(t=>clearTimeout(t))
      setErr(e.message)
    }
    setGenerating(false)
    setGenStep(0)
  }

  async function saveBracket(lock=false){
    if(!activeAvatar||!bracket){return}
    setSaving(true); setErr(''); setMsg('')
    try{
      const wasLocked = locked
      await api('/api/bracket','POST',{
        avatarId:activeAvatar.id,
        bracket,
        isAiGenerated:!!bracket._aiGenerated
      })
      if(lock&&!wasLocked){
        await api('/api/bracket/lock','POST',{avatarId:activeAvatar.id})
        setLocked(true)
        setMsg('🔒 Pronóstico general confirmado y guardado. ¡Si aciertas el campeón y el path completo sin editar, ganas 100 puntos!')
      } else {
        if(wasLocked) setHasBeenEdited(true)
        setMsg('✅ Pronóstico general guardado. ' + (wasLocked?'Has editado tu pronóstico general — si aciertas ganarás 10 pts.':'Confírmalo cuando estés seguro para optar por los 100 pts.'))
      }
      setSavedBracket(bracket)
    }catch(e){setErr(e.message)}
    setSaving(false)
  }

  async function exportPNG(){
    if(!bracketRef.current){return}
    setMsg('Generando imagen...')
    try{
      // Use html2canvas via CDN if available, otherwise show info
      if(typeof html2canvas!=='undefined'){
        const canvas=await html2canvas(bracketRef.current,{backgroundColor:'#0d1117',scale:1.5})
        const link=document.createElement('a')
        link.download=`mi-bracket-mundial-2026.png`
        link.href=canvas.toDataURL('image/png')
        link.click()
        setMsg('✅ Imagen descargada')
      } else {
        setMsg('Para descargar: haz clic derecho en el pronóstico general → "Guardar imagen como"')
      }
    }catch(e){setMsg('No se pudo exportar. Intenta captura de pantalla.')}
  }

  function updateMatch(phase,idx,field,value){
    if(locked&&!hasBeenEdited) setHasBeenEdited(true)
    setBracket(prev=>{
      const next=JSON.parse(JSON.stringify(prev))
      if(phase==='third'||phase==='final'){
        next[phase]={...next[phase],[field]:value}
        // Auto-detect winner from score
        if(field==='home_score'||field==='away_score'){
          const hs=field==='home_score'?+value:+(next[phase].home_score??-1)
          const as=field==='away_score'?+value:+(next[phase].away_score??-1)
          if(hs>=0&&as>=0&&hs!==as){
            const w=hs>as?next[phase].home:next[phase].away
            next[phase].winner=w
            if(phase==='final') next.champion=w
          }
        }
        if(field==='winner'&&phase==='final') next.champion=value
      } else {
        next[phase][idx]={...next[phase][idx],[field]:value}
        // Auto-detect winner from score change
        if(field==='home_score'||field==='away_score'){
          const m=next[phase][idx]
          const hs=+(m.home_score??-1), as=+(m.away_score??-1)
          if(hs>=0&&as>=0&&hs!==as&&!m.penalties){
            const w=hs>as?m.home:m.away
            next[phase][idx].winner=w
            cascadeWinner(next,phase,idx,w)
          }
        }
        // Explicit winner change — cascade downstream
        if(field==='winner') cascadeWinner(next,phase,idx,value)
      }
      return next
    })
  }

  function cascadeWinner(bracket,phase,idx,winner){
    const NEXT={round32:'round16',round16:'quarters',quarters:'semis'}
    const nextPhase=NEXT[phase]
    if(nextPhase){
      const nextIdx=Math.floor(idx/2)
      const slot=idx%2===0?'home':'away'
      if(bracket[nextPhase]&&bracket[nextPhase][nextIdx]){
        const old=bracket[nextPhase][nextIdx][slot]
        bracket[nextPhase][nextIdx][slot]=winner
        // If the old occupant was the current winner, clear winner downstream too
        if(bracket[nextPhase][nextIdx].winner===old){
          bracket[nextPhase][nextIdx].winner=''
          cascadeWinner(bracket,nextPhase,nextIdx,'')
        }
      }
    } else if(phase==='semis'){
      const slot=idx===0?'home':'away'
      if(bracket.final){
        const old=bracket.final[slot]
        bracket.final[slot]=winner
        if(bracket.final.winner===old){ bracket.final.winner=''; bracket.champion='' }
      }
    }
  }

  if(loading) return <div className="page"><Nav/><div className="loading">⚽</div></div>

  return(
    <div style={{minHeight:'100vh',background:'#0d1117',color:'#fff'}}>
      <Nav/>
      {/* Header bar */}
      <div style={{background:'rgba(13,17,23,.95)',borderBottom:'1px solid rgba(246,201,14,.15)',
        padding:'.6rem .85rem',display:'flex',alignItems:'center',justifyContent:'space-between',
        flexWrap:'wrap',gap:'6px',position:'sticky',top:0,zIndex:10,backdropFilter:'blur(12px)'}}>
        <div style={{minWidth:0}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(.95rem,4vw,1.3rem)',color:'var(--gold)',letterSpacing:2,lineHeight:1,whiteSpace:'nowrap'}}>
            🏆 PRONÓSTICO GENERAL 2026
          </div>
          <div style={{fontSize:'9px',color:'rgba(255,255,255,.4)',marginTop:'2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'200px'}}>
            {locked?(hasBeenEdited?'✏️ Editado · +10 pts':'🔒 Confirmado · +100 pts'):'Confirma para optar por +100 pts'}
          </div>
        </div>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center',flexShrink:0}}>
          {/* Ver tab */}
          <button onClick={()=>setTab('view')}
            style={{padding:'7px 14px',fontWeight:700,fontSize:'12px',border:'1px solid rgba(255,255,255,.15)',cursor:'pointer',borderRadius:'8px',transition:'all .2s',
              background:tab==='view'?'var(--gold)':'rgba(255,255,255,.06)',
              color:tab==='view'?'#0d1117':'rgba(255,255,255,.7)'}}>
            🏆 Ver bracket
          </button>
          {/* BIG Pelé IA generate button */}
          <button onClick={()=>setTab('setup')}
            style={{padding:'9px 18px',fontWeight:800,fontSize:'13px',border:'none',cursor:'pointer',
              borderRadius:'10px',display:'flex',alignItems:'center',gap:'8px',transition:'all .2s',
              background:tab==='setup'?'#15803d':'#16a34a',
              color:'#fff',boxShadow:'0 4px 16px rgba(22,163,74,.4)',letterSpacing:'.2px'}}>
            <img src='/pele.jpg' style={{width:'24px',height:'24px',borderRadius:'50%',objectFit:'cover',objectPosition:'top',flexShrink:0,border:'2px solid rgba(255,255,255,.5)'}}/>
            <span style={{whiteSpace:'nowrap'}}>Generar Pronóstico con Pelé IA</span>
          </button>
          <button style={{background:'rgba(255,255,255,.06)',color:'rgba(255,255,255,.7)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',padding:'5px 8px',fontSize:'11px',cursor:'pointer'}} onClick={exportPNG}>📸</button>
          {!locked?(
            <>
              <button style={{background:'rgba(255,255,255,.06)',color:'rgba(255,255,255,.7)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',padding:'5px 8px',fontSize:'11px',cursor:'pointer'}} onClick={()=>saveBracket(false)} disabled={saving}>💾</button>
              <button style={{background:'var(--gold)',color:'#0d1117',border:'none',borderRadius:'6px',padding:'5px 10px',fontSize:'11px',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}} onClick={()=>saveBracket(true)} disabled={saving}>🔒 +100 pts</button>
            </>
          ):(
            <button style={{background:'rgba(255,255,255,.06)',color:'rgba(255,255,255,.7)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',padding:'5px 8px',fontSize:'11px',cursor:'pointer'}} onClick={()=>saveBracket(false)} disabled={saving}>✏️ Editar</button>
          )}
        </div>
      </div>

      {err&&<div style={{margin:'8px 1rem',padding:'8px 12px',background:'rgba(220,38,38,.15)',border:'1px solid rgba(220,38,38,.3)',borderRadius:'8px',color:'#fca5a5',fontSize:'13px'}}>{err}</div>}
      {msg&&<div style={{margin:'8px 1rem',padding:'8px 12px',background:'rgba(246,201,14,.1)',border:'1px solid rgba(246,201,14,.25)',borderRadius:'8px',color:'var(--gold)',fontSize:'13px'}}>{msg}</div>}

      {/* Setup tab */}
      {tab==='setup'&&(
        <div style={{maxWidth:'520px',margin:'2rem auto',padding:'0 1rem'}}>
          <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'var(--r-lg)',padding:'1.5rem'}}>
            <div style={{fontWeight:700,fontSize:'14px',marginBottom:'.75rem',color:'#fff'}}>🤖 Generar con Pelé IA</div>
            <p style={{fontSize:'13px',color:'rgba(255,255,255,.45)',marginBottom:'1rem'}}>Elige el campeón y Pelé IA propone el pronóstico completo con análisis real de fútbol. Luego puedes editarlo libremente.</p>
            {!generating?(
              <>
                <div style={{marginBottom:'1rem'}}>
                  <label style={{display:'block',fontSize:'10px',fontWeight:700,letterSpacing:'.8px',textTransform:'uppercase',color:'rgba(255,255,255,.35)',marginBottom:'5px'}}>¿Quién será el Campeón 2026?</label>
                  <select style={{width:'100%',background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'.65rem .9rem',color:'#fff',fontSize:'13px'}} value={champion} onChange={e=>{setChampion(e.target.value);setErr('')}}>
                    <option value="">— Selecciona el campeón —</option>
                    {VALID_CHAMPIONS.map(t=><option key={t} value={t}>{f(t)} {es(t)}</option>)}
                  </select>
                  <p style={{fontSize:'11px',color:'rgba(255,255,255,.25)',marginTop:'5px'}}>Solo se aceptan los 9 equipos con posibilidades reales según la IA</p>
                </div>
                <button style={{width:'100%',background:champion?'#16a34a':'rgba(255,255,255,.1)',color:champion?'#fff':'rgba(255,255,255,.3)',border:'none',borderRadius:'12px',padding:'1rem',fontSize:'15px',fontWeight:800,cursor:champion?'pointer':'not-allowed',transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',boxShadow:champion?'0 4px 20px rgba(22,163,74,.4)':'none'}} onClick={generateWithAI} disabled={!champion}>
                  <img src='/pele.jpg' style={{width:'28px',height:'28px',borderRadius:'50%',objectFit:'cover',objectPosition:'top',flexShrink:0,border:'2px solid rgba(255,255,255,.5)'}}/>
                  <span>Generar Pronóstico con Pelé IA ✨</span>
                </button>
              </>
            ):(
              <div style={{padding:'.5rem 0'}}>
                <div style={{background:'linear-gradient(135deg,#0d1117,#111827)',border:'1px solid rgba(246,201,14,.25)',borderRadius:'var(--r)',overflow:'hidden',position:'relative',padding:'1.1rem .9rem'}}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,transparent,#F6C90E,transparent)',animation:'pele-scan 1.8s ease-in-out infinite'}}/>
                  <div style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'.9rem'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',overflow:'hidden',border:'1.5px solid rgba(246,201,14,.5)',flexShrink:0,boxShadow:'0 0 10px rgba(246,201,14,.3)',animation:'pele-pulse 1.5s ease-in-out infinite'}}>
                      <img src='/pele.jpg' style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>
                    </div>
                    <div>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'.9rem',letterSpacing:'2px',color:'#F6C90E',lineHeight:1}}>PELÉ IA SIMULANDO EL TORNEO</div>
                      <div style={{fontSize:'9px',color:'rgba(255,255,255,.35)',letterSpacing:'1px',textTransform:'uppercase',marginTop:'2px'}}>Campeón elegido: {es(champion)}</div>
                    </div>
                    <div style={{marginLeft:'auto',display:'flex',gap:'3px'}}>
                      {[0,1,2].map(i=><div key={i} style={{width:'4px',height:'4px',borderRadius:'50%',background:'#F6C90E',animation:`pele-blink 1s ${i*0.2}s infinite`}}/>)}
                    </div>
                  </div>
                  {[
                    {icon:'📡',label:'Escaneando fixture completo · 104 partidos',sub:'Fase de grupos · Octavos · Cuartos · Semis · Final'},
                    {icon:'🧬',label:'Analizando ADN de 48 selecciones',sub:'Rankings FIFA · forma reciente · jugadores clave'},
                    {icon:'⚡',label:'Calculando probabilidades de cruce',sub:'Modelo Elo + xG + factores de sede y clima'},
                    {icon:'🔀',label:'Simulando cruces eliminatorios',sub:'16 → 8 → 4 → 2 · propagando al campeón elegido'},
                    {icon:'🏆',label:`Construyendo el camino de ${es(champion)} al título`,sub:'Validando rivales plausibles en cada ronda'},
                    {icon:'🎯',label:'Definiendo marcadores más probables',sub:'Goles esperados · historial de enfrentamientos'},
                    {icon:'✅',label:'¡Bracket completo!',sub:'Listo para revisar y editar libremente'},
                  ].map((step,i)=>{
                    const done=genStep>i,active=genStep===i,pending=genStep<i
                    return(
                      <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'8px',padding:'4px 0',opacity:pending?0.25:1,transition:'opacity 0.5s,transform 0.4s',transform:active?'translateX(3px)':'translateX(0)'}}>
                        <div style={{width:'24px',height:'24px',borderRadius:'5px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',
                          background:done?'rgba(22,163,74,.15)':active?'rgba(246,201,14,.12)':'rgba(255,255,255,.04)',
                          border:`1px solid ${done?'rgba(22,163,74,.4)':active?'rgba(246,201,14,.5)':'rgba(255,255,255,.06)'}`,
                          transition:'all 0.4s',boxShadow:active?'0 0 8px rgba(246,201,14,.25)':'none'
                        }}>{done?'✓':step.icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:'11px',fontWeight:600,color:done?'rgba(74,222,128,.9)':active?'#F6C90E':'rgba(255,255,255,.5)',transition:'color 0.4s',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{step.label}</div>
                          {(active||done)&&<div style={{fontSize:'9px',color:'rgba(255,255,255,.3)',marginTop:'1px'}}>{step.sub}</div>}
                        </div>
                        {active&&<div style={{flexShrink:0,display:'flex',gap:'2px',alignItems:'center',paddingTop:'2px'}}>
                          {[0,1,2].map(j=><div key={j} style={{width:'3px',height:'3px',borderRadius:'50%',background:'rgba(246,201,14,.7)',animation:`pele-blink 0.7s ${j*0.12}s infinite`}}/>)}
                        </div>}
                      </div>
                    )
                  })}
                  <div style={{marginTop:'8px',height:'3px',background:'rgba(255,255,255,.06)',borderRadius:'2px',overflow:'hidden'}}>
                    <div style={{height:'100%',background:'linear-gradient(90deg,#F6C90E,#ffdd55)',borderRadius:'2px',width:`${Math.min(100,genStep*(100/6))}%`,transition:'width 1.6s cubic-bezier(.4,0,.2,1)',boxShadow:'0 0 8px rgba(246,201,14,.5)'}}/>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View tab — fullscreen bracket */}
      {tab==='view'&&bracket&&(
        <div ref={bracketRef} style={{padding:'1rem',overflowX:'auto'}}>
          <BracketViz bracket={bracket} onUpdate={updateMatch} locked={locked}/>
          {bracket.champion&&(
            <div style={{textAlign:'center',margin:'1.5rem auto',maxWidth:'300px',padding:'1rem',
              background:'linear-gradient(135deg,rgba(246,201,14,.15),rgba(246,201,14,.05))',
              border:'2px solid var(--gold)',borderRadius:'var(--r-lg)'}}>
              <div style={{fontSize:'1.5rem',marginBottom:'.25rem'}}>🏆</div>
              <div style={{fontFamily:'Bebas Neue',fontSize:'1.4rem',color:'var(--gold)'}}>
                CAMPEÓN: {f(bracket.champion)} {es(bracket.champion)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BracketViz({bracket,onUpdate,locked}){
  const r32 = bracket?.round32 || Array(16).fill(null)
  const r16 = bracket?.round16 || Array(8).fill(null)
  const qf  = bracket?.quarters || Array(4).fill(null)
  const sf  = bracket?.semis    || Array(2).fill(null)
  const fin = bracket?.final    || {}
  const trd = bracket?.third    || {}

  // Each match card is ~52px tall, gap between cards scales by round
  const CARD_H = 52  // px per match card (2 teams)
  const CARD_GAP = [8, 68, 148, 308]  // gap between match pairs per round (R32,R16,QF,SF)

  function TeamRow({team,score,isWinner,onWin,onChange,onScoreChange}){
    return(
      <div style={{display:'flex',alignItems:'center',gap:'4px',padding:'4px 6px',
        background:isWinner?'rgba(246,201,14,.16)':'transparent',
        borderLeft:isWinner?'3px solid var(--gold)':'3px solid transparent',
        minHeight:'26px',transition:'all .15s'}}>
        <button onClick={onWin} title="Marcar ganador" style={{width:'10px',height:'10px',borderRadius:'50%',border:'none',
          cursor:'pointer',flexShrink:0,background:isWinner?'var(--gold)':'rgba(255,255,255,.18)',transition:'all .15s'}}/>
        <span style={{fontSize:'11px',flexShrink:0,lineHeight:1,width:'16px'}}>{team?f(team):'❓'}</span>
        <select value={team||''} onChange={e=>onChange(e.target.value)}
          style={{flex:1,fontSize:'9px',border:'none',background:'transparent',
            color:isWinner?'var(--gold)':'rgba(255,255,255,.78)',fontWeight:isWinner?700:400,cursor:'pointer',minWidth:0}}>
          <option value=''>— Equipo —</option>
          {BRACKET_TEAMS_ALL.map(t=><option key={t} value={t}>{es(t)}</option>)}
        </select>
        <input type='number' min='0' max='20' value={score!=null&&score!==''?score:''}
          onChange={e=>onScoreChange(e.target.value===''?null:+e.target.value)}
          placeholder='—'
          style={{width:'26px',fontSize:'13px',fontWeight:700,textAlign:'center',padding:'2px 1px',
            border:'1px solid '+(isWinner?'rgba(246,201,14,.5)':'rgba(255,255,255,.2)'),borderRadius:'4px',
            background:isWinner?'rgba(246,201,14,.25)':'rgba(255,255,255,.08)',
            color:isWinner?'var(--gold)':'rgba(255,255,255,.9)',outline:'none'}}/>
      </div>
    )
  }

  function MatchCard({phase,idx,match}){
    const m=match||{}
    const hasPen=!!(m.penalties)
    return(
      <div style={{background:'#1a1f2e',border:'1px solid rgba(255,255,255,.12)',borderRadius:'6px',
        overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.5)',width:'100%',minWidth:'155px'}}>
        <TeamRow team={m.home} score={m.home_score} isWinner={!!(m.winner&&m.winner===m.home)}
          onWin={()=>onUpdate(phase,idx,'winner',m.home)}
          onChange={v=>onUpdate(phase,idx,'home',v)}
          onScoreChange={v=>onUpdate(phase,idx,'home_score',v)}/>
        <div style={{height:'1px',background:'rgba(255,255,255,.08)'}}/>
        <TeamRow team={m.away} score={m.away_score} isWinner={!!(m.winner&&m.winner===m.away)}
          onWin={()=>onUpdate(phase,idx,'winner',m.away)}
          onChange={v=>onUpdate(phase,idx,'away',v)}
          onScoreChange={v=>onUpdate(phase,idx,'away_score',v)}/>
        {/* Penalty toggle for knockout rounds */}
        {(phase!=='group')&&(
          <div style={{display:'flex',alignItems:'center',gap:'4px',padding:'2px 6px',
            background:'rgba(255,255,255,.03)',borderTop:'1px solid rgba(255,255,255,.05)'}}>
            <button onClick={()=>onUpdate(phase,idx,'penalties',!hasPen)}
              style={{fontSize:'8px',fontWeight:700,padding:'1px 5px',border:'none',cursor:'pointer',borderRadius:'3px',
                background:hasPen?'rgba(251,146,60,.25)':'rgba(255,255,255,.08)',
                color:hasPen?'#fb923c':'rgba(255,255,255,.3)',transition:'all .15s'}}>
              {hasPen?'⚽ PENS':'+ PEN'}
            </button>
            {hasPen&&<span style={{fontSize:'8px',color:'rgba(251,146,60,.7)',letterSpacing:.5}}>Definido por penaltis</span>}
          </div>
        )}
      </div>
    )
  }

  // PhaseCol with connector lines between matches going to the next round
  function PhaseColWithConnectors({label,matches,phase,startIdx,side}){
    // side: 'left' connectors go right, 'right' connectors go left
    const isRight = side==='right'
    return(
      <div style={{display:'flex',flexDirection:'column',flex:1,minWidth:'140px',position:'relative'}}>
        <div style={{fontFamily:'Bebas Neue',fontSize:'10px',color:'var(--gold)',letterSpacing:1,
          textAlign:'center',marginBottom:'8px',textTransform:'uppercase',padding:'3px 0',
          background:'rgba(246,201,14,.08)',borderRadius:'4px',border:'1px solid rgba(246,201,14,.18)'}}>
          {label}
        </div>
        <div style={{display:'flex',flexDirection:'column',justifyContent:'space-around',gap:'8px',flex:1,position:'relative'}}>
          {matches.map((m,i)=>(
            <div key={i} style={{position:'relative'}}>
              <MatchCard phase={phase} idx={startIdx+i} match={m}/>
              {/* Connector: horizontal line from card edge */}
              <div style={{
                position:'absolute',
                top:'50%',
                [isRight?'left':'right']:'-18px',
                width:'18px',
                height:'1px',
                background:'rgba(246,201,14,.45)',
                transform:'translateY(-50%)',
              }}/>
              {/* Vertical bracket line: connects pairs */}
              {i%2===0&&matches[i+1]&&(
                <div style={{
                  position:'absolute',
                  top:'50%',
                  [isRight?'left':'right']:'-18px',
                  width:'1px',
                  // Height from center of this card to center of next card
                  height:'calc(100% + 8px + 100%)',
                  background:'rgba(246,201,14,.45)',
                }}/>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const gap = '18px'  // wider to fit connectors

  return(
    <div style={{overflowX:'auto',width:'100%',minWidth:0}}>
      <div style={{display:'flex',gap:gap,alignItems:'stretch',width:'100%',padding:'4px 8px'}}>
        <PhaseColWithConnectors label='Round of 32' matches={r32.slice(0,8)} phase='round32' startIdx={0} side='left'/>
        <PhaseColWithConnectors label='Round of 16' matches={r16.slice(0,4)} phase='round16' startIdx={0} side='left'/>
        <PhaseColWithConnectors label='Cuartos' matches={qf.slice(0,2)} phase='quarters' startIdx={0} side='left'/>
        <PhaseColWithConnectors label='Semifinales' matches={sf.slice(0,1)} phase='semis' startIdx={0} side='left'/>

        {/* CENTER: Final */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:'170px',
          width:'170px',justifyContent:'center',gap:'12px'}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:'10px',color:'var(--gold)',letterSpacing:1,
            textAlign:'center',padding:'3px 0',width:'100%',
            background:'rgba(246,201,14,.08)',borderRadius:'4px',border:'1px solid rgba(246,201,14,.2)'}}>GRAN FINAL</div>
          <MatchCard phase='final' idx={0} match={fin}/>
          {fin.winner?(
            <div style={{background:'linear-gradient(135deg,rgba(246,201,14,.22),rgba(246,201,14,.08))',
              border:'2px solid var(--gold)',borderRadius:'10px',padding:'8px 10px',textAlign:'center',width:'100%',
              boxShadow:'0 0 20px rgba(246,201,14,.2)'}}>
              <div style={{fontSize:'10px',fontWeight:700,color:'var(--gold)',letterSpacing:1}}>🏆 CAMPEÓN</div>
              <div style={{fontSize:'13px',fontWeight:700,color:'#fff',marginTop:'3px'}}>
                {f(fin.winner)} {es(fin.winner)}
              </div>
            </div>
          ):(
            <div style={{background:'rgba(246,201,14,.04)',border:'1.5px dashed rgba(246,201,14,.3)',
              borderRadius:'8px',padding:'10px',textAlign:'center',width:'100%'}}>
              <div style={{fontSize:'1.5rem'}}>🏆</div>
              <div style={{fontSize:'9px',color:'rgba(246,201,14,.5)',marginTop:'3px'}}>Por definir</div>
            </div>
          )}
          <div style={{width:'100%'}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'9px',color:'rgba(255,255,255,.3)',letterSpacing:1,
              textAlign:'center',marginBottom:'5px'}}>3ER PUESTO</div>
            <MatchCard phase='third' idx={0} match={trd}/>
          </div>
        </div>

        <PhaseColWithConnectors label='Semifinales' matches={sf.slice(1,2)} phase='semis' startIdx={1} side='right'/>
        <PhaseColWithConnectors label='Cuartos' matches={qf.slice(2,4)} phase='quarters' startIdx={2} side='right'/>
        <PhaseColWithConnectors label='Round of 16' matches={r16.slice(4,8)} phase='round16' startIdx={4} side='right'/>
        <PhaseColWithConnectors label='Round of 32' matches={r32.slice(8,16)} phase='round32' startIdx={8} side='right'/>
      </div>
    </div>
  )
}


// ─── BOARD PAGE ───────────────────────────────────────────────────────────────
function BoardPage(){
  const {user,matches,activeAvatar,setView}=useApp()
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
                        {hasResult&&<span className={('pts-badge '+(pts>=PHASE_PTS[ph]?.exact?'pts-exact':pts>0?'pts-win':'pts-miss'))}>{pts>0?`+${pts}pts`:'Sin pts'}</span>}
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
        <h2 style={{fontFamily:'Bebas Neue',fontSize:'1.5rem',marginBottom:'.25rem'}}>🏅 RANKING</h2>
        <p className="text-muted text-xs mb2">Se actualiza en tiempo real · {ranking.length} participantes activos</p>

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
          {ranking.length===0&&<div style={{padding:'2rem',textAlign:'center',color:'var(--ink3)'}}>Aún no hay participantes activos 🏆</div>}
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
      activeAvatar?.id?api(`/api/results/${activeAvatar.id}`):Promise.resolve([]),
      activeAvatar?.id?api(`/api/special/${activeAvatar.id}`):Promise.resolve([])
    ]).then(([r,s])=>{
      setResults(Array.isArray(r)?r:[])
      setSpecial(s&&typeof s==='object'&&!Array.isArray(s)?s:null)
    }).catch(()=>{setResults([]);setSpecial(null)}).finally(()=>setLoading(false))
  },[activeAvatar])

  if(loading) return <div className="page"><Nav/><Spinner/></div>

  const totalPts=Array.isArray(results)?results.reduce((s,r)=>(r.points_earned||0)+(r.extra_pts||0)+s,0):0
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

        {(!results||results.length===0)&&(
          <div className="card text-center">
            <div style={{fontSize:'2rem',marginBottom:'.5rem'}}>⚽</div>
            <div className="text-muted">Aún no hay partidos con resultado oficial.</div>
            <button className="btn btn-ink btn-sm mt2" onClick={()=>setView('chat')}>¡Ir a pronosticar!</button>
          </div>
        )}

        {(results||[]).map(r=>{
          const pts=(r.points_earned||0)+(r.extra_pts||0)
          const exact=r.points_earned>=PHASE_PTS[r.phase]?.exact
          return(
            <div key={r.id} className={'match-row'+(pts>0?' match-row-done':'')} style={{marginBottom:'.4rem'}}>
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
  const {user,tournament,setView}=useApp()
  const [tab,setTab]=React.useState('users')
  if(!user?.isAdmin) return null

  const navItems=[
    {k:'users',icon:'👥',l:'Participantes'},
    {k:'trivia',icon:'🧠',l:'Extra Points'},
    {k:'results',icon:'📊',l:'Resultados'},
    {k:'locks',icon:'🔒',l:'Fases'},
    {k:'teams',icon:'⚽',l:'Equipos'},
    {k:'config',icon:'⚙️',l:'Configuración'},
  ]

  return(
    <div className="page" style={{flexDirection:'row',minHeight:'100vh'}}>
      {/* Sidebar */}
      <div className="adm-sidebar">
        <div className="adm-sidebar-header">
          <img src={tournament?.logo_url||"/logo.png"} style={{width:28,height:28,objectFit:'contain',borderRadius:6,border:'1px solid var(--border)',flexShrink:0}} alt=""/>
          <div style={{minWidth:0}}>
            <div style={{fontSize:'12px',fontWeight:700,color:'var(--ink)',lineHeight:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tournament?.name||'Mi Polla'}</div>
            <div style={{fontSize:'9px',color:'var(--ink3)',marginTop:1}}>Admin · Panel</div>
          </div>
        </div>
        {navItems.map(({k,icon,l})=>(
          <button key={k} className={`adm-nav-btn ${tab===k?'adm-nav-on':''}`} onClick={()=>setTab(k)}>
            <span style={{fontSize:'14px',flexShrink:0}}>{icon}</span>
            <span className="adm-nav-label">{l}</span>
          </button>
        ))}
        <div style={{marginTop:'auto',padding:'10px 12px',borderTop:'1px solid var(--border)'}}>
          <button className="btn btn-outline btn-sm btn-full" onClick={()=>setView('dashboard')}>← App</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,background:'var(--cream2)'}}>
        <div style={{background:'var(--white)',borderBottom:'1px solid var(--border)',padding:'12px 18px',
          display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:'1.15rem',letterSpacing:1,color:'var(--ink)'}}>
            {navItems.find(n=>n.k===tab)?.icon} {navItems.find(n=>n.k===tab)?.l||'Admin'}
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:'10px',color:'var(--ink3)',background:'var(--cream2)',border:'1px solid var(--border)',borderRadius:6,padding:'3px 8px'}}>
              {tournament?.slug?`lapollaia.com/t/${tournament.slug}`:''}
            </span>
          </div>
        </div>
        <div style={{flex:1,padding:'1.1rem',overflow:'auto'}}>
          {tab==='users'&&<AdminUsers/>}
          {tab==='locks'&&<AdminLocks/>}
          {tab==='teams'&&<AdminTeams/>}
          {tab==='results'&&<AdminResults/>}
          {tab==='trivia'&&<AdminTrivia/>}
          {tab==='config'&&<AdminConfig/>}
        </div>
      </div>
    </div>
  )
}

function AdminTrivia(){
  const {activeAvatar}=useApp()
  const [questions,setQuestions]=React.useState([])
  const [loading,setLoading]=React.useState(true)
  const [generating,setGenerating]=React.useState(false)
  const [saving,setSaving]=React.useState(false)
  const [msg,setMsg]=React.useState(null)
  const [showForm,setShowForm]=React.useState(false)
  const [topic,setTopic]=React.useState('')
  const [difficulty,setDifficulty]=React.useState('easy')
  const [draft,setDraft]=React.useState(null) // AI-generated draft
  const [editDraft,setEditDraft]=React.useState(null) // editable version

  const DIFF_LABELS={easy:'🟢 Fácil (2 pts)',medium:'🟡 Refácil (3 pts)',hard:'🔴 Muy fácil (4 pts)'}
  const DIFF_COLORS={easy:'#16a34a',medium:'#d97706',hard:'#dc2626'}

  React.useEffect(()=>{ loadQuestions() },[])

  async function loadQuestions(){
    setLoading(true)
    try{ const d=await api('/api/admin/trivia'); setQuestions(d||[]) }
    catch(e){ setMsg({type:'error',text:e.message}) }
    setLoading(false)
  }

  async function generateWithAI(){
    if(!topic.trim()){ setMsg({type:'error',text:'Escribe un tema primero'}); return }
    setGenerating(true); setMsg(null); setDraft(null)
    try{
      const d=await api('/api/admin/trivia/generate','POST',{topic,difficulty})
      setDraft(d)
      setEditDraft({...d, options:[...d.options]})
    }catch(e){ setMsg({type:'error',text:e.message}) }
    setGenerating(false)
  }

  async function saveQuestion(){
    if(!editDraft) return
    setSaving(true); setMsg(null)
    try{
      const q=await api('/api/admin/trivia','POST',{
        question:editDraft.question,
        options:editDraft.options,
        correct_answer:editDraft.correct_answer,
        difficulty
      })
      setQuestions(p=>[q,...p])
      setDraft(null); setEditDraft(null); setTopic(''); setShowForm(false)
      setMsg({type:'success',text:'✅ Pregunta creada y publicada para todos los jugadores!'})
    }catch(e){ setMsg({type:'error',text:e.message}) }
    setSaving(false)
  }

  async function toggleQuestion(id){
    try{
      const d=await api('/api/admin/trivia/'+id+'/toggle','PUT',{})
      setQuestions(p=>p.map(q=>q.id===id?{...q,is_active:d.is_active}:q))
    }catch(e){ setMsg({type:'error',text:e.message}) }
  }

  async function deleteQuestion(id){
    if(!window.confirm('¿Eliminar esta pregunta? Los jugadores que ya respondieron conservan sus puntos.')) return
    try{
      await api('/api/admin/trivia/'+id,'DELETE',null)
      setQuestions(p=>p.filter(q=>q.id!==id))
    }catch(e){ setMsg({type:'error',text:e.message}) }
  }

  return(
    <div>
      {/* Header card */}
      <div className="card" style={{marginBottom:'1rem',background:'linear-gradient(135deg,#0d1117,#111827)',border:'1.5px solid rgba(246,201,14,.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'1rem'}}>
          <div style={{width:44,height:44,borderRadius:'50%',overflow:'hidden',border:'2px solid var(--gold)',flexShrink:0}}>
            <img src="/pele.jpg" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}} alt="Pele"/>
          </div>
          <div>
            <div style={{fontFamily:'Bebas Neue',fontSize:'1.1rem',color:'var(--gold)',letterSpacing:1}}>EXTRA POINTS CON PELÉ IA</div>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,.5)',marginTop:2}}>Crea preguntas de trivia de fútbol. Los jugadores responden desde su tablero y suman puntos extra.</div>
          </div>
        </div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'1rem'}}>
          <div style={{background:'rgba(22,163,74,.12)',border:'1px solid rgba(22,163,74,.3)',borderRadius:8,padding:'6px 12px',fontSize:11,color:'#4ade80'}}>🟢 Fácil — 2 pts</div>
          <div style={{background:'rgba(217,119,6,.12)',border:'1px solid rgba(217,119,6,.3)',borderRadius:8,padding:'6px 12px',fontSize:11,color:'#fbbf24'}}>🟡 Refácil — 3 pts</div>
          <div style={{background:'rgba(220,38,38,.12)',border:'1px solid rgba(220,38,38,.3)',borderRadius:8,padding:'6px 12px',fontSize:11,color:'#f87171'}}>🔴 Muy fácil — 4 pts</div>
        </div>
        {!showForm?(
          <button className="btn btn-gold btn-full" onClick={()=>setShowForm(true)}>🤖 Crear nueva pregunta con Pelé IA</button>
        ):(
          <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:10,padding:'1rem'}}>
            <div style={{fontWeight:700,color:'#fff',marginBottom:'0.75rem',fontSize:13}}>🤖 Pelé IA genera la pregunta</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,marginBottom:8}}>
              <input className="inp" placeholder="Tema: ej. Goleadores historicos del Mundial, Reglas del futbol..." value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==='Enter'&&generateWithAI()}/>
              <select className="inp" value={difficulty} onChange={e=>setDifficulty(e.target.value)} style={{width:130}}>
                <option value="easy">Fácil (2 pts)</option>
                <option value="medium">Refácil (3 pts)</option>
                <option value="hard">Muy fácil (4 pts)</option>
              </select>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:draft?'1rem':0}}>
              <button className="btn btn-gold" onClick={generateWithAI} disabled={generating} style={{flex:1}}>
                {generating?'⏳ Generando...':(draft?'🔄 Regenerar':'✨ Generar con Pelé IA')}
              </button>
              <button className="btn btn-outline" onClick={()=>{setShowForm(false);setDraft(null);setEditDraft(null)}}>Cancelar</button>
            </div>

            {generating&&(
              <div style={{textAlign:'center',padding:'1rem 0',color:'rgba(255,255,255,.5)',fontSize:12}}>
                <div style={{fontSize:'1.5rem',marginBottom:6}}>🤔</div>
                Pelé IA está pensando la pregunta perfecta...
              </div>
            )}

            {editDraft&&(
              <div style={{marginTop:'1rem'}}>
                <div style={{height:1,background:'rgba(255,255,255,.08)',margin:'0 0 1rem'}}/>
                <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Edita si quieres antes de guardar</div>
                <textarea className="inp" rows={3} value={editDraft.question} onChange={e=>setEditDraft(p=>({...p,question:e.target.value}))} style={{marginBottom:8,resize:'vertical'}}/>
                {editDraft.options.map((opt,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <button onClick={()=>setEditDraft(p=>({...p,correct_answer:i}))}
                      style={{width:22,height:22,borderRadius:'50%',border:'none',cursor:'pointer',flexShrink:0,
                        background:editDraft.correct_answer===i?'var(--gold)':'rgba(255,255,255,.15)',transition:'all .15s'}} title="Marcar como correcta"/>
                    <input className="inp" value={opt} onChange={e=>{const o=[...editDraft.options];o[i]=e.target.value;setEditDraft(p=>({...p,options:o}))}}
                      style={{flex:1,fontSize:12,borderColor:editDraft.correct_answer===i?'rgba(246,201,14,.5)':'rgba(255,255,255,.12)'}}/>
                    <span style={{fontSize:10,color:'rgba(255,255,255,.3)',flexShrink:0}}>{editDraft.correct_answer===i?'✅ Correcta':''}</span>
                  </div>
                ))}
                {editDraft.explanation&&(
                  <div style={{background:'rgba(246,201,14,.06)',border:'1px solid rgba(246,201,14,.15)',borderRadius:8,padding:'8px 12px',fontSize:11,color:'rgba(255,255,255,.5)',marginBottom:12}}>
                    💡 {editDraft.explanation}
                  </div>
                )}
                <button className="btn btn-gold btn-full" onClick={saveQuestion} disabled={saving}>
                  {saving?'Guardando...':'💾 Publicar pregunta — aparece en el tablero de todos'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {msg&&<Alert type={msg.type} style={{marginBottom:'1rem'}}>{msg.text}</Alert>}

      {/* Questions list */}
      <div style={{fontFamily:'Bebas Neue',fontSize:'1rem',letterSpacing:1,color:'var(--ink)',marginBottom:'0.5rem'}}>{questions.length} PREGUNTA{questions.length!==1?'S':''} CREADA{questions.length!==1?'S':''}</div>
      {loading?<Spinner/>:(
        questions.length===0?(
          <div className="card" style={{textAlign:'center',padding:'2rem',color:'var(--ink3)'}}>
            <div style={{fontSize:'2rem',marginBottom:8}}>🧠</div>
            <div style={{fontWeight:700,marginBottom:4}}>Aún no hay preguntas</div>
            <div style={{fontSize:12}}>Crea la primera con Pelé IA y aparecerá en el tablero de tus jugadores automáticamente.</div>
          </div>
        ):(
          questions.map(q=>(
            <div key={q.id} className="card" style={{marginBottom:'0.75rem',borderLeft:`3px solid ${DIFF_COLORS[q.difficulty]||'var(--gold)'}`,opacity:q.is_active?1:0.5}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:6}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--ink)',marginBottom:4}}>{q.question}</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    <span style={{fontSize:10,background:DIFF_COLORS[q.difficulty]+'20',color:DIFF_COLORS[q.difficulty],border:'1px solid '+DIFF_COLORS[q.difficulty]+'40',borderRadius:20,padding:'2px 8px',fontWeight:700}}>{DIFF_LABELS[q.difficulty]}</span>
                    <span style={{fontSize:10,color:'var(--ink3)'}}>{ℹ️} {q.answer_count||0} resp · {q.correct_count||0} correctas</span>
                    {!q.is_active&&<span style={{fontSize:10,color:'var(--ink3)',background:'var(--cream2)',border:'1px solid var(--border)',borderRadius:20,padding:'2px 8px'}}>💤 Oculta</span>}
                  </div>
                </div>
                <div style={{display:'flex',gap:5,flexShrink:0}}>
                  <button className="btn btn-outline btn-sm" onClick={()=>toggleQuestion(q.id)}>{q.is_active?'💤 Ocultar':'👁️ Mostrar'}</button>
                  <button className="btn btn-sm" style={{background:'rgba(220,38,38,.1)',color:'#dc2626',border:'1px solid rgba(220,38,38,.2)'}} onClick={()=>deleteQuestion(q.id)}>🗑️</button>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                {(q.options||[]).map((opt,i)=>(
                  <div key={i} style={{fontSize:11,padding:'4px 8px',borderRadius:6,
                    background:i===q.correct_answer?'rgba(22,163,74,.12)':'rgba(255,255,255,.02)',
                    border:'1px solid '+(i===q.correct_answer?'rgba(22,163,74,.3)':'rgba(0,0,0,.05)'),
                    color:i===q.correct_answer?'#16a34a':'var(--ink2)',fontWeight:i===q.correct_answer?700:400}}>
                    {['A','B','C','D'][i]}. {opt} {i===q.correct_answer?'✅':''}
                  </div>
                ))}
              </div>
            </div>
          ))
        )
      )}
    </div>
  )
}

function AdminUsers(){
  const [users,setUsers]=React.useState([])
  const [loading,setLoading]=React.useState(true)
  const [search,setSearch]=React.useState('')
  const [detail,setDetail]=React.useState(null) // {userId, name, bg}
  const [detailData,setDetailData]=React.useState(null)
  const [detailTab,setDetailTab]=React.useState('predictions')
  const [loadingDetail,setLoadingDetail]=React.useState(false)

  React.useEffect(()=>{
    api('/api/admin/users').then(d=>{setUsers(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  async function toggleAvatar(avId,field,val){
    try{
      await api(`/api/admin/avatars/${avId}`,'PUT',{[field]:val})
      setUsers(us=>us.map(u=>({...u,avatars:(u.avatars||[]).map(a=>a.id===avId?{...a,is_active:val}:a)})))
    }catch(e){alert(e.message)}
  }

  async function deleteUser(uid,name,e){
    e&&e.stopPropagation()
    if(!confirm(`¿Eliminar a "${name}" y todos sus datos?`)) return
    try{
      await api(`/api/admin/users/${uid}`,'DELETE')
      setUsers(us=>us.filter(u=>u.id!==uid))
    }catch(e){alert('Error: '+e.message)}
  }

  async function openDetail(u,e){
    e&&e.stopPropagation()
    const bg=generateAvatarColor(u.name||'x')
    setDetail({userId:u.id,name:u.name,email:u.email,bg,created_at:u.created_at})
    setDetailTab('predictions')
    setLoadingDetail(true)
    try{
      const d=await api(`/api/admin/users/${u.id}/details`)
      setDetailData(d)
    }catch(err){ setDetailData(null) }
    setLoadingDetail(false)
  }

  if(loading) return <Spinner/>

  // ── DETAIL VIEW ──
  if(detail){
    const initials=(detail.name||'?').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()
    const d=detailData
    const approved=d?.avatars?.[0]?.is_active
    return(
      <div>
        <button className="btn btn-outline btn-sm" style={{marginBottom:'1rem'}} onClick={()=>{setDetail(null);setDetailData(null)}}>← Volver a participantes</button>
        {/* User header */}
        <div className="card" style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1rem',flexWrap:'wrap'}}>
          <AvatarCircle nickname={detail.name||'?'} size={52}/>
          <div style={{flex:1}}>
            <div style={{fontSize:'15px',fontWeight:700,color:'var(--ink)'}}>{detail.name}</div>
            <div style={{fontSize:'11px',color:'var(--ink3)',marginTop:'2px'}}>{detail.email} · Se unió {detail.created_at?new Date(detail.created_at).toLocaleDateString('es-CO'):''}</div>
            <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap',alignItems:'center'}}>
              {approved
                ?<span className="chip chip-g">✅ Aprobado</span>
                :<span className="chip chip-gold">⏳ Pendiente aprobación</span>}
              <span style={{fontSize:'11px',color:'var(--ink3)'}}>
                {d?.stats?.played||0} pronósticos jugados ·
                <strong style={{color:'var(--gold)',marginLeft:4}}>{d?.stats?.total||0} pts</strong>
              </span>
            </div>
          </div>
          <div style={{display:'flex',gap:6,flexShrink:0}}>
            {d?.avatars?.[0]&&(
              <button className={`btn btn-sm ${d.avatars[0].is_active?'btn-red':'btn-green'}`}
                onClick={()=>{
                  const av=d.avatars[0]; const newVal=!av.is_active
                  toggleAvatar(av.id,'isActive',newVal)
                  setDetailData(dd=>({...dd,avatars:dd.avatars.map(a=>a.id===av.id?{...a,is_active:newVal}:a)}))
                }}>
                {d.avatars[0].is_active?'🚫 Suspender':'✅ Aprobar'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:4,marginBottom:'1rem',background:'var(--cream2)',borderRadius:'50px',padding:3,width:'fit-content'}}>
          {[['predictions','Pronósticos'],['special','Predicciones especiales'],['bracket','Bracket']].map(([k,l])=>(
            <button key={k} onClick={()=>setDetailTab(k)}
              style={{padding:'6px 14px',borderRadius:'50px',fontSize:'11px',fontWeight:600,border:'none',cursor:'pointer',transition:'all .15s',
                background:detailTab===k?'var(--white)':'transparent',
                color:detailTab===k?'var(--ink)':'var(--ink3)',
                boxShadow:detailTab===k?'0 1px 3px rgba(26,24,20,.1)':'none'}}>
              {l}
            </button>
          ))}
        </div>

        {loadingDetail&&<Spinner/>}

        {!loadingDetail&&detailTab==='predictions'&&(
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1.3fr',background:'var(--cream2)',borderBottom:'1px solid var(--border)'}}>
              {['Partido','Pronóstico','Pts','Ingresado'].map(h=>(
                <div key={h} style={{fontSize:'10px',fontWeight:700,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'.5px',padding:'9px 12px'}}>{h}</div>
              ))}
            </div>
            {(d?.predictions||[]).slice(0,50).map((p,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1.3fr',borderBottom:'1px solid var(--border)',alignItems:'center'}}>
                <div style={{padding:'9px 12px'}}>
                  <div style={{fontSize:'12px',fontWeight:700,color:'var(--ink)'}}>{es(p.team1)} vs {es(p.team2)}</div>
                  <div style={{fontSize:'10px',color:'var(--ink3)'}}>{PHASE_LABELS[p.phase]||p.phase}{p.group_name?` · Grupo ${p.group_name}`:''}</div>
                </div>
                <div style={{padding:'9px 12px',fontWeight:700,color:'var(--gold)',fontSize:'13px'}}>{p.score_home} – {p.score_away}</div>
                <div style={{padding:'9px 12px'}}>
                  {p.points_earned>0
                    ?<span className="chip chip-g">+{p.points_earned}</span>
                    :p.real_home!=null
                      ?<span className="chip chip-ink">+0</span>
                      :<span style={{fontSize:'11px',color:'var(--ink3)'}}>Pendiente</span>}
                </div>
                <div style={{padding:'9px 12px',fontSize:'10px',color:'var(--ink3)'}}>
                  {p.predicted_at?new Date(p.predicted_at).toLocaleString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}
                </div>
              </div>
            ))}
            {(!d?.predictions||d.predictions.length===0)&&(
              <div style={{padding:'2rem',textAlign:'center',color:'var(--ink3)',fontSize:'13px'}}>Sin pronósticos aún</div>
            )}
          </div>
        )}

        {!loadingDetail&&detailTab==='special'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            {[
              ['Campeón del torneo',d?.special?.champion_team,'+10 pts'],
              ['Equipo sorpresa',d?.special?.surprise_team,'+3 pts'],
              ['Balón de Oro',d?.special?.balon_de_oro,'+5 pts'],
              ['Guante de Oro',d?.special?.guante_de_oro,'+5 pts'],
              ['Bota de Oro',d?.special?.bota_de_oro,'+5 pts'],
            ].map(([label,val,pts])=>(
              <div key={label} className="card-sm" style={label==='Campeón del torneo'?{gridColumn:'span 2'}:{}}>
                <div style={{fontSize:'10px',fontWeight:700,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>{label}</div>
                <div style={{fontSize:'14px',fontWeight:700,color:'var(--ink)'}}>{val?`${f(val)?.[0]!=='❓'?f(val):''} ${es(val)||val}`:'—'}</div>
                <div style={{fontSize:'11px',color:'var(--ink3)',marginTop:2}}>{pts} si acierta</div>
              </div>
            ))}
          </div>
        )}

        {!loadingDetail&&detailTab==='bracket'&&(
          <div className="card">
            {d?.bracket?.bracket?(
              <>
                <div style={{fontWeight:700,fontSize:'13px',marginBottom:'8px'}}>
                  Campeón pronosticado: {d.bracket.bracket.champion?`${f(d.bracket.bracket.champion)} ${es(d.bracket.bracket.champion)}`:'No definido'}
                </div>
                <div style={{fontSize:'11px',color:'var(--ink3)',marginBottom:'12px'}}>
                  {d.bracket.locked_at?`Confirmado ${new Date(d.bracket.locked_at).toLocaleDateString('es-CO')}`:'No confirmado'}
                  {' · '}{d.bracket.has_been_edited?'Editado después de generarse':'Sin editar'}
                  {' · '}{d.bracket.is_ai_generated?'Generado con Pelé IA':'Manual'}
                </div>
                <div style={{overflowX:'auto'}}>
                  {[['round32','R32'],['round16','R16'],['quarters','QF'],['semis','SF']].map(([phase,label])=>(
                    <div key={phase} style={{marginBottom:'8px'}}>
                      <div style={{fontSize:'10px',fontWeight:700,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>{label}</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                        {(d.bracket.bracket[phase]||[]).map((m,i)=>(
                          <div key={i} style={{background:'var(--cream2)',border:`1px solid ${m.winner?'var(--gold-border)':'var(--border)'}`,borderRadius:6,padding:'3px 8px',fontSize:'10px',
                            color:m.winner?'var(--gold)':'var(--ink2)',fontWeight:m.winner?700:400}}>
                            {m.winner?`✓ ${es(m.winner)} ${m.home_score}–${m.away_score}`:`${es(m.home)||'?'} vs ${es(m.away)||'?'}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{marginTop:'8px',padding:'10px',background:'var(--gold-bg)',border:'1px solid var(--gold-border)',borderRadius:8}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:'var(--gold)'}}>
                      🏆 Final: {d.bracket.bracket.final?.home?`${es(d.bracket.bracket.final.home)} ${d.bracket.bracket.final.home_score}–${d.bracket.bracket.final.away_score} ${es(d.bracket.bracket.final.away)}`:'Por definir'}
                    </div>
                  </div>
                </div>
              </>
            ):(
              <div style={{textAlign:'center',color:'var(--ink3)',fontSize:'13px',padding:'1rem'}}>No ha generado bracket todavía</div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── LIST VIEW ──
  const filtered=users.filter(u=>!search||u.name?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase()))
  const approved=filtered.filter(u=>(u.avatars||[]).some(a=>a.is_active)).length
  const pending=filtered.length-approved

  return(
    <div>
      {/* Approval info banner */}
      <div className="card" style={{background:'rgba(200,168,75,.06)',border:'1px solid var(--gold-border)',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:'1rem',display:'flex',gap:10,alignItems:'flex-start'}}>
        <span style={{fontSize:'14px',flexShrink:0}}>ℹ️</span>
        <div style={{fontSize:'11px',color:'var(--ink2)',lineHeight:1.6}}>
          <strong>Sistema de aprobación:</strong> Los participantes pueden registrarse y cargar pronósticos libremente.
          Sus resultados quedan guardados pero <strong>no suman puntos al ranking hasta que los apruebes.</strong>
          Si apruebas después de que empezó el torneo, los puntos se calculan retroactivamente.
        </div>
      </div>

      {/* Stats row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'1rem'}}>
        <div className="stat-card"><div className="stat-n">{filtered.length}</div><div className="stat-l">Total</div></div>
        <div className="stat-card"><div className="stat-n" style={{color:'var(--green)'}}>{approved}</div><div className="stat-l">Aprobados</div></div>
        <div className="stat-card"><div className="stat-n" style={{color:'var(--gold)'}}>{pending}</div><div className="stat-l">Pendientes</div></div>
      </div>

      {/* Search */}
      <input className="inp" style={{marginBottom:'1rem'}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar participante..."/>

      {filtered.map(u=>{
        const mainAv=(u.avatars||[])[0]
        const isApproved=mainAv?.is_active
        return(
          <div key={u.id} className="card-sm" style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px',cursor:'pointer',transition:'all .12s'}}
            onClick={()=>openDetail(u)}>
            <AvatarCircle nickname={u.name||'?'} size={40}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'13px',fontWeight:700,color:'var(--ink)'}}>{u.name}</div>
              <div style={{fontSize:'10px',color:'var(--ink3)',marginTop:'1px'}}>{u.email}</div>
              <div style={{display:'flex',gap:5,marginTop:4,flexWrap:'wrap',alignItems:'center'}}>
                {isApproved
                  ?<span className="chip chip-g" style={{fontSize:'9px'}}>✅ Aprobado</span>
                  :<span className="chip chip-gold" style={{fontSize:'9px'}}>⏳ Pendiente</span>}
                <span style={{fontSize:'10px',color:'var(--ink3)'}}>{new Date(u.created_at).toLocaleDateString('es-CO')}</span>
              </div>
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}} onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <Toggle on={!!isApproved} onChange={v=>mainAv&&toggleAvatar(mainAv.id,'isActive',v)}/>
                <span style={{fontSize:'10px',color:'var(--ink3)',minWidth:50}}>{isApproved?'Activo':'Aprobar'}</span>
              </div>
              <button className="btn btn-sm" style={{padding:'4px 10px',fontSize:'11px',background:'var(--gold-bg)',color:'var(--gold)',border:'1px solid var(--gold-border)'}}
                onClick={(e)=>{e.stopPropagation();openDetail(u,e)}}>Ver →</button>
              <button className="btn btn-sm" style={{padding:'4px 8px',fontSize:'10px',background:'var(--red-bg)',color:'var(--red)',border:'1px solid rgba(192,57,43,.18)'}}
                onClick={(e)=>deleteUser(u.id,u.name,e)}>🗑</button>
            </div>
          </div>
        )
      })}
      {filtered.length===0&&<div style={{textAlign:'center',padding:'2rem',color:'var(--ink3)',fontSize:'13px'}}>No hay participantes aún. Comparte el link de tu polla.</div>}
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
      predictions_open:settings.predictions_open===true||settings.predictions_open==='true',
      primary_color:settings.primary_color||'#F6C90E',
    })
  },[settings])

  async function save(e){
    e.preventDefault(); setLoading(true); setMsg(null)
    try{
      await api('/api/admin/tournament','PUT',{
        predictions_open:form.predictions_open,
        primary_color:form.primary_color
      })
      await api('/api/settings','PUT',{
        predictions_open:form.predictions_open,
        primary_color:form.primary_color
      })
      setSettings(s=>({...s,...form}))
      if(tournament) setTournament(t=>({...t,primary_color:form.primary_color}))
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
              primary_color:t.primary_color||'#F6C90E',
            })
            if(t.primary_color&&t.primary_color!=='#F6C90E')
              document.documentElement.style.setProperty('--gold',t.primary_color)
            document.title=t.name+' · La Polla IA'
          } else if(t.error) {
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
            const first=avs.find(a=>a.is_active)||avs[0]
            setActiveAvatar(first)
          }
          if(!u.termsAccepted) setView('terms')
          else setView('dashboard')
        }).catch(()=>{ localStorage.removeItem('polla_token') })
      }
    }
    init()
  },[])

  React.useEffect(()=>{
    if(avatars.length&&!activeAvatar){
      const first=avatars.find(a=>a.is_active)||avatars[0]
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


  return(
    <AppCtx.Provider value={ctx}>

      {view==='landing'&&<LandingPage/>}

      {/* Auth views — wrap in page shell */}
      {view==='auth'&&(user?<>{setView('dashboard')&&null}</>:<AuthPage/>)}

      {/* Modals over landing */}
      {view==='terms'&&<><LandingPage/><TermsPage/></>}
      {view==='guide'&&<><LandingPage/><GuidePage/></>}

      {/* Authenticated views */}
      {view==='avatars'&&<DashboardPage/>}
      {view==='special'&&<SpecialPredictionsPage/>}
      {view==='bracket'&&<BracketPage/>}
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
