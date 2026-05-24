// ── exportar.js ──
// Depende de: app.js, topicos.js, JSZip (carregado no HTML)

// ── Formata uma matéria como Markdown ──────────────────
function getTopicosExportMateria(key) {
  return typeof getTopicosMateria === 'function' ? getTopicosMateria(key) : []
}

function materiaParaMd(key, incluirImagens = true) {
  const mat      = ENEM[key]
  const feitos   = getTopicosFeitos(key)
  const dific    = getDificuldades(key)
  const anotacao = getAnotacao(key)
  const notas    = getNotasMateria(key)
  const topicos  = getTopicosExportMateria(key)
  const { pct, total } = getProgressoMateria(key)
  const tempo    = getTempoMateria(key)
  const hoje     = new Date().toLocaleDateString('pt-BR')

  const DIFIC_LABEL = { 1: 'pouco', 2: 'medio', 3: 'bem' }

  let md = `# ${mat.nome}\n\n`
  md += `> **Atualizado em:** ${hoje}  \n`
  md += `> **Progresso:** ${feitos.length}/${total} topicos - ${pct}%  \n`
  if (tempo > 0) md += `> **Tempo estudado:** ${formatTempo(tempo)}  \n`
  md += `\n---\n\n`

  md += `## Topicos\n\n`
  let conteudoAtual = null
  topicos.forEach(topico => {
    if (topico.conteudoNome && topico.conteudoNome !== conteudoAtual) {
      conteudoAtual = topico.conteudoNome
      md += `\n### ${conteudoAtual}\n\n`
    }

    const feito    = feitos.includes(String(topico.key))
    const dificVal = dific[topico.key] || 0
    const dificStr = dificVal ? ` - *${DIFIC_LABEL[dificVal]}*` : ''
    md += `- [${feito ? 'x' : ' '}] ${topico.titulo}${dificStr}\n`
    if (notas[topico.key] && notas[topico.key].trim()) {
      const linhasNota = notas[topico.key].trim().split('\n')
      linhasNota.forEach(l => { md += `  > ${l}\n` })
    }
  })
  md += `\n`

  if (anotacao.trim()) {
    md += `## Anotacoes gerais antigas\n\n${anotacao.trim()}\n\n`
  }

  if (incluirImagens) {
    const imgs = getImagens(key)
    if (imgs.length > 0) {
      md += `## Materiais\n\n`
      imgs.forEach((_, idx) => {
        md += `![[assets/${key}_img${idx + 1}.png]]\n`
      })
      md += `\n`
    }
  }

  return md
}

// ── Gera o _indice.md ──────────────────────────────────
function gerarIndice() {
  const hoje = new Date().toLocaleDateString('pt-BR')
  let md = `# ENEM · Índice de Estudos\n\n`
  md += `> Gerado em ${hoje}\n\n---\n\n`
  md += `## Progresso Geral\n\n`

  const prog = getProgressoGlobal()
  const pct  = Math.round((prog.feitos / prog.total) * 100)
  md += `**${prog.feitos}/${prog.total} tópicos concluídos (${pct}%)**\n\n`
  md += `Tempo total estudado: **${formatTempo(getTempoTotal())}**\n\n`
  md += `## Matérias\n\n`
  md += `| Matéria | Progresso | Tempo |\n`
  md += `|---------|-----------|-------|\n`

  for (const [key, mat] of Object.entries(ENEM)) {
    const { feitos, total, pct: p } = getProgressoMateria(key)
    const tempo = getTempoMateria(key)
    const barras = Math.round(p / 10)
    const barra  = '█'.repeat(barras) + '░'.repeat(10 - barras)
    md += `| [[${mat.nome}]] | ${barra} ${p}% (${feitos}/${total}) | ${tempo > 0 ? formatTempo(tempo) : '—'} |\n`
  }

  md += `\n---\n\n`

  // Sessões recentes (últimos 7 dias)
  const sessoesSemana = []
  for (let i = 0; i < 7; i++) {
    const d   = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const s   = store.get('sessoes_' + key) || []
    if (s.length > 0) {
      sessoesSemana.push({ data: d.toLocaleDateString('pt-BR', { weekday:'short', day:'numeric', month:'short' }), sessoes: s })
    }
  }

  if (sessoesSemana.length > 0) {
    md += `## Sessões recentes\n\n`
    for (const dia of sessoesSemana) {
      md += `**${dia.data}**\n`
      for (const s of dia.sessoes) {
        md += `- ${s.matNome} — ${s.topicoNome} (${s.durMin}min)\n`
      }
      md += `\n`
    }
  }

  return md
}

