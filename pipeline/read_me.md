#  Gerador de Questões ENEM

Pipeline de geração automática de questões com Gemini Flash + Firebase Firestore.

## Setup (5 minutos)

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```
Edite o `.env` com suas chaves:
- **GEMINI_API_KEY** → https://aistudio.google.com/app/apikey (gratuito)
- **FIREBASE_SERVICE_ACCOUNT** → Firebase Console > Configurações > Contas de serviço > Gerar nova chave privada

>  Dica: para colocar o JSON do Firebase em uma linha só, rode:
> ```bash
> cat serviceAccount.json | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin)))"
> ```

### 3. Colocar os arquivos juntos
```
gerador/
  gerador.js
  curriculo.json
  package.json
  .env
```

---

## Como usar

### Gerar questões de um conteúdo específico
```bash
node gerador.js <materia> <conteudo_id> <dificuldade> [quantidade]
```

Exemplos:
```bash
# 10 questões fáceis de Funções (Matemática)
node gerador.js matematica mat_funcoes facil 10

# 5 questões médias de Genética (Ciências)
node gerador.js ciencias bio_genetica medio 5

# 8 questões difíceis de Ditadura Militar (História)
node gerador.js historia hist_brasil_republicano dificil 8
```

### Gerar todos os tópicos de alta prioridade de uma vez
```bash
node gerador.js --all-alta 5
```
> Isso gera 5 questões fáceis para CADA tópico marcado como `"prioridade": "alta"` no currículo.

---

## Matérias e IDs disponíveis

| Matéria | ID |
|---|---|
| Matemática | `matematica` |
| Português | `portugues` |
| Ciências da Natureza | `ciencias` |
| História | `historia` |
| Geografia | `geografia` |
| Filosofia e Sociologia | `filosofia` |

Para ver os `conteudo_id` de cada matéria, abra o `curriculo.json`.

---

## O que acontece após a geração

As questões chegam no Firestore com `status: "rascunho"`.  
Você revisa no **painel de administração** do site e aprova → vira `"publicado"`.

---

## Estrutura de cada questão no Firestore

```json
{
  "materia": "Matemática",
  "materiaId": "matematica",
  "conteudoId": "mat_funcoes",
  "conteudoNome": "Funções",
  "habilidadeId": "H19",
  "topico": "Função do 1º grau (linear)",
  "dificuldade": "facil",
  "pergunta": "Se f(x) = 2x + 3, qual é o valor de f(4)?",
  "alternativas": { "A": "8", "B": "10", "C": "11", "D": "14" },
  "resposta": "C",
  "explicacao": "f(4) = 2×4 + 3 = 8 + 3 = 11. Resposta C.",
  "status": "rascunho",
  "hash": "a3f9c12d4e7b",
  "criadoEm": "2026-04-25T...",
  "geradoPor": "gemini-1.5-flash"
}
```

---

## Proteção contra duplicatas

O script calcula um hash MD5 da pergunta antes de salvar.  
Se já existir uma questão com o mesmo hash para aquele tópico, ela é ignorada automaticamente.