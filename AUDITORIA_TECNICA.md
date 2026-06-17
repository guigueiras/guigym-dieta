# Auditoria Técnica — GuiGym Dieta
> Gerada em 01/06/2026 — apenas leitura, nenhuma alteração foi feita.

---

## 1. Visão Geral

### O que o projeto faz atualmente
Aplicativo mobile (iOS/Android) e web (PWA) para planejamento de dieta semanal. O usuário cria dietas, organiza refeições por dia da semana, adiciona alimentos com quantidades e acompanha os macros. Também gera lista de compras consolidada com conversão de peso preparado → peso cru.

### Objetivo do produto
Ferramenta pessoal de acompanhamento nutricional focada em praticidade: montar a semana alimentar, calcular macros automaticamente e gerar a lista de compras de forma inteligente.

### Tecnologias utilizadas
| Camada | Tecnologia |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Roteamento | Expo Router (file-based) |
| Banco de dados | SQLite via `expo-sqlite` |
| Estado global | Zustand v5 |
| Linguagem | TypeScript 5 |
| Ícones | Lucide React Native |
| Animações | React Native Reanimated 4 |
| Drag-and-drop | react-native-draggable-flatlist |
| Sheets | @gorhom/bottom-sheet |
| Compartilhamento | expo-sharing + expo-clipboard |
| IDs | nanoid |
| Haptics | expo-haptics |

### Como a arquitetura está organizada
```
UI (app/ + src/components/)
       ↓
  Stores Zustand (src/stores/)
       ↓
  Repositories (src/db/repositories/)
       ↓
  SQLite (guigym.db)
```

A engine TDEE (`src/utils/tdee/`) é independente — funções puras sem I/O. A feature `tdee-wizard` tem sua própria store local e consome a engine.

---

## 2. Estrutura do Projeto

### `app/`
Rotas do Expo Router (file-based routing). Estrutura atual:
- `_layout.tsx` — root layout: inicializa DB, carrega stores, controla splash screen
- `(tabs)/` — tab bar com duas abas (Dietas, Alimentos)
- `(tabs)/index.tsx` — tela principal: lista de dietas
- `(tabs)/alimentos.tsx` — gestão do banco de alimentos
- `dieta/[id]/index.tsx` — visualização de uma dieta (modo leitura)
- `dieta/[id]/editar.tsx` — edição completa de uma dieta (modo edição)
- `lista-compras/[dietaId].tsx` — lista de compras gerada a partir de uma dieta

### `src/components/`
Componentes React Native divididos por domínio:
- `alimento/` — formulários, cards, inputs para alimentos (AdicionarAlimentoSheet, AlimentoFormModal, CategoriaSelect, ConversaoCompraField, etc.)
- `dieta/` — cards da lista de dietas, modal de criação/edição, menu de ações
- `refeicao/` — cards em modo view e edit, linha de alimento, macrobar, footer totais
- `lista-compras/` — cards de grupo por categoria, contador, linha de item
- `ui/` — componentes genéricos reutilizáveis (Button, SearchBar, Toast, Skeleton, Modal, etc.)

### `src/db/`
Toda a camada de persistência:
- `database.ts` — singleton de conexão SQLite (WAL mode, foreign keys ON)
- `schema.ts` — CREATE TABLE statements (source of truth do schema)
- `migrations.ts` — sistema de migrations versionado (5 versões)
- `seed.ts` — seed de alimentos base (executado uma vez)
- `baseAlimentos.ts` — dataset oficial de ~60 alimentos com macros e fatores de preparo
- `repositories/` — operações de banco organizadas por domínio

### `src/stores/`
Stores Zustand (estado global da aplicação):
- `useDietasStore.ts` — CRUD de dietas + gestão de targets nutricionais
- `useEditDietaStore.ts` — sessão de edição com dirty state tracking
- `useAlimentosStore.ts` — CRUD de alimentos
- `useListaComprasUIStore.ts` — estado UI da lista de compras (itens marcados)

### `src/db/repositories/`
- `alimentosRepo.ts` — CRUD completo de alimentos, validação de fator de preparo
- `dietasRepo.ts` — CRUD de dietas incluindo targets nutricionais, carrega toda a estrutura (refeições + alimentos) em batch
- `editDietaRepo.ts` — salva dieta completa em transação (delete-then-insert)

