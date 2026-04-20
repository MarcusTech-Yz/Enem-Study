// ── materia.js ──

const params     = new URLSearchParams(window.location.search)
const materiaKey = params.get('m')
if (!materiaKey || !ENEM[materiaKey]) window.location.href = 'materias.html'

const mat = ENEM[materiaKey]

// ── Página principal da matéria ───────────────────────
function renderPage() {
  const feitos   = getTopicosFeitos(materiaKey)
  const dific    = getDificuldades(materiaKey)
  const total    = mat.topicos.length
  const p        = Math.round((feitos.length / total) * 100)
  const anotacao = getAnotacao(materiaKey)
  const tempo    = getTempoMateria(materiaKey)

  document.title = `ENEM · ${mat.nome}`

  document.getElementById('main-content').innerHTML = `
    <a class="back-link" href="materias.html">
      <i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Matérias
    </a>

    <div class="page-header">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
        <i data-lucide="${mat.icone}" style="width:28px;height:28px;color:var(--text3);"></i>
        <h1>${mat.nome}</h1>
      </div>
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:4px;">
        <span style="color:var(--text3);font-size:13px;font-family:var(--mono);" id="prog-txt">
          ${feitos.length} / ${total} tópicos · ${p}%
        </span>
        ${tempo > 0 ? `<span style="color:var(--blue);font-size:12px;font-family:var(--mono);">⏱ ${formatTempo(tempo)} estudados</span>` : ''}
      </div>
      <div class="progress-bar" style="margin-top:10px;height:4px;">
        <div class="progress-fill" id="prog-bar" style="width:${p}%"></div>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:1.5rem;flex-wrap:wrap;">
      <button class="btn btn-sm" onclick="marcarTodos()">✓ Marcar todos</button>
      <button class="btn btn-sm" onclick="desmarcarTodos()">○ Desmarcar todos</button>
      <a href="hoje.html" class="btn btn-sm btn-accent" style="margin-left:auto;">
        <i data-lucide="play-circle" style="width:13px;height:13px;"></i> Estudar Agora
      </a>
    </div>

    <div class="section-header">
      <p class="section-title">Tópicos</p>
      <span style="font-size:11px;color:var(--text3);">Marque, avalie e clique em + para anotar</span>
    </div>

    <div class="topico-list" id="topico-list">
      ${mat.topicos.map((topico, idx) => renderTopico(idx, topico, feitos, dific)).join('')}
    </div>

    <hr class="divider" />

    <div class="section-header">
      <p class="section-title">Anotações gerais</p>
      <span style="font-size:11px;color:var(--text3);" id="save-status"></span>
    </div>
    <textarea class="anotacao-area" id="anotacao"
      placeholder="Resumos gerais da matéria, links, observações...&#10;Para anotar sobre um tópico específico, use o botão + em cada tópico."
    >${anotacao}</textarea>

    <hr class="divider" />

    <div class="section-header">
      <p class="section-title">Materiais e prints</p>
      <button class="btn btn-accent btn-sm" onclick="document.getElementById('file-input').click()">+ Imagem</button>
    </div>
    <div class="upload-area" id="upload-drop" onclick="document.getElementById('file-input').click()">
      Clique ou arraste imagens aqui
      <br><span style="font-size:11px;opacity:.4;">prints de questões, fotos de caderno</span>
    </div>
    <div class="uploads-grid" id="uploads-grid"></div>
  `

  renderImagens()
  setupListeners()
  lucide.createIcons()
}

