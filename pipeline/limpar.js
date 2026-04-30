// limpar.js — apaga TODAS as questões do Firestore
// Uso: node limpar.js
// ⚠️  irreversível, use com cuidado

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore }        from "firebase-admin/firestore";
import "dotenv/config";

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore();

async function limpar() {
  const snap = await db.collection("questoes").get();
  if (snap.empty) { console.log("Nada pra deletar."); return; }

  console.log(`🗑️  Deletando ${snap.size} questões...`);

  // Firestore só permite batch de 500
  const chunks = [];
  for (let i = 0; i < snap.docs.length; i += 500)
    chunks.push(snap.docs.slice(i, i + 500));

  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  console.log("✅ Banco limpo. Pode rodar o gerador de novo.");
}

limpar().catch(err => { console.error("Erro:", err); process.exit(1); });