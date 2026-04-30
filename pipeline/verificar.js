// ══════════════════════════════════════════════════════════════
//  verificar.js — Verificação por votação entre 3 IAs INDEPENDENTES
//  Groq + Cerebras + Gemini votam em paralelo
//  Votação dupla: confirmada + respostaCorreta | Unanimidade → alta confiança
//
//  Uso:
//    node verificar.js              ← verifica todos os rascunhos
//    node verificar.js matematica   ← só uma matéria
//    node verificar.js --suspeitas  ← lista as sinalizadas
// ══════════════════════════════════════════════════════════════

import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore }        from "firebase-admin/firestore";
import pLimit from "p-limit";
import "dotenv/config";

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore();

const DELAY_MS = 2500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CACHE = new Map(); // Cache de respostas já validadas

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const CEREBRAS_MODEL =
  process.env.CEREBRAS_MODEL || "qwen-3-235b-a22b-instruct-2507";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const GEMINI_API_KEY_1 = process.env.GEMINI_API_KEY_1;

const genAI = GEMINI_API_KEY_1 ? new GoogleGenerativeAI(GEMINI_API_KEY_1) : null;
const geminiModel = genAI ? genAI.getGenerativeModel({ model: GEMINI_MODEL }) : null;
let configAvisada = false;

function resumirErro(err) {
  return String(err?.message || err || "erro desconhecido")
    .replace(/\s+/g, " ")
    .slice(0, 140);
}

function limitarTexto(texto, tamanho) {
  const limpo = String(texto || "").replace(/\s+/g, " ").trim();
  return limpo.length > tamanho ? `${limpo.slice(0, tamanho - 3)}...` : limpo;
}

function formatarVotos(verificacao) {
  const votos = new Map((verificacao.votos || []).map((v) => [v.fonte, v]));
  const falhas = new Set((verificacao.falhas || []).map((f) => f.fonte));

  return ["Gemini", "Groq", "Cerebras"]
    .map((fonte) => {
      const voto = votos.get(fonte);
      if (voto) {
        const status = voto.confirmada ? "OK" : "X";
        return `[${fonte}:${status}:${voto.resposta || "?"}]`;
      }
      return `[${fonte}:${falhas.has(fonte) ? "ERR" : "--"}]`;
    })
    .join(" ");
}

function formatarStatus(verificacao) {
  if (verificacao.confianca === "nao_validada") {
    return `NAO VALIDADA - ${verificacao.observacao}`;
  }
  if (verificacao.confirmada === false) {
    return `INCORRETA - IAs sugerem ${verificacao.respostaCorreta}, consenso ${verificacao.consenso}%`;
  }
  if (verificacao.divergencia) {
    return `DIVERGENTE - consenso ${verificacao.consenso}%`;
  }
  if (verificacao.confianca === "baixa") {
    return "BAIXA CONFIANCA";
  }
  if (verificacao.confianca === "media") {
    return `MEDIA CONFIANCA - consenso ${verificacao.consenso}%`;
  }
  return `OK - ALTA CONFIANCA - consenso ${verificacao.consenso}%`;
}

function formatarLinhaQuestao(i, total, q, verificacao) {
  const indice = `[${String(i + 1).padStart(3)}/${total}]`;
  const topico = limitarTexto(q.topico || "Sem topico", 34).padEnd(34);
  const votos = formatarVotos(verificacao).padEnd(48);
  return `${indice} ${topico} ${votos} -> ${formatarStatus(verificacao)}`;
}

