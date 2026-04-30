// ══════════════════════════════════════════════════════════════
//  gerador.js — Pipeline de geração de questões ENEM com IA
//  Uso: node gerador.js [materia] [conteudo_id] [dificuldade] [quantidade]
//
//  Exemplos:
//    node gerador.js matematica mat_funcoes facil 10
//    node gerador.js ciencias bio_genetica medio 5
//    node gerador.js --all-alta 5          ← gera 5 questões de cada tópico de prioridade alta
// ══════════════════════════════════════════════════════════════

import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

// ── Inicialização ─────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const curriculo  = JSON.parse(readFileSync(join(__dirname, "curriculo.json"), "utf-8"));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_1);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
});
const db = getFirestore();

// ── Constantes ────────────────────────────────────────────────
const DIFICULDADES = ["facil", "medio", "dificil"];
const DELAY_MS = 2000; // pausa entre chamadas pra não estourar rate limit

// ── Prompt de geração ─────────────────────────────────────────
function montarPrompt(topico, materia, dificuldade, quantidade) {
  const nivelDesc = {
    facil:   "conceito básico e direto, sem cálculos complexos",
    medio:   "aplicação prática, pode ter conta simples ou contexto real",
    dificil: "raciocínio mais aprofundado, contexto elaborado ou múltiplos passos",
  };

  return `Você é um especialista em elaboração de questões para o ENEM.

Gere ${quantidade} questões de múltipla escolha sobre "${topico}" (matéria: ${materia}).
Nível de dificuldade: ${dificuldade} — ${nivelDesc[dificuldade]}.

REGRAS OBRIGATÓRIAS:
- Cada questão deve ter exatamente 4 alternativas (A, B, C, D)
- Apenas UMA alternativa está correta
- As questões devem ser diretas, sem enunciados com textos longos ou imagens
- Inclua uma explicação clara de por que a resposta está correta (máx. 3 linhas)
- Não repita questões similares entre si
- Linguagem acessível para ensino médio

FÓRMULAS E SÍMBOLOS MATEMÁTICOS — OBRIGATÓRIO:
- Use notação LaTeX para qualquer fórmula, símbolo ou expressão matemática
- Fórmulas inline (dentro do texto): envolva com $...$ — exemplo: "A função $f(x) = 2x + 3$ é linear"
- Fórmulas em bloco (centralizadas): envolva com $$...$$ — exemplo: $$\\frac{a}{b} = c$$
- Use isso para: frações ($\\frac{1}{2}$), potências ($x^2$), raízes ($\\sqrt{9}$), porcentagem ($50\\%$),
  somatórios, logaritmos ($\\log_2 8$), seno/cosseno ($\\sin(30°)$), inequações ($x \\geq 0$), etc.
- Para matérias sem fórmulas (História, Português, Geografia), ignore esta regra

RETORNE SOMENTE um array JSON válido, sem comentários, sem markdown, sem texto fora do JSON:

[
  {
    "pergunta": "Texto da pergunta aqui?",
    "alternativas": {
      "A": "Primeira opção",
      "B": "Segunda opção",
      "C": "Terceira opção",
      "D": "Quarta opção"
    },
    "resposta": "B",
    "explicacao": "A resposta correta é B porque..."
  }
]`;
}

// ── Validação de questão ──────────────────────────────────────
function validarQuestao(q, indice) {
  const erros = [];

  if (!q.pergunta || typeof q.pergunta !== "string" || q.pergunta.trim().length < 10)
    erros.push(`[${indice}] pergunta inválida ou muito curta`);

  if (!q.alternativas || typeof q.alternativas !== "object")
    erros.push(`[${indice}] alternativas ausentes`);
  else {
    const letras = ["A", "B", "C", "D"];
    for (const l of letras) {
      if (!q.alternativas[l] || typeof q.alternativas[l] !== "string" || q.alternativas[l].trim().length < 2)
        erros.push(`[${indice}] alternativa ${l} inválida ou ausente`);
    }
  }

  if (!["A", "B", "C", "D"].includes(q.resposta))
    erros.push(`[${indice}] campo 'resposta' deve ser A, B, C ou D — recebido: ${q.resposta}`);

  if (!q.explicacao || typeof q.explicacao !== "string" || q.explicacao.trim().length < 10)
    erros.push(`[${indice}] explicação ausente ou muito curta`);

  return erros;
}

