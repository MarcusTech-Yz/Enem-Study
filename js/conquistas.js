function formatAchievementDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getAchievementRarity(item) {
  const base = item.secreta ? 6 : 14
  const spread = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 61
  return Number((base + spread).toFixed(1))
}

function formatProgressLabel(item) {
  if (item.tipo === 'tempo_total' || item.tipo === 'tempo_materia') {
    const current = Math.round((item.progressAtual / 3600) * 10) / 10
    const target = Math.round((item.progressAlvo / 3600) * 10) / 10
    return `${current}h / ${target}h`
  }
  if (item.tipo === 'streak') return `${item.progressAtual} / ${item.progressAlvo} dias`
  if (item.tipo === 'progresso_materia') return `${item.progressAtual}% / ${item.progressAlvo}%`
  return `${item.progressAtual} / ${item.progressAlvo}`
}

function renderAchievementRow(item, state) {
  const rarity = getAchievementRarity(item)
  const isRare = rarity < 15
  const isUnlocked = state === 'unlocked'
  const isLocked = state === 'locked'
  const isSecret = state === 'secret'
  const progress = item.progressAlvo > 0 ? Math.min(100, item.progressPct) : 0

  let classes = ['ach-row', state]
  if (isRare && !isSecret) classes.push('rare')

  let title = item.nome
  let description = item.descricao
  if (isSecret) {
    title = '??? Conquista Secreta'
    description = 'Continue estudando para descobrir este marco oculto.'
  }

  const progressHTML = isLocked ? `
    <div class="ach-progress-row">
      <div class="ach-mini-bar"><div class="ach-mini-fill" style="width:${progress}%"></div></div>
      <span class="ach-progress-label">${formatProgressLabel(item)}</span>
    </div>
  ` : ''

  const tags = []
  if (!isSecret) {
    tags.push(`<span class="ach-tag">${item.categoria}</span>`)
    if (isRare) tags.push(`<span class="ach-tag rarity">rara · ${rarity}%</span>`)
  }

  const sideHTML = isUnlocked
    ? `
      <div class="ach-side">
        <span class="ach-side-label">Alcançada em</span>
        <span class="ach-side-date">${formatAchievementDate(item.unlockedAt)}</span>
      </div>
    `
    : isSecret
      ? `
        <div class="ach-side">
          <span class="ach-side-label">Oculta</span>
          <span class="ach-side-date">— — —</span>
        </div>
      `
      : `
        <div class="ach-side">
          <span class="ach-side-label">Em progresso</span>
          <span class="ach-side-date">${formatProgressLabel(item)}</span>
        </div>
      `

  return `
    <div class="${classes.join(' ')}" data-name="${item.nome.toLowerCase()}" data-desc="${item.descricao.toLowerCase()}">
      <div class="ach-icon"><i data-lucide="${item.icon}"></i></div>
      <div class="ach-body">
        <h3 class="ach-title">${title}</h3>
        <p class="ach-desc">${description}</p>
        ${progressHTML}
        ${tags.length ? `<div class="ach-tags">${tags.join('')}</div>` : ''}
      </div>
      ${sideHTML}
    </div>
  `
}

function renderSteamAchievements() {
  const conquistas = getConquistasState()
  const unlocked = conquistas.filter(item => item.unlocked)
  const locked = conquistas.filter(item => !item.unlocked && !item.secreta)
  const secret = conquistas.filter(item => !item.unlocked && item.secreta)
  const total = conquistas.length
  const done = unlocked.length
  const pct = total ? (done / total) * 100 : 0

  document.getElementById('steam-title').textContent = `${done} de ${total} conquistas alcançadas`
  document.getElementById('steam-sub').textContent = `Continue estudando para desbloquear ${Math.max(0, total - done)} marcos restantes.`
  document.getElementById('steam-progress-fill').style.width = `${pct}%`
  document.getElementById('steam-progress-text').textContent = `${done} / ${total}`
  document.getElementById('steam-progress-percent').textContent = `${pct.toFixed(1)}%`

  document.getElementById('count-unlocked').textContent = String(unlocked.length)
  document.getElementById('count-locked').textContent = String(locked.length)
  document.getElementById('count-secret').textContent = String(secret.length)

  document.getElementById('list-unlocked').innerHTML = unlocked.length
    ? unlocked.map(item => renderAchievementRow(item, 'unlocked')).join('')
    : `<div class="ach-empty"><i data-lucide="trophy"></i><div>Nenhuma conquista desbloqueada ainda.</div></div>`

  document.getElementById('list-locked').innerHTML = locked.length
    ? locked.map(item => renderAchievementRow(item, 'locked')).join('')
    : `<div class="ach-empty"><i data-lucide="check-circle-2"></i><div>Todas as conquistas visíveis desta leva já foram alcançadas.</div></div>`

  document.getElementById('list-secret').innerHTML = secret.length
    ? secret.map(item => renderAchievementRow(item, 'secret')).join('')
    : `<div class="ach-empty"><i data-lucide="sparkles"></i><div>Nenhuma conquista secreta restante.</div></div>`

  lucide.createIcons()
}

function initAchievementTabs() {
  const tabs = document.querySelectorAll('.steam-tab')
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(item => item.classList.remove('active'))
      tab.classList.add('active')

      const target = tab.dataset.tab
      document.getElementById('panel-unlocked').classList.toggle('hidden', target !== 'unlocked')
      document.getElementById('panel-locked').classList.toggle('hidden', target !== 'locked')
      document.getElementById('panel-secret').classList.toggle('hidden', target !== 'secret')
      applyAchievementSearch()
    })
  })
}

function applyAchievementSearch() {
  const activePanel = document.querySelector('.steam-panel:not(.hidden)')
  const query = document.getElementById('search-input').value.trim().toLowerCase()
  if (!activePanel) return

  activePanel.querySelectorAll('.ach-row').forEach(row => {
    const haystack = `${row.dataset.name || ''} ${row.dataset.desc || ''}`
    row.style.display = !query || haystack.includes(query) ? '' : 'none'
  })
}

function initAchievementSearch() {
  const input = document.getElementById('search-input')
  input.addEventListener('input', applyAchievementSearch)
}


function initConquistasPage() {
  renderSteamAchievements()
  initAchievementTabs()
  initAchievementSearch()
  setNavActive()
  lucide.createIcons()
}
