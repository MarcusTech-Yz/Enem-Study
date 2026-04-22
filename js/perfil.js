function calcXP() {
  let xp = 0
  for (const k of Object.keys(ENEM)) {
    xp += getTopicosFeitos(k).length * 10
    xp += Math.floor(getTempoMateria(k) / 60)
  }
  xp += getStreak().count * 5
  return xp
}

function xpParaNivel(n) { return n * 250 }

function getNivel(xp) {
  let n = 1
  while (xp >= xpParaNivel(n)) { xp -= xpParaNivel(n); n++ }
  return { nivel: n, xpAtual: xp, xpTotal: xpParaNivel(n) }
}

const RANKS = [
  { nome: 'Calouro', min: 0, cor: '#888', icon: 'circle', bgCor: 'rgba(136,136,136,.12)', borderCor: 'rgba(136,136,136,.3)' },
  { nome: 'Bronze', min: 15, cor: '#cd7f32', icon: 'shield', bgCor: 'rgba(205,127,50,.12)', borderCor: 'rgba(205,127,50,.3)' },
  { nome: 'Prata', min: 30, cor: '#9CA3AF', icon: 'shield-check', bgCor: 'rgba(156,163,175,.12)', borderCor: 'rgba(156,163,175,.3)' },
  { nome: 'Ouro', min: 50, cor: '#F59E0B', icon: 'award', bgCor: 'rgba(245,158,11,.12)', borderCor: 'rgba(245,158,11,.3)' },
  { nome: 'Diamante', min: 70, cor: '#60A5FA', icon: 'gem', bgCor: 'rgba(96,165,250,.12)', borderCor: 'rgba(96,165,250,.3)' },
  { nome: 'Mestre', min: 85, cor: '#C8F135', icon: 'crown', bgCor: 'rgba(200,241,53,.12)', borderCor: 'rgba(200,241,53,.3)' },
]

const PERFIL_WALLPAPERS = [
  { id: 'blue-sky', nome: 'Blue Sky', file: 'Assets/background/BlueSky.mp4', tipo: 'video' },
  { id: 'black', nome: 'Black Flow', file: 'Assets/background/black.mp4', tipo: 'video' },
  { id: 'ferrari', nome: 'Ferrari', file: 'Assets/background/Ferrari.mp4', tipo: 'video' },
  { id: 'resident', nome: 'Resident', file: 'Assets/background/Resident.mp4', tipo: 'video' },
  { id: 'lofi-room', nome: 'Lofi Room', file: 'Assets/back/lofi.mp4', tipo: 'video' },
  { id: 'girl-cat', nome: 'Girl Cat', file: 'Assets/back/girl-cat.mp4', tipo: 'video' },
]

const PERFIL_HERO_VIDEOS = [
  { id: 'none', nome: 'Sem video', file: '' },
  { id: 'lofi-room', nome: 'Lofi Room', file: 'Assets/back/lofi.mp4' },
  { id: 'girl-cat', nome: 'Girl Cat', file: 'Assets/back/girl-cat.mp4' },
]

const PERFIL_FRAMES = [
  { id: 'white', nome: 'White Sketch', file: 'Assets/molduras/White.png' },
  { id: 'vision', nome: 'Vision', file: 'Assets/molduras/Vision.png' },
  { id: 'cat', nome: 'Cat Mood', file: 'Assets/molduras/Cat.png' },
  { id: 'dark', nome: 'Dark Edge', file: 'Assets/molduras/Dark.png' },
  { id: 'dragon', nome: 'Dragon', file: 'Assets/molduras/Dragon.png' },
  { id: 'glitch', nome: 'Glitch', file: 'Assets/molduras/Glitch.png' },
  { id: 'party', nome: 'Party', file: 'Assets/molduras/Party.png' },
  { id: 'rainbow', nome: 'Rainbow', file: 'Assets/molduras/Rainbow.png' },
  { id: 'red', nome: 'Red Pulse', file: 'Assets/molduras/Red.png' },
  { id: 'rose', nome: 'Rose Bloom', file: 'Assets/molduras/Rose.png' },
]

const PERFIL_VIDEO_THUMBS = new Map()
const PERFIL_VIDEO_THUMB_TASKS = new Map()

function getRank(pct) {
  let rank = RANKS[0]
  for (const r of RANKS) if (pct >= r.min) rank = r
  return rank
}

function barColor(pct) {
  return pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--amber)' : 'var(--accent)'
}

function matNivel(seg) {
  return Math.max(1, Math.floor(seg / 1800) + 1)
}

