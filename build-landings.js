// Build script: generates prospect-specific landings (universidades, clubes, edificios, conjuntos)
// sharing a common template. Keep SEO long-tail consistent across pages.
// Run: node build-landings.js

const fs = require('fs')
const path = require('path')

// 100 long-tail keywords (no FIFA, no World Cup, no "mundial fifa 2026")
const LONG_TAIL = [
  'polla entre amigos','crear una polla online','polla del mundial','polla mundialista','polla mundial 2026',
  'polla virtual del mundial 2026','polla privada del torneo 2026','polla online gratis 2026','polla para empresas','polla para oficina',
  'polla para universidades','polla para colegios','polla para clubes','polla para edificios','polla para conjuntos residenciales',
  'polla para condominios','polla para amigos','polla para familia','polla para empleados','polla entre compañeros',
  'polla entre colegas','polla entre vecinos','polla entre estudiantes','polla entre profesores','polla entre socios',
  'polla entre primos','polla de oficina del torneo 2026','polla corporativa 2026','polla corporativa del torneo','polla corporativa con IA',
  'polla con inteligencia artificial','polla con IA gratis','polla con bracket interactivo','polla con ranking automatico','polla con pronosticos automaticos',
  'polla con chat de futbol','polla con trivia incluida','polla privada con link','polla privada con logo de empresa','polla privada para conjuntos',
  'polla digital del torneo 2026','polla digital gratis','polla digital para empresas','polla online privada','polla online con IA',
  'polla online para empresas','polla online para universidades','polla online para edificios','polla online para equipos deportivos','polla online entre amigos',
  'polla entre amigos online gratis','polla entre amigos con IA','hacer una polla entre amigos','hacer una polla online con IA','crear polla entre amigos',
  'crear polla online gratis','crear polla corporativa','crear polla para mi empresa','crear polla para mi universidad','crear polla para mi club',
  'crear polla para mi edificio','crear polla para mi conjunto','crear bracket online 2026','crear bracket del torneo 2026','generar bracket con IA',
  'bracket interactivo del torneo 2026','bracket del campeonato 2026','pronosticos futbol 2026','pronosticos con IA del torneo 2026','pronosticos del torneo 2026',
  'pronosticos campeon 2026','pronosticador de futbol con IA','quiniela futbol 2026','quiniela del torneo 2026','quiniela online 2026',
  'quiniela entre amigos 2026','quiniela para empresas 2026','quiniela para universidades','quiniela para edificios','quiniela para conjuntos',
  'porra futbol 2026','porra entre amigos','porra para empresas 2026','torneo de pronosticos 2026','concurso de pronosticos 2026',
  'juego de pronosticos 2026','plataforma de pollas','plataforma de pronosticos futbol','plataforma de quinielas','ranking automatico polla',
  'mejor polla online 2026','mejor polla para empresas','mejor polla para universidades','polla barata 2026','polla con logo corporativo',
  'polla con colores de mi marca','polla con whatsapp','polla sin apps','polla sin cuenta','polla con pele IA'
]

