// ── topico.js ──
// Página do "universo" de um tópico

const _params  = new URLSearchParams(window.location.search)
const topicoId = _params.get('id')
const ctx      = topicoId ? getTopicoById(topicoId) : null

if (!ctx) {
  window.location.href = 'materias.html'
}

const { materiaKey, materia, topico, idx: topicoIdx } = ctx

// ── Markdown renderer (simples e seguro) ───────────────
function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderMarkdown(md) {
  if (!md) return '<p class="md-empty">Nada escrito ainda. Comece a digitar ao lado →</p>'
  let html = escapeHtml(md)

  // code blocks
  html = html.replace(/```([\s\S]*?)```/g, (_, c) => `<pre><code>${c}</code></pre>`)
  // inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  // headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
  // blockquote
  html = html.replace(/^&gt;\s?(.+)$/gm, '<blockquote>$1</blockquote>')
  // bold / italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')
  // links [t](u)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  // images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
  // ul
  html = html.replace(/^(?:- |\* )(.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, m => '<ul>' + m + '</ul>')
  // paragraphs (quebra dupla)
  html = html.split(/\n{2,}/).map(block => {
    if (/^\s*<(h\d|ul|ol|pre|blockquote|img)/.test(block.trim())) return block
    return '<p>' + block.replace(/\n/g, '<br>') + '</p>'
  }).join('\n')

  return html
}

// ── Página ─────────────────────────────────────────────
function renderPage() {
  const uni = getUniverso(topicoId)
  document.title = `ENEM · ${topico.titulo}`

  document.getElementById('main-content').innerHTML = `
    <a class="back-link" href="materia.html?m=${materiaKey}">← ${materia.nome}</a>

    <div class="page-header">
      <p class="date-tag">
        <i data-lucide="${materia.icone}" style="width:14px;height:14px;display:inline-block;margin-right:4px;vertical-align:text-bottom;"></i>
        ${materia.nome} · Tópico
      </p>
      <h1 style="font-size:26px;">${topico.emoji || '📘'} ${topico.titulo}</h1>
      <p style="color:var(--text3);font-size:12px;margin-top:8px;font-family:var(--mono);">
        id: ${topico.id}${uni.ultimaRevisao ? ' · última revisão: ' + uni.ultimaRevisao.slice(0,10) : ''}
      </p>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1.5rem;">
      <button class="btn btn-accent btn-sm" onclick="abrirObsidian()">
        <i data-lucide="external-link" style="width:13px;height:13px;vertical-align:-2px;"></i>
        Abrir no Obsidian
      </button>
      <button class="btn btn-sm" onclick="exportarTopicoMd()">⬇ Exportar .md</button>
      <button class="btn btn-sm" onclick="toggleImport()">📥 Importar do Obsidian</button>
      <button class="btn btn-sm" onclick="marcarRevisao()">✓ Marcar revisão</button>
    </div>

    <div id="import-box" class="import-box" style="display:none;">
      <p style="font-size:12px;color:var(--text3);margin-bottom:8px;">
        Cole o conteúdo Markdown do Obsidian aqui. Suas anotações serão substituídas.
      </p>
      <textarea id="import-text" class="anotacao-area" style="min-height:140px;" placeholder="--- &#10;title: ... &#10;--- &#10;Cole o markdown aqui..."></textarea>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-accent btn-sm" onclick="importarObsidian()">Importar</button>
        <button class="btn btn-sm" onclick="toggleImport()">Cancelar</button>
      </div>
    </div>

    <!-- Pomodoro -->
    <div class="section-header">
      <p class="section-title"><i data-lucide="timer" style="width:14px;height:14px;vertical-align:-2px;"></i> Pomodoro deste tópico</p>
      <span style="font-size:11px;color:var(--text3);" id="tempo-total-txt">Total estudado: ${formatTempo(getTempo(materiaKey, topicoIdx))}</span>
    </div>
    <div class="pomodoro-box">
      <div class="pomo-display" id="pomo-display">25:00</div>
      <div class="pomo-mode" id="pomo-mode">Foco</div>
      <div class="pomo-controls">
        <button class="btn btn-accent btn-sm" id="pomo-start" onclick="pomoStart()">▶ Iniciar</button>
        <button class="btn btn-sm" id="pomo-pause" onclick="pomoPause()" disabled>⏸ Pausar</button>
        <button class="btn btn-sm" onclick="pomoReset()">↺ Resetar</button>
        <select class="pomo-select" id="pomo-min" onchange="pomoChangeMin()">
          <option value="15">15 min</option>
          <option value="25" selected>25 min</option>
          <option value="45">45 min</option>
          <option value="50">50 min</option>
        </select>
      </div>
    </div>

    <hr class="divider" />

    <!-- Anotações Markdown -->
    <div class="section-header">
      <p class="section-title"><i data-lucide="notebook-pen" style="width:14px;height:14px;vertical-align:-2px;"></i> Anotações (Markdown)</p>
      <span style="font-size:11px;color:var(--text3);" id="save-status"></span>
    </div>
    <div class="md-editor">
      <textarea id="anotacao" class="anotacao-area md-textarea" placeholder="# Título&#10;&#10;Suas anotações em **Markdown**...&#10;&#10;- item&#10;- item&#10;&#10;$$ formula $$">${uni.anotacoes.replace(/</g,'&lt;')}</textarea>
      <div id="md-preview" class="md-preview">${renderMarkdown(uni.anotacoes)}</div>
    </div>

    <hr class="divider" />

    <!-- Vídeos -->
    <div class="section-header">
      <p class="section-title"><i data-lucide="youtube" style="width:14px;height:14px;vertical-align:-2px;"></i> Vídeos salvos</p>
      <span style="font-size:11px;color:var(--text3);" id="video-count">${uni.videos.length} vídeo(s)</span>
    </div>
    <div class="video-add">
      <input type="text" id="video-titulo" placeholder="Título (opcional)" class="video-input" />
      <input type="text" id="video-url" placeholder="Cole o link do YouTube..." class="video-input" />
      <button class="btn btn-accent btn-sm" onclick="salvarVideo()">+ Salvar</button>
    </div>
    <div class="videos-grid" id="videos-grid"></div>

    <hr class="divider" />

    <!-- Questões -->
    <div class="section-header">
      <p class="section-title"><i data-lucide="help-circle" style="width:14px;height:14px;vertical-align:-2px;"></i> Minhas questões</p>
      <span style="font-size:11px;color:var(--text3);" id="q-count">${uni.questoes.length} questão(ões)</span>
    </div>
    <div class="questao-add">
      <textarea id="q-enunciado" placeholder="Enunciado da questão..." class="anotacao-area" style="min-height:80px;"></textarea>
      <textarea id="q-resposta" placeholder="Resposta / resolução / comentário..." class="anotacao-area" style="min-height:60px;margin-top:6px;"></textarea>
      <button class="btn btn-accent btn-sm" style="margin-top:6px;" onclick="salvarQuestao()">+ Adicionar questão</button>
    </div>
    <div class="questoes-list" id="questoes-list"></div>
  `

  renderVideos()
  renderQuestoes()
  setupListeners()
  pomoInit()
  lucide.createIcons()
}

// ── Anotações (autosave + preview) ─────────────────────
let saveTimer = null
function setupListeners() {
  const ta = document.getElementById('anotacao')
  const pv = document.getElementById('md-preview')
  if (ta) {
    ta.addEventListener('input', () => {
      pv.innerHTML = renderMarkdown(ta.value)
      clearTimeout(saveTimer)
      const s = document.getElementById('save-status')
      if (s) s.textContent = 'salvando...'
      saveTimer = setTimeout(() => {
        saveUniverso(topicoId, { anotacoes: ta.value })
        if (s) { s.textContent = 'salvo ✓'; setTimeout(()=>{ if(s) s.textContent=''}, 1500) }
      }, 600)
    })
  }
}

// ── Vídeos ─────────────────────────────────────────────
function salvarVideo() {
  const t = document.getElementById('video-titulo').value.trim()
  const u = document.getElementById('video-url').value.trim()
  if (!u) return alert('Cole a URL do YouTube.')
  const v = addVideo(topicoId, t, u)
  if (!v) return alert('URL do YouTube inválida.')
  document.getElementById('video-titulo').value = ''
  document.getElementById('video-url').value = ''
  renderVideos()
}

function renderVideos() {
  const uni = getUniverso(topicoId)
  const grid = document.getElementById('videos-grid')
  const count = document.getElementById('video-count')
  if (count) count.textContent = `${uni.videos.length} vídeo(s)`
  if (!grid) return
  if (uni.videos.length === 0) {
    grid.innerHTML = '<p style="color:var(--text3);font-size:12px;">Nenhum vídeo salvo ainda.</p>'
    return
  }
  grid.innerHTML = uni.videos.map(v => `
    <div class="video-card">
      <div class="video-embed">
        <iframe src="https://www.youtube.com/embed/${v.videoId}" frameborder="0" allowfullscreen></iframe>
      </div>
      <div class="video-meta">
        <span class="video-title" title="${v.titulo}">${v.titulo}</span>
        <button class="video-del" onclick="deletarVideo('${v.id}')" title="Remover">✕</button>
      </div>
    </div>
  `).join('')
}

function deletarVideo(vid) {
  if (!confirm('Remover este vídeo?')) return
  removeVideo(topicoId, vid)
  renderVideos()
}

// ── Questões ───────────────────────────────────────────
function salvarQuestao() {
  const e = document.getElementById('q-enunciado').value.trim()
  const r = document.getElementById('q-resposta').value.trim()
  if (!e) return alert('Escreva o enunciado.')
  addQuestao(topicoId, e, r)
  document.getElementById('q-enunciado').value = ''
  document.getElementById('q-resposta').value = ''
  renderQuestoes()
}

function renderQuestoes() {
  const uni = getUniverso(topicoId)
  const list = document.getElementById('questoes-list')
  const count = document.getElementById('q-count')
  if (count) count.textContent = `${uni.questoes.length} questão(ões)`
  if (!list) return
  if (uni.questoes.length === 0) {
    list.innerHTML = '<p style="color:var(--text3);font-size:12px;">Nenhuma questão salva.</p>'
    return
  }
  list.innerHTML = uni.questoes.map((q, i) => `
    <div class="questao-card">
      <div class="questao-header">
        <strong>Questão ${i+1}</strong>
        <button class="video-del" onclick="deletarQuestao('${q.id}')" title="Remover">✕</button>
      </div>
      <div class="questao-enunciado">${renderMarkdown(q.enunciado)}</div>
      ${q.resposta ? `<details class="questao-resp"><summary>Ver resposta</summary>${renderMarkdown(q.resposta)}</details>` : ''}
    </div>
  `).join('')
}

function deletarQuestao(qid) {
  if (!confirm('Remover esta questão?')) return
  removeQuestao(topicoId, qid)
  renderQuestoes()
}

// ── Obsidian ───────────────────────────────────────────
function abrirObsidian() {
  // Tenta abrir a nota usando o protocolo obsidian://
  // O usuário deve ter um vault chamado ENEM-Study (ou editável abaixo)
  const vault = localStorage.getItem('obsidian_vault') || (function(){
    const v = prompt('Nome do seu vault no Obsidian:', 'ENEM-Study')
    if (v) localStorage.setItem('obsidian_vault', v)
    return v
  })()
  if (!vault) return
  const file = `${materia.nome}/${topico.titulo}`
  const uri = `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(file)}`
  window.location.href = uri
}

function exportarTopicoMd() {
  const uni = getUniverso(topicoId)
  const today = new Date().toISOString().slice(0, 10)
  const dific = getDificuldades(materiaKey)[topicoIdx] || 0
  const feitos = getTopicosFeitos(materiaKey)
  const lines = []
  lines.push('---')
  lines.push(`title: ${topico.titulo}`)
  lines.push(`materia: ${materia.nome}`)
  lines.push(`topico_id: ${topico.id}`)
  lines.push(`emoji: ${topico.emoji || ''}`)
  lines.push(`data_exportacao: ${today}`)
  lines.push(`concluido: ${feitos.includes(topicoIdx)}`)
  lines.push(`dificuldade: ${dific}`)
  lines.push(`tempo_estudado: ${formatTempo(getTempo(materiaKey, topicoIdx))}`)
  if (uni.ultimaRevisao) lines.push(`ultima_revisao: ${uni.ultimaRevisao}`)
  lines.push(`tags: [enem, ${materiaKey}, topico]`)
  lines.push('---\n')
  lines.push(`# ${topico.emoji || ''} ${topico.titulo}\n`)
  if (uni.anotacoes) {
    lines.push('## 📝 Anotações\n')
    lines.push(uni.anotacoes)
    lines.push('')
  }
  if (uni.videos.length) {
    lines.push('## 🎬 Vídeos salvos\n')
    uni.videos.forEach(v => {
      lines.push(`- [${v.titulo}](${v.url})`)
      lines.push(`  ![](https://www.youtube.com/watch?v=${v.videoId})`)
    })
    lines.push('')
  }
  if (uni.questoes.length) {
    lines.push('## ❓ Questões\n')
    uni.questoes.forEach((q, i) => {
      lines.push(`### Questão ${i+1}`)
      lines.push(q.enunciado)
      if (q.resposta) {
        lines.push('\n> **Resposta:**')
        lines.push('> ' + q.resposta.replace(/\n/g, '\n> '))
      }
      lines.push('')
    })
  }
  const content = lines.join('\n')
  const blob = new Blob([content], { type: 'text/markdown' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${topico.titulo.replace(/[^\w\s-]/g,'').replace(/\s+/g,'-')}.md`
  a.click()
  URL.revokeObjectURL(a.href)
}

function toggleImport() {
  const box = document.getElementById('import-box')
  if (!box) return
  box.style.display = box.style.display === 'none' ? 'block' : 'none'
}

function importarObsidian() {
  const txt = document.getElementById('import-text').value
  if (!txt.trim()) return alert('Cole o markdown primeiro.')
  // Remove frontmatter (--- ... ---) se houver
  let body = txt
  const fm = body.match(/^---\n[\s\S]*?\n---\n?/)
  if (fm) body = body.slice(fm[0].length)
  if (!confirm('Isso substituirá suas anotações atuais. Continuar?')) return
  saveUniverso(topicoId, { anotacoes: body.trim() })
  alert('Importado! Recarregando...')
  renderPage()
}

function marcarRevisao() {
  touchRevisao(topicoId)
  alert('Revisão marcada para hoje ✓')
  renderPage()
}

// ── Pomodoro ───────────────────────────────────────────
let pomoState = {
  running: false,
  remaining: 25 * 60,
  duration: 25 * 60,
  interval: null,
  mode: 'foco', // foco | pausa
  tickAccum: 0, // segundos acumulados p/ salvar no getTempo
}

function pomoInit() {
  pomoState.duration = parseInt(document.getElementById('pomo-min').value) * 60
  pomoState.remaining = pomoState.duration
  pomoUpdateDisplay()
}

function pomoStart() {
  if (pomoState.running) return
  pomoState.running = true
  document.getElementById('pomo-start').disabled = true
  document.getElementById('pomo-pause').disabled = false
  pomoState.interval = setInterval(() => {
    pomoState.remaining--
    pomoState.tickAccum++
    // Salva tempo a cada 10s p/ não perder caso feche a aba
    if (pomoState.mode === 'foco' && pomoState.tickAccum >= 10) {
      addTempo(materiaKey, topicoIdx, pomoState.tickAccum)
      pomoState.tickAccum = 0
      const t = document.getElementById('tempo-total-txt')
      if (t) t.textContent = 'Total estudado: ' + formatTempo(getTempo(materiaKey, topicoIdx))
    }
    if (pomoState.remaining <= 0) {
      // Salva o restante
      if (pomoState.mode === 'foco' && pomoState.tickAccum > 0) {
        addTempo(materiaKey, topicoIdx, pomoState.tickAccum)
        pomoState.tickAccum = 0
      }
      pomoFinish()
    }
    pomoUpdateDisplay()
  }, 1000)
}

function pomoPause() {
  if (!pomoState.running) return
  // Salva o tempo acumulado antes de pausar
  if (pomoState.mode === 'foco' && pomoState.tickAccum > 0) {
    addTempo(materiaKey, topicoIdx, pomoState.tickAccum)
    pomoState.tickAccum = 0
    const t = document.getElementById('tempo-total-txt')
    if (t) t.textContent = 'Total estudado: ' + formatTempo(getTempo(materiaKey, topicoIdx))
  }
  clearInterval(pomoState.interval)
  pomoState.running = false
  document.getElementById('pomo-start').disabled = false
  document.getElementById('pomo-pause').disabled = true
}

function pomoReset() {
  clearInterval(pomoState.interval)
  if (pomoState.mode === 'foco' && pomoState.tickAccum > 0) {
    addTempo(materiaKey, topicoIdx, pomoState.tickAccum)
    pomoState.tickAccum = 0
  }
  pomoState.running = false
  pomoState.remaining = pomoState.duration
  document.getElementById('pomo-start').disabled = false
  document.getElementById('pomo-pause').disabled = true
  pomoUpdateDisplay()
}

function pomoFinish() {
  clearInterval(pomoState.interval)
  pomoState.running = false
  document.getElementById('pomo-start').disabled = false
  document.getElementById('pomo-pause').disabled = true
  try { new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA').play() } catch(e){}
  alert(pomoState.mode === 'foco' ? '⏰ Foco concluído! Hora de descansar.' : '✅ Pausa finalizada. Bora voltar!')
  // alterna modo
  pomoState.mode = pomoState.mode === 'foco' ? 'pausa' : 'foco'
  pomoState.duration = pomoState.mode === 'pausa' ? 5 * 60 : parseInt(document.getElementById('pomo-min').value) * 60
  pomoState.remaining = pomoState.duration
  document.getElementById('pomo-mode').textContent = pomoState.mode === 'foco' ? 'Foco' : 'Pausa'
  pomoUpdateDisplay()
  touchRevisao(topicoId)
}

function pomoChangeMin() {
  if (pomoState.running) return
  pomoState.duration = parseInt(document.getElementById('pomo-min').value) * 60
  pomoState.remaining = pomoState.duration
  pomoUpdateDisplay()
}

function pomoUpdateDisplay() {
  const m = Math.floor(pomoState.remaining / 60).toString().padStart(2, '0')
  const s = (pomoState.remaining % 60).toString().padStart(2, '0')
  const el = document.getElementById('pomo-display')
  if (el) el.textContent = `${m}:${s}`
}

// Salva tempo ao sair da página
window.addEventListener('beforeunload', () => {
  if (pomoState.mode === 'foco' && pomoState.tickAccum > 0) {
    addTempo(materiaKey, topicoIdx, pomoState.tickAccum)
  }
})

document.addEventListener('DOMContentLoaded', renderPage)