function buildHeroData() {
  return Object.keys(ENEM).map(k => {
    const mat = ENEM[k]
    const { feitos, total, pct } = getProgressoMateria(k)
    const tempo = getTempoMateria(k)
    return { key: k, nome: mat.nome, icone: mat.icone, feitos, total, pct, tempo }
  })
}

function getSceneLabel(rankNome) {
  const labels = {
    Calouro: 'Mesa em construção',
    Bronze: 'Noite de arranque',
    Prata: 'Quarto focado',
    Ouro: 'Sala de performance',
    Diamante: 'Cidade noturna',
    Mestre: 'Biblioteca neon'
  }
  return labels[rankNome] || 'Base do estudante'
}

function getPerfilFoto() {
  return store.get('perfil_foto') || ''
}

function savePerfilFoto(dataUrl) {
  store.set('perfil_foto', dataUrl)
}

function getPerfilNome() {
  const nome = store.get('perfil_nome')
  return typeof nome === 'string' ? nome : 'Estudante'
}

function savePerfilNome(nome) {
  store.set('perfil_nome', nome)
}

function sanitizePerfilNome(value) {
  const semQuebra = String(value).replace(/[\r\n\t]/g, ' ')
  const limitado = Array.from(semQuebra).slice(0, 32).join('')
  return limitado.trim()
}

function getPerfilWallpaper() {
  return store.get('perfil_wallpaper') || PERFIL_WALLPAPERS[0].id
}

function savePerfilWallpaper(id) {
  store.set('perfil_wallpaper', id)
}

function getPerfilFrame() {
  return store.get('perfil_frame') || PERFIL_FRAMES[0].id
}

function savePerfilFrame(id) {
  store.set('perfil_frame', id)
}

function getWallpaperDef(id = getPerfilWallpaper()) {
  return PERFIL_WALLPAPERS.find(item => item.id === id) || PERFIL_WALLPAPERS[0]
}

function getFrameDef(id = getPerfilFrame()) {
  return PERFIL_FRAMES.find(item => item.id === id) || PERFIL_FRAMES[0]
}

function getWallpaperLabel() {
  return getWallpaperDef().nome
}

function getPerfilHeroVideo() {
  return store.get('perfil_hero_video') || PERFIL_HERO_VIDEOS[0].id
}

function savePerfilHeroVideo(id) {
  store.set('perfil_hero_video', id)
}

function getHeroVideoDef(id = getPerfilHeroVideo()) {
  return PERFIL_HERO_VIDEOS.find(item => item.id === id) || PERFIL_HERO_VIDEOS[0]
}

function getHeroVideoLabel() {
  return getHeroVideoDef().nome
}

function isLofiHeroStyle(id = getPerfilHeroVideo()) {
  return !!getHeroVideoDef(id).file
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function updatePerfilNomePreview(nome) {
  const nomeHero = document.getElementById('perfil-nome-btn')
  const nomeColecao = document.getElementById('perfil-collection-name')
  const nomeFinal = nome || 'Estudante'
  if (nomeHero) nomeHero.textContent = nomeFinal
  if (nomeColecao) nomeColecao.textContent = nomeFinal
}

function applyVideoThumb(file, thumb) {
  PERFIL_VIDEO_THUMBS.set(file, thumb)
  document.querySelectorAll(`[data-video-thumb="${file}"]`).forEach(node => {
    node.style.backgroundImage = `url("${thumb}")`
    node.classList.add('is-thumb-ready')
  })
}

function generateVideoThumb(file) {
  if (!file) return Promise.resolve('')
  if (PERFIL_VIDEO_THUMBS.has(file)) return Promise.resolve(PERFIL_VIDEO_THUMBS.get(file))
  if (PERFIL_VIDEO_THUMB_TASKS.has(file)) return PERFIL_VIDEO_THUMB_TASKS.get(file)

  const task = new Promise((resolve) => {
    const video = document.createElement('video')
    video.src = file
    video.muted = true
    video.preload = 'metadata'
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    const fail = () => {
      PERFIL_VIDEO_THUMB_TASKS.delete(file)
      resolve('')
    }

    video.addEventListener('error', fail, { once: true })
    video.addEventListener('loadeddata', () => {
      const capture = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = 320
          canvas.height = 180
          const ctx = canvas.getContext('2d')
          if (!ctx) return fail()
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const thumb = canvas.toDataURL('image/jpeg', 0.72)
          PERFIL_VIDEO_THUMB_TASKS.delete(file)
          applyVideoThumb(file, thumb)
          resolve(thumb)
        } catch {
          fail()
        }
      }

      try {
        video.currentTime = Math.min(0.15, Math.max(0, (video.duration || 1) / 10))
      } catch {
        capture()
      }

      video.addEventListener('seeked', capture, { once: true })
    }, { once: true })
  })

  PERFIL_VIDEO_THUMB_TASKS.set(file, task)
  return task
}