const PROSPECTS = {
  empresas: {
    slug: 'empresas', emoji: '🏢', audience: 'Empresa', audiencePl: 'Empresas',
    heroHi: 'LA POLLA MUNDIALISTA',
    heroLo: 'PARA TU EMPRESA',
    title: 'Polla Mundialista para Empresas — Engagement Corporativo | La Polla IA',
    metaDesc: 'La polla mundialista para tu empresa. Motiva a tu equipo, fortalece la cultura y crea competencia sana. Pelé IA incluida, lista en 2 minutos, participantes ilimitados.',
    kicker: 'La herramienta de engagement definitiva para el torneo 2026. Motiva a tu equipo, fortalece la cultura organizacional y crea competencia sana entre empleados con Inteligencia Artificial. Lista en 2 minutos.',
    members: 'empleados',
    membersCap: 'Empleados',
    useCases: [
      {e:'👔', t:'Grandes Corporaciones', d:'Une a empleados de diferentes áreas y sedes en torno a una competencia amistosa durante todo el torneo.'},
      {e:'🚀', t:'PYMEs y Startups', d:'Fortalece el sentido de pertenencia del equipo. Con pocos empleados la competencia es más personal y la emoción mayor.'},
      {e:'🌎', t:'Empresas Multinacionales', d:'Conecta equipos de distintos países en una sola polla privada. Un evento para toda la compañía.'},
      {e:'🏭', t:'Fábricas y Plantas', d:'Trae a operadores, administrativos y directivos a la misma cancha durante 40 días.'},
      {e:'💼', t:'Consultoras y Firmas', d:'Engagement para equipos distribuidos que rara vez se ven. Una excusa diaria para conversar.'},
      {e:'📢', t:'Áreas de Marketing', d:'Una campaña de engagement para tus clientes top. Lealtad durante todo el torneo.'}
    ],
    benefits: [
      {e:'🤖', t:'Pelé IA llena la polla', d:'Cada empleado obtiene un pronóstico completo con IA en 15 segundos. No hay excusas para no jugar.'},
      {e:'📊', t:'Ranking automático', d:'Los puntos se calculan solos después de cada partido. Publica el ranking en el canal interno.'},
      {e:'🏆', t:'Bracket interactivo', d:'Cada participante define su camino al título. Acertar sin editar vale 100 puntos extra.'},
      {e:'🔐', t:'100% privada', d:'Solo entran quienes tú apruebes. Control total desde el panel de admin.'},
      {e:'🔄', t:'Tu marca y colores', d:'Logo y colores de tu empresa. Se ve como una herramienta corporativa propia.'},
      {e:'🧠', t:'Trivia de engagement', d:'Crea preguntas sobre fútbol o sobre tu propia empresa. Mantén el engagement entre partidos.'},
      {e:'📱', t:'Solo un link', d:'Sin apps, sin cuentas, sin instalaciones. Tus empleados entran desde WhatsApp.'},
      {e:'👥', t:'Sin límite de participantes', d:'5, 50, 500 o 5.000 — el precio es el mismo $3.99.'}
    ]
  },
  universidades: {
    slug: 'universidades', emoji: '🎓', audience: 'Universidad', audiencePl: 'Universidades',
    heroHi: 'LA POLLA MUNDIALISTA',
    heroLo: 'PARA TU UNIVERSIDAD',
    title: 'Polla Mundialista para Universidades y Colegios | La Polla IA',
    metaDesc: 'La polla mundialista para tu universidad, facultad o colegio. Estudiantes, profesores y administrativos compitiendo durante 40 días. IA incluida, lista en 2 minutos.',
    kicker: 'La actividad perfecta para crear comunidad alrededor del torneo 2026. Estudiantes, profesores y personal compitiendo durante 40 días con Pelé IA. Lista en 2 minutos, participantes ilimitados.',
    members: 'estudiantes',
    membersCap: 'Estudiantes',
    useCases: [
      {e:'🎓', t:'Universidades', d:'Una polla por facultad o una global para toda la universidad. Crea comunidad entre facultades.'},
      {e:'📚', t:'Colegios y Liceos', d:'Actividad pedagógica y de convivencia durante todo el torneo. Incluye padres si quieres.'},
      {e:'🏫', t:'Facultades de Deporte', d:'Análisis de partidos como caso de estudio. Usa Pelé IA para discutir cada resultado.'},
      {e:'🧑‍🏫', t:'Aulas y Cátedras', d:'Una polla entre profesor y sus alumnos. Motivación extra para la clase.'},
      {e:'🎉', t:'Grupos Estudiantiles', d:'Fraternidades, tunas, bienestar universitario. Genera tráfico a tus canales.'},
      {e:'🏠', t:'Residencias Estudiantiles', d:'Vive el torneo en comunidad. Ideal para colegios mayores y pensionados.'}
    ],
    benefits: [
      {e:'🤖', t:'Pelé IA para todos', d:'Cualquier estudiante puede llenar su polla con IA en 15 segundos, sepa o no de fútbol.'},
      {e:'🏆', t:'Ranking público universitario', d:'Ranking en vivo. Compite por facultades o por programas académicos.'},
      {e:'🧠', t:'Trivia personalizada', d:'Preguntas sobre fútbol o sobre la historia de tu universidad. Más puntos, más participación.'},
      {e:'🔐', t:'Privacidad total', d:'Solo aprobados entran. Ideal para ambientes escolares controlados.'},
      {e:'🖼️', t:'Escudo y colores', d:'Logo, escudo y colores de tu casa de estudios. La polla se siente de ustedes.'},
      {e:'📱', t:'Sin apps extra', d:'Los estudiantes entran desde su celular. Un link, un código, listo.'},
      {e:'👥', t:'Miles de participantes', d:'Por $3.99 puedes incluir a toda la comunidad universitaria, sin costo por usuario.'},
      {e:'🎯', t:'Bracket educativo', d:'Enseña estadística deportiva, probabilidad y análisis mientras juegan.'}
    ]
  },
  clubes: {
    slug: 'clubes', emoji: '⚽', audience: 'Club', audiencePl: 'Clubes deportivos',
    heroHi: 'LA POLLA MUNDIALISTA',
    heroLo: 'PARA TU CLUB DEPORTIVO',
    title: 'Polla Mundialista para Clubes y Equipos Deportivos | La Polla IA',
    metaDesc: 'La polla mundialista para tu club deportivo, equipo amateur o barra. Socios, jugadores e hinchada compitiendo durante 40 días. IA incluida, lista en 2 minutos.',
    kicker: 'Perfecta para clubes deportivos, equipos amateurs, barras y peñas. Socios, jugadores e hinchada compitiendo durante 40 días con Pelé IA. Lista en 2 minutos.',
    members: 'socios',
    membersCap: 'Socios',
    useCases: [
      {e:'⚽', t:'Clubes Deportivos', d:'Socios, directivos y familiares compitiendo en una sola polla oficial del club.'},
      {e:'🏃', t:'Equipos Amateurs', d:'Equipos de fútbol 5, 7 u 11. La mejor excusa para mantener al grupo unido antes de los partidos.'},
      {e:'📣', t:'Barras y Peñas', d:'Trae a toda la hinchada a una polla privada con los colores del club.'},
      {e:'🎽', t:'Escuelas de Fútbol', d:'Niños, padres y entrenadores jugando juntos. Actividad segura y motivadora.'},
      {e:'🏋️', t:'Gimnasios y Cross', d:'Clientes y entrenadores en una competencia paralela durante el torneo.'},
      {e:'🎮', t:'Ligas FIFA Amateur', d:'Combina torneos de videojuego con una polla real del torneo 2026.'}
    ],
    benefits: [
      {e:'🤖', t:'Pelé IA experto', d:'Análisis de cada partido con datos reales. Ideal para hinchas exigentes y jugadores conocedores.'},
      {e:'🏆', t:'Ranking del club', d:'Tabla en vivo para toda la hinchada. Premios y reconocimientos internos.'},
      {e:'📊', t:'Estadísticas de jugadores', d:'Consulta goles, asistencias y tarjetas de cualquier jugador vía Pelé IA.'},
      {e:'🔐', t:'Solo para socios', d:'Tú apruebas quién entra. Ideal para clubes con membresías.'},
      {e:'🎨', t:'Escudo y colores', d:'Pon el escudo de tu club y sus colores. Experiencia 100% de club.'},
      {e:'📱', t:'Compartir por WhatsApp', d:'Un link basta. Difusión inmediata en los chats de la hinchada.'},
      {e:'👥', t:'Hinchada ilimitada', d:'Desde 10 hasta 10.000 hinchas. Siempre $3.99.'},
      {e:'🧠', t:'Trivia del club', d:'Preguntas sobre la historia del club. Premios internos al ganador.'}
    ]
  },
  edificios: {
    slug: 'edificios', emoji: '🏢', audience: 'Edificio', audiencePl: 'Edificios',
    heroHi: 'LA POLLA MUNDIALISTA',
    heroLo: 'PARA TU EDIFICIO',
    title: 'Polla Mundialista para Edificios y Torres Residenciales | La Polla IA',
    metaDesc: 'La polla mundialista para tu edificio. Vecinos compitiendo durante todo el torneo 2026, Pelé IA incluida, sin límite de participantes. Lista en 2 minutos.',
    kicker: 'La actividad perfecta para unir a los vecinos de tu torre o edificio durante el torneo 2026. Cada vecino hace sus pronósticos, Pelé IA analiza 104 partidos, el ranking se actualiza solo.',
    members: 'vecinos',
    membersCap: 'Vecinos',
    useCases: [
      {e:'🏙️', t:'Torres y Edificios', d:'Vecinos del edificio compitiendo durante 40 días. Una dinámica única para tu comunidad vertical.'},
      {e:'🏬', t:'Oficinas Compartidas', d:'Espacios de coworking, torres de oficinas, centros empresariales compartidos.'},
      {e:'🏨', t:'Hoteles y Hostales', d:'Engagement para huéspedes de largo plazo. Actividad social del mes.'},
      {e:'🛒', t:'Centros Comerciales', d:'Locatarios del CC en una competencia interna. Ranking en pantallas del food court.'},
      {e:'🏥', t:'Clínicas y Hospitales', d:'Personal médico y administrativo durante las guardias. Engagement sano y ligero.'},
      {e:'🏦', t:'Bancos y Sucursales', d:'Compite entre sucursales. Ranking semanal en el canal interno.'}
    ],
    benefits: [
      {e:'🏠', t:'Junta administrativa lista', d:'Una sola persona (admin del edificio) configura todo en 2 minutos.'},
      {e:'🤖', t:'Pelé IA para adultos mayores', d:'Aunque no sepan de fútbol, IA les arma la polla. Inclusivo para todos los vecinos.'},
      {e:'📊', t:'Ranking semanal por piso', d:'Piso contra piso, torre contra torre. Dinámica divertida de barrio vertical.'},
      {e:'🔐', t:'Privada del edificio', d:'Solo vecinos aprobados pueden entrar. Cero extraños.'},
      {e:'🎨', t:'Logo del edificio', d:'El logotipo del condominio y colores de la comunidad.'},
      {e:'📱', t:'Sin descargar apps', d:'Compartes el link por el grupo de WhatsApp del edificio. Listo.'},
      {e:'🧾', t:'Costo fijo $3.99', d:'Se puede pagar desde la administración. 500 apartamentos, el mismo precio.'},
      {e:'🎁', t:'Premios internos', d:'El ganador se gana el mes sin cuota de administración, por ejemplo.'}
    ]
  },
  conjuntos: {
    slug: 'conjuntos', emoji: '🏘️', audience: 'Conjunto', audiencePl: 'Conjuntos residenciales',
    heroHi: 'LA POLLA MUNDIALISTA',
    heroLo: 'PARA TU CONJUNTO',
    title: 'Polla Mundialista para Conjuntos Residenciales y Condominios | La Polla IA',
    metaDesc: 'La polla mundialista para tu conjunto residencial. Vecinos compitiendo durante 40 días del torneo 2026, con Pelé IA incluida y sin límite de participantes.',
    kicker: 'Ideal para conjuntos residenciales, condominios, urbanizaciones y barrios cerrados. Une a toda la comunidad durante el torneo 2026 con Pelé IA. Lista en 2 minutos.',
    members: 'vecinos',
    membersCap: 'Vecinos',
    useCases: [
      {e:'🏘️', t:'Conjuntos cerrados', d:'Vecinos de 50, 500 o 5.000 unidades en una sola polla. Actividad de convivencia del año.'},
      {e:'🌳', t:'Urbanizaciones', d:'Une a las manzanas del barrio en una competencia de 40 días.'},
      {e:'🛡️', t:'Barrios Cerrados', d:'Actividad social segura y controlada para toda la comunidad.'},
      {e:'🧒', t:'Familias con Niños', d:'Los niños también juegan: Pelé IA los guía y los adultos los ayudan.'},
      {e:'🔑', t:'Administración', d:'Una actividad que no requiere instalaciones ni horarios. Sin costo por vecino.'},
      {e:'🎉', t:'Comité de Convivencia', d:'Herramienta perfecta para comités sociales y de recreación.'}
    ],
    benefits: [
      {e:'🏡', t:'Lista en 2 minutos', d:'La administración o el comité social la configura en 2 minutos y comparte el link.'},
      {e:'🤖', t:'Inclusivo con Pelé IA', d:'Adultos mayores, niños, expertos o novatos — todos pueden jugar con ayuda de IA.'},
      {e:'🏆', t:'Ranking por torre / manzana', d:'Competencia dividida por torres, etapas o sectores del conjunto.'},
      {e:'🔐', t:'Solo para residentes', d:'El admin aprueba uno por uno. Cero filtrados externos.'},
      {e:'🎨', t:'Logo del conjunto', d:'El logotipo del conjunto y sus colores. Se siente propia.'},
      {e:'📱', t:'Por WhatsApp', d:'Se difunde por el grupo vecinal. Sin apps, sin cuentas.'},
      {e:'💰', t:'$3.99 total', d:'Se paga desde la administración. Independiente del número de residentes.'},
      {e:'🎁', t:'Premio comunitario', d:'El campeón recibe una sorpresa del comité. Cada partido, una conversación.'}
    ]
  }
}

