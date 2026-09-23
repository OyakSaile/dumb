# Levels — templates and a worked example

Headers below are in Portuguese as an example; render them in the user's language.

## `dev` (default) — about 250 words

```
🧠 O que estamos fazendo
<1–2 sentences. Names the story / file / function / command being touched right now.>

🎯 Por quê (o quadro maior)
<At most 4 sentences: the goal this serves; where it sits (epic, roadmap,
 dependency chain); what breaks or gets harder without it; why now and not later.>

🪄 Analogia
<2–3 sentences. One real-world analogy, each part mapped to one part of this step.>

👀 Olho de sênior
<2 bullets, one sentence each: trade-offs or pitfalls a senior would watch for right here.>

🤔 Pra pensar
<One question the user can answer to check they got it. Omit if it would be forced.>

➡️ Próximo passo: <one line>
```

## `zero` — about 300 words, the analogy carries the explanation

```
🪄 Analogia
<3–4 sentences. The real-world analogy first; the rest of the answer refers back to it.>

🧠 O que estamos fazendo
<2–3 sentences. The step, told through the analogy; every technical word appears as
 "term (plain-words meaning)" the first time.>

🎯 Por quê
<2–3 sentences: what goes wrong without it, in the analogy's terms, then in the
 project's terms. On a BMAD story this slot still names the epic, the stories it
 builds on and the story it blocks — in plain words, not numbers alone.>

🤔 Pra pensar
<One question answerable from the analogy.>

➡️ Próximo passo: <one line>
```

No `👀 Olho de sênior` section at this level.

## `terms` — 3 to 8 items, no analogy

```
📚 Termos deste passo
- **<term>** — <one-sentence meaning>. Aqui: <one concrete example from this task>.
- ...

➡️ Próximo passo: <one line>
```

## Worked example (`dev`, Portuguese user, BMAD story)

Situation: story 5.6 "Retry com backoff para entrega de webhook", the migration `webhook_retries` was just written, user asks "por que a gente tá fazendo essa story?".

```
🧠 O que estamos fazendo
Criamos a migration `webhook_retries` da story 5.6: a tabela que guarda cada webhook de pagamento falho e quando retentar.

🎯 Por quê (o quadro maior)
5.6 é do Épico 5 (Pagamentos): "um Pix confirmado vira pedido pago, sempre". 5.3 (webhook) e 5.4 (idempotência) garantem que a confirmação chega e não roda duas vezes — mas não que chega se o processador estiver fora naquele segundo. Sem retry, um pagamento real some, por isso 5.7 (tela de status) está bloqueada: não dá pra mostrar "pago" se ela pode sumir. O AC 2 fixa o formato: 1m → 5m → 25m → 2h, 5 tentativas.

🪄 Analogia
Carteiro com encomenda registrada: se ninguém atende, não joga fora; deixa aviso e volta em intervalos cada vez maiores. Depois de 5 tentativas vai pra agência (dead letter) e alguém busca.

👀 Olho de sênior
- `next_attempt_at` precisa de índice: o job pergunta "o que já venceu?" todo minuto.
- Retry sem a idempotência de 5.4 = pagamento duplicado; o reprocessamento passa pelo mesmo caminho.

🤔 Pra pensar
Por que intervalos crescentes em vez de tentar a cada minuto?

➡️ Próximo passo: o job que lê `next_attempt_at <= now()`.
```