// ══════════════════════════════════════════════════════════════
//  RETRY COM BACKOFF EXPONENCIAL
// ══════════════════════════════════════════════════════════════
async function retry(fn, tentativas = 3, delayMs = 2000) {
  for (let i = 0; i < tentativas; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === tentativas - 1) throw e;
      const waitMs = delayMs * (i + 1);
      await sleep(waitMs);
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  CHAVE DE CACHE POR QUESTÃO
// ══════════════════════════════════════════════════════════════
function gerarChaveCache(q) {
  return `${q.pergunta?.slice(0, 50)}-${q.resposta}`.replace(/\s/g, "-");
}

// ══════════════════════════════════════════════════════════════
//  CLIENTES DE API
// ══════════════════════════════════════════════════════════════

async function chamarGroq(prompt) {
  return retry(async () => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 100)}`);
    const data = await res.json();
    return { texto: data.choices[0].message.content, fonte: `Groq/${GROQ_MODEL}` };
  }, 2, 1000);
}

async function chamarCerebras(prompt) {
  return retry(async () => {
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_completion_tokens: 600,
      }),
    });
    if (!res.ok) throw new Error(`Cerebras ${res.status}: ${(await res.text()).slice(0, 100)}`);
    const data = await res.json();
    return { texto: data.choices[0].message.content, fonte: `Cerebras/${CEREBRAS_MODEL}` };
  }, 3, 2000);
}

async function chamarGemini(prompt) {
  return retry(async () => {
    if (!geminiModel) throw new Error("Gemini sem chave");
    const res = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 600,
        responseMimeType: "application/json",
      },
    });
    return { texto: res.response.text(), fonte: `Gemini/${GEMINI_MODEL}` };
  }, 2, 1500);
}

// ══════════════════════════════════════════════════════════════
//  PROMPT
// ══════════════════════════════════════════════════════════════
function montarPrompt(q) {
  const alts = Object.entries(q.alternativas)
    .map(([l, v]) => `${l}) ${v}`)
    .join("\n");

  return `Você é um professor verificando uma questão de múltipla escolha para o ENEM.

QUESTÃO:
${q.pergunta}

ALTERNATIVAS:
${alts}

RESPOSTA MARCADA: ${q.resposta}

Sua tarefa:
1. Resolva ou analise a questão cuidadosamente
2. Determine se a resposta marcada (${q.resposta}) está CORRETA ou INCORRETA
3. Se incorreta, indique qual seria a correta

RETORNE APENAS um JSON válido, sem markdown, sem texto fora do JSON:
{
  "confirmada": true,
  "confianca": "alta",
  "respostaCorreta": "B",
  "observacao": "explicação em 1-2 linhas"
}

