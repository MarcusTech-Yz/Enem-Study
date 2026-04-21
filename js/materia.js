// ── materia.js ──

const params     = new URLSearchParams(window.location.search)
const materiaKey = params.get('m')
if (!materiaKey || !ENEM[materiaKey]) window.location.href = 'materias.html'

const mat = ENEM[materiaKey]

// Helper: extrai todos os tópicos (habilidades) de todos os conteúdos
function allHabilidades() {
  const result = []
  for (const conteudo of mat.conteudos) {
    for (const h of conteudo.habilidades) {
      result.push({ ...h, conteudoId: conteudo.id, conteudoNome: conteudo.nome })
    }
  }
  return result
}

// Helper: chave única pra cada tópico (materiaKey + conteudoId + habilidade id)
function topicoKey(conteudoId, hId) { return `${conteudoId}__${hId}` }

// localStorage keys usam o topicoKey
function getTopicosFeitos(mKey) { return store.get('topicos_' + mKey) || [] }

function toggleTopicoH(mKey, tKey) {
  let f = getTopicosFeitos(mKey)
  f = f.includes(tKey) ? f.filter(k => k !== tKey) : [...f, tKey]
  store.set('topicos_' + mKey, f)
  bumpStreak()
  return f
}

function getDificuldades(mKey)       { return store.get('dific_' + mKey) || {} }
function setDificuldadeH(mKey, tKey, v) {
  const d = getDificuldades(mKey); d[tKey] = v; store.set('dific_' + mKey, d)
}

// Progresso recalculado para a nova estrutura
function getProgressoMateria(mKey) {
  const todas  = allHabilidades()
  const feitos = getTopicosFeitos(mKey)
  return { feitos: feitos.length, total: todas.length, pct: todas.length ? Math.round((feitos.length / todas.length) * 100) : 0 }
}

// ── Filtro ativo ──────────────────────────────────────
let filtroAtivo = 'todos'  // 'todos' | 'alta' | 'media' | 'baixa'

