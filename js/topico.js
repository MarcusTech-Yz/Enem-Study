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
  anotacaoLegada: `tuniv_anotacao_${topicoKeyId}`,
  anotacaoFocoLegada: `nota_foco_${topicoMateriaKey}_${topicoKeyId}`,
  videos: `tuniv_videos_${topicoKeyId}`,
  questoes: `tuniv_questoes_${topicoKeyId}`,
  quiz: `tuniv_quiz_${topicoKeyId}`,
  vault: 'obsidian_vault',
}

const NOTE_BLOCK_TYPES = ['resumo', 'exemplo', 'formula', 'duvida', 'erro', 'texto']
let selectedNoteId = null
let selectedVideoId = null

// Firebase e quiz gerenciados por firebase-init.js e quiz.js

function resolveTopicoContext(materia, params) {
  const byId = params.get('id') || params.get('t')
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
  const blocos = store.get(getNoteBlocksKey())
  if (Array.isArray(blocos)) return blocksToMarkdown(normalizeNoteBlocks(blocos))

  const notas = getNotasMateria(topicoMateriaKey)
  const oficial = notas[topicoKeyId]
  if (typeof oficial === 'string' && oficial.trim()) return oficial

  const legada = store.get(TOPICO_SK.anotacaoLegada) || store.get(TOPICO_SK.anotacaoFocoLegada) || ''
  if (legada && !oficial) saveNotaTopico(topicoMateriaKey, topicoKeyId, legada)
  return legada
}

function saveTopicoAnotacao(text) {
  saveNotaTopico(topicoMateriaKey, topicoKeyId, text)
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

function getVaultName() {
  return store.get(TOPICO_SK.vault) || ''
}

function saveVaultName(name) {
  store.set(TOPICO_SK.vault, name)
}

function isTopicoAtualFeito() {
  return isTopicoFeito(topicoMateriaKey, topicoKeyId)
}

function toggleTopicoFeitoAtual() {
  return toggleTopicoFeito(topicoMateriaKey, topicoKeyId)
}

function getTopicoDificuldade() {
  return getDificuldades(topicoMateriaKey)[topicoKeyId] || 0
}

function setTopicoDificuldade(value) {
  const all = getDificuldades(topicoMateriaKey)
  all[topicoKeyId] = value
  store.set(`dific_${topicoMateriaKey}`, all)
}

function getDefaultTopicTab() {
  const tab = getFormatoPreferidoAction().tab
  return ['anotacoes', 'videos', 'questoes'].includes(tab) ? tab : 'anotacoes'
}

function renderTopicoPage() {
  document.title = `ENEM · ${getTopicoTitulo()}`
  const formatoAcao = getFormatoPreferidoAction()
  const defaultTab = getDefaultTopicTab()

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
          <button class="btn btn-sm ${isTopicoAtualFeito() ? 'btn-accent' : ''}" id="topico-check-btn" onclick="toggleTopicoDone()">
            <i data-lucide="${isTopicoAtualFeito() ? 'check-circle-2' : 'circle'}" style="width:14px;height:14px;"></i>
            ${isTopicoAtualFeito() ? 'Concluído' : 'Marcar como feito'}
          </button>
          <button class="btn btn-sm btn-accent" onclick="startTopicoFocus()">
            <i data-lucide="play" style="width:13px;height:13px;"></i> Iniciar sessão
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
          <div class="tstat-val" id="progresso-materia-val">${getProgressoMateria(topicoMateriaKey).pct}%</div>
        </div>
      </section>

      <div class="personal-tip">
        <strong>Sugestão para você:</strong> ${escapeHtml(formatoAcao.label)}
      </div>

      <section class="topico-card">
        <div class="tabs">
          <button class="tab ${defaultTab === 'anotacoes' ? 'ativo' : ''}" data-tab="anotacoes" onclick="switchTopicoTab('anotacoes', this)">
            <i data-lucide="notebook-pen"></i> Anotações
          </button>
          <button class="tab ${defaultTab === 'videos' ? 'ativo' : ''}" data-tab="videos" onclick="switchTopicoTab('videos', this)">
            <i data-lucide="youtube"></i> Vídeos
          </button>
          <button class="tab ${defaultTab === 'questoes' ? 'ativo' : ''}" data-tab="questoes" onclick="switchTopicoTab('questoes', this)">
            <i data-lucide="help-circle"></i> Questões
          </button>
          <button class="tab" data-tab="obsidian" onclick="switchTopicoTab('obsidian', this)">
            <i data-lucide="database"></i> Obsidian
          </button>
        </div>

        <div class="tab-panel ${defaultTab === 'anotacoes' ? 'ativo' : ''}" id="tab-anotacoes">
          <div class="note-head">
            <div>
              <p class="note-kicker">Caderno do tópico</p>
              <h3>Anotações de revisão</h3>
            </div>
            <div class="save-status" id="save-status-topico"></div>
          </div>

          <div class="note-toolbar">
            <button class="note-tool primary" onclick="addNoteBlock('resumo')">
              <i data-lucide="book-open" style="width:13px;height:13px;"></i>
              Resumo
            </button>
            <button class="note-tool" onclick="addNoteBlock('exemplo')">
              <i data-lucide="lightbulb" style="width:13px;height:13px;"></i>
              Exemplo
            </button>
            <button class="note-tool" onclick="addNoteBlock('formula')">
              <i data-lucide="sigma" style="width:13px;height:13px;"></i>
              Fórmula
            </button>
            <button class="note-tool" onclick="addNoteBlock('duvida')">
              <i data-lucide="circle-help" style="width:13px;height:13px;"></i>
              Dúvida
            </button>
            <button class="note-tool" onclick="addNoteBlock('erro')">
              <i data-lucide="triangle-alert" style="width:13px;height:13px;"></i>
              Erro
            </button>
            <button class="note-tool" onclick="addNoteBlock('texto')">
              <i data-lucide="type" style="width:13px;height:13px;"></i>
              Texto
            </button>
          </div>

          <div id="note-blocks" class="note-blocks"></div>

          <div class="note-footer">
            <p class="note-helper">
              Dica: escreva pensando em revisão. O ideal é conseguir reler isso em 2 minutos antes da prova.
            </p>
          </div>

          <div class="mastery-box">
            <div>
              <p class="note-kicker">Domínio do conteúdo</p>
              <p class="mastery-help">Como você se sente nesse tópico agora?</p>
            </div>

            <div class="mastery-row">
              <button class="mastery-btn d1" data-dif="1" onclick="setDifficulty(1)">
                <i data-lucide="alert-circle" style="width:14px;height:14px;"></i>
                Preciso revisar
              </button>
              <button class="mastery-btn d2" data-dif="2" onclick="setDifficulty(2)">
                <i data-lucide="loader-circle" style="width:14px;height:14px;"></i>
                Em andamento
              </button>
              <button class="mastery-btn d3" data-dif="3" onclick="setDifficulty(3)">
                <i data-lucide="check-circle-2" style="width:14px;height:14px;"></i>
                Entendi bem
              </button>
            </div>
          </div>
        </div>

        <div class="tab-panel ${defaultTab === 'videos' ? 'ativo' : ''}" id="tab-videos">
          <div class="video-add-row">
            <input class="video-input" type="text" id="video-url" placeholder="Cole um link do YouTube..." />
            <button class="btn btn-accent btn-sm" onclick="addTopicoVideo()">Salvar vídeo</button>
          </div>
          <div class="videos-grid" id="videos-grid"></div>
        </div>

        <div class="tab-panel ${defaultTab === 'questoes' ? 'ativo' : ''}" id="tab-questoes">
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

  renderNoteBlocks()
  renderTopicoVideos()
  renderFocusMiniBar()
  iniciarQuiz({
    containerId:  'practice-area',
    storageKey:   TOPICO_SK.quiz,
    materiaId:    topicoMateriaKey,
    conteudoId:   conteudo.id,
    habilidadeId: habilidade.id,
  })
  renderTopicoQuestoes()
  setNavActive()
  updateMasteryButtons()
  lucide.createIcons()
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
  const progressoEl = document.getElementById('progresso-materia-val')
  if (button) {
    button.className = `btn btn-sm ${isTopicoAtualFeito() ? 'btn-accent' : ''}`
    button.innerHTML = `<i data-lucide="${isTopicoAtualFeito() ? 'check-circle-2' : 'circle'}" style="width:14px;height:14px;"></i> ${isTopicoAtualFeito() ? 'Concluído' : 'Marcar como feito'}`
  }
  if (tempoEl) tempoEl.textContent = formatTempo(getTempo(topicoMateriaKey, topicoKeyId))
  if (difEl) difEl.innerHTML = formatDificuldadeLabel(getTopicoDificuldade())
  if (progressoEl) progressoEl.textContent = `${getProgressoMateria(topicoMateriaKey).pct}%`
  lucide.createIcons()
}

function setDifficulty(value) {
  const current = getTopicoDificuldade()
  const next = current === value ? 0 : value
  setTopicoDificuldade(next)

  if (typeof saveUserTopicState === 'function' && typeof getRecommendationTopicId === 'function') {
    const topicId = getRecommendationTopicId(topicoMateriaKey, topicoKeyId)
    const statePatch = next === 1
      ? { status: 'dificuldade', dificuldadeDoUsuario: 3, proximaRevisao: typeof addDaysISO === 'function' ? addDaysISO(3) : null }
      : next === 2
        ? { status: 'parcial', dificuldadeDoUsuario: 2, proximaRevisao: typeof addDaysISO === 'function' ? addDaysISO(7) : null }
        : next === 3
          ? { status: 'dominado', dificuldadeDoUsuario: 0, proximaRevisao: typeof addDaysISO === 'function' ? addDaysISO(14) : null }
          : { status: 'novo', dificuldadeDoUsuario: 0, proximaRevisao: null }
    saveUserTopicState(topicId, statePatch)
  }

  updateTopicoHeader()
  updateMasteryButtons()
}

function updateMasteryButtons() {
  const current = getTopicoDificuldade()

  document.querySelectorAll('.mastery-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.dif) === current)
  })

  lucide.createIcons()
}

