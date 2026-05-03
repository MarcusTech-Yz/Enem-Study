// ── firebase-init.js — Configuração central do Firebase ───────
// Incluir ANTES de materia.js e topico.js nos HTMLs

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAy8HRawioRC-_IOaVj9RqXlU1ASb-vHtU",
  authDomain: "enem-study.firebaseapp.com",
  projectId: "enem-study",
  storageBucket: "enem-study.firebasestorage.app",
  messagingSenderId: "859828535888",
  appId: "1:859828535888:web:85d41615dfb88f140e8755",
  measurementId: "G-N02390WPSK",
}

let _firebaseDb = null
let _firebaseReady = false

function getFirebaseDb() {
  if (_firebaseReady) return _firebaseDb
  if (typeof firebase === 'undefined') return null
  try {
    if (!firebase.apps?.length) firebase.initializeApp(FIREBASE_CONFIG)
    _firebaseDb = firebase.firestore()
    _firebaseReady = true
  } catch (err) {
    console.warn('[firebase-init] Falha ao inicializar Firebase:', err)
  }
  return _firebaseDb
}