### `src/features/tdee-wizard/`
Feature encapsulada: calculadora TDEE interativa em wizard de 4 steps.
- `stores/useTdeeWizardStore.ts` — estado do wizard (draft, step, result, seleção)
- `hooks/useWizardCalculation.ts` — conecta store à engine, calcula deltas
- `components/WizardContainer.tsx` — container do wizard (chrome: header, progress, footer)
- `components/WizardFooter.tsx` — footer com navegação entre steps
- `components/WizardProgress.tsx` — barra de progresso dos steps
- `components/inputs/SexoToggle.tsx` — input de seleção de sexo (único input implementado)

### `src/utils/tdee/`
Engine de cálculo pura (sem I/O):
- `calculateBMR.ts` — Mifflin-St Jeor
- `calculateTDEE.ts` — BMR × multiplicador de atividade
- `calculateMacros.ts` — distribui kcal em P/C/G segundo perfil
- `calculateDietTargets.ts` — gera a matriz 3×3 (goals × perfis de carbo)
- `constants.ts` — multiplicadores, perfis de macro, ranges de validação
- `types.ts` — todos os tipos do domínio TDEE

### `src/utils/`
- `macros.ts` — `calcMacros()` e `somarMacros()` (cálculo por alimento e refeição)
- `listaCompras.ts` — `gerarListaCompras()`, `listaComprasParaTexto()` 
- `format.ts` — formatação de quantidades (g/kg, ml/L)
- `text.ts` — `matchTermo()` para busca
- `haptics.ts` — wrapper de feedback tátil

### `src/constants/`
- `categorias.ts` — enum de categorias, mapa de lookup, remapeamento de legados
- `index.ts` — DIAS_SEMANA, TIPOS_DIETA, REFEICOES_PADRAO

### `src/types/`
- `alimento.ts` — `Alimento`, `UnidadeMedida` + constants
- `refeicao.ts` — `Refeicao`, `AlimentoNaRefeicao`
- `dieta.ts` — `Dieta`, `DietTargets`, `TipoDieta`, helpers `hasTargets()`, `fromMacroTargets()`

### `src/services/`
- `pdf.ts` — template HTML da lista de compras + stub da geração de PDF
- `share.ts` — compartilhamento de texto (nativo + clipboard fallback web)

### `src/theme/`
- `colors.ts` — tokens de design (cores, radii, spacing)

### `src/hooks/`
- `useListaCompras.ts` — deriva lista de compras do estado (memo)
- `useUnsavedChangesGuard.ts` — bloqueia navegação com alterações não salvas
- `useElementHeight.ts` — mede altura de elemento para compensação de scroll
- `useCategorias.ts` — lista de categorias

---

## 3. Funcionalidades Implementadas

### Gestão de Dietas ✅ — Madura
**Arquivos principais:** `dietasRepo.ts`, `useDietasStore.ts`, `app/(tabs)/index.tsx`, `DietaListItem`, `NovaDietaModal`, `DietaActionsMenu`

O usuário pode criar, visualizar, editar (nome + tipo), excluir dietas. A lista tem busca por nome/tipo. Skeleton loading implementado. Cada dieta tem 7 dias da semana com refeições padrão pré-criadas (Café da manhã, Almoço, Café da tarde, Jantar).

### Gestão de Refeições ✅ — Madura
**Arquivos principais:** `useEditDietaStore.ts`, `RefeicaoCardEdit`, `RefeicaoCardView`, `AdicionarRefeicaoButton`, `RenomearRefeicaoModal`

Adicionar, remover, renomear e reordenar refeições via drag-and-drop (DraggableFlatList). Modo de edição com dirty state tracking e guard de navegação.

### Gestão de Alimentos ✅ — Madura
**Arquivos principais:** `alimentosRepo.ts`, `useAlimentosStore.ts`, `app/(tabs)/alimentos.tsx`, `AlimentoFormModal`, `AdicionarAlimentoSheet`

CRUD completo. Busca por nome. Categorias (7 tipos). Unidade de medida (g/ml). Macros por 100g. Fator de preparo (peso cru → preparado). Base pré-populada com ~60 alimentos.

### Cálculo de Macros ✅ — Maduro
**Arquivos principais:** `src/utils/macros.ts`, `MacrosBar`, `TotalDiaFooter`, `TotalDiaFooterEdit`

Cálculo automático de P/C/G/kcal por refeição e total do dia. Atômico e reativos ao estado.