// ── Página principal ──────────────────────────────────
function renderPage() {
  const feitos = getTopicosFeitos(materiaKey)
  const dific  = getDificuldades(materiaKey)
  const todas  = allHabilidades()
  const total  = todas.length
  const p      = total ? Math.round((feitos.length / total) * 100) : 0
  const tempo  = getTempoMateria(materiaKey)

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

    <!-- Ações e filtros -->
    <div style="display:flex;gap:8px;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center;">
      <button class="btn btn-sm" onclick="marcarTodos()">✓ Marcar todos</button>
      <button class="btn btn-sm" onclick="desmarcarTodos()">○ Desmarcar todos</button>
      <div style="display:flex;gap:4px;margin-left:auto;">
        <button class="prioridade-btn ${filtroAtivo==='todos'?'ativo':''}"  onclick="setFiltro('todos')" >Todos</button>
        <button class="prioridade-btn alta  ${filtroAtivo==='alta'?'ativo':''}"  onclick="setFiltro('alta')" >🔴 Alta</button>
        <button class="prioridade-btn media ${filtroAtivo==='media'?'ativo':''}" onclick="setFiltro('media')">🟡 Média</button>
        <button class="prioridade-btn baixa ${filtroAtivo==='baixa'?'ativo':''}" onclick="setFiltro('baixa')">🟢 Baixa</button>
      </div>
    </div>

    <!-- Conteúdos com habilidades -->
    <div id="conteudos-list">
      ${renderConteudos(feitos, dific)}
    </div>

    <hr class="divider" />

    <div class="section-header">
      <p class="section-title">Anotações gerais</p>
      <span style="font-size:11px;color:var(--text3);" id="save-status"></span>
    </div>
    <textarea class="anotacao-area" id="anotacao"
      placeholder="Resumos gerais da matéria, links, observações...&#10;Para anotar sobre um tópico específico, use o botão + em cada tópico."
    >${getAnotacao(materiaKey)}</textarea>

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

function renderConteudos(feitos, dific) {
  return mat.conteudos.map(conteudo => {
    const habilidadesFiltradas = conteudo.habilidades.filter(h =>
      filtroAtivo === 'todos' || h.prioridade === filtroAtivo
    )
    if (habilidadesFiltradas.length === 0) return ''

    const feitosConteudo = habilidadesFiltradas.filter(h => feitos.includes(topicoKey(conteudo.id, h.id))).length
    const totalConteudo  = habilidadesFiltradas.length
    const pctConteudo    = Math.round((feitosConteudo / totalConteudo) * 100)

    return `
      <div class="conteudo-bloco" id="bloco-${conteudo.id}">
        <div class="conteudo-header" onclick="toggleConteudo('${conteudo.id}')">
          <div style="flex:1;min-width:0;">
            <p class="conteudo-nome">${conteudo.nome}</p>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
              <div class="progress-bar" style="flex:1;max-width:120px;margin-bottom:0;">
                <div class="progress-fill" style="width:${pctConteudo}%;"></div>
              </div>
              <span style="font-size:10px;color:var(--text3);font-family:var(--mono);">${feitosConteudo}/${totalConteudo}</span>
            </div>
          </div>
          <i data-lucide="chevron-down" class="conteudo-chevron" id="chevron-${conteudo.id}" style="width:16px;height:16px;color:var(--text3);transition:transform .2s;flex-shrink:0;"></i>
        </div>
        <div class="conteudo-body" id="body-${conteudo.id}">
          ${habilidadesFiltradas.map(h => renderHabilidade(conteudo.id, h, feitos, dific)).join('')}
        </div>
      </div>
    `
  }).join('')
}

function renderHabilidade(conteudoId, h, feitos, dific) {
  const tKey    = topicoKey(conteudoId, h.id)
  const done    = feitos.includes(tKey)
  const d       = dific[tKey] || 0
  const tempo   = getTempo(materiaKey, tKey)
  const notas   = getNotasMateria(materiaKey)
  const temNota = (notas[tKey] || '').trim().length > 0

  const PRIO_COLOR = { alta: 'var(--red)', media: 'var(--amber)', baixa: 'var(--green)' }
  const PRIO_LABEL = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }

  return `
    <div class="topico-wrapper">
      <div class="topico-item ${done ? 'done' : ''}" id="topico-${tKey}">
        <div class="topico-check" onclick="toggleTopicoUI('${conteudoId}','${h.id}')">${done ? '✓' : ''}</div>
        <div style="flex:1;min-width:0;">
          <span class="topico-texto" onclick="toggleTopicoUI('${conteudoId}','${h.id}')">${h.topico}</span>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
            <span style="font-size:10px;font-family:var(--mono);color:var(--text3);">${h.id}</span>
            <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(0,0,0,.2);color:${PRIO_COLOR[h.prioridade]};border:1px solid ${PRIO_COLOR[h.prioridade]}33;">
              ${PRIO_LABEL[h.prioridade]}
            </span>
          </div>
        </div>
        ${tempo > 0 ? `<span class="topico-tempo has-time">${formatTempo(tempo)}</span>` : `<span class="topico-tempo"></span>`}
        <div class="dific-group">
          <button class="dific-btn d1 ${d===1?'active':''}" onclick="avaliarH('${conteudoId}','${h.id}',1)" title="Entendi pouco">
            <i data-lucide="thumbs-down" style="width:14px;height:14px;pointer-events:none;"></i>
          </button>
          <button class="dific-btn d2 ${d===2?'active':''}" onclick="avaliarH('${conteudoId}','${h.id}',2)" title="Mais ou menos">
            <i data-lucide="meh" style="width:14px;height:14px;pointer-events:none;"></i>
          </button>
          <button class="dific-btn d3 ${d===3?'active':''}" onclick="avaliarH('${conteudoId}','${h.id}',3)" title="Entendi bem">
            <i data-lucide="thumbs-up" style="width:14px;height:14px;pointer-events:none;"></i>
          </button>
        </div>
        <button class="nota-toggle ${temNota ? 'has-nota' : ''}"
                onclick="abrirEditor('${conteudoId}','${h.id}')"
                title="${temNota ? 'Ver anotação' : 'Adicionar anotação'}">
          <i data-lucide="${temNota ? 'file-text' : 'plus'}" style="width:12px;height:12px;pointer-events:none;"></i>
        </button>
      </div>
    </div>
  `
}