// ── Renderiza um tópico na lista ──────────────────────
function renderTopico(idx, topico, feitos, dific) {
  const done    = feitos.includes(idx)
  const d       = dific[idx] || 0
  const tempo   = getTempo(materiaKey, idx)
  const notas   = getNotasMateria(materiaKey)
  const nota    = notas[idx] || ''
  const temNota = nota.trim().length > 0
  const texto   = tituloTopico(topico)

  return `
    <div class="topico-wrapper" id="topico-wrapper-${idx}">
      <div class="topico-item ${done ? 'done' : ''}" id="topico-${idx}">
        <div class="topico-check" onclick="toggleTopicoUI(${idx})">${done ? '✓' : ''}</div>
        <span class="topico-texto" onclick="toggleTopicoUI(${idx})">${texto}</span>
        ${tempo > 0 ? `<span class="topico-tempo has-time">${formatTempo(tempo)}</span>` : `<span class="topico-tempo"></span>`}
        <div class="dific-group">
          <button class="dific-btn d1 ${d===1?'active':''}" onclick="avaliar(${idx},1)" title="Entendi pouco">😕</button>
          <button class="dific-btn d2 ${d===2?'active':''}" onclick="avaliar(${idx},2)" title="Médio">😐</button>
          <button class="dific-btn d3 ${d===3?'active':''}" onclick="avaliar(${idx},3)" title="Entendi bem">😊</button>
        </div>
        <button class="nota-toggle ${temNota ? 'has-nota' : ''}"
                id="nota-btn-${idx}"
                onclick="abrirEditor(${idx})"
                title="${temNota ? 'Ver anotação' : 'Adicionar anotação'}">
          <i data-lucide="${temNota ? 'file-text' : 'plus'}" style="width:12px;height:12px;pointer-events:none;"></i>
        </button>
      </div>
    </div>
  `
}