### Lista de Compras ✅ — Madura
**Arquivos principais:** `src/utils/listaCompras.ts`, `app/lista-compras/[dietaId].tsx`, `GrupoCategoriaCard`, `ItemCompraLinha`, `ContadorListaCompras`

Geração automática consolidando todos os alimentos da semana. Conversão peso preparado → peso cru via fator de preparo. Agrupamento por categoria. Marcação de itens (estado UI em memória). Compartilhamento como texto.

### Compartilhamento de Lista ✅ — Funcional
**Arquivos principais:** `src/services/share.ts`, `listaComprasParaTexto()`

Share nativo no mobile. Clipboard fallback na web com alert.

### Engine TDEE ✅ — Completa e robusta
**Arquivos principais:** `src/utils/tdee/` (6 arquivos)

Implementação completa e bem estruturada (ver seção 8 para detalhes).

---

## 4. Funcionalidades Em Construção

### Wizard TDEE 🟡 — Backend completo, UI incompleta
**Estado:** store ✅, engine ✅, hook de cálculo ✅, chrome do wizard ✅ (header, progress, footer, SexoToggle). **Faltam:** componentes dos steps 1–4 com seus inputs reais (apenas SexoToggle existe como input). `WizardContainer` usa um `<StepPlaceholder>` temporário onde os steps deveriam renderizar.

**Crítico:** O wizard também **não está acessível por nenhuma rota**. Não há `app/wizard/` nem entrada no menu de dieta que navegue até ele. O `WizardContainer` recebe `dietaId` e `onDone` como props, mas nenhum componente de navegação o invoca.

**Também crítico:** Em `WizardContainer`, a linha que passa `canAdvance` para `WizardFooter` usa valor hardcoded `true` em vez de `canAdvance` da store:
```tsx
<WizardFooter canAdvance={true} ... />  // bug: deve ser canAdvance={canAdvance}
```

### Exibição de Targets na UI 🟡 — Persistência pronta, display ausente
**Estado:** targets são calculados, persistidos no banco e carregados na store corretamente. Mas nenhuma tela exibe essas metas. `DietaListItem` mostra apenas nome e tipo. A tela de visualização da dieta não exibe barra de progresso vs meta.

### Exportação PDF ❌ — Stub
**Estado:** Template HTML da lista de compras está 100% implementado (`htmlListaCompras()`). A função `gerarPdfListaCompras()` existe mas **joga erro intencionalmente** (`throw new Error('Funcionalidade PDF ainda não habilitada')`). As dependências `expo-print` e `expo-sharing` já estão no `package.json`. Comentário no código indica os próximos passos exatos.

### Categorias Customizadas ❌ — Schema órfão
**Estado:** Tabela `categorias_custom` existe no schema SQLite mas **zero código** a referencia fora da criação da tabela. Nenhum repository, store ou componente a utiliza.

---

## 5. Banco de Dados

### Schema atual (5 migrations)

```
alimentos
  id TEXT PK
  nome TEXT
  categoria TEXT              ← CategoriaId enum
  unidade TEXT (g | ml)
  proteina REAL
  carbo REAL
  gordura REAL
  fator_compra REAL nullable  ← adicionado na migration 3 (legado, substituído por fator_preparo)
  fator_preparo REAL nullable ← migration 4
  possui_fator INTEGER (0|1)  ← migration 4
  criado_em INTEGER

dietas
  id TEXT PK
  nome TEXT
  tipo TEXT                   ← TipoDieta enum
  criada_em INTEGER
  atualizada_em INTEGER
  target_calories REAL nullable   ← migration 5
  target_protein_g REAL nullable  ← migration 5
  target_carb_g REAL nullable     ← migration 5
  target_fat_g REAL nullable      ← migration 5
  target_goal TEXT nullable       ← migration 5
  target_carb_profile TEXT nullable ← migration 5

refeicoes
  id TEXT PK
  dieta_id TEXT FK → dietas(id) ON DELETE CASCADE
  dia TEXT CHECK IN (segunda..domingo)
  nome TEXT
  ordem INTEGER

alimentos_refeicao
  id TEXT PK
  refeicao_id TEXT FK → refeicoes(id) ON DELETE CASCADE
  alimento_id TEXT FK → alimentos(id) ON DELETE RESTRICT
  quantidade REAL
  ordem INTEGER

meta
  chave TEXT PK
  valor TEXT
  ← usado para: schema_version, seeded_v2

categorias_custom
  id TEXT PK
  label TEXT
  ordem INTEGER
  cor TEXT
  icone TEXT
  criada_em INTEGER
  ← TABELA ÓRFÃ: nenhum código a usa
```