function toggleConteudo(id) {
  const body    = document.getElementById('body-' + id)
  const chevron = document.getElementById('chevron-' + id)
  const aberto  = body.style.display !== 'none'
  body.style.display    = aberto ? 'none' : 'block'
  chevron.style.transform = aberto ? 'rotate(-90deg)' : 'rotate(0deg)'
}

function setFiltro(f) {
  filtroAtivo = f
  const feitos = getTopicosFeitos(materiaKey)
  const dific  = getDificuldades(materiaKey)
  document.getElementById('conteudos-list').innerHTML = renderConteudos(feitos, dific)
  document.querySelectorAll('.prioridade-btn').forEach(b => b.classList.remove('ativo'))
  document.querySelectorAll('.prioridade-btn').forEach(b => {
    if (b.textContent.toLowerCase().includes(f) || (f === 'todos' && b.textContent === 'Todos'))
      b.classList.add('ativo')
  })
  lucide.createIcons()
}

// ── Toggle tópico ─────────────────────────────────────
function toggleTopicoUI(conteudoId, hId) {
  const tKey   = topicoKey(conteudoId, hId)
  const feitos = toggleTopicoH(materiaKey, tKey)
  const el     = document.getElementById('topico-' + tKey)
  if (!el) return
  const check  = el.querySelector('.topico-check')
  el.classList.toggle('done', feitos.includes(tKey))
  check.textContent = feitos.includes(tKey) ? '✓' : ''
  atualizarProgresso()
}

function avaliarH(conteudoId, hId, val) {
  const tKey = topicoKey(conteudoId, hId)
  const dific = getDificuldades(materiaKey)
  const novo  = dific[tKey] === val ? 0 : val
  setDificuldadeH(materiaKey, tKey, novo)
  const el = document.getElementById('topico-' + tKey)
  if (el) el.querySelectorAll('.dific-btn').forEach((b, i) => b.classList.toggle('active', novo === i + 1))
}

function marcarTodos() {
  const todas = allHabilidades().map(h => topicoKey(h.conteudoId, h.id))
  store.set('topicos_' + materiaKey, todas)
  renderPage()
}
function desmarcarTodos() { store.set('topicos_' + materiaKey, []); renderPage() }

function atualizarProgresso() {
  const feitos = getTopicosFeitos(materiaKey).length
  const total  = allHabilidades().length
  const p      = Math.round((feitos / total) * 100)
  const bar    = document.getElementById('prog-bar')
  const txt    = document.getElementById('prog-txt')
  if (bar) bar.style.width = p + '%'
  if (txt) txt.textContent = `${feitos} / ${total} tópicos · ${p}%`
}

// ── Editor fullscreen ─────────────────────────────────
let _pasteHandler = null

function voltarDaEditor() {
  if (_pasteHandler) { document.removeEventListener('paste', _pasteHandler); _pasteHandler = null }
  renderPage()
}

