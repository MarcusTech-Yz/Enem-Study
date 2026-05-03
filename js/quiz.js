// ── quiz.js — Módulo de quiz compartilhado ────────────────────
// Usado por materia.js (editor inline) e topico.js (página de tópico)
// Não tem estado global: cada instância recebe um contexto isolado.

// ── Normalização de questão vinda do Firestore ────────────────
function normalizarQuestao(q) {
  const alternativas = q.alternativas || {}
  const letras = ['A', 'B', 'C', 'D']
  if (!q.pergunta || !letras.every(l => alternativas[l]) || !letras.includes(q.resposta)) {
    return null
  }
  return {
    id:           q.id,
    pergunta:     String(q.pergunta),
    alternativas: letras.reduce((acc, l) => { acc[l] = String(alternativas[l]); return acc }, {}),
    resposta:     q.resposta,
    explicacao:   String(q.explicacao || 'Sem explicação cadastrada.'),
    dificuldade:  q.dificuldade || 'facil',
  }
}

function formatarDificuldadeQuiz(value) {
  return { facil: 'fácil', medio: 'médio', dificil: 'difícil' }[value] || value || 'nível único'
}

function escapeHtmlQuiz(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMathQuiz(root) {
  if (!root || typeof renderMathInElement === 'undefined') return
  renderMathInElement(root, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$',  right: '$',  display: false },
    ],
    throwOnError: false,
  })
}

// ── Progresso salvo no localStorage ───────────────────────────
function getQuizProgress(storageKey) {
  return store.get(storageKey) || { tentativas: 0, acertos: 0, ultimaPontuacao: null }
}

function saveQuizProgress(storageKey, acertos, total) {
  const p = getQuizProgress(storageKey)
  store.set(storageKey, {
    tentativas:       (p.tentativas || 0) + 1,
    acertos:          (p.acertos || 0) + acertos,
    ultimaPontuacao:  { acertos, total, finishedAt: new Date().toISOString() },
  })
}

// ── Busca questões no Firestore ───────────────────────────────
async function carregarQuestoesFirestore(materiaId, conteudoId, habilidadeId) {
  const db = getFirebaseDb()
  if (!db) return { questoes: [], erro: 'Banco de questões indisponível. Confira a configuração do Firebase.' }

  try {
    const snap = await db.collection('questoes')
      .where('status',       '==', 'publicado')
      .where('materiaId',    '==', materiaId)
      .where('conteudoId',   '==', conteudoId)
      .where('habilidadeId', '==', habilidadeId)
      .get()

    const questoes = snap.docs
      .map(doc => normalizarQuestao({ id: doc.id, ...doc.data() }))
      .filter(Boolean)
      .sort((a, b) => String(a.dificuldade).localeCompare(String(b.dificuldade)))

    return { questoes, erro: null }
  } catch (err) {
    console.error('[quiz] Firestore error:', err)
    return { questoes: [], erro: 'Não consegui carregar as questões deste tópico agora.' }
  }
}

// ══════════════════════════════════════════════════════════════
//  CLASSE Quiz — uma instância por área de prática
//
//  Uso:
//    const q = new Quiz({
//      containerId:  'practice-area',    // id do elemento onde renderizar
//      storageKey:   'quiz_mat_H1',      // chave localStorage para progresso
//      materiaId:    'matematica',
//      conteudoId:   'mat_funcoes',
//      habilidadeId: 'H19',
//    })
//    await q.init()
// ══════════════════════════════════════════════════════════════
class Quiz {
  constructor({ containerId, storageKey, materiaId, conteudoId, habilidadeId }) {
    this.containerId  = containerId
    this.storageKey   = storageKey
    this.materiaId    = materiaId
    this.conteudoId   = conteudoId
    this.habilidadeId = habilidadeId

    this.questoes  = []
    this.erro      = null
    this.carregado = false

    this._state = {
      open:     false,
      current:  0,
      selected: null,
      answered: false,
      acertos:  0,
    }
  }

  get container() { return document.getElementById(this.containerId) }

  // ── Inicialização ─────────────────────────────────────────
  async init() {
    this._render({ loading: true })
    const { questoes, erro } = await carregarQuestoesFirestore(
      this.materiaId, this.conteudoId, this.habilidadeId
    )
    this.questoes  = questoes
    this.erro      = erro
    this.carregado = true
    this._state    = { open: false, current: 0, selected: null, answered: false, acertos: 0 }
    this._render()
  }

  // ── Controles ─────────────────────────────────────────────
  start() {
    if (!this.questoes.length) return
    this._state = { open: true, current: 0, selected: null, answered: false, acertos: 0 }
    this._render()
  }

  answer(letra) {
    const s = this._state
    if (s.answered || !this.questoes[s.current]) return
    s.selected = letra
    s.answered = true
    if (letra === this.questoes[s.current].resposta) s.acertos++
    this._render()
  }

  next() {
    const s = this._state
    s.current++
    s.selected = null
    s.answered = false
    if (s.current >= this.questoes.length) {
      saveQuizProgress(this.storageKey, s.acertos, this.questoes.length)
    }
    this._render()
  }

  close() {
    this._state.open = false
    this._render()
  }

