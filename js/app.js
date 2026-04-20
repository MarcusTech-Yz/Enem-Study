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
function saveRegistroHoje(r) { store.set('registro_' + getTodayStr(), r) }

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
  setNavActive()
  if (typeof lucide !== 'undefined') lucide.createIcons()
})