function landingHtml(p){
  const canonical = `https://lapollaia.com/${p.slug}.html`
  const keywords = LONG_TAIL.join(', ')
  const useCases = p.useCases.map(c=>`<div class="case-card"><div class="case-emoji">${c.e}</div><h3>${c.t}</h3><p>${c.d}</p></div>`).join('\n      ')
  const benefits = p.benefits.map(b=>`<div class="benefit-card"><div class="benefit-icon">${b.e}</div><h3>${b.t}</h3><p>${b.d}</p></div>`).join('\n      ')
  const ltHtml = LONG_TAIL.map(t=>`<li>${t}</li>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${p.title}</title>
<meta name="description" content="${p.metaDesc}"/>
<meta name="keywords" content="${keywords}"/>
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large"/>
<link rel="canonical" href="${canonical}"/>
<link rel="alternate" hreflang="es" href="${canonical}"/>
<link rel="alternate" hreflang="es-CO" href="${canonical}"/>
<link rel="alternate" hreflang="es-MX" href="${canonical}"/>
<link rel="alternate" hreflang="es-AR" href="${canonical}"/>
<link rel="alternate" hreflang="x-default" href="${canonical}"/>
<meta property="og:title" content="${p.title}"/>
<meta property="og:description" content="${p.metaDesc}"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:image" content="https://lapollaia.com/logo.png"/>
<meta property="og:site_name" content="La Polla IA"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${p.title}"/>
<meta name="twitter:description" content="${p.metaDesc}"/>
<meta name="twitter:image" content="https://lapollaia.com/logo.png"/>
<link rel="icon" type="image/png" href="/logo.png"/>
<meta name="theme-color" content="#F6C90E"/>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"La Polla IA para ${p.audiencePl}","description":"${p.metaDesc}","url":"${canonical}","offers":{"@type":"Offer","price":"3.99","priceCurrency":"USD","description":"Acceso completo durante todo el torneo"},"provider":{"@type":"Organization","name":"La Polla IA","url":"https://lapollaia.com"}}</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-R9KEGLJKVD"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-R9KEGLJKVD');</script>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="/prospect.css"/>
</head>
<body>
<nav class="nav">
  <a class="brand" href="/"><img src="/logo.png" alt="La Polla IA" class="brand-logo"/><span class="brand-name">La Polla IA</span></a>
  <div class="nav-links">
    <a href="/" class="nav-link">Inicio</a>
    <a href="/blog/" class="nav-link">Blog</a>
    <a href="/guia-admin.html" class="nav-link">Guía Admin</a>
    <a href="/guia-concursante.html" class="nav-link">Guía Concursante</a>
  </div>
  <a href="/#crear" class="nav-cta">Crear mi Polla →</a>
</nav>

<section class="hero">
  <div class="hero-grid"></div>
  <div class="hero-badge">${p.emoji} Polla Mundialista · Para ${p.audiencePl}</div>
  <h1>${p.heroHi}<br/><span>${p.heroLo}</span></h1>
  <p>${p.kicker}</p>
  <div class="hero-ctas">
    <a href="/#crear" class="btn-main">✅ Crear Polla Mundialista — $3.99</a>
    <a href="/t/demo" class="btn-sec">⚡ Probar Demo Gratis</a>
  </div>
  <div class="cross-links">
    <a href="/empresas.html">Empresas</a><span>·</span>
    <a href="/universidades.html">Universidades</a><span>·</span>
    <a href="/clubes.html">Clubes</a><span>·</span>
    <a href="/edificios.html">Edificios</a><span>·</span>
    <a href="/conjuntos.html">Conjuntos</a>
  </div>
</section>

<section class="section">
  <div class="sec-tag">POR QUÉ LA POLLA IA</div>
  <h2 class="sec-title">Todo lo que tu ${p.audience.toLowerCase()} necesita</h2>
  <p class="sec-sub">Una sola polla privada para toda la comunidad. Pelé IA incluida.</p>
  <div class="benefits-grid">
      ${benefits}
  </div>
</section>

<section class="how-section">
  <div class="how-inner">
    <div style="text-align:center;margin-bottom:2.5rem">
      <div class="sec-tag">ASÍ DE FÁCIL</div>
      <h2 class="sec-title">Lista en 2 minutos. De verdad.</h2>
      <p class="sec-sub">Sin Excel. Sin instalaciones. Sin complicaciones.</p>
    </div>
    <div class="steps">
      <div class="step"><div class="step-num">1</div><h3>Crea tu Polla</h3><p>Pagas $3.99, le pones el nombre de tu ${p.audience.toLowerCase()} y queda un link único.</p></div>
      <div class="step"><div class="step-num">2</div><h3>Comparte el Link</h3><p>Envíalo por WhatsApp o email. Cada ${p.members.replace(/s$/,'')} se registra solo.</p></div>
      <div class="step"><div class="step-num">3</div><h3>Aprueba Participantes</h3><p>Desde el panel apruebas quién entra. Control total del acceso.</p></div>
      <div class="step"><div class="step-num">4</div><h3>El Sistema Hace el Resto</h3><p>Rankings automáticos, puntos solos. Tú solo disfrutas el torneo.</p></div>
    </div>
  </div>
</section>

<section class="cases-section">
  <div class="sec-tag">CASOS DE USO</div>
  <h2 class="sec-title">Para cada tipo de ${p.audience.toLowerCase()}</h2>
  <p class="sec-sub">Adaptable a cualquier comunidad</p>
  <div class="cases-grid">
      ${useCases}
  </div>
</section>

<section class="price-section" id="precio">
  <div class="sec-tag">PRECIO ÚNICO</div>
  <h2 class="sec-title">Un precio. Todo incluido. Para todo el torneo.</h2>
  <p class="sec-sub">Sin planes por usuario. Sin mensualidades. Sin letra pequeña.</p>
  <div class="price-card">
    <div class="price-badge">⏱ Oferta de lanzamiento — 60% OFF</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:.75rem;margin-bottom:.25rem">
      <div style="font-size:1.4rem;color:rgba(255,255,255,.28);text-decoration:line-through;font-family:'Bebas Neue',sans-serif">$9.99</div>
      <div style="background:#E53E3E;color:#fff;font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;border-radius:100px">-60% OFF</div>
    </div>
    <div class="price-amt"><sup style="font-size:2rem">$</sup>3<small style="font-size:2.5rem">.99</small></div>
    <div class="price-per">USD · pago único · activo hasta la Gran Final (19 Jul 2026)</div>
    <ul class="price-list">
      <li>${p.membersCap} ilimitados — sin costo por persona</li>
      <li>104 partidos del torneo — todas las fases</li>
      <li>Pelé IA incluida para cada participante</li>
      <li>Bracket interactivo del campeón (+100 pts)</li>
      <li>Ranking automático en tiempo real</li>
      <li>Panel de administrador completo</li>
      <li>Logo y colores de tu ${p.audience.toLowerCase()}</li>
      <li>Trivia Extra Points para más engagement</li>
    </ul>
    <a href="/#crear" class="btn-main" style="width:100%;text-align:center;display:block">🏆 Crear Polla Mundialista →</a>
    <p style="font-size:11px;color:rgba(255,255,255,.22);margin-top:.75rem">Pago seguro · MercadoPago o PayPal · Lista en 2 minutos</p>
  </div>
</section>

<section class="faq-section">
  <div style="text-align:center;margin-bottom:2rem">
    <h2 class="sec-title">Preguntas frecuentes — ${p.audiencePl}</h2>
  </div>
  <div class="faq-item"><div class="faq-q">❓ ¿Cuántas personas pueden participar?</div><div class="faq-a">Ilimitadas. 10, 100 o 10.000 ${p.members} — el precio sigue siendo $3.99 por todo el torneo.</div></div>
  <div class="faq-item"><div class="faq-q">❓ ¿Puedo poner el logo y colores de mi ${p.audience.toLowerCase()}?</div><div class="faq-a">Sí. Desde el panel de administrador personalizas el logo y los colores. La polla se verá como una herramienta propia.</div></div>
  <div class="faq-item"><div class="faq-q">❓ ¿Quién ingresa los resultados?</div><div class="faq-a">Tú (o el administrador que designes) ingresa el marcador real después de cada partido. El sistema calcula los puntos automáticamente.</div></div>
  <div class="faq-item"><div class="faq-q">❓ ¿Necesitan instalar una app?</div><div class="faq-a">No. Todo funciona desde el navegador del celular o computador. Solo necesitan el link.</div></div>
  <div class="faq-item"><div class="faq-q">❓ ¿Hasta cuándo está activa la polla?</div><div class="faq-a">Hasta el 19 de julio de 2026, día de la Gran Final. Toda la duración del torneo sin costo adicional.</div></div>
  <div class="faq-item"><div class="faq-q">❓ ¿Sirve si la comunidad no sabe mucho de fútbol?</div><div class="faq-a">Perfectamente. Pelé IA llena la polla de cada ${p.members.replace(/s$/,'')} automáticamente. Incluso quienes nunca han visto fútbol participan.</div></div>
</section>

<section class="longtail">
  <h2 class="sec-title" style="text-align:center;margin-bottom:.5rem">También nos buscan como…</h2>
  <p class="sec-sub" style="text-align:center;margin-bottom:1.5rem">100 formas distintas de nombrar a La Polla IA</p>
  <ul class="longtail-list">${ltHtml}</ul>
</section>

<section class="cta-final">
  <h2 class="sec-title">Empieza ahora — 2 minutos</h2>
  <p>Crea la polla mundialista para tu ${p.audience.toLowerCase()} hoy y transforma cada partido en un evento memorable.</p>
  <a href="/#crear" class="btn-main" style="font-size:16px;padding:1rem 2.5rem">🏆 Crear mi Polla — $3.99 →</a>
  <p style="font-size:11px;color:rgba(255,255,255,.2);margin-top:1rem">Pago único · Sin mensualidades · Participantes ilimitados</p>
</section>

<footer>
  <p>© 2026 La Polla IA · <a href="/" style="color:rgba(246,201,14,.4)">lapollaia.com</a> · <a href="/terminos.html" style="color:rgba(255,255,255,.2)">Términos</a> · <a href="/privacidad.html" style="color:rgba(255,255,255,.2)">Privacidad</a></p>
</footer>
</body>
</html>`
}

const outDir = path.join(__dirname, 'public')
Object.values(PROSPECTS).forEach(p=>{
  const html = landingHtml(p)
  const file = path.join(outDir, p.slug+'.html')
  fs.writeFileSync(file, html, 'utf8')
  console.log('✓ wrote', file, '('+(html.length/1024).toFixed(1)+'KB)')
})

console.log('Done.')
