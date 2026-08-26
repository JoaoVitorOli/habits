# Habits — PRD

App pessoal de acompanhamento de hábitos para Android (celular e tablet), com identidade visual
própria: escuro, roxo, tipografia condensada.

Não vai para loja. Não tem paywall, onboarding de marketing, telemetria ou conta de terceiros
além do login opcional do Google.

Este documento é a fonte da verdade das decisões. Ele foi produzido por entrevista (`/grill-me`)
e todas as decisões abaixo foram confirmadas explicitamente.

---

## 1. Princípios que governam desempates

Quando uma decisão de implementação não estiver escrita aqui, decida por esta ordem:

1. **Local é a verdade.** Nenhuma tela espera rede para renderizar. Nunca.
2. **O domínio é puro.** Regra difícil vive em `src/domain/`, sem React, sem banco, sem relógio global.
3. **Poucos arquivos profundos.** Um arquivo por conceito, não por função. Se um módulo tem uma
   função exportada e 8 linhas, ele não devia existir.
4. **O design é fechado.** Uma fonte, um tema, 10 cores de accent, grade de 8. Não há valor solto.
5. **Fatia vertical.** Toda entrega atravessa UI → domínio → persistência. Nunca "criar as tabelas".

---

## 2. Escopo

### Dentro
Criar/editar/arquivar/excluir/reordenar hábitos · ícone Lucide ou emoji · cor por hábito ·
agenda por dias da semana ou N vezes por semana · meta diária (`targetPerDay`) ·
marcação de hoje e de dias passados · streak atual, recorde e meta de sequência ·
heatmap estilo GitHub · calendário mensal navegável · nota por dia ·
tela de visão geral com estatísticas · lembrete diário por hábito ·
widget na tela inicial com marcação · login Google opcional com sync ·
export/import JSON · layout responsivo para tablet.

### Fora, por decisão
Categorias e filtros · imagem custom como ícone · tema claro · i18n · iOS · web ·
múltiplos lembretes por hábito · hábitos de quantidade com unidade livre (km, minutos) ·
compartilhamento social · paywall.

---

## 3. Decisões fechadas

| # | Tema | Decisão |
|---|---|---|
| 1 | Plataforma | Android apenas. Celular **e** tablet. `orientation: default`. |
| 2 | Idioma | pt-BR fixo, textos direto no código, sem camada de i18n. |
| 3 | Tema | Escuro travado (`userInterfaceStyle: "dark"`). Ignora o tema do sistema. |
| 4 | Persistência | SQLite local é a fonte da verdade. Nunca se lê da rede para renderizar. |
| 5 | Conta | Login Google via Supabase, **opcional**. Sem login o app é 100% funcional. |
| 6 | Sync | Delta por `updated_at`, last-write-wins por linha, soft delete. |
| 7 | Tipo de hábito | Binário, com `targetPerDay` opcional (default 1). |
| 8 | Agenda | `daysOfWeek` (subconjunto) **ou** `timesPerWeek` (N). Dia não agendado é neutro. |
| 9 | Virada do dia | `dayStartHour` configurável, default **04:00**. |
| 10 | Datas | `YYYY-MM-DD` em horário local. Nunca UTC, nunca timestamp para "dia". |
| 11 | Edição | Passado editável sem limite. Futuro renderizado apagado e inerte. |
| 12 | Cor | Uma por hábito, de paleta fechada de 10. Roxo `#6C4BF6` é default e cor do chrome. |
| 13 | Ícone | ~150 ícones Lucide curados + aba de emoji. Sem imagem custom. |
| 14 | Recursos | Descrição, `streakGoal`, nota por dia, arquivar. Sem categorias. |
| 15 | Lembrete | Um `reminderTime` por hábito, só nos dias agendados. |
| 16 | Navegação | Stack única, sem tabs. |
| 17 | Home | Dois modos: card com grid (padrão) e lista compacta. Preferência persistida. |
| 18 | Marcar | Toque no card (home); arrastar (detalhe). Grid da home é só leitura. |
| 19 | Visão geral | Uma tela, três seções: calendário de anéis, números, matriz hábitos × 30 dias. |
| 20 | Ajustes | Conta/sync · arquivados + reordenar · export/import JSON · virada do dia e início da semana. |
| 21 | Widget | Hábito único, 3 tamanhos, toque marca hoje. Lê um snapshot JSON. |
| 22 | Tipografia | Barlow Condensed, família única, 300–700, app inteiro e widget. |
| 23 | Estilo | StyleSheet + tokens rígidos. **Sem NativeWind.** |
| 24 | Banco | `expo-sqlite` + Drizzle, schema espelhando o Supabase 1:1. |
| 25 | Testes | Vitest sobre domínio puro. Repositórios e telas fora de teste, por decisão. |
| 26 | Build | Development build (EAS) obrigatório. Expo Go está fora. |