function hydrateVideoThumbs() {
  document.querySelectorAll('[data-video-thumb]').forEach(node => {
    const file = node.dataset.videoThumb
    if (!file) return
    const cached = PERFIL_VIDEO_THUMBS.get(file)
    if (cached) {
      node.style.backgroundImage = `url("${cached}")`
      node.classList.add('is-thumb-ready')
      return
    }
    generateVideoThumb(file)
  })
}

function applyPerfilWallpaper() {
  const wallpaper = getWallpaperDef()
  const video = document.getElementById('perfil-wallpaper-video')
  const source = document.getElementById('perfil-wallpaper-source')
  if (!video || !source) return

  if (wallpaper.tipo === 'video') {
    video.style.display = ''
    source.src = wallpaper.file
    source.type = 'video/mp4'
    video.load()
    video.play().catch(() => {})
    document.body.style.setProperty('--perfil-wallpaper-fallback', 'none')
  } else {
    video.pause()
    video.style.display = 'none'
    source.removeAttribute('src')
    video.load()
    document.body.style.setProperty('--perfil-wallpaper-fallback', `url("${wallpaper.file}")`)
  }
}

function getAvatarMarkup(isInteractive = true) {
  const foto = getPerfilFoto()
  const moldura = getFrameDef()
  const conteudoAvatar = foto
    ? `<img class="perfil-avatar-photo" src="${foto}" alt="Foto de perfil do estudante" />`
    : `<div class="perfil-avatar-placeholder"><i data-lucide="graduation-cap"></i></div>`

  if (!isInteractive) {
    return `
      <div class="perfil-avatar perfil-avatar-static" aria-hidden="true">
        <span class="perfil-avatar-media">
          ${conteudoAvatar}
        </span>
        <img class="perfil-avatar-frame" src="${moldura.file}" alt="" aria-hidden="true" />
      </div>
    `
  }

  return `
    <button class="perfil-avatar" id="perfil-avatar-btn" type="button" aria-label="Escolher foto de perfil">
      <span class="perfil-avatar-media">
        ${conteudoAvatar}
      </span>
      <img class="perfil-avatar-frame" src="${moldura.file}" alt="" aria-hidden="true" />
      <span class="avatar-edit-badge">
        <i data-lucide="image-plus"></i>
      </span>
      <input class="perfil-avatar-input" id="perfil-avatar-input" type="file" accept="image/*" />
    </button>
  `
}

function bindPerfilAvatar() {
  const avatarBtn = document.getElementById('perfil-avatar-btn')
  const avatarInput = document.getElementById('perfil-avatar-input')
  const ctaBtn = document.getElementById('perfil-open-photo-btn')
  if (!avatarBtn || !avatarInput) return

  const openPicker = () => avatarInput.click()

  avatarBtn.addEventListener('click', openPicker)
  if (ctaBtn) ctaBtn.addEventListener('click', openPicker)

  avatarInput.addEventListener('change', (event) => {
    const [file] = event.target.files || []
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      savePerfilFoto(reader.result)
      renderHero()
      renderCustomizer()
      lucide.createIcons()
    }
    reader.readAsDataURL(file)
  })
}

function bindPerfilNome() {
  const nomeBtn = document.getElementById('perfil-nome-btn')
  const openBtn = document.getElementById('perfil-open-editor-btn')

  if (nomeBtn) nomeBtn.addEventListener('click', () => {
    toggleCustomizer(true)
    const nomeInput = document.getElementById('perfil-nome-input')
    if (nomeInput) nomeInput.focus()
  })

  if (openBtn) openBtn.addEventListener('click', () => toggleCustomizer())
}

function toggleCustomizer(force) {
  const panel = document.getElementById('perfil-customizer')
  if (!panel) return
  const shouldOpen = typeof force === 'boolean' ? force : !panel.classList.contains('is-open')
  panel.classList.toggle('is-open', shouldOpen)
}

