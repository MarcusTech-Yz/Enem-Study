// Motor de recomendacao do enem.study.
// Depende de data/topicos.js e js/app.js.

const TOPIC_STATE_KEY = 'topic_state_v1'

const TOPIC_PRIORITY_META = {
  alta: { pesoPedagogico: 5, recorrenciaEnem: null, fonteRecorrencia: 'curadoria_manual', dificuldadeBase: 3, tempoEstimadoMin: 30 },
  media: { pesoPedagogico: 3, recorrenciaEnem: null, fonteRecorrencia: 'curadoria_manual', dificuldadeBase: 2, tempoEstimadoMin: 25 },
  baixa: { pesoPedagogico: 1, recorrenciaEnem: null, fonteRecorrencia: 'curadoria_manual', dificuldadeBase: 1, tempoEstimadoMin: 20 },
}

const TOPIC_FEEDBACK_META = {
  dominei: {
    status: 'dominado',
    dificuldadeDoUsuario: 0,
    uiDificuldade: 3,
    acertos: 5,
    erros: 0,
    revisarEmDias: 14,
    concluir: true,
  },
  parcial: {
    status: 'parcial',
    dificuldadeDoUsuario: 2,
    uiDificuldade: 2,
    acertos: 3,
    erros: 2,
    revisarEmDias: 7,
    concluir: true,
  },
  dificuldade: {
    status: 'dificuldade',
    dificuldadeDoUsuario: 3,
    uiDificuldade: 1,
    acertos: 1,
    erros: 4,
    revisarEmDias: 3,
    concluir: true,
  },
  pular: {
    status: 'pulado',
    dificuldadeDoUsuario: 0,
    uiDificuldade: 0,
    acertos: 0,
    erros: 0,
    revisarEmDias: 1,
    concluir: false,
  },
}