### Por que não NativeWind

O estável (`4.2.6`) é anterior a RN 0.86 / New Architecture / React Compiler; a versão feita para
esse stack (`5.0.0-preview.4`) está em preview. O ganho da lib — escrever utilitário arbitrário
rápido — quase não se aplica a um design fechado de ~15 componentes. E `className` animado com
Reanimated 4 é a área historicamente mais atritada. O único ganho perdido são os variantes de
breakpoint, substituídos por um `useBreakpoint()` de ~20 linhas.

---

## 4. Modelo de dados

Mesmo schema nos dois lados (SQLite e Postgres), para que o sync seja um laço burro e não um
tradutor. Todas as tabelas nascem com `id`, `updated_at` e `deleted_at` **desde a fatia 1**, mesmo
que o sync só chegue na fatia 9 — assim sync não exige migration, só código novo.

### `habits`

| coluna | tipo | nota |
|---|---|---|
| `id` | TEXT PK | UUID v7 (ordenável por tempo) |
| `user_id` | TEXT NULL | preenchido no primeiro login |
| `name` | TEXT NOT NULL | |
| `description` | TEXT NULL | |
| `icon` | TEXT NOT NULL | `lucide:dumbbell` ou `emoji:📚` |
| `color` | TEXT NOT NULL | chave da paleta, ex. `violeta`. Nunca hex. |
| `schedule_kind` | TEXT NOT NULL | `daysOfWeek` \| `timesPerWeek` |
| `schedule_days` | INTEGER NULL | bitmask; dom=1, seg=2, ter=4 … sáb=64. Só em `daysOfWeek` |
| `schedule_times` | INTEGER NULL | N por semana. Só em `timesPerWeek` |
| `target_per_day` | INTEGER NOT NULL | default 1 |
| `streak_goal` | INTEGER NULL | meta de sequência em dias |
| `reminder_time` | TEXT NULL | `HH:mm` |
| `position` | INTEGER NOT NULL | ordem na home; sincroniza |
| `archived_at` | TEXT NULL | |
| `created_at` | TEXT NOT NULL | ISO |
| `updated_at` | TEXT NOT NULL | ISO — chave do sync |
| `deleted_at` | TEXT NULL | soft delete |

### `completions`

| coluna | tipo | nota |
|---|---|---|
| `id` | TEXT PK | |
| `habit_id` | TEXT NOT NULL | |
| `day` | TEXT NOT NULL | `YYYY-MM-DD` do **dia lógico** |
| `count` | INTEGER NOT NULL | quantas vezes no dia; `>= target_per_day` = completo |
| `completed_at` | TEXT NOT NULL | timestamp real da última marcação |
| `updated_at` | TEXT NOT NULL | |
| `deleted_at` | TEXT NULL | |

`UNIQUE(habit_id, day)`. Índice em `(habit_id, day)` e em `updated_at`.

> **Refinamento em relação à entrevista.** Na pergunta 3 falei em "uma linha por marcação". Ao
> desenhar o sync ficou claro que **uma linha por (hábito, dia) com `count`** é estritamente
> melhor: o toggle vira idempotente, o last-write-wins passa a ter uma linha canônica por dia, e
> o snapshot do widget sai de um `SELECT` direto. Nada se perde — `completed_at` guarda o horário
> da última marcação, que é a única coisa que a linha-por-marcação daria a mais.

### `day_notes`

`id` · `habit_id` · `day` · `text` · `updated_at` · `deleted_at`. `UNIQUE(habit_id, day)`.

### `settings`

Linha única (`id = 'local'`): `day_start_hour` (default 4), `week_starts_on` (0 = domingo),
`home_view` (`grid` | `compact`), `updated_at`.

### `sync_state` — **local, nunca sincroniza**

`user_id` · `last_pulled_at` · `last_pushed_at`.

---

## 5. Regras de domínio

