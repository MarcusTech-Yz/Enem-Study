const topicoParams = new URLSearchParams(window.location.search)
const topicoMateriaKey = topicoParams.get('m')

if (!topicoMateriaKey || !ENEM[topicoMateriaKey]) {
  window.location.href = 'materias.html'
}

const topicoMateria = ENEM[topicoMateriaKey]
const topicoContext = resolveTopicoContext(topicoMateria, topicoParams)

if (!topicoContext) {
  window.location.href = `materia.html?m=${topicoMateriaKey}`
}

const { conteudo, habilidade, topicoKeyId, topicoFlatIdx } = topicoContext

const TOPICO_SK = {
  anotacao: `tuniv_anotacao_${topicoKeyId}`,
  videos: `tuniv_videos_${topicoKeyId}`,
  questoes: `tuniv_questoes_${topicoKeyId}`,
  quiz: `tuniv_quiz_${topicoKeyId}`,
  vault: 'obsidian_vault',
}

const TOPICO_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAy8HRawioRC-_IOaVj9RqXlU1ASb-vHtU",
  authDomain: "enem-study.firebaseapp.com",
  projectId: "enem-study",
  storageBucket: "enem-study.firebasestorage.app",
  messagingSenderId: "859828535888",
  appId: "1:859828535888:web:85d41615dfb88f140e8755",
  measurementId: "G-N02390WPSK",
}

let topicoDb = null
let topicoFirebaseReady = false
let bancoQuestoes = []
let quizState = {
  open: false,
  current: 0,
  selected: null,
  answered: false,
  acertos: 0,
}

function resolveTopicoContext(materia, params) {
  const byId = params.get('id')
  const byConteudo = params.get('conteudo')
  const byHab = params.get('h')
  const byIdx = params.get('idx')
  const flat = []

  for (const conteudo of materia.conteudos || []) {
    for (const habilidade of conteudo.habilidades || []) {
      flat.push({
        conteudo,
        habilidade,
        topicoKeyId: `${conteudo.id}__${habilidade.id}`,
      })
    }
  }

  if (byId) {
    const found = flat.find(item =>
      item.topicoKeyId === byId ||
      String(item.habilidade.id) === byId
    )
    if (found) return { ...found, topicoFlatIdx: flat.indexOf(found) }
  }

  if (byConteudo && byHab) {
    const found = flat.find(item =>
      item.conteudo.id === byConteudo && String(item.habilidade.id) === String(byHab)
    )
    if (found) return { ...found, topicoFlatIdx: flat.indexOf(found) }
  }

  if (byIdx !== null) {
    const idx = Number(byIdx)
    if (!Number.isNaN(idx) && flat[idx]) return { ...flat[idx], topicoFlatIdx: idx }
  }

  return null
}

function getTopicoTitulo() {
  return habilidade.topico || habilidade.titulo || String(habilidade.id)
}

function getTopicoDescricao() {
  return habilidade.descricao || 'Espaço dedicado para anotações, vídeos, questões e revisão desse tópico.'
}

function getTopicoAnotacao() {
  return store.get(TOPICO_SK.anotacao) || ''
}

function saveTopicoAnotacao(text) {
  store.set(TOPICO_SK.anotacao, text)
}

function getTopicoVideos() {
  return store.get(TOPICO_SK.videos) || []
}

function saveTopicoVideos(videos) {
  store.set(TOPICO_SK.videos, videos)
}

function getTopicoQuestoes() {
  return store.get(TOPICO_SK.questoes) || []
}

function saveTopicoQuestoes(questoes) {
  store.set(TOPICO_SK.questoes, questoes)
}

function getTopicoQuizProgress() {
  return store.get(TOPICO_SK.quiz) || { tentativas: 0, acertos: 0, ultimaPontuacao: null }
}

function saveTopicoQuizProgress(progress) {
  store.set(TOPICO_SK.quiz, progress)
}