function addDaysISO(days) {
  const d = new Date()
  d.setDate(d.getDate() + Number(days || 0))
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

function getTopicStateMap() {
  return store.get(TOPIC_STATE_KEY) || {}
}

function saveTopicStateMap(map) {
  store.set(TOPIC_STATE_KEY, map)
  return map
}

function getRecommendationTopicId(materiaKey, tKey) {
  return `${materiaKey}:${tKey}`
}

function parseRecommendationTopicId(topicId) {
  const [materiaKey, ...rest] = String(topicId || '').split(':')
  return { materiaKey, tKey: rest.join(':') }
}

function getAllRecommendationTopics() {
  if (typeof ENEM === 'undefined') return []

  return Object.keys(ENEM).flatMap(materiaKey => {
    const mat = ENEM[materiaKey]

    return getTopicosMateria(materiaKey).map(topic => {
      const prioridade = topic.prioridade || 'media'
      const meta = TOPIC_PRIORITY_META[prioridade] || TOPIC_PRIORITY_META.media
      const id = getRecommendationTopicId(materiaKey, topic.key)

      return {
        id,
        materia: materiaKey,
        materiaKey,
        materiaNome: mat.nome,
        matNome: mat.nome,
        matIcone: mat.icone,
        conteudoId: topic.conteudoId,
        conteudoNome: topic.conteudoNome,
        habilidadeId: topic.habilidadeId,
        tKey: topic.key,
        titulo: topic.titulo,
        texto: topic.titulo,
        descricao: topic.descricao,
        prioridade,
        recorrenciaEnem: meta.recorrenciaEnem,
        pesoPedagogico: meta.pesoPedagogico,
        fonteRecorrencia: meta.fonteRecorrencia,
        dificuldadeBase: meta.dificuldadeBase,
        tempoEstimadoMin: meta.tempoEstimadoMin,
        tipo: inferTopicTypes(topic, prioridade),
        prerequisitos: topic.habilidade?.prerequisitos || [],
      }
    })
  })
}

function inferTopicTypes(topic, prioridade) {
  const titulo = String(topic.titulo || '').toLowerCase()
  const tipos = ['teoria']

  if (
    prioridade === 'alta' ||
    titulo.includes('quest') ||
    titulo.includes('problema') ||
    titulo.includes('porcentagem') ||
    titulo.includes('probabilidade') ||
    titulo.includes('estat')
  ) {
    tipos.push('questoes')
  }

  return tipos
}

function getTopicByRecommendationId(topicId) {
  const { materiaKey, tKey } = parseRecommendationTopicId(topicId)
  return getAllRecommendationTopics().find(topic =>
    topic.materiaKey === materiaKey && String(topic.tKey) === String(tKey)
  ) || null
}

function getLegacyDifficultyForTopic(materiaKey, tKey) {
  const value = Number((getDificuldades(materiaKey) || {})[tKey] || 0)
  if (value === 1) return 3
  if (value === 2) return 2
  if (value === 3) return 0
  return 0
}

function getUserTopicState(topicId) {
  const topic = getTopicByRecommendationId(topicId)
  const saved = getTopicStateMap()[topicId] || {}

  if (!topic) {
    return {
      ...saved,
      topicId,
      status: saved.status || 'novo',
      dificuldadeDoUsuario: Number(saved.dificuldadeDoUsuario || 0),
      acertos: Number(saved.acertos || 0),
      erros: Number(saved.erros || 0),
      updatedAt: saved.updatedAt || null,
      proximaRevisao: saved.proximaRevisao || null,
      skippedUntil: saved.skippedUntil || null,
      concluido: !!saved.concluido,
      tempoSeg: 0,
    }
  }

  const legacyDifficulty = getLegacyDifficultyForTopic(topic.materiaKey, topic.tKey)
  const savedDifficulty = Number(saved.dificuldadeDoUsuario || 0)

  return {
    ...saved,
    topicId,
    status: saved.status || (isTopicoFeito(topic.materiaKey, topic.tKey) ? 'concluido' : 'novo'),
    dificuldadeDoUsuario: savedDifficulty || legacyDifficulty,
    acertos: Number(saved.acertos || 0),
    erros: Number(saved.erros || 0),
    updatedAt: saved.updatedAt || null,
    proximaRevisao: saved.proximaRevisao || null,
    skippedUntil: saved.skippedUntil || null,
    concluido: isTopicoFeito(topic.materiaKey, topic.tKey),
    tempoSeg: getTempo(topic.materiaKey, topic.tKey),
  }
}

function saveUserTopicState(topicId, patch = {}) {
  const map = getTopicStateMap()
  const current = getUserTopicState(topicId)
  const next = {
    ...current,
    ...patch,
    topicId,
    updatedAt: new Date().toISOString(),
  }

  map[topicId] = next
  saveTopicStateMap(map)
  return next
}

function isPastOrToday(isoDate) {
  if (!isoDate) return false
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return false
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return d <= today
}

function calculateReviewBonus(state) {
  if (!state?.proximaRevisao) return 0
  if (!isPastOrToday(state.proximaRevisao)) return 0

  if (state.status === 'dificuldade') return 14
  if (state.status === 'parcial') return 9
  return 6
}

function getMateriaWeaknessBonus(materiaKey) {
  const progresso = getProgressoMateria(materiaKey)
  if (!progresso.total) return 0
  if (progresso.pct === 0) return 5
  if (progresso.pct < 20) return 3
  if (progresso.pct < 50) return 1
  return 0
}

function calculateTopicScore(topic, profile = getUserProfile(), state = getUserTopicState(topic.id), options = {}) {
  let score = 0

  score += Number(topic.pesoPedagogico || topic.recorrenciaEnem || 3) * 2
  score += Number(state.dificuldadeDoUsuario || 0) * 3
  score += getMateriaWeaknessBonus(topic.materiaKey)
  score += calculateReviewBonus(state)

  const mastery = Number(state.mastery || 0)
  if (!state.concluido && mastery > 0 && mastery <= 30) score += 8
  else if (!state.concluido && mastery > 0 && mastery <= 60) score += 4

  if (state.difficulty === 'critica') score += 14
  if (state.difficulty === 'alta') score += 10
  if (state.difficulty === 'media') score += 5

  const dueEmbeddedReviews = Array.isArray(state.reviews)
    ? state.reviews.filter(review => review.status === 'pendente' && review.dueAt && isPastOrToday(review.dueAt)).length
    : 0
  score += dueEmbeddedReviews * 6

  const wrongQuestions = Array.isArray(state.questions)
    ? state.questions.filter(question => question.status === 'errei').length
    : 0
  score += wrongQuestions * 5

  const daysToExam = typeof getDiasAteEnem === 'function' ? getDiasAteEnem() : 999
  if (!state.concluido && mastery === 0 && daysToExam <= 90) {
    score += Math.max(0, 18 - Math.floor(daysToExam / 10))
  }

  if (profile.focoMateria && profile.focoMateria !== 'equilibrado' && profile.focoMateria === topic.materiaKey) {
    score *= 1.35
  }

  if (profile.ritmoAtual === 'recomecando') {
    score -= Number(topic.dificuldadeBase || 1)
    if (Number(topic.tempoEstimadoMin || 30) <= 25) score += 3
  }

  if (profile.ritmoAtual === 'constante' && topic.prioridade === 'alta') {
    score += 3
  }

  if (profile.formatoPreferido === 'questoes' && topic.tipo.includes('questoes')) {
    score += 3
  }

  if (profile.formatoPreferido === 'revisao' && state.proximaRevisao) {
    score += 3
  }

  const gradeHoje = typeof getMateriaHoje === 'function' ? getMateriaHoje() : []
  if (gradeHoje.some(item => item.key === topic.materiaKey)) {
    score += 4
  }

  if (options.remainingMin && Number(topic.tempoEstimadoMin || 30) <= options.remainingMin) {
    score += 2
  }

  if (state.erros > state.acertos) {
    score += Math.min(10, Number(state.erros || 0) * 2)
  }

  if (state.skippedUntil && !isPastOrToday(state.skippedUntil)) {
    score -= 999
  }

  if (state.concluido) {
    score -= isPastOrToday(state.proximaRevisao) ? 16 : 80
  }

  return Math.round(score * 10) / 10
}

function scoreTopico(candidato) {
  const topic = candidato.id
    ? candidato
    : getRecommendationTopicId(candidato.materiaKey, candidato.tKey)
      ? getTopicByRecommendationId(getRecommendationTopicId(candidato.materiaKey, candidato.tKey))
      : null

  if (!topic) return 0
  return calculateTopicScore(topic)
}

function getReasonForTopic(topic) {
  const profile = getUserProfile()
  const state = getUserTopicState(topic.id || getRecommendationTopicId(topic.materiaKey, topic.tKey))
  const reasons = []
  const mastery = Number(state.mastery || 0)
  const dueEmbeddedReviews = Array.isArray(state.reviews)
    ? state.reviews.filter(review => review.status === 'pendente' && review.dueAt && isPastOrToday(review.dueAt)).length
    : 0
  const wrongQuestions = Array.isArray(state.questions)
    ? state.questions.filter(question => question.status === 'errei').length
    : 0

  if (profile.focoMateria && profile.focoMateria !== 'equilibrado' && profile.focoMateria === topic.materiaKey) {
    reasons.push(`voce marcou ${formatMateriaFoco(profile.focoMateria)} como prioridade`)
  }

  if (Number(topic.pesoPedagogico || topic.recorrenciaEnem || 0) >= 4) {
    reasons.push('esse tema tem peso alto na curadoria ENEM')
  }

  if (!state.concluido && mastery > 0 && mastery <= 30) {
    reasons.push('seu dominio nesse topico ainda esta baixo')
  }

  if (state.status === 'dificuldade' || state.erros > state.acertos || state.difficulty === 'alta' || state.difficulty === 'critica') {
    reasons.push('ele apareceu como ponto fraco recentemente')
  }

  if (calculateReviewBonus(state) > 0 || dueEmbeddedReviews > 0) {
    reasons.push('esta na hora da revisao espacada')
  }

  if (wrongQuestions > 0) {
    reasons.push(`voce errou ${wrongQuestions} questao${wrongQuestions !== 1 ? 'oes' : ''} desse topico`)
  }

  if (!state.concluido && mastery === 0 && typeof getDiasAteEnem === 'function' && getDiasAteEnem() <= 90) {
    reasons.push('esse conteudo ainda nao foi iniciado e o ENEM esta se aproximando')
  }

  if (Number(topic.tempoEstimadoMin || 30) <= Number(profile.tempoDiaMin || 60)) {
    reasons.push(`cabe no seu bloco de ${Math.min(Number(profile.tempoDiaMin || 60), Number(topic.tempoEstimadoMin || 30))} minutos`)
  }

  if (!reasons.length && profile.ritmoAtual === 'recomecando') {
    reasons.push('e um passo direto para retomar ritmo sem pesar')
  }

  if (!reasons.length) {
    reasons.push('mantem sua rota equilibrada entre prioridade, dificuldade e progresso')
  }

  return reasons.slice(0, 4).join(', ') + '.'
}

function getRecommendedTopics(limit = 3, options = {}) {
  const profile = options.profile || getUserProfile()
  const excludeIds = new Set(options.excludeIds || [])

  return getAllRecommendationTopics()
    .filter(topic => !excludeIds.has(topic.id))
    .map(topic => {
      const state = getUserTopicState(topic.id)
      return {
        ...topic,
        state,
        score: calculateTopicScore(topic, profile, state, options),
        reason: getReasonForTopic(topic),
      }
    })
    .filter(topic => topic.score > -100)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function getDueReviewTopics(limit = 3) {
  return getAllRecommendationTopics()
    .map(topic => ({ ...topic, state: getUserTopicState(topic.id) }))
    .filter(topic => topic.state.proximaRevisao && isPastOrToday(topic.state.proximaRevisao))
    .sort((a, b) => calculateTopicScore(b, getUserProfile(), b.state) - calculateTopicScore(a, getUserProfile(), a.state))
    .slice(0, limit)
}

function generateTodayStudyBlocks() {
  const profile = getUserProfile()
  const totalMin = Number(profile.tempoDiaMin || 60)
  const metaMin = getMetaSessaoPadrao()
  const blocks = []
  const excludeIds = new Set()
  let remaining = totalMin

  const dueReview = getDueReviewTopics(1)[0]
  const reserveReview = dueReview && totalMin >= 45 ? 5 : 0
  remaining -= reserveReview

  while (remaining >= 15 && blocks.length < getQuantidadeTopicosHoje()) {
    const topic = getRecommendedTopics(1, {
      profile,
      excludeIds,
      remainingMin: remaining,
    })[0]

    if (!topic) break

    const duration = Math.min(
      Math.max(15, Number(topic.tempoEstimadoMin || metaMin)),
      metaMin,
      remaining
    )

    blocks.push({
      type: 'topico',
      topic,
      materiaKey: topic.materiaKey,
      tKey: topic.tKey,
      titulo: topic.titulo,
      texto: topic.texto,
      matNome: topic.matNome,
      matIcone: topic.matIcone,
      duracaoMin: duration,
      reason: topic.reason,
      score: topic.score,
    })

    excludeIds.add(topic.id)
    remaining -= duration
  }

  if (reserveReview && dueReview) {
    blocks.push({
      type: 'revisao',
      topic: dueReview,
      materiaKey: dueReview.materiaKey,
      tKey: dueReview.tKey,
      titulo: dueReview.titulo,
      texto: dueReview.texto,
      matNome: dueReview.matNome,
      matIcone: dueReview.matIcone,
      duracaoMin: reserveReview,
      reason: 'Revisao rapida do que ficou pendente na rota.',
      score: calculateTopicScore(dueReview),
    })
  }

  return blocks
}

function generateWeeklyStudyRoute(days = 6) {
  const profile = getUserProfile()
  const horarios = getStudyWindowConfig(profile.periodoEstudo).horarios
  const route = {}
  const excludeIds = new Set()

  for (let day = 1; day <= days; day++) {
    route[day] = []
    let remaining = Number(profile.tempoDiaMin || 60)
    let hIdx = 0

    while (remaining >= 15 && route[day].length < getQuantidadeTopicosHoje()) {
      const topic = getRecommendedTopics(1, { profile, excludeIds, remainingMin: remaining })[0]
      if (!topic) break

      const duracaoMin = Math.min(getMetaSessaoPadrao(), Number(topic.tempoEstimadoMin || 30), remaining)
      route[day].push({
        key: topic.materiaKey,
        topicId: topic.id,
        tKey: topic.tKey,
        titulo: topic.titulo,
        matNome: topic.matNome,
        inicio: horarios[hIdx % horarios.length],
        duracao: String(duracaoMin),
        reason: topic.reason,
      })

      excludeIds.add(topic.id)
      remaining -= duracaoMin
      hIdx++
    }
  }

  return route
}

function recordTopicFeedback(topicId, feedback, metrics = {}) {
  const topic = getTopicByRecommendationId(topicId)
  const meta = TOPIC_FEEDBACK_META[feedback] || TOPIC_FEEDBACK_META.parcial
  if (!topic) return null

  const previous = getUserTopicState(topicId)
  const next = saveUserTopicState(topicId, {
    status: meta.status,
    dificuldadeDoUsuario: meta.dificuldadeDoUsuario,
    acertos: Number(metrics.acertos ?? meta.acertos),
    erros: Number(metrics.erros ?? meta.erros),
    proximaRevisao: addDaysISO(meta.revisarEmDias),
    skippedUntil: feedback === 'pular' ? addDaysISO(1) : null,
    feedbackHistory: [
      ...(previous.feedbackHistory || []),
      {
        feedback,
        at: new Date().toISOString(),
        acertos: Number(metrics.acertos ?? meta.acertos),
        erros: Number(metrics.erros ?? meta.erros),
      },
    ].slice(-20),
  })

  if (meta.uiDificuldade) {
    setDificuldade(topic.materiaKey, topic.tKey, meta.uiDificuldade)
  }

  if (meta.concluir) {
    marcarTopicoFeito(topic.materiaKey, topic.tKey)
  }

  return next
}

function recordTopicFeedbackByParts(materiaKey, tKey, feedback, metrics = {}) {
  return recordTopicFeedback(getRecommendationTopicId(materiaKey, tKey), feedback, metrics)
}

function getTodayPersonalizedReason() {
  const profile = getUserProfile()
  const blocks = generateTodayStudyBlocks()
  const totalMin = blocks.reduce((sum, block) => sum + Number(block.duracaoMin || 0), 0)
  const blocoTxt = blocks.length === 1 ? '1 bloco' : `${blocks.length} blocos`

  if (!blocks.length) {
    return `${profile.nome?.trim() || 'Estudante'}, sua rota esta livre hoje. O Enem Study recalcula o proximo passo assim que voce registrar estudo.`
  }

  return `${profile.nome?.trim() || 'Estudante'}, voce tem ${totalMin || profile.tempoDiaMin} min hoje. Montei ${blocoTxt} pela sua prioridade, pontos fracos, revisoes e tempo real disponivel.`
}
