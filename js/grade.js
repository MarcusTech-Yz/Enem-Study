// ── grade.js ──

let diaAtivo = null

function renderGrade() {
  const grade   = getGrade()
  const hojeIdx = new Date().getDay()
  const grid    = document.getElementById('grade-grid')
  if (!grid) return
  grid.innerHTML = ''

  for (let i = 0; i < 7; i++) {
    const isHoje   = i === hojeIdx
    const materias = grade[i] || []

    const pillsHTML = materias.map((m, idx) => {
      const dados  = ENEM[m.key]
      const horTxt = m.inicio ? `${m.inicio}${m.duracao ? ' · ' + m.duracao + 'min' : ''}` : ''
      return `
        <div style="display:flex;gap:4px;align-items:flex-start;margin-bottom:5px;">
          <div class="grade-pill" onclick="irParaMateria('${m.key}')" style="flex:1;">
            <span style="display:flex;align-items:center;gap:4px;">
              <i data-lucide="${dados.icone}" style="width:10px;height:10px;flex-shrink:0;"></i>
              ${dados.nome.split(' ')[0]}
            </span>
            ${horTxt ? `<span style="font-size:9px;opacity:.55;font-family:var(--mono);display:block;margin-top:2px;">${horTxt}</span>` : ''}
          </div>
          <button onclick="removerMateria(${i},${idx})"
            style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:11px;padding:3px 2px;flex-shrink:0;"
            title="Remover">✕</button>
        </div>
      `
    }).join('')

    const actionsHTML = materias.length > 0
      ? `<div style="margin-bottom:6px;">
           <button class="grade-action-btn" onclick="limparDia(${i})">Limpar</button>
         </div>`
      : ''

    grid.innerHTML += `
      <div class="grade-day ${isHoje ? 'today' : ''}">
        <p class="grade-day-name">${DIAS[i]}</p>
        ${actionsHTML}
        ${pillsHTML}
        <button class="grade-add" onclick="abrirModal(${i})" title="Adicionar">+</button>
      </div>
    `
  }

  if (typeof lucide !== 'undefined') lucide.createIcons()
}

function abrirModal(diaIdx) {
  diaAtivo = diaIdx
  const sel = document.getElementById('modal-materia')
  sel.innerHTML = Object.entries(ENEM)
    .map(([key, m]) => `<option value="${key}">${m.nome}</option>`)
    .join('')
  document.getElementById('modal-inicio').value  = '14:00'
  document.getElementById('modal-duracao').value = '90'
  document.getElementById('conflict-warn').classList.remove('show')
  document.getElementById('modal-titulo').textContent = `Adicionar — ${DIAS_FULL[diaIdx]}`
  document.getElementById('modal').classList.add('open')
}

function fecharModal() {
  document.getElementById('modal').classList.remove('open')
  diaAtivo = null
}

function toMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number); return h * 60 + m
}

function temConflito(diaIdx, inicioNovo, duracaoNova) {
  const grade   = getGrade()
  const startN  = toMin(inicioNovo)
  const endN    = startN + parseInt(duracaoNova || 90)
  for (const m of (grade[diaIdx] || [])) {
    if (!m.inicio) continue
    const startE = toMin(m.inicio)
    const endE   = startE + parseInt(m.duracao || 90)
    if (startN < endE && endN > startE) return true
  }
  return false
}

function checkConflito() {
  if (diaAtivo === null) return
  const warn = document.getElementById('conflict-warn')
  warn.classList.toggle('show',
    temConflito(diaAtivo,
      document.getElementById('modal-inicio').value,
      document.getElementById('modal-duracao').value))
}

function salvarMateria() {
  if (diaAtivo === null) return
  const key     = document.getElementById('modal-materia').value
  const inicio  = document.getElementById('modal-inicio').value
  const duracao = document.getElementById('modal-duracao').value
  const grade   = getGrade()
  grade[diaAtivo].push({ key, inicio, duracao })
  saveGrade(grade)
  fecharModal()
  renderGrade()
}

function removerMateria(diaIdx, itemIdx) {
  const grade = getGrade()
  grade[diaIdx].splice(itemIdx, 1)
  saveGrade(grade)
  renderGrade()
}

function limparDia(diaIdx) {
  if (!confirm(`Limpar todas as matérias de ${DIAS_FULL[diaIdx]}?`)) return
  const grade = getGrade(); grade[diaIdx] = []
  saveGrade(grade); renderGrade()
}

function limparTudo() {
  if (!confirm('Limpar toda a grade semanal?')) return
  saveGrade({ 0:[],1:[],2:[],3:[],4:[],5:[],6:[] }); renderGrade()
}

function sugestaoAutomatica() {
  const grade   = getGrade()
  const fracas  = getMateriasMaisFracas(Object.keys(ENEM).length)
  const horarios = ['08:00','10:00','14:00','16:00','19:00']
  let fIdx = 0
  for (let i = 1; i <= 6; i++) {
    if (grade[i].length === 0 && fIdx < fracas.length) {
      grade[i].push({ key: fracas[fIdx].key, inicio: horarios[fIdx % 3 + 1], duracao: '90' })
      fIdx++
    }
  }
  saveGrade(grade); renderGrade()
}

function irParaMateria(key) { window.location.href = `materia.html?m=${key}` }

document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) fecharModal()
})

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal-inicio')?.addEventListener('input', checkConflito)
  document.getElementById('modal-duracao')?.addEventListener('input', checkConflito)
  renderGrade()
})