// ── Editor fullscreen por tópico ──────────────────────
function abrirEditor(idx) {
  const titulo  = tituloTopico(mat.topicos[idx])
  const notas   = getNotasMateria(materiaKey)
  const nota    = notas[idx] || ''
  const feitos  = getTopicosFeitos(materiaKey)
  const isDone  = feitos.includes(idx)
  const main    = document.getElementById('main-content')

  main.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:1.5rem;">
      <button class="btn btn-sm btn-ghost" onclick="voltarDaEditor()">
        <i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Voltar
      </button>
      <div style="flex:1;min-width:0;">
        <p style="font-size:11px;color:var(--text3);font-family:var(--mono);margin-bottom:2px;">
          <i data-lucide="${mat.icone}" style="width:11px;height:11px;vertical-align:middle;"></i>
          ${mat.nome}
        </p>
        <p style="font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${titulo}
        </p>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
        <span id="editor-save-status" style="font-size:11px;color:var(--text3);font-family:var(--mono);"></span>
        <div id="editor-check"
             onclick="toggleTopicoEditor(${idx})"
             title="Marcar como feito"
             style="width:22px;height:22px;border-radius:5px;border:1.5px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;transition:all .15s;flex-shrink:0;${isDone ? 'background:var(--accent);border-color:var(--accent);color:#0F0F0F;font-weight:700;' : ''}">
          ${isDone ? '✓' : ''}
        </div>
      </div>
    </div>

    <textarea
      id="editor-textarea"
      style="width:100%;min-height:calc(100vh - 380px);background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem 1.5rem;color:var(--text);font-family:var(--mono);font-size:13px;line-height:1.8;resize:none;outline:none;transition:border-color .15s;"
      placeholder="Escreva aqui...&#10;&#10;Fórmulas, exemplos resolvidos, dúvidas, resumos.&#10;Tudo que escrever aqui é exportado pro Obsidian junto com esse tópico."
      oninput="autoSaveEditor(${idx})"
      onfocus="this.style.borderColor='var(--accent)'"
      onblur="this.style.borderColor='var(--border)'"
    >${nota}</textarea>

    <hr class="divider" style="margin:1.25rem 0;" />

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <p class="section-title">Imagens deste tópico</p>
      <button class="btn btn-sm btn-accent" onclick="document.getElementById('editor-file-input').click()">+ Imagem</button>
    </div>
    <div id="editor-upload-drop"
         style="border:1px dashed var(--border2);border-radius:var(--radius);padding:1.25rem;text-align:center;cursor:pointer;color:var(--text3);font-size:13px;transition:all .2s;"
         onclick="document.getElementById('editor-file-input').click()">
      Clique ou arraste imagens aqui
    </div>
    <div class="uploads-grid" id="editor-uploads-grid" style="margin-top:12px;"></div>
    <input type="file" id="editor-file-input" accept="image/*" style="display:none" multiple />
  `

  renderImagensEditor(idx)
  setupEditorListeners(idx)

  const ta = document.getElementById('editor-textarea')
  if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length) }

  lucide.createIcons()
}

function toggleTopicoEditor(idx) {
  const feitos = toggleTopico(materiaKey, idx)
  const isDone = feitos.includes(idx)
  const check  = document.getElementById('editor-check')
  if (!check) return
  check.textContent = isDone ? '✓' : ''
  if (isDone) {
    check.style.background = 'var(--accent)'
    check.style.borderColor = 'var(--accent)'
    check.style.color = '#0F0F0F'
    check.style.fontWeight = '700'
  } else {
    check.style.background = 'none'
    check.style.borderColor = 'var(--border2)'
    check.style.color = 'inherit'
    check.style.fontWeight = 'normal'
  }
}

let editorTimer = null
function autoSaveEditor(idx) {
  clearTimeout(editorTimer)
  const statusEl = document.getElementById('editor-save-status')
  if (statusEl) statusEl.textContent = 'salvando...'
  editorTimer = setTimeout(() => {
    const ta = document.getElementById('editor-textarea')
    if (!ta) return
    saveNotaTopico(materiaKey, idx, ta.value)
    if (statusEl) {
      statusEl.textContent = 'salvo ✓'
      setTimeout(() => { if (statusEl) statusEl.textContent = '' }, 1500)
    }
  }, 700)
}

// ── Imagens por tópico ────────────────────────────────
function getImagensTopico(mKey, idx) {
  return store.get(`imagens_topico_${mKey}_${idx}`) || []
}
function addImagemTopico(mKey, idx, b64) {
  const arr = getImagensTopico(mKey, idx); arr.push(b64)
  store.set(`imagens_topico_${mKey}_${idx}`, arr); return arr
}
function removeImagemTopico(mKey, idx, imgIdx) {
  const arr = getImagensTopico(mKey, idx)
  arr.splice(imgIdx, 1)
  store.set(`imagens_topico_${mKey}_${idx}`, arr)
}

function renderImagensEditor(topicoIdx) {
  const grid = document.getElementById('editor-uploads-grid')
  if (!grid) return
  const imgs = getImagensTopico(materiaKey, topicoIdx)
  grid.innerHTML = imgs.map((src, i) => `
    <div class="upload-thumb">
      <img src="${src}" alt="Imagem ${i+1}" onclick="window.open('${src}','_blank')" />
      <button class="upload-del" onclick="deletarImagemEditor(${topicoIdx},${i})">✕</button>
    </div>
  `).join('')
}

function deletarImagemEditor(topicoIdx, imgIdx) {
  removeImagemTopico(materiaKey, topicoIdx, imgIdx)
  renderImagensEditor(topicoIdx)
}

let _pasteHandler = null

function voltarDaEditor() {
  if (_pasteHandler) { document.removeEventListener('paste', _pasteHandler); _pasteHandler = null }
  renderPage()
}

function setupEditorListeners(topicoIdx) {
  const fi = document.getElementById('editor-file-input')
  if (fi) {
    fi.addEventListener('change', e => {
      Array.from(e.target.files).forEach(file => {
        if (!file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onload = ev => { addImagemTopico(materiaKey, topicoIdx, ev.target.result); renderImagensEditor(topicoIdx) }
        reader.readAsDataURL(file)
      })
      e.target.value = ''
    })
  }
  const drop = document.getElementById('editor-upload-drop')
  if (drop) {
    drop.addEventListener('dragover',  e => { e.preventDefault(); drop.style.borderColor = 'var(--accent)' })
    drop.addEventListener('dragleave', () => { drop.style.borderColor = '' })
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.style.borderColor = ''
      Array.from(e.dataTransfer.files).forEach(file => {
        if (!file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onload = ev => { addImagemTopico(materiaKey, topicoIdx, ev.target.result); renderImagensEditor(topicoIdx) }
        reader.readAsDataURL(file)
      })
    })
  }
  // Ctrl+V para colar imagem
  function pasteHandler(e) {
    const items = Array.from(e.clipboardData?.items || [])
    const imgItem = items.find(i => i.type.startsWith('image/'))
    if (!imgItem) return
    e.preventDefault()
    const reader = new FileReader()
    reader.onload = ev => { addImagemTopico(materiaKey, topicoIdx, ev.target.result); renderImagensEditor(topicoIdx) }
    reader.readAsDataURL(imgItem.getAsFile())
  }
  _pasteHandler = pasteHandler
  document.addEventListener('paste', pasteHandler)

  // Esc para voltar — limpa os dois listeners
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', escHandler)
      voltarDaEditor()
    }
  })
}

// ── Helpers ───────────────────────────────────────────
function tituloTopico(topico) {
  if (typeof topico === 'string') return topico
  if (topico && typeof topico === 'object') return topico.titulo || topico.title || String(topico)
  return String(topico)
}

function toggleTopicoUI(idx) {
  const feitos = toggleTopico(materiaKey, idx)
  const el     = document.getElementById('topico-' + idx)
  const check  = el.querySelector('.topico-check')
  el.classList.toggle('done', feitos.includes(idx))
  check.textContent = feitos.includes(idx) ? '✓' : ''
  atualizarProgresso()
}

function avaliar(idx, val) {
  const dific = getDificuldades(materiaKey)
  const novo  = dific[idx] === val ? 0 : val
  setDificuldade(materiaKey, idx, novo)
  const el = document.getElementById('topico-' + idx)
  el.querySelectorAll('.dific-btn').forEach((b, i) => b.classList.toggle('active', novo === i + 1))
}

function marcarTodos()    { store.set('topicos_' + materiaKey, mat.topicos.map((_,i) => i)); renderPage() }
function desmarcarTodos() { store.set('topicos_' + materiaKey, []); renderPage() }

function atualizarProgresso() {
  const feitos = getTopicosFeitos(materiaKey).length
  const p      = Math.round((feitos / mat.topicos.length) * 100)
  const bar    = document.getElementById('prog-bar')
  const txt    = document.getElementById('prog-txt')
  if (bar) bar.style.width = p + '%'
  if (txt) txt.textContent = `${feitos} / ${mat.topicos.length} tópicos · ${p}%`
}

// ── Imagens gerais da matéria ─────────────────────────
function renderImagens() {
  const grid = document.getElementById('uploads-grid')
  if (!grid) return
  const imgs = getImagens(materiaKey)
  grid.innerHTML = imgs.map((src, idx) => `
    <div class="upload-thumb">
      <img src="${src}" alt="Material ${idx+1}" onclick="window.open('${src}','_blank')" />
      <button class="upload-del" onclick="deletarImagem(${idx})">✕</button>
    </div>
  `).join('')
}

function deletarImagem(idx) { removeImagem(materiaKey, idx); renderImagens() }

let saveTimer = null
function setupListeners() {
  const textarea = document.getElementById('anotacao')
  if (textarea) {
    textarea.addEventListener('input', () => {
      clearTimeout(saveTimer)
      document.getElementById('save-status').textContent = 'salvando...'
      saveTimer = setTimeout(() => {
        saveAnotacao(materiaKey, textarea.value)
        const s = document.getElementById('save-status')
        if (s) { s.textContent = 'salvo ✓'; setTimeout(() => { if(s) s.textContent = '' }, 2000) }
      }, 800)
    })
  }
  const fi = document.getElementById('file-input')
  if (fi) fi.addEventListener('change', handleFiles)
  const drop = document.getElementById('upload-drop')
  if (drop) {
    drop.addEventListener('dragover',  e => { e.preventDefault(); drop.style.borderColor = 'var(--accent)' })
    drop.addEventListener('dragleave', () => { drop.style.borderColor = '' })
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.style.borderColor = ''
      handleFiles({ target: { files: e.dataTransfer.files } })
    })
  }
}

function handleFiles(e) {
  Array.from(e.target.files).forEach(file => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => { addImagem(materiaKey, ev.target.result); renderImagens() }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

document.addEventListener('DOMContentLoaded', renderPage)