Todas moram em `src/domain/`, são funções puras sobre dados simples e recebem o relógio por
parâmetro. São o que tem teste.

### 5.1 Dia lógico (`calendar.ts`)

O dia lógico de um instante é a data local **depois de subtrair `dayStartHour` horas**.
Com o default de 4h, uma marcação às 00:40 de terça pertence ao dia lógico de segunda.
`day` nunca é derivado de UTC.

### 5.2 Dia agendado (`schedule.ts`)

- `daysOfWeek`: agendado se o bit do dia da semana está ligado em `schedule_days`.
- `timesPerWeek`: **todo** dia é elegível; o compromisso é semanal, não diário.

### 5.3 Streak (`streak.ts`)

**Modo `daysOfWeek`** — caminha de hoje para trás:
- dia agendado e completo → soma 1
- dia agendado e incompleto → **para**, com uma exceção: **hoje incompleto não quebra**, apenas
  não soma (o dia ainda não acabou)
- dia não agendado → pula: não soma e não quebra

**Modo `timesPerWeek`** — agrupa por semana (respeitando `week_starts_on`) e caminha de trás:
- semana com `>= N` dias completos → soma 1 semana
- semana com menos → para, com a mesma exceção para a **semana corrente**

**Recorde** usa a mesma regra sobre todo o histórico, sem a exceção do período corrente.

**Meta de sequência** (`streak_goal`): progresso = `min(1, streakAtual / streakGoal)`.

### 5.4 Percentual do mês (`stats.ts`)

- `daysOfWeek`: `diasCompletos / diasAgendadosNoMês`
- `timesPerWeek`: `min(1, diasCompletos / (N × semanasQueTocamOMês))`

**Dia perfeito** (visão geral): dia em que havia pelo menos um hábito agendado e **todos** foram
completos.

### 5.5 Snapshot do widget (`widget-snapshot.ts`)

```jsonc
{
  "v": 1,
  "generatedAt": "2026-08-22T14:03:00.000Z",
  "habits": [
    {
      "id": "...", "name": "Treino", "icon": "lucide:dumbbell", "color": "vermelho",
      "targetPerDay": 1, "currentStreak": 23,
      "days": { "2026-08-22": 1, "2026-08-21": 1 }   // últimos 120 dias, só os marcados
    }
  ]
}
```

Gravado em `AsyncStorage` sob `widget.snapshot` a cada mutação (com debounce de 300 ms) e
sempre que o app vai para background. O widget **nunca** consulta o SQLite: o contexto headless
não garante acesso ao banco.

### 5.6 Sync (`sync.ts`)

O motor é puro: recebe as linhas locais sujas, as linhas remotas novas e um relógio; devolve o
que enviar e o que aplicar. Quem fala com a rede é `data/supabase.ts`.

- **push**: linhas com `updated_at > last_pushed_at` → upsert remoto
- **pull**: linhas remotas com `updated_at > last_pulled_at` → upsert local
- **conflito**: maior `updated_at` vence, **linha inteira** (sem merge por campo)
- **delete**: só `deleted_at`. Purga física apenas acima de 90 dias, no aparelho
- **primeiro login**: todas as linhas locais recebem `user_id` e `updated_at = agora`, e sobem — é
  um merge, não um "escolha entre local e nuvem"
- **logout**: dados locais permanecem; `user_id` e `sync_state` são limpos

---

## 6. Design

### 6.1 Tipografia

**Barlow Condensed**, via `@expo-google-fonts/barlow-condensed`. Pesos 300, 400, 500, 600, 700.
Uma família para tudo, inclusive o widget.

| variante | tamanho | peso | tratamento |
|---|---|---|---|
| `display` | 92 / lh 0.85 | 700 | numeral gigante do card de streak |
| `title` | 28 | 600 | caixa alta, tracking `0.06em` |
| `heading` | 20 | 600 | |
| `body` | 16 | 400 | descrição, notas |
| `label` | 13 | 500 | caixa alta, tracking `0.16em` |
| `caption` | 12 | 400 | |

Todo número em coluna usa `fontVariant: ['tabular-nums']`.
Rótulo em caixa alta **sempre** leva tracking — sem isso a condensada vira um bloco ilegível.
Em pt-BR os rótulos são mais largos do que em inglês: reserve largura, nunca trunque
`ARRASTE PARA COMPLETAR`.