function startTopicoFocus() {
  const params = new URLSearchParams({
    materiaKey: topicoMateriaKey,
    tKey: topicoKeyId,
    texto: getTopicoTitulo(),
    matNome: topicoMateria.nome,
  })
  window.location.href = 'modo-foco.html?' + params.toString()
}

function formatDificuldadeLabel(value) {
  const meta = getDificuldadeMeta(value)

  return `
    <span class="mastery-badge ${meta.className}">
      <i data-lucide="${meta.icon}" style="width:14px;height:14px;"></i>
      ${meta.label}
    </span>
  `
}

function getDificuldadeMeta(value) {
  if (value === 1) {
    return {
      label: 'Preciso revisar',
      icon: 'alert-circle',
      className: 'd1',
    }
  }

  if (value === 2) {
    return {
      label: 'Em andamento',
      icon: 'loader-circle',
      className: 'd2',
    }
  }

  if (value === 3) {
    return {
      label: 'Entendi bem',
      icon: 'check-circle-2',
      className: 'd3',
    }
  }

  return {
    label: 'Não avaliado',
    icon: 'circle',
    className: 'none',
  }
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
  if (!id) { alert('Link do YouTube inválido.'); return }
  const videos = getTopicoVideos()
  videos.push({ id, url, titulo: await ytTitle(id) })
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
  saveNoteBlocks([{
    id: createNoteBlockId(),
    type: 'texto',
    title: 'Importado do Obsidian',
    content,
  }])
  renderNoteBlocks()
  importEl.value = ''
  markTopicoSaved()
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
  md += `concluido: ${isTopicoAtualFeito()}\n`
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

function getNoteBlocksKey() {
  return `note_blocks_${topicoMateriaKey}_${topicoKeyId}`
}

function getNoteBlocks() {
  const blocks = store.get(getNoteBlocksKey())
  if (Array.isArray(blocks)) return normalizeNoteBlocks(blocks)

  const oldNote = getTopicoAnotacao()
  if (oldNote && oldNote.trim()) {
    const migrated = [{
      id: createNoteBlockId(),
      type: 'texto',
      title: 'Anotação antiga',
      content: oldNote,
    }]

    saveNoteBlocks(migrated)
    return migrated
  }

  return []
}

function normalizeNoteBlocks(blocks) {
  return blocks
    .filter(block => block && typeof block === 'object')
    .map(block => {
      const type = NOTE_BLOCK_TYPES.includes(block.type) ? block.type : 'texto'
      const meta = getBlockMeta(type)
      return {
        id: String(block.id || createNoteBlockId()),
        type,
        title: String(block.title || meta.title),
        content: String(block.content || ''),
      }
    })
}

function saveNoteBlocks(blocks) {
  const normalized = normalizeNoteBlocks(blocks)
  store.set(getNoteBlocksKey(), normalized)
  saveTopicoAnotacao(blocksToMarkdown(normalized))
}

function blocksToMarkdown(blocks) {
  return blocks
    .map(block => {
      const meta = getBlockMeta(block.type)
      const title = block.title || meta.title
      return `## ${title}\n${block.content || ''}`.trim()
    })
    .filter(Boolean)
    .join('\n\n')
}

function getBlockMeta(type) {
  const meta = {
    resumo: {
      title: 'Resumo',
      icon: 'book-open',
      template: '- Ideia principal:\n- Como aparece no ENEM:\n- Palavra-chave:',
    },
    exemplo: {
      title: 'Exemplo',
      icon: 'lightbulb',
      template: 'Situação:\n\nComo resolver:\n\nConclusão:',
    },
    formula: {
      title: 'Fórmula / regra',
      icon: 'sigma',
      template: 'Expressão:\n\nQuando usar:\n\nCuidados:',
    },
    duvida: {
      title: 'Dúvida',
      icon: 'circle-help',
      template: 'O que não entendi:\n\nO que preciso revisar:',
    },
    erro: {
      title: 'Erro comum',
      icon: 'triangle-alert',
      template: 'Eu errei porque:\n\nComo evitar:',
    },
    texto: {
      title: 'Texto livre',
      icon: 'type',
      template: '',
    },
  }

  return meta[type] || meta.texto
}

function createNoteBlockId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID()
  }

  return `note_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function addNoteBlock(type) {
  const meta = getBlockMeta(type)
  const blocks = getNoteBlocks()

  blocks.push({
    id: createNoteBlockId(),
    type: NOTE_BLOCK_TYPES.includes(type) ? type : 'texto',
    title: meta.title,
    content: meta.template,
  })

  saveNoteBlocks(blocks)
  renderNoteBlocks()
  markTopicoSaved()

  setTimeout(() => {
    const last = document.querySelector('.note-block:last-child textarea')
    if (last) {
      last.focus()
      last.setSelectionRange(last.value.length, last.value.length)
    }
  }, 0)
}

function updateNoteBlock(id, content) {
  const blocks = getNoteBlocks().map(block => {
    if (block.id !== id) return block
    return { ...block, content }
  })

  saveNoteBlocks(blocks)
  markTopicoSaved()
}

function removeNoteBlock(id) {
  const ok = confirm('Remover este bloco de anotação?')
  if (!ok) return

  saveNoteBlocks(getNoteBlocks().filter(block => block.id !== id))
  renderNoteBlocks()
  markTopicoSaved()
}

function moveNoteBlock(id, direction) {
  const blocks = getNoteBlocks()
  const index = blocks.findIndex(block => block.id === id)
  if (index === -1) return

  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= blocks.length) return

  const current = blocks[index]
  blocks[index] = blocks[newIndex]
  blocks[newIndex] = current

  saveNoteBlocks(blocks)
  renderNoteBlocks()
  markTopicoSaved()
}

function renderNoteBlocks() {
  const container = document.getElementById('note-blocks')
  if (!container) return

  const blocks = getNoteBlocks()

  if (!blocks.length) {
    container.innerHTML = `
      <div class="note-empty-state">
        <strong>Nenhuma anotação ainda.</strong>
        Use os botões acima para criar blocos de revisão.
      </div>
    `
    return
  }

  container.innerHTML = blocks.map((block, index) => {
    const meta = getBlockMeta(block.type)
    const blockId = escapeJsString(block.id)

    return `
      <article class="note-block ${block.type}" data-id="${escapeHtmlForAttr(block.id)}">
        <div class="note-block-head">
          <div class="note-block-title">
            <i data-lucide="${meta.icon}"></i>
            ${escapeHtml(block.title || meta.title)}
          </div>

          <div class="note-block-actions">
            <button class="note-block-action" onclick="moveNoteBlock('${blockId}', -1)" ${index === 0 ? 'disabled' : ''} title="Mover para cima">
              <i data-lucide="chevron-up"></i>
            </button>
            <button class="note-block-action" onclick="moveNoteBlock('${blockId}', 1)" ${index === blocks.length - 1 ? 'disabled' : ''} title="Mover para baixo">
              <i data-lucide="chevron-down"></i>
            </button>
            <button class="note-block-action danger" onclick="removeNoteBlock('${blockId}')" title="Remover bloco">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>

        <textarea
          class="note-block-textarea"
          oninput="updateNoteBlock('${blockId}', this.value)"
          placeholder="Escreva aqui..."
        >${escapeHtmlForTextarea(block.content || '')}</textarea>
      </article>
    `
  }).join('')

  lucide.createIcons()
}

function escapeJsString(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}

function markTopicoSaved(message = 'salvo') {
  const status = document.getElementById('save-status-topico')
  if (status) {
    status.textContent = message
    setTimeout(() => {
      if (status) status.textContent = ''
    }, 1200)
  }
}

function sanitizeFileName(name) {
  return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
}

let focusMiniInterval = null

function renderFocusMiniBar() {
  const existing = document.getElementById('focus-mini-bar')
  if (existing) existing.remove()
  if (!isActiveFocusForTopic(topicoMateriaKey, topicoKeyId)) return

  const bar = document.createElement('div')
  bar.id = 'focus-mini-bar'
  bar.className = 'focus-mini-bar'
  bar.innerHTML = `
    <div class="focus-mini-left">
      <span class="focus-mini-dot"></span>
      <div>
        <strong id="focus-mini-time">00:00</strong>
      </div>
    </div>

    <div class="focus-mini-actions">
      <button class="btn btn-sm" id="focus-mini-toggle" onclick="toggleFocusMini()">
        Pausar
      </button>
      <button class="btn btn-sm" id="focus-mini-save" onclick="saveFocusMini()">
        Salvar tempo
      </button>
      <button class="btn btn-sm btn-accent" onclick="finishFocusMini()">
        Concluir tópico
      </button>
    </div>
  `

  document.body.appendChild(bar)

  updateFocusMiniBar()
  clearInterval(focusMiniInterval)
  focusMiniInterval = setInterval(updateFocusMiniBar, 1000)
}

function updateFocusMiniBar() {
  const session = getActiveFocusSession()
  if (!session || !isActiveFocusForTopic(topicoMateriaKey, topicoKeyId)) {
    const bar = document.getElementById('focus-mini-bar')
    if (bar) bar.remove()
    clearInterval(focusMiniInterval)
    return
  }

  const elapsed = getFocusElapsed(session)
  const timeEl = document.getElementById('focus-mini-time')
  const toggleBtn = document.getElementById('focus-mini-toggle')

  if (timeEl) timeEl.textContent = formatTempo(elapsed)

  if (toggleBtn) {
    toggleBtn.textContent = session.running ? 'Pausar' : 'Retomar'
  }
}

function toggleFocusMini() {
  const session = getActiveFocusSession()
  if (!session) return

  if (session.running) {
    pauseActiveFocusSession()
  } else {
    startActiveFocusSession()
  }

  updateFocusMiniBar()
}

function saveFocusMini() {
  const result = saveActiveFocusTime()
  const btn = document.getElementById('focus-mini-save')

  if (btn) {
    const old = btn.textContent
    btn.textContent = result.ok ? 'Salvo ✓' : 'Nada novo'
    setTimeout(() => {
      btn.textContent = old
    }, 1400)
  }

  updateFocusMiniBar()
  updateTopicoHeader()
}

function finishFocusMini() {
  const result = concludeActiveFocusTopic()
  if (!result.ok) {
    alert(result.message)
    return
  }

  alert(result.message)
  updateTopicoHeader()
  updateFocusMiniBar()
}

function renderTopicoPage() {
  document.title = `ENEM · ${getTopicoTitulo()}`
  const state = getTopicRichState(topicoMateriaKey, topicoKeyId)
  const statusMeta = getTopicStatusMeta(state)

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
          <div class="topico-title">${escapeHtml(getTopicoTitulo())}</div>
          <div class="topico-desc">${escapeHtml(getTopicoDescricao())}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
            <span class="learning-status ${statusMeta.className}" id="topic-status-chip">${statusMeta.label}</span>
            <span class="learning-status ${statusMeta.className}" id="topic-difficulty-chip">${formatDifficultyText(state.difficulty)}</span>
          </div>
        </div>
        <div class="topico-actions">
          <button class="btn btn-sm ${isTopicoAtualFeito() ? 'btn-accent' : ''}" id="topico-check-btn" onclick="toggleTopicoDone()">
            <i data-lucide="${isTopicoAtualFeito() ? 'check-circle-2' : 'circle'}" style="width:14px;height:14px;"></i>
            ${isTopicoAtualFeito() ? 'Concluido' : 'Marcar como feito'}
          </button>
          <button class="btn btn-sm btn-accent" onclick="startTopicoFocus()">
            <i data-lucide="play" style="width:13px;height:13px;"></i> Iniciar sessao
          </button>
          <button class="btn btn-sm" onclick="exportTopicoMarkdown()">
            <i data-lucide="download" style="width:13px;height:13px;"></i> Exportar .md
          </button>
        </div>
      </section>

      <section class="topico-stats">
        <div class="tstat">
          <div class="tstat-lbl">Tempo estudado</div>
          <div class="tstat-val" id="tempo-topico-val">${formatTempo(getTempo(topicoMateriaKey, topicoKeyId))}</div>
        </div>
        <div class="tstat">
          <div class="tstat-lbl">Dificuldade</div>
          <div class="tstat-val" id="dificuldade-topico-val">${formatDificuldadeLabel(getTopicoDificuldade())}</div>
        </div>
        <div class="tstat">
          <div class="tstat-lbl">Dominio</div>
          <div class="tstat-val" id="topic-mastery-val">${renderMasteryMeter(state.mastery)}</div>
        </div>
        <div class="tstat">
          <div class="tstat-lbl">Progresso da materia</div>
          <div class="tstat-val" id="progresso-materia-val">${getProgressoMateria(topicoMateriaKey).pct}%</div>
        </div>
      </section>

      <div class="personal-tip" id="topic-suggestion">
        <strong>Proximo passo recomendado:</strong> ${escapeHtml(getTopicSuggestionText(state))}
      </div>

      <section class="topico-card">
        <div class="tabs">
          <button class="tab ativo" data-tab="estudar" onclick="switchTopicoTab('estudar', this)">
            <i data-lucide="route"></i> Estudar
          </button>
          <button class="tab" data-tab="anotacoes" onclick="switchTopicoTab('anotacoes', this)">
            <i data-lucide="notebook-pen"></i> Anotacoes
          </button>
          <button class="tab" data-tab="videos" onclick="switchTopicoTab('videos', this)">
            <i data-lucide="youtube"></i> Videos
          </button>
          <button class="tab" data-tab="questoes" onclick="switchTopicoTab('questoes', this)">
            <i data-lucide="help-circle"></i> Questoes
          </button>
          <button class="tab" data-tab="revisoes" onclick="switchTopicoTab('revisoes', this)">
            <i data-lucide="rotate-ccw"></i> Revisoes
          </button>
          <button class="tab" data-tab="exportar" onclick="switchTopicoTab('exportar', this)">
            <i data-lucide="database"></i> Exportar
          </button>
        </div>

        <div class="tab-panel ativo" id="tab-estudar"></div>
        <div class="tab-panel" id="tab-anotacoes"></div>
        <div class="tab-panel" id="tab-videos"></div>
        <div class="tab-panel" id="tab-questoes"></div>
        <div class="tab-panel" id="tab-revisoes"></div>
        <div class="tab-panel" id="tab-exportar"></div>
      </section>
    </div>
  `

  renderStudyTab()
  renderNoteBlocks()
  renderTopicoVideos()
  renderTopicoQuestoes()
  renderReviewsTab()
  renderExportTab()
  renderFocusMiniBar()
  iniciarQuiz({
    containerId: 'practice-area',
    storageKey: TOPICO_SK.quiz,
    materiaId: topicoMateriaKey,
    conteudoId: conteudo.id,
    habilidadeId: habilidade.id,
  })
  setNavActive()
  updateMasteryButtons()
  lucide.createIcons()
}