Valores:
- "confirmada": true se marcada está certa, false se está errada
- "confianca": "alta", "media" ou "baixa"
- "respostaCorreta": letra da resposta correta (pode ser diferente da marcada)
- "observacao": explicação curta e direta`;
}

// ══════════════════════════════════════════════════════════════
//  PARSING
// ══════════════════════════════════════════════════════════════
function extrairJSON(texto) {
  texto = texto.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  texto = texto.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Nenhum JSON encontrado");
  return JSON.parse(match[0]);
}

// ══════════════════════════════════════════════════════════════
//  VOTAÇÃO TOLERANTE A FALHA (2 de 3 DISPONÍVEIS)
// ══════════════════════════════════════════════════════════════
function consolidarVotos(votos) {
  const validos = votos.filter(Boolean);

  // ESTRATÉGIA: 2 de 3 disponíveis (fallback inteligente)
  if (validos.length < 2) {
    return {
      confirmada: null,
      confianca: "nao_validada",
      divergencia: false,
      consenso: 0,
      observacao: `Apenas ${validos.length} IA(s) respondeu(ram) — não validada`,
      votos: validos.map(v => ({
        fonte:      v.fonte,
        confirmada: v.confirmada,
        confianca:  v.confianca,
        resposta:   v.respostaCorreta,
      })),
      respostaCorreta: null,
    };
  }

  const votosTrue  = validos.filter(v => v.confirmada === true).length;
  const votosFalse = validos.filter(v => v.confirmada === false).length;
  const total      = validos.length;
  
  // DIVERGÊNCIA NÍVEL 1: Discordam em confirmada (true/false)
  const divergenciaConfirmada = votosTrue > 0 && votosFalse > 0;
  
  // DIVERGÊNCIA NÍVEL 2: Mesmo concordando em confirmada, divergem na resposta correta
  const contagem = {};
  validos.forEach(v => {
    const r = v.respostaCorreta || "?";
    contagem[r] = (contagem[r] || 0) + 1;
  });
  const respostasUnicas = Object.keys(contagem).filter(k => k !== "?").length;
  const respostaVencedora = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0][0];
  const divergenciaResposta = respostasUnicas > 1 && contagem[respostaVencedora] !== total;
  
  // Divergência geral
  const divergencia = divergenciaConfirmada || divergenciaResposta;
  
  // VOTAÇÃO DUPLA: maioria estrita em ambos os níveis
  const confirmadaMaioria = votosTrue > votosFalse;
  const consensoTaxa = Math.max(votosTrue, votosFalse) / total;

  // SISTEMA HÍBRIDO: Níveis de confiança realistas
  let confianca;
  if (total === 3 && !divergencia && consensoTaxa === 1) {
    confianca = "alta"; // Unanimidade perfeita (3/3)
  } else if (total >= 2 && !divergencia && consensoTaxa >= 0.66) {
    confianca = "media"; // Maioria clara (2 de 3 ou 2 de 2)
  } else if (divergencia) {
    confianca = "baixa"; // Discordância entre IAs
  } else {
    confianca = "media";
  }

  const observacoes = validos
    .map(v => `[${v.fonte}] ${v.observacao}`)
    .join(" | ");

  return {
    confirmada: confirmadaMaioria,
    confianca,
    divergencia,
    divergenciaConfirmada,
    divergenciaResposta,
    consenso: Math.round(consensoTaxa * 100),
    respostaCorreta: respostaVencedora,
    observacao: observacoes.slice(0, 600),
    votos: validos.map(v => ({
      fonte:      v.fonte,
      confirmada: v.confirmada,
      confianca:  v.confianca,
      resposta:   v.respostaCorreta,
    })),
  };
}

// ══════════════════════════════════════════════════════════════
//  VERIFICAÇÃO COM CACHE + RETRY + TOLERÂNCIA A FALHA
// ══════════════════════════════════════════════════════════════
async function verificarQuestao(q) {
  // ESTRATÉGIA 3: Verificar cache primeiro
  const chaveCache = gerarChaveCache(q);
  if (CACHE.has(chaveCache)) {
    return CACHE.get(chaveCache);
  }

  const prompt = montarPrompt(q);
  const fontes = [
    { fn: chamarGemini, nome: "Gemini", tag: "Gemini" },
    { fn: chamarGroq, nome: "Groq", tag: "Groq" },
    { fn: chamarCerebras, nome: "Cerebras", tag: "Cerebras" },
  ];

  if (!configAvisada) {
    configAvisada = true;
    if (!GROQ_API_KEY) {
      console.warn("\n[config] Groq sem chave. Use GROQ_API_KEY no .env.");
    }
    if (!CEREBRAS_API_KEY) {
      console.warn("\n[config] Cerebras sem chave. Use CEREBRAS_API_KEY no .env.");
    }
    if (!GEMINI_API_KEY_1) {
      console.warn("\n[config] Gemini sem chave. Use GEMINI_API_KEY_1 no .env.");
    }
  }

  // ESTRATÉGIA 2: Retry com backoff + ESTRATÉGIA 4: Chamadas sequenciais com delay controlado
  const votos = [];
  const falhas = [];
  for (const fonte of fontes) {
    try {
      const resultado = await Promise.race([
        fonte.fn(prompt),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 20000))
      ]);
      
      const parsed = extrairJSON(resultado.texto);
      votos.push({
        fonte: fonte.nome,
        confirmada: Boolean(parsed.confirmada),
        confianca: parsed.confianca || "media",
        respostaCorreta: parsed.respostaCorreta || q.resposta,
        observacao: String(parsed.observacao || "").slice(0, 200),
      });
    } catch (err) {
      falhas.push({
        fonte: fonte.nome,
        erro: resumirErro(err),
      });
    }
    await sleep(500); // Delay pequeno entre chamadas
  }

  const resultado = {
    ...consolidarVotos(votos),
    falhas,
    verificadaEm: new Date().toISOString(),
  };

  // ESTRATÉGIA 3: Salvar em cache
  CACHE.set(chaveCache, resultado);
  return resultado;
}

// ══════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════
async function main() {
  const args = process.argv.slice(2);

  // ── Modo --suspeitas ────────────────────────────────────────
  if (args[0] === "--suspeitas") {
    const snap = await db.collection("questoes").where("status", "==", "rascunho").get();
    const suspeitas = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(q => q.verificacao && (
        q.verificacao.confirmada === false ||
        q.verificacao.divergencia === true  ||
        q.verificacao.confianca   === "baixa"
      ))
      .sort((a, b) => {
        const peso = (q) => q.verificacao.confirmada === false ? 0 : q.verificacao.divergencia ? 1 : 2;
        return peso(a) - peso(b);
      });

    if (suspeitas.length === 0) { console.log("\n✅ Nenhuma questão suspeita."); return; }

    console.log(`\n🚨 ${suspeitas.length} questões suspeitas:\n`);
    suspeitas.forEach((q, i) => {
      const v = q.verificacao;
      let status;
      if (v.confirmada === false) {
        status = "❌ INCORRETA";
      } else if (v.divergencia) {
        status = "⚠️  DIVERGENTE";
      } else if (v.confianca === "baixa") {
        status = "🟡 BAIXA CONFIANÇA";
      } else {
        status = "❓ STATUS DESCONHECIDO";
      }
      console.log(`${i+1}. ${status}`);
      console.log(`   ${q.materia} › ${q.topico}`);
      console.log(`   Pergunta: ${(q.pergunta||"").slice(0, 80)}...`);
      console.log(`   Marcada: ${q.resposta} | IAs sugerem: ${v.respostaCorreta} | Consenso: ${v.consenso || "?"}%`);
      if (v.votos?.length) {
        const detalhes = v.votos.map(vt => `${vt.fonte}:${vt.confirmada?"✓":"✗"}(${vt.resposta})`).join("  ");
        console.log(`   Votos:   ${detalhes}`);
      }
      console.log(`   ID Firestore: ${q.id}\n`);
    });
    return;
  }

  // ── Modo verificação ────────────────────────────────────────
  const snap = await db.collection("questoes").where("status", "==", "rascunho").get();
  let questoes = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(q => !q.verificacao);

  if (args[0]) {
    questoes = questoes.filter(q =>
      q.materia?.toLowerCase().includes(args[0].toLowerCase()) ||
      q.materiaId?.toLowerCase() === args[0].toLowerCase()
    );
  }

  if (questoes.length === 0) { console.log("\n✅ Nenhuma questão pendente."); return; }

  console.log(`\n🗳️  Verificando ${questoes.length} questões — SISTEMA HÍBRIDO + FALLBACK INTELIGENTE\n`);
  console.log(`   Gemini/${GEMINI_MODEL} (principal) + Groq (backup) + Cerebras (consenso)\n`);
  console.log(`   ✔ Tolerância a falha: 2 de 3 IAs disponíveis\n`);
  console.log(`   ✔ Retry com backoff exponencial\n`);
  console.log(`   ✔ Limite de concorrência: 3 requisições simultâneas\n`);

  // ESTRATÉGIA 4: Batch async controlado com p-limit
  const limit = pLimit(3); // Máximo 3 requisições simultâneas
  let confirmadas = 0, suspeitas = 0, erros = 0, naoValidadas = 0;

  const tarefas = questoes.map((q, i) =>
    limit(async () => {
      let verificacao;
      try {
        verificacao = await verificarQuestao(q);
      } catch (err) {
        const indice = `[${String(i + 1).padStart(3)}/${questoes.length}]`;
        const topico = limitarTexto(q.topico || "Sem topico", 34).padEnd(34);
        console.log(`${indice} ${topico} ${"".padEnd(48)} -> ERRO - ${resumirErro(err)}`);
        erros++;
        return;
      }

      await db.collection("questoes").doc(q.id).update({ verificacao });
      console.log(formatarLinhaQuestao(i, questoes.length, q, verificacao));

      if (verificacao.confianca === "nao_validada") {
        naoValidadas++;
      } else if (verificacao.confirmada === false) {
        suspeitas++;
      } else if (verificacao.divergencia) {
        suspeitas++;
      } else if (verificacao.confianca === "baixa") {
        suspeitas++;
      } else if (verificacao.confianca === "media") {
        confirmadas++;
      } else {
        confirmadas++;
      }
    })
  );

  await Promise.all(tarefas);

  console.log(`
═══════════════════════════════════════════════════════════
🟢 Validadas (média/alta):   ${confirmadas}
🚨 Suspeitas:                ${suspeitas}
⚪ Não validadas:            ${naoValidadas}
❌ Erros de API:             ${erros}
═══════════════════════════════════════════════════════════

📊 Cache salvo: ${CACHE.size} questões

👉 Ver detalhes das suspeitas:
   node verificar.js --suspeitas
`);
}

main().catch(err => { console.error("Erro fatal:", err); process.exit(1); });
