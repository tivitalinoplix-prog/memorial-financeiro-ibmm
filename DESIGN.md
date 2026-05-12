# Memorial Financeiro IBMM — Design System v5.0

## Overview

**Quiet Luxury × Neo-Brutalism** — Um design system dark-first para gestão financeira eclesiástica. Combina a sobriedade de dashboards financeiros premium (deep navy, precisão numérica, hierarquia tipográfica) com toques brutalistas (bordas afiadas, contraste alto, tipografia mono-espaçada). Projetado para sessões longas de auditoria, leitura de relatórios e operação por gestores não-técnicos em mobile e desktop.

Fusão curada de: **Midnight Banking Dashboard** (paleta dark navy + gradientes), **Prismatic Pay** (tipografia premium + componentes) e **identidade original IBMM** (teal accent, bordas afiadas, estética institucional).

---

## Colors (Light Mode)
- Page Background: #FFFFFF
- Surface Default: #FFFFFF
- Card Background: #FFFFFF
- Card Background Hover: #F4F4F5
- Surface Elevated: #FFFFFF
- Text Primary: #09090B
- Text Secondary: #52525B
- Text Muted: #71717A
- Text Ghost: #A1A1AA
- Border Default: #E4E4E7
- Border Hover: #D4D4D8
- Border Accent: #A1A1AA

## Colors (Dark Mode)
- Page Background: #09090B
- Surface Default: #18181B
- Card Background: #1C1C22
- Card Background Hover: #27272A
- Surface Elevated: #2A2A32
- Text Primary: #FAFAFA
- Text Secondary: #A1A1AA
- Text Muted: #71717A
- Text Ghost: #52525B
- Border Default: #27272A
- Border Hover: #3F3F46
- Border Accent: #52525B

## Colors (Shared / Accent)
- Primary: #14B8A6
- Primary Hover: #2DD4BF
- Positive: #34D399
- Negative: #FB7185
- Warning: #FBBF24
- Info: #38BDF8

---

## Typography

### Font Stack
- **Heading Font**: `"Geist Sans", "Inter", -apple-system, sans-serif`
- **Body Font**: `"Inter", -apple-system, system-ui, sans-serif`
- **Mono Font**: `"JetBrains Mono", "Geist Mono", "Fira Code", monospace`

### Type Scale
- **Display**: Geist Sans 28px/1.2, weight 800, tracking -0.03em — KPIs hero, saldo total
- **H1 / Page Title**: Geist Sans 18px/1.25, weight 700, tracking -0.02em — título de seção
- **H2 / Section**: Geist Sans 13px/1.3, weight 700, tracking 0 — cabeçalho de card, subtítulos
- **Body**: Inter 13px/1.5, weight 400 — texto padrão, descrições
- **Body Small**: Inter 11px/1.4, weight 400 — captions, timestamps
- **Label**: Inter 10px/1.3, weight 700, uppercase, tracking 0.08em — rótulos de métricas, tags
- **Mono Value**: JetBrains Mono 14px/1.4, weight 500 — valores monetários, CNPJs, percentuais
- **Mono Small**: JetBrains Mono 11px/1.3, weight 400 — dados tabulares, IDs

### Regras Tipográficas
- Valores monetários SEMPRE em `Mono Value` para alinhamento tabular
- Labels de métricas SEMPRE em `Label` (uppercase, tracking largo, ghost color)
- Nunca usar mais de 2 tamanhos tipográficos no mesmo card

---

## Spacing

Base unit: **4px** (half-grid brutalista)

| Token | Valor | Uso |
|-------|-------|-----|
| xs | 2px | Inline icon gaps, micro-padding |
| sm | 4px | Gap entre elementos adjacentes mínimos |
| md | 8px | Padding interno de badges, gap entre rows |
| lg | 12px | Padding de cards compactos, gap de grid |
| xl | 16px | Padding padrão de cards, gap entre seções |
| 2xl | 20px | Margem de página lateral, gap entre colunas |
| 3xl | 24px | Separação entre seções maiores |
| 4xl | 32px | Breaks visuais entre módulos |

