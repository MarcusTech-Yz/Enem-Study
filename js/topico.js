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

function renderTopicoPage() {
  document.title = `ENEM · ${getTopicoTitulo()}`
  const formatoAcao = getFormatoPreferidoAction()

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
  setTopicoDificuldade(current === value ? 0 : value)
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

window.addEventListener('beforeunload', () => {
  clearInterval(focusMiniInterval)
})

document.addEventListener('DOMContentLoaded', renderTopicoPage)