function bindPerfilCustomizer() {
  const closeBtn = document.getElementById('perfil-customizer-close')
  const nomeInput = document.getElementById('perfil-nome-input')
  const fotoInput = document.getElementById('perfil-customizer-photo-input')
  const fotoBtn = document.getElementById('perfil-customizer-photo-btn')
  const fotoResetBtn = document.getElementById('perfil-customizer-photo-reset')

  if (closeBtn) closeBtn.addEventListener('click', () => toggleCustomizer(false))

  if (nomeInput) {
    nomeInput.addEventListener('input', (event) => {
      const nome = sanitizePerfilNome(event.target.value)
      event.target.value = nome
      savePerfilNome(nome)
      updatePerfilNomePreview(nome)
    })
  }

  if (fotoBtn && fotoInput) {
    fotoBtn.addEventListener('click', () => fotoInput.click())
    fotoInput.addEventListener('change', (event) => {
      const [file] = event.target.files || []
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        savePerfilFoto(reader.result)
        renderHero()
        renderCustomizer()
        renderAmbient()
        lucide.createIcons()
      }
      reader.readAsDataURL(file)
    })
  }

  if (fotoResetBtn) {
    fotoResetBtn.addEventListener('click', () => {
      savePerfilFoto('')
      renderHero()
      renderCustomizer()
      renderAmbient()
      lucide.createIcons()
    })
  }

  document.querySelectorAll('[data-wallpaper]').forEach(btn => {
    btn.addEventListener('click', () => {
      savePerfilWallpaper(btn.dataset.wallpaper)
      applyPerfilWallpaper()
      renderHero()
      renderCustomizer()
      renderAmbient()
      lucide.createIcons()
    })
  })

  document.querySelectorAll('[data-hero-video]').forEach(btn => {
    btn.addEventListener('click', () => {
      savePerfilHeroVideo(btn.dataset.heroVideo)
      renderHero()
      renderCustomizer()
      renderAmbient()
      lucide.createIcons()
    })
  })

  document.querySelectorAll('[data-frame]').forEach(btn => {
    btn.addEventListener('click', () => {
      savePerfilFrame(btn.dataset.frame)
      renderHero()
      renderCustomizer()
      renderAmbient()
      lucide.createIcons()
    })
  })
}

function renderCustomizer() {
  const root = document.getElementById('perfil-customizer')
  if (!root) return

  const wallpaperAtivo = getPerfilWallpaper()
  const heroVideoAtivo = getPerfilHeroVideo()
  const frameAtiva = getPerfilFrame()
  const foto = getPerfilFoto()
  const nome = getPerfilNome()

  const renderVideoTile = (item, isActive, label) => {
    return `
      <button class="asset-tile ${isActive ? 'is-active' : ''}" type="button" data-${label === 'bloco' ? 'hero-video' : 'wallpaper'}="${item.id}">
        <span class="asset-thumb is-video" data-video-thumb="${item.file}"></span>
        <span class="asset-meta">
          <strong>${item.nome}</strong>
          <small>${label}</small>
        </span>
      </button>
    `
  }

  root.innerHTML = `
    <div class="customizer-shell">
      <div class="customizer-head">
        <div>
          <p class="showcase-kicker">Editar perfil</p>
          <h2 class="customizer-title">Organizar o quarto do estudante</h2>
          <p class="customizer-copy">Nome, foto, moldura e wallpaper num fluxo só.</p>
        </div>
        <button class="customizer-close" id="perfil-customizer-close" type="button" aria-label="Fechar editor">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="customizer-grid">
        <section class="customizer-block">
          <p class="mini-kicker">Identidade</p>
          <div class="customizer-identity">
            <div class="customizer-avatar-preview">
              ${getAvatarMarkup(false)}
            </div>
            <div class="customizer-fields">
              <label class="customizer-label" for="perfil-nome-input">Nome do perfil</label>
              <input class="customizer-input" id="perfil-nome-input" type="text" maxlength="32" value="${escapeAttr(nome)}" placeholder="Seu nome aqui" />
              <div class="customizer-actions">
                <button class="btn btn-accent" type="button" id="perfil-customizer-photo-btn">
                  <i data-lucide="image-plus"></i> Escolher foto
                </button>
                <button class="btn btn-ghost" type="button" id="perfil-customizer-photo-reset">
                  <i data-lucide="rotate-ccw"></i> Remover foto
                </button>
              </div>
              <input class="perfil-avatar-input" id="perfil-customizer-photo-input" type="file" accept="image/*" />
              <p class="customizer-note">${foto ? 'Foto salva no navegador e equipada no perfil.' : 'Ainda sem foto equipada.'}</p>
            </div>
          </div>
        </section>

        <section class="customizer-block">
          <div class="customizer-section-head">
            <div>
              <p class="mini-kicker">Wallpaper</p>
              <p class="customizer-copy">Escolha o clima do quarto.</p>
            </div>
            <span class="customizer-current">${getWallpaperLabel()}</span>
          </div>
          <div class="asset-grid">
            ${PERFIL_WALLPAPERS.map(item => {
              const isActive = item.id === wallpaperAtivo
              if (item.tipo === 'video') return renderVideoTile(item, isActive, 'wallpaper')
              return `
                <button class="asset-tile ${isActive ? 'is-active' : ''}" type="button" data-wallpaper="${item.id}">
                  <span class="asset-thumb is-gif" style="background-image:url('${item.file}')"></span>
                  <span class="asset-meta">
                    <strong>${item.nome}</strong>
                    <small>gif</small>
                  </span>
                </button>
              `
            }).join('')}
          </div>
        </section>

        <section class="customizer-block">
          <div class="customizer-section-head">
            <div>
              <p class="mini-kicker">Video do Bloco</p>
              <p class="customizer-copy">Defina a cena que roda dentro do bloco do perfil.</p>
            </div>
            <span class="customizer-current">${getHeroVideoLabel()}</span>
          </div>
          <div class="asset-grid">
            ${PERFIL_HERO_VIDEOS.map(item => {
              const isActive = item.id === heroVideoAtivo
              if (item.file) return renderVideoTile(item, isActive, 'bloco')
              return `
                <button class="asset-tile ${isActive ? 'is-active' : ''}" type="button" data-hero-video="${item.id}">
                  <span class="asset-thumb is-empty" style="background:linear-gradient(135deg, rgba(18,24,31,.95), rgba(9,12,17,.95));display:flex;align-items:center;justify-content:center;">
                    <strong class="asset-empty-label">Clean</strong>
                  </span>
                  <span class="asset-meta">
                    <strong>${item.nome}</strong>
                    <small>sem video</small>
                  </span>
                </button>
              `
            }).join('')}
          </div>
        </section>

        <section class="customizer-block">
          <div class="customizer-section-head">
            <div>
              <p class="mini-kicker">Moldura</p>
              <p class="customizer-copy">Escolha a estética do avatar.</p>
            </div>
            <span class="customizer-current">${getFrameDef().nome}</span>
          </div>
          <div class="asset-grid frame-grid">
            ${PERFIL_FRAMES.map(item => `
              <button class="asset-tile frame-tile ${item.id === frameAtiva ? 'is-active' : ''}" type="button" data-frame="${item.id}">
                <span class="frame-preview">
                  <img src="${item.file}" alt="" aria-hidden="true" />
                </span>
                <span class="asset-meta">
                  <strong>${item.nome}</strong>
                  <small>moldura</small>
                </span>
              </button>
            `).join('')}
          </div>
        </section>
      </div>
    </div>
  `

  bindPerfilCustomizer()
  hydrateVideoThumbs()
}