  // ── Renderização ──────────────────────────────────────────
  _render(opts = {}) {
    const el = this.container
    if (!el) return

    const s        = this._state
    const progress = getQuizProgress(this.storageKey)
    const count    = this.questoes.length
    const canStart = count > 0 && !opts.loading && !this.erro

    const subtitulo = (() => {
      if (opts.loading)   return 'Buscando questões publicadas no banco...'
      if (this.erro)      return escapeHtmlQuiz(this.erro)
      if (!count)         return 'Ainda não há questões publicadas para este tópico.'
      if (progress.tentativas > 0 && progress.ultimaPontuacao) {
        const up = progress.ultimaPontuacao
        return `Última prática: ${up.acertos}/${up.total} acertos.`
      }
      return 'Uma questão por vez, com feedback e explicação logo após a resposta.'
    })()

    el.innerHTML = `
      <section class="practice-card">
        <div class="practice-head">
          <div>
            <div class="practice-kicker">Questões deste tópico</div>
            <div class="practice-title">
              <i data-lucide="target" style="width:16px;height:16px;"></i>
              Praticar questões
            </div>
            <div class="practice-sub">${subtitulo}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span class="practice-count">
              <i data-lucide="list-checks" style="width:13px;height:13px;"></i>
              ${opts.loading ? 'carregando...' : count + ' disp.'}
            </span>
            <button class="btn btn-accent btn-sm" ${canStart ? '' : 'disabled'}
              onclick="window.__quizInstances['${this.containerId}'].start()">
              <i data-lucide="play" style="width:13px;height:13px;"></i>
              ${s.open ? 'Recomeçar' : 'Praticar agora'}
            </button>
          </div>
        </div>
        <div class="quiz-shell ${s.open ? 'open' : ''}">
          ${this._renderConteudo()}
        </div>
      </section>
    `

    renderMathQuiz(el)
    if (typeof lucide !== 'undefined') lucide.createIcons()
  }

  _renderConteudo() {
    const s = this._state
    if (!this.questoes.length) return ''

    // Resultado final
    if (s.current >= this.questoes.length) {
      const total = this.questoes.length
      const pct   = Math.round((s.acertos / total) * 100)
      const id    = this.containerId
      return `
        <div class="quiz-result open">
          <p style="font-size:14px;margin-bottom:6px;">
            Você fechou a prática com <strong>${s.acertos}/${total}</strong> acertos.
          </p>
          <p style="color:var(--text2);font-size:12px;">Aproveitamento de ${pct}%. Dá para repetir quando quiser.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
            <button class="btn btn-accent btn-sm"
              onclick="window.__quizInstances['${id}'].start()">Refazer</button>
            <button class="btn btn-sm"
              onclick="window.__quizInstances['${id}'].close()">Fechar</button>
          </div>
        </div>
      `
    }

    const q      = this.questoes[s.current]
    const letras = ['A', 'B', 'C', 'D']
    const feedbackOk    = s.selected === q.resposta
    const feedbackClass = feedbackOk ? 'correct' : 'wrong'
    const feedbackTitle = feedbackOk ? 'Acertou.' : `Errou. Resposta correta: ${q.resposta}.`
    const id            = this.containerId
    const isLast        = s.current + 1 === this.questoes.length

    return `
      <div class="quiz-topbar">
        <div class="quiz-progress-text">
          Questão ${s.current + 1} de ${this.questoes.length} · ${formatarDificuldadeQuiz(q.dificuldade)}
        </div>
        <button class="btn btn-sm"
          onclick="window.__quizInstances['${id}'].close()">Fechar</button>
      </div>
      <div class="quiz-question quiz-math">
        ${escapeHtmlQuiz(q.pergunta).replace(/\n/g, '<br>')}
      </div>
      <div class="quiz-options">
        ${letras.map(l => this._renderOpcao(q, l)).join('')}
      </div>
      <div class="quiz-feedback ${s.answered ? 'open' : ''} ${feedbackClass}">
        ${s.answered ? `
          <strong>${feedbackTitle}</strong>
          <div class="quiz-math" style="margin-top:6px;">
            ${escapeHtmlQuiz(q.explicacao).replace(/\n/g, '<br>')}
          </div>
          <button class="btn btn-accent btn-sm" style="margin-top:10px;"
            onclick="window.__quizInstances['${id}'].next()">
            ${isLast ? 'Ver resultado' : 'Próxima questão'}
          </button>
        ` : ''}
      </div>
    `
  }

  _renderOpcao(q, letra) {
    const s = this._state
    let className = ''
    if (s.answered && letra === q.resposta)                           className = 'correct'
    if (s.answered && letra === s.selected && letra !== q.resposta)  className = 'wrong'
    const id = this.containerId
    return `
      <button class="quiz-option ${className}" ${s.answered ? 'disabled' : ''}
        onclick="window.__quizInstances['${id}'].answer('${letra}')">
        <span class="quiz-letter">${letra}</span>
        <span class="quiz-math">${escapeHtmlQuiz(q.alternativas[letra]).replace(/\n/g, '<br>')}</span>
      </button>
    `
  }
}

// Registro global de instâncias (necessário para callbacks inline no HTML)
window.__quizInstances = window.__quizInstances || {}

// Helper para criar e inicializar um quiz em um container
async function iniciarQuiz({ containerId, storageKey, materiaId, conteudoId, habilidadeId }) {
  const instance = new Quiz({ containerId, storageKey, materiaId, conteudoId, habilidadeId })
  window.__quizInstances[containerId] = instance
  await instance.init()
  return instance
}