function initTopicoFirebase() {
  if (topicoFirebaseReady || typeof firebase === 'undefined') return topicoFirebaseReady

  try {
    if (!firebase.apps?.length) firebase.initializeApp(TOPICO_FIREBASE_CONFIG)
    topicoDb = firebase.firestore()
    topicoFirebaseReady = true
  } catch (err) {
    console.warn('Firebase indisponivel na pagina de topico:', err)
  }

  return topicoFirebaseReady
}

function getVaultName() {
  return store.get(TOPICO_SK.vault) || ''
}

function saveVaultName(name) {
  store.set(TOPICO_SK.vault, name)
}

function isTopicoFeito() {
  return getTopicosFeitos(topicoMateriaKey).includes(topicoKeyId)
}

function toggleTopicoFeitoAtual() {
  let feitos = getTopicosFeitos(topicoMateriaKey)
  feitos = feitos.includes(topicoKeyId)
    ? feitos.filter(item => item !== topicoKeyId)
    : [...feitos, topicoKeyId]
  store.set(`topicos_${topicoMateriaKey}`, feitos)
  bumpStreak()
  runConquistasCheck()
  return feitos
}

function getTopicoDificuldade() {
  return getDificuldades(topicoMateriaKey)[topicoKeyId] || 0
}

function setTopicoDificuldade(value) {
  const all = getDificuldades(topicoMateriaKey)
  all[topicoKeyId] = value
  store.set(`dific_${topicoMateriaKey}`, all)
}