### Relacionamentos
- Uma dieta tem N refeições por dia (até 7 dias × N refeições)
- Uma refeição tem N alimentos (via tabela de junção `alimentos_refeicao`)
- FK `alimentos_refeicao.alimento_id → alimentos.id` é RESTRICT — protege contra deleção de alimento em uso
- FK `refeicoes.dieta_id` é CASCADE — deletar dieta remove tudo em cascata

### Pontos de atenção
1. **`fator_compra`** (migration 3) foi supersedido por `fator_preparo` (migration 4). A coluna `fator_compra` ainda existe no schema mas nunca é lida — dead column. O repository não a popula nem lê.
2. **Carga em batch na `listAll()`**: carrega todas as dietas + refeições + itens em 3 queries. Eficiente para volumes pequenos; pode degradar com muitas dietas.
3. **WAL mode** e **foreign keys ON** configurados — boas práticas.
4. **Migrations idempotentes**: cada migration checa `PRAGMA table_info` antes de fazer ALTER TABLE.

---

## 6. Zustand — Stores e Fluxo de Dados

### `useDietasStore`
- **Estado:** `byId: Record<string, Dieta>`, `ids: string[]`, `loaded: boolean`
- **Responsabilidade:** CRUD de dietas e targets nutricionais. Inicializado no boot pelo root layout.
- **Selectors:** `useDieta(id)`, `useDietasFiltradas(termo)`, `useDietasLoaded()`, `useDietasActions()`
- **Nota:** método `upsertLocal()` existe para o `useEditDietaStore` sincronizar após salvar sem recarregar do banco.

### `useEditDietaStore`
- **Estado:** `dietaOriginal`, `dietaEditada`, `diaAtivo`, `isDirty`, `saving`
- **Responsabilidade:** sessão de edição de uma dieta. Mantém cópia isolada para edição sem afetar o estado principal até o salvamento.
- **Dirty tracking:** comparação profunda (`deepEqualDieta`) ao vivo após cada mutação.
- **Padrão:** ao salvar, chama `repo.salvarDietaCompleta()` (delete-then-insert em transação) e depois `useDietasStore.upsertLocal()`.

### `useAlimentosStore`
- **Estado:** `byId: Record<string, Alimento>`, `ids: string[]`, `loaded: boolean`, `ultimoCriadoId`
- **Responsabilidade:** CRUD de alimentos. Mantém ordenação alfabética em memória.
- **`ultimoCriadoId`:** permite que a tela de adicionar alimento à refeição role/selecione automaticamente o alimento recém-criado.

### `useListaComprasUIStore`
- **Estado:** `marcados: Record<dietaId, Set<alimentoId>>`
- **Responsabilidade:** estado puramente de UI — quais itens foram marcados como comprados. **Não persiste** — resetado ao fechar o app. Intencional (lista de compras é efêmera).

### `useTdeeWizardStore` (feature-local)
- **Estado:** `step`, `draft` (inputs em preenchimento), `result` (matriz 9 targets), `selectedGoal`, `selectedCarbProfile`
- **Responsabilidade:** estado do wizard TDEE. Totalmente separado das stores globais.
- **`buildUserStats()`:** método que valida se o draft está completo e retorna `UserStats` ou `null`.

### Fluxo de dados geral
```
Boot
  └→ getDatabase() → migrations → seed
  └→ useDietasStore.loadAll() ─┐
  └→ useAlimentosStore.loadAll() ┘ (paralelo)

Usuário edita dieta
  └→ useEditDietaStore.iniciar(dieta)  [clone da dieta]
  └→ mutações locais → isDirty = true
  └→ .salvar() → editDietaRepo.salvarDietaCompleta() → useDietasStore.upsertLocal()

Usuário vê lista de compras
  └→ useListaCompras(dietaId) → gerarListaCompras(dieta, alimentosBase)
                                 (derivado por useMemo, sem I/O)
```

---

## 7. Fluxo Principal do Usuário

### Criar uma dieta
1. Tela "Minhas Dietas" (`app/(tabs)/index.tsx`)
2. Botão "Nova Dieta" → `NovaDietaModal`
3. Preenche nome e tipo
4. `useDietasStore.criar()` → `dietasRepo.criar()` → insere dieta + 4 refeições padrão para cada um dos 7 dias (28 refeições em uma transação)
5. Dieta aparece no topo da lista

