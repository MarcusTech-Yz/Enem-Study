// study-engine.js
// Camada de decisao para plano, urgencia e busca de conteudos.
// Depende de data/topicos.js, js/app.js e js/recommendation-engine.js.

function clampStudyValue(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function daysBetweenStudy(dateA, dateB) {
  const a = new Date(dateA)
  const b = new Date(dateB)
  return Math.ceil((b - a) / 86400000)
}

function normalizeStudyText(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getStudyPlanConfig(overrides = {}) {
  const profile = getUserProfile()
  const sessionFromStore = Number(store.get('focus_meta_min') ?? getMetaSessaoPadrao())
  const sessionMinutes = Number(overrides.sessionMinutes || sessionFromStore || getMetaSessaoPadrao() || 30)

  return {
    dailyMinutes: Number(overrides.dailyMinutes || profile.tempoDiaMin || 60),
    sessionMinutes: sessionMinutes > 0 ? sessionMinutes : 30,
    examDate: overrides.examDate || getEnemTargetDate().toISOString(),
    period: overrides.period || profile.periodoEstudo || 'noite',
  }
}

function getStudyTopics() {
  return getAllRecommendationTopics().map(topic => ({
    ...topic,
    area: inferTopicArea(topic.materiaKey),
    competencia: topic.habilidade?.competencia || topic.habilidade?.competenciaId || '',
    habilidade: topic.habilidadeId || topic.habilidade?.id || '',
    tags: buildTopicTags(topic),
    aliases: buildTopicAliases(topic),
  }))
}

function inferTopicArea(materiaKey) {
  if (['historia', 'geografia', 'filosofia', 'sociologia'].includes(materiaKey)) return 'ciencias-humanas'
  if (['matematica'].includes(materiaKey)) return 'matematica'
  if (['ciencias', 'biologia', 'fisica', 'quimica'].includes(materiaKey)) return 'ciencias-natureza'
  if (['portugues', 'ingles', 'espanhol', 'redacao'].includes(materiaKey)) return 'linguagens'
  return 'geral'
}

function buildTopicTags(topic) {
  const chunks = [
    topic.titulo,
    topic.descricao,
    topic.conteudoNome,
    topic.prioridade,
    topic.materiaKey,
    topic.matNome,
  ]

  return [...new Set(chunks
    .join(' ')
    .split(/[,;:()\-–—/]+|\s+e\s+|\s+ou\s+/i)
    .map(part => part.trim())
    .filter(part => part.length >= 4)
    .slice(0, 18))]
}

function buildTopicAliases(topic) {
  const title = topic.titulo || ''
  const aliases = [title]

  if (title.includes(':')) aliases.push(title.split(':').pop().trim())
  if (title.includes('(')) aliases.push(title.replace(/\(.*?\)/g, '').trim())
  if (topic.conteudoNome) aliases.push(topic.conteudoNome)

  return [...new Set(aliases.filter(Boolean))]
}

function getStudyTopicProgress(topicId) {
  const state = getUserTopicState(topicId)

  return {
    status: state.status || 'novo',
    difficulty: state.difficulty || inferDifficultyFromState(state),
    mastery: Number.isFinite(Number(state.mastery)) ? Number(state.mastery) : inferMasteryFromStudyState(state),
    lastStudyAt: state.lastStudyAt || state.updatedAt || null,
    nextReviewAt: state.nextReviewAt || state.proximaRevisao || null,
    questions: Array.isArray(state.questions) ? state.questions : [],
    reviews: Array.isArray(state.reviews) ? state.reviews : [],
    acertos: Number(state.acertos || 0),
    erros: Number(state.erros || 0),
    concluido: !!state.concluido,
    skippedUntil: state.skippedUntil || null,
    postponedCount: Number(state.postponedCount || 0),
    lastPostponedAt: state.lastPostponedAt || null,
    tempoSeg: Number(state.tempoSeg || 0),
  }
}

function inferDifficultyFromState(state) {
  if (Number(state.dificuldadeDoUsuario || 0) >= 3) return 'alta'
  if (Number(state.dificuldadeDoUsuario || 0) === 2) return 'media'
  if (state.status === 'dominado') return 'baixa'
  return 'nao_avaliado'
}

function inferMasteryFromStudyState(state) {
  if (state.status === 'dominado') return 85
  if (state.status === 'parcial') return 55
  if (state.status === 'dificuldade') return 25
  if (state.concluido) return 75
  if (Number(state.tempoSeg || 0) > 0) return 25
  return 0
}

function getDueReviewsForTopic(state) {
  return (state.reviews || []).filter(review =>
    review.status === 'pendente' && review.dueAt && new Date(review.dueAt) <= new Date()
  )
}

function hasStudyEvidence(state) {
  return !!(
    state.concluido ||
    Number(state.tempoSeg || 0) > 0 ||
    Number(state.acertos || 0) > 0 ||
    Number(state.erros || 0) > 0 ||
    (Array.isArray(state.questions) && state.questions.length) ||
    (Array.isArray(state.reviews) && state.reviews.length) ||
    (state.difficulty && state.difficulty !== 'nao_avaliado') ||
    (state.status && !['novo', 'nao_iniciado', 'pulado'].includes(state.status))
  )
}

function getStudyWrongQuestionCount(state) {
  const embedded = Array.isArray(state.questions)
    ? state.questions.filter(question => question.status === 'errei').length
    : 0

  return embedded + Number(state.erros || 0)
}

function calculateTopicUrgency(topic, userProfile = getUserProfile(), planConfig = getStudyPlanConfig()) {
  const state = getStudyTopicProgress(topic.id)
  let score = 0
  const reasons = []
  const hasEvidence = hasStudyEvidence(state)
  const wrongQuestions = getStudyWrongQuestionCount(state)
  const dueReviews = getDueReviewsForTopic(state).length
  const hasDueReview = dueReviews > 0 || (state.nextReviewAt && new Date(state.nextReviewAt) <= new Date())
  const isWeak = hasEvidence && (
    state.status === 'dificuldade' ||
    state.difficulty === 'alta' ||
    state.difficulty === 'critica' ||
    wrongQuestions > Number(state.acertos || 0)
  )

  const pedagogicalWeight = Number(topic.pesoPedagogico || topic.recorrenciaEnem || 3)
  score += pedagogicalWeight * 6
  if (pedagogicalWeight >= 4) reasons.push('esse tema tem peso alto na curadoria ENEM')

  const userFocus = userProfile.focoMateria || userProfile.prioridadeMateria
  if (userFocus && userFocus !== 'equilibrado' && userFocus === topic.materiaKey) {
    score += 18
    reasons.push(`voce marcou ${formatMateriaFoco(topic.materiaKey)} como prioridade`)
  }

  const mastery = Number(state.mastery || 0)
  if (hasEvidence && mastery > 0 && mastery <= 30) {
    score += 18
    reasons.push('seu dominio nesse topico ainda esta baixo')
  } else if (hasEvidence && mastery > 30 && mastery <= 60) {
    score += 8
    reasons.push('voce ainda pode consolidar melhor esse conteudo')
  }

  const difficultyScore = {
    nao_avaliado: 0,
    baixa: 0,
    media: hasEvidence ? 8 : 0,
    alta: hasEvidence ? 24 : 0,
    critica: hasEvidence ? 36 : 0,
  }
  score += difficultyScore[state.difficulty] || 0
  if (state.difficulty === 'alta' || state.difficulty === 'critica') {
    reasons.push('voce marcou esse topico como dificil')
  }

  if (hasDueReview) {
    score += 30 + dueReviews * 4
    reasons.push('ha revisao pendente')
  }

  if (wrongQuestions > 0) {
    score += wrongQuestions * 8
    reasons.push(`voce errou ${wrongQuestions} questao${wrongQuestions !== 1 ? 'oes' : ''} desse topico`)
  }

  const daysToExam = daysBetweenStudy(new Date(), planConfig.examDate)
  const deadlinePressure = daysToExam <= 90 ? clampStudyValue(20 - daysToExam / 8, 0, 20) : 0
  const notStarted = ['novo', 'nao_iniciado', 'pulado'].includes(state.status) && mastery === 0
  if (notStarted) {
    score += deadlinePressure
    if (daysToExam <= 90) reasons.push('esse conteudo ainda nao foi iniciado e o ENEM esta se aproximando')
  }

  if (Number(topic.tempoEstimadoMin || 30) <= Number(planConfig.sessionMinutes || 30)) {
    score += 4
  }

  if (Number(state.postponedCount || 0) >= 3) {
    score += 10
    reasons.push('voce adiou esse topico algumas vezes')
  }

  if (state.skippedUntil && new Date(state.skippedUntil) > new Date()) {
    score -= 60
  }

  if (state.concluido || mastery >= 90 || state.status === 'dominado') {
    score -= hasDueReview ? 15 : 45
  }

  return {
    topic,
    state,
    score: Math.round(score),
    isWeak,
    hasEvidence,
    hasDueReview,
    reasons: reasons.slice(0, 3),
  }
}

function explainStudyRecommendation(recommendation, sessionMinutes) {
  const base = recommendation.reasons.length
    ? recommendation.reasons.join(', ')
    : 'esse topico ajuda a manter sua rota equilibrada'

  const sentence = base.charAt(0).toUpperCase() + base.slice(1)
  return `${sentence} e cabe no seu bloco de ${sessionMinutes} minutos.`
}

function getStudyRecommendations(limit = 20, planConfig = getStudyPlanConfig()) {
  const profile = getUserProfile()
  return getStudyTopics()
    .map(topic => calculateTopicUrgency(topic, profile, planConfig))
    .filter(item => item.score > -30)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function getTodayStudyKey() {
  const day = new Date().getDay()
  if (day >= 1 && day <= 6) return String(day)
  return '1'
}

function getWeeklyPlanStats(week) {
  const stats = {
    total: 0,
    byMateria: {},
    byArea: {},
  }

  Object.values(week).flat().forEach(session => {
    stats.total++
    stats.byMateria[session.materiaKey] = (stats.byMateria[session.materiaKey] || 0) + 1

    const area = session.area || inferTopicArea(session.materiaKey)
    stats.byArea[area] = (stats.byArea[area] || 0) + 1
  })

  return stats
}

function getDayLastSession(week, dayKey) {
  const sessions = week[dayKey] || []
  return sessions[sessions.length - 1] || null
}

function getPreviousDayLastSession(week, dayKey) {
  const previousDay = String(Number(dayKey) - 1)
  if (!week[previousDay]) return null

  const sessions = week[previousDay]
  return sessions[sessions.length - 1] || null
}

function getPlanBalanceRules(totalSessions) {
  const profile = getUserProfile()
  const focus = profile.focoMateria

  return {
    focusMateria: focus && focus !== 'equilibrado' ? focus : null,
    maxFocusShare: 0.42,
    maxSingleMateriaShare: 0.28,
    maxSingleAreaShare: 0.58,
    maxSameMateriaInDay: 1,
    totalSessions,
  }
}

function wouldBreakBalance(candidate, week, dayKey, rules) {
  const stats = getWeeklyPlanStats(week)
  const materiaKey = candidate.topic.materiaKey
  const materiaCount = stats.byMateria[materiaKey] || 0
  const area = candidate.topic.area || inferTopicArea(materiaKey)
  const areaCount = stats.byArea[area] || 0

  const maxFocus = Math.ceil(rules.totalSessions * rules.maxFocusShare)
  const maxSingleMateria = Math.ceil(rules.totalSessions * rules.maxSingleMateriaShare)
  const maxSingleArea = Math.ceil(rules.totalSessions * rules.maxSingleAreaShare)
  const isFocus = rules.focusMateria && materiaKey === rules.focusMateria

  if (isFocus && materiaCount >= maxFocus) return true
  if (!isFocus && materiaCount >= maxSingleMateria) return true
  if (areaCount >= maxSingleArea) return true

  const sameMateriaInDay = (week[dayKey] || []).filter(session => session.materiaKey === materiaKey).length
  if (sameMateriaInDay >= rules.maxSameMateriaInDay) return true

  const lastSameDay = getDayLastSession(week, dayKey)
  if (lastSameDay && lastSameDay.materiaKey === materiaKey) return true

  const previousDayLast = getPreviousDayLastSession(week, dayKey)
  if (previousDayLast && previousDayLast.materiaKey === materiaKey) return true

  return false
}

function getBalancedCandidate(recommendations, usedIds, week, dayKey, rules) {
  const available = recommendations.filter(item => !usedIds.has(item.topic.id))

  const balanced = available.find(item => !wouldBreakBalance(item, week, dayKey, rules))
  if (balanced) return balanced

  return available[0] || null
}

function buildStudySessionFromRecommendation(recommendation, dayKey, index, planConfig, horarios) {
  const topic = recommendation.topic

  return {
    id: createStudySessionId(dayKey, index),
    topicId: topic.id,
    materiaKey: topic.materiaKey,
    key: topic.materiaKey,
    area: topic.area || inferTopicArea(topic.materiaKey),
    tKey: topic.tKey,
    titulo: topic.titulo,
    matNome: topic.matNome,
    matIcone: topic.matIcone,
    inicio: horarios[index % horarios.length],
    minutes: Number(planConfig.sessionMinutes || 30),
    duracao: String(planConfig.sessionMinutes || 30),
    score: recommendation.score,
    urgencyLevel: getUrgencyLevel(recommendation.score),
    reason: explainStudyRecommendation(recommendation, planConfig.sessionMinutes),
    reasons: recommendation.reasons,
  }
}

function getUrgencyLevel(score) {
  if (score >= 86) return 'critica'
  if (score >= 66) return 'alta'
  if (score >= 48) return 'media'
  return 'baixa'
}

function generateSmartWeeklyPlan(planConfig = getStudyPlanConfig()) {
  const dayKeys = ['1', '2', '3', '4', '5', '6']
  const sessionsPerDay = Math.max(1, Math.floor(Number(planConfig.dailyMinutes || 60) / Number(planConfig.sessionMinutes || 30)))
  const horarios = getStudyWindowConfig(planConfig.period).horarios
  const totalSessions = dayKeys.length * sessionsPerDay
  const recommendations = getStudyRecommendations(150, planConfig)
  const rules = getPlanBalanceRules(totalSessions)
  const week = {}
  const usedIds = new Set()

  dayKeys.forEach(dayKey => {
    week[dayKey] = []

    for (let i = 0; i < sessionsPerDay; i++) {
      const recommendation = getBalancedCandidate(recommendations, usedIds, week, dayKey, rules)
      if (!recommendation) break

      const session = buildStudySessionFromRecommendation(recommendation, dayKey, i, planConfig, horarios)
      week[dayKey].push(session)
      usedIds.add(recommendation.topic.id)
    }
  })

  return week
}

function createStudySessionId(dayKey, index) {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID()
  return `session_${dayKey}_${index}_${Date.now()}`
}

function getStudyPlanRadar(planConfig = getStudyPlanConfig()) {
  const topics = getStudyTopics().map(topic => calculateTopicUrgency(topic, getUserProfile(), planConfig))
  const weak = topics.filter(item => item.isWeak).length
  const unstarted = topics.filter(item => !item.hasEvidence && !item.state.concluido).length
  const attention = topics.filter(item => item.score >= 48 && item.hasEvidence).length
  const dueReviews = getAllDueStudyReviews().length
  const daysToExam = Math.max(0, daysBetweenStudy(new Date(), planConfig.examDate))

  return { weak, unstarted, attention, dueReviews, daysToExam }
}

function getAllDueStudyReviews() {
  return getStudyTopics().flatMap(topic => {
    const state = getStudyTopicProgress(topic.id)
    return getDueReviewsForTopic(state).map(review => ({ ...review, topic }))
  })
}

function getTopicUrlFromStudyTopic(topic) {
  return `topico.html?m=${encodeURIComponent(topic.materiaKey)}&id=${encodeURIComponent(topic.tKey)}`
}

function searchStudyTopics(query, topics = getStudyTopics()) {
  const normalizedQuery = normalizeStudyText(query)
  if (!normalizedQuery || normalizedQuery.length < 2) return []

  return topics
    .map(topic => {
      const title = normalizeStudyText(topic.titulo)
      const tags = topic.tags || []
      const aliases = topic.aliases || []
      const searchable = normalizeStudyText([
        topic.titulo,
        topic.descricao,
        topic.materiaKey,
        topic.matNome,
        topic.conteudoNome,
        topic.competencia,
        topic.habilidade,
        ...tags,
        ...aliases,
      ].join(' '))

      let score = 0
      if (title.includes(normalizedQuery)) score += 50
      if (tags.some(tag => normalizeStudyText(tag).includes(normalizedQuery))) score += 30
      if (aliases.some(alias => normalizeStudyText(alias).includes(normalizedQuery))) score += 25
      if (searchable.includes(normalizedQuery)) score += 10

      return { topic, score }
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
}

function debounceStudy(fn, delay = 180) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}