function renderTopicoPage() {
  document.title = `ENEM · ${getTopicoTitulo()}`

  document.getElementById('main-content').innerHTML = `
    <div class="topico-shell">
      <a class="back-link" href="materia.html?m=${topicoMateriaKey}">
        <i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Voltar para ${topicoMateria.nome}
      </a>

      <section class="topico-hero">
        <div class="topico-meta">
          <div class="topico-tag">
            <i data-lucide="${topicoMateria.icone}"></i>
            ${topicoMateria.nome} · ${conteudo.nome} · ${habilidade.id}
          </div>
          <div class="topico-title">${getTopicoTitulo()}</div>
          <div class="topico-desc">${getTopicoDescricao()}</div>
        </div>
        <div class="topico-actions">
          <button class="btn btn-sm ${isTopicoFeito() ? 'btn-accent' : ''}" id="topico-check-btn" onclick="toggleTopicoDone()">
            <i data-lucide="${isTopicoFeito() ? 'check-circle-2' : 'circle'}" style="width:14px;height:14px;"></i>
            ${isTopicoFeito() ? 'Concluído' : 'Marcar como feito'}
          </button>
          <button class="btn btn-sm" onclick="openObsidianNote()">
            <i data-lucide="external-link" style="width:13px;height:13px;"></i> Obsidian
          </button>
          <button class="btn btn-sm" onclick="exportTopicoMarkdown()">
            <i data-lucide="download" style="width:13px;height:13px;"></i> Exportar .md
          </button>
        </div>
      </section>

      <section class="topico-stats">
        <div class="tstat">
          <div class="tstat-lbl">Tempo Estudado</div>
          <div class="tstat-val" id="tempo-topico-val">${formatTempo(getTempo(topicoMateriaKey, topicoKeyId))}</div>
        </div>
        <div class="tstat">
          <div class="tstat-lbl">Dificuldade</div>
          <div class="tstat-val" id="dificuldade-topico-val">${formatDificuldadeLabel(getTopicoDificuldade())}</div>
        </div>
        <div class="tstat">
          <div class="tstat-lbl">Progresso da Matéria</div>
          <div class="tstat-val">${getProgressoMateria(topicoMateriaKey).pct}%</div>
        </div>
      </section>

      <section class="topico-card">
        <div class="tabs">
          <button class="tab ativo" data-tab="anotacoes" onclick="switchTopicoTab('anotacoes', this)">
            <i data-lucide="notebook-pen"></i> Anotações
          </button>
          <button class="tab" data-tab="videos" onclick="switchTopicoTab('videos', this)">
            <i data-lucide="youtube"></i> Vídeos
          </button>
          <button class="tab" data-tab="questoes" onclick="switchTopicoTab('questoes', this)">
            <i data-lucide="help-circle"></i> Questões
          </button>
          <button class="tab" data-tab="obsidian" onclick="switchTopicoTab('obsidian', this)">
            <i data-lucide="database"></i> Obsidian
          </button>
        </div>

        <div class="tab-panel ativo" id="tab-anotacoes">
          <div class="editor-tools">
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="fmt-btn" onclick="insertFormat('**','**')"><strong>B</strong></button>
              <button class="fmt-btn" onclick="insertFormat('*','*')"><em>I</em></button>
              <button class="fmt-btn" onclick="insertFormat('- ','')">Lista</button>
            </div>
            <div class="save-status" id="save-status-topico"></div>
          </div>
          <textarea class="anotacao-area" id="topico-anotacao" placeholder="Resuma esse tópico, exemplos, fórmulas e dúvidas...">${escapeHtmlForTextarea(getTopicoAnotacao())}</textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <button class="btn btn-sm" onclick="setDifficulty(1)">Entendi pouco</button>
            <button class="btn btn-sm" onclick="setDifficulty(2)">Mais ou menos</button>
            <button class="btn btn-sm" onclick="setDifficulty(3)">Entendi bem</button>
          </div>
        </div>

        <div class="tab-panel" id="tab-videos">
          <div class="video-add-row">
            <input class="video-input" type="text" id="video-url" placeholder="Cole um link do YouTube..." />
            <button class="btn btn-accent btn-sm" onclick="addTopicoVideo()">Salvar vídeo</button>
          </div>
          <div class="videos-grid" id="videos-grid"></div>
        </div>

        <div class="tab-panel" id="tab-questoes">
          <div id="practice-area"></div>
          <details class="manual-questions">
            <summary>Questões manuais deste tópico</summary>
            <div class="questao-form">
              <textarea id="questao-enunciado" placeholder="Enunciado da questão..."></textarea>
              <textarea id="questao-resposta" placeholder="Resposta ou comentário..."></textarea>
              <button class="btn btn-accent btn-sm" onclick="addTopicoQuestao()">Adicionar questão</button>
            </div>
            <div id="questoes-list"></div>
          </details>
        </div>

        <div class="tab-panel" id="tab-obsidian">
          <div class="obsidian-section">
            <div class="obsidian-box">
              <h3>Vault do Obsidian</h3>
              <p>Defina o nome do seu vault para abrir ou criar notas desse tópico.</p>
              <div class="obsidian-vault-row">
                <input class="video-input" type="text" id="vault-name" value="${escapeHtmlForAttr(getVaultName())}" placeholder="Ex: ENEM-Study" />
                <button class="btn btn-sm" onclick="saveTopicoVault()">Salvar</button>
              </div>
            </div>
            <div class="obsidian-box">
              <h3>Exportar tópico</h3>
              <p>Gera um arquivo Markdown com anotações, vídeos e questões desse tópico.</p>
              <button class="btn btn-accent btn-sm" onclick="exportTopicoMarkdown()">Baixar .md</button>
            </div>
            <div class="obsidian-box">
              <h3>Importar anotação pronta</h3>
              <p>Cole aqui um texto vindo do Obsidian para substituir suas anotações atuais.</p>
              <textarea class="obsidian-import-area" id="obsidian-import" placeholder="Cole o conteúdo da nota aqui..."></textarea>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                <button class="btn btn-sm btn-accent" onclick="importFromObsidian()">Importar</button>
                <button class="btn btn-sm" onclick="document.getElementById('obsidian-import').value=''">Limpar</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `

  setupTopicoListeners()
  renderTopicoVideos()
  renderPracticeArea({ loading: true })
  loadBancoQuestoes()
  renderTopicoQuestoes()
  setNavActive()
  lucide.createIcons()
}

function setupTopicoListeners() {
  const textarea = document.getElementById('topico-anotacao')
  let timer = null
  if (!textarea) return

  textarea.addEventListener('input', () => {
    clearTimeout(timer)
    const status = document.getElementById('save-status-topico')
    if (status) status.textContent = 'salvando...'
    timer = setTimeout(() => {
      saveTopicoAnotacao(textarea.value)
      if (status) {
        status.textContent = 'salvo'
        setTimeout(() => {
          if (status) status.textContent = ''
        }, 1200)
      }
    }, 500)
  })
}