function renderHero() {
  const xp = calcXP()
  const { nivel, xpAtual, xpTotal } = getNivel(xp)
  const { feitos, total } = getProgressoGlobal()
  const conquistas = getConquistasState()
  const pctGeral = total > 0 ? Math.round((feitos / total) * 100) : 0
  const rank = getRank(pctGeral)
  const streak = getStreak()
  const xpPct = Math.min(100, Math.round((xpAtual / xpTotal) * 100))
  const topTempo = buildHeroData().sort((a, b) => b.tempo - a.tempo)[0]
  const scene = getSceneLabel(rank.nome)
  const secretasRestantes = conquistas.filter(item => !item.unlocked && item.secreta).length
  const perfilNome = getPerfilNome() || 'Estudante'
  const wallpaperNome = getWallpaperLabel()
  const heroVideo = getHeroVideoDef()
  const isLofi = isLofiHeroStyle()
  const heroMood = isLofi ? 'is-lofi' : 'is-hud'
  const heroLofiVideo = heroVideo.file

  document.getElementById('perfil-hero').className = `perfil-hero ${heroMood}`
  document.getElementById('perfil-hero').innerHTML = `
    ${isLofi && heroLofiVideo ? `
      <video class="hero-lofi-video" autoplay muted loop playsinline preload="auto">
        <source src="${heroLofiVideo}" type="video/mp4" />
      </video>
      <div class="hero-lofi-overlay"></div>
    ` : ''}
    <div class="hero-topbar">
      <span class="hero-scene-badge">Cena equipada: <strong>${scene}</strong></span>
      <span class="hero-track">Segredos restantes: <strong>${secretasRestantes}</strong></span>
    </div>

    <div class="hero-content">
      <div class="hero-identity">
        ${getAvatarMarkup()}

        <div class="perfil-meta ${isLofi ? 'perfil-meta-card' : ''}">
          <span class="hero-kicker">Perfil em evolução</span>
          <div class="perfil-nome-row">
            <button class="perfil-nome perfil-nome-btn" id="perfil-nome-btn" type="button" title="Abrir editor do perfil">
              ${escapeHtml(perfilNome)}
            </button>
            <span class="perfil-titulo">${rank.nome === 'Mestre' ? 'Mente de elite' : 'Guerreiro ENEM'}</span>
          </div>
          <div class="perfil-sub">
            <span>Nível ${nivel}</span>
            <span>${xp.toLocaleString('pt-BR')} XP</span>
            <span>streak ${streak.count} dia${streak.count !== 1 ? 's' : ''}</span>
            <span>main ${topTempo?.nome || 'em construção'}</span>
          </div>
          <p class="perfil-frase">Seu quarto digital vai ganhando personalidade conforme você equipa novas peças e mantém o ritmo.</p>
          <div class="hero-progress-row">
            <div class="xp-bar-outer">
              <div class="xp-bar-inner" style="width:${xpPct}%"></div>
            </div>
            <span class="xp-label">${xpAtual} / ${xpTotal} XP</span>
          </div>
        </div>
      </div>

      <div class="hero-side">
        <div class="rank-panel">
          <div class="rank-orb" style="background:${rank.bgCor};border:1.5px solid ${rank.borderCor};">
            <i data-lucide="${rank.icon}" style="color:${rank.cor};"></i>
          </div>
          <div>
            <div class="rank-label">Rank de progresso</div>
            <div class="rank-name" style="color:${rank.cor};">${rank.nome}</div>
            <div class="rank-sub">${pctGeral}% do ENEM concluído</div>
          </div>
        </div>

        <div class="cta-panel">
          <div class="cta-panel-copy">
            <div class="cta-panel-label">Wallpaper atual</div>
            <div class="cta-panel-value">${wallpaperNome}</div>
          </div>
          <div class="cta-panel-copy">
            <div class="cta-panel-label">Cena do bloco</div>
            <div class="cta-panel-value">${getHeroVideoLabel()}</div>
          </div>
          <button class="btn btn-accent" type="button" id="perfil-open-editor-btn">
            <i data-lucide="sliders-horizontal"></i> Editar perfil
          </button>
          <button class="btn btn-ghost" type="button" id="perfil-open-photo-btn">
            <i data-lucide="image-plus"></i> Trocar foto
          </button>
        </div>
      </div>
    </div>
  `

  bindPerfilAvatar()
  bindPerfilNome()
}