### Editar uma dieta (adicionar alimentos)
1. Tap na dieta → `app/dieta/[id]/index.tsx` (modo leitura)
2. Botão de lápis → `app/dieta/[id]/editar.tsx`
3. `useEditDietaStore.iniciar(dieta)` clona a dieta
4. Usuário navega entre dias via `DiasTabs`
5. Em cada refeição: tap no "+" → `AdicionarAlimentoSheet`
6. Busca alimento na lista → seleciona → digita quantidade → confirma
7. `useEditDietaStore.addAlimentoNaRefeicao()` atualiza estado local → `isDirty = true`
8. Botão "Salvar" → `editDietaRepo.salvarDietaCompleta()` (full replace em transação)
9. `useDietasStore.upsertLocal()` sincroniza com store global

### Alimentos
- Tab "Alimentos": lista com busca e filtro
- Botão "+" → `AlimentoFormModal`: nome, categoria, unidade, macros por 100g, fator de preparo opcional
- CRUD completo; deleção bloqueada se alimento está em uso (RESTRICT na FK)

### Lista de Compras
1. Na tela de visualização da dieta → botão carrinho → `app/lista-compras/[dietaId].tsx`
2. `useListaCompras(dietaId)` computa `gerarListaCompras()` via `useMemo`
3. Soma todas as quantidades de todos os dias da semana por alimento
4. Converte peso preparado → peso cru usando `fatorPreparo` (quando disponível)
5. Agrupa por categoria (ordem fixa: carnes, vegetais, frutas, carboidratos, laticínios, gorduras, molhos)
6. Usuário pode marcar itens (sem persistência)
7. Botão compartilhar → texto formatado via `Share.share()` ou clipboard

---

## 8. Engine TDEE

### O que foi implementado ✅

A engine é **completa e bem projetada** — funções puras, retorno `Result<T>` (sem exceções), validações em camadas.

**Pipeline de cálculo:**
```
UserStats (sex, age, weightKg, heightCm, activityLevel)
  ↓ calculateBMR()    → Mifflin-St Jeor → kcal/dia em repouso
  ↓ calculateTDEE()   → BMR × PAL multiplier → gasto total diário
  ↓ calculateDietTargets() → para cada Goal × CarbProfile:
       calculateMacros(kcalAlvo, carbProfile) → { kcal, proteinG, carbG, fatG }
  → DietTargetsSet: matriz 3×3 (9 targets)
```

**Goals:** `cutting` (-20%), `maintenance` (0%), `bulking` (+10%)  
**CarbProfiles:** `low_carb` (40P/40F/20C), `medium_carb` (30P/35F/35C), `high_carb` (30P/20F/50C)  
**Floor mínimo:** 800 kcal (nunca retorna target abaixo disso)  
**Arredondamento:** carbo absorve drift; kcal retornado é o realizado (soma dos macros arredondados)

**Validações:**
- Sexo: `male | female`
- Idade: inteiro entre 14 e 100
- Peso: 30–300 kg
- Altura: 100–250 cm
- BF%: 3–60 (campo opcional, aceito mas não usado nos cálculos ainda)
- Invariante em boot: soma dos perfis de macro deve dar 100% (±0.001)

**Tipos persistidos:**
- `DietTargets` (em `types/dieta.ts`) é o shape persistido no banco — difere de `MacroTargets` da engine apenas no nome `kcal → calories`
- `fromMacroTargets()` faz a conversão

### O que está integrado ✅
- Engine → `useTdeeWizardStore` → `useWizardCalculation` hook
- `atualizarTargets()` no repo → `useDietasStore.setTargets()` → persistência no banco
- `DietTargets` carregado nas dietas via `extractTargetsFromRow()` no `listAll()`

### O que ainda falta ❌
1. **Steps do wizard sem UI**: apenas `SexoToggle` (step 1 parcial) existe. Os steps de peso/altura, nível de atividade e resultado final não têm componentes
2. **Wizard sem rota**: não existe `app/tdee-wizard/` nem botão que navegue até ele
3. **Bug no WizardContainer**: `canAdvance` hardcoded como `true` (o hook `useCanAdvance` é importado mas não passado para `WizardFooter`)
4. **Targets não exibidos**: dieta com meta não mostra nada diferente de uma sem meta na UI
5. **`bodyFatPct` não coletado**: campo existe nos tipos e validações da engine, mas o wizard não tem input para ele