function renderMasteryMeter(value) {
  const mastery = Math.max(0, Math.min(100, Number(value || 0)))
  return `
    <div class="mastery-meter">
      <strong>${mastery}%</strong>
      <div class="mastery-bar"><span style="width:${mastery}%"></span></div>
    </div>
  `
}

function formatDifficultyText(value) {
  const map = {
    nao_avaliado: 'Dificuldade nao avaliada',
    baixa: 'Dificuldade baixa',
    media: 'Dificuldade media',
    alta: 'Dificuldade alta',
    critica: 'Dificuldade critica',
  }
  return map[value] || map.nao_avaliado
}

function renderStudyTab() {
  const state = getTopicRichState(topicoMateriaKey, topicoKeyId)
  const tab = document.getElementById('tab-estudar')
  if (!tab) return

  tab.innerHTML = `
    <section class="study-flow">
      <div class="study-main">
        <p class="note-kicker">Sessao recomendada</p>
        <h3>O que fazer agora neste topico</h3>
        <div class="study-steps">
          ${getStudySteps(state).map((step, index) => `
            <div class="study-step">
              <span>${index + 1}</span>
              <div>
                <strong>${escapeHtml(step.title)}</strong>
                <small>${escapeHtml(step.text)}</small>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <aside class="study-side">
        <p class="note-kicker">Painel rapido</p>
        <h3>Registrar agora</h3>
        <div class="quick-actions-grid">
          <button class="btn btn-sm btn-accent" onclick="startTopicoFocus()">
            <i data-lucide="play" style="width:13px;height:13px;"></i> Iniciar sessao
          </button>
          <button class="btn btn-sm" onclick="addNoteBlock('duvida')">Nova duvida</button>
          <button class="btn btn-sm" onclick="addNoteBlock('erro')">Registrar erro</button>
          <button class="btn btn-sm" onclick="switchTopicoTab('questoes', document.querySelector('[data-tab=questoes]'))">Adicionar questao</button>
        </div>
        <label class="note-kicker" style="display:block;margin-top:16px;">Termometro</label>
        <select class="difficulty-select" onchange="setTopicDifficultyFromSelect(this.value)">
          ${['nao_avaliado','baixa','media','alta','critica'].map(value => `
            <option value="${value}" ${state.difficulty === value ? 'selected' : ''}>${formatDifficultyText(value)}</option>
          `).join('')}
        </select>
      </aside>
    </section>
  `
}

function getStudySteps(state) {
  if (state.reviews.some(review => review.status === 'pendente' && new Date(review.dueAt) <= new Date())) {
    return [
      { title: 'Resolva as revisoes pendentes', text: 'Antes de conteudo novo, feche o que o sistema ja marcou para revisao.' },
      { title: 'Releia erros e duvidas', text: 'Procure padroes: conceito, interpretacao, calculo ou falta de atencao.' },
      { title: 'Atualize seu dominio', text: 'Marque dificuldade e dominio para a rota se recalcular.' },
    ]
  }

  if (!state.notes.length && !state.videos.length) {
    return [
      { title: 'Comece por teoria curta', text: 'Assista uma revisao ou crie um resumo de 3 linhas.' },
      { title: 'Anote uma duvida ou regra', text: 'Registre o que pode virar revisao futura.' },
      { title: 'Teste com questoes', text: 'Depois da teoria, resolva pelo menos uma questao do topico.' },
    ]
  }

  if (state.notes.length && !state.questions.length) {
    return [
      { title: 'Faca questoes', text: 'Voce ja anotou teoria. Agora teste aplicacao.' },
      { title: 'Registre erro com motivo', text: 'Se errar, marque se foi conteudo, interpretacao, calculo ou conceito.' },
      { title: 'Gere revisao dos pontos fracos', text: 'Duvidas, formulas e erros podem virar revisoes.' },
    ]
  }

  return [
    { title: 'Revise o que salvou', text: 'Leia resumo, erros e questoes importantes.' },
    { title: 'Corrija o ponto mais fraco', text: 'Use a aba questoes ou videos para atacar a dificuldade.' },
    { title: 'Conclua ou agende revisao', text: 'Se ainda estiver fraco, marque dificuldade alta para voltar depois.' },
  ]
}

function refreshTopicLearningUI() {
  const state = getTopicRichState(topicoMateriaKey, topicoKeyId)
  const statusMeta = getTopicStatusMeta(state)
  const statusChip = document.getElementById('topic-status-chip')
  const diffChip = document.getElementById('topic-difficulty-chip')
  const mastery = document.getElementById('topic-mastery-val')
  const suggestion = document.getElementById('topic-suggestion')

  if (statusChip) {
    statusChip.className = `learning-status ${statusMeta.className}`
    statusChip.textContent = statusMeta.label
  }
  if (diffChip) {
    diffChip.className = `learning-status ${statusMeta.className}`
    diffChip.textContent = formatDifficultyText(state.difficulty)
  }
  if (mastery) mastery.innerHTML = renderMasteryMeter(state.mastery)
  if (suggestion) suggestion.innerHTML = `<strong>Proximo passo recomendado:</strong> ${escapeHtml(getTopicSuggestionText(state))}`
}

function setTopicDifficultyFromSelect(value) {
  setTopicLearningDifficulty(topicoMateriaKey, topicoKeyId, value)
  refreshTopicLearningUI()
  renderStudyTab()
  updateTopicoHeader()
  lucide.createIcons()
}

function getTopicoVideos() {
  const state = getTopicRichState(topicoMateriaKey, topicoKeyId)
  if (state.videos.length) return state.videos

  const legacy = store.get(TOPICO_SK.videos) || []
  if (legacy.length) {
    const migrated = legacy.map(video => ({
      id: createTopicEntityId('video'),
      videoId: video.videoId || video.id,
      url: video.url || `https://youtu.be/${video.id}`,
      title: video.title || video.titulo || 'Video salvo',
      type: video.type || 'videoaula',
      notes: video.notes || [],
      createdAt: video.createdAt || new Date().toISOString(),
    }))
    saveTopicoVideos(migrated)
    return migrated
  }

  return []
}

