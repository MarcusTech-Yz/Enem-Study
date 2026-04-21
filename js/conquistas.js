function renderAchievementsPage() {
  const conquistas = getConquistasState()
  const unlocked = conquistas.filter(item => item.unlocked)
  const lockedVisible = conquistas.filter(item => !item.unlocked && !item.secreta)
  const lockedSecret = conquistas.filter(item => !item.unlocked && item.secreta)
  const progressPct = conquistas.length ? Math.round((unlocked.length / conquistas.length) * 100) : 0

  const overview = document.getElementById('achievement-overview')
  const unlockedList = document.getElementById('achievement-list-unlocked')
  const lockedList = document.getElementById('achievement-list-locked')
  const secretList = document.getElementById('achievement-list-secret')

  overview.innerHTML = `
    <div class="achievement-overview-head">
      <p class="achievement-overview-kicker">Conquistas</p>
      <div class="achievement-overview-stats">
        <div>
          <div class="achievement-overview-count">${unlocked.length}/${conquistas.length} alcançadas (${progressPct}%)</div>
          <div class="achievement-overview-note">Você vê o que já conquistou, o que ainda falta e ainda mantém uma camada de troféus secretos para descoberta.</div>
        </div>
      </div>
      <div class="achievement-overview-bar">
        <div style="width:${Math.max(0, progressPct)}%"></div>
      </div>
    </div>
    <div class="achievement-overview-grid">
      <div class="achievement-group">
        <p class="achievement-group-kicker">Conquistas recentes</p>
        <div class="achievement-inline-list">
          ${unlocked.slice(0, 5).map(item => `
            <span class="achievement-inline-card" title="${item.nome}">
              <i data-lucide="${item.icon}"></i>
            </span>
          `).join('') || '<span class="achievement-secret-note">Nenhuma desbloqueada ainda.</span>'}
          ${unlocked.length > 5 ? `<span class="achievement-inline-more">+${unlocked.length - 5}</span>` : ''}
        </div>
      </div>
      <div class="achievement-group">
        <p class="achievement-group-kicker">Segredos restantes</p>
        <div class="achievement-inline-list">
          ${lockedSecret.slice(0, 4).map(() => `
            <span class="achievement-inline-secret" title="Conquista secreta">
              <i data-lucide="lock"></i>
            </span>
          `).join('') || '<span class="achievement-secret-note">Todas as secretas já foram reveladas.</span>'}
          ${lockedSecret.length > 4 ? `<span class="achievement-inline-more">+${lockedSecret.length - 4}</span>` : ''}
        </div>
      </div>
    </div>
  `

  unlockedList.innerHTML = unlocked.length
    ? unlocked.map(item => renderAchievementItem(item, true)).join('')
    : `<div class="achievement-secret-note">Sua primeira conquista aparece aqui assim que você desbloquear um marco real.</div>`

  lockedList.innerHTML = lockedVisible.length
    ? lockedVisible.map(item => renderAchievementItem(item, false)).join('')
    : `<div class="achievement-secret-note">Você já completou todas as conquistas visíveis dessa leva.</div>`

  secretList.innerHTML = lockedSecret.length
    ? lockedSecret.map(item => renderSecretItem(item)).join('')
    : `<div class="achievement-secret-note">Nenhuma conquista secreta restante por enquanto.</div>`

  lucide.createIcons()
}

function renderAchievementItem(item, unlocked) {
  const side = unlocked
    ? `Desbloqueada`
    : `${Math.min(item.progressAtual, item.progressAlvo)}/${item.progressAlvo}`

  return `
    <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
      <div class="achievement-item-icon">
        <i data-lucide="${item.icon}"></i>
      </div>
      <div>
        <div class="achievement-item-title">${item.nome}</div>
        <div class="achievement-item-desc">${item.descricao}</div>
        <div class="achievement-item-meta">
          <span class="achievement-tag">${item.categoria}</span>
          ${unlocked ? '' : `
            <div class="achievement-mini-progress">
              <div style="width:${item.progressPct}%"></div>
            </div>
          `}
        </div>
      </div>
      <div class="achievement-item-side">${side}</div>
    </div>
  `
}

function renderSecretItem(item) {
  return `
    <div class="achievement-item locked">
      <div class="achievement-item-icon">
        <i data-lucide="lock"></i>
      </div>
      <div>
        <div class="achievement-item-title">Conquista secreta</div>
        <div class="achievement-item-desc">Continue estudando para descobrir este troféu oculto.</div>
        <div class="achievement-item-meta">
          <span class="achievement-tag">secreta</span>
        </div>
      </div>
      <div class="achievement-item-side">oculta</div>
    </div>
  `
}

function initConquistasPage() {
  renderAchievementsPage()
  setNavActive()
  lucide.createIcons()
}
