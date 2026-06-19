/* player-bio.js — click a player card to expand an inline Pelé IA bio.
   No modals, no popups. Bio is injected into the DOM as a sibling of the card
   and spans the full player-grid width via `grid-column: 1/-1`.
*/
(function(){
  const CACHE = {}
  const grid = document.querySelector('.player-grid')
  if(!grid) return

  const country = (document.querySelector('.team-info h1')?.textContent||'')
    .split(/[\u2014\-]/)[0].trim() ||
    (location.pathname.split('/').pop()||'').replace('.html','').replace(/-/g,' ')

  // Tiny style for the inline drawer
  const style = document.createElement('style')
  style.textContent = `
.player-card{cursor:pointer;transition:all .18s;position:relative;align-items:center}
.player-card:hover{border-color:rgba(246,201,14,.35);background:rgba(246,201,14,.04);transform:translateY(-1px)}
.player-card.open{border-color:#F6C90E;background:rgba(246,201,14,.06)}
.player-card .pc-caret{margin-left:auto;color:rgba(246,201,14,.6);font-size:11px;transition:transform .25s;padding-left:4px}
.player-card.open .pc-caret{transform:rotate(90deg);color:#F6C90E}
.player-bio{grid-column:1/-1;background:rgba(246,201,14,.05);border:1px solid rgba(246,201,14,.2);border-radius:12px;padding:1rem 1.1rem;margin:.15rem 0 .35rem;color:rgba(255,255,255,.78);line-height:1.7;font-size:13.5px;animation:pbIn .25s ease-out}
.player-bio .pb-head{display:flex;align-items:center;gap:8px;margin-bottom:.6rem;font-weight:700;color:#F6C90E;font-size:13px}
.player-bio .pb-head img{width:22px;height:22px;border-radius:50%;object-fit:cover;flex-shrink:0}
.player-bio .pb-body p{margin:.25rem 0}
.player-bio .pb-close{position:absolute;top:8px;right:10px;background:none;border:0;color:rgba(255,255,255,.35);cursor:pointer;font-size:16px;line-height:1}
.player-bio .pb-close:hover{color:#fff}
.player-bio.loading .pb-body::after{content:'';display:inline-block;width:12px;height:12px;border:2px solid rgba(246,201,14,.3);border-top-color:#F6C90E;border-radius:50%;animation:pbSpin .8s linear infinite;vertical-align:middle;margin-left:6px}
@keyframes pbIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@keyframes pbSpin{to{transform:rotate(360deg)}}
@media(max-width:600px){.player-bio{font-size:13px;padding:.85rem .9rem}}
`
  document.head.appendChild(style)

  function attach(card){
    const nameEl = card.querySelector('.player-name')
    const posEl  = card.querySelector('.player-pos')
    if(!nameEl) return
    // caret icon
    const caret = document.createElement('span')
    caret.className = 'pc-caret'
    caret.textContent = '▸'
    card.appendChild(caret)

    card.setAttribute('role','button')
    card.setAttribute('tabindex','0')
    card.setAttribute('aria-expanded','false')
    card.setAttribute('aria-label','Ver biografía de '+nameEl.textContent+' con Pelé IA')

    let bio = null
    function openBio(){
      if(bio){ return }
      bio = document.createElement('div')
      bio.className = 'player-bio loading'
      bio.setAttribute('role','region')
      bio.innerHTML =
        '<button class="pb-close" aria-label="Cerrar">×</button>'+
        '<div class="pb-head"><img src="/pele.jpg" alt="Pelé IA"/> Pelé IA analiza a <span>'+escapeHtml(nameEl.textContent)+'</span></div>'+
        '<div class="pb-body">Consultando Pelé IA</div>'
      card.insertAdjacentElement('afterend', bio)
      card.classList.add('open')
      card.setAttribute('aria-expanded','true')
      bio.querySelector('.pb-close').addEventListener('click', e=>{ e.stopPropagation(); closeBio() })

      const key = country+'::'+nameEl.textContent
      if(CACHE[key]){
        bio.querySelector('.pb-body').innerHTML = CACHE[key]
        bio.classList.remove('loading')
        return
      }
      const pos = posEl? posEl.textContent.trim() : ''
      const q = `Eres Pelé IA, experto en fútbol. Ficha corta del jugador "${nameEl.textContent}" (${pos}) de la selección ${country} para el torneo 2026. Dame en un solo párrafo fluido (máx 180 palabras, español, sin markdown): club actual, edad aproximada, posición, goles internacionales, partidos con la selección, estilo de juego, fortalezas y debilidades, y tarjetas recientes si las hay.`
      fetch('/api/pele/public',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({message:q})
      })
      .then(r=> r.json().then(d=>({ok:r.ok,d})))
      .then(({ok,d})=>{
        const txt = (ok && d.response) ? d.response : (d.error || 'Pelé IA no está disponible por ahora. Vuelve a intentarlo.')
        const html = '<p>' + escapeHtml(txt).replace(/\n\n+/g,'</p><p>').replace(/\n/g,'<br/>') + '</p>'
        CACHE[key] = html
        bio.querySelector('.pb-body').innerHTML = html
        bio.classList.remove('loading')
      })
      .catch(()=>{
        bio.querySelector('.pb-body').textContent = 'No pude conectar con Pelé IA. Intenta de nuevo.'
        bio.classList.remove('loading')
      })
    }
    function closeBio(){
      if(!bio) return
      bio.remove(); bio = null
      card.classList.remove('open')
      card.setAttribute('aria-expanded','false')
    }
    card.addEventListener('click', ()=>{ bio ? closeBio() : openBio() })
    card.addEventListener('keydown', e=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); bio ? closeBio() : openBio() }
    })
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
  }

  grid.querySelectorAll('.player-card').forEach(attach)
})()
