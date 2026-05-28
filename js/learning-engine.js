// learning-engine.js
// Snapshot unico para plano, progresso e recomendacoes de estudo.
// Depende de data/topicos.js, js/app.js, js/recommendation-engine.js e js/study-engine.js.

const LEARNING_ENGINE_VERSION = '1.0.0'
const MANUAL_PLAN_KEY = 'manual_plan_overrides_v1'
const CLEARED_PLAN_DAYS_KEY = 'cleared_plan_days_v1'

function getDefaultPlanWeek() {
  return { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
}

function getManualPlanOverrides() {
  return {
    ...getDefaultPlanWeek(),
    ...(store.get(MANUAL_PLAN_KEY) || {}),
  }
}

function saveManualPlanOverrides(overrides) {
  const normalized = getDefaultPlanWeek()

  Object.keys(normalized).forEach(dayKey => {
    normalized[dayKey] = Array.isArray(overrides?.[dayKey]) ? overrides[dayKey] : []
  })

  store.set(MANUAL_PLAN_KEY, normalized)
  return normalized
}

function getClearedPlanDays() {
  return Array.isArray(store.get(CLEARED_PLAN_DAYS_KEY)) ? store.get(CLEARED_PLAN_DAYS_KEY).map(String) : []
}

function saveClearedPlanDays(days) {
  const normalized = [...new Set((days || []).map(String).filter(dayKey => getDefaultPlanWeek()[dayKey]))]
  store.set(CLEARED_PLAN_DAYS_KEY, normalized)
  return normalized
}

function markPlanDayCleared(dayKey) {
  return saveClearedPlanDays([...getClearedPlanDays(), String(dayKey)])
}

function unmarkPlanDayCleared(dayKey) {
  return saveClearedPlanDays(getClearedPlanDays().filter(item => item !== String(dayKey)))
}

function clearPlanDay(dayKey) {
  const manual = getManualPlanOverrides()
  manual[dayKey] = []
  saveManualPlanOverrides(manual)
  markPlanDayCleared(dayKey)
}

function clearAllPlanDayClears() {
  return saveClearedPlanDays([])
}

function createManualPlanSessionId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID()
  return `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function createManualPlanSession(dayKey, topic, options = {}) {
  const minutes = Number(options.minutes || 60)

  return {
    id: options.id || createManualPlanSessionId(),
    topicId: topic.id,
    materiaKey: topic.materiaKey,
    key: topic.materiaKey,
    area: topic.area || inferTopicArea(topic.materiaKey),
    tKey: topic.tKey,
    titulo: topic.titulo,
    matNome: topic.matNome,
    matIcone: topic.matIcone,
    inicio: options.inicio || '14:00',
    minutes,
    duracao: String(minutes),
    score: 0,
    urgencyLevel: 'manual',
    reason: 'Voce escolheu este topico manualmente para sua rota.',
    reasons: ['escolhido manualmente'],
    source: 'manual',
    locked: true,
    dayKey: String(dayKey),
    replacesSessionId: options.replacesSessionId || null,
    createdAt: options.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function addManualPlanSession(dayKey, topic, options = {}) {
  const manual = getManualPlanOverrides()
  const session = createManualPlanSession(dayKey, topic, options)

  manual[dayKey] = [...(manual[dayKey] || []), session]
  saveManualPlanOverrides(manual)

  return session
}

function removeManualPlanSession(dayKey, sessionId) {
  const manual = getManualPlanOverrides()
  manual[dayKey] = (manual[dayKey] || []).filter(session => session.id !== sessionId)
  saveManualPlanOverrides(manual)
}

function replaceManualPlanSession(dayKey, sessionId, topic, options = {}) {
  const manual = getManualPlanOverrides()
  const current = (manual[dayKey] || []).find(session => session.id === sessionId)
  const next = createManualPlanSession(dayKey, topic, {
    ...options,
    id: sessionId,
    createdAt: current?.createdAt,
  })

  manual[dayKey] = (manual[dayKey] || []).map(session => session.id === sessionId ? next : session)
  saveManualPlanOverrides(manual)

  return next
}

function normalizeAutoPlanSession(session) {
  return {
    ...session,
    source: session.source || 'auto',
    locked: !!session.locked,
  }
}

function composePlanWithManual(autoPlan = getDefaultPlanWeek(), planConfig = getStudyPlanConfig()) {
  const manual = getManualPlanOverrides()
  const result = getDefaultPlanWeek()
  const dailyMinutes = Number(planConfig.dailyMinutes || getUserProfile().tempoDiaMin || 60)
  const clearedDays = new Set(getClearedPlanDays())

  Object.keys(result).forEach(dayKey => {
    const manualSessions = (manual[dayKey] || []).map(session => ({ ...session, source: 'manual', locked: true }))

    if (clearedDays.has(String(dayKey))) {
      result[dayKey] = manualSessions
      return
    }

    const manualMinutes = manualSessions.reduce((sum, session) => sum + Number(session.minutes || session.duracao || 0), 0)
    const usedTopicIds = new Set(manualSessions.map(session => session.topicId))
    const replacedAutoIds = new Set(manualSessions.map(session => session.replacesSessionId).filter(Boolean))
    const remainingMinutes = Math.max(0, dailyMinutes - manualMinutes)
    let filledMinutes = 0

    const autoSessions = (autoPlan?.[dayKey] || [])
      .map(normalizeAutoPlanSession)
      .filter(session => !usedTopicIds.has(session.topicId))
      .filter(session => !replacedAutoIds.has(session.id))
      .filter(session => {
        const minutes = Number(session.minutes || session.duracao || 0)
        if (filledMinutes + minutes > remainingMinutes) return false
        filledMinutes += minutes
        return true
      })

    result[dayKey] = [...manualSessions, ...autoSessions]
  })

  return result
}

function getPlanCoverageWarning(plan = null) {
  if (!plan) return null

  const sessions = Object.values(plan).flat()
  if (!sessions.length) return null

  const byMateria = sessions.reduce((acc, session) => {
    acc[session.materiaKey] = (acc[session.materiaKey] || 0) + 1
    return acc
  }, {})
  const [topMateria, topCount] = Object.entries(byMateria).sort((a, b) => b[1] - a[1])[0] || []
  const topShare = topCount ? Math.round(topCount / sessions.length * 100) : 0
  const enemData = typeof ENEM !== 'undefined' ? ENEM : {}
  const uncovered = Object.keys(enemData).filter(key => !byMateria[key] && key !== 'redacao')

  if (topShare < 55 && uncovered.length < 3) return null

  return {
    topMateria,
    topShare,
    uncovered,
    message: `${formatMateriaFoco(topMateria)} concentra ${topShare}% da semana. ${uncovered.slice(0, 3).map(formatMateriaFoco).join(', ')} ficaram sem cobertura.`,
  }
}

function isLearningPastOrToday(isoDate) {
  if (!isoDate) return false
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return false

  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  return date <= endOfToday
}

function getTopicLearningState(topicId) {
  if (typeof getStudyTopicProgress === 'function') return getStudyTopicProgress(topicId)

  const state = typeof getUserTopicState === 'function' ? getUserTopicState(topicId) : {}
  return {
    status: state.status || 'novo',
    difficulty: state.difficulty || 'nao_avaliado',
    mastery: Number(state.mastery || 0),
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

function hasLearningEvidence(state) {
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

function getDueLearningReviews(state) {
  const embedded = (state.reviews || []).filter(review =>
    review.status === 'pendente' && review.dueAt && isLearningPastOrToday(review.dueAt)
  )

  if (state.nextReviewAt && isLearningPastOrToday(state.nextReviewAt)) {
    return [{ id: 'next-review', dueAt: state.nextReviewAt }, ...embedded]
  }

  return embedded
}

function getWrongQuestionCount(state) {
  const questions = Array.isArray(state.questions)
    ? state.questions.filter(question => question.status === 'errei').length
    : 0

  return questions + Number(state.erros || 0)
}

function isWeakLearningState(state) {
  const evidence = hasLearningEvidence(state)
  if (!evidence) return false

  const wrongQuestions = getWrongQuestionCount(state)
  const acertos = Number(state.acertos || 0)

  return (
    state.status === 'dificuldade' ||
    state.difficulty === 'alta' ||
    state.difficulty === 'critica' ||
    wrongQuestions > acertos ||
    (Number(state.mastery || 0) > 0 && Number(state.mastery || 0) <= 30)
  )
}

function getDominantLearningReason(item) {
  if (item.hasDueReview) return 'revisao vencida hoje'
  if (item.isWeak) return 'erro ou dificuldade registrada'
  if (item.state.postponedCount >= 3) return 'adiado varias vezes'
  if (item.hasEvidence && Number(item.state.mastery || 0) <= 40) return 'dominio baixo'
  if (item.isFocus) return 'foco atual do plano'
  if (Number(item.topic.pesoPedagogico || item.topic.recorrenciaEnem || 0) >= 4) return 'tema importante na curadoria'
  if (!item.hasEvidence) return 'ainda sem diagnostico'
  return 'equilibrio da rota'
}

function calculateTopicNeed(topic) {
  const state = getTopicLearningState(topic.id)
  const profile = typeof getUserProfile === 'function' ? getUserProfile() : {}
  const dueReviews = getDueLearningReviews(state)
  const wrongQuestions = getWrongQuestionCount(state)
  const hasEvidence = hasLearningEvidence(state)
  const isWeak = isWeakLearningState(state)
  const isFocus = profile.focoMateria && profile.focoMateria !== 'equilibrado' && profile.focoMateria === topic.materiaKey
  const isDone = !!state.concluido || state.status === 'dominado' || Number(state.mastery || 0) >= 90
  const isUnstarted = !hasEvidence && !isDone

  let score = Number(topic.pesoPedagogico || topic.recorrenciaEnem || 3) * 6
  const reasons = []

  if (Number(topic.pesoPedagogico || topic.recorrenciaEnem || 0) >= 4) {
    reasons.push('tema importante na curadoria ENEM')
  }

  if (isFocus) {
    score += 18
    reasons.push(`foco atual: ${formatMateriaFoco(topic.materiaKey)}`)
  }

  if (dueReviews.length) {
    score += 34 + dueReviews.length * 5
    reasons.push('revisao pendente')
  }

  if (isWeak) {
    score += 30
    reasons.push('ponto fraco com evidencia')
  }

  if (wrongQuestions > 0) {
    score += Math.min(30, wrongQuestions * 7)
    reasons.push(`${wrongQuestions} erro${wrongQuestions !== 1 ? 's' : ''} registrado${wrongQuestions !== 1 ? 's' : ''}`)
  }

  if (hasEvidence && Number(state.mastery || 0) > 0 && Number(state.mastery || 0) <= 40) {
    score += 16
    reasons.push('dominio baixo')
  }

  if (Number(state.postponedCount || 0) >= 3) {
    score += 10
    reasons.push('resistencia detectada')
  }

  if (isUnstarted) {
    score += 4
    reasons.push('ainda sem diagnostico')
  }

  if (isDone && !dueReviews.length) {
    score -= 45
  }

  if (state.skippedUntil && new Date(state.skippedUntil) > new Date()) {
    score -= 70
  }

  const level = getLearningPriorityLevel(score, { dueReviews, isWeak, isUnstarted })

  return {
    topic,
    state,
    score: Math.round(score),
    level,
    reasons: reasons.slice(0, 4),
    dominantReason: '',
    hasEvidence,
    hasDueReview: dueReviews.length > 0,
    dueReviewsCount: dueReviews.length,
    wrongQuestions,
    isWeak,
    isDone,
    isUnstarted,
    isFocus,
  }
}

function getLearningPriorityLevel(score, flags = {}) {
  if (flags.isUnstarted && !flags.isWeak && !flags.dueReviews?.length && score < 70) return 'prioritario'
  if ((flags.isWeak || flags.dueReviews?.length) && score >= 86) return 'critica'
  if ((flags.isWeak || flags.dueReviews?.length) && score >= 66) return 'alta'
  if (score >= 48) return 'media'
  return 'baixa'
}

function calculateTopicPriority(topic) {
  const item = calculateTopicNeed(topic)
  item.dominantReason = getDominantLearningReason(item)
  return item
}

function groupLearningBy(items, keyGetter) {
  return items.reduce((acc, item) => {
    const key = keyGetter(item) || 'geral'
    if (!acc[key]) {
      acc[key] = {
        key,
        total: 0,
        completed: 0,
        started: 0,
        weak: 0,
        dueReviews: 0,
        unstarted: 0,
        totalTime: 0,
        masterySum: 0,
        masteryCount: 0,
        items: [],
      }
    }

    const bucket = acc[key]
    bucket.total += 1
    bucket.completed += item.isDone ? 1 : 0
    bucket.started += item.hasEvidence ? 1 : 0
    bucket.weak += item.isWeak ? 1 : 0
    bucket.dueReviews += item.dueReviewsCount
    bucket.unstarted += item.isUnstarted ? 1 : 0
    bucket.totalTime += Number(item.state.tempoSeg || 0)

    if (item.hasEvidence) {
      bucket.masterySum += Number(item.state.mastery || 0)
      bucket.masteryCount += 1
    }

    bucket.items.push(item)
    return acc
  }, {})
}

function finalizeLearningGroups(groups, metaGetter = () => ({})) {
  Object.values(groups).forEach(group => {
    group.coveragePct = group.total ? Math.round(group.completed / group.total * 100) : 0
    group.masteryAvg = group.masteryCount ? Math.round(group.masterySum / group.masteryCount) : 0
    Object.assign(group, metaGetter(group.key))
  })

  return groups
}

function getPlanExecutionSnapshot(plan = null) {
  const todayKey = typeof getTodayStudyKey === 'function' ? getTodayStudyKey() : String(new Date().getDay())
  const savedV3 = store.get('smart_weekly_plan_v3')
  const savedV2 = store.get('smart_weekly_plan_v2')
  const basePlan = savedV3?.autoPlan || savedV3?.plan || savedV2?.plan || null
  const currentPlan = plan || (basePlan ? composePlanWithManual(basePlan) : null)
  const sessions = currentPlan?.[todayKey] || []
  const plannedMinutes = sessions.reduce((sum, session) => sum + Number(session.minutes || session.duracao || 0), 0)
  const completedSessions = sessions.filter(session => {
    const state = getTopicLearningState(session.topicId || `${session.materiaKey}:${session.tKey}`)
    return state.concluido || state.status === 'dominado'
  })

  const today = typeof getTodayStr === 'function' ? getTodayStr() : new Date().toISOString().slice(0, 10)
  const todayRecord = store.get('registro_' + today) || {}
  const todaySessions = store.get('sessoes_' + today) || []
  const realSeconds = Number(todayRecord.tempoSeg || 0) || todaySessions.reduce((sum, item) => sum + Number(item.durSeg || 0), 0)
  const postponedToday = getStudyTopics()
    .map(topic => getTopicLearningState(topic.id))
    .filter(state => String(state.lastPostponedAt || '').slice(0, 10) === today)
    .length

  return {
    plannedBlocks: sessions.length,
    completedBlocks: completedSessions.length,
    adherencePct: sessions.length ? Math.round(completedSessions.length / sessions.length * 100) : 0,
    plannedMinutes,
    realSeconds,
    postponedToday,
    nextSession: sessions.find(session => {
      const state = getTopicLearningState(session.topicId || `${session.materiaKey}:${session.tKey}`)
      return !state.concluido && state.status !== 'dominado'
    }) || sessions[0] || null,
  }
}

function calculateProgressSnapshot(plan = null) {
  const snapshot = getLearningSnapshot(plan)
  return snapshot.progress
}

function getLearningSnapshot(plan = null) {
  const topics = getStudyTopics().map(topic => {
    const item = calculateTopicPriority(topic)
    item.materiaKey = topic.materiaKey
    item.area = topic.area || inferTopicArea(topic.materiaKey)
    return item
  })

  const byMateria = finalizeLearningGroups(groupLearningBy(topics, item => item.materiaKey), key => ({
    nome: ENEM[key]?.nome || key,
    icone: ENEM[key]?.icone || 'book-open',
  }))
  const byArea = finalizeLearningGroups(groupLearningBy(topics, item => item.area))
  const completed = topics.filter(item => item.isDone).length
  const started = topics.filter(item => item.hasEvidence).length
  const weak = topics.filter(item => item.isWeak).length
  const dueReviews = topics.reduce((sum, item) => sum + item.dueReviewsCount, 0)
  const masteryItems = topics.filter(item => item.hasEvidence)
  const masteryAvg = masteryItems.length
    ? Math.round(masteryItems.reduce((sum, item) => sum + Number(item.state.mastery || 0), 0) / masteryItems.length)
    : 0

  const progress = {
    total: topics.length,
    completed,
    started,
    unstarted: topics.filter(item => item.isUnstarted).length,
    coveragePct: topics.length ? Math.round(completed / topics.length * 100) : 0,
    masteryAvg,
    weak,
    dueReviews,
    totalTime: typeof getTempoTotal === 'function' ? getTempoTotal() : 0,
    planExecution: getPlanExecutionSnapshot(plan),
  }

  return {
    version: LEARNING_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    topics,
    byMateria,
    byArea,
    progress,
  }
}

function getLearningStateSignature() {
  const topicStates = typeof getTopicStateMap === 'function' ? getTopicStateMap() : {}
  const stateDigest = Object.values(topicStates).map(state => [
    state.topicId,
    state.updatedAt,
    state.status,
    state.difficulty,
    state.mastery,
    state.acertos,
    state.erros,
    state.skippedUntil,
    state.postponedCount,
  ].join(':')).sort().join('|')

  const enemData = typeof ENEM !== 'undefined' ? ENEM : {}
  const legacyDigest = Object.keys(enemData).map(key => {
    const progress = getProgressoMateria(key)
    return `${key}:${progress.feitos}:${getTempoMateria(key)}`
  }).join('|')

  return `${LEARNING_ENGINE_VERSION}::${stateDigest}::${legacyDigest}`
}

function generateSmartPlan(planConfig = getStudyPlanConfig()) {
  return generateSmartWeeklyPlan(planConfig)
}