function abrirEditor(conteudoId, hId) {
  const tKey   = topicoKey(conteudoId, hId)
  const h      = mat.conteudos.find(c => c.id === conteudoId)?.habilidades.find(h => h.id === hId)
  if (!h) return
  const notas  = getNotasMateria(materiaKey)
  const nota   = notas[tKey] || ''
  const feitos = getTopicosFeitos(materiaKey)
  const isDone = feitos.includes(tKey)
  const PRIO_COLOR = { alta: 'var(--red)', media: 'var(--amber)', baixa: 'var(--green)' }

  document.getElementById('main-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:1.5rem;">
      <button class="btn btn-sm btn-ghost" onclick="voltarDaEditor()">
        <i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Voltar
      </button>
      <div style="flex:1;min-width:0;">
        <p style="font-size:11px;color:var(--text3);font-family:var(--mono);margin-bottom:2px;">
          <i data-lucide="${mat.icone}" style="width:11px;height:11px;vertical-align:middle;"></i>
          ${mat.nome} · ${mat.conteudos.find(c=>c.id===conteudoId)?.nome || ''}
          <span style="color:${PRIO_COLOR[h.prioridade]};margin-left:6px;">${h.id}</span>
        </p>
        <p style="font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${h.topico}</p>
        <p style="font-size:11px;color:var(--text3);margin-top:2px;line-height:1.4;">${h.descricao}</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
        <span id="editor-save-status" style="font-size:11px;color:var(--text3);font-family:var(--mono);"></span>
        <div id="editor-check" onclick="toggleTopicoEditor('${conteudoId}','${hId}')" title="Marcar como feito"
          style="width:22px;height:22px;border-radius:5px;border:1.5px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;transition:all .15s;flex-shrink:0;${isDone?'background:var(--accent);border-color:var(--accent);color:#0F0F0F;font-weight:700;':''}">
          ${isDone ? '✓' : ''}
        </div>
      </div>
    </div>

    <textarea id="editor-textarea"
      style="width:100%;min-height:calc(100vh - 400px);background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem 1.5rem;color:var(--text);font-family:var(--mono);font-size:13px;line-height:1.8;resize:none;outline:none;transition:border-color .15s;"
      placeholder="Escreva aqui...&#10;&#10;Fórmulas, exemplos resolvidos, dúvidas, resumos.&#10;Tudo que escrever aqui é exportado pro Obsidian junto com esse tópico."
      oninput="autoSaveEditor('${tKey}')"
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
      Clique, arraste ou <kbd style="background:var(--bg3);border:1px solid var(--border2);border-radius:3px;padding:1px 5px;font-size:11px;">Ctrl+V</kbd> para colar imagem
    </div>
    <div class="uploads-grid" id="editor-uploads-grid" style="margin-top:12px;"></div>
    <input type="file" id="editor-file-input" accept="image/*" style="display:none" multiple />
  `

  renderImagensEditor(tKey)
  setupEditorListeners(tKey)

  const ta = document.getElementById('editor-textarea')
  if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length) }
  lucide.createIcons()
}

function toggleTopicoEditor(conteudoId, hId) {
  const tKey   = topicoKey(conteudoId, hId)
  const feitos = toggleTopicoH(materiaKey, tKey)
  const isDone = feitos.includes(tKey)
  const check  = document.getElementById('editor-check')
  if (!check) return
  check.textContent = isDone ? '✓' : ''
  check.style.background   = isDone ? 'var(--accent)' : 'none'
  check.style.borderColor  = isDone ? 'var(--accent)' : 'var(--border2)'
  check.style.color        = isDone ? '#0F0F0F' : 'inherit'
  check.style.fontWeight   = isDone ? '700' : 'normal'
}

let editorTimer = null
function autoSaveEditor(tKey) {
  clearTimeout(editorTimer)
  const statusEl = document.getElementById('editor-save-status')
  if (statusEl) statusEl.textContent = 'salvando...'
  editorTimer = setTimeout(() => {
    const ta = document.getElementById('editor-textarea')
    if (!ta) return
    saveNotaTopico(materiaKey, tKey, ta.value)
    if (statusEl) { statusEl.textContent = 'salvo ✓'; setTimeout(() => { if(statusEl) statusEl.textContent = '' }, 1500) }
  }, 700)
}

// ── Imagens por tópico ────────────────────────────────
function getImagensTopico(mKey, tKey)    { return store.get(`imagens_topico_${mKey}_${tKey}`) || [] }
function addImagemTopico(mKey, tKey, b64){ const a=getImagensTopico(mKey,tKey); a.push(b64); store.set(`imagens_topico_${mKey}_${tKey}`,a); return a }
function removeImagemTopico(mKey, tKey, i){ const a=getImagensTopico(mKey,tKey); a.splice(i,1); store.set(`imagens_topico_${mKey}_${tKey}`,a) }

function renderImagensEditor(tKey) {
  const grid = document.getElementById('editor-uploads-grid'); if (!grid) return
  const imgs = getImagensTopico(materiaKey, tKey)
  grid.innerHTML = imgs.map((src, i) => `
    <div class="upload-thumb">
      <img src="${src}" onclick="window.open('${src}','_blank')" />
      <button class="upload-del" onclick="deletarImagemEditor('${tKey}',${i})">✕</button>
    </div>
  `).join('')
}

function deletarImagemEditor(tKey, i) { removeImagemTopico(materiaKey, tKey, i); renderImagensEditor(tKey) }

function setupEditorListeners(tKey) {
  const fi = document.getElementById('editor-file-input')
  if (fi) fi.addEventListener('change', e => {
    Array.from(e.target.files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const r = new FileReader()
      r.onload = ev => { addImagemTopico(materiaKey, tKey, ev.target.result); renderImagensEditor(tKey) }
      r.readAsDataURL(file)
    }); e.target.value = ''
  })

  const drop = document.getElementById('editor-upload-drop')
  if (drop) {
    drop.addEventListener('dragover',  e => { e.preventDefault(); drop.style.borderColor='var(--accent)' })
    drop.addEventListener('dragleave', () => { drop.style.borderColor='' })
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.style.borderColor=''
      Array.from(e.dataTransfer.files).forEach(file => {
        if (!file.type.startsWith('image/')) return
        const r = new FileReader()
        r.onload = ev => { addImagemTopico(materiaKey, tKey, ev.target.result); renderImagensEditor(tKey) }
        r.readAsDataURL(file)
      })
    })
  }

  function pasteHandler(e) {
    const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
    if (!item) return
    e.preventDefault()
    const r = new FileReader()
    r.onload = ev => { addImagemTopico(materiaKey, tKey, ev.target.result); renderImagensEditor(tKey) }
    r.readAsDataURL(item.getAsFile())
  }
  _pasteHandler = pasteHandler
  document.addEventListener('paste', pasteHandler)

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') { document.removeEventListener('keydown', escHandler); voltarDaEditor() }
  })
}

// ── Imagens gerais ────────────────────────────────────
function renderImagens() {
  const grid = document.getElementById('uploads-grid'); if (!grid) return
  const imgs = getImagens(materiaKey)
  grid.innerHTML = imgs.map((src, i) => `
    <div class="upload-thumb">
      <img src="${src}" onclick="window.open('${src}','_blank')" />
      <button class="upload-del" onclick="deletarImagem(${i})">✕</button>
    </div>
  `).join('')
}
function deletarImagem(i) { removeImagem(materiaKey, i); renderImagens() }

let saveTimer = null
function setupListeners() {
  const ta = document.getElementById('anotacao')
  if (ta) ta.addEventListener('input', () => {
    clearTimeout(saveTimer)
    document.getElementById('save-status').textContent = 'salvando...'
    saveTimer = setTimeout(() => {
      saveAnotacao(materiaKey, ta.value)
      const s = document.getElementById('save-status')
      if (s) { s.textContent = 'salvo ✓'; setTimeout(() => { if(s) s.textContent='' }, 2000) }
    }, 800)
  })
  const fi = document.getElementById('file-input')
  if (fi) fi.addEventListener('change', handleFiles)
  const drop = document.getElementById('upload-drop')
  if (drop) {
    drop.addEventListener('dragover',  e => { e.preventDefault(); drop.style.borderColor='var(--accent)' })
    drop.addEventListener('dragleave', () => { drop.style.borderColor='' })
    drop.addEventListener('drop', e => { e.preventDefault(); drop.style.borderColor=''; handleFiles({ target: { files: e.dataTransfer.files } }) })
  }
}

function handleFiles(e) {
  Array.from(e.target.files).forEach(file => {
    if (!file.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = ev => { addImagem(materiaKey, ev.target.result); renderImagens() }
    r.readAsDataURL(file)
  }); e.target.value = ''
}

// Helper compatibilidade
function tituloTopico(t) {
  if (typeof t === 'string') return t
  return t?.titulo || t?.topico || String(t)
}

document.addEventListener('DOMContentLoaded', renderPage)