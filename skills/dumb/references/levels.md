# Levels — templates and a worked example

Headers below are in Portuguese as an example; render them in the user's language.

## `dev` (default) — about 150 words

```
🧠 O que estamos fazendo
<1–2 sentences naming the story / file / function / command>

🎯 Por quê (o quadro maior)
<goal served · where it sits (epic, roadmap, dependency chain) ·
 what breaks without it · why now>

🪄 Analogia
<one real-world analogy, parts mapped 1:1>

👀 Olho de sênior
<1–2 trade-offs or pitfalls right here>

🤔 Pra pensar
<one check-your-understanding question; omit if forced>

➡️ Próximo passo: <one line>
```

## `zero` — about 200 words, the analogy carries the explanation

```
🪄 Analogia
<the real-world analogy first; the rest of the answer refers back to it>

🧠 O que estamos fazendo
<the step, told through the analogy; every technical word appears as
 "term (plain-words meaning)" the first time>

🎯 Por quê
<what goes wrong without it, in the analogy's terms, then in the project's terms.
 On a BMAD story this slot still names the epic, the stories it builds on and the
 story it blocks — in plain words, not numbers alone>

🤔 Pra pensar
<one question answerable from the analogy>

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
Criamos a migration `webhook_retries` da story 5.6: uma tabela que guarda cada webhook de pagamento que falhou e quando tentar de novo.

🎯 Por quê (o quadro maior)
5.6 é do Épico 5 (Pagamentos), cuja meta é "um Pix confirmado vira pedido pago, sempre". 5.3 (webhook) e 5.4 (idempotência) garantem que a confirmação chega e não é processada duas vezes, mas nada garante que ela chega se o processador de pedidos estiver fora naquele segundo. Sem retry, um pagamento real some. 5.7 (tela de status) está bloqueada por isso: não dá pra mostrar "pago" se a confirmação pode se perder. O AC 2 define o formato: 1m → 5m → 25m → 2h, 5 tentativas.

🪄 Analogia
Carteiro com encomenda registrada: se ninguém atende, ele não joga fora; deixa aviso e volta em intervalos cada vez maiores. Depois de 5 tentativas a encomenda vai pra agência (dead letter) e alguém precisa buscar.

👀 Olho de sênior
- `next_attempt_at` precisa de índice: o job vai perguntar "o que já venceu?" a cada minuto.
- Retry sem a idempotência de 5.4 = pagamento duplicado; o reprocessamento tem que passar pelo mesmo caminho.

🤔 Pra pensar
Por que intervalos crescentes em vez de tentar a cada minuto?

➡️ Próximo passo: o job que lê `next_attempt_at <= now()`.
```
