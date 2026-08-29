# FieldOps — Plataforma de Inspeção em Campo

MVP inicial do painel administrativo FieldOps.

## O que já existe

- Dashboard operacional responsivo
- Sidebar e topbar
- Light/Dark mode
- Indicadores e gráficos com Recharts
- Lista de inspeções
- Detalhamento de inspeção
- Fluxo de aprovação/reprovação em memória
- Módulos-base para clientes, locais, equipamentos, modelos, auditoria etc.
- Estrutura React + TypeScript + Vite
- Componentes preparados para evolução com Supabase

## Rodar localmente

Requisitos: Node.js 20+.

```bash
npm install
npm run dev
```

Depois abra o endereço mostrado pelo Vite.

## Próxima etapa

Conectar Supabase/PostgreSQL, autenticação, RLS, CRUDs, storage de evidências e sincronização offline do aplicativo mobile.