function saveTopicoVideos(videos) {
  saveTopicRichState(topicoMateriaKey, topicoKeyId, { videos })
  store.set(TOPICO_SK.videos, videos)
}

function getTopicoQuestoes() {
  const state = getTopicRichState(topicoMateriaKey, topicoKeyId)
  if (state.questions.length) return state.questions

  const legacy = store.get(TOPICO_SK.questoes) || []
  if (legacy.length) {
    const migrated = legacy.map(questao => ({
      id: createTopicEntityId('question'),
      statement: questao.statement || questao.enunciado || '',
      answer: questao.answer || questao.resposta || '',
      source: questao.source || 'manual',
      status: questao.status || 'nao_respondida',
      errorReason: questao.errorReason || '',
      createdAt: questao.createdAt || new Date().toISOString(),
    }))
    saveTopicoQuestoes(migrated)
    return migrated
  }

  return []
}

function saveTopicoQuestoes(questions) {
  saveTopicRichState(topicoMateriaKey, topicoKeyId, { questions })
  store.set(TOPICO_SK.questoes, questions)
}

function getNoteBlocks() {
  const state = getTopicRichState(topicoMateriaKey, topicoKeyId)
  if (state.notes.length) return normalizeNoteBlocks(state.notes)

  const legacyBlocks = store.get(getNoteBlocksKey())
  if (Array.isArray(legacyBlocks) && legacyBlocks.length) {
    const migrated = normalizeNoteBlocks(legacyBlocks)
    saveNoteBlocks(migrated)
    return migrated
  }

  const oldNote = getNotasMateria(topicoMateriaKey)[topicoKeyId] || store.get(TOPICO_SK.anotacaoLegada) || ''
  if (oldNote && oldNote.trim()) {
    const migrated = [{
      id: createNoteBlockId(),
      type: 'texto',
      title: 'Anotacao antiga',
      content: oldNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]
    saveNoteBlocks(migrated)
    return migrated
  }

  return []
}

function saveNoteBlocks(blocks) {
  const normalized = normalizeNoteBlocks(blocks)
  saveTopicRichState(topicoMateriaKey, topicoKeyId, {
    notes: normalized,
    status: normalized.length ? 'parcial' : getTopicRichState(topicoMateriaKey, topicoKeyId).status,
    mastery: Math.max(getTopicRichState(topicoMateriaKey, topicoKeyId).mastery || 0, normalized.length ? 25 : 0),
  })
  store.set(getNoteBlocksKey(), normalized)
  saveTopicoAnotacao(blocksToMarkdown(normalized))
  refreshTopicLearningUI()
}

function normalizeNoteBlocks(blocks) {
  return blocks
    .filter(block => block && typeof block === 'object')
    .map(block => {
      const type = TOPIC_NOTE_TYPE_META[block.type] ? block.type : 'texto'
      const meta = TOPIC_NOTE_TYPE_META[type]
      return {
        id: String(block.id || createNoteBlockId()),
        type,
        title: String(block.title || meta.label),
        content: String(block.content || ''),
        createdAt: block.createdAt || new Date().toISOString(),
        updatedAt: block.updatedAt || new Date().toISOString(),
      }
    })
}

function getBlockMeta(type) {
  const meta = TOPIC_NOTE_TYPE_META[type] || TOPIC_NOTE_TYPE_META.texto
  return { title: meta.label, icon: meta.icon, template: meta.template }
}

function addNoteBlock(type) {
  const meta = getBlockMeta(type)
  const block = {
    id: createNoteBlockId(),
    type: TOPIC_NOTE_TYPE_META[type] ? type : 'texto',
    title: meta.title,
    content: meta.template,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  saveNoteBlocks([block, ...getNoteBlocks()])
  selectedNoteId = block.id
  renderNoteBlocks()
  renderStudyTab()
  markTopicoSaved()

  setTimeout(() => {
    const editor = document.querySelector('.note-content-textarea')
    if (editor) {
      editor.focus()
      editor.setSelectionRange(editor.value.length, editor.value.length)
    }
  }, 0)
}

function selectNoteBlock(id) {
  selectedNoteId = id
  renderNoteBlocks()
}

function updateNoteBlock(id, patchOrContent) {
  const patch = typeof patchOrContent === 'object'
    ? patchOrContent
    : { content: String(patchOrContent || '') }

  const blocks = getNoteBlocks().map(block => {
    if (block.id !== id) return block
    return { ...block, ...patch, updatedAt: new Date().toISOString() }
  })

  saveNoteBlocks(blocks)
  markTopicoSaved()
}

function removeNoteBlock(id) {
  if (!confirm('Remover este bloco?')) return
  const blocks = getNoteBlocks().filter(block => block.id !== id)
  selectedNoteId = blocks[0]?.id || null
  saveNoteBlocks(blocks)
  renderNoteBlocks()
  renderReviewsTab()
}

function moveNoteBlock(id, direction) {
  const blocks = getNoteBlocks()
  const index = blocks.findIndex(block => block.id === id)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return
  const current = blocks[index]
  blocks[index] = blocks[nextIndex]
  blocks[nextIndex] = current
  saveNoteBlocks(blocks)
  renderNoteBlocks()
}

function makeReviewFromNote(id) {
  const review = createReviewFromTopicNote(topicoMateriaKey, topicoKeyId, id)
  if (!review) return
  markTopicoSaved('revisao criada')
  renderReviewsTab()
  refreshTopicLearningUI()
}

function renderNoteBlocks() {
  const container = document.getElementById('tab-anotacoes')
  if (!container) return

  const blocks = getNoteBlocks()
  if (!selectedNoteId && blocks.length) selectedNoteId = blocks[0].id
  const selected = blocks.find(block => block.id === selectedNoteId)

  container.innerHTML = `
    <section class="notes-workspace">
      <aside class="notes-sidebar">
        <div class="notes-actions">
          ${Object.entries(TOPIC_NOTE_TYPE_META).map(([type, meta]) => `
            <button class="note-type-btn" onclick="addNoteBlock('${type}')">
              <i data-lucide="${meta.icon}" style="width:13px;height:13px;"></i>
              ${meta.label}
            </button>
          `).join('')}
        </div>
        <div class="notes-list">
          ${blocks.length ? blocks.map(block => {
            const meta = getBlockMeta(block.type)
            return `
              <button class="note-list-item ${block.id === selectedNoteId ? 'active' : ''}" onclick="selectNoteBlock('${escapeJsString(block.id)}')">
                <strong><i data-lucide="${meta.icon}" style="width:12px;height:12px;"></i> ${escapeHtml(block.title || meta.title)}</strong>
                <small>${escapeHtml(getPreview(block.content))}</small>
              </button>
            `
          }).join('') : `
            <div class="note-empty-state">
              <strong>Nenhuma anotacao ainda.</strong>
              Crie um resumo, duvida ou erro para comecar.
            </div>
          `}
        </div>
      </aside>

      <main class="note-editor-panel">
        ${selected ? `
          <div class="note-editor-header">
            <input class="note-title-input" value="${escapeHtmlForAttr(selected.title)}" oninput="updateNoteBlock('${escapeJsString(selected.id)}', { title: this.value })" />
            <button class="btn btn-sm" onclick="makeReviewFromNote('${escapeJsString(selected.id)}')">Virar revisao</button>
            <button class="btn btn-sm" onclick="moveNoteBlock('${escapeJsString(selected.id)}', -1)" title="Mover para cima">
              <i data-lucide="chevron-up" style="width:13px;height:13px;"></i>
            </button>
            <button class="btn btn-sm" onclick="moveNoteBlock('${escapeJsString(selected.id)}', 1)" title="Mover para baixo">
              <i data-lucide="chevron-down" style="width:13px;height:13px;"></i>
            </button>
            <button class="btn btn-sm" onclick="removeNoteBlock('${escapeJsString(selected.id)}')">Excluir</button>
          </div>
          <textarea class="note-content-textarea" oninput="updateNoteBlock('${escapeJsString(selected.id)}', { content: this.value })">${escapeHtmlForTextarea(selected.content)}</textarea>
        ` : `
          <div class="empty-editor">Escolha ou crie um bloco de anotacao.</div>
        `}
      </main>
    </section>
    <div class="save-status" id="save-status-topico" style="margin-top:8px;"></div>
  `
  lucide.createIcons()
}

function getPreview(text = '') {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  return clean.length > 80 ? clean.slice(0, 80) + '...' : clean || 'Sem conteudo'
}

async function addTopicoVideo() {
  const input = document.getElementById('video-url')
  const typeInput = document.getElementById('video-type')
  const url = input?.value.trim()
  if (!url) return

  const id = ytId(url)
  if (!id) {
    alert('Link do YouTube invalido.')
    return
  }

  const video = {
    id: createTopicEntityId('video'),
    videoId: id,
    url,
    title: await ytTitle(id),
    type: typeInput?.value || 'videoaula',
    notes: [],
    createdAt: new Date().toISOString(),
  }

  saveTopicoVideos([video, ...getTopicoVideos()])
  selectedVideoId = video.id
  if (input) input.value = ''
  renderTopicoVideos()
  refreshTopicLearningUI()
}

function renderTopicoVideos() {
  const container = document.getElementById('tab-videos')
  if (!container) return

  const videos = getTopicoVideos()
  if (!selectedVideoId && videos.length) selectedVideoId = videos[0].id
  const selected = videos.find(video => video.id === selectedVideoId)

  container.innerHTML = `
    <div class="video-add-row">
      <input class="video-input" type="text" id="video-url" placeholder="Cole um link do YouTube..." />
      <select id="video-type">
        <option value="videoaula">Videoaula</option>
        <option value="revisao">Revisao rapida</option>
        <option value="questao">Resolucao de questao</option>
        <option value="aprofundamento">Aprofundamento</option>
      </select>
      <button class="btn btn-accent btn-sm" onclick="addTopicoVideo()">Salvar video</button>
    </div>

    ${selected ? `
      <section class="video-study-layout">
        <main class="video-player-card">
          <iframe src="https://www.youtube.com/embed/${selected.videoId}" allowfullscreen></iframe>
        </main>
        <aside class="quick-video-notes">
          <p class="note-kicker">Anotacao rapida</p>
          <h3>Enquanto assiste</h3>
          <textarea id="quick-video-note" placeholder="Ex: nao entendi a diferenca entre escala grafica e numerica..."></textarea>
          <div class="quick-actions-grid">
            <button class="btn btn-sm" onclick="saveVideoQuickNote('resumo')">Salvar como resumo</button>
            <button class="btn btn-sm" onclick="saveVideoQuickNote('duvida')">Salvar como duvida</button>
            <button class="btn btn-sm" onclick="saveVideoQuickNote('erro')">Salvar como erro</button>
          </div>
        </aside>
      </section>
    ` : `
      <div class="empty-state">Nenhum video salvo nesse topico ainda.</div>
    `}

    <div class="video-list">
      ${videos.map(video => `
        <button class="video-list-item ${video.id === selectedVideoId ? 'active' : ''}" onclick="selectVideo('${escapeJsString(video.id)}')">
          <strong>${escapeHtml(video.title || 'Video salvo')}</strong>
          <small>${formatVideoType(video.type)}</small>
        </button>
      `).join('')}
    </div>
  `
  lucide.createIcons()
}

function selectVideo(id) {
  selectedVideoId = id
  renderTopicoVideos()
}

function saveVideoQuickNote(type) {
  const textarea = document.getElementById('quick-video-note')
  const content = textarea?.value.trim()
  if (!content) return

  const meta = getBlockMeta(type)
  const block = {
    id: createNoteBlockId(),
    type,
    title: `Video - ${meta.title}`,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  saveNoteBlocks([block, ...getNoteBlocks()])
  selectedNoteId = block.id
  textarea.value = ''
  markTopicoSaved('anotacao criada')
  renderNoteBlocks()
  refreshTopicLearningUI()
}

function formatVideoType(type) {
  const map = {
    videoaula: 'Videoaula',
    revisao: 'Revisao rapida',
    questao: 'Resolucao de questao',
    aprofundamento: 'Aprofundamento',
  }
  return map[type] || 'Video'
}

function removeTopicoVideo(index) {
  const videos = getTopicoVideos()
  videos.splice(index, 1)
  saveTopicoVideos(videos)
  selectedVideoId = videos[0]?.id || null
  renderTopicoVideos()
}

function addTopicoQuestao() {
  const statement = document.getElementById('questao-enunciado')?.value.trim()
  const answer = document.getElementById('questao-resposta')?.value.trim()
  const source = document.getElementById('questao-fonte')?.value.trim()
  const status = document.getElementById('questao-status')?.value || 'nao_respondida'
  const errorReason = document.getElementById('questao-erro')?.value || ''
  if (!statement) return

  const state = getTopicRichState(topicoMateriaKey, topicoKeyId)
  const question = {
    id: createTopicEntityId('question'),
    statement,
    answer,
    source: source || 'manual',
    status,
    errorReason,
    createdAt: new Date().toISOString(),
  }

  const patch = {
    questions: [question, ...getTopicoQuestoes()],
    status: 'parcial',
    mastery: Math.min(100, Math.max(Number(state.mastery || 0), status === 'acertei' ? Number(state.mastery || 0) + 10 : Number(state.mastery || 0))),
  }

  if (status === 'errei') {
    patch.difficulty = increaseTopicDifficulty(state.difficulty)
    patch.mastery = Math.max(10, Number(state.mastery || 0) - 15)
    patch.status = 'dificuldade'
    patch.dificuldadeDoUsuario = 3
    patch.erros = Number(state.erros || 0) + 1
    patch.proximaRevisao = addDaysISO(3)
    patch.nextReviewAt = patch.proximaRevisao
  } else if (status === 'acertei') {
    patch.acertos = Number(state.acertos || 0) + 1
  }

  saveTopicRichState(topicoMateriaKey, topicoKeyId, patch)
  store.set(TOPICO_SK.questoes, patch.questions)
  renderTopicoQuestoes()
  iniciarQuiz({
    containerId: 'practice-area',
    storageKey: TOPICO_SK.quiz,
    materiaId: topicoMateriaKey,
    conteudoId: conteudo.id,
    habilidadeId: habilidade.id,
  })
  renderStudyTab()
  refreshTopicLearningUI()
}

function renderTopicoQuestoes() {
  const container = document.getElementById('tab-questoes')
  if (!container) return
  const questions = getTopicoQuestoes()

  container.innerHTML = `
    <div id="practice-area"></div>
    <section class="question-form-card">
      <p class="note-kicker">Caderno de erros</p>
      <h3>Adicionar questao importante</h3>
      <textarea id="questao-enunciado" placeholder="Enunciado da questao..."></textarea>
      <textarea id="questao-resposta" placeholder="Resposta, comentario ou resolucao..."></textarea>
      <div class="question-grid">
        <input id="questao-fonte" placeholder="Fonte: ENEM 2021, simulado..." />
        <select id="questao-status">
          <option value="nao_respondida">Nao respondida</option>
          <option value="acertei">Acertei</option>
          <option value="errei">Errei</option>
          <option value="chutei">Acertei chutando</option>
        </select>
        <select id="questao-erro">
          <option value="">Motivo do erro</option>
          ${Object.entries(QUESTION_ERROR_REASON_LABELS).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-accent btn-sm" onclick="addTopicoQuestao()">Adicionar questao</button>
    </section>

    <section class="questions-list">
      ${questions.length ? questions.map(question => `
        <article class="question-card ${question.status || ''}">
          <div class="question-card-header">
            <strong>${getQuestionStatusLabel(question.status)}</strong>
            <span>${escapeHtml(question.source || 'manual')}${question.errorReason ? ' · ' + QUESTION_ERROR_REASON_LABELS[question.errorReason] : ''}</span>
          </div>
          <p class="questao-enunciado">${escapeHtml(question.statement || '').replace(/\n/g, '<br>')}</p>
          ${question.answer ? `<small style="color:var(--text2);line-height:1.6;">${escapeHtml(question.answer).replace(/\n/g, '<br>')}</small>` : ''}
        </article>
      `).join('') : '<div class="empty-state">Nenhuma questao salva ainda.</div>'}
    </section>
  `
}

function renderReviewsTab() {
  const container = document.getElementById('tab-revisoes')
  if (!container) return
  const state = getTopicRichState(topicoMateriaKey, topicoKeyId)
  const now = new Date()

  container.innerHTML = `
    <section class="reviews-list">
      ${state.reviews.length ? state.reviews.map(review => {
        const isDue = review.status === 'pendente' && new Date(review.dueAt) <= now
        return `
          <article class="review-card ${isDue ? 'due' : ''}">
            <div>
              <strong>${escapeHtml(review.question)}</strong>
              <small>${isDue ? 'Revisao pendente' : review.status === 'pendente' ? 'Agendada para ' + formatShortDate(review.dueAt) : 'Resolvida'}</small>
            </div>
            ${review.status === 'pendente' ? `
              <div class="review-actions">
                <button class="btn btn-sm" onclick="resolveReviewUI('${escapeJsString(review.id)}', 'success')">Lembrei</button>
                <button class="btn btn-sm" onclick="resolveReviewUI('${escapeJsString(review.id)}', 'fail')">Errei</button>
                <button class="btn btn-sm" onclick="deleteReviewUI('${escapeJsString(review.id)}')">Remover</button>
              </div>
            ` : `
              <div class="review-actions">
                <button class="btn btn-sm" onclick="deleteReviewUI('${escapeJsString(review.id)}')">Remover</button>
              </div>
            `}
          </article>
        `
      }).join('') : `
        <div class="empty-state">Nenhuma revisao gerada ainda. Transforme duvidas, formulas e erros em revisao.</div>
      `}
    </section>
  `
}

function resolveReviewUI(id, result) {
  resolveTopicReview(topicoMateriaKey, topicoKeyId, id, result)
  renderReviewsTab()
  refreshTopicLearningUI()
  renderStudyTab()
}

function deleteReviewUI(id) {
  if (!confirm('Remover esta revisao?')) return
  deleteTopicReview(topicoMateriaKey, topicoKeyId, id)
  renderReviewsTab()
  refreshTopicLearningUI()
  renderStudyTab()
  markTopicoSaved('revisao removida')
}

function renderExportTab() {
  const container = document.getElementById('tab-exportar')
  if (!container) return
  container.innerHTML = `
    <div class="obsidian-section" style="padding-top:16px;">
      <div class="obsidian-box">
        <h3>Exportar nota bonita</h3>
        <p>Gera um Markdown com resumo, formulas, duvidas, erros, videos, questoes e revisoes.</p>
        <button class="btn btn-accent btn-sm" onclick="exportTopicoMarkdown()">Baixar .md</button>
      </div>
      <div class="obsidian-box">
        <h3>Obsidian</h3>
        <p>Use exportar/importar ou abra via obsidian:// sem depender de sincronizacao local.</p>
        <div class="obsidian-vault-row">
          <input class="video-input" type="text" id="vault-name" value="${escapeHtmlForAttr(getVaultName())}" placeholder="Ex: ENEM-Study" />
          <button class="btn btn-sm" onclick="saveTopicoVault()">Salvar vault</button>
          <button class="btn btn-sm" onclick="openObsidianNote()">Abrir</button>
        </div>
      </div>
      <div class="obsidian-box">
        <h3>Importar .md ou texto</h3>
        <p>Cole uma nota pronta para virar bloco de texto neste topico.</p>
        <textarea class="obsidian-import-area" id="obsidian-import" placeholder="Cole o conteudo da nota aqui..."></textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
          <button class="btn btn-sm btn-accent" onclick="importFromObsidian()">Importar</button>
          <button class="btn btn-sm" onclick="document.getElementById('obsidian-import').value=''">Limpar</button>
        </div>
      </div>
    </div>
  `
}

function formatShortDate(iso) {
  if (!iso) return '--'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function buildTopicoMarkdown() {
  const videos = getTopicoVideos()
  const questoes = getTopicoQuestoes()
  const state = getTopicRichState(topicoMateriaKey, topicoKeyId)
  const anotacao = getTopicoAnotacao()
  const tempo = getTempo(topicoMateriaKey, topicoKeyId)

  let md = `---\n`
  md += `materia: "${topicoMateria.nome}"\n`
  md += `conteudo: "${conteudo.nome}"\n`
  md += `topico: "${getTopicoTitulo()}"\n`
  md += `id: "${topicoKeyId}"\n`
  md += `concluido: ${isTopicoAtualFeito()}\n`
  md += `tempo_estudado: "${formatTempo(tempo)}"\n`
  md += `dominio: ${state.mastery || 0}\n`
  md += `dificuldade: "${state.difficulty || 'nao_avaliado'}"\n`
  md += `---\n\n`
  md += `# ${getTopicoTitulo()}\n\n`
  md += `## Resumo e anotacoes\n\n${anotacao || 'Sem anotacoes ainda.'}\n\n`

  if (videos.length) {
    md += `## Videos salvos\n\n`
    videos.forEach(video => {
      md += `- [${video.title || video.titulo || 'Video salvo'}](${video.url})${video.type ? ` - ${formatVideoType(video.type)}` : ''}\n`
    })
    md += '\n'
  }

  if (questoes.length) {
    md += `## Questoes importantes\n\n`
    questoes.forEach((questao, index) => {
      md += `### Questao ${index + 1}\n\n`
      md += `${questao.statement || questao.enunciado || ''}\n\n`
      md += `**Status:** ${getQuestionStatusLabel(questao.status)}\n\n`
      if (questao.errorReason) md += `**Motivo do erro:** ${QUESTION_ERROR_REASON_LABELS[questao.errorReason] || questao.errorReason}\n\n`
      if (questao.answer || questao.resposta) md += `**Resposta:** ${questao.answer || questao.resposta}\n\n`
    })
  }

  if (state.reviews.length) {
    md += `## Revisoes geradas\n\n`
    state.reviews.forEach(review => {
      md += `- ${review.question} (${review.status || 'pendente'} - ${formatShortDate(review.dueAt)})\n`
    })
    md += '\n'
  }

  return md
}

function setDifficulty(value) {
  const current = getTopicoDificuldade()
  const next = current === value ? 0 : value
  const map = { 0: 'nao_avaliado', 1: 'alta', 2: 'media', 3: 'baixa' }
  setTopicLearningDifficulty(topicoMateriaKey, topicoKeyId, map[next] || 'nao_avaliado')
  updateTopicoHeader()
  refreshTopicLearningUI()
  renderStudyTab()
  updateMasteryButtons()
}

function updateTopicoHeader() {
  const button = document.getElementById('topico-check-btn')
  const tempoEl = document.getElementById('tempo-topico-val')
  const difEl = document.getElementById('dificuldade-topico-val')
  const progressoEl = document.getElementById('progresso-materia-val')
  if (button) {
    button.className = `btn btn-sm ${isTopicoAtualFeito() ? 'btn-accent' : ''}`
    button.innerHTML = `<i data-lucide="${isTopicoAtualFeito() ? 'check-circle-2' : 'circle'}" style="width:14px;height:14px;"></i> ${isTopicoAtualFeito() ? 'Concluido' : 'Marcar como feito'}`
  }
  if (tempoEl) tempoEl.textContent = formatTempo(getTempo(topicoMateriaKey, topicoKeyId))
  if (difEl) difEl.innerHTML = formatDificuldadeLabel(getTopicoDificuldade())
  if (progressoEl) progressoEl.textContent = `${getProgressoMateria(topicoMateriaKey).pct}%`
  refreshTopicLearningUI()
  lucide.createIcons()
}

window.addEventListener('beforeunload', () => {
  clearInterval(focusMiniInterval)
})

document.addEventListener('DOMContentLoaded', renderTopicoPage)
