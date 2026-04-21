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

function renderHero() {
  const xp = calcXP()
  const { nivel, xpAtual, xpTotal } = getNivel(xp)
  const { feitos, total } = getProgressoGlobal()
  const pctGeral = total > 0 ? Math.round((feitos / total) * 100) : 0
  const rank = getRank(pctGeral)
  const streak = getStreak()
  const xpPct = Math.min(100, Math.round((xpAtual / xpTotal) * 100))
  const topTempo = buildHeroData().sort((a, b) => b.tempo - a.tempo)[0]
  const scene = getSceneLabel(rank.nome)

  const rain = Array.from({ length: 14 }).map((_, i) => {
    const left = 6 + i * 6.5
    const height = 18 + (i % 4) * 12
    const delay = (i * .45).toFixed(2)
    const duration = (6.2 + (i % 5) * .35).toFixed(2)
    const opacity = .25 + (i % 4) * .15
    return `<span style="left:${left}%;height:${height}px;animation-delay:-${delay}s;animation-duration:${duration}s;opacity:${opacity};"></span>`
  }).join('')

  document.getElementById('perfil-hero').innerHTML = `
    <div class="hero-rain">${rain}</div>
    <div class="hero-topbar">
      <span class="hero-scene-badge">Cena equipada: <strong>${scene}</strong></span>
      <span class="hero-track">Trilha atual: <strong>Noite de Véspera</strong></span>
    </div>

    <div class="hero-content">
      <div class="hero-identity">
        <div class="perfil-avatar">
          <i data-lucide="graduation-cap"></i>
        </div>

        <div class="perfil-meta">
          <span class="hero-kicker">Perfil em evolução</span>
          <div class="perfil-nome-row">
            <div class="perfil-nome">Estudante</div>
            <span class="perfil-titulo">${rank.nome === 'Mestre' ? 'Mente de elite' : 'Guerreiro ENEM'}</span>
          </div>
          <div class="perfil-sub">
            <span>Nível ${nivel}</span>
            <span>${xp.toLocaleString('pt-BR')} XP</span>
            <span>streak ${streak.count} dia${streak.count !== 1 ? 's' : ''}</span>
            <span>main ${topTempo?.nome || 'em construção'}</span>
          </div>
          <p class="perfil-frase"></p>
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
          <button class="btn btn-accent">
            <i data-lucide="sparkles"></i> Personalizar Perfil
          </button>
        </div>
      </div>
    </div>
  `
}

function renderShowcase() {
  const xp = calcXP()
  const { nivel } = getNivel(xp)
  const achievementCard = document.getElementById('achievement-card')
  const weekSpotlightCard = document.getElementById('week-spotlight-card')
  const weekTop = buildHeroData().sort((a, b) => b.tempo - a.tempo)[0]

  if (achievementCard) {
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
  `
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
      <div class="collection-icon"><i data-lucide="image"></i></div>
      <div class="collection-text">
        <div class="collection-name">Wallpaper equipado</div>
      </div>
      <span class="collection-tag">ativo</span>
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
  renderHero()
  renderShowcase()
  renderStats()
  renderHeroes('tempo')
  renderAmbient()
  renderGrafico()
  setNavActive()
  lucide.createIcons()
}
