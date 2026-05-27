// ── app.js ──

const store = {
  get: (key) => JSON.parse(localStorage.getItem(key) || 'null'),
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
}

const DEFAULT_USER_PROFILE = {
  nome: '',
  enemAno: 2026,
  tempoDiaMin: 60,
  focoMateria: 'equilibrado',
  ritmoAtual: 'irregular',
  formatoPreferido: 'misturado',
  onboardingDone: false,
  createdAt: null,
  updatedAt: null,
}

function getUserProfile() {
  return {
    ...DEFAULT_USER_PROFILE,
    ...(store.get('userProfile') || {})
  }
}

function saveUserProfile(profile) {
  const current = getUserProfile()
  const now = new Date().toISOString()

  const next = {
    ...current,
    ...profile,
    updatedAt: now,
    createdAt: current.createdAt || now
  }

  store.set('userProfile', next)

  return next
}

function finishOnboarding(profile) {
  const finalProfile = saveUserProfile({
    ...profile,
    onboardingDone: true
  })

  // Compatibilidade com configuracoes ja existentes.
  if (finalProfile.tempoDiaMin) {
    store.set('tempo_diario', finalProfile.tempoDiaMin)
  }

  if (finalProfile.enemAno) {
    store.set('enem_ano', finalProfile.enemAno)
  }

  if (finalProfile.focoMateria) {
    store.set('materia_prioritaria', finalProfile.focoMateria)
  }

  if (finalProfile.nome?.trim()) {
    store.set('perfil_nome', finalProfile.nome.trim())
  }

  seedInitialGradeFromProfile(finalProfile)

  return finalProfile
}

function shouldShowOnboarding() {
  return !getUserProfile().onboardingDone
}

function getDisplayName() {
  const profile = getUserProfile()
  return profile.nome?.trim() || ''
}

function getGreetingName() {
  const name = getDisplayName()
  return name ? `, ${name}` : ''
}

function getQuantidadeTopicosHoje() {
  const tempo = Number(getUserProfile().tempoDiaMin || 60)

  if (tempo <= 30) return 1
  if (tempo <= 60) return 2
  if (tempo <= 120) return 4
  return 5
}

function getMetaSessaoPadrao() {
  const tempo = Number(getUserProfile().tempoDiaMin || 60)

  if (tempo <= 30) return 10
  if (tempo <= 60) return 25
  if (tempo <= 120) return 25
  return 45
}

function getEnemTargetDate() {
  const profile = getUserProfile()
  const year = Number(profile.enemAno || 2026)
  const d = new Date(year, 10, 1)

  while (d.getDay() !== 0) {
    d.setDate(d.getDate() + 1)
  }

  return d
}