function renderShowcase() {
  const xp = calcXP()
  const { nivel } = getNivel(xp)
  const achievementCard = document.getElementById('achievement-card')
  const weekSpotlightCard = document.getElementById('week-spotlight-card')
  const weekTop = buildHeroData().sort((a, b) => b.tempo - a.tempo)[0]
  const conquistas = getConquistasState()
  const unlocked = conquistas.filter(item => item.unlocked)
  const visibleLocked = conquistas.filter(item => !item.unlocked && !item.secreta)
  const hiddenLocked = conquistas.filter(item => !item.unlocked && item.secreta)
  const unlockedPreview = unlocked.slice(0, 4)
  const lockedPreview = [...visibleLocked.slice(0, 2), ...hiddenLocked.slice(0, 1)].slice(0, 3)
  const totalAchievements = conquistas.length || 1
  const unlockedPct = Math.round((unlocked.length / totalAchievements) * 100)

  if (achievementCard) {
    if (unlocked.length === 0) {
      achievementCard.innerHTML = `
      <p class="showcase-kicker">Conquistas</p>
      <div class="achievement-head">
        <div class="achievement-icon"><i data-lucide="trophy"></i></div>
        <div>
          <div class="achievement-title">Vitrine em construção</div>
          <div class="achievement-sub">Seu perfil vai exibir troféus, marcos secretos e recompensas por consistência.</div>
        </div>
      </div>
      <div class="achievement-preview">
        <span class="achievement-pill">streak</span>
        <span class="achievement-pill">domínio</span>
        <span class="achievement-pill">segredo</span>
      </div>
      <p class="achievement-copy">A próxima etapa do perfil vai transformar progresso real em conquistas exibíveis, sem encher a tela com coisa solta.</p>
      <a class="achievement-link" href="conquistas.html">Ver coleção</a>
    `
    } else {
      achievementCard.innerHTML = `
      <p class="showcase-kicker">Conquistas</p>
      <div class="achievement-summary">
        <div>
          <div class="achievement-count">${unlocked.length}/${conquistas.length}</div>
          <div class="achievement-sub">alcançadas até agora</div>
        </div>
        <a class="achievement-link" href="conquistas.html">Ver coleção</a>
      </div>
      <div class="achievement-progress"><div style="width:${Math.max(10, unlockedPct)}%"></div></div>
      <div class="achievement-rows">
        <div>
          <p class="achievement-label">Conquistadas</p>
          <div class="achievement-badge-row">
            ${unlockedPreview.map(item => `
              <span class="achievement-badge unlocked" title="${item.nome}">
                <i data-lucide="${item.icon}"></i>
              </span>
            `).join('')}
            ${unlocked.length > unlockedPreview.length ? `<span class="achievement-more">+${unlocked.length - unlockedPreview.length}</span>` : ''}
          </div>
        </div>
        <div>
          <p class="achievement-label">A caminho</p>
          <div class="achievement-badge-row">
            ${lockedPreview.map(item => `
              <span class="achievement-badge locked" title="${item.secreta ? 'Conquista secreta' : item.nome}">
                <i data-lucide="${item.secreta ? 'lock' : item.icon}"></i>
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    `
    }
  }

  if (weekSpotlightCard) {
    weekSpotlightCard.innerHTML = `
    <p class="showcase-kicker">Destaque da semana</p>
    <div class="reward-stage">
      <div class="reward-title">${weekTop?.nome || 'Seu foco da semana'}</div>
      <div class="reward-copy">A área que mais ocupou seu tempo recente merece aparecer na vitrine do perfil.</div>
      <div class="reward-progress"><div style="width:${Math.max(18, weekTop?.pct || 0)}%"></div></div>
      <div class="reward-foot">
        <span>Nível ${nivel}</span>
        <span>${formatTempo(weekTop?.tempo || 0)} investidos</span>
      </div>
    </div>
  `
  }
}

function renderStats() {
  const tempoTotal = getTempoTotal()
  const streak = getStreak()
  const streakMax = store.get('streak_max') || streak.count
  if (streak.count >= streakMax) store.set('streak_max', streak.count)
  const { feitos, total } = getProgressoGlobal()
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0
  const tempoSemana = (() => {
    let totalMin = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      const reg = store.get('registro_' + d)
      totalMin += reg?.tempoMin || 0
    }
    return totalMin * 60
  })()
  const xp = calcXP()
  const { nivel, xpAtual, xpTotal } = getNivel(xp)

  document.getElementById('stats4').innerHTML = `
    <div class="stat-panel featured">
      <p class="mini-kicker">Progresso geral</p>
      <div class="stat-value">${pct}<small>%</small></div>
      <p class="stat-description">${feitos} de ${total} tópicos já marcados dentro da sua trilha ENEM.</p>
    </div>

    <div class="stat-panel">
      <p class="mini-kicker">Sequência</p>
      <div class="stat-value" style="color:var(--accent);">${streak.count}</div>
      <p class="stat-description">Dias seguidos sustentando ritmo. Seu recorde atual é ${store.get('streak_max') || streak.count}.</p>
    </div>

    <div class="stat-panel">
      <p class="mini-kicker">Tempo estudado</p>
      <div class="stat-value" style="color:var(--blue);font-size:30px;">${formatTempo(tempoTotal)}</div>
      <p class="stat-description">${formatTempo(tempoSemana)} acumulados só nesta última semana.</p>
    </div>

    <div class="stat-panel">
      <p class="mini-kicker">Nível atual</p>
      <div class="stat-value" style="color:var(--amber);">${nivel}</div>
      <p class="stat-description">${xpAtual} / ${xpTotal} XP antes do próximo salto visual.</p>
      <div class="stat-note">${Math.max(0, xpTotal - xpAtual)} XP até o próximo nível</div>
    </div>
  `
}

function renderHeroes(mode) {
  let data = buildHeroData()
  if (mode === 'tempo') data.sort((a, b) => b.tempo - a.tempo)
  else if (mode === 'perf') data.sort((a, b) => b.pct - a.pct)
  else data.sort((a, b) => a.nome.localeCompare(b.nome))

  const tempoTotal = getTempoTotal() || 1

  document.getElementById('heroes-grid').innerHTML = data.map(m => {
    const pickRate = Math.round((m.tempo / tempoTotal) * 100)
    const nvl = matNivel(m.tempo)
    return `
      <div class="hero-card">
        <div class="hero-card-top">
          <div class="hero-icon"><i data-lucide="${m.icone}"></i></div>
          <div>
            <div class="hero-nome">${m.nome}</div>
            <div class="hero-lvl">Main nível ${nvl}</div>
          </div>
        </div>
        <div class="hero-prog-row">
          <div class="hero-prog-bar">
            <div class="hero-prog-fill" style="width:${m.pct}%;background:${barColor(m.pct)};"></div>
          </div>
          <span class="hero-prog-pct">${m.pct}%</span>
        </div>
        <div class="hero-stats-row">
          <div class="hero-stat"><span>${formatTempo(m.tempo)}</span>tempo total</div>
          <div class="hero-stat"><span>${m.feitos}/${m.total}</span>tópicos</div>
        </div>
        <div class="pickrate-section">
          <div class="pickrate-bar">
            <div class="pickrate-fill" style="width:${pickRate}%;background:linear-gradient(90deg,var(--blue),rgba(200,241,53,.9));"></div>
          </div>
          <div class="pickrate-lbl">${pickRate}% da sua energia total</div>
        </div>
      </div>
    `
  }).join('')

  lucide.createIcons()
}

function sortHeroes(btn, mode) {
  document.querySelectorAll('.sort-pill').forEach(b => b.classList.remove('ativo'))
  btn.classList.add('ativo')
  renderHeroes(mode)
}

function renderAmbient() {
  const xp = calcXP()
  const { nivel } = getNivel(xp)
  const topTempo = buildHeroData().sort((a, b) => b.tempo - a.tempo)[0]
  const topPerf = buildHeroData().sort((a, b) => b.pct - a.pct)[0]
  const spotlightCard = document.getElementById('spotlight-card')
  const collectionList = document.getElementById('collection-list')

  if (spotlightCard) {
    spotlightCard.innerHTML = `
    <div class="section-row">
      <div>
        <p class="section-title">Quarto Virtual</p>
      </div>
    </div>
    <div class="ambient-stage">
      <div class="ambient-stage-content">
        <div class="ambient-stage-title">Biblioteca Neon</div>
        <div class="ambient-stage-copy">perfil nível ${nivel} · atmosfera de foco contínuo</div>
      </div>
    </div>
    <div class="spotlight-metrics">
      <div class="spotlight-metric">
        <strong>${formatTempo(topTempo?.tempo || 0)}</strong>
        <span>tempo total investido nessa main</span>
      </div>
      <div class="spotlight-metric">
        <strong>${topPerf?.pct || 0}%</strong>
        <span>melhor avanço atual entre as matérias</span>
      </div>
      <div class="spotlight-metric">
        <strong>${topTempo?.nome || '—'}</strong>
        <span>matéria em destaque agora</span>
      </div>
    </div>
  `
  }

  if (collectionList) {
    collectionList.innerHTML = `
    <div class="collection-item">
      <div class="collection-icon"><i data-lucide="user-round"></i></div>
      <div class="collection-text">
        <div class="collection-name">Nome equipado</div>
        <div class="collection-desc" id="perfil-collection-name">${getPerfilNome() || 'Estudante'}</div>
      </div>
      <span class="collection-tag">ativo</span>
    </div>
    <div class="collection-item">
      <div class="collection-icon"><i data-lucide="image"></i></div>
      <div class="collection-text">
        <div class="collection-name">Wallpaper equipado</div>
        <div class="collection-desc">${getWallpaperLabel()}</div>
      </div>
      <span class="collection-tag">ativo</span>
    </div>
    <div class="collection-item">
      <div class="collection-icon"><i data-lucide="clapperboard"></i></div>
      <div class="collection-text">
        <div class="collection-name">Cena do bloco</div>
        <div class="collection-desc">${getHeroVideoLabel()}</div>
      </div>
      <span class="collection-tag">ativa</span>
    </div>
    <div class="collection-item">
      <div class="collection-icon"><i data-lucide="music-4"></i></div>
      <div class="collection-text">
        <div class="collection-name">Trilha em reprodução</div>
      </div>
      <span class="collection-tag">equipada</span>
    </div>
    <div class="collection-item">
      <div class="collection-icon"><i data-lucide="badge"></i></div>
      <div class="collection-text">
        <div class="collection-name">Título e moldura</div>
        <div class="collection-desc">${getFrameDef().nome}</div>
      </div>
      <span class="collection-tag">nível ${nivel}</span>
    </div>
  `
  }
}

function renderGrafico() {
  const labels = []
  const valores = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    labels.push(d.toLocaleDateString('pt-BR', { weekday: 'short' }))
    const reg = store.get('registro_' + key)
    valores.push(reg ? Math.round((reg.tempoMin || 0) / 60 * 10) / 10 : 0)
  }

  new Chart(document.getElementById('evolChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Horas',
        data: valores,
        borderColor: '#C8F135',
        backgroundColor: 'rgba(200,241,53,.08)',
        borderWidth: 2,
        pointBackgroundColor: '#C8F135',
        pointRadius: 3,
        fill: true,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { font: { size: 11, family: "'DM Mono', monospace" }, color: '#555', autoSkip: false },
          grid: { display: false }
        },
        y: {
          ticks: { font: { size: 11, family: "'DM Mono', monospace" }, color: '#555', callback: v => v + 'h' },
          grid: { color: 'rgba(80,80,80,.15)' },
          min: 0
        }
      }
    }
  })
}

function initPerfilPage() {
  applyPerfilWallpaper()
  renderHero()
  renderCustomizer()
  renderShowcase()
  renderStats()
  renderHeroes('tempo')
  renderAmbient()
  renderGrafico()
  setNavActive()
  lucide.createIcons()
}
