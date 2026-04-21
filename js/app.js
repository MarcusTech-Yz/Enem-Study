// ── app.js ──

const store = {
  get: (key) => JSON.parse(localStorage.getItem(key) || 'null'),
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
}

const DIAS      = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const DIAS_FULL = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

// ── Ícone Lucide helper ────────────────────────────────
function lucideIcon(name, size = 16) {
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px;flex-shrink:0;"></i>`
}

// ── Grade ──────────────────────────────────────────────
function getGrade() {
  return store.get('grade') || { 0:[],1:[],2:[],3:[],4:[],5:[],6:[] }
}
function saveGrade(g) { store.set('grade', g) }
function getMateriaHoje() {
  return (getGrade()[new Date().getDay()] || [])
}

// ── Tópicos ────────────────────────────────────────────
function getTopicosFeitos(k)  { return store.get('topicos_' + k) || [] }
function toggleTopico(k, idx) {
  let f = getTopicosFeitos(k)
  f = f.includes(idx) ? f.filter(i => i !== idx) : [...f, idx]
  store.set('topicos_' + k, f)
  bumpStreak()
  checkConquistas()
  return f
}

// ── Dificuldade ────────────────────────────────────────
function getDificuldades(k)        { return store.get('dific_' + k) || {} }
function setDificuldade(k, idx, v) {
  const d = getDificuldades(k); d[idx] = v; store.set('dific_' + k, d)
}

// ── Anotações & imagens ────────────────────────────────
function getAnotacao(k)       { return store.get('anotacao_' + k) || '' }
function saveAnotacao(k, txt) { store.set('anotacao_' + k, txt) }
function getImagens(k)        { return store.get('imagens_' + k) || [] }
function addImagem(k, b64)    { const a = getImagens(k); a.push(b64); store.set('imagens_' + k, a); return a }
function removeImagem(k, idx) { const a = getImagens(k); a.splice(idx,1); store.set('imagens_' + k, a); return a }

// ── Tempo por tópico ───────────────────────────────────
// Armazena segundos gastos: { "materiaKey:topicoIdx": segundos }
function getTempo(materiaKey, topicoIdx) {
  const all = store.get('tempo_topicos') || {}
  return all[`${materiaKey}:${topicoIdx}`] || 0
}

function addTempo(materiaKey, topicoIdx, segundos) {
  const all = store.get('tempo_topicos') || {}
  const key = `${materiaKey}:${topicoIdx}`
  all[key] = (all[key] || 0) + segundos
  store.set('tempo_topicos', all)
  checkConquistas()
}

// Tempo total por matéria (em segundos)
function getTempoMateria(materiaKey) {
  const all = store.get('tempo_topicos') || {}
  let total = 0
  for (const [k, v] of Object.entries(all)) {
    if (k.startsWith(materiaKey + ':')) total += v
  }
  return total
}

// Tempo total geral
function getTempoTotal() {
  const all = store.get('tempo_topicos') || {}
  return Object.values(all).reduce((a, b) => a + b, 0)
}