function getDiasAteEnem() {
  const hoje = new Date()
  const alvo = getEnemTargetDate()
  const diff = alvo - hoje
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function getRitmoEnemLabel() {
  const dias = getDiasAteEnem()

  if (dias <= 120) return 'reta final'
  if (dias <= 240) return 'ritmo de consolidação'
  return 'construção de base'
}

function formatTempoOnboarding(min) {
  if (min >= 180) return '3 horas+'
  if (min === 120) return '2 horas'
  if (min === 60) return '1 hora'
  return `${min} min`
}

function formatMateriaFoco(value) {
  const map = {
    equilibrado: 'Equilibrado',
    matematica: 'Matemática',
    portugues: 'Português',
    historia: 'História',
    geografia: 'Geografia',
    ciencias: 'Ciências da Natureza',
    redacao: 'Redação'
  }

  if (map[value]) return map[value]
  return typeof ENEM !== 'undefined' && ENEM[value]?.nome ? ENEM[value].nome : value
}

function formatRitmo(value) {
  const map = {
    recomecando: 'Recomeçando',
    irregular: 'Irregular',
    razoavel: 'Razoável',
    constante: 'Constante'
  }

  return map[value] || value
}

function formatFormato(value) {
  const map = {
    resumos: 'Resumos',
    questoes: 'Questões',
    videos: 'Vídeos',
    revisao: 'Revisão rápida',
    misturado: 'Misturado'
  }

  return map[value] || value
}

function getFocusMateriaMessage() {
  const foco = getUserProfile().focoMateria

  if (!foco || foco === 'equilibrado') {
    return 'Plano equilibrado entre as áreas.'
  }

  return `${formatMateriaFoco(foco)} aparece com mais frequência no seu plano.`
}

function getRitmoConfig() {
  const ritmo = getUserProfile().ritmoAtual

  const configs = {
    recomecando: {
      label: 'Recomeçando',
      dailyBonusText: 'Hoje, uma sessão curta já conta.',
      intensity: 'leve'
    },
    irregular: {
      label: 'Irregular',
      dailyBonusText: 'O foco hoje é só não quebrar o ciclo.',
      intensity: 'leve'
    },
    razoavel: {
      label: 'Razoável',
      dailyBonusText: 'Boa: dá para misturar conteúdo novo e revisão.',
      intensity: 'medio'
    },
    constante: {
      label: 'Constante',
      dailyBonusText: 'Seu ritmo permite um plano mais forte.',
      intensity: 'forte'
    }
  }

  return configs[ritmo] || configs.irregular
}

function getFormatoPreferidoAction() {
  const formato = getUserProfile().formatoPreferido

  const actions = {
    resumos: {
      label: 'Comece criando um bloco de resumo.',
      tab: 'anotacoes'
    },
    questoes: {
      label: 'Depois da teoria, tente resolver questões.',
      tab: 'questoes'
    },
    videos: {
      label: 'Use um vídeo curto para destravar o tópico.',
      tab: 'videos'
    },
    revisao: {
      label: 'Faça uma revisão rápida e marque sua compreensão.',
      tab: 'anotacoes'
    },
    misturado: {
      label: 'Misture anotação, foco e revisão.',
      tab: 'anotacoes'
    }
  }

  return actions[formato] || actions.misturado
}

function getPersonalizacao() {
  const profile = getUserProfile()
  const ritmoConfig = getRitmoConfig()

  return {
    nome: profile.nome?.trim() || 'Estudante',
    tempoDiaMin: Number(profile.tempoDiaMin || 60),
    qtdTopicosHoje: getQuantidadeTopicosHoje(),
    metaSessaoPadrao: getMetaSessaoPadrao(),
    diasAteEnem: getDiasAteEnem(),
    ritmoLabel: ritmoConfig.label,
    ritmoMensagem: ritmoConfig.dailyBonusText,
    ritmoIntensidade: ritmoConfig.intensity,
    focoMensagem: getFocusMateriaMessage(),
    formatoAcao: getFormatoPreferidoAction(),
    enemRitmoLabel: getRitmoEnemLabel()
  }
}

function seedInitialGradeFromProfile(profile = getUserProfile()) {
  if (typeof ENEM === 'undefined') return null

  const grade = getGrade()
  const materias = Object.keys(ENEM)
  const foco = profile.focoMateria
  const rotacao = foco && foco !== 'equilibrado' && materias.includes(foco)
    ? [foco, ...materias.filter(k => k !== foco)]
    : materias
  const horarios = ['08:00', '09:00', '10:00', '14:00', '15:00']
  const duracao = String(profile.tempoDiaMin || 60)
  let mIdx = 0
  let changed = false

  for (let dia = 1; dia <= 6; dia++) {
    if (!Array.isArray(grade[dia])) grade[dia] = []
    if (grade[dia].length === 0 && rotacao.length) {
      grade[dia] = [{
        key: rotacao[mIdx % rotacao.length],
        inicio: horarios[mIdx % horarios.length],
        duracao
      }]
      mIdx++
      changed = true
    }
  }

  if (changed) saveGrade(grade)
  return grade
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
function normalizeTopicosFeitos(value) {
  return Array.isArray(value)
    ? [...new Set(value.filter(Boolean).map(String))]
    : []
}

function getTopicosFeitos(k) {
  return normalizeTopicosFeitos(store.get('topicos_' + k))
}

function saveTopicosFeitos(k, feitos) {
  const normalizados = normalizeTopicosFeitos(feitos)
  store.set('topicos_' + k, normalizados)
  runConquistasCheck()
  return normalizados
}

function isTopicoFeito(materiaKey, tKey) {
  return getTopicosFeitos(materiaKey).includes(String(tKey))
}

function marcarTopicoFeito(materiaKey, tKey) {
  const key = String(tKey)
  const feitos = getTopicosFeitos(materiaKey)
  if (feitos.includes(key)) return feitos

  feitos.push(key)
  store.set('topicos_' + materiaKey, feitos)
  bumpStreak()
  runConquistasCheck()
  return feitos
}

function marcarTopicosFeitos(materiaKey, tKeys) {
  const feitos = getTopicosFeitos(materiaKey)
  const novos = normalizeTopicosFeitos(tKeys).filter(k => !feitos.includes(k))
  if (!novos.length) return feitos

  const todos = [...feitos, ...novos]
  store.set('topicos_' + materiaKey, todos)
  bumpStreak()
  runConquistasCheck()
  return todos
}

function desmarcarTopicoFeito(materiaKey, tKey) {
  const key = String(tKey)
  const feitos = getTopicosFeitos(materiaKey).filter(k => k !== key)
  store.set('topicos_' + materiaKey, feitos)
  runConquistasCheck()
  return feitos
}

function desmarcarTodosTopicos(materiaKey) {
  store.set('topicos_' + materiaKey, [])
  runConquistasCheck()
  return []
}

function toggleTopicoFeito(materiaKey, tKey) {
  return isTopicoFeito(materiaKey, tKey)
    ? desmarcarTopicoFeito(materiaKey, tKey)
    : marcarTopicoFeito(materiaKey, tKey)
}

function toggleTopico(k, idx) {
  return toggleTopicoFeito(k, idx)
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

function getTopicosMateria(materiaKey) {
  const mat = ENEM[materiaKey]
  if (!mat) return []

  if (Array.isArray(mat.conteudos)) {
    const result = []
    for (const conteudo of mat.conteudos) {
      for (const habilidade of conteudo.habilidades || []) {
        result.push({
          key: `${conteudo.id}__${habilidade.id}`,
          conteudoId: conteudo.id,
          conteudoNome: conteudo.nome,
          habilidadeId: habilidade.id,
          titulo: habilidade.topico || habilidade.titulo || String(habilidade.id),
          descricao: habilidade.descricao || '',
          prioridade: habilidade.prioridade || '',
          habilidade,
          conteudo,
        })
      }
    }
    return result
  }

  if (Array.isArray(mat.topicos)) {
    return mat.topicos.map((topico, idx) => ({
      key: String(idx),
      conteudoId: '',
      conteudoNome: '',
      habilidadeId: String(idx),
      titulo: typeof topico === 'string' ? topico : (topico?.titulo || topico?.topico || String(topico)),
      descricao: '',
      prioridade: '',
      habilidade: topico,
      conteudo: null,
    }))
  }

  return []
}

function getTopicoMateriaInfo(materiaKey, topicoKey) {
  const key = String(topicoKey)
  return getTopicosMateria(materiaKey).find(t =>
    t.key === key ||
    String(t.habilidadeId) === key ||
    t.titulo.toLowerCase() === key.toLowerCase()
  ) || null
}

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

  const registro = getRegistroHoje()
  registro.tempoSeg = (registro.tempoSeg || 0) + segundos
  registro.tempoMin = Math.floor((registro.tempoSeg || 0) / 60)
  registro.ultimaMateria = materiaKey
  registro.updatedAt = new Date().toISOString()

  store.set('registro_' + getTodayStr(), registro)

  runConquistasCheck()
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
    const topicosTotais = getTopicosMateria(k).length
    total  += topicosTotais
    feitos += getTopicosFeitos(k).length
  }
  return { total, feitos }
}

function getProgressoMateria(k) {
  if (!ENEM[k]) return { feitos: 0, total: 0, pct: 0 }
  const feitos = getTopicosFeitos(k)
  const total = getTopicosMateria(k).length
  return { feitos: feitos.length, total, pct: total ? Math.round((feitos.length / total) * 100) : 0 }
}

function getMateriasMaisFracas(limit = 4) {
  return Object.keys(ENEM)
    .map(k => ({ key: k, nome: ENEM[k].nome, icone: ENEM[k].icone, ...getProgressoMateria(k) }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, limit)
}

// ── Streak ─────────────────────────────────────────────
function getLocalDateStr(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${y}-${m}-${day}`
}

function getTodayStr() { return getLocalDateStr(0) }
function getStreak()   { return store.get('streak') || { count: 0, lastDate: null } }
function bumpStreak() {
  const s = getStreak()
  const hoje = getTodayStr()
  if (s.lastDate === hoje) return s

  const ontem = getLocalDateStr(-1)
  const novo = {
    count: s.lastDate === ontem ? s.count + 1 : 1,
    lastDate: hoje
  }

  store.set('streak', novo)
  runConquistasCheck()
  return novo
}

// ── Recomendados ───────────────────────────────────────
function getRecomendados(n = 3) {
  const fracas = getMateriasMaisFracas(Object.keys(ENEM).length)
  const result = []
  for (const mat of fracas) {
    if (result.length >= n) break
    const feitos = getTopicosFeitos(mat.key)
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
  runConquistasCheck()
}

// Achievements
function getConquistasDefs() {
  if (typeof window !== 'undefined' && Array.isArray(window.CONQUISTAS)) return window.CONQUISTAS
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

function runConquistasCheck() {
  if (typeof checkConquistasComToast === 'function') return checkConquistasComToast()
  return checkConquistas()
}

// ── Nota por tópico ────────────────────────────────────
function getNotaTopico(materiaKey, topicoIdx) {
  return getNotasMateria(materiaKey)[topicoIdx] || ''
}
function saveNotaTopico(materiaKey, topicoIdx, texto) {
  const all = getNotasMateria(materiaKey)
  all[topicoIdx] = texto
  store.set('nota_topico_' + materiaKey, all)
}
function getNotasMateria(materiaKey) {
  const all = store.get('nota_topico_' + materiaKey) || {}
  let changed = false

  for (const topico of getTopicosMateria(materiaKey)) {
    const legacy = store.get(`tuniv_anotacao_${topico.key}`) || store.get(`nota_foco_${materiaKey}_${topico.key}`) || ''
    if (!(topico.key in all) && legacy) {
      all[topico.key] = legacy
      changed = true
    }
  }

  if (changed) store.set('nota_topico_' + materiaKey, all)
  return all
}

// ── Sessão global de foco ──────────────────────────────
const ACTIVE_FOCUS_KEY = 'active_focus_session'

function getActiveFocusSession() {
  return store.get(ACTIVE_FOCUS_KEY)
}

function setActiveFocusSession(session) {
  store.set(ACTIVE_FOCUS_KEY, session)
  return session
}

function clearActiveFocusSession() {
  localStorage.removeItem(ACTIVE_FOCUS_KEY)
}

function getFocusSessionId(materiaKey, tKey) {
  return `${getTodayStr()}_${materiaKey}_${tKey}`
}

function createFocusSession({ materiaKey, tKey, texto, matNome, metaMin = 25 }) {
  const session = {
    id: getFocusSessionId(materiaKey, tKey),
    materiaKey,
    tKey,
    texto,
    matNome,
    metaMin,
    accumulatedSec: 0,
    committedSec: 0,
    running: false,
    startedAt: null,
    updatedAt: new Date().toISOString(),
  }

  return setActiveFocusSession(session)
}

function getFocusElapsed(session = getActiveFocusSession()) {
  if (!session) return 0

  const base = Number(session.accumulatedSec || 0)

  if (!session.running || !session.startedAt) {
    return base
  }

  const diff = Math.floor((Date.now() - Number(session.startedAt)) / 1000)
  return base + Math.max(0, diff)
}

function startActiveFocusSession() {
  const session = getActiveFocusSession()
  if (!session) return null
  if (session.running) return session

  session.running = true
  session.startedAt = Date.now()
  session.updatedAt = new Date().toISOString()

  return setActiveFocusSession(session)
}

function pauseActiveFocusSession() {
  const session = getActiveFocusSession()
  if (!session) return null

  session.accumulatedSec = getFocusElapsed(session)
  session.running = false
  session.startedAt = null
  session.updatedAt = new Date().toISOString()

  return setActiveFocusSession(session)
}

function updateActiveFocusMeta(metaMin) {
  const session = getActiveFocusSession()
  if (!session) return null

  session.metaMin = Number(metaMin)
  session.updatedAt = new Date().toISOString()

  return setActiveFocusSession(session)
}

function saveActiveFocusTime() {
  let session = getActiveFocusSession()
  if (!session) return { ok: false, message: 'Nenhuma sessão ativa.' }

  const elapsed = getFocusElapsed(session)
  const committed = Number(session.committedSec || 0)
  const delta = elapsed - committed

  if (delta <= 0) {
    return { ok: false, message: 'Nada novo para salvar.' }
  }

  addTempo(session.materiaKey, session.tKey, delta)

  const key = 'sessoes_' + getTodayStr()
  const sessoes = store.get(key) || []
  sessoes.push({
    materiaKey: session.materiaKey,
    tKey: session.tKey,
    matNome: session.matNome,
    topicoNome: session.texto,
    durSeg: delta,
    hora: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  })
  store.set(key, sessoes)

  session = getActiveFocusSession()
  session.accumulatedSec = elapsed
  session.committedSec = elapsed
  session.startedAt = session.running ? Date.now() : null
  session.updatedAt = new Date().toISOString()
  setActiveFocusSession(session)

  return {
    ok: true,
    delta,
    message: `Sessão salva: ${formatTempo(delta)}.`,
  }
}

function concludeActiveFocusTopic() {
  const session = getActiveFocusSession()
  if (!session) return { ok: false, message: 'Nenhuma sessão ativa.' }

  const saved = saveActiveFocusTime()

  marcarTopicoFeito(session.materiaKey, session.tKey)
  clearActiveFocusSession()

  return {
    ok: true,
    saved,
    message: 'Tópico concluído! Progresso registrado.',
  }
}

function isActiveFocusForTopic(materiaKey, tKey) {
  const session = getActiveFocusSession()
  return !!session &&
    session.materiaKey === materiaKey &&
    String(session.tKey) === String(tKey)
}

// ── Nav ────────────────────────────────────────────────
function setNavActive() {
  const path = window.location.pathname.split('/').pop() || 'index.html'
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active')
  })
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initToastSystem === 'function') initToastSystem()
  runConquistasCheck()
  setNavActive()
  if (typeof lucide !== 'undefined') lucide.createIcons()
})
