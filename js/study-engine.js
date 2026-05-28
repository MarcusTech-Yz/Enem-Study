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

function calculateTopicUrgency(topic, userProfile = getUserProfile(), planConfig = getStudyPlanConfig()) {
  const state = getStudyTopicProgress(topic.id)
  let score = 0
  const reasons = []

  const recurrenceScore = Number(topic.recorrenciaEnem || 3) * 12
  score += recurrenceScore
  if (Number(topic.recorrenciaEnem || 0) >= 4) reasons.push('esse tema e recorrente no ENEM')

  const userFocus = userProfile.focoMateria || userProfile.prioridadeMateria
  if (userFocus && userFocus !== 'equilibrado' && userFocus === topic.materiaKey) {
    score += 25
    reasons.push(`voce marcou ${formatMateriaFoco(topic.materiaKey)} como prioridade`)
  }

  const mastery = Number(state.mastery || 0)
  if (mastery <= 30) {
    score += 20
    reasons.push('seu dominio nesse topico ainda esta baixo')
  } else if (mastery <= 60) {
    score += 10
    reasons.push('voce ainda pode consolidar melhor esse conteudo')
  }

  const difficultyScore = {
    nao_avaliado: 5,
    baixa: 0,
    media: 10,
    alta: 22,
    critica: 35,
  }
  score += difficultyScore[state.difficulty] || 0
  if (state.difficulty === 'alta' || state.difficulty === 'critica') {
    reasons.push('voce marcou esse topico como dificil')
  }

  const dueReviews = getDueReviewsForTopic(state).length
  if ((state.nextReviewAt && new Date(state.nextReviewAt) <= new Date()) || dueReviews > 0) {
    score += 30 + dueReviews * 4
    reasons.push('ha revisao pendente')
  }

  const wrongQuestions = state.questions.filter(question => question.status === 'errei').length + state.erros
  if (wrongQuestions > 0) {
    score += wrongQuestions * 8
    reasons.push(`voce errou ${wrongQuestions} questao${wrongQuestions !== 1 ? 'oes' : ''} desse topico`)
  }

  const daysToExam = daysBetweenStudy(new Date(), planConfig.examDate)
  const deadlinePressure = clampStudyValue(40 - daysToExam / 5, 0, 40)
  const notStarted = ['novo', 'nao_iniciado', 'pulado'].includes(state.status) && mastery === 0
  if (notStarted) {
    score += deadlinePressure
    if (daysToExam <= 90) reasons.push('esse conteudo ainda nao foi iniciado e o ENEM esta se aproximando')
  }

  if (Number(topic.tempoEstimadoMin || 30) <= Number(planConfig.sessionMinutes || 30)) {
    score += 4
  }

  if (state.skippedUntil && new Date(state.skippedUntil) > new Date()) {
    score -= 60
  }

  if (state.concluido || mastery >= 90 || state.status === 'dominado') {
    score -= dueReviews > 0 ? 15 : 45
  }

  return {
    topic,
    state,
    score: Math.round(score),
    reasons: reasons.slice(0, 3),
  }
}

function getDueReviewsForTopic(state) {
  return (state.reviews || []).filter(review =>
    review.status === 'pendente' && review.dueAt && new Date(review.dueAt) <= new Date()
  )
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

function generateSmartWeeklyPlan(planConfig = getStudyPlanConfig()) {
  const dayKeys = ['1', '2', '3', '4', '5', '6']
  const sessionsPerDay = Math.max(1, Math.floor(Number(planConfig.dailyMinutes || 60) / Number(planConfig.sessionMinutes || 30)))
  const horarios = getStudyWindowConfig(planConfig.period).horarios
  const recommendations = getStudyRecommendations(80, planConfig)
  const week = {}
  let pointer = 0

  dayKeys.forEach((dayKey, dayIndex) => {
    week[dayKey] = []
    for (let i = 0; i < sessionsPerDay; i++) {
      const recommendation = recommendations[pointer]
      if (!recommendation) break

      const topic = recommendation.topic
      week[dayKey].push({
        id: createStudySessionId(dayKey, i),
        topicId: topic.id,
        materiaKey: topic.materiaKey,
        key: topic.materiaKey,
        tKey: topic.tKey,
        titulo: topic.titulo,
        matNome: topic.matNome,
        matIcone: topic.matIcone,
        inicio: horarios[(dayIndex + i) % horarios.length],
        minutes: Number(planConfig.sessionMinutes || 30),
        duracao: String(planConfig.sessionMinutes || 30),
        score: recommendation.score,
        reason: explainStudyRecommendation(recommendation, planConfig.sessionMinutes),
        reasons: recommendation.reasons,
      })

      pointer++
    }
  })

  return week
}

function createStudySessionId(dayKey, index) {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID()
  return `session_${dayKey}_${index}_${Date.now()}`
}

function getStudyPlanRadar(planConfig = getStudyPlanConfig()) {
  const recommendations = getStudyRecommendations(120, planConfig)
  const urgent = recommendations.filter(item => item.score >= 80).length
  const attention = recommendations.filter(item => item.score >= 50 && item.score < 80).length
  const dueReviews = getAllDueStudyReviews().length
  const daysToExam = Math.max(0, daysBetweenStudy(new Date(), planConfig.examDate))

  return { urgent, attention, dueReviews, daysToExam }
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