### Arquivos da engine
```
src/utils/tdee/
  ├── types.ts                 ← tipos do domínio
  ├── constants.ts             ← multiplicadores, perfis, ranges, validação invariante
  ├── calculateBMR.ts          ← Mifflin-St Jeor + validateUserStats
  ├── calculateTDEE.ts         ← BMR × PAL
  ├── calculateMacros.ts       ← distribuição P/C/G + rounding strategy
  ├── calculateDietTargets.ts  ← orquestração: gera matriz 3×3
  └── index.ts                 ← superfície pública

src/features/tdee-wizard/
  ├── stores/useTdeeWizardStore.ts    ← estado do wizard + validação por step
  ├── hooks/useWizardCalculation.ts   ← conecta store → engine
  └── components/
        ├── WizardContainer.tsx       ← chrome (parcial — steps são placeholders)
        ├── WizardFooter.tsx          ← footer com navegação
        ├── WizardProgress.tsx        ← barra de progresso
        └── inputs/SexoToggle.tsx     ← único input implementado
```

---

## 9. Débitos Técnicos

### Alta Prioridade

**DT-01 — WizardContainer: `canAdvance` hardcoded**
`WizardContainer.tsx` line ~149: `<WizardFooter canAdvance={true} ...>` em vez de `canAdvance={canAdvance}`. O hook `useCanAdvance()` é importado mas não usado. Resultado: botão "Continuar" nunca fica desabilitado, permitindo avançar sem preencher os campos.

**DT-02 — Wizard sem rota nem entry point**
`WizardContainer` existe mas não é acessível por nenhuma rota do app. A feature está 100% isolada. Nenhum `app/wizard/` ou botão na UI navega até ela.

**DT-03 — Steps do wizard são placeholders**
`WizardContainer` renderiza `<StepPlaceholder step={step} />` para todos os 4 steps em vez dos componentes reais. Apenas `SexoToggle` existe como componente de input.

**DT-04 — Targets calculados mas nunca exibidos**
O banco armazena metas. A store carrega metas. Mas zero componentes exibem isso. Um usuário que usar o wizard (quando funcionar) não verá nenhuma diferença visual na dieta.

**DT-05 — PDF stub com `throw`**
`gerarPdfListaCompras()` joga erro intencionalmente. Se alguma UI chamar isso, o app vai crashar. O botão de PDF provavelmente não está exposto, mas é um risco se alguém conectar.

### Média Prioridade

**DT-06 — Coluna `fator_compra` dead**
Migration 3 adicionou `fator_compra`. Migration 4 adicionou `fator_preparo` com semântica diferente. A coluna `fator_compra` ainda existe no schema mas nunca é lida ou escrita pelo código atual. Dead column.

**DT-07 — `categorias_custom` tabela órfã**
Tabela existe no schema mas não há repository, store ou componente que a use. Funcionalidade de categorias customizadas não foi implementada além da criação da tabela.

**DT-08 — `renomear()` em dietasRepo faz re-fetch total**
Após o UPDATE, chama `listAll()` para retornar a dieta atualizada. Re-carrega todas as dietas, refeições e itens só para retornar um objeto. Deveria fazer SELECT pontual ou reconstruir o objeto localmente.

**DT-09 — `bodyFatPct` na engine sem suporte no wizard**
O campo `bodyFatPct` em `UserStats` é validado na engine (range 3–60) mas o wizard não coleta esse dado. A engine menciona "quando presente, prioriza-se LBM pra proteína" mas esse cálculo não está implementado (`calculateMacros` usa apenas percentuais fixos dos perfis, sem LBM).

**DT-10 — Sem testes**
Nenhum arquivo de teste encontrado. A engine TDEE é especialmente adequada para testes unitários (funções puras). As migrations são candidatas a testes de integração.

### Baixa Prioridade

**DT-11 — `TipoDieta` duplicado conceitualmente com `Goal`**
`TipoDieta` ('Ganho de massa', 'Perda de gordura', 'Manutenção', 'Definição') é semelhante a `Goal` ('bulking', 'maintenance', 'cutting') mas são tipos completamente separados. Não há mapeamento entre eles. Quando o wizard aplicar targets, a dieta pode ter `tipo: 'Perda de gordura'` mas `target_goal: 'maintenance'` — inconsistência semântica.