### 6.2 Cor

Neutros com viés violeta — cinza puro lê como não-escolhido.

| token | hex |
|---|---|
| `ground` | `#0A0710` |
| `surface` | `#14101C` |
| `surfaceRaised` | `#1B1826` |
| `surfaceOverlay` | `#221E30` |
| `line` | `rgba(255,255,255,0.09)` |
| `ink` | `#F3F1F8` |
| `inkMuted` | `#9A93AD` |
| `inkFaint` | `#5D5670` |
| `inkDisabled` | `#3A3547` |

Accents de hábito — 10, luminância normalizada para que nenhum "grite" mais que outro:

`violeta #6C4BF6` (default) · `indigo #4C6BF5` · `azul #2E90E8` · `ciano #17B6BE` ·
`verde #34B978` · `lima #92C13D` · `ambar #DFA22C` · `laranja #EE7B42` ·
`vermelho #EE5757` · `rosa #E94C93`

Todo chrome do app (botões primários, foco, seletores, anéis da visão geral) usa **violeta**,
independente da cor dos hábitos. A cor do hábito tinge apenas: quadrado do ícone (a 16% de
opacidade), bolinhas do grid, chips e o glow do card daquele hábito.

Semânticas, separadas do accent: `sucesso #34B978` · `perigo #EE5757`.

### 6.3 Espaço, raio, elevação

Espaçamento em múltiplos de 8, com um único meio-passo:
`xs 4` · `sm 8` · `md 16` · `lg 24` · `xl 32` · `2xl 40` · `3xl 64`.
**Nenhum número solto no código.**

Raios: `sm 8` · `md 12` · `lg 16` · `xl 22` · `pill 999`.

No escuro, profundidade se faz com **luz**, não com sombra preta: superfície mais alta é mais
clara e ganha uma borda superior de `rgba(255,255,255,0.04)`. Sombra preta só sob elementos que
flutuam de verdade (bottom sheet, FAB), sempre difusa e nunca dura.

### 6.4 Breakpoints

`compact < 600dp` · `medium 600–899dp` · `expanded >= 900dp`, via `useBreakpoint()`.

- Home: 1 coluna (compact) · 2 (medium) · 3 (expanded)
- Detalhe: coluna única (compact); no medium e expanded, card de streak + chips à esquerda e
  heatmap/calendário à direita
- Tipografia e célula do grid crescem em **degraus fixos** por breakpoint, nunca por escala
  contínua sobre a largura da tela

---

## 7. Telas

### 7.1 Home
Lista dos hábitos ativos, ordenada por `position`. Cabeçalho com título, alternador de modo
(grid / compacta) e acesso a Visão geral e Ajustes. FAB para criar.

- **Modo grid**: card por hábito com ícone tingido, nome, streak atual, mini-heatmap das últimas
  ~14 semanas e botão de marcar hoje. **O grid do card é só leitura.**
- **Modo compacta**: uma linha por hábito — ícone, nome, streak, botão de marcar.
- Vazio: um estado desenhado, não uma frase solta.

### 7.2 Detalhe do hábito
Voltar · editar · arquivar. Ícone, nome, descrição.
Card de streak: `EDITAR META`, numeral gigante, `SUA META / <nome>`,
`RECORDE` e `SEQUÊNCIA ATUAL`, com numerais fantasma ao fundo.
Heatmap com rótulos de mês e de dia da semana. Calendário mensal navegável — hoje contornado,
dia completo preenchido, dia com nota com um ponto indicador, pressão longa abre a nota.
Bolinhas do passado alternam ao toque. Rodapé fixo: **ARRASTE PARA COMPLETAR**.

### 7.3 Formulário (modal)
Nome · descrição · ícone (busca em Lucide + aba de emoji) · cor (as 10) · agenda (dias da semana
ou N por semana) · `targetPerDay` · meta de sequência · lembrete. Pré-visualização do card ao vivo.

### 7.4 Visão geral
Calendário mensal onde cada dia é um anel preenchido na proporção dos hábitos cumpridos (violeta,
nunca cor de hábito) · linha de números (taxa do mês, melhor streak vivo, dias perfeitos) ·
matriz hábitos × últimos 30 dias. Tocar num dia abre o resumo daquele dia.

