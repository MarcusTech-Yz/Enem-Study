import "dotenv/config";

const API_KEY = process.env.CEREBRAS_API_KEY;
const MODEL = process.env.CEREBRAS_MODEL || "qwen-3-235b-a22b-instruct-2507";

async function listarModelos() {
  console.log("🔍 Tentando listar modelos disponíveis...\n");
  
  try {
    const res = await fetch("https://api.cerebras.ai/v1/models", {
      headers: { 
        "Authorization": `Bearer ${API_KEY.trim()}`,
        "Content-Type": "application/json",
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log("✅ Modelos disponíveis para sua chave:");
      data.data?.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.id}`);
      });
      console.log();
      return data.data?.map(m => m.id) || [];
    } else {
      const text = await res.text();
      console.log(`⚠️  Não consegui listar (${res.status}): ${text.slice(0, 200)}\n`);
      console.log("🔧 Tentando com modelos conhecidos...\n");
      return [];
    }
  } catch (err) {
    console.log(`⚠️  Erro ao listar modelos: ${err.message}\n`);
    return [];
  }
}

async function testarComRetry(tentativa = 1) {
  const MAX_TENTATIVAS = 3;
  const DELAY_BASE = 3000; // 3 segundos
  
  console.log(`[Tentativa ${tentativa}/${MAX_TENTATIVAS}]\n`);
  
  try {
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY.trim()}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,
        max_completion_tokens: 250,
        messages: [
          { role: "system", content: "Voce e um professor objetivo. Responda em portugues do Brasil." },
          { role: "user", content: "Explique em 3 linhas o que e funcao exponencial e de um exemplo simples." },
        ],
      }),
    });

    const text = await res.text();

    // Erro 429 = API sobrecarregada (temporary)
    if (res.status === 429) {
      if (tentativa < MAX_TENTATIVAS) {
        const delay = DELAY_BASE * tentativa;
        console.log(`⚠️  API sobrecarregada (429) — Aguardando ${delay / 1000}s...\n`);
        await new Promise(r => setTimeout(r, delay));
        return testarComRetry(tentativa + 1);
      } else {
        throw new Error(`Cerebras 429: API ainda sobrecarregada após ${MAX_TENTATIVAS} tentativas`);
      }
    }

    if (!res.ok) {
      throw new Error(`Cerebras ${res.status}: ${text.slice(0, 300)}`);
    }

    return text;
  } catch (err) {
    throw err;
  }
}

async function main() {
  if (!API_KEY) {
    throw new Error("CEREBRAS_API_KEY nao encontrada no .env");
  }

  // Listar modelos disponíveis
  await listarModelos();

  console.log(`📝 Testando com MODEL = "${MODEL}"\n`);

  const text = await testarComRetry();

  const data = JSON.parse(text);
  console.log("✅ modelo:", data.model);
  console.log("\n📄 resposta:\n");
  console.log(data.choices?.[0]?.message?.content || "(sem conteúdo)");

  if (data.usage) {
    console.log("\n📊 uso:", data.usage);
  }
}

main().catch((err) => {
  console.error("\n❌ Erro no teste Cerebras:", err.message);
});