---

## Border Radius

**REGRA BRUTALISTA: bordas afiadas por padrão.**

| Token | Valor | Uso |
|-------|-------|-----|
| none | 0px | Cards, buttons, inputs, tiles — PADRÃO |
| xs | 2px | Badges de status, chips pequenos |
| sm | 4px | Tooltips, dropdowns |
| full | 9999px | Apenas avatares e progress-bar tracks |

**Exceção:** Gradient cards hero podem usar 2px para diferenciação sutil.

---

## Elevation

Sistema de sombras escuro — sem sombras visíveis por padrão (brutalista). Diferenciação por cor de superfície.

- **Level 0**: Sem sombra — estado padrão (separação por cor de fundo)
- **Level 1** (`0 1px 3px rgba(0,0,0,0.3)`): Dropdowns, tooltips — apenas quando flutuando
- **Level 2** (`0 4px 16px rgba(0,0,0,0.4)`): Modais, drawers
- **Glow Teal** (`0 0 20px rgba(20,184,166,0.15)`): Destaque de card ativo/selecionado
- **Glow Rose** (`0 0 20px rgba(251,113,133,0.15)`): Alerta de card crítico

---

## Components

### Sidebar
- **Width**: 220px (desktop), colapsável para 64px
- **Background**: `--surface-default` (#18181B)
- **Border Right**: 1px `--border-default`
- **Nav Items**: 40px height, 12px horizontal padding, 0px radius
- **Active State**: border-left 2px `--primary`, background `--primary-muted`, text `--primary`
- **Inactive State**: text `--text-secondary`, hover → text `--text-primary`
- **Footer**: versão do app em `Mono Small`, logo IBM
- **Mobile**: drawer full-height com overlay `rgba(0,0,0,0.6)`

### KPI Card
- **Background**: `--card-bg` (#1C1C22)
- **Border**: 1px `--border-default`, 0px radius
- **Padding**: 16px
- **Hover**: border → `--border-hover`
- **Anatomy**:
  - Label top: `Label` style (10px, uppercase, ghost color)
  - Value: `Display` ou `Mono Value` — `--text-primary`
  - Delta (opcional): `Body Small` em `--positive` ou `--negative` com seta ↑↓
  - Sparkline (opcional): 40px height, stroke `--primary`, no fill

### Transaction Row
- **Background**: `--card-bg`
- **Border**: 1px `--border-default`, 0px radius
- **Padding**: 12px 16px
- **Hover**: background → `--card-bg-hover`
- **Layout** (left → right):
  - Status indicator: 3px vertical bar left (green/red/amber)
  - Center stack: Description (`Body`, white) + Source/Date (`Body Small`, secondary)
  - Right stack: Amount (`Mono Value`, color by sign) + Category (`Body Small`, ghost)

### Export Toolbar
- **Layout**: flex row, gap 4px
- **Button Style**: 24px height, padding 4px 8px, background transparent, border 1px `--border-default`
- **Icon**: 12px, `--text-ghost`
- **Hover**: background `--card-bg`, border `--border-hover`
- **Variants**: PDF (rose icon), Excel (emerald icon), PNG (sky icon)

### Modal / Drawer
- **Background**: `--surface-elevated`
- **Border**: 1px `--border-default`, 0px radius
- **Overlay**: `rgba(0,0,0,0.7)` com blur 4px
- **Header**: border-bottom 1px `--border-default`, padding 16px
- **Shadow**: Level 2
- **Animation**: slide-up 200ms ease-out (mobile), fade-in 150ms (desktop)

### Badge / Status
- **Padding**: 2px 8px
- **Radius**: 2px (brutalista)
- **Font**: `Label` style
- **Variants**:
  - Aprovado: bg `--positive/15%`, text `--positive`
  - Pendente: bg `--warning/15%`, text `--warning`
  - Rejeitado: bg `--negative/15%`, text `--negative`
  - Info: bg `--info/15%`, text `--info`
  - Neutro: bg `--card-bg-hover`, text `--text-secondary`

### Chart / Graph
- **Background**: transparent (herda do card)
- **Grid Lines**: `--border-default` com 50% opacity
- **Axis Text**: `Mono Small`, `--text-ghost`
- **Tooltip**: `--surface-elevated`, border 1px `--border-default`, 4px radius
- **Colors** (série de dados): `--primary`, `--positive`, `--negative`, `--warning`, `--info`, `#A78BFA`
- **Area Fill**: cor da série com 10% opacity

### Input / Search
- **Height**: 32px
- **Background**: `--surface-default`
- **Border**: 1px `--border-default`, 0px radius
- **Font**: `Body`, `--text-secondary`
- **Focus**: border `--primary`, ring 0 0 0 2px `--primary-glow`
- **Placeholder**: `--text-ghost`

---

## Animations

### Micro-interactions
- **Hover transition**: all 150ms ease — background, border, color
- **Button press**: transform scale(0.98) 100ms
- **Card entrance**: opacity 0→1, translateY 8px→0, 200ms ease-out, stagger 50ms
- **Number counter**: CountUp 800ms ease-out (valores monetários no dashboard)
- **Pulse**: opacity 1→0.5→1, 2s infinite — indicadores de "processando"

### Page Transitions
- **Tab switch**: opacity 0→1, 150ms ease-in
- **Modal open**: opacity 0→1 + translateY 16px→0, 200ms ease-out
- **Drawer open**: translateX 100%→0, 250ms ease-out

### Skeleton Loading
- **Background**: linear-gradient(90deg, #1C1C22, #27272A, #1C1C22)
- **Animation**: shimmer 1.5s infinite

---

## Layout

### Breakpoints
- **Mobile**: < 768px — sidebar drawer, cards empilhados, KPIs 2 colunas
- **Tablet**: 768px–1024px — sidebar colapsada, KPIs 3 colunas
- **Desktop**: > 1024px — sidebar expandida, KPIs 4 colunas, tabelas full-width

### Grid
- **Dashboard**: sidebar 220px + main content fluid
- **KPI Grid**: `grid-cols-2 lg:grid-cols-4`, gap 12px
- **Card Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, gap 12px
- **Table**: full-width, sticky header, virtual scroll para > 100 rows

### Container
- **Max-width**: 1200px (desktop)
- **Page Padding**: 20px (desktop), 12px (mobile)

---

## Do's and Don'ts

### ✅ DO
1. Manter fundo `--page-bg` (#09090B) como o tom mais escuro — superfícies sobem em escalas de zinc
2. Usar JetBrains Mono para TODOS os valores monetários, CNPJs e percentuais
3. Reservar gradientes para no máximo 2 elementos hero por viewport
4. Colorir valores monetários: verde para entradas, rose para saídas — tanto no texto quanto no indicador lateral
5. Manter 0px de border-radius em cards e botões (identidade brutalista)
6. Usar borders (não sombras) para separar componentes — sombras só em overlays
7. Garantir que TODA interação tenha feedback visual (hover, active, focus)
8. Testar cada tela em viewport 375px (mobile do pastor)

### ❌ DON'T
1. Nunca usar #FFFFFF puro para texto de corpo — usar `--text-secondary` (#A1A1AA), reservar branco puro para títulos e valores
2. Nunca adicionar border-radius > 4px em cards e botões (quebra a identidade brutalista)
3. Nunca usar mais de 3 gradientes diferentes no mesmo viewport
4. Nunca usar cores saturadas fora da paleta (neon, pastéis) — a premium feel depende de disciplina cromática
5. Nunca usar sombras em cards no dark mode — diferenciação vem de background-color stepping
6. Nunca misturar fontes além do trio definido (Geist Sans / Inter / JetBrains Mono)

---

## Referências

- [Midnight Banking Dashboard](https://designmd.ai/nswamy14/midnight-banking-dashboard) — paleta navy, gradientes, componentes bancários
- [Prismatic Pay](https://designmd.ai/chef/prismatic-pay) — tipografia premium, componentes fintech, espaçamento
- [Violet Issue](https://designmd.ai/chef/violet-issue) — densidade informacional, dark mode, developer UX