### 7.5 Ajustes
Conta Google e estado do sync ("sincronizado há X min", "sincronizar agora") · hábitos arquivados
(restaurar / excluir de vez) · reordenar hábitos · exportar e importar JSON · virada do dia ·
primeiro dia da semana · versão.

### 7.6 Widget
Hábito escolhido na hora de adicionar, numa Activity de configuração própria. **Um widget só,
redimensionável**, com três desenhos escolhidos pelo tamanho medido: 2×2 (ícone, nome, streak),
4×2 (+ faixa da semana), 4×4 (matriz de 14 semanas). Toque na bolinha de hoje marca/desmarca com
atualização otimista, grava no banco pelo headless task e reescreve o snapshot.

---

## 8. Fatias verticais

Cada fatia atravessa UI → domínio → persistência e termina em algo utilizável.
**Responsividade de tablet não é fatia: é requisito de todas elas.**
Um commit por passo, conventional commits, em português.

### Fatia 0 · Fundação
Limpar o boilerplate do template · Barlow Condensed carregada · `src/ui/theme.ts` com todos os
tokens · `useBreakpoint()` · Vitest rodando · regra de lint que impede `src/domain/` de importar
React, banco ou UI · `.cursorrules` · development build no EAS.
*Não entrega tela. Nada anda sem ela.*

### Fatia 1 · Criar um hábito e vê-lo na home
Formulário (nome, ícone, cor, agenda) → Drizzle/SQLite → card na home com grid vazio.
Testes: `schedule.ts`.

### Fatia 2 · Marcar hoje
Botão no card → `completions` gravada → bolinha acende com spring e háptico → streak recalculado.
Testes: `calendar.ts` (virada às 4h), `streak.ts` (ambos os modos, exceção do dia corrente).

### Fatia 3 · Tela de detalhe
Card de streak, heatmap, calendário mensal, arrastar para completar, alternar dias passados.
Testes: `stats.ts` (% do mês nos dois modos).
*A partir daqui o app é usável de verdade — comece a usar todo dia.*

### Fatia 4 · Gerenciar hábito
Editar, arquivar, restaurar, excluir (soft), reordenar por arraste.

### Fatia 5 · Meta de sequência e notas do dia
`streak_goal` com progresso no card grande · `day_notes` com pressão longa e ponto indicador.

### Fatia 6 · Visão geral
Calendário de anéis, números, matriz. Testes: dias perfeitos, agregação por dia.

### Fatia 7 · Lembretes
`expo-notifications`, permissão Android 13+, um serviço único de reagendamento
(salvar / arquivar / excluir / boot).

### Fatia 8 · Widget
`react-native-android-widget`, três tamanhos, snapshot JSON, headless task de escrita.
Testes: `widget-snapshot.ts`.

### Fatia 9 · Login Google e sync
Supabase auth · schema espelhado · push/pull/merge · tela de estado do sync.
Testes: `sync.ts` (delta, conflito, soft delete, merge do primeiro login).

### Fatia 10 · Exportar e importar JSON
Storage Access Framework, arquivo único, reimportação idempotente.

---

## 9. Dependências externas de você

Nada disso bloqueia as fatias 0–8.

- **Conta EAS** para gerar o development build — fatia 0
- **Projeto Supabase**: `URL` e `anon key` — fatia 9
- **Google OAuth Client ID** no Google Cloud Console, com o SHA-1 do development build — fatia 9

---

## 10. Registro de mudanças do PRD

| data | mudança |
|---|---|
| 2026-08-22 | Versão inicial, produzida por entrevista. 26 decisões fechadas. |
| 2026-08-24 | Widget: um receiver redimensionável em vez de três entradas no seletor. Os três tamanhos viraram três layouts sobre o tamanho medido — mesma promessa, sem triplicar o seletor. |
| 2026-08-24 | Sync: `settings` fica fora do espelho no Postgres. A virada do dia e o primeiro dia da semana são escolha deste aparelho, e a tabela nasceu sem `user_id` e sem `deleted_at` — sincronizá-la seria inventar coluna. O estado do sync é um bloco em Ajustes, como manda a 7.5, e não uma tela própria. |
| 2026-08-26 | Snapshot do widget vai para a versão 2: a virada do dia e o primeiro dia da semana passam a viajar dentro do arquivo. O headless não tem SQLite garantido, e sem isso o widget desenharia a semana de um jeito e o app de outro. Snapshot v1 é descartado — o app reescreve na primeira abertura. |