function switchTopicoTab(name, btn) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('ativo'))
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('ativo'))
  btn.classList.add('ativo')
  document.getElementById(`tab-${name}`).classList.add('ativo')
}

function toggleTopicoDone() {
  toggleTopicoFeitoAtual()
  updateTopicoHeader()
}

function updateTopicoHeader() {
  const button = document.getElementById('topico-check-btn')
  const tempoEl = document.getElementById('tempo-topico-val')
  const difEl = document.getElementById('dificuldade-topico-val')
  if (button) {
    button.className = `btn btn-sm ${isTopicoFeito() ? 'btn-accent' : ''}`
    button.innerHTML = `<i data-lucide="${isTopicoFeito() ? 'check-circle-2' : 'circle'}" style="width:14px;height:14px;"></i> ${isTopicoFeito() ? 'Concluído' : 'Marcar como feito'}`
  }
  if (tempoEl) tempoEl.textContent = formatTempo(getTempo(topicoMateriaKey, topicoKeyId))
  if (difEl) difEl.textContent = formatDificuldadeLabel(getTopicoDificuldade())
  lucide.createIcons()
}

function setDifficulty(value) {
  const current = getTopicoDificuldade()
  setTopicoDificuldade(current === value ? 0 : value)
  updateTopicoHeader()
}

function formatDificuldadeLabel(value) {
  if (value === 1) return 'Baixa compreensão'
  if (value === 2) return 'Em andamento'
  if (value === 3) return 'Bem entendido'
  return 'Não avaliado'
}

function ytId(url) {
  const match = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/)
  return match ? match[1] : null
}

async function ytTitle(id) {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://youtu.be/${id}&format=json`)
    if (!response.ok) return 'Vídeo do YouTube'
    const data = await response.json()
    return data.title || 'Vídeo do YouTube'
  } catch {
    return 'Vídeo do YouTube'
  }
}

async function addTopicoVideo() {
  const input = document.getElementById('video-url')
  const url = input.value.trim()
  if (!url) return
  const id = ytId(url)
  if (!id) {
    alert('Link do YouTube inválido.')
    return
  }
  const videos = getTopicoVideos()
  videos.push({
    id,
    url,
    titulo: await ytTitle(id),
  })
  saveTopicoVideos(videos)
  input.value = ''
  renderTopicoVideos()
}

function renderTopicoVideos() {
  const grid = document.getElementById('videos-grid')
  if (!grid) return
  const videos = getTopicoVideos()
  if (!videos.length) {
    grid.innerHTML = '<div class="empty-state">Nenhum vídeo salvo ainda.</div>'
    return
  }
  grid.innerHTML = videos.map((video, index) => `
    <div class="video-card">
      <iframe src="https://www.youtube.com/embed/${video.id}" allowfullscreen></iframe>
      <div class="video-info">
        <span class="video-title">${escapeHtml(video.titulo)}</span>
        <button class="icon-btn" onclick="removeTopicoVideo(${index})" title="Remover vídeo">
          <i data-lucide="x" style="width:14px;height:14px;"></i>
        </button>
      </div>
    </div>
  `).join('')
  lucide.createIcons()
}

function removeTopicoVideo(index) {
  const videos = getTopicoVideos()
  videos.splice(index, 1)
  saveTopicoVideos(videos)
  renderTopicoVideos()
}

async function loadBancoQuestoes() {
  const area = document.getElementById('practice-area')
  if (!area) return

  if (!initTopicoFirebase()) {
    renderPracticeArea({
      error: 'Banco de questões indisponível nesta página. Confira a configuração do Firebase.',
    })
    return
  }

  try {
    const snap = await topicoDb.collection('questoes')
      .where('status', '==', 'publicado')
      .where('materiaId', '==', topicoMateriaKey)
      .where('conteudoId', '==', conteudo.id)
      .where('habilidadeId', '==', habilidade.id)
      .get()

    bancoQuestoes = snap.docs
      .map(doc => normalizarQuestaoBanco({ id: doc.id, ...doc.data() }))
      .filter(Boolean)
      .sort((a, b) => String(a.dificuldade || '').localeCompare(String(b.dificuldade || '')))

    quizState = {
      open: false,
      current: 0,
      selected: null,
      answered: false,
      acertos: 0,
    }
    renderPracticeArea()
  } catch (err) {
    console.error('Erro ao carregar questões do tópico:', err)
    renderPracticeArea({
      error: 'Não consegui carregar as questões publicadas deste tópico agora.',
    })
  }
}