// ── Hash para detectar duplicatas ─────────────────────────────
function hashQuestao(pergunta) {
  return createHash("md5")
    .update(pergunta.toLowerCase().replace(/\s+/g, " ").trim())
    .digest("hex")
    .slice(0, 12);
}

function normalizarJsonGemini(texto) {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];

    if (!inString) {
      out += ch;
      if (ch === "\"") inString = true;
      continue;
    }

    if (escaped) {
      if (/["\\/bfnrt]/.test(ch)) {
        out += "\\" + ch;
      } else if (ch === "u" && /^[0-9a-fA-F]{4}$/.test(texto.slice(i + 1, i + 5))) {
        out += "\\u";
      } else {
        out += "\\\\" + ch;
      }
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === "\"") {
      inString = false;
      out += ch;
      continue;
    }

    out += ch;
  }

  if (escaped) out += "\\\\";
  return out;
}

// ── Busca hashes já existentes no Firestore ───────────────────
async function buscarHashesExistentes(materia, topico) {
  const snap = await db
    .collection("questoes")
    .where("materia", "==", materia)
    .where("topico", "==", topico)
    .select("hash")
    .get();

  return new Set(snap.docs.map((d) => d.data().hash));
}

// ── Salva questões no Firestore ───────────────────────────────
async function salvarQuestoes(questoes, meta) {
  const batch = db.batch();
  const salvas = [];

  for (const q of questoes) {
    const ref = db.collection("questoes").doc();
    const hash = hashQuestao(q.pergunta);

    batch.set(ref, {
      materia:      meta.materia,
      materiaId:    meta.materiaId,
      conteudoId:   meta.conteudoId,
      conteudoNome: meta.conteudoNome,
      habilidadeId: meta.habilidadeId,
      topico:       meta.topico,
      dificuldade:  meta.dificuldade,
      pergunta:     q.pergunta.trim(),
      alternativas: {
        A: q.alternativas.A.trim(),
        B: q.alternativas.B.trim(),
        C: q.alternativas.C.trim(),
        D: q.alternativas.D.trim(),
      },
      resposta:     q.resposta,
      explicacao:   q.explicacao.trim(),
      status:       "rascunho",
      hash,
      criadoEm:     Timestamp.now(),
      geradoPor:    "gemini-2.5-flash",
    });

    salvas.push({ id: ref.id, hash });
  }

  await batch.commit();
  return salvas;
}

// ── Geração principal ─────────────────────────────────────────
async function gerarQuestoes({ materiaId, conteudoId, habilidade, dificuldade, quantidade }) {
  const materia        = curriculo[materiaId];
  const conteudo       = materia.conteudos.find((c) => c.id === conteudoId);
  const { topico, id: habilidadeId } = habilidade;

  console.log(`\n🎯 Gerando: [${materiaId}] ${conteudo.nome} › "${topico}" (${dificuldade} × ${quantidade})`);

  // Busca duplicatas antes de gerar
  const hashesExistentes = await buscarHashesExistentes(materia.nome, topico);
  if (hashesExistentes.size > 0) {
    console.log(`   ℹ️  ${hashesExistentes.size} questões já existem para esse tópico`);
  }

  // Chama a IA
  const prompt = montarPrompt(topico, materia.nome, dificuldade, quantidade);
  let resultado;

  try {
    const response = await model.generateContent(prompt);
    resultado = response.response.text();
  } catch (err) {
    console.error(`   ❌ Erro na API Gemini: ${err.message}`);
    return { ok: 0, erros: 1 };
  }

  // Limpa e parseia o JSON retornado
  let jsonLimpo = resultado
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Fix: Gemini gera LaTeX com \ simples dentro de strings JSON.
  // JSON exige \\ para representar barra literal — ex: \frac vira \\frac.
  jsonLimpo = normalizarJsonGemini(jsonLimpo);

  let questoes;
  try {
    questoes = JSON.parse(jsonLimpo);
    if (!Array.isArray(questoes)) throw new Error("Resposta não é um array");
  } catch (err) {
    console.error(`   ❌ JSON inválido retornado pela IA: ${err.message}`);
    console.error(`   Raw: ${resultado.slice(0, 200)}...`);
    return { ok: 0, erros: 1 };
  }

  // Valida cada questão
  const questoesValidas = [];
  for (let i = 0; i < questoes.length; i++) {
    const erros = validarQuestao(questoes[i], i + 1);
    if (erros.length > 0) {
      erros.forEach((e) => console.warn(`   ⚠️  ${e}`));
      continue;
    }

    // Verifica duplicata por hash
    const hash = hashQuestao(questoes[i].pergunta);
    if (hashesExistentes.has(hash)) {
      console.warn(`   ⚠️  [${i + 1}] questão duplicada (hash ${hash}), ignorando`);
      continue;
    }

    questoesValidas.push(questoes[i]);
    hashesExistentes.add(hash); // evita duplicata dentro do mesmo lote
  }

  if (questoesValidas.length === 0) {
    console.error(`   ❌ Nenhuma questão válida após validação`);
    return { ok: 0, erros: 1 };
  }

  // Salva no Firestore
  const salvas = await salvarQuestoes(questoesValidas, {
    materia:      materia.nome,
    materiaId,
    conteudoId,
    conteudoNome: conteudo.nome,
    habilidadeId,
    topico,
    dificuldade,
  });

  console.log(`   ✅ ${salvas.length}/${questoes.length} questões salvas como rascunho`);
  return { ok: salvas.length, erros: questoes.length - salvas.length };
}

