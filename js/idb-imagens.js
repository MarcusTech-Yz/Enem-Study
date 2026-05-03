// ── idb-imagens.js — Armazenamento de imagens via IndexedDB ───
// Substitui o sistema de base64 no localStorage, que estoura ~5MB facilmente.
// API pública: mesma interface de antes, mas assíncrona.

const IDB_NAME    = 'enem-study-imagens'
const IDB_VERSION = 1
const IDB_STORE   = 'imagens'

// Abre (ou cria) o banco IndexedDB
function abrirIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        // chave composta: "materiaKey:topicoKey:índice" → guardamos por coleção
        db.createObjectStore(IDB_STORE, { autoIncrement: false })
      }
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

// Chave que identifica a lista de imagens de um tópico ou matéria
function _collKey(materiaKey, topicoKey) {
  return topicoKey ? `${materiaKey}:${topicoKey}` : `${materiaKey}:__geral__`
}

// ── Leitura ───────────────────────────────────────────────────
async function getImagensIDB(materiaKey, topicoKey) {
  try {
    const db  = await abrirIDB()
    const key = _collKey(materiaKey, topicoKey)
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(key)
      req.onsuccess = () => resolve(req.result || [])
      req.onerror   = () => reject(req.error)
    })
  } catch (err) {
    console.error('[idb-imagens] getImagens:', err)
    return []
  }
}

// ── Escrita ───────────────────────────────────────────────────
async function _setImagensIDB(materiaKey, topicoKey, lista) {
  const db  = await abrirIDB()
  const key = _collKey(materiaKey, topicoKey)
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(IDB_STORE, 'readwrite')
    const req = tx.objectStore(IDB_STORE).put(lista, key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

// ── API pública ───────────────────────────────────────────────

// Adiciona uma imagem (base64 string ou Blob/File)
async function addImagemIDB(materiaKey, topicoKey, dado) {
  try {
    // Se vier como File/Blob, converte pra base64
    if (dado instanceof Blob) {
      dado = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload  = () => res(r.result)
        r.onerror = () => rej(r.error)
        r.readAsDataURL(dado)
      })
    }
    const lista = await getImagensIDB(materiaKey, topicoKey)
    lista.push(dado)
    await _setImagensIDB(materiaKey, topicoKey, lista)
    return lista
  } catch (err) {
    console.error('[idb-imagens] addImagem:', err)
    return []
  }
}

// Remove imagem por índice
async function removeImagemIDB(materiaKey, topicoKey, idx) {
  try {
    const lista = await getImagensIDB(materiaKey, topicoKey)
    lista.splice(idx, 1)
    await _setImagensIDB(materiaKey, topicoKey, lista)
    return lista
  } catch (err) {
    console.error('[idb-imagens] removeImagem:', err)
    return []
  }
}

// ── Migração única: localStorage base64 → IndexedDB ──────────
// Roda uma única vez por dispositivo. Apaga as chaves antigas do localStorage.
async function migrarImagensParaIDB() {
  const FLAG = 'enem_idb_migrated_v1'
  if (localStorage.getItem(FLAG)) return

  const prefixos = [
    { regex: /^imagens_topico_([^_]+)_(.+)$/, tipo: 'topico' },
    { regex: /^imagens_([^_]+)$/,             tipo: 'geral'  },
  ]

  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i)
    if (!chave) continue

    for (const { regex, tipo } of prefixos) {
      const match = chave.match(regex)
      if (!match) continue

      const lista = JSON.parse(localStorage.getItem(chave) || '[]')
      if (!Array.isArray(lista) || lista.length === 0) break

      const materiaKey = match[1]
      const topicoKey  = tipo === 'topico' ? match[2] : null

      try {
        const atual = await getImagensIDB(materiaKey, topicoKey)
        if (atual.length === 0) {
          await _setImagensIDB(materiaKey, topicoKey, lista)
          console.info(`[idb-imagens] migrado: ${chave} (${lista.length} imgs)`)
        }
      } catch (err) {
        console.warn('[idb-imagens] falha na migração de', chave, err)
      }
      break
    }
  }

  localStorage.setItem(FLAG, '1')
  console.info('[idb-imagens] migração concluída')
}

// Dispara a migração assim que o módulo carrega, sem bloquear nada
migrarImagensParaIDB().catch(() => {})