function normalizarQuestaoBanco(q) {
  const alternativas = q.alternativas || {}
  const letras = ['A', 'B', 'C', 'D']
  if (!q.pergunta || !letras.every(letra => alternativas[letra]) || !letras.includes(q.resposta)) {
    return null
  }

  return {
    id: q.id,
    pergunta: String(q.pergunta),
    alternativas: letras.reduce((acc, letra) => {
      acc[letra] = String(alternativas[letra])
      return acc
    }, {}),
    resposta: q.resposta,
    explicacao: String(q.explicacao || 'Sem explicação cadastrada.'),
    dificuldade: q.dificuldade || 'facil',
  }
}

function renderPracticeArea(options = {}) {
  const area = document.getElementById('practice-area')
  if (!area) return

  const progress = getTopicoQuizProgress()
  const count = bancoQuestoes.length
  const statusText = options.loading
    ? 'carregando...'
    : `${count} disp.`
  const canPractice = count > 0 && !options.loading && !options.error

  area.innerHTML = `
    <section class="practice-card">
      <div class="practice-head">
        <div>
          <div class="practice-kicker">Questões deste tópico</div>
          <div class="practice-title">
            <i data-lucide="target" style="width:16px;height:16px;"></i>
            Praticar questões
          </div>
          <div class="practice-sub">
            ${getPracticeSubtitle(options, progress)}
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span class="practice-count">
            <i data-lucide="list-checks" style="width:13px;height:13px;"></i>
            ${statusText}
          </span>
          <button class="btn btn-accent btn-sm" ${canPractice ? '' : 'disabled'} onclick="startTopicoQuiz()">
            <i data-lucide="play" style="width:13px;height:13px;"></i>
            ${quizState.open ? 'Recomeçar' : 'Praticar agora'}
          </button>
        </div>
      </div>
      <div class="quiz-shell ${quizState.open ? 'open' : ''}" id="quiz-shell">
        ${renderQuizContent()}
      </div>
    </section>
  `

  renderQuizMath(area)
  lucide.createIcons()
}

function getPracticeSubtitle(options, progress) {
  if (options.loading) return 'Buscando questões publicadas no banco...'
  if (options.error) return escapeHtml(options.error)
  if (!bancoQuestoes.length) return 'Ainda não há questões publicadas para este tópico.'
  if (progress.tentativas > 0 && progress.ultimaPontuacao) {
    return `Última prática: ${progress.ultimaPontuacao.acertos}/${progress.ultimaPontuacao.total} acertos.`
  }
  return 'Uma questão por vez, com feedback e explicação logo após a resposta.'
}

function startTopicoQuiz() {
  if (!bancoQuestoes.length) return
  quizState = {
    open: true,
    current: 0,
    selected: null,
    answered: false,
    acertos: 0,
  }
  renderPracticeArea()
}

