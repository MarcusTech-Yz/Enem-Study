// ── Conquista Toast — estilo Steam ─────────────────────────────────────────
// Coloca no final do <body> via initToastSystem()
// Som: coloca o arquivo em assets/achievement.mp3 (ou .ogg / .wav)

const TOAST_SOUND_PATH = 'assets/Steam.mp3'

let toastQueue = []
let toastShowing = false

function initToastSystem() {
  // Cria o container fixo no canto inferior direito
  if (document.getElementById('conquista-toast-container')) return
  const el = document.createElement('div')
  el.id = 'conquista-toast-container'
  document.body.appendChild(el)
}

function showConquistaToast(def) {
  toastQueue.push(def)
  if (!toastShowing) processToastQueue()
}

function processToastQueue() {
  if (!toastQueue.length) { toastShowing = false; return }
  toastShowing = true
  const def = toastQueue.shift()

  // Som
  try {
    const audio = new Audio(TOAST_SOUND_PATH)
    audio.volume = 0.55
    audio.play().catch(() => {}) // silencia erro se bloqueado pelo browser
  } catch (e) {}

  // Monta o toast
  const toast = document.createElement('div')
  toast.className = 'conquista-toast'
  toast.innerHTML = `
    <div class="ct-shine"></div>
    <div class="ct-icon">
      <i data-lucide="${def.icon}"></i>
    </div>
    <div class="ct-body">
      <div class="ct-kicker">Conquista desbloqueada!</div>
      <div class="ct-title">${def.nome}</div>
      <div class="ct-desc">${def.descricao}</div>
    </div>
  `

  const container = document.getElementById('conquista-toast-container')
  container.appendChild(toast)

  // Inicializa ícone lucide no toast
  if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [toast] })

  // Anima entrada
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('ct-visible'))
  })

  // Saída após 4.5s
  setTimeout(() => {
    toast.classList.remove('ct-visible')
    toast.classList.add('ct-hiding')
    toast.addEventListener('transitionend', () => {
      toast.remove()
      setTimeout(processToastQueue, 300) // delay entre toasts
    }, { once: true })
  }, 4500)
}

// Hook no checkConquistas — chama isso em vez do checkConquistas direto
function checkConquistasComToast() {
  if (typeof getConquistasDefs === 'undefined') return []
  const newIds = checkConquistas()
  if (!newIds.length) return newIds

  const defs = getConquistasDefs()
  newIds.forEach(id => {
    const def = defs.find(d => d.id === id)
    if (def) showConquistaToast(def)
  })
  return newIds
}