**DT-12 — Lista de compras não persiste estado de marcação**
`useListaComprasUIStore` usa `Set` em memória — reseta ao fechar o app. Para uso real, seria esperado persistência (SQLite ou AsyncStorage).

**DT-13 — Nenhuma validação de quantidade no `addAlimentoNaRefeicao`**
A store aceita qualquer valor numérico (incluindo 0 ou negativo) sem validação. O componente de input tem validação visual, mas a store não tem guard.

**DT-14 — `+html.tsx` sem customização relevante**
Existe mas provavelmente é o boilerplate do Expo Router para a versão web.

---

## 10. Roadmap Recomendado

Baseado no estado atual, em ordem de impacto e dependência:

### Fase 1 — Completar o Wizard TDEE (maior valor pendente)
1. **Criar os inputs dos steps faltantes** (Step 1 restante: idade; Step 2: peso/altura; Step 3: nível de atividade; Step 4: exibição de resultado + seleção de goal/carb profile)
2. **Conectar os steps ao WizardContainer** (substituir `StepPlaceholder`)
3. **Corrigir o bug `canAdvance`** no WizardContainer
4. **Criar rota e entry point** — botão "Calcular meta" na tela de dieta ou no menu de ações

*Justificativa: toda a infraestrutura (engine, store, hook, persistência) está pronta. É a funcionalidade de maior impacto com menor esforço restante.*

### Fase 2 — Exibir Targets na UI
5. **`DietaListItem`** — badge ou subtítulo mostrando se tem meta configurada e qual objetivo
6. **Tela de visualização da dieta** — barra de progresso real vs meta (kcal, P, C, G do dia vs targets)
7. **Remover meta** — opção no menu de ações da dieta

*Justificativa: sem isso, o wizard não tem feedback visível de que funcionou.*

### Fase 3 — PDF e Exportação
8. **Habilitar `gerarPdfListaCompras()`** — descomentar o código existente nos comentários do arquivo, integrar `expo-print`
9. **Botão de PDF** na tela da lista de compras

*Justificativa: código pronto, só falta a conexão final.*

### Fase 4 — Refinamentos e Polimento
10. **Persistência da lista de compras** — salvar itens marcados em SQLite ou AsyncStorage
11. **Corrigir dead column `fator_compra`** — não é urgente mas polui o schema
12. **Otimizar `renomear()`** — SELECT pontual em vez de re-fetch total
13. **Mapeamento `TipoDieta ↔ Goal`** — alinhar semanticamente ou documentar a separação intencional

### Fase 5 — Testes
14. **Testes unitários da engine TDEE** — `calculateBMR`, `calculateMacros`, `calculateDietTargets` com edge cases
15. **Testes de migrations** — garantir idempotência e consistência de dados

---

## 11. Resumo Executivo

### O que já está pronto ✅
- Gestão completa de dietas (criar, editar, excluir, visualizar)
- Gestão de refeições com drag-and-drop por dia da semana
- Banco de alimentos com CRUD, categorias e fator de preparo
- Cálculo automático de macros por refeição e total diário
- Lista de compras gerada automaticamente com conversão cru ↔ preparado
- Compartilhamento da lista como texto (nativo e web)
- Engine TDEE completa: BMR, TDEE, macros distribuídos, 9 combinações (3 goals × 3 perfis)
- Persistência dos targets nutricionais no banco (schema + migrations + repo + store)
- Infraestrutura do wizard: store, hook de cálculo, chrome de navegação

### O que está em construção 🟡
- Wizard TDEE: infraestrutura pronta, mas os 4 steps não têm UI completa e o wizard não está acessível por nenhuma rota
- Exibição de targets: dados persistidos corretamente mas não renderizados em nenhuma tela

### O que falta para um MVP sólido
1. Completar os steps do wizard (estimativa: 3–4 componentes de input)
2. Criar rota/entry point para o wizard
3. Corrigir bug `canAdvance` no WizardContainer
4. Exibir targets na visualização da dieta (barra de progresso vs meta)

### O que falta para uma versão pública
- Tudo do MVP acima
- PDF da lista de compras (código quase pronto)
- Persistência do estado da lista de compras
- Cobertura mínima de testes (especialmente engine TDEE)
- Revisão de UX: o tipo da dieta e o goal do wizard são conceitualmente redundantes mas não mapeados
- Testes em dispositivos reais (iOS e Android) antes de publicar nas stores
- Configuração de EAS Build (já tem `eas.json` e `projectId` configurados — infraestrutura de deploy pronta)