function renderQuizContent() {
  if (!bancoQuestoes.length) return ''

  if (quizState.current >= bancoQuestoes.length) {
    const total = bancoQuestoes.length
    const pct = Math.round((quizState.acertos / total) * 100)
    return `
      <div class="quiz-result open">
        <p style="font-size:14px;margin-bottom:6px;">Você fechou a prática com <strong>${quizState.acertos}/${total}</strong> acertos.</p>
        <p style="color:var(--text2);font-size:12px;">Aproveitamento de ${pct}%. Dá para repetir quando quiser.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
          <button class="btn btn-accent btn-sm" onclick="startTopicoQuiz()">Refazer</button>
          <button class="btn btn-sm" onclick="closeTopicoQuiz()">Fechar</button>
        </div>
      </div>
    `
  }

  const q = bancoQuestoes[quizState.current]
  const letras = ['A', 'B', 'C', 'D']
  const feedbackClass = quizState.selected === q.resposta ? 'correct' : 'wrong'
  const feedbackTitle = quizState.selected === q.resposta ? 'Acertou.' : `Errou. Resposta correta: ${q.resposta}.`

  return `
    <div class="quiz-topbar">
      <div class="quiz-progress-text">Questão ${quizState.current + 1} de ${bancoQuestoes.length} · ${formatQuizDifficulty(q.dificuldade)}</div>
      <button class="btn btn-sm" onclick="closeTopicoQuiz()">Fechar</button>
    </div>
    <div class="quiz-question quiz-math">${escapeHtml(q.pergunta).replace(/\n/g, '<br>')}</div>
    <div class="quiz-options">
      ${letras.map(letra => renderQuizOption(q, letra)).join('')}
    </div>
    <div class="quiz-feedback ${quizState.answered ? 'open' : ''} ${feedbackClass}">
      ${quizState.answered ? `
        <strong>${feedbackTitle}</strong>
        <div class="quiz-math" style="margin-top:6px;">${escapeHtml(q.explicacao).replace(/\n/g, '<br>')}</div>
        <button class="btn btn-accent btn-sm" style="margin-top:10px;" onclick="nextTopicoQuizQuestion()">
          ${quizState.current + 1 === bancoQuestoes.length ? 'Ver resultado' : 'Próxima questão'}
        </button>
      ` : ''}
    </div>
  `
}

function renderQuizOption(q, letra) {
  let className = ''
  if (quizState.answered && letra === q.resposta) className = 'correct'
  if (quizState.answered && letra === quizState.selected && letra !== q.resposta) className = 'wrong'

  return `
    <button class="quiz-option ${className}" ${quizState.answered ? 'disabled' : ''} onclick="answerTopicoQuiz('${letra}')">
      <span class="quiz-letter">${letra}</span>
      <span class="quiz-math">${escapeHtml(q.alternativas[letra]).replace(/\n/g, '<br>')}</span>
    </button>
  `
}

function answerTopicoQuiz(letra) {
  if (quizState.answered || !bancoQuestoes[quizState.current]) return
  const q = bancoQuestoes[quizState.current]
  quizState.selected = letra
  quizState.answered = true
  if (letra === q.resposta) quizState.acertos += 1
  renderPracticeArea()
}

function nextTopicoQuizQuestion() {
  quizState.current += 1
  quizState.selected = null
  quizState.answered = false

  if (quizState.current >= bancoQuestoes.length) {
    const progress = getTopicoQuizProgress()
    saveTopicoQuizProgress({
      tentativas: (progress.tentativas || 0) + 1,
      acertos: (progress.acertos || 0) + quizState.acertos,
      ultimaPontuacao: {
        acertos: quizState.acertos,
        total: bancoQuestoes.length,
        finishedAt: new Date().toISOString(),
      },
    })
  }

  renderPracticeArea()
}

function closeTopicoQuiz() {
  quizState.open = false
  renderPracticeArea()
}

function formatQuizDifficulty(value) {
  return {
    facil: 'fácil',
    medio: 'médio',
    dificil: 'difícil',
  }[value] || value || 'nível único'
}

function renderQuizMath(root) {
  if (!root || typeof renderMathInElement === 'undefined') return
  renderMathInElement(root, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
    throwOnError: false,
  })
}

function addTopicoQuestao() {
  const enunciadoEl = document.getElementById('questao-enunciado')
  const respostaEl = document.getElementById('questao-resposta')
  const enunciado = enunciadoEl.value.trim()
  const resposta = respostaEl.value.trim()
  if (!enunciado) return

  const questoes = getTopicoQuestoes()
  questoes.push({
    enunciado,
    resposta,
    createdAt: new Date().toISOString(),
  })
  saveTopicoQuestoes(questoes)
  enunciadoEl.value = ''
  respostaEl.value = ''
  renderTopicoQuestoes()
}