// Formata segundos → "2h 30min" ou "45min" ou "30s"
function formatTempo(seg) {
  if (seg < 60)   return `${seg}s`
  if (seg < 3600) return `${Math.floor(seg / 60)}min`
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

// Histórico semanal: soma de tempo dos últimos 7 dias por matéria
// (usamos o registro diário para isso)
function getTempoSemana() {
  const all = store.get('tempo_topicos') || {}
  return Object.values(all).reduce((a, b) => a + b, 0)
}

// ── Progresso ──────────────────────────────────────────
function getProgressoGlobal() {
  let total = 0, feitos = 0
  for (const k of Object.keys(ENEM)) {
    const mat = ENEM[k]
    // Calcula total de habilidades
    let topicosTotais = 0
    if (mat.conteudos) {
      for (const c of mat.conteudos) topicosTotais += c.habilidades.length
    } else if (mat.topicos) {
      topicosTotais = mat.topicos.length
    }
    total  += topicosTotais
    feitos += getTopicosFeitos(k).length
  }
  return { total, feitos }
}

function getProgressoMateria(k) {
  const mat = ENEM[k]
  if (!mat) return { feitos: 0, total: 0, pct: 0 }
  const feitos = store.get('topicos_' + k) || []
  let total = 0
  if (mat.conteudos) {
    for (const c of mat.conteudos) total += c.habilidades.length
  } else if (mat.topicos) {
    total = mat.topicos.length
  }
  return { feitos: feitos.length, total, pct: total ? Math.round((feitos.length / total) * 100) : 0 }
}

function getMateriasMaisFracas(limit = 4) {
  return Object.keys(ENEM)
    .map(k => ({ key: k, nome: ENEM[k].nome, icone: ENEM[k].icone, ...getProgressoMateria(k) }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, limit)
}

// ── Streak ─────────────────────────────────────────────
function getTodayStr() { return new Date().toISOString().slice(0, 10) }
function getStreak()   { return store.get('streak') || { count: 0, lastDate: null } }
function bumpStreak() {
  const s = getStreak(), hoje = getTodayStr()
  if (s.lastDate === hoje) return s
  const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const novo  = { count: s.lastDate === ontem ? s.count + 1 : 1, lastDate: hoje }
  store.set('streak', novo)
  checkConquistas()
  return novo
}

// ── Recomendados ───────────────────────────────────────
function getRecomendados(n = 3) {
  const fracas = getMateriasMaisFracas(Object.keys(ENEM).length)
  const result = []
  for (const mat of fracas) {
    if (result.length >= n) break
    const feitos = store.get('topicos_' + mat.key) || []
    const dific  = store.get('dific_' + mat.key) || {}
    for (const conteudo of ENEM[mat.key].conteudos) {
      if (result.length >= n) break
      for (const h of conteudo.habilidades) {
        const tKey = `${conteudo.id}__${h.id}`
        if (!feitos.includes(tKey)) {
          result.push({ materiaKey: mat.key, matNome: mat.nome, matIcone: mat.icone, tKey, texto: h.topico, prioridade: h.prioridade })
          break
        }
      }
    }
  }
  return result
}

// ── Registro diário ────────────────────────────────────
function getRegistroHoje() {
  return store.get('registro_' + getTodayStr()) || { nota: '', tempoMin: 0 }
}
function saveRegistroHoje(r) {
  store.set('registro_' + getTodayStr(), r)
  checkConquistas()
}

// Achievements
function getConquistasDefs() {
  return typeof CONQUISTAS !== 'undefined' ? CONQUISTAS : []
}

function getConquistasUnlockMap() {
  return store.get('conquistas_unlock') || {}
}

function setConquistasUnlockMap(map) {
  store.set('conquistas_unlock', map)
}

function unlockConquista(id) {
  const unlocks = getConquistasUnlockMap()
  if (unlocks[id]) return false
  unlocks[id] = { unlockedAt: new Date().toISOString() }
  setConquistasUnlockMap(unlocks)
  return true
}

function getMateriasIniciadasCount() {
  return Object.keys(ENEM).filter(k => getTempoMateria(k) > 0 || getTopicosFeitos(k).length > 0).length
}

function calcXPGlobal() {
  let xp = 0
  for (const k of Object.keys(ENEM)) {
    xp += getTopicosFeitos(k).length * 10
    xp += Math.floor(getTempoMateria(k) / 60)
  }
  xp += getStreak().count * 5
  return xp
}

function getNivelFromXP(xp) {
  let nivel = 1
  let restante = xp
  while (restante >= nivel * 250) {
    restante -= nivel * 250
    nivel++
  }
  return { nivel, xpAtual: restante, xpTotal: nivel * 250 }
}

function getConquistaProgress(def) {
  const global = getProgressoGlobal()
  const materiasIniciadas = getMateriasIniciadasCount()

  switch (def.tipo) {
    case 'tempo_total':
      return { atual: getTempoTotal(), alvo: def.alvo }
    case 'streak':
      return { atual: getStreak().count, alvo: def.alvo }
    case 'topicos_total':
      return { atual: global.feitos, alvo: def.alvo }
    case 'tempo_materia':
      return { atual: getTempoMateria(def.materiaKey), alvo: def.alvo }
    case 'progresso_materia':
      return { atual: getProgressoMateria(def.materiaKey).pct, alvo: def.alvo }
    case 'materias_iniciadas':
      return { atual: materiasIniciadas, alvo: def.alvo }
    case 'todas_materias_iniciadas':
      return { atual: materiasIniciadas, alvo: Object.keys(ENEM).length }
    case 'sessao_madrugada': {
      const registro = getRegistroHoje()
      const hora = new Date().getHours()
      const fezHoje = registro?.tempoMin > 0 || global.feitos > 0
      return { atual: fezHoje && hora < 5 ? 1 : 0, alvo: def.alvo }
    }
    case 'nivel':
      return { atual: getNivelFromXP(calcXPGlobal()).nivel, alvo: def.alvo }
    default:
      return { atual: 0, alvo: def.alvo || 1 }
  }
}

function isConquistaUnlocked(id) {
  return !!getConquistasUnlockMap()[id]
}

function getConquistasState() {
  return getConquistasDefs().map(def => {
    const progress = getConquistaProgress(def)
    const unlockedMeta = getConquistasUnlockMap()[def.id] || null
    const unlocked = !!unlockedMeta
    const pct = progress.alvo > 0 ? Math.max(0, Math.min(100, Math.round((progress.atual / progress.alvo) * 100))) : 0
    return {
      ...def,
      unlocked,
      unlockedAt: unlockedMeta?.unlockedAt || null,
      progressAtual: progress.atual,
      progressAlvo: progress.alvo,
      progressPct: unlocked ? 100 : pct,
    }
  })
}

function checkConquistas() {
  const defs = getConquistasDefs()
  if (!defs.length) return []
  const unlockedNow = []
  defs.forEach(def => {
    if (isConquistaUnlocked(def.id)) return
    const progress = getConquistaProgress(def)
    if (progress.atual >= progress.alvo) {
      if (unlockConquista(def.id)) unlockedNow.push(def.id)
    }
  })
  return unlockedNow
}

// ── Nota por tópico ────────────────────────────────────
function getNotaTopico(materiaKey, topicoIdx) {
  return store.get('nota_topico_' + materiaKey) || {}
}
function saveNotaTopico(materiaKey, topicoIdx, texto) {
  const all = getNotaTopico(materiaKey)
  all[topicoIdx] = texto
  store.set('nota_topico_' + materiaKey, all)
}
function getNotasMateria(materiaKey) {
  return store.get('nota_topico_' + materiaKey) || {}
}

// ── Nav ────────────────────────────────────────────────
function setNavActive() {
  const path = window.location.pathname.split('/').pop() || 'index.html'
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active')
  })
}

document.addEventListener('DOMContentLoaded', () => {
  checkConquistas()
  setNavActive()
  if (typeof lucide !== 'undefined') lucide.createIcons()
})