// ── Exportar matéria única (.md download) ─────────────
function exportarMateria(key) {
  const md       = materiaParaMd(key)
  const nome     = ENEM[key].nome.replace(/\s+/g, '_')
  const blob     = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url      = URL.createObjectURL(blob)
  const a        = document.createElement('a')
  a.href         = url
  a.download     = `${nome}.md`
  a.click()
  URL.revokeObjectURL(url)
  setStatus(`✓ ${ENEM[key].nome}.md baixado`)
}

// ── Exportar dia de hoje (.md download) ───────────────
function exportarHoje() {
  const hoje     = new Date()
  const hojeStr  = hoje.toLocaleDateString('pt-BR')
  const sessoes  = store.get('sessoes_' + getTodayStr()) || []
  const registro = getRegistroHoje()

  let md = `# Estudo — ${hojeStr}\n\n`

  if (registro.nota) md += `## Resumo do dia\n\n${registro.nota}\n\n`

  if (sessoes.length > 0) {
    md += `## Sessões\n\n`
    const totalMin = sessoes.reduce((a, s) => a + s.durMin, 0)
    md += `**Total:** ${totalMin} minutos\n\n`
    for (const s of sessoes) {
      md += `- **${s.matNome}** — ${s.topicoNome} · ${s.durMin}min (${s.hora})\n`
    }
    md += `\n`
  }

  // Tópicos marcados hoje (aproximação: todos feitos das matérias do dia)
  const materias = getMateriaHoje()
  if (materias.length > 0) {
    md += `## Matérias do dia\n\n`
    for (const m of materias) {
      const { feitos, total, pct } = getProgressoMateria(m.key)
      md += `### ${ENEM[m.key].nome}\n`
      md += `Progresso atual: ${feitos}/${total} (${pct}%)\n\n`
    }
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `Estudo_${hojeStr.replace(/\//g, '-')}.md`
  a.click()
  URL.revokeObjectURL(url)
  setStatus('✓ Arquivo do dia baixado')
}

// ── Exportar tudo como ZIP ─────────────────────────────
async function exportarTudo() {
  setStatus('Gerando ZIP...')
  setBtnLoading('btn-zip', true)

  const zip = new JSZip()
  const vault = zip.folder('enem-vault')

  // _indice.md na raiz
  vault.file('_indice.md', gerarIndice())

  // Uma pasta por matéria
  for (const [key, mat] of Object.entries(ENEM)) {
    const nomePasta = mat.nome.replace(/\s+/g, '_')
    const pasta     = vault.folder(nomePasta)
    const assets    = pasta.folder('assets')

    // Markdown da matéria (sem imagens inline, usam caminho relativo)
    pasta.file(`${nomePasta}.md`, materiaParaMd(key, true))

    // Imagens como arquivos .png separados
    const imgs = getImagens(key)
    for (let i = 0; i < imgs.length; i++) {
      const base64 = imgs[i].split(',')[1]  // remove "data:image/...;base64,"
      assets.file(`${key}_img${i + 1}.png`, base64, { base64: true })
    }
  }

  // Gera e baixa
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `enem-vault-${getTodayStr()}.zip`
  a.click()
  URL.revokeObjectURL(url)

  setBtnLoading('btn-zip', false)
  setStatus('✓ ZIP gerado! Descompacte e cole na pasta do seu vault no Obsidian.')
}

// ── Helpers de UI ──────────────────────────────────────
function setStatus(msg) {
  const el = document.getElementById('export-status')
  if (el) { el.textContent = msg; el.style.opacity = '1' }
}

function setBtnLoading(id, loading) {
  const el = document.getElementById(id)
  if (!el) return
  el.disabled    = loading
  el.textContent = loading ? 'Gerando...' : el.dataset.label
}

// ── IMPORTAÇÃO ─────────────────────────────────────────

function detectarMateriaDoMd(conteudo) {
  const match = conteudo.match(/^#\s+(.+)$/m)
  if (!match) return null
  const titulo = match[1].trim().toLowerCase()
  return Object.keys(ENEM).find(k =>
    ENEM[k].nome.toLowerCase() === titulo ||
    titulo.includes(ENEM[k].nome.toLowerCase())
  ) || null
}

function extrairAnotacoes(conteudo) {
  const match = conteudo.match(/##\s+Anota[çc][õo]es\s*\n([\s\S]*?)(?=\n##\s|\n---\s*\n|$)/)
  return match ? match[1].trim() : null
}

function extrairTopicos(conteudo) {
  const feitos = [], naoFeitos = []
  const linhas = conteudo.match(/^- \[(x| )\] .+$/gm) || []
  linhas.forEach(l => {
    const marcado = l.startsWith('- [x]')
    const texto   = limparTituloTopicoImport(l.replace(/^- \[.\] /, ''))
    if (marcado) feitos.push(texto)
    else naoFeitos.push(texto)
  })
  return { feitos, naoFeitos }
}

function findTopicoExportByTitulo(materiaKey, texto) {
  const alvo = String(texto || '').toLowerCase()
  return getTopicosExportMateria(materiaKey).find(t => t.titulo.toLowerCase() === alvo) || null
}

function limparTituloTopicoImport(texto) {
  return String(texto || '')
    .replace(/\s+[—-]\s+\*.+\*$/, '')
    .trim()
}

function importarNotasTopicos(conteudo, materiaKey) {
  const linhas = conteudo.split('\n')
  let atual = null
  let buffer = []
  let total = 0

  function flush() {
    if (!atual || !buffer.length) return
    saveNotaTopico(materiaKey, atual.key, buffer.join('\n').trim())
    total++
    buffer = []
  }

  linhas.forEach(linha => {
    const topicoMatch = linha.match(/^- \[(x| )\] (.+)$/)
    if (topicoMatch) {
      flush()
      atual = findTopicoExportByTitulo(materiaKey, limparTituloTopicoImport(topicoMatch[2]))
      return
    }

    const notaMatch = linha.match(/^  > ?(.*)$/)
    if (atual && notaMatch) buffer.push(notaMatch[1])
  })

  flush()
  return total
}

function extrairDificuldades(conteudo, materiaKey) {
  const MAP = { 'pouco': 1, 'médio': 2, 'medio': 2, 'bem': 3 }
  const dific = getDificuldades(materiaKey)
  const linhas = conteudo.match(/^- \[.\] .+ (?:-|—) \*.+\*$/gm) || []
  linhas.forEach(l => {
    const textoMatch = l.match(/^- \[.\] (.+?) (?:-|—) \*/)
    const dificMatch = l.match(/\*[^ ]+ (\w+)\*$/)
    if (!textoMatch || !dificMatch) return
    const texto = limparTituloTopicoImport(textoMatch[1])
    const nivel = MAP[dificMatch[1].toLowerCase()]
    if (!nivel) return
    const topico = findTopicoExportByTitulo(materiaKey, texto)
    if (topico) dific[topico.key] = nivel
  })
  store.set('dific_' + materiaKey, dific)
}

function importarAvulso(conteudo, materiaKey, nomeArquivo) {
  const anotacaoAtual = getAnotacao(materiaKey)
  const dataHoje      = new Date().toLocaleDateString('pt-BR')
  const separador     = `\n\n---\n*Importado de "${nomeArquivo}" em ${dataHoje}*\n\n`
  const nova = anotacaoAtual
    ? anotacaoAtual + separador + conteudo.trim()
    : `*Importado de "${nomeArquivo}" em ${dataHoje}*\n\n` + conteudo.trim()
  saveAnotacao(materiaKey, nova)
  setStatus(`✓ "${nomeArquivo}" adicionado às anotações de ${ENEM[materiaKey].nome}`)
  return { tipo: 'avulso', materia: ENEM[materiaKey].nome }
}

function importarAppMd(conteudo, materiaKey, nomeArquivo) {
  const anotacoes = extrairAnotacoes(conteudo)
  if (anotacoes) saveAnotacao(materiaKey, anotacoes)
  const { feitos } = extrairTopicos(conteudo)
  if (feitos.length > 0) {
    const keys = feitos
      .map(texto => findTopicoExportByTitulo(materiaKey, limparTituloTopicoImport(texto))?.key)
      .filter(Boolean)
    if (keys.length > 0) marcarTopicosFeitos(materiaKey, keys)
  }
  importarNotasTopicos(conteudo, materiaKey)
  extrairDificuldades(conteudo, materiaKey)
  const total = feitos.length
  setStatus(`✓ ${ENEM[materiaKey].nome} atualizada — ${total} tópico${total !== 1 ? 's' : ''} importado${total !== 1 ? 's' : ''}`)
  return { tipo: 'app', materia: ENEM[materiaKey].nome, topicos: total }
}

function processarImport(conteudo, nomeArquivo, materiaKeyForcada = null) {
  const materiaDetectada = detectarMateriaDoMd(conteudo)
  const temTopicos       = /##\s+T[oó]picos/.test(conteudo)
  const isAppFormat      = materiaDetectada && temTopicos

  if (isAppFormat && !materiaKeyForcada) {
    importarAppMd(conteudo, materiaDetectada, nomeArquivo)
    atualizarPreviewImport(materiaDetectada, 'app')
  } else {
    const key = materiaKeyForcada || materiaDetectada
    if (!key) { mostrarSeletorMateria(conteudo, nomeArquivo); return }
    importarAvulso(conteudo, key, nomeArquivo)
    atualizarPreviewImport(key, 'avulso')
  }
}

function mostrarSeletorMateria(conteudo, nomeArquivo) {
  document.getElementById('import-arquivo-nome').textContent = nomeArquivo
  document.getElementById('import-conteudo-preview').textContent =
    conteudo.slice(0, 300) + (conteudo.length > 300 ? '...' : '')
  const seletor = document.getElementById('import-seletor')
  seletor.style.display     = 'block'
  seletor.dataset.conteudo  = conteudo
  seletor.dataset.arquivo   = nomeArquivo
  setStatus(`"${nomeArquivo}" aguardando: escolha a matéria abaixo.`)
}

function confirmarImportAvulso() {
  const seletor    = document.getElementById('import-seletor')
  const conteudo   = seletor.dataset.conteudo
  const arquivo    = seletor.dataset.arquivo
  const materiaKey = document.getElementById('import-materia-select').value
  importarAvulso(conteudo, materiaKey, arquivo)
  seletor.style.display = 'none'
  atualizarPreviewImport(materiaKey, 'avulso')
}

function atualizarPreviewImport(materiaKey, tipo) {
  const el = document.getElementById('import-resultado')
  if (!el) return
  const mat = ENEM[materiaKey]
  const { feitos, total, pct } = getProgressoMateria(materiaKey)
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);">
      <i data-lucide="${mat.icone}" style="width:16px;height:16px;color:var(--green);"></i>
      <div style="flex:1;">
        <p style="font-size:13px;font-weight:500;">${mat.nome} atualizada</p>
        <p style="font-size:11px;color:var(--text3);font-family:var(--mono);">
          ${tipo === 'app' ? 'tópicos e anotações importados' : 'anotação anexada'} · ${feitos}/${total} (${pct}%)
        </p>
      </div>
      <a href="materia.html?m=${materiaKey}" class="btn btn-sm btn-ghost">Ver matéria →</a>
    </div>
  `
  if (typeof lucide !== 'undefined') lucide.createIcons()
}
