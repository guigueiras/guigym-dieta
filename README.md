# GuiGym Dieta

App de controle de dietas, refeições e lista de compras. React Native + Expo, funciona em iOS, Android e Web (PWA).

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

- Expo SDK 52 + Expo Router
- TypeScript
- Zustand (estado)
- expo-sqlite (persistência)
- Reanimated 3 (animações)
- @gorhom/bottom-sheet
- react-native-draggable-flatlist
- lucide-react-native (ícones)

## Estrutura

```
app/                  → rotas (Expo Router)
src/components/       → componentes UI
src/stores/           → stores Zustand
src/db/               → SQLite (schema, migrations, repos, seed)
src/hooks/            → hooks custom
src/services/         → share, pdf
src/utils/            → format, macros, listaCompras, text, haptics
src/theme/            → cores, spacing, radii
src/constants/        → categorias, dias, tipos de dieta
src/types/            → tipos TypeScript
public/               → manifest PWA, ícones
```

## Funcionalidades

- Criar/editar/excluir dietas
- Organizar refeições por dia da semana
- Drag-and-drop de refeições
- Adicionar alimentos com macros (P/C/G/Calorias) calculados em tempo real
- Banco de alimentos próprio (CRUD)
- Suporte a unidades `g` e `ml`
- Lista de compras agrupada por categoria
- Marcar itens comprados (persiste por sessão)
- Compartilhar lista por texto (Share nativo / navigator.share / clipboard)
- Funciona 100% offline
- PWA instalável no iPhone