function renderTopicoQuestoes() {
  const list = document.getElementById('questoes-list')
  if (!list) return
  const questoes = getTopicoQuestoes()
  if (!questoes.length) {
    list.innerHTML = '<div class="empty-state">Nenhuma questão salva ainda.</div>'
    return
  }
  list.innerHTML = questoes.map((questao, index) => `
    <div class="questao-item">
      <div class="questao-enunciado">${escapeHtml(questao.enunciado).replace(/\n/g, '<br>')}</div>
      ${questao.resposta ? `<div style="color:var(--text2);font-size:13px;line-height:1.6;">${escapeHtml(questao.resposta).replace(/\n/g, '<br>')}</div>` : ''}
      <div class="questao-footer">
        <span class="save-status">Questão ${index + 1}</span>
        <button class="icon-btn" onclick="removeTopicoQuestao(${index})">remover</button>
      </div>
    </div>
  `).join('')
}

function removeTopicoQuestao(index) {
  const questoes = getTopicoQuestoes()
  questoes.splice(index, 1)
  saveTopicoQuestoes(questoes)
  renderTopicoQuestoes()
}

function saveTopicoVault() {
  const input = document.getElementById('vault-name')
  saveVaultName(input.value.trim())
}

function openObsidianNote() {
  const vault = getVaultName()
  if (!vault) {
    alert('Defina primeiro o nome do vault do Obsidian.')
    return
  }
  const file = `${topicoMateria.nome}/${getTopicoTitulo()}`
  window.location.href = `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(file)}`
}

function importFromObsidian() {
  const importEl = document.getElementById('obsidian-import')
  const content = importEl.value.trim()
  if (!content) return
  if (!confirm('Isso vai substituir suas anotações atuais desse tópico. Continuar?')) return
  saveTopicoAnotacao(content)
  const anotacaoEl = document.getElementById('topico-anotacao')
  if (anotacaoEl) anotacaoEl.value = content
  importEl.value = ''
}

function exportTopicoMarkdown() {
  const markdown = buildTopicoMarkdown()
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFileName(getTopicoTitulo())}.md`
  a.click()
  URL.revokeObjectURL(url)
}

function buildTopicoMarkdown() {
  const videos = getTopicoVideos()
  const questoes = getTopicoQuestoes()
  const anotacao = getTopicoAnotacao()
  const tempo = getTempo(topicoMateriaKey, topicoKeyId)

  let md = `---\n`
  md += `materia: "${topicoMateria.nome}"\n`
  md += `conteudo: "${conteudo.nome}"\n`
  md += `topico: "${getTopicoTitulo()}"\n`
  md += `id: "${topicoKeyId}"\n`
  md += `concluido: ${isTopicoFeito()}\n`
  md += `tempo_estudado: "${formatTempo(tempo)}"\n`
  md += `---\n\n`
  md += `# ${getTopicoTitulo()}\n\n`
  md += `## Anotações\n\n${anotacao || 'Sem anotações ainda.'}\n\n`

  if (videos.length) {
    md += `## Vídeos\n\n`
    videos.forEach(video => {
      md += `- [${video.titulo}](${video.url})\n`
    })
    md += '\n'
  }

  if (questoes.length) {
    md += `## Questões\n\n`
    questoes.forEach((questao, index) => {
      md += `### Questão ${index + 1}\n\n`
      md += `${questao.enunciado}\n\n`
      if (questao.resposta) md += `**Resposta:** ${questao.resposta}\n\n`
    })
  }

  return md
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeHtmlForTextarea(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeHtmlForAttr(value) {
  return escapeHtml(value)
}

function insertFormat(before, after) {
  const textarea = document.getElementById('topico-anotacao')
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.slice(start, end)
  textarea.value = `${textarea.value.slice(0, start)}${before}${selected}${after}${textarea.value.slice(end)}`
  textarea.focus()
  textarea.selectionStart = start + before.length
  textarea.selectionEnd = end + before.length
  saveTopicoAnotacao(textarea.value)
}

function sanitizeFileName(name) {
  return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
}

document.addEventListener('DOMContentLoaded', renderTopicoPage)
