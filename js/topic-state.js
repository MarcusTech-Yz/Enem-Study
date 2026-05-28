// Estado rico da pagina de topico.
// Reusa topic_state_v1 do recommendation-engine.js para evitar dados paralelos.

const TOPIC_NOTE_TYPE_META = {
  resumo: {
    label: 'Resumo',
    icon: 'book-open',
    template: '- Ideia principal:\n- Como aparece no ENEM:\n- Palavra-chave:',
  },
  exemplo: {
    label: 'Exemplo',
    icon: 'lightbulb',
    template: 'Situacao:\n\nComo resolver:\n\nConclusao:',
  },
  formula: {
    label: 'Formula / regra',
    icon: 'sigma',
    template: 'Expressao:\n\nQuando usar:\n\nCuidados:',
  },
  duvida: {
    label: 'Duvida',
    icon: 'circle-help',
    template: 'O que nao entendi:\n\nO que preciso revisar:',
  },
  erro: {
    label: 'Erro',
    icon: 'triangle-alert',
    template: 'O que errei:\n\nPor que errei:\n\nComo evitar:',
  },
  texto: {
    label: 'Texto solto',
    icon: 'type',
    template: '',
  },
}

const QUESTION_ERROR_REASON_LABELS = {
  conteudo: 'Nao sabia o conteudo',
  interpretacao: 'Errei interpretacao',
  calculo: 'Errei calculo',
  conceito: 'Confundi conceito',
  atencao: 'Falta de atencao',
  inicio: 'Nao soube comecar',
}