// ── Sleep helper ──────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── CLI ───────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  let totalOk = 0, totalErros = 0;

  // Modo: gerar todos os tópicos de prioridade alta
  if (args[0] === "--all-alta") {
    const qtd = parseInt(args[1]) || 5;
    console.log(`\n🚀 Modo --all-alta: gerando ${qtd} questões fáceis para cada tópico de prioridade ALTA\n`);

    for (const [materiaId, materia] of Object.entries(curriculo)) {
      for (const conteudo of materia.conteudos) {
        for (const habilidade of conteudo.habilidades) {
          if (habilidade.prioridade !== "alta") continue;

          const r = await gerarQuestoes({
            materiaId,
            conteudoId: conteudo.id,
            habilidade,
            dificuldade: "facil",
            quantidade: qtd,
          });
          totalOk     += r.ok;
          totalErros  += r.erros;
          await sleep(DELAY_MS);
        }
      }
    }

  // Modo: gerar para um tópico específico
  } else if (args.length >= 3) {
    const [materiaId, conteudoId, dificuldade, qtdStr] = args;
    const quantidade = parseInt(qtdStr) || 10;

    if (!curriculo[materiaId]) {
      console.error(`❌ Matéria "${materiaId}" não encontrada. Opções: ${Object.keys(curriculo).join(", ")}`);
      process.exit(1);
    }

    if (!DIFICULDADES.includes(dificuldade)) {
      console.error(`❌ Dificuldade inválida. Use: facil, medio ou dificil`);
      process.exit(1);
    }

    const materia  = curriculo[materiaId];
    const conteudo = materia.conteudos.find((c) => c.id === conteudoId);
    if (!conteudo) {
      const ids = materia.conteudos.map((c) => c.id).join(", ");
      console.error(`❌ Conteúdo "${conteudoId}" não encontrado em "${materiaId}". IDs disponíveis: ${ids}`);
      process.exit(1);
    }

    for (const habilidade of conteudo.habilidades) {
      const r = await gerarQuestoes({ materiaId, conteudoId, habilidade, dificuldade, quantidade });
      totalOk    += r.ok;
      totalErros += r.erros;
      await sleep(DELAY_MS);
    }

  } else {
    console.log(`
Uso:
  node gerador.js <materia> <conteudo_id> <dificuldade> [quantidade]
  node gerador.js --all-alta [quantidade]

Exemplos:
  node gerador.js matematica mat_funcoes facil 10
  node gerador.js ciencias bio_genetica medio 5
  node gerador.js --all-alta 5

Matérias disponíveis: ${Object.keys(curriculo).join(", ")}
    `);
    process.exit(0);
  }

  console.log(`\n═══════════════════════════════════`);
  console.log(`✅ Total salvo:  ${totalOk} questões`);
  console.log(`❌ Total erros:  ${totalErros}`);
  console.log(`📋 Status:       rascunho (aguardando revisão no painel)`);
  console.log(`═══════════════════════════════════\n`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
