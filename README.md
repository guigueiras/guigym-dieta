# GuiGym Dieta

App de controle de dietas e macronutrientes. React Native + Expo, funciona em iOS, Android e Web (PWA).

## Setup

```bash
npm install
npx expo start
```

Pressione `i` para iOS, `a` para Android, `w` para Web.

## Build PWA

```bash
npm run build:web
```

Saída em `dist/`. Servir com qualquer servidor estático. No iPhone, abra no Safari e use "Adicionar à Tela de Início".

## Stack

| Camada | Lib |
|---|---|
| Framework | Expo SDK 52 + Expo Router (file-based routing) |
| Linguagem | TypeScript strict |
| Estado | Zustand |
| Banco | expo-sqlite (SQLite local, 100% offline) |
| Animações | Reanimated 3 |
| Ícones | lucide-react-native |
| Bottom sheet | @gorhom/bottom-sheet |
| Drag & drop | react-native-draggable-flatlist |
| Gráficos | react-native-svg (anéis de progresso) |
| Safe area | react-native-safe-area-context |

## Funcionalidades

### Dietas e refeições
- Criar/editar/excluir dietas (nome + tipo)
- Refeições organizadas por dia da semana (seg–dom)
- Drag-and-drop para reordenar refeições
- Adicionar/editar/remover alimentos por refeição
- Macros (P/C/G/Kcal) calculados em tempo real por refeição e por dia

### Banco de alimentos
- CRUD de alimentos com proteína, carbo, gordura por 100g
- Suporte a unidades `g` e `ml`
- Fator de preparo (peso cru → cozido) e fator de compra (peso pronto → peso de compra)
- Categorias custom com cor e ícone
- Seed oficial com alimentos comuns pré-carregados

### Calculadora TDEE (wizard)
- Wizard em 4 etapas: dados pessoais → medidas corporais → nível de atividade → resultado
- Engine calcula BMR (Mifflin-St Jeor) + TDEE com multiplicadores de atividade
- Gera 9 combinações de alvos: 3 objetivos (cutting/manutenção/bulking) × 3 perfis de carbo (low/medium/high)
- Aplica os alvos diretamente na dieta selecionada
- Perfil do usuário salvo no banco e pré-preenchido ao reabrir o wizard

### Progresso de macros
- Footer "Total do Dia" com cartões por macro (Proteína / Gordura / Carbo / Calorias)
- Anéis de progresso animados com cores semafóricas:
  - Vermelho → < 50% ou > 115% do alvo
  - Amarelo → 50–84%
  - Verde → 85–115%
- Percentual exibido dentro do anel, atualizado em tempo real

### Lista de compras
- Gerada automaticamente a partir dos alimentos da dieta
- Agrupada por categoria
- Quantidades somadas usando fator de compra quando disponível
- Marcar itens como comprados (persiste por sessão)
- Compartilhar lista por texto (Share nativo / navigator.share / clipboard)

### Geral
- 100% offline — SQLite local, sem backend
- PWA instalável no iPhone via Safari
- Migrations automáticas na inicialização (v1–v6)

## Estrutura

```
app/
  (tabs)/
    index.tsx           → lista de dietas
    alimentos.tsx       → banco de alimentos
  dieta/
    [id]/
      index.tsx         → visualização da dieta por dia
      editar.tsx        → edição com drag-and-drop
    calculadora.tsx     → rota modal do wizard TDEE
  lista-compras/
    [dietaId].tsx       → lista de compras da dieta

src/
  components/
    alimento/           → cards, formulários, inputs de alimento
    dieta/              → list item, modal nova dieta
    lista-compras/      → grupos e itens da lista
    refeicao/           → cards, macros bar, anel de progresso, footer
    ui/                 → primitivos reutilizáveis (Button, Modal, Toast, etc.)

  features/
    tdee-wizard/
      components/       → WizardContainer, steps, inputs, resultados
      hooks/            → useWizardCalculation
      stores/           → useTdeeWizardStore (draft + cálculo)

  stores/
    useDietasStore.ts         → dietas + refeições + alimentos (estado global)
    useAlimentosStore.ts      → banco de alimentos
    useEditDietaStore.ts      → estado de edição com undo/redo
    useListaComprasUIStore.ts → itens marcados como comprados
    useUserProfileStore.ts    → perfil do usuário (sexo, idade, peso, altura, atividade)

  db/
    schema.ts           → CREATE TABLE statements (7 tabelas)
    migrations.ts       → migrations v1–v6 (idempotentes)
    database.ts         → singleton da conexão SQLite
    seed.ts             → seed de alimentos na primeira abertura
    baseAlimentos.ts    → dados do seed v2
    repositories/
      alimentosRepo.ts  → CRUD de alimentos
      dietasRepo.ts     → CRUD de dietas + refeições
      editDietaRepo.ts  → operações de edição atômica
      userProfileRepo.ts→ single-row do perfil do usuário

  utils/
    tdee/               → engine de cálculo (BMR, TDEE, macros, targets)
    macros.ts           → calcMacros, somarMacros
    listaCompras.ts     → geração da lista de compras
    format.ts           → formatação de números
    haptics.ts          → feedback tátil
    text.ts             → helpers de string

  types/
    dieta.ts            → Dieta, DiaSemana, DietTargets, etc.
    alimento.ts         → Alimento
    refeicao.ts         → Refeicao, AlimentoRefeicao
    userProfile.ts      → UserProfile
    index.ts            → re-exports

  theme/
    colors.ts           → paleta, spacing, radii

  constants/
    categorias.ts       → categorias de alimentos
    index.ts            → dias da semana, tipos de dieta

  hooks/
    useCategorias.ts         → hook de categorias (built-in + custom)
    useListaCompras.ts       → gera lista de compras reativa
    useElementHeight.ts      → mede altura de elementos
    useUnsavedChangesGuard.ts→ guard de navegação com mudanças não salvas

  services/
    share.ts            → share nativo / clipboard
    pdf.ts              → exportação PDF

public/                 → manifest PWA, ícones
```

## Banco de dados

7 tabelas SQLite, todas criadas com `IF NOT EXISTS` (safe em fresh install e migrations):

| Tabela | Descrição |
|---|---|
| `alimentos` | Banco de alimentos com macros por 100g |
| `dietas` | Dietas com targets opcionais de macro |
| `refeicoes` | Refeições vinculadas a dieta + dia da semana |
| `alimentos_refeicao` | Alimentos dentro de cada refeição (com quantidade) |
| `categorias_custom` | Categorias criadas pelo usuário |
| `meta` | Chave-valor interno (versão do schema, flags de seed) |
| `user_profile` | Single-row: perfil antropométrico do usuário |