function createTopicEntityId(prefix = 'item') {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID()
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function getTopicRichState(materiaKey, topicoKey) {
  const topicId = getRecommendationTopicId(materiaKey, topicoKey)
  const base = getUserTopicState(topicId)

  return {
    ...base,
    id: topicId,
    materiaKey,
    topicoKey: String(topicoKey),
    status: base.status || 'novo',
    difficulty: base.difficulty || mapLegacyDifficultyToText(materiaKey, topicoKey),
    mastery: Number.isFinite(Number(base.mastery)) ? Number(base.mastery) : getMasteryFromState(base),
    notes: Array.isArray(base.notes) ? base.notes : [],
    videos: Array.isArray(base.videos) ? base.videos : [],
    questions: Array.isArray(base.questions) ? base.questions : [],
    reviews: Array.isArray(base.reviews) ? base.reviews : [],
    lastStudyAt: base.lastStudyAt || null,
    nextReviewAt: base.nextReviewAt || base.proximaRevisao || null,
  }
}

function saveTopicRichState(materiaKey, topicoKey, patch = {}) {
  return saveUserTopicState(getRecommendationTopicId(materiaKey, topicoKey), patch)
}

function mapLegacyDifficultyToText(materiaKey, topicoKey) {
  const value = Number((getDificuldades(materiaKey) || {})[topicoKey] || 0)
  if (value === 1) return 'alta'
  if (value === 2) return 'media'
  if (value === 3) return 'baixa'
  return 'nao_avaliado'
}

function getMasteryFromState(state) {
  if (state.status === 'dominado') return 85
  if (state.status === 'parcial') return 50
  if (state.status === 'dificuldade') return 25
  if (state.concluido) return 75
  if (state.tempoSeg > 0) return 25
  return 0
}

function getTopicStatusMeta(state) {
  if (state.concluido || state.status === 'dominado') {
    return { label: 'Forte', className: 'forte' }
  }
  if (state.status === 'dificuldade' || state.difficulty === 'alta' || state.difficulty === 'critica') {
    return { label: 'Fraco', className: 'fraco' }
  }
  if (state.status === 'parcial' || state.difficulty === 'media') {
    return { label: 'Medio', className: 'medio' }
  }
  if (state.tempoSeg > 0 || state.notes.length || state.videos.length || state.questions.length) {
    return { label: 'Em estudo', className: 'em-estudo' }
  }
  return { label: 'Nao iniciado', className: 'nao-iniciado' }
}

function setTopicLearningDifficulty(materiaKey, topicoKey, difficulty) {
  const masteryMap = {
    nao_avaliado: 0,
    baixa: 75,
    media: 50,
    alta: 25,
    critica: 10,
  }

  const difficultyToLegacy = {
    baixa: 3,
    media: 2,
    alta: 1,
    critica: 1,
    nao_avaliado: 0,
  }

  const mastery = masteryMap[difficulty] ?? 0
  const status = difficulty === 'baixa'
    ? 'dominado'
    : difficulty === 'media'
      ? 'parcial'
      : difficulty === 'nao_avaliado'
        ? 'novo'
        : 'dificuldade'

  setDificuldade(materiaKey, topicoKey, difficultyToLegacy[difficulty] || 0)
  saveTopicRichState(materiaKey, topicoKey, {
    difficulty,
    mastery,
    status,
    dificuldadeDoUsuario: difficulty === 'critica' ? 4 : difficulty === 'alta' ? 3 : difficulty === 'media' ? 2 : 0,
    nextReviewAt: addDaysISO(getReviewDelayByDifficulty(difficulty)),
    proximaRevisao: addDaysISO(getReviewDelayByDifficulty(difficulty)),
  })
}

function getReviewDelayByDifficulty(difficulty) {
  const map = {
    critica: 1,
    alta: 3,
    media: 7,
    baixa: 14,
    nao_avaliado: 7,
  }

  return map[difficulty] || 7
}

function createReviewFromTopicNote(materiaKey, topicoKey, noteId) {
  const state = getTopicRichState(materiaKey, topicoKey)
  const note = state.notes.find(item => item.id === noteId)
  if (!note) return null

  const review = {
    id: createTopicEntityId('review'),
    sourceNoteId: note.id,
    sourceType: note.type,
    question: generateReviewQuestion(note),
    answer: note.content || '',
    status: 'pendente',
    createdAt: new Date().toISOString(),
    dueAt: addDaysISO(getReviewDelayByDifficulty(state.difficulty)),
  }

  saveTopicRichState(materiaKey, topicoKey, {
    reviews: [review, ...state.reviews],
    nextReviewAt: review.dueAt,
    proximaRevisao: review.dueAt,
  })

  return review
}

function generateReviewQuestion(note) {
  if (note.type === 'duvida') return 'Voce consegue responder a duvida que registrou?'
  if (note.type === 'formula') return 'Voce lembra quando usar esta formula ou regra?'
  if (note.type === 'erro') return 'Voce lembra qual erro cometeu e como evitar?'
  if (note.type === 'resumo') return 'Voce consegue explicar a ideia principal deste resumo?'
  return 'Revise esta anotacao.'
}

function resolveTopicReview(materiaKey, topicoKey, reviewId, result) {
  const state = getTopicRichState(materiaKey, topicoKey)
  const reviews = state.reviews.map(review => {
    if (review.id !== reviewId) return review
    return {
      ...review,
      status: result === 'success' ? 'acertei' : 'errei',
      resolvedAt: new Date().toISOString(),
    }
  })

  const patch = { reviews }
  if (result === 'success') {
    patch.mastery = Math.min(100, Number(state.mastery || 0) + 5)
  } else {
    patch.mastery = Math.max(10, Number(state.mastery || 0) - 10)
    patch.difficulty = increaseTopicDifficulty(state.difficulty)
    patch.status = 'dificuldade'
    patch.proximaRevisao = addDaysISO(3)
    patch.nextReviewAt = patch.proximaRevisao
  }

  saveTopicRichState(materiaKey, topicoKey, patch)
}

function deleteTopicReview(materiaKey, topicoKey, reviewId) {
  const state = getTopicRichState(materiaKey, topicoKey)
  const reviews = state.reviews.filter(review => review.id !== reviewId)
  const pendingReviews = reviews
    .filter(review => review.status === 'pendente' && review.dueAt)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
  const nextReviewAt = pendingReviews[0]?.dueAt || null

  saveTopicRichState(materiaKey, topicoKey, {
    reviews,
    nextReviewAt,
    proximaRevisao: nextReviewAt,
  })
}

function increaseTopicDifficulty(current) {
  const order = ['nao_avaliado', 'baixa', 'media', 'alta', 'critica']
  const index = order.indexOf(current)
  return order[Math.min(order.length - 1, Math.max(0, index) + 1)] || 'media'
}

function getTopicSuggestionText(state) {
  const hasDueReview = state.reviews.some(review =>
    review.status === 'pendente' && new Date(review.dueAt) <= new Date()
  )

  if (hasDueReview) return 'voce tem revisoes pendentes. Resolva elas antes de estudar conteudo novo.'
  if (!state.notes.length && !state.videos.length && !state.questions.length) return 'comece com uma videoaula curta ou crie um resumo de 3 linhas.'
  if (state.videos.length && !state.notes.length) return 'voce salvou video, mas ainda nao anotou. Registre uma duvida ou ideia principal.'
  if (state.notes.length && !state.questions.length) return 'voce ja anotou teoria. Agora faca questoes para testar se entendeu.'
  if (state.difficulty === 'alta' || state.difficulty === 'critica') return 'esse topico esta dificil. Revise erros e gere uma revisao para daqui a poucos dias.'
  if (Number(state.mastery || 0) >= 75) return 'voce esta bem nesse topico. Faca uma revisao rapida e siga para o proximo.'
  return 'faca uma revisao rapida, registre um erro ou duvida e atualize seu dominio.'
}

function getQuestionStatusLabel(status) {
  const map = {
    nao_respondida: 'Nao respondida',
    acertei: 'Acertei',
    errei: 'Errei',
    chutei: 'Acertei chutando',
  }
  return map[status] || status || 'Nao respondida